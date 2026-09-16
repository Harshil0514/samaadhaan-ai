import bcrypt from 'bcryptjs';
import {
  User,
  Category,
  Problem,
  ProblemCluster,
  Institution,
  Project,
  Notification,
  AIAnalysis,
  SolutionDirection
} from '../src/types';

// In-memory relational store with auto-seeding
export interface DatabaseSchema {
  users: User[];
  passwordHashes: Record<string, string>;
  categories: Category[];
  problems: Problem[];
  aiAnalyses: AIAnalysis[];
  clusters: ProblemCluster[];
  institutions: Institution[];
  projects: Project[];
  supports: { userId: string; problemId: string; createdAt: string }[];
  notifications: Notification[];
  solutionDirections: SolutionDirection[];
}

export const db: DatabaseSchema = {
  users: [],
  passwordHashes: {},
  categories: [],
  problems: [],
  aiAnalyses: [],
  clusters: [],
  institutions: [],
  projects: [],
  supports: [],
  notifications: [],
  solutionDirections: [],
};

// Seed Categories
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Water Management', description: 'Drinking water, supply disruptions, pipeline leaks, groundwater depletion & storage', icon: 'Droplets' },
  { id: 'cat-2', name: 'Sanitation', description: 'Waste disposal, open drains, sewage overflows, garbage accumulation & public toilets', icon: 'Trash2' },
  { id: 'cat-3', name: 'Agriculture', description: 'Crop irrigation, soil degradation, pest management, storage & farmer infrastructure', icon: 'Sprout' },
  { id: 'cat-4', name: 'Healthcare', description: 'Primary health centers, medicine availability, sanitation hazards & disease outbreaks', icon: 'HeartPulse' },
  { id: 'cat-5', name: 'Education', description: 'School infrastructure, digital access, classrooms, clean drinking water for students', icon: 'GraduationCap' },
  { id: 'cat-6', name: 'Environment', description: 'Air pollution, industrial emissions, river contamination, deforestation & climate resilience', icon: 'TreePine' },
  { id: 'cat-7', name: 'Infrastructure', description: 'Damaged roads, collapsed culverts, bridges, streetlighting & structural risks', icon: 'Building2' },
  { id: 'cat-8', name: 'Accessibility', description: 'Disabled access, wheel-chair ramps at public offices, tactile paths & transit facilities', icon: 'Accessibility' },
  { id: 'cat-9', name: 'Public Services', description: 'Electricity grid failures, public transport gaps, citizen welfare delivery centers', icon: 'Users' },
  { id: 'cat-10', name: 'Rural Development', description: 'Village connectivity, artisan support, off-grid power & rural livelihood challenges', icon: 'Tractor' },
  { id: 'cat-11', name: 'Energy', description: 'Solar micro-grids, transformer overloads, renewable community micro-power', icon: 'Zap' },
  { id: 'cat-12', name: 'Urban Development', description: 'Smart parking, pedestrian walkways, storm water management & urban congestion', icon: 'Landmark' },
];

export const DEFAULT_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-1',
    name: 'IIT Innovation & Water Tech Centre',
    description: 'Premier national technology institute specializing in IoT water flow meters, groundwater purification, and smart utility grids.',
    location: 'Jodhpur, Rajasthan',
    latitude: 26.2389,
    longitude: 73.0243,
    contact_email: 'water-innov@iitj.ac.in',
    website: 'https://iitj.ac.in',
    active_projects_count: 2,
    completed_projects_count: 4,
    created_at: new Date('2025-01-10').toISOString(),
    expertise: [
      { id: 'exp-1', institution_id: 'inst-1', category_id: 'cat-1', category_name: 'Water Management', expertise_level: 95, keywords: ['groundwater', 'pipeline', 'salinity', 'leakage', 'purification', 'sensors'] },
      { id: 'exp-2', institution_id: 'inst-1', category_id: 'cat-11', category_name: 'Energy', expertise_level: 88, keywords: ['solar', 'microgrid', 'pumps', 'iot'] },
      { id: 'exp-3', institution_id: 'inst-1', category_id: 'cat-7', category_name: 'Infrastructure', expertise_level: 82, keywords: ['smart city', 'structural health', 'bridge', 'roads'] }
    ]
  },
  {
    id: 'inst-2',
    name: 'National Environmental Research & Waste Lab',
    description: 'National research laboratory dedicated to circular waste processing, decentralized bio-methanation, and solid waste segregation.',
    location: 'Pune, Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    contact_email: 'solutions@neeri-lab.res.in',
    website: 'https://neeri.res.in',
    active_projects_count: 1,
    completed_projects_count: 6,
    created_at: new Date('2025-01-15').toISOString(),
    expertise: [
      { id: 'exp-4', institution_id: 'inst-2', category_id: 'cat-2', category_name: 'Sanitation', expertise_level: 96, keywords: ['garbage', 'composting', 'segregation', 'sewage', 'drainage', 'plastics'] },
      { id: 'exp-5', institution_id: 'inst-2', category_id: 'cat-6', category_name: 'Environment', expertise_level: 92, keywords: ['air quality', 'river pollution', 'bioremediation', 'industrial waste'] }
    ]
  },
  {
    id: 'inst-3',
    name: 'Agri-Tech Rural Engineering Institute',
    description: 'Apex agriculture research center focused on precision irrigation, canal telemetry, crop protection, and off-grid cold chain.',
    location: 'Varanasi, Uttar Pradesh',
    latitude: 25.3176,
    longitude: 82.9739,
    contact_email: 'agritech@bhu-icar.ac.in',
    website: 'https://icar-agri.ac.in',
    active_projects_count: 2,
    completed_projects_count: 3,
    created_at: new Date('2025-02-01').toISOString(),
    expertise: [
      { id: 'exp-6', institution_id: 'inst-3', category_id: 'cat-3', category_name: 'Agriculture', expertise_level: 94, keywords: ['irrigation', 'canal', 'soil', 'farmer', 'solar pump', 'drip'] },
      { id: 'exp-7', institution_id: 'inst-3', category_id: 'cat-10', category_name: 'Rural Development', expertise_level: 89, keywords: ['livelihood', 'storage', 'off-grid', 'artisans'] }
    ]
  },
  {
    id: 'inst-4',
    name: 'Public Health & Biomedical Innovation Centre',
    description: 'Multidisciplinary healthcare research center developing low-cost diagnostic kits, tele-consultation kiosks, and rural PHC automation.',
    location: 'Bhopal, Madhya Pradesh',
    latitude: 23.2599,
    longitude: 77.4126,
    contact_email: 'innovations@aiims-bhopal.edu.in',
    website: 'https://aiimsbhopal.edu.in',
    active_projects_count: 1,
    completed_projects_count: 2,
    created_at: new Date('2025-02-10').toISOString(),
    expertise: [
      { id: 'exp-8', institution_id: 'inst-4', category_id: 'cat-4', category_name: 'Healthcare', expertise_level: 95, keywords: ['telemedicine', 'diagnostics', 'phc', 'maternal health', 'epidemic', 'vaccine storage'] },
      { id: 'exp-9', institution_id: 'inst-4', category_id: 'cat-8', category_name: 'Accessibility', expertise_level: 85, keywords: ['prosthetics', 'assistive tech', 'wheelchair', 'braille signage'] }
    ]
  },
  {
    id: 'inst-5',
    name: 'Centre for Sustainable Urban Infrastructure & Mobility',
    description: 'Urban engineering institution focused on resilient roads, non-destructive bridge inspection, barrier-free public design, and storm drainage.',
    location: 'Bengaluru, Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    contact_email: 'urban-lab@iisc.ac.in',
    website: 'https://iisc.ac.in',
    active_projects_count: 2,
    completed_projects_count: 5,
    created_at: new Date('2025-02-15').toISOString(),
    expertise: [
      { id: 'exp-10', institution_id: 'inst-5', category_id: 'cat-7', category_name: 'Infrastructure', expertise_level: 93, keywords: ['potholes', 'flyover', 'sensor monitoring', 'culvert', 'asphalt'] },
      { id: 'exp-11', institution_id: 'inst-5', category_id: 'cat-12', category_name: 'Urban Development', expertise_level: 90, keywords: ['smart traffic', 'flood mapping', 'walkability', 'urban drainage'] },
      { id: 'exp-12', institution_id: 'inst-5', category_id: 'cat-8', category_name: 'Accessibility', expertise_level: 87, keywords: ['accessible transit', 'ramps', 'universal design'] }
    ]
  }
];

