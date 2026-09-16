import {
  Category,
  Institution,
  Problem,
  ProblemCluster,
  Project,
  SolutionDirection,
  Notification,
  User,
  AIAnalysis
} from '../types';

export const SEED_CATEGORIES: Category[] = [
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

export const SEED_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-1',
    name: 'IIT Innovation & Water Tech Centre',
    description: 'Premier national technology institute specializing in IoT water flow meters, groundwater purification, and smart utility grids.',
    location: 'Jodhpur, Rajasthan',
    type: 'Premier Institute of National Importance (IIT)',
    city: 'Jodhpur',
    state: 'Rajasthan',
    latitude: 26.2389,
    longitude: 73.0243,
    contact_email: 'water-innov@iitj.ac.in',
    website: 'https://iitj.ac.in',
    active_projects_count: 2,
    completed_projects_count: 4,
    created_at: '2025-01-10T00:00:00.000Z',
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
    type: 'National CSIR Research Laboratory',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    contact_email: 'solutions@neeri-lab.res.in',
    website: 'https://neeri.res.in',
    active_projects_count: 1,
    completed_projects_count: 6,
    created_at: '2025-01-15T00:00:00.000Z',
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
    type: 'ICAR Apex Central Institute',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    latitude: 25.3176,
    longitude: 82.9739,
    contact_email: 'agritech@bhu-icar.ac.in',
    website: 'https://icar-agri.ac.in',
    active_projects_count: 2,
    completed_projects_count: 3,
    created_at: '2025-02-01T00:00:00.000Z',
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
    type: 'National AIIMS Medical Research Centre',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    latitude: 23.2599,
    longitude: 77.4126,
    contact_email: 'innovations@aiims-bhopal.edu.in',
    website: 'https://aiimsbhopal.edu.in',
    active_projects_count: 1,
    completed_projects_count: 2,
    created_at: '2025-02-10T00:00:00.000Z',
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
    type: 'IISc Research & Engineering Centre',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    contact_email: 'urban-lab@iisc.ac.in',
    website: 'https://iisc.ac.in',
    active_projects_count: 2,
    completed_projects_count: 5,
    created_at: '2025-02-15T00:00:00.000Z',
    expertise: [
      { id: 'exp-10', institution_id: 'inst-5', category_id: 'cat-7', category_name: 'Infrastructure', expertise_level: 93, keywords: ['potholes', 'flyover', 'sensor monitoring', 'culvert', 'asphalt'] },
      { id: 'exp-11', institution_id: 'inst-5', category_id: 'cat-12', category_name: 'Urban Development', expertise_level: 90, keywords: ['smart traffic', 'flood mapping', 'walkability', 'urban drainage'] },
      { id: 'exp-12', institution_id: 'inst-5', category_id: 'cat-8', category_name: 'Accessibility', expertise_level: 87, keywords: ['accessible transit', 'ramps', 'universal design'] }
    ]
  }
];

export const SEED_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Dr. Rajesh Sharma',
    email: 'admin@civicsetu.ai',
    role: 'admin',
    organization: 'Ministry of Social Innovation & Public Grievances',
    phone: '+91 98765 43210',
    profile_image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    created_at: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-citizen-1',
    name: 'Aarav Patel',
    email: 'citizen@civicsetu.ai',
    role: 'citizen',
    organization: 'Mandore Residents Welfare Association',
    phone: '+91 98123 45678',
    profile_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    created_at: '2025-01-05T00:00:00.000Z'
  },
  {
    id: 'usr-inst-1',
    name: 'Prof. Sunita Deshmukh',
    email: 'institution@civicsetu.ai',
    role: 'institution',
    organization: 'IIT Innovation & Water Tech Centre',
    phone: '+91 97234 56789',
    profile_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    created_at: '2025-01-08T00:00:00.000Z'
  },
  {
    id: 'usr-expert-1',
    name: 'Vikramaditya Sen',
    email: 'expert@civicsetu.ai',
    role: 'expert',
    organization: 'CleanWater Foundation & Hydrology Expert',
    phone: '+91 96345 67890',
    profile_image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    created_at: '2025-01-10T00:00:00.000Z'
  }
];

export const SEED_CLUSTERS: ProblemCluster[] = [
  {
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
    problem_ids: ['prob-water-1', 'prob-water-2', 'prob-water-3'],
    created_at: '2025-02-10T00:00:00.000Z'
  },
  {
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
    problem_ids: ['prob-waste-1', 'prob-waste-2'],
    created_at: '2025-02-14T00:00:00.000Z'
  }
];

