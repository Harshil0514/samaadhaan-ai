import { GoogleGenAI, Type } from '@google/genai';
import {
  AIAnalysis,
  Institution,
  InstitutionRecommendation,
  PriorityBreakdown,
  Problem,
  SolutionDirection,
  UrgencyLevel
} from '../src/types';
import { db } from './db';

// Initialize Gemini Client safely if API key exists
let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (geminiClient) return geminiClient;
  const key = process.env.GEMINI_API_KEY;
  if (key && key !== 'MY_GEMINI_API_KEY' && key.length > 5) {
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

// Category keyword dictionary for deterministic NLP fallback
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Water Management': ['water', 'shortage', 'drinking', 'pipeline', 'leakage', 'groundwater', 'tank', 'salinity', 'borewell', 'fluoride', 'tanker', 'tap', 'flood', 'reservoir', 'aquifer', 'tubewell', 'purification', 'drainage', 'supply', 'taps'],
  'Sanitation': ['garbage', 'waste', 'sewage', 'drainage', 'toilet', 'cleanliness', 'stench', 'trash', 'dump', 'plastic', 'debris', 'litter', 'compactor', 'smell', 'mosquito', 'drain', 'overflow', 'dumping', 'filth'],
  'Agriculture': ['crop', 'farmer', 'irrigation', 'soil', 'pest', 'harvest', 'canal', 'farm', 'mandi', 'cold storage', 'seeds', 'fertilizer', 'drip', 'wheat', 'tomato', 'paddy', 'tubewell', 'agriculture', 'rural'],
  'Healthcare': ['hospital', 'doctor', 'medicine', 'disease', 'clinic', 'phc', 'vaccine', 'dengue', 'malaria', 'patient', 'ambulance', 'epidemic', 'health', 'fever', 'medical', 'immunization', 'dispensary', 'infection'],
  'Education': ['school', 'student', 'classroom', 'teacher', 'education', 'college', 'books', 'lab', 'playground', 'mid-day meal', 'pupil', 'class', 'blackboard', 'study', 'children', 'campus'],
  'Environment': ['pollution', 'tree', 'air', 'river', 'plastic', 'climate', 'emission', 'toxic', 'smog', 'smoke', 'ecology', 'deforestation', 'runoff', 'stubble', 'environmental', 'green', 'effluent'],
  'Infrastructure': ['road', 'pothole', 'bridge', 'culvert', 'flyover', 'asphalt', 'pavement', 'structural', 'collapsed', 'streetlighting', 'pier', 'concrete', 'highway', 'crossing', 'spalling'],
  'Accessibility': ['disabled', 'wheelchair', 'ramp', 'tactile', 'braille', 'elevator', 'elderly', 'vision', 'barrier', 'pedestrian', 'senior', 'handicap', 'stairs', 'footbridge', 'impaired'],
  'Public Services': ['electricity', 'transformer', 'blackout', 'transport', 'bus', 'welfare', 'streetlights', 'ration', 'siren', 'lighting', 'power cut', 'meter', 'darkness', 'commute', 'municipal'],
  'Rural Development': ['village', 'rural', 'hamlet', 'artisan', 'tribal', 'livelihood', 'connectivity', 'well', 'off-grid', 'weaver', 'remote', 'forest', 'panchayat', 'craftsman', 'cottage'],
  'Energy': ['solar', 'power', 'transformer', 'grid', 'voltage', 'electric', 'renewable', 'microgrid', 'battery', 'outage', 'electricity', 'photovoltaic', 'surge', 'wire', 'generator'],
  'Urban Development': ['traffic', 'parking', 'drainage', 'waterlogging', 'footbridge', 'urban', 'transit', 'pedestrian', 'sidewalk', 'underpass', 'congestion', 'metro', 'encroachment', 'stormwater']
};

const SEVERITY_HIGH_SIGNALS = [
  'critical', 'danger', 'death', 'casualty', 'infant', 'child', 'children', 'poison', 'toxic', 'hospital',
  'school', 'fire', 'electric', 'shock', 'disease', 'dengue', 'emergency', 'burst', 'collapse', 'outbreak',
  'contamination', 'fumes', 'ambulance', 'cut off', 'spoilage', 'bio-waste', 'fluoride'
];