export async function initializeDatabase() {
  if (db.users.length > 0) return;

  console.log('Initializing CivicSetu database with rich seed data...');

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin123!', salt);
  const citizenHash = await bcrypt.hash('Citizen123!', salt);
  const institutionHash = await bcrypt.hash('Institution123!', salt);
  const expertHash = await bcrypt.hash('Expert123!', salt);

  // 1. Seed Demo Users
  const users: User[] = [
    {
      id: 'usr-admin-1',
      name: 'Dr. Rajesh Sharma',
      email: 'admin@civicsetu.ai',
      role: 'admin',
      organization: 'Ministry of Social Innovation & Public Grievances',
      phone: '+91 98765 43210',
      profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      created_at: new Date('2025-01-01').toISOString()
    },
    {
      id: 'usr-citizen-1',
      name: 'Aarav Patel',
      email: 'citizen@civicsetu.ai',
      role: 'citizen',
      organization: 'Mandore Residents Welfare Association',
      phone: '+91 98123 45678',
      profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      created_at: new Date('2025-01-05').toISOString()
    },
    {
      id: 'usr-inst-1',
      name: 'Prof. Sunita Deshmukh',
      email: 'institution@civicsetu.ai',
      role: 'institution',
      organization: 'IIT Innovation & Water Tech Centre',
      phone: '+91 97234 56789',
      profile_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      created_at: new Date('2025-01-08').toISOString()
    },
    {
      id: 'usr-expert-1',
      name: 'Vikramaditya Sen',
      email: 'expert@civicsetu.ai',
      role: 'expert',
      organization: 'CleanWater Foundation & Hydrology Expert',
      phone: '+91 96345 67890',
      profile_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      created_at: new Date('2025-01-10').toISOString()
    }
  ];

  db.users = users;
  db.passwordHashes['admin@civicsetu.ai'] = adminHash;
  db.passwordHashes['citizen@civicsetu.ai'] = citizenHash;
  db.passwordHashes['institution@civicsetu.ai'] = institutionHash;
  db.passwordHashes['expert@civicsetu.ai'] = expertHash;
  db.passwordHashes['admin@samaadhaan.ai'] = adminHash;
  db.passwordHashes['citizen@samaadhaan.ai'] = citizenHash;
  db.passwordHashes['institution@samaadhaan.ai'] = institutionHash;
  db.passwordHashes['expert@samaadhaan.ai'] = expertHash;

  db.categories = DEFAULT_CATEGORIES;
  db.institutions = DEFAULT_INSTITUTIONS;

  // 2. Create Clusters for Duplicate Demonstration
  const clusterWater: ProblemCluster = {
    id: 'cluster-water-mandore',
    name: 'Mandore Acute Groundwater & Pipeline Restoration Challenge',
    category_id: 'cat-1',
    category_name: 'Water Management',
    center_latitude: 26.3533,
    center_longitude: 73.0426,
    radius_km: 2.4,
    total_reports: 20,
    priority_score: 92,
    status: 'assigned',
    assigned_institution_id: 'inst-1',
    assigned_institution_name: 'IIT Innovation & Water Tech Centre',
    project_id: 'proj-water-1',
    problem_ids: [],
    created_at: new Date('2025-02-10').toISOString()
  };

  const clusterWaste: ProblemCluster = {
    id: 'cluster-waste-schools',
    name: 'Urban School Zone Solid Waste & Micro-Segregation Challenge',
    category_id: 'cat-2',
    category_name: 'Sanitation',
    center_latitude: 18.5314,
    center_longitude: 73.8446,
    radius_km: 1.8,
    total_reports: 15,
    priority_score: 87,
    status: 'verified',
    assigned_institution_id: 'inst-2',
    assigned_institution_name: 'National Environmental Research & Waste Lab',
    project_id: 'proj-waste-1',
    problem_ids: [],
    created_at: new Date('2025-02-14').toISOString()
  };

  db.clusters = [clusterWater, clusterWaste];

  // 3. Generate 50+ Seeded Realistic Problems
  const seededProblems: Problem[] = [];
  const seededAnalyses: AIAnalysis[] = [];

  // Group 1: 20 Duplicate / Highly-related Water shortage problems in Mandore area
  const waterLocations = [
    { title: 'Severe water supply disruption in Mandore Ward 4', desc: 'Water has not arrived in pipelines for 6 consecutive days. Tankers are charging exorbitant rates.', lat: 26.3530, lng: 73.0420, urgency: 'critical' as const, sev: 95 },
    { title: 'Pipeline leakage causing zero pressure in Mandore Sector B', desc: 'Main supply pipe broken near community hall, clean water wasting on road while taps are dry.', lat: 26.3541, lng: 73.0435, urgency: 'critical' as const, sev: 92 },
    { title: 'Groundwater salinity rising drastically in Mandore tubewells', desc: 'Borewell water turned yellowish and undrinkable. Over 400 households affected with skin irritation.', lat: 26.3518, lng: 73.0410, urgency: 'high' as const, sev: 88 },
    { title: 'Water shortage in Mandore area near Main Market', desc: 'Continuous scarcity of drinking water for two weeks. Commercial tankers taking over.', lat: 26.3538, lng: 73.0442, urgency: 'high' as const, sev: 89 },
    { title: 'Contaminated tap water with sewage odor in Mandore colony', desc: 'Drinking water smells like sewer line. Possible cross-contamination beneath drainage intersection.', lat: 26.3525, lng: 73.0405, urgency: 'critical' as const, sev: 96 },
    { title: 'No drinking water supply in Mandore Government Primary School', desc: 'Children have to bring water bottles from 3km away. Handpump completely dry.', lat: 26.3552, lng: 73.0450, urgency: 'critical' as const, sev: 94 },
    { title: 'Underground pipeline burst near Mandore Heritage Garden', desc: 'Heavy water flooding road since Monday morning. Entire northern block without municipal water.', lat: 26.3560, lng: 73.0461, urgency: 'high' as const, sev: 85 },
    { title: 'Low pressure water crisis in Mandore Housing Board Phase 2', desc: 'Water only trickles for 10 minutes at 4:00 AM. Inadequate for multi-storey residential blocks.', lat: 26.3508, lng: 73.0392, urgency: 'medium' as const, sev: 75 },
    { title: 'Dry taps in Mandore rural extension ward 12', desc: 'No municipal water connection available. Wells have completely dried up this summer season.', lat: 26.3490, lng: 73.0380, urgency: 'high' as const, sev: 86 },
    { title: 'Community water storage tank cracked and leaking in Mandore', desc: 'Overhead 50,000L tank has structural fissures. Half the stored water drains away within hours.', lat: 26.3535, lng: 73.0428, urgency: 'high' as const, sev: 84 },
    { title: 'Fluoride levels exceeding safety norms in Mandore borewells', desc: 'Lab testing confirmed fluoride at 3.8 mg/L. Dental fluorosis visible in local school children.', lat: 26.3545, lng: 73.0430, urgency: 'high' as const, sev: 90 },
    { title: 'Irregular water tanker deliveries in Mandore slums', desc: 'Municipal tankers only arrive once a week leading to disputes and violent queues.', lat: 26.3512, lng: 73.0415, urgency: 'critical' as const, sev: 91 },
    { title: 'Pump motor burnt at Mandore central boosting station', desc: 'Station non-functional for 3 days. Thousands of families without tap water supply.', lat: 26.3550, lng: 73.0440, urgency: 'critical' as const, sev: 93 },
    { title: 'Sand and silt coming out of domestic water taps in Mandore', desc: 'Heavy sediment deposition clogging filters and causing pump failures.', lat: 26.3522, lng: 73.0422, urgency: 'medium' as const, sev: 72 },
    { title: 'Unauthorized borewells depleting Mandore community aquifer', desc: 'Illegal commercial bottling units running borewells 24/7 causing water table to drop 150ft.', lat: 26.3565, lng: 73.0470, urgency: 'high' as const, sev: 87 },
    { title: 'Rooftop rainwater harvesting missing in Mandore public complex', desc: 'Monsoon runoffs flood the road while ground water recharging remains zero.', lat: 26.3500, lng: 73.0390, urgency: 'low' as const, sev: 60 },
    { title: 'Water contamination detected in Mandore Community Health Centre', desc: 'Hospital patients cannot use tap water for dialysis or basic sanitation.', lat: 26.3532, lng: 73.0438, urgency: 'critical' as const, sev: 97 },
    { title: 'Main distribution valve rusted shut in Mandore Sector 5', desc: 'Valve stuck in closed position. Technicians unable to open without mechanical replacement.', lat: 26.3540, lng: 73.0418, urgency: 'high' as const, sev: 82 },
    { title: 'Broken public drinking fountain at Mandore Bus Stand', desc: 'Commuters and auto drivers have no access to clean drinking water in 44°C heat.', lat: 26.3528, lng: 73.0445, urgency: 'medium' as const, sev: 70 },
    { title: 'Mandore Lake dried up due to diverted catchment channels', desc: 'Historical reservoir catchment blocked by debris, destroying local water security.', lat: 26.3570, lng: 73.0480, urgency: 'high' as const, sev: 85 }
  ];

  waterLocations.forEach((item, idx) => {
    const pId = `prob-water-${idx + 1}`;
    clusterWater.problem_ids.push(pId);

    const prob: Problem = {
      id: pId,
      title: item.title,
      description: item.desc,
      category_id: 'cat-1',
      category_name: 'Water Management',
      status: idx === 0 ? 'assigned' : (idx < 5 ? 'verified' : 'under_review'),
      urgency: item.urgency,
      latitude: item.lat,
      longitude: item.lng,
      address: `Mandore Area, Jodhpur, Rajasthan 342004`,
      created_by: 'usr-citizen-1',
      author_name: 'Aarav Patel',
      author_email: 'citizen@civicsetu.ai',
      priority_score: Math.min(99, Math.round(item.sev * 0.3 + 20 * 0.25 + 20 * 0.2 + (item.urgency === 'critical' ? 100 : item.urgency === 'high' ? 75 : 50) * 0.15 + 80 * 0.1)),
      severity_score: item.sev,
      duplicate_cluster_id: 'cluster-water-mandore',
      cluster_name: clusterWater.name,
      supports_count: 14 + (20 - idx) * 3,
      has_user_supported: idx % 3 === 0,
      images: [
        'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80'
      ],
      assigned_institution_id: 'inst-1',
      assigned_institution_name: 'IIT Innovation & Water Tech Centre',
      project_id: 'proj-water-1',
      created_at: new Date(Date.now() - (25 - idx) * 86400000).toISOString(),
      updated_at: new Date(Date.now() - (10 - Math.min(idx, 9)) * 86400000).toISOString()
    };

    const analysis: AIAnalysis = {
      id: `ai-water-${idx + 1}`,
      problem_id: pId,
      detected_category: 'Water Management',
      category_confidence: 96,
      severity: item.urgency,
      severity_confidence: 92,
      priority_score: prob.priority_score,
      summary: `Critical water disruption in Mandore cluster affecting municipal supply, school infrastructure, and groundwater health. Detected high duplicate density (${clusterWater.total_reports} reports in 2.4 km).`,
      keywords: ['water shortage', 'mandore', 'pipeline', 'groundwater', 'salinity', 'drinking supply'],
      duplicate_score: 89,
      similar_problem_ids: waterLocations.slice(0, 4).map((_, i) => `prob-water-${i + 1}`).filter(id => id !== pId),
      recommended_actions: [
        'Activate Mandore Water Restoration Challenge cluster',
        'Deploy IIT Jodhpur IoT pressure & salinity sensor testbed',
        'Coordinate municipal emergency tanker routes with GIS telemetry'
      ],
      priority_breakdown: {
        severityContribution: +(item.sev * 0.3).toFixed(1),
        citizensContribution: +(20 * 0.25).toFixed(1),
        clusterContribution: +(20 * 0.2).toFixed(1),
        urgencyContribution: +((item.urgency === 'critical' ? 100 : item.urgency === 'high' ? 75 : 50) * 0.15).toFixed(1),
        locationRiskContribution: +(80 * 0.1).toFixed(1),
        severityRaw: item.sev,
        citizensCount: 140,
        clusterSize: 20,
        urgencyRaw: item.urgency === 'critical' ? 100 : item.urgency === 'high' ? 75 : 50,
        locationRiskRaw: 80,
        explanation: 'High duplicate cluster density (+20 reports within 2.4km) combined with critical health & education facility impacts elevated priority to 90+.'
      },
      created_at: prob.created_at
    };

    prob.ai_analysis = analysis;
    seededProblems.push(prob);
    seededAnalyses.push(analysis);
  });

  // Group 2: 15 Duplicate / Highly-related Sanitation/Waste problems near government schools in Pune
  const wasteLocations = [
    { title: 'Garbage accumulation near Government Girls Model School', desc: 'Over 3 tonnes of uncollected solid waste lying 10 meters from the school playground. Stray dogs and foul stench.', lat: 18.5310, lng: 73.8440, urgency: 'critical' as const, sev: 93 },
    { title: 'Overflowing waste dump near government school campus', desc: 'Garbage bins damaged and spilling over onto the main footpath used by school students.', lat: 18.5318, lng: 73.8448, urgency: 'high' as const, sev: 88 },
    { title: 'Trash has been lying near the school gate for 10 days', desc: 'Rotting organic waste attracting disease vectors and mosquitoes near classroom windows.', lat: 18.5322, lng: 73.8452, urgency: 'critical' as const, sev: 90 },
    { title: 'Illegal plastic burning behind school boundary wall', desc: 'Toxic fumes entering primary school classrooms causing respiratory distress in students.', lat: 18.5305, lng: 73.8435, urgency: 'critical' as const, sev: 95 },
    { title: 'Open drain choked with solid plastic waste near school lane', desc: 'Black stagnant water overflowing on the walking street leading to school entrance.', lat: 18.5329, lng: 73.8460, urgency: 'high' as const, sev: 86 },
    { title: 'Hospital bio-waste dumped mixed with municipal trash', desc: 'Used syringes and medical plastic found in open dump near secondary school lane.', lat: 18.5335, lng: 73.8468, urgency: 'critical' as const, sev: 98 },
    { title: 'No segregated dustbins in commercial market near school', desc: 'Shopkeepers dumping wet waste openly every evening causing severe pest infestation.', lat: 18.5298, lng: 73.8425, urgency: 'medium' as const, sev: 72 },
    { title: 'Stagnant sewer water entering municipal school compound', desc: 'Underground sewage backflow flooding the school sports ground after light showers.', lat: 18.5312, lng: 73.8442, urgency: 'critical' as const, sev: 94 },
    { title: 'Debris and construction waste blocking school emergency exit', desc: 'Crushed concrete and bricks dumped by local contractors blocking fire passage.', lat: 18.5325, lng: 73.8455, urgency: 'high' as const, sev: 80 },
    { title: 'Fly menace and mosquito breeding at open dump near school', desc: 'Dengue cases reported among 8 students in class 6 & 7 over the past 2 weeks.', lat: 18.5308, lng: 73.8438, urgency: 'critical' as const, sev: 92 },
    { title: 'Broken compactor truck dumping leachate on school street', desc: 'Waste collection vehicle leaves hazardous liquid trail right across school crossing.', lat: 18.5340, lng: 73.8475, urgency: 'high' as const, sev: 83 },
    { title: 'E-waste dumping in vacant plot opposite school library', desc: 'Broken cathode tubes, lead batteries and circuit boards abandoned openly.', lat: 18.5290, lng: 73.8415, urgency: 'high' as const, sev: 85 },
    { title: 'Slaughterhouse waste dumped in open stormwater drain', desc: 'Severe odor making it impossible to conduct morning assembly in open courtyard.', lat: 18.5345, lng: 73.8480, urgency: 'critical' as const, sev: 96 },
    { title: 'Missing green belt barrier between school and waste transfer point', desc: 'Unshielded transit station spreading micro-dust and trash particles into classrooms.', lat: 18.5302, lng: 73.8430, urgency: 'medium' as const, sev: 68 },
    { title: 'Stray cattle and dog congregation at school gate dump', desc: 'Aggressive animals feeding on plastic waste causing safety hazards for children.', lat: 18.5315, lng: 73.8445, urgency: 'high' as const, sev: 82 }
  ];

  wasteLocations.forEach((item, idx) => {
    const pId = `prob-waste-${idx + 1}`;
    clusterWaste.problem_ids.push(pId);

    const prob: Problem = {
      id: pId,
      title: item.title,
      description: item.desc,
      category_id: 'cat-2',
      category_name: 'Sanitation',
      status: idx === 0 ? 'in_progress' : (idx < 4 ? 'verified' : 'under_review'),
      urgency: item.urgency,
      latitude: item.lat,
      longitude: item.lng,
      address: `Shivajinagar School Zone, Pune, Maharashtra 411005`,
      created_by: 'usr-citizen-1',
      author_name: 'Aarav Patel',
      author_email: 'citizen@civicsetu.ai',
      priority_score: Math.min(98, Math.round(item.sev * 0.3 + 15 * 0.25 + 15 * 0.2 + (item.urgency === 'critical' ? 100 : item.urgency === 'high' ? 75 : 50) * 0.15 + 75 * 0.1)),
      severity_score: item.sev,
      duplicate_cluster_id: 'cluster-waste-schools',
      cluster_name: clusterWaste.name,
      supports_count: 18 + (15 - idx) * 2,
      has_user_supported: idx % 2 === 0,
      images: [
        'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80'
      ],
      assigned_institution_id: 'inst-2',
      assigned_institution_name: 'National Environmental Research & Waste Lab',
      project_id: 'proj-waste-1',
      created_at: new Date(Date.now() - (20 - idx) * 86400000).toISOString(),
      updated_at: new Date(Date.now() - (5 - Math.min(idx, 4)) * 86400000).toISOString()
    };

    const analysis: AIAnalysis = {
      id: `ai-waste-${idx + 1}`,
      problem_id: pId,
      detected_category: 'Sanitation',
      category_confidence: 98,
      severity: item.urgency,
      severity_confidence: 94,
      priority_score: prob.priority_score,
      summary: `High-risk sanitation hotspot adjacent to educational institutions. Identified ${clusterWaste.total_reports} correlated citizen reports within 1.8km radius causing acute public health and respiratory hazards.`,
      keywords: ['garbage', 'school zone', 'waste dumping', 'sanitation', 'plastic burning', 'sewage'],
      duplicate_score: 91,
      similar_problem_ids: wasteLocations.slice(0, 3).map((_, i) => `prob-waste-${i + 1}`).filter(id => id !== pId),
      recommended_actions: [
        'Form Pune School Zone Cleanliness Taskforce',
        'Deploy NEERI decentralized bio-methanation and smart sensor bins',
        'Install CCTV and strict anti-littering enforcement perimeter'
      ],
      priority_breakdown: {
        severityContribution: +(item.sev * 0.3).toFixed(1),
        citizensContribution: +(15 * 0.25).toFixed(1),
        clusterContribution: +(15 * 0.2).toFixed(1),
        urgencyContribution: +((item.urgency === 'critical' ? 100 : item.urgency === 'high' ? 75 : 50) * 0.15).toFixed(1),
        locationRiskContribution: +(75 * 0.1).toFixed(1),
        severityRaw: item.sev,
        citizensCount: 110,
        clusterSize: 15,
        urgencyRaw: item.urgency === 'critical' ? 100 : item.urgency === 'high' ? 75 : 50,
        locationRiskRaw: 75,
        explanation: 'Children vulnerability factor and proximity to 3 schools increased urgency multiplier by 25%.'
      },
      created_at: prob.created_at
    };

    prob.ai_analysis = analysis;
    seededProblems.push(prob);
    seededAnalyses.push(analysis);
  });

  // Group 3: 18 Other diverse problems across India (Agriculture, Health, Roads, Energy, Accessibility, etc.)
  const additionalProblems = [
    {
      id: 'prob-agri-1',
      title: 'Solar drip irrigation canal breach in rural Varanasi farm cluster',
      desc: 'Canal embankment collapsed, depriving 120 smallholder farmers of tail-end irrigation during critical wheat sowing stage.',
      catId: 'cat-3',
      catName: 'Agriculture',
      lat: 25.3210,
      lng: 82.9810,
      urgency: 'high' as const,
      sev: 88,
      status: 'assigned' as const,
      instId: 'inst-3',
      instName: 'Agri-Tech Rural Engineering Institute',
      addr: 'Rohania Block, Varanasi, UP',
      img: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-health-1',
      title: 'Primary Health Centre cold storage vaccine freezer failure',
      desc: 'Frequent voltage surges destroyed PHC vaccine refrigerator. Routine immunization for 45 infants halted.',
      catId: 'cat-4',
      catName: 'Healthcare',
      lat: 23.2620,
      lng: 77.4180,
      urgency: 'critical' as const,
      sev: 96,
      status: 'in_progress' as const,
      instId: 'inst-4',
      instName: 'Public Health & Biomedical Innovation Centre',
      addr: 'Kolar Road PHC, Bhopal, MP',
      img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-infra-1',
      title: 'Submerged bridge culvert cutting off 4 villages during flash rain',
      desc: 'Low-height concrete culvert submerges every time river swells 1 foot. Ambulances cannot cross for up to 18 hours.',
      catId: 'cat-7',
      catName: 'Infrastructure',
      lat: 12.9812,
      lng: 77.6015,
      urgency: 'critical' as const,
      sev: 94,
      status: 'verified' as const,
      instId: 'inst-5',
      instName: 'Centre for Sustainable Urban Infrastructure & Mobility',
      addr: 'Outer Ring Road Tributary Bridge, Bengaluru, KA',
      img: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-access-1',
      title: 'Missing tactile paving and wheelchair ramps at District Transit Terminal',
      desc: 'Over 25,000 daily commuters navigate steep stairs with zero tactile tiles for visually impaired or ramps for wheelchair users.',
      catId: 'cat-8',
      catName: 'Accessibility',
      lat: 12.9730,
      lng: 77.5980,
      urgency: 'high' as const,
      sev: 84,
      status: 'verified' as const,
      instId: 'inst-5',
      instName: 'Centre for Sustainable Urban Infrastructure & Mobility',
      addr: 'Majestic Bus & Metro Interchange, Bengaluru, KA',
      img: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-energy-1',
      title: 'Frequent transformer fire in crowded Old City commercial market',
      desc: 'Overheated overhead transformer sparks daily next to textile shops, posing extreme hazard of catastrophic fire.',
      catId: 'cat-11',
      catName: 'Energy',
      lat: 26.2910,
      lng: 73.0180,
      urgency: 'critical' as const,
      sev: 95,
      status: 'assigned' as const,
      instId: 'inst-1',
      instName: 'IIT Innovation & Water Tech Centre',
      addr: 'Clock Tower Bazaar, Jodhpur, Rajasthan',
      img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-env-1',
      title: 'Industrial chemical runoff discolouring Mutha river bank',
      desc: 'Dark chemical foam floating on river surface near bridge. Fish dying and unbearable stench in morning walkers corridor.',
      catId: 'cat-6',
      catName: 'Environment',
      lat: 18.5180,
      lng: 73.8500,
      urgency: 'high' as const,
      sev: 90,
      status: 'verified' as const,
      instId: 'inst-2',
      instName: 'National Environmental Research & Waste Lab',
      addr: 'Deccan Gymkhana Riverside, Pune, Maharashtra',
      img: 'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-rural-1',
      title: 'Zero mobile connectivity in tribal belt hindering emergency 108 calling',
      desc: '3 remote hamlets require walking 6km uphill to catch signal during medical emergencies or snake bites.',
      catId: 'cat-10',
      catName: 'Rural Development',
      lat: 23.3100,
      lng: 77.3500,
      urgency: 'high' as const,
      sev: 87,
      status: 'under_review' as const,
      instId: 'inst-3',
      instName: 'Agri-Tech Rural Engineering Institute',
      addr: 'Sehore Forest Fringe, MP',
      img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-edu-1',
      title: 'Digital computer lab in rural secondary school locked due to power cuts',
      desc: '20 gifted laptops donated last year cannot be turned on due to 14-hour daily grid load shedding.',
      catId: 'cat-5',
      catName: 'Education',
      lat: 25.2900,
      lng: 82.9500,
      urgency: 'medium' as const,
      sev: 76,
      status: 'verified' as const,
      instId: 'inst-3',
      instName: 'Agri-Tech Rural Engineering Institute',
      addr: 'Mirzapur Border School, UP',
      img: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-urban-1',
      title: 'Severe waterlogging at railway underpass blocking emergency ambulances',
      desc: 'Every 20mm rainfall submerges the underpass by 4 feet due to clogged gravity drains.',
      catId: 'cat-12',
      catName: 'Urban Development',
      lat: 12.9650,
      lng: 77.5850,
      urgency: 'critical' as const,
      sev: 92,
      status: 'verified' as const,
      instId: 'inst-5',
      instName: 'Centre for Sustainable Urban Infrastructure & Mobility',
      addr: 'Okalipuram Underpass, Bengaluru, KA',
      img: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-pub-1',
      title: 'Streetlights non-functional across 3km industrial women workers commute',
      desc: 'Dark highway stretch leading to garment factories causing safety threats for night-shift female workers.',
      catId: 'cat-9',
      catName: 'Public Services',
      lat: 18.5400,
      lng: 73.8300,
      urgency: 'critical' as const,
      sev: 93,
      status: 'verified' as const,
      instId: 'inst-2',
      instName: 'National Environmental Research & Waste Lab',
      addr: 'Bhosari Industrial Corridor, Pune, MH',
      img: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-agri-2',
      title: 'Post-harvest tomato rot due to lack of decentralized cold storage',
      desc: 'Farmers dumping over 10 tons of tomatoes on highway every week due to lack of solar micro-cold rooms.',
      catId: 'cat-3',
      catName: 'Agriculture',
      lat: 25.3400,
      lng: 83.0100,
      urgency: 'high' as const,
      sev: 85,
      status: 'verified' as const,
      instId: 'inst-3',
      instName: 'Agri-Tech Rural Engineering Institute',
      addr: 'Chandauli APMC Mandi, UP',
      img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-health-2',
      title: 'Acute dengue surge in migrant workers slum settlement',
      desc: 'Stagnant water tanks and open construction pits causing 40+ active dengue and malaria hospitalizations.',
      catId: 'cat-4',
      catName: 'Healthcare',
      lat: 23.2450,
      lng: 77.4300,
      urgency: 'critical' as const,
      sev: 95,
      status: 'in_progress' as const,
      instId: 'inst-4',
      instName: 'Public Health & Biomedical Innovation Centre',
      addr: 'Govindpura Labour Colony, Bhopal, MP',
      img: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-infra-2',
      title: 'Cracked bridge pillar on heavily trafficked interstate freight highway',
      desc: 'Structural spalling and exposed rebar on pier 4 of 40-year-old river bridge.',
      catId: 'cat-7',
      catName: 'Infrastructure',
      lat: 26.2500,
      lng: 73.0100,
      urgency: 'critical' as const,
      sev: 97,
      status: 'verified' as const,
      instId: 'inst-1',
      instName: 'IIT Innovation & Water Tech Centre',
      addr: 'NH-62 Luni River Crossing, Jodhpur',
      img: 'https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-access-2',
      title: 'Pedestrian foot-overbridge lacks elevator or ramp for senior citizens',
      desc: 'Elderly citizens forced to cross high-speed 6-lane highway on foot because bridge has 72 steps without lifts.',
      catId: 'cat-8',
      catName: 'Accessibility',
      lat: 18.5250,
      lng: 73.8600,
      urgency: 'high' as const,
      sev: 86,
      status: 'under_review' as const,
      instId: 'inst-5',
      instName: 'Centre for Sustainable Urban Infrastructure & Mobility',
      addr: 'Pune Station Link FOB, MH',
      img: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-env-2',
      title: 'Dense toxic haze from illegal agricultural crop stubble burning',
      desc: 'PM2.5 levels peaking above 480 µg/m³ affecting senior citizen wards and infants.',
      catId: 'cat-6',
      catName: 'Environment',
      lat: 25.3600,
      lng: 82.9600,
      urgency: 'high' as const,
      sev: 89,
      status: 'verified' as const,
      instId: 'inst-2',
      instName: 'National Environmental Research & Waste Lab',
      addr: 'Ghazipur Rural Belt, UP',
      img: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-energy-2',
      title: 'Off-grid solar streetlights battery theft and failure in tribal hamlet',
      desc: '15 solar lights installed last year vandalized; villagers now navigating snake paths in pitch darkness.',
      catId: 'cat-11',
      catName: 'Energy',
      lat: 23.2700,
      lng: 77.3800,
      urgency: 'medium' as const,
      sev: 74,
      status: 'verified' as const,
      instId: 'inst-1',
      instName: 'IIT Innovation & Water Tech Centre',
      addr: 'Bhadbhada Tribal Ward, Bhopal',
      img: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-rural-2',
      title: 'Handloom weavers facing eye strain due to poor indoor illumination',
      desc: '200 traditional silk artisan families working in dark mud workshops with high vision deterioration.',
      catId: 'cat-10',
      catName: 'Rural Development',
      lat: 25.3050,
      lng: 83.0050,
      urgency: 'medium' as const,
      sev: 70,
      status: 'under_review' as const,
      instId: 'inst-3',
      instName: 'Agri-Tech Rural Engineering Institute',
      addr: 'Kotwa Weaver Village, Varanasi',
      img: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'prob-resolved-1',
      title: 'Groundwater fluoride de-ionization system deployed at Mandore PHC',
      desc: 'Successfully implemented low-cost electrolytic defluoridation plant providing 2,000L/day of WHO-grade potable water.',
      catId: 'cat-1',
      catName: 'Water Management',
      lat: 26.3530,
      lng: 73.0425,
      urgency: 'low' as const,
      sev: 30,
      status: 'resolved' as const,
      instId: 'inst-1',
      instName: 'IIT Innovation & Water Tech Centre',
      addr: 'Mandore PHC Compound, Jodhpur',
      img: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=800&q=80'
    }
  ];

  additionalProblems.forEach((item, idx) => {
    const prob: Problem = {
      id: item.id,
      title: item.title,
      description: item.desc,
      category_id: item.catId,
      category_name: item.catName,
      status: item.status,
      urgency: item.urgency,
      latitude: item.lat,
      longitude: item.lng,
      address: item.addr,
      created_by: 'usr-citizen-1',
      author_name: 'Aarav Patel',
      author_email: 'citizen@civicsetu.ai',
      priority_score: Math.min(99, Math.round(item.sev * 0.3 + 12 * 0.25 + 5 * 0.2 + (item.urgency === 'critical' ? 100 : item.urgency === 'high' ? 75 : 50) * 0.15 + 75 * 0.1)),
      severity_score: item.sev,
      duplicate_cluster_id: null,
      cluster_name: undefined,
      supports_count: 22 + idx * 4,
      has_user_supported: idx % 2 === 1,
      images: [item.img],
      assigned_institution_id: item.instId,
      assigned_institution_name: item.instName,
      project_id: item.id === 'prob-health-1' ? 'proj-health-1' : (item.id === 'prob-resolved-1' ? 'proj-water-resolved' : null),
      created_at: new Date(Date.now() - (30 - idx) * 86400000).toISOString(),
      updated_at: new Date(Date.now() - (2 - idx % 3) * 86400000).toISOString()
    };

    const analysis: AIAnalysis = {
      id: `ai-extra-${idx + 1}`,
      problem_id: item.id,
      detected_category: item.catName,
      category_confidence: 94,
      severity: item.urgency,
      severity_confidence: 90,
      priority_score: prob.priority_score,
      summary: `Automated AI analysis: High societal impact challenge detected in ${item.catName}. Requires specialized university R&D collaboration.`,
      keywords: item.title.toLowerCase().split(' ').filter(w => w.length > 4),
      duplicate_score: 22,
      similar_problem_ids: [],
      recommended_actions: [
        `Assign to accredited institution specializing in ${item.catName}`,
        'Initiate multidisciplinary student innovation team',
        'Deploy pilot prototype with field telemetry'
      ],
      priority_breakdown: {
        severityContribution: +(item.sev * 0.3).toFixed(1),
        citizensContribution: +(12 * 0.25).toFixed(1),
        clusterContribution: +(5 * 0.2).toFixed(1),
        urgencyContribution: +((item.urgency === 'critical' ? 100 : item.urgency === 'high' ? 75 : 50) * 0.15).toFixed(1),
        locationRiskContribution: +(75 * 0.1).toFixed(1),
        severityRaw: item.sev,
        citizensCount: 65,
        clusterSize: 1,
        urgencyRaw: item.urgency === 'critical' ? 100 : item.urgency === 'high' ? 75 : 50,
        locationRiskRaw: 75,
        explanation: 'Multi-factor evaluation based on public safety, frequency, and vulnerable community demographics.'
      },
      created_at: prob.created_at
    };

    prob.ai_analysis = analysis;
    seededProblems.push(prob);
    seededAnalyses.push(analysis);
  });

  db.problems = seededProblems;
  db.aiAnalyses = seededAnalyses;

  // 4. Seed Active Innovation Projects (5+ Real Projects)
  const projects: Project[] = [
    {
      id: 'proj-water-1',
      title: 'Mandore IoT Smart Water Distribution & Groundwater Recharge Grid',
      description: 'Engineering deployment of low-cost IoT pipeline flow/pressure telemetry, solar-assisted defluoridation units, and community rainwater recharge shafts.',
      problem_id: 'prob-water-1',
      problem_cluster_id: 'cluster-water-mandore',
      problem_title: 'Mandore Acute Groundwater & Pipeline Restoration Challenge',
      institution_id: 'inst-1',
      institution_name: 'IIT Innovation & Water Tech Centre',
      status: 'development',
      progress: 68,
      start_date: '2025-02-12',
      expected_completion: '2025-05-30',
      prototype_info: 'Pilot telemetry board with LoRaWAN wireless sensor network transmitting pipeline pressure every 60s to municipal dashboard.',
      documents: [
        { name: 'Hydrological_Feasibility_Report_Mandore.pdf', url: '#', size: '3.4 MB' },
        { name: 'IoT_Defluoridation_Schematics_v2.pdf', url: '#', size: '5.1 MB' }
      ],
      members: [
        { id: 'pm-1', project_id: 'proj-water-1', user_id: 'usr-inst-1', user_name: 'Prof. Sunita Deshmukh', user_email: 'institution@civicsetu.ai', role: 'team_lead', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80' },
        { id: 'pm-2', project_id: 'proj-water-1', user_id: 'usr-expert-1', user_name: 'Vikramaditya Sen', user_email: 'expert@civicsetu.ai', role: 'expert', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
        { id: 'pm-3', project_id: 'proj-water-1', user_id: 'usr-stu-1', user_name: 'Rohan Verma (B.Tech Final Year)', user_email: 'rohan.v@iitj.ac.in', role: 'student' },
        { id: 'pm-4', project_id: 'proj-water-1', user_id: 'usr-stu-2', user_name: 'Priya Nair (M.Tech Water Resources)', user_email: 'priya.n@iitj.ac.in', role: 'student' }
      ],
      milestones: [
        { id: 'm-1', project_id: 'proj-water-1', title: 'Groundwater Salinity & GIS Pipeline Mapping', description: 'Comprehensive sensor probe survey across all 20 affected wards in Mandore.', status: 'completed', due_date: '2025-02-28', completed_at: '2025-02-26' },
        { id: 'm-2', project_id: 'proj-water-1', title: 'Telemetry Board Lab Validation & Testing', description: 'Bench testing LoRaWAN pressure transducers under variable flow conditions.', status: 'completed', due_date: '2025-03-15', completed_at: '2025-03-14' },
        { id: 'm-3', project_id: 'proj-water-1', title: 'Field Deployment of 15 IoT Sensor Nodes', description: 'Physical installation at pipeline intersections and school storage tanks.', status: 'in_progress', due_date: '2025-04-10' },
        { id: 'm-4', project_id: 'proj-water-1', title: 'Decentralized Solar Defluoridation Unit Setup', description: 'Commissioning 2,500L/day electrolytic water purification hub at Mandore School.', status: 'pending', due_date: '2025-05-15' }
      ],
      impact_metrics: {
        citizens_impacted: 18500,
        reports_resolved: 20,
        area_covered_km2: 4.8,
        cost_saved_inr: 850000,
        time_saved_days: 45,
        environmental_impact: 'Eliminates 120 diesel water-tanker trips per week and recharges 1.2M litres of groundwater annually.',
        measurable_outcomes: [
          'Fluoride level reduced from 3.8 mg/L to 0.9 mg/L (WHO standard)',
          'Zero pipeline leak delay: AI alerts trigger within 120 seconds',
          'Drinking water access restored for 2,400 students across 3 schools'
        ]
      },
      created_at: new Date('2025-02-12').toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'proj-waste-1',
      title: 'Decentralized Micro-Biomethanation & Smart Sensor Waste Hub',
      description: 'Converting organic school & marketplace solid waste into odorless biogas and compost with AI optical fill-level monitoring bins.',
      problem_id: 'prob-waste-1',
      problem_cluster_id: 'cluster-waste-schools',
      problem_title: 'Urban School Zone Solid Waste & Micro-Segregation Challenge',
      institution_id: 'inst-2',
      institution_name: 'National Environmental Research & Waste Lab',
      status: 'testing',
      progress: 82,
      start_date: '2025-02-16',
      expected_completion: '2025-04-20',
      prototype_info: 'Compact 500kg/day anaerobic digester with ultrasonic waste depth sensors and automated SMS collection alerts.',
      documents: [
        { name: 'NEERI_BioMethanizer_Blueprints.pdf', url: '#', size: '4.2 MB' }
      ],
      members: [
        { id: 'pm-5', project_id: 'proj-waste-1', user_id: 'usr-inst-2', user_name: 'Dr. Anil Kulkarni', user_email: 'kulkarni@neeri.res.in', role: 'team_lead' },
        { id: 'pm-6', project_id: 'proj-waste-1', user_id: 'usr-stu-3', user_name: 'Sneha Joshi (PhD Scholar)', user_email: 'sneha.j@neeri.res.in', role: 'student' }
      ],
      milestones: [
        { id: 'm-5', project_id: 'proj-waste-1', title: 'Baseline Waste Characterization Study', description: 'Quantified organic vs plastic fraction in 15 school dump sites.', status: 'completed', due_date: '2025-02-25', completed_at: '2025-02-24' },
        { id: 'm-6', project_id: 'proj-waste-1', title: 'Smart Bin Ultrasonic Sensor Prototype', description: 'Engineered IP67 dustproof sensor node running on 3-year coin battery.', status: 'completed', due_date: '2025-03-10', completed_at: '2025-03-08' },
        { id: 'm-7', project_id: 'proj-waste-1', title: 'Modular Biomethanation Chamber Fabrication', description: 'Assembling odorless sealed bio-digester adjacent to school canteen.', status: 'in_progress', due_date: '2025-04-05' }
      ],
      impact_metrics: {
        citizens_impacted: 14200,
        reports_resolved: 15,
        area_covered_km2: 2.2,
        cost_saved_inr: 420000,
        time_saved_days: 30,
        environmental_impact: 'Diverts 1.5 tons of organic waste daily from landfill, reducing 450kg methane emissions/month.',
        measurable_outcomes: [
          '100% elimination of open garbage heaps around school boundary',
          'Generates 18kg equivalent LPG cooking gas for school mid-day meal',
          'Zero dengue cases in school zone in post-pilot 60 days'
        ]
      },
      created_at: new Date('2025-02-16').toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'proj-health-1',
      title: 'Solar PCM Hybrid Vaccine Refrigeration Kiosk',
      description: 'Phase Change Material (PCM) thermal storage vaccine cooler keeping 2-8°C steady temperature for 72 hours of zero grid electricity.',
      problem_id: 'prob-health-1',
      problem_title: 'Primary Health Centre cold storage vaccine freezer failure',
      institution_id: 'inst-4',
      institution_name: 'Public Health & Biomedical Innovation Centre',
      status: 'pilot',
      progress: 90,
      start_date: '2025-01-20',
      expected_completion: '2025-04-15',
      members: [
        { id: 'pm-7', project_id: 'proj-health-1', user_id: 'usr-inst-4', user_name: 'Dr. Meenakshi Rao', user_email: 'm.rao@aiims.edu.in', role: 'team_lead' },
        { id: 'pm-8', project_id: 'proj-health-1', user_id: 'usr-expert-1', user_name: 'Vikramaditya Sen', user_email: 'expert@civicsetu.ai', role: 'mentor' }
      ],
      milestones: [
        { id: 'm-8', project_id: 'proj-health-1', title: 'Phase-Change Material Formulation', description: 'Synthesized organic PCM eutectic gel melting at precise 4.2°C.', status: 'completed', due_date: '2025-02-10', completed_at: '2025-02-08' },
        { id: 'm-9', project_id: 'proj-health-1', title: 'Thermal Chamber 96-Hour Stress Test', description: 'Subjected to 48°C ambient heatwave chamber simulation with zero power.', status: 'completed', due_date: '2025-03-01', completed_at: '2025-02-28' },
        { id: 'm-10', project_id: 'proj-health-1', title: 'Kolar PHC Live Field Validation', description: 'Live deployment storing polio, rotavirus, and measles vaccines.', status: 'in_progress', due_date: '2025-04-10' }
      ],
      impact_metrics: {
        citizens_impacted: 8500,
        reports_resolved: 4,
        area_covered_km2: 15.0,
        cost_saved_inr: 650000,
        time_saved_days: 60,
        environmental_impact: 'Zero CFC/HFC refrigerants used; reduces diesel generator fuel burn by 180 litres/month.',
        measurable_outcomes: [
          'Zero vaccine spoilage across 90 continuous days',
          'Immunization coverage restored to 98% across 14 rural hamlets'
        ]
      },
      created_at: new Date('2025-01-20').toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'proj-agri-1',
      title: 'Geotextile Rapid Canal Repair & IoT Gate Telemetry',
      description: 'Rapid interlocking modular concrete-geotextile lining restoring breached canal within 48 hours, paired with ultrasonic water flow meter.',
      problem_id: 'prob-agri-1',
      problem_title: 'Solar drip irrigation canal breach in rural Varanasi farm cluster',
      institution_id: 'inst-3',
      institution_name: 'Agri-Tech Rural Engineering Institute',
      status: 'research',
      progress: 45,
      start_date: '2025-02-25',
      expected_completion: '2025-06-15',
      members: [
        { id: 'pm-9', project_id: 'proj-agri-1', user_id: 'usr-inst-3', user_name: 'Prof. Alok Pandey', user_email: 'pandey@bhu.ac.in', role: 'team_lead' }
      ],
      milestones: [
        { id: 'm-11', project_id: 'proj-agri-1', title: 'Breach Soil Mechanics Assessment', description: 'Drone LiDAR and soil core sample testing at 5 breach locations.', status: 'completed', due_date: '2025-03-05', completed_at: '2025-03-04' },
        { id: 'm-12', project_id: 'proj-agri-1', title: 'Modular Interlocking Block Production', description: 'Fabricating basalt-reinforced lightweight interlocking blocks.', status: 'in_progress', due_date: '2025-04-15' }
      ],
      created_at: new Date('2025-02-25').toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'proj-water-resolved',
      title: 'Mandore PHC Electrochemical Fluoride De-Ionization Plant',
      description: 'Completed and deployed water purification hub providing clean drinking water to over 3,500 residents and patients daily.',
      problem_id: 'prob-resolved-1',
      problem_title: 'Groundwater fluoride de-ionization system deployed at Mandore PHC',
      institution_id: 'inst-1',
      institution_name: 'IIT Innovation & Water Tech Centre',
      status: 'completed',
      progress: 100,
      start_date: '2024-11-01',
      expected_completion: '2025-01-30',
      members: [
        { id: 'pm-10', project_id: 'proj-water-resolved', user_id: 'usr-inst-1', user_name: 'Prof. Sunita Deshmukh', user_email: 'institution@civicsetu.ai', role: 'team_lead' }
      ],
      milestones: [
        { id: 'm-13', project_id: 'proj-water-resolved', title: 'Electrochemical Reactor Design', description: 'Optimized aluminum electrode sacrificial polarity.', status: 'completed', due_date: '2024-11-20', completed_at: '2024-11-18' },
        { id: 'm-14', project_id: 'proj-water-resolved', title: 'Community Water ATM Integration', description: 'RFID card enabled dispensing at ₹0.20/litre.', status: 'completed', due_date: '2025-01-25', completed_at: '2025-01-24' }
      ],
      impact_metrics: {
        citizens_impacted: 3500,
        reports_resolved: 6,
        area_covered_km2: 1.5,
        cost_saved_inr: 1200000,
        time_saved_days: 90,
        environmental_impact: 'Zero toxic chemical sludge; reusable aluminum hydroxide precipitate repurposed for brick manufacturing.',
        measurable_outcomes: [
          'Fluoride dropped from 4.1 ppm to 0.6 ppm',
          '3,500 villagers drinking certified safe water every day'
        ]
      },
      created_at: new Date('2024-11-01').toISOString(),
      updated_at: new Date('2025-01-30').toISOString()
    }
  ];

  db.projects = projects;

  // 5. Seed Initial Solution Directions
  db.solutionDirections = [
    {
      id: 'sd-1',
      problem_id: 'prob-water-1',
      title: 'Decentralized Solar-Powered Defluoridation Units',
      description: 'Install electrochemical aluminum electrode filtration at community water hubs to reduce fluoride from 3.8ppm to <1ppm without wasting water like RO.',
      domain: 'Water Chemistry & Renewable Energy',
      feasibility_score: 92,
      estimated_timeframe: '6-8 weeks',
      key_technologies: ['Electrochemical Coagulation', 'Solar MPPT', 'TDS Sensors'],
      status: 'approved',
      created_by_ai: true,
      votes: 48
    },
    {
      id: 'sd-2',
      problem_id: 'prob-water-1',
      title: 'LoRaWAN Acoustic Leakage Detection Network',
      description: 'Clamp ultrasonic sound transducers along underground distribution junctions to triangulate pipe bursts before water is lost.',
      domain: 'IoT & Telemetry',
      feasibility_score: 88,
      estimated_timeframe: '4-6 weeks',
      key_technologies: ['LoRaWAN', 'Acoustic Sensors', 'GIS Mapping'],
      status: 'in_development',
      created_by_ai: true,
      votes: 35
    },
    {
      id: 'sd-3',
      problem_id: 'prob-water-1',
      title: 'Rooftop Aquifer Gravity Recharge Shafts',
      description: 'Direct monsoon runoffs from large school/public building roofs into filtered borehole shafts to raise regional water table by 15-20ft.',
      domain: 'Hydro-Geology',
      feasibility_score: 95,
      estimated_timeframe: '3-4 weeks',
      key_technologies: ['Sand-Gravel Dual Filters', 'Gravity Infiltration', 'Piezometer'],
      status: 'suggested',
      created_by_ai: true,
      votes: 29
    },
    {
      id: 'sd-4',
      problem_id: 'prob-waste-1',
      title: 'School-Adjacent Compact Anaerobic Bio-Digesters',
      description: 'Process food and organic canteen waste on-site, producing odorless cooking methane gas for mid-day meal kitchens.',
      domain: 'Biotechnology & Circular Economy',
      feasibility_score: 91,
      estimated_timeframe: '5-7 weeks',
      key_technologies: ['Anaerobic Digestion', 'Methane Filtration', 'Slurry Enrichment'],
      status: 'approved',
      created_by_ai: true,
      votes: 52
    },
    {
      id: 'sd-5',
      problem_id: 'prob-waste-1',
      title: 'AI Optical Waste Fill Sensor & Dynamic Route Optimization',
      description: 'Optical distance sensors mounted on public bins that alert municipal sanitation compactors only when bins exceed 80% capacity.',
      domain: 'Smart City & Edge AI',
      feasibility_score: 89,
      estimated_timeframe: '3-5 weeks',
      key_technologies: ['Ultrasonic Sensors', 'Shortest Path Routing Algorithm', 'GSM Telemetry'],
      status: 'in_development',
      created_by_ai: true,
      votes: 41
    }
  ];

  // 6. Seed Notifications
  db.notifications = [
    {
      id: 'notif-1',
      user_id: 'usr-citizen-1',
      title: 'Innovation Project Created!',
      message: 'Your report "Severe water supply disruption in Mandore" has been converted into project "Mandore IoT Smart Water Distribution" by IIT Jodhpur.',
      type: 'assignment',
      is_read: false,
      link: '/projects/proj-water-1',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'notif-2',
      user_id: 'usr-citizen-1',
      title: 'AI Duplicate Cluster Identified',
      message: '20 citizen complaints in Mandore were merged into a Community Challenge with Priority Score 92/100.',
      type: 'analysis',
      is_read: false,
      link: '/challenges/cluster-water-mandore',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'notif-3',
      user_id: 'usr-inst-1',
      title: 'New High Compatibility Challenge Match (95%)',
      message: 'Mandore Water Restoration Challenge matches IIT Jodhpur department expertise. One-click acceptance available.',
      type: 'assignment',
      is_read: false,
      link: '/institution/challenges',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    },
    {
      id: 'notif-4',
      user_id: 'usr-admin-1',
      title: 'Critical Issue Alert',
      message: 'Urgent: Hospital bio-waste dump detected near secondary school in Pune. Priority Score: 98/100.',
      type: 'critical',
      is_read: false,
      link: '/admin/review',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ];

  console.log(`Database initialized: ${db.problems.length} problems, ${db.clusters.length} clusters, ${db.projects.length} projects.`);
}