export const SEED_PROBLEMS: Problem[] = [
  {
    id: 'prob-water-1',
    title: 'Severe water supply disruption in Mandore Ward 4',
    description: 'Water has not arrived in pipelines for 6 consecutive days. Tankers are charging exorbitant rates.',
    category_id: 'cat-1',
    category_name: 'Water Management',
    status: 'assigned',
    urgency: 'critical',
    latitude: 26.3530,
    longitude: 73.0420,
    address: 'Mandore Area, Jodhpur, Rajasthan 342004',
    created_by: 'usr-citizen-1',
    author_name: 'Aarav Patel',
    author_email: 'citizen@civicsetu.ai',
    priority_score: 95,
    severity_score: 95,
    duplicate_cluster_id: 'cluster-water-mandore',
    cluster_name: 'Mandore Acute Groundwater & Pipeline Restoration Challenge',
    supports_count: 74,
    has_user_supported: true,
    images: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80'
    ],
    assigned_institution_id: 'inst-1',
    assigned_institution_name: 'IIT Innovation & Water Tech Centre',
    project_id: 'proj-water-1',
    created_at: '2025-02-05T00:00:00.000Z',
    updated_at: '2025-02-28T00:00:00.000Z',
    ai_analysis: {
      id: 'ai-water-1',
      problem_id: 'prob-water-1',
      detected_category: 'Water Management',
      category_confidence: 98,
      severity: 'critical',
      severity_confidence: 95,
      priority_score: 95,
      summary: 'Critical civic emergency: 6-day pipeline breakdown in high-density residential zone. Linked with 19 correlated complaints.',
      keywords: ['water shortage', 'mandore', 'pipeline', 'groundwater', 'salinity', 'drinking supply'],
      duplicate_score: 92,
      similar_problem_ids: ['prob-water-2', 'prob-water-3'],
      recommended_actions: [
        'Activate Mandore Water Restoration Challenge cluster',
        'Deploy IIT Jodhpur IoT pressure & salinity sensor testbed',
        'Coordinate municipal emergency tanker routes with GIS telemetry'
      ],
      created_at: '2025-02-05T00:00:00.000Z'
    }
  },
  {
    id: 'prob-waste-1',
    title: 'Garbage accumulation near Government Girls Model School',
    description: 'Over 3 tonnes of uncollected solid waste lying 10 meters from the school playground. Stray dogs and foul stench.',
    category_id: 'cat-2',
    category_name: 'Sanitation',
    status: 'in_progress',
    urgency: 'critical',
    latitude: 18.5310,
    longitude: 73.8440,
    address: 'Shivajinagar School Zone, Pune, Maharashtra 411005',
    created_by: 'usr-citizen-1',
    author_name: 'Aarav Patel',
    author_email: 'citizen@civicsetu.ai',
    priority_score: 92,
    severity_score: 93,
    duplicate_cluster_id: 'cluster-waste-schools',
    cluster_name: 'Urban School Zone Solid Waste & Micro-Segregation Challenge',
    supports_count: 58,
    has_user_supported: true,
    images: [
      'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80'
    ],
    assigned_institution_id: 'inst-2',
    assigned_institution_name: 'National Environmental Research & Waste Lab',
    project_id: 'proj-waste-1',
    created_at: '2025-02-10T00:00:00.000Z',
    updated_at: '2025-02-27T00:00:00.000Z',
    ai_analysis: {
      id: 'ai-waste-1',
      problem_id: 'prob-waste-1',
      detected_category: 'Sanitation',
      category_confidence: 98,
      severity: 'critical',
      severity_confidence: 94,
      priority_score: 92,
      summary: 'Hazardous waste accumulation next to educational facility causing respiratory risks and disease vector breeding.',
      keywords: ['garbage', 'school zone', 'waste dumping', 'sanitation', 'plastic burning'],
      duplicate_score: 89,
      similar_problem_ids: [],
      recommended_actions: [
        'Form Pune School Zone Cleanliness Taskforce',
        'Deploy NEERI decentralized bio-methanation and smart sensor bins'
      ],
      created_at: '2025-02-10T00:00:00.000Z'
    }
  },
  {
    id: 'prob-agri-1',
    title: 'Solar drip irrigation canal breach in rural farm cluster',
    description: 'Canal embankment collapsed, depriving 120 smallholder farmers of tail-end irrigation during wheat sowing.',
    category_id: 'cat-3',
    category_name: 'Agriculture',
    status: 'assigned',
    urgency: 'high',
    latitude: 25.3210,
    longitude: 82.9810,
    address: 'Rohania Block, Varanasi, UP 221108',
    created_by: 'usr-citizen-1',
    author_name: 'Aarav Patel',
    author_email: 'citizen@civicsetu.ai',
    priority_score: 88,
    severity_score: 88,
    duplicate_cluster_id: null,
    supports_count: 42,
    has_user_supported: false,
    images: ['https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'],
    assigned_institution_id: 'inst-3',
    assigned_institution_name: 'Agri-Tech Rural Engineering Institute',
    project_id: 'proj-agri-1',
    created_at: '2025-02-15T00:00:00.000Z',
    updated_at: '2025-02-26T00:00:00.000Z'
  },
  {
    id: 'prob-health-1',
    title: 'Primary Health Centre cold storage vaccine freezer failure',
    description: 'Frequent voltage surges destroyed PHC vaccine refrigerator. Routine immunization for 45 infants halted.',
    category_id: 'cat-4',
    category_name: 'Healthcare',
    status: 'in_progress',
    urgency: 'critical',
    latitude: 23.2620,
    longitude: 77.4180,
    address: 'Kolar Road PHC, Bhopal, MP 462042',
    created_by: 'usr-citizen-1',
    author_name: 'Aarav Patel',
    author_email: 'citizen@civicsetu.ai',
    priority_score: 96,
    severity_score: 96,
    duplicate_cluster_id: null,
    supports_count: 65,
    has_user_supported: true,
    images: ['https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'],
    assigned_institution_id: 'inst-4',
    assigned_institution_name: 'Public Health & Biomedical Innovation Centre',
    project_id: 'proj-health-1',
    created_at: '2025-01-18T00:00:00.000Z',
    updated_at: '2025-02-28T00:00:00.000Z'
  },
  {
    id: 'prob-infra-1',
    title: 'Submerged bridge culvert cutting off 4 villages during flash rain',
    description: 'Low-height concrete culvert submerges every time river swells 1 foot. Ambulances cannot cross for up to 18 hours.',
    category_id: 'cat-7',
    category_name: 'Infrastructure',
    status: 'verified',
    urgency: 'critical',
    latitude: 12.9812,
    longitude: 77.6015,
    address: 'Outer Ring Road Tributary Bridge, Bengaluru, KA',
    created_by: 'usr-citizen-1',
    author_name: 'Aarav Patel',
    author_email: 'citizen@civicsetu.ai',
    priority_score: 94,
    severity_score: 94,
    duplicate_cluster_id: null,
    supports_count: 49,
    has_user_supported: false,
    images: ['https://images.unsplash.com/photo-1545459720-aac8509eb02c?auto=format&fit=crop&w=800&q=80'],
    assigned_institution_id: 'inst-5',
    assigned_institution_name: 'Centre for Sustainable Urban Infrastructure & Mobility',
    created_at: '2025-02-12T00:00:00.000Z',
    updated_at: '2025-02-25T00:00:00.000Z'
  },
  {
    id: 'prob-resolved-1',
    title: 'Groundwater fluoride de-ionization system deployed at Mandore PHC',
    description: 'Successfully implemented low-cost electrolytic defluoridation plant providing 2,000L/day of WHO-grade potable water.',
    category_id: 'cat-1',
    category_name: 'Water Management',
    status: 'resolved',
    urgency: 'low',
    latitude: 26.3530,
    longitude: 73.0425,
    address: 'Mandore PHC Compound, Jodhpur, Rajasthan',
    created_by: 'usr-citizen-1',
    author_name: 'Aarav Patel',
    author_email: 'citizen@civicsetu.ai',
    priority_score: 30,
    severity_score: 30,
    duplicate_cluster_id: null,
    supports_count: 89,
    has_user_supported: true,
    images: ['https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=800&q=80'],
    assigned_institution_id: 'inst-1',
    assigned_institution_name: 'IIT Innovation & Water Tech Centre',
    project_id: 'proj-water-resolved',
    created_at: '2024-11-01T00:00:00.000Z',
    updated_at: '2025-01-30T00:00:00.000Z'
  }
];

export const SEED_PROJECTS: Project[] = [
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
      { id: 'pm-2', project_id: 'proj-water-1', user_id: 'usr-expert-1', user_name: 'Vikramaditya Sen', user_email: 'expert@civicsetu.ai', role: 'mentor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' }
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
    created_at: '2025-02-12T00:00:00.000Z',
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
      { id: 'pm-5', project_id: 'proj-waste-1', user_id: 'usr-inst-2', user_name: 'Dr. Anil Kulkarni', user_email: 'kulkarni@neeri.res.in', role: 'team_lead' }
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
    created_at: '2025-02-16T00:00:00.000Z',
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
    created_at: '2025-01-20T00:00:00.000Z',
    updated_at: new Date().toISOString()
  }
];

export const SEED_SOLUTIONS: SolutionDirection[] = [
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
  }
];

export const SEED_NOTIFICATIONS: Notification[] = [
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
  }
];