// Distance calculation using Haversine formula (in km)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Text similarity using Jaccard token overlap + Levenshtein ratio
export function calculateTextSimilarity(text1: string, text2: string): number {
  const clean = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);

  const tokens1 = new Set(clean(text1));
  const tokens2 = new Set(clean(text2));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  tokens1.forEach(token => {
    if (tokens2.has(token)) intersection++;
  });

  const union = new Set([...tokens1, ...tokens2]).size;
  const jaccard = (intersection / union) * 100;

  // Check n-gram substring matches for key phrases (e.g., "mandore water shortage")
  const words1 = Array.from(tokens1);
  let phraseMatches = 0;
  for (let i = 0; i < words1.length - 1; i++) {
    const bigram = `${words1[i]} ${words1[i + 1]}`;
    if (text2.toLowerCase().includes(bigram)) phraseMatches += 15;
  }

  return Math.min(100, Math.round(jaccard * 0.7 + phraseMatches * 0.3));
}

// Duplicate detector engine (70% text + 30% location proximity)
export function detectDuplicates(
  newTitle: string,
  newDesc: string,
  lat: number,
  lng: number,
  existingProblems: Problem[],
  excludeId?: string
): {
  duplicateScore: number;
  similarProblems: { problem: Problem; similarityScore: number; distanceKm: number }[];
  recommendedClusterId?: string;
} {
  const results: { problem: Problem; similarityScore: number; distanceKm: number }[] = [];
  const fullText = `${newTitle} ${newDesc}`;

  for (const prob of existingProblems) {
    if (excludeId && prob.id === excludeId) continue;

    const probText = `${prob.title} ${prob.description}`;
    const textSim = calculateTextSimilarity(fullText, probText);
    const dist = calculateDistanceKm(lat, lng, prob.latitude, prob.longitude);

    // Location proximity score: 100 for <=0.5km, decreases gracefully up to 10km
    let locScore = 0;
    if (dist <= 0.5) locScore = 100;
    else if (dist <= 1.0) locScore = 90;
    else if (dist <= 2.5) locScore = 75;
    else if (dist <= 5.0) locScore = 50;
    else if (dist <= 10.0) locScore = 25;
    else locScore = 5;

    const finalSim = Math.round(textSim * 0.7 + locScore * 0.3);

    if (finalSim >= 40 || dist <= 2.0 && textSim >= 35) {
      results.push({
        problem: prob,
        similarityScore: finalSim,
        distanceKm: +dist.toFixed(2)
      });
    }
  }

  results.sort((a, b) => b.similarityScore - a.similarityScore);

  const topScore = results.length > 0 ? results[0].similarityScore : 0;
  const bestMatch = results.find(r => r.similarityScore >= 75);

  return {
    duplicateScore: topScore,
    similarProblems: results.slice(0, 5),
    recommendedClusterId: bestMatch?.problem.duplicate_cluster_id || undefined
  };
}

// Transparent Priority Score calculation
export function calculatePriorityScore(
  severityRaw: number,
  urgency: UrgencyLevel,
  citizensCount: number = 1,
  clusterSize: number = 1,
  locationRiskRaw: number = 70
): { score: number; breakdown: PriorityBreakdown } {
  // Urgency mapping: low = 25, medium = 50, high = 75, critical = 100
  const urgencyRawMap: Record<UrgencyLevel, number> = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 100
  };
  const urgencyRaw = urgencyRawMap[urgency] || 50;

  // Normalize citizen count (1 to 200+ mapped to 0-100)
  const normalizedCitizens = Math.min(100, Math.round(citizensCount * 2.5 + 20));

  // Normalize cluster size (1 to 25+ mapped to 0-100)
  const normalizedCluster = Math.min(100, Math.round(clusterSize * 4 + 15));

  // Weighted formula:
  // Severity: 30%, Citizens: 25%, Cluster Size: 20%, Urgency: 15%, Location Risk: 10%
  const sevContrib = severityRaw * 0.30;
  const citContrib = normalizedCitizens * 0.25;
  const cluContrib = normalizedCluster * 0.20;
  const urgContrib = urgencyRaw * 0.15;
  const locContrib = locationRiskRaw * 0.10;

  const total = Math.min(99, Math.max(15, Math.round(sevContrib + citContrib + cluContrib + urgContrib + locContrib)));

  return {
    score: total,
    breakdown: {
      severityContribution: +sevContrib.toFixed(1),
      citizensContribution: +citContrib.toFixed(1),
      clusterContribution: +cluContrib.toFixed(1),
      urgencyContribution: +urgContrib.toFixed(1),
      locationRiskContribution: +locContrib.toFixed(1),
      severityRaw,
      citizensCount,
      clusterSize,
      urgencyRaw,
      locationRiskRaw,
      explanation: `Calculated from Severity (${severityRaw} × 30%), Affected Community (${normalizedCitizens} × 25%), Cluster Density (${normalizedCluster} × 20%), Stated Urgency (${urgencyRaw} × 15%), and Demographic Risk (${locationRiskRaw} × 10%).`
    }
  };
}

// Local Demo AI Classifier & Intelligence Engine
export function analyzeProblemLocal(
  title: string,
  description: string,
  urgency: UrgencyLevel,
  lat: number,
  lng: number,
  existingProblems: Problem[]
): AIAnalysis {
  const fullText = `${title} ${description}`.toLowerCase();

  // 1. Detect Category with Keyword Scoring
  let detectedCategory = 'Public Services';
  let highestScore = 0;
  const categoryScores: Record<string, number> = {};

  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (fullText.includes(kw)) {
        score += kw.includes(' ') ? 4 : 2; // multi-word bonus
      }
    }
    categoryScores[catName] = score;
    if (score > highestScore) {
      highestScore = score;
      detectedCategory = catName;
    }
  }

  const categoryConfidence = Math.min(98, Math.max(65, 50 + highestScore * 8));

  // 2. Determine Severity
  let severityScore = urgency === 'critical' ? 95 : urgency === 'high' ? 82 : urgency === 'medium' ? 65 : 40;
  let severityMatches = 0;
  for (const signal of SEVERITY_HIGH_SIGNALS) {
    if (fullText.includes(signal)) {
      severityMatches++;
      severityScore = Math.min(98, severityScore + 4);
    }
  }
  const severityConfidence = Math.min(96, Math.max(70, 60 + severityMatches * 7));

  // 3. Duplicate Detection
  const dupCheck = detectDuplicates(title, description, lat, lng, existingProblems);

  // 4. Priority Score
  const clusterSize = dupCheck.similarProblems.length > 0 ? dupCheck.similarProblems.length + 1 : 1;
  const estimatedCitizens = clusterSize * 15 + Math.floor(Math.random() * 20);
  const locationRisk = fullText.includes('school') || fullText.includes('hospital') || fullText.includes('infant') ? 90 : 70;

  const priorityResult = calculatePriorityScore(severityScore, urgency, estimatedCitizens, clusterSize, locationRisk);

  // 5. Extract Keywords
  const words = fullText.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 4);
  const uniqueWords = Array.from(new Set(words)).slice(0, 6);

  // 6. Recommended actions based on category
  const actionTemplates: Record<string, string[]> = {
    'Water Management': [
      'Activate regional water restoration taskforce',
      'Deploy IoT telemetry and groundwater testing probes',
      'Recommend urgent collaboration with IIT Water Innovation Centre'
    ],
    'Sanitation': [
      'Deploy decentralized bio-digestion and smart waste collection bins',
      'Establish 500m sanitization perimeter around sensitive public zones',
      'Assign project to NEERI Waste Research Laboratory'
    ],
    'Agriculture': [
      'Engage agricultural extension engineers for canal/soil telemetry',
      'Deploy off-grid solar cold storage units for harvest preservation',
      'Connect with ICAR Agri-Tech Rural Engineering Institute'
    ],
    'Healthcare': [
      'Alert District Health Officer and primary health response cell',
      'Deploy thermal phase-change vaccine preservation units',
      'Partner with AIIMS Public Health & Biomedical Lab'
    ],
    'Infrastructure': [
      'Perform non-destructive structural acoustic health test',
      'Deploy temporary flood bypass & emergency commuter bridge',
      'Assign to Centre for Sustainable Urban Infrastructure'
    ]
  };

  const actions = actionTemplates[detectedCategory] || [
    `Assign to accredited institution specializing in ${detectedCategory}`,
    'Initiate student innovation challenge project',
    'Deploy real-time citizen feedback and milestone tracking'
  ];

  return {
    id: `ai-gen-${Date.now()}`,
    problem_id: '',
    detected_category: detectedCategory,
    category_confidence: categoryConfidence,
    severity: urgency,
    severity_confidence: severityConfidence,
    priority_score: priorityResult.score,
    summary: `Identified significant ${detectedCategory} issue. System evaluated ${clusterSize} correlated local signals with high community urgency and safety impact.`,
    keywords: uniqueWords.length > 0 ? uniqueWords : [detectedCategory.toLowerCase(), 'community issue', 'public challenge'],
    duplicate_score: dupCheck.duplicateScore,
    similar_problem_ids: dupCheck.similarProblems.map(s => s.problem.id),
    recommended_actions: actions,
    priority_breakdown: priorityResult.breakdown,
    created_at: new Date().toISOString()
  };
}

// Real AI Analyzer using Google GenAI SDK
export async function analyzeProblemWithAI(
  title: string,
  description: string,
  urgency: UrgencyLevel,
  lat: number,
  lng: number,
  existingProblems: Problem[]
): Promise<AIAnalysis> {
  const client = getGeminiClient();

  // If client is unavailable or API key not set, seamlessly fallback to deterministic Local Demo AI
  if (!client || process.env.AI_MODE === 'demo') {
    return analyzeProblemLocal(title, description, urgency, lat, lng, existingProblems);
  }

  try {
    const prompt = `You are Samaadhaan AI, a national societal innovation engine. Analyze this citizen complaint:
Title: "${title}"
Description: "${description}"
User Urgency: "${urgency}"
Coordinates: Lat ${lat}, Lng ${lng}

Categories available:
Water Management, Sanitation, Agriculture, Healthcare, Education, Environment, Infrastructure, Accessibility, Public Services, Rural Development, Energy, Urban Development.

Analyze and return JSON matching the schema.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: 'Best matching category from list' },
            category_confidence: { type: Type.NUMBER, description: '0 to 100 confidence' },
            severity: { type: Type.STRING, description: 'low, medium, high, or critical' },
            severity_confidence: { type: Type.NUMBER, description: '0 to 100 confidence' },
            summary: { type: Type.STRING, description: 'Executive summary in 2 sentences' },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 to 6 key terms' },
            recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3 specific innovation engineering actions' },
            severity_score: { type: Type.NUMBER, description: 'Severity score 0 to 100' }
          },
          required: ['category', 'category_confidence', 'severity', 'severity_confidence', 'summary', 'keywords', 'recommended_actions']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const dupCheck = detectDuplicates(title, description, lat, lng, existingProblems);
    const clusterSize = dupCheck.similarProblems.length + 1;
    const sevScore = parsed.severity_score || (parsed.severity === 'critical' ? 95 : parsed.severity === 'high' ? 80 : 60);

    const priorityResult = calculatePriorityScore(sevScore, urgency, clusterSize * 15, clusterSize, 80);

    return {
      id: `ai-gemini-${Date.now()}`,
      problem_id: '',
      detected_category: parsed.category || 'Water Management',
      category_confidence: parsed.category_confidence || 92,
      severity: (parsed.severity as UrgencyLevel) || urgency,
      severity_confidence: parsed.severity_confidence || 90,
      priority_score: priorityResult.score,
      summary: parsed.summary || 'Real AI analysis complete.',
      keywords: parsed.keywords || ['community', 'innovation'],
      duplicate_score: dupCheck.duplicateScore,
      similar_problem_ids: dupCheck.similarProblems.map(s => s.problem.id),
      recommended_actions: parsed.recommended_actions || ['Deploy field inspection team', 'Match with university lab'],
      priority_breakdown: priorityResult.breakdown,
      created_at: new Date().toISOString()
    };
  } catch (err) {
    console.warn('Gemini API call failed or timed out, using deterministic local AI engine:', err);
    return analyzeProblemLocal(title, description, urgency, lat, lng, existingProblems);
  }
}

// Institution Matcher Engine (4-factor weighted score)
// Category Match: 40%, Keyword Match: 25%, Expertise Level: 20%, Availability/Active Load: 15%
export function matchInstitutionsForProblem(
  problem: Problem,
  institutions: Institution[]
): InstitutionRecommendation[] {
  const recommendations: InstitutionRecommendation[] = [];
  const probKeywords = [
    ...(problem.ai_analysis?.keywords || []),
    ...problem.title.toLowerCase().split(' ').filter(w => w.length > 3),
    ...problem.description.toLowerCase().split(' ').filter(w => w.length > 3)
  ];

  for (const inst of institutions) {
    // 1. Category Match (40%)
    const matchingExp = inst.expertise.find(e => e.category_id === problem.category_id || e.category_name?.toLowerCase() === problem.category_name?.toLowerCase());
    const categoryMatchScore = matchingExp ? 100 : 25;

    // 2. Keyword Match (25%)
    let kwMatches = 0;
    const allInstKws = inst.expertise.flatMap(e => e.keywords.map(k => k.toLowerCase()));
    for (const pkw of probKeywords) {
      if (allInstKws.some(ikw => ikw.includes(pkw) || pkw.includes(ikw))) {
        kwMatches++;
      }
    }
    const keywordMatchScore = Math.min(100, Math.max(20, kwMatches * 25));

    // 3. Expertise Level (20%)
    const expertiseScore = matchingExp ? matchingExp.expertise_level : 40;

    // 4. Availability / Active Project Load (15%)
    // Fewer active projects = higher availability
    const availabilityScore = Math.max(30, 100 - inst.active_projects_count * 15);

    // Total Compatibility Score
    const totalCompatibility = Math.min(99, Math.round(
      categoryMatchScore * 0.40 +
      keywordMatchScore * 0.25 +
      expertiseScore * 0.20 +
      availabilityScore * 0.15
    ));

    const matchReasons: string[] = [];
    if (matchingExp) {
      matchReasons.push(`High departmental specialization in ${problem.category_name || 'this domain'} (${matchingExp.expertise_level}% rating)`);
    }
    if (kwMatches > 0) {
      matchReasons.push(`Matched technical keywords in past published innovation patents: ${allInstKws.slice(0, 3).join(', ')}`);
    }
    if (inst.active_projects_count < 3) {
      matchReasons.push(`Available laboratory capacity (${inst.active_projects_count} active projects)`);
    }

    recommendations.push({
      institution: inst,
      compatibility_score: totalCompatibility,
      category_match_score: categoryMatchScore,
      keyword_match_score: keywordMatchScore,
      expertise_score: expertiseScore,
      availability_score: availabilityScore,
      match_reasons: matchReasons.length > 0 ? matchReasons : ['General engineering and societal R&D capabilities']
    });
  }

  recommendations.sort((a, b) => b.compatibility_score - a.compatibility_score);
  return recommendations;
}

// Smart Solution Direction Recommender
export function generateSolutionDirections(problem: Problem): SolutionDirection[] {
  const cat = problem.category_name || 'Water Management';

  const defaultTemplates: Record<string, Partial<SolutionDirection>[]> = {
    'Water Management': [
      {
        title: 'Decentralized Solar Defluoridation & IoT Flow Kiosk',
        description: 'Deploy solar-powered electrochemical de-ionization filtration hubs at community centers to remove salinity and fluoride without brine wastewater.',
        domain: 'Chemical Engineering & Solar Micro-power',
        feasibility_score: 94,
        estimated_timeframe: '4-6 weeks',
        key_technologies: ['Electrochemical Coagulation', 'LoRaWAN TDS Sensors', 'Solar MPPT']
      },
      {
        title: 'Acoustic Ultrasonic Pipeline Leak Triangulation',
        description: 'Install non-intrusive sound frequency sensors on main distribution lines to detect underground fractures within 2 meters.',
        domain: 'IoT & Telemetry',
        feasibility_score: 89,
        estimated_timeframe: '3-5 weeks',
        key_technologies: ['Ultrasonic Frequency Triangulation', 'GSM Gateway', 'GIS Heatmaps']
      },
      {
        title: 'Gravity Aquifer Infiltration Recharge Shafts',
        description: 'Channel storm water runoff through dual sand-gravel filtration beds directly into deep non-saline aquifer layers.',
        domain: 'Hydro-geology',
        feasibility_score: 91,
        estimated_timeframe: '2-4 weeks',
        key_technologies: ['Sand-Gravel Bio-Filters', 'Hydro-static Piezometer', 'Silt Traps']
      }
    ],
    'Sanitation': [
      {
        title: 'School-Adjacent Modular Anaerobic Bio-Methanizers',
        description: 'Convert cafeteria and neighborhood organic waste into safe, odorless biogas for school mid-day meal cooking stoves.',
        domain: 'Circular Economy & Bio-energy',
        feasibility_score: 92,
        estimated_timeframe: '5-7 weeks',
        key_technologies: ['Anaerobic Digestion', 'Methane Scrubber', 'Organic Compost Pellets']
      },
      {
        title: 'AI Optical Waste Depth Sensor & Route Automation',
        description: 'IP67 optical sensors transmitting bin fill-levels to municipal dispatch to eliminate overflowing roadside bins.',
        domain: 'Edge AI & Smart Logistics',
        feasibility_score: 95,
        estimated_timeframe: '3-4 weeks',
        key_technologies: ['Computer Vision Edge Node', 'Shortest Route Optimization', 'SMS Dispatch']
      }
    ],
    'Agriculture': [
      {
        title: 'Basalt Geotextile Rapid Canal Repair Liners',
        description: 'Deploy modular interlocking basalt fiber panels to plug canal breaches within 48 hours without heavy excavation.',
        domain: 'Civil & Material Science',
        feasibility_score: 90,
        estimated_timeframe: '2-3 weeks',
        key_technologies: ['Basalt Fiber Geotextile', 'Ultrasonic Flow Telemetry', 'Quick-Curing Mortar']
      },
      {
        title: 'Solar Thermal Micro-Cold Storage for Farm Produce',
        description: 'Low-cost phase-change thermal storage cold room maintaining 4°C for tomato and perishable crops during grid blackouts.',
        domain: 'Thermal & Agri-Engineering',
        feasibility_score: 88,
        estimated_timeframe: '6-8 weeks',
        key_technologies: ['Phase Change Eutectic Salt', 'Solar Thermal Collector', 'Humidity Automation']
      }
    ]
  };

  const selected = defaultTemplates[cat] || [
    {
      title: `AI-Assisted IoT Monitoring & Automation for ${cat}`,
      description: `Deploy sensor network and rapid engineering intervention designed by participating university student researchers.`,
      domain: 'Applied Societal Engineering',
      feasibility_score: 88,
      estimated_timeframe: '4-6 weeks',
      key_technologies: ['Edge Telemetry', 'Rapid Prototyping', 'Cloud Analytics']
    }
  ];

  return selected.map((item, idx) => ({
    id: `sol-dir-${Date.now()}-${idx + 1}`,
    problem_id: problem.id,
    title: item.title || 'Innovative Community Solution',
    description: item.description || '',
    domain: item.domain || 'Applied Technology',
    feasibility_score: item.feasibility_score || 85,
    estimated_timeframe: item.estimated_timeframe || '4 weeks',
    key_technologies: item.key_technologies || ['IoT', 'Open Hardware'],
    status: 'suggested' as const,
    created_by_ai: true,
    votes: 12 + idx * 7
  }));
}
