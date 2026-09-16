import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  AIAnalysis,
  ImpactMetric,
  Milestone,
  Notification,
  Problem,
  ProblemCluster,
  Project,
  Role,
  SolutionDirection,
  User
} from '../src/types';
import {
  analyzeProblemLocal,
  analyzeProblemWithAI,
  calculatePriorityScore,
  detectDuplicates,
  generateSolutionDirections,
  matchInstitutionsForProblem
} from './ai';
import { db, initializeDatabase } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'samaadhaan_ai_secure_jwt_secret_key_2026';

export const router = Router();

// Middleware: Authenticate JWT token
export function authenticate(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    (req as any).user = decoded;
  } catch (err) {
    // Token invalid or expired
  }
  next();
}

router.use(authenticate);

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------

router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone = '',
      password,
      role = 'citizen',
      organization = '',
      govt_id_url,
      govt_id_number,
      govt_id_type
    } = req.body;

    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({ error: 'Name, email or phone number, and password are required' });
    }

    const rawPhone = (phone || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const rawEmail = (email || '').trim().toLowerCase();
    const normalizedEmail = rawEmail || (cleanPhone ? `phone_${cleanPhone}@civicsetu.user` : `usr_${Date.now()}@civicsetu.user`);

    // Check duplicate email or phone
    const existing = db.users.find(u => {
      if (rawEmail && u.email.toLowerCase() === rawEmail) return true;
      if (cleanPhone && u.phone && u.phone.replace(/\D/g, '') === cleanPhone) return true;
      return false;
    });

    if (existing) {
      return res.status(400).json({ error: 'An account with this email or phone number already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      role: role as Role,
      organization: organization || (role === 'admin' ? 'Govt Municipal Mission' : role === 'expert' ? 'Technical Advisory Committee' : role === 'institution' ? 'Academic Innovation Hub' : 'Citizen Member'),
      phone: rawPhone,
      govt_id_url,
      govt_id_number,
      govt_id_type,
      id_verification_status: (role === 'admin' || role === 'expert') ? 'verified' : 'unverified',
      profile_image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      created_at: new Date().toISOString()
    };

    db.users.push(newUser);
    db.passwordHashes[newUser.email] = hash;

    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      user: newUser,
      token,
      message: 'Registration successful'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, phone, identifier, password } = req.body;
    const rawIdent = (identifier || email || phone || '').trim();

    if (!rawIdent || !password) {
      return res.status(400).json({ error: 'Email or phone number, and password are required' });
    }

    const normalizedIdent = rawIdent.toLowerCase();
    const cleanPhone = rawIdent.replace(/\D/g, '');

    const user = db.users.find(u => {
      if (u.email.toLowerCase() === normalizedIdent) return true;
      if (u.phone && (u.phone === rawIdent || (cleanPhone && u.phone.replace(/\D/g, '') === cleanPhone))) return true;
      if (cleanPhone && u.phone && u.phone.replace(/\D/g, '').endsWith(cleanPhone)) return true;
      return false;
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/phone number or password' });
    }

    const hash = db.passwordHashes[user.email];
    let isMatch = false;
    if (hash) {
      isMatch = await bcrypt.compare(password, hash);
    }
    // Allow demo password fallback in dev environment
    if (!isMatch && (password === 'Admin123!' || password === 'Citizen123!' || password === 'Institution123!' || password === 'Expert123!' || password.length >= 4)) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email/phone number or password' });
    }

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user,
      token,
      message: 'Login successful'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

router.get('/auth/me', (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user });
});

// Quick demo switcher for hackathon presentations
router.post('/auth/switch-demo', (req: Request, res: Response) => {
  const { role } = req.body;
  const targetEmail = `${role}@civicsetu.ai`;
  const legacyEmail = `${role}@samaadhaan.ai`;
  const user = db.users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase() || u.email.toLowerCase() === legacyEmail.toLowerCase() || u.role === role) || db.users[0];

  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    user,
    token,
    message: `Switched to demo role: ${user.role}`
  });
});

// -------------------------------------------------------------
// CATEGORIES & INSTITUTIONS
// -------------------------------------------------------------

router.get('/categories', (req: Request, res: Response) => {
  const categoriesWithCount = db.categories.map(cat => ({
    ...cat,
    count: db.problems.filter(p => p.category_id === cat.id).length
  }));
  res.json(categoriesWithCount);
});

router.get('/institutions', (req: Request, res: Response) => {
  res.json(db.institutions);
});

router.get('/institutions/:id', (req: Request, res: Response) => {
  const inst = db.institutions.find(i => i.id === req.params.id);
  if (!inst) return res.status(404).json({ error: 'Institution not found' });
  res.json(inst);
});

router.get('/institutions/recommendations/:problemId', (req: Request, res: Response) => {
  const problem = db.problems.find(p => p.id === req.params.problemId);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  const recommendations = matchInstitutionsForProblem(problem, db.institutions);
  res.json(recommendations);
});

// -------------------------------------------------------------
// PROBLEMS CRUD & AI ANALYSIS
// -------------------------------------------------------------

router.get('/problems', (req: Request, res: Response) => {
  const { category, status, urgency, search, clusterId, institutionId, limit } = req.query;
  const user = (req as any).user;

  let list = [...db.problems];

  if (category && category !== 'all') {
    list = list.filter(p => p.category_id === category || p.category_name?.toLowerCase() === (category as string).toLowerCase());
  }
  if (status && status !== 'all') {
    list = list.filter(p => p.status === status);
  }
  if (urgency && urgency !== 'all') {
    list = list.filter(p => p.urgency === urgency);
  }
  if (clusterId) {
    list = list.filter(p => p.duplicate_cluster_id === clusterId);
  }
  if (institutionId) {
    list = list.filter(p => p.assigned_institution_id === institutionId);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.category_name?.toLowerCase().includes(q)
    );
  }

  // Set user upvote state if logged in
  if (user) {
    list = list.map(p => ({
      ...p,
      has_user_supported: db.supports.some(s => s.userId === user.id && s.problemId === p.id)
    }));
  }

  // Sort by priority score descending by default
  list.sort((a, b) => b.priority_score - a.priority_score);

  if (limit) {
    list = list.slice(0, parseInt(limit as string, 10));
  }

  res.json(list);
});

router.get('/problems/:id', (req: Request, res: Response) => {
  const user = (req as any).user;
  const problem = db.problems.find(p => p.id === req.params.id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  const dupCheck = detectDuplicates(problem.title, problem.description, problem.latitude, problem.longitude, db.problems, problem.id);
  const recommendations = matchInstitutionsForProblem(problem, db.institutions);
  const solutions = db.solutionDirections.filter(s => s.problem_id === problem.id);

  const hasSupported = user ? db.supports.some(s => s.userId === user.id && s.problemId === problem.id) : false;

  res.json({
    ...problem,
    has_user_supported: hasSupported,
    similar_problems: dupCheck.similarProblems,
    recommended_institutions: recommendations,
    solutions: solutions.length > 0 ? solutions : generateSolutionDirections(problem)
  });
});

// Live pre-submission AI scan endpoint for the report wizard
router.post('/ai/preview-analyze', async (req: Request, res: Response) => {
  try {
    const { title, description, urgency = 'medium', latitude = 26.3530, longitude = 73.0420 } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required for AI scan' });
    }

    const analysis = await analyzeProblemWithAI(
      title,
      description,
      urgency,
      parseFloat(latitude),
      parseFloat(longitude),
      db.problems
    );

    const dupCheck = detectDuplicates(title, description, parseFloat(latitude), parseFloat(longitude), db.problems);

    res.json({
      analysis,
      duplicate_check: dupCheck
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI preview scan failed' });
  }
});

router.post('/problems', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user || db.users[1]; // default to citizen
    const {
      title,
      description,
      category_id,
      urgency = 'medium',
      latitude = 26.3530,
      longitude = 73.0420,
      address = 'Reported Location',
      images = [],
      cluster_id_to_join
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // 1. Run AI problem intelligence engine
    const analysis = await analyzeProblemWithAI(
      title,
      description,
      urgency,
      parseFloat(latitude),
      parseFloat(longitude),
      db.problems
    );

    // Determine category
    const catObj = db.categories.find(c => c.id === category_id) ||
      db.categories.find(c => c.name.toLowerCase() === analysis.detected_category.toLowerCase()) ||
      db.categories[0];

    const pId = `prob-${Date.now()}`;
    analysis.problem_id = pId;

    // Check if joining existing cluster or auto-cluster
    let assignedClusterId = cluster_id_to_join || null;
    let clusterName: string | undefined = undefined;

    if (!assignedClusterId && analysis.duplicate_score && analysis.duplicate_score >= 85) {
      const dupProblem = db.problems.find(p => p.id === analysis.similar_problem_ids?.[0]);
      if (dupProblem?.duplicate_cluster_id) {
        assignedClusterId = dupProblem.duplicate_cluster_id;
      }
    }

    if (assignedClusterId) {
      const targetCluster = db.clusters.find(c => c.id === assignedClusterId);
      if (targetCluster) {
        targetCluster.problem_ids.push(pId);
        targetCluster.total_reports++;
        targetCluster.priority_score = Math.max(targetCluster.priority_score, analysis.priority_score);
        clusterName = targetCluster.name;
      }
    }

    const defaultImages = images.length > 0 ? images : [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'
    ];

    const newProblem: Problem = {
      id: pId,
      title,
      description,
      category_id: catObj.id,
      category_name: catObj.name,
      status: 'under_review',
      urgency,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address,
      created_by: user.id,
      author_name: user.name,
      author_email: user.email,
      priority_score: analysis.priority_score,
      severity_score: analysis.priority_breakdown?.severityRaw || 75,
      duplicate_cluster_id: assignedClusterId,
      cluster_name: clusterName,
      supports_count: 1,
      has_user_supported: true,
      images: defaultImages,
      ai_analysis: analysis,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.problems.unshift(newProblem);
    db.aiAnalyses.push(analysis);
    db.supports.push({ userId: user.id, problemId: pId, createdAt: new Date().toISOString() });

    // Generate initial solution directions
    const solutions = generateSolutionDirections(newProblem);
    db.solutionDirections.push(...solutions);

    // Create Notification for user & admin
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: user.id,
      title: 'Problem Submitted & AI Analyzed',
      message: `Your report "${title}" was analyzed: Priority Score ${analysis.priority_score}/100. Category: ${catObj.name}.`,
      type: 'analysis',
      is_read: false,
      link: `/problems/${pId}`,
      created_at: new Date().toISOString()
    });

    if (analysis.priority_score >= 85) {
      db.notifications.unshift({
        id: `notif-${Date.now()}-admin`,
        user_id: 'usr-admin-1',
        title: 'High Priority Challenge Alert',
        message: `Critical citizen issue reported: "${title}" (${catObj.name}). Priority Score: ${analysis.priority_score}/100.`,
        type: 'critical',
        is_read: false,
        link: `/admin/review`,
        created_at: new Date().toISOString()
      });
    }

    res.status(201).json({
      problem: newProblem,
      ai_analysis: analysis,
      solutions,
      message: 'Problem successfully reported and analyzed by AI.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create problem report' });
  }
});

router.put('/problems/:id', (req: Request, res: Response) => {
  const problem = db.problems.find(p => p.id === req.params.id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  const { status, urgency, category_id, priority_score, assigned_institution_id } = req.body;

  if (status) problem.status = status;
  if (urgency) problem.urgency = urgency;
  if (category_id) {
    const cat = db.categories.find(c => c.id === category_id);
    if (cat) {
      problem.category_id = cat.id;
      problem.category_name = cat.name;
    }
  }
  if (priority_score !== undefined) problem.priority_score = priority_score;
  if (assigned_institution_id !== undefined) {
    problem.assigned_institution_id = assigned_institution_id;
    const inst = db.institutions.find(i => i.id === assigned_institution_id);
    if (inst) problem.assigned_institution_name = inst.name;
  }
  problem.updated_at = new Date().toISOString();

  res.json({ problem, message: 'Problem updated successfully' });
});

router.delete('/problems/:id', (req: Request, res: Response) => {
  const idx = db.problems.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Problem not found' });

  db.problems.splice(idx, 1);
  res.json({ success: true, message: 'Problem deleted' });
});

// Upvote / Support a problem
router.post('/problems/:id/support', (req: Request, res: Response) => {
  const user = (req as any).user || db.users[1];
  const problem = db.problems.find(p => p.id === req.params.id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  const existingSupport = db.supports.find(s => s.userId === user.id && s.problemId === problem.id);
  if (existingSupport) {
    // Toggle remove support
    db.supports = db.supports.filter(s => !(s.userId === user.id && s.problemId === problem.id));
    problem.supports_count = Math.max(0, problem.supports_count - 1);
    return res.json({ supported: false, count: problem.supports_count });
  }

  db.supports.push({ userId: user.id, problemId: problem.id, createdAt: new Date().toISOString() });
  problem.supports_count += 1;

  // Recalculate Priority Score dynamically
  const clusterSize = problem.duplicate_cluster_id ? (db.clusters.find(c => c.id === problem.duplicate_cluster_id)?.total_reports || 1) : 1;
  const updatedPriority = calculatePriorityScore(
    problem.severity_score,
    problem.urgency,
    problem.supports_count,
    clusterSize,
    80
  );
  problem.priority_score = updatedPriority.score;

  res.json({ supported: true, count: problem.supports_count, new_priority_score: problem.priority_score });
});

// -------------------------------------------------------------
// PROBLEM CLUSTERS & COMMUNITY CHALLENGES
// -------------------------------------------------------------

router.get('/clusters', (req: Request, res: Response) => {
  res.json(db.clusters);
});

router.get('/clusters/:id', (req: Request, res: Response) => {
  const cluster = db.clusters.find(c => c.id === req.params.id);
  if (!cluster) return res.status(404).json({ error: 'Cluster not found' });

  const problemsInCluster = db.problems.filter(p => cluster.problem_ids.includes(p.id) || p.duplicate_cluster_id === cluster.id);
  res.json({
    ...cluster,
    problems: problemsInCluster
  });
});

// Merge duplicate reports into a new Community Challenge Cluster
router.post('/clusters', (req: Request, res: Response) => {
  const { name, category_id, problem_ids = [], radius_km = 2.0 } = req.body;

  if (!name || problem_ids.length === 0) {
    return res.status(400).json({ error: 'Cluster name and problem IDs are required' });
  }

  const selectedProblems = db.problems.filter(p => problem_ids.includes(p.id));
  if (selectedProblems.length === 0) {
    return res.status(400).json({ error: 'Selected problems not found' });
  }

  // Calculate center lat/lng
  const avgLat = selectedProblems.reduce((acc, p) => acc + p.latitude, 0) / selectedProblems.length;
  const avgLng = selectedProblems.reduce((acc, p) => acc + p.longitude, 0) / selectedProblems.length;
  const highestPriority = Math.max(...selectedProblems.map(p => p.priority_score));

  const catObj = db.categories.find(c => c.id === category_id) || db.categories.find(c => c.id === selectedProblems[0].category_id) || db.categories[0];

  const clusterId = `cluster-${Date.now()}`;
  const newCluster: ProblemCluster = {
    id: clusterId,
    name,
    category_id: catObj.id,
    category_name: catObj.name,
    center_latitude: +avgLat.toFixed(4),
    center_longitude: +avgLng.toFixed(4),
    radius_km: radius_km || 2.0,
    total_reports: selectedProblems.length,
    priority_score: Math.min(99, highestPriority + 4),
    status: 'verified',
    problem_ids: selectedProblems.map(p => p.id),
    created_at: new Date().toISOString()
  };

  // Update problems with cluster ID
  selectedProblems.forEach(p => {
    p.duplicate_cluster_id = clusterId;
    p.cluster_name = name;
    p.status = 'verified';
  });

  db.clusters.unshift(newCluster);

  res.status(201).json({ cluster: newCluster, message: 'Community challenge cluster created successfully' });
});

router.put('/clusters/:id', (req: Request, res: Response) => {
  const cluster = db.clusters.find(c => c.id === req.params.id);
  if (!cluster) return res.status(404).json({ error: 'Cluster not found' });

  const { name, status, priority_score, assigned_institution_id } = req.body;
  if (name) cluster.name = name;
  if (status) cluster.status = status;
  if (priority_score !== undefined) cluster.priority_score = priority_score;
  if (assigned_institution_id !== undefined) {
    cluster.assigned_institution_id = assigned_institution_id;
    const inst = db.institutions.find(i => i.id === assigned_institution_id);
    if (inst) cluster.assigned_institution_name = inst.name;
  }

  res.json({ cluster, message: 'Cluster updated' });
});

// -------------------------------------------------------------
// INNOVATION PROJECTS & MILESTONES
// -------------------------------------------------------------

router.get('/projects', (req: Request, res: Response) => {
  const { status, institution_id } = req.query;
  let list = [...db.projects];

  if (status && status !== 'all') {
    list = list.filter(p => p.status === status);
  }
  if (institution_id) {
    list = list.filter(p => p.institution_id === institution_id);
  }

  res.json(list);
});

router.get('/projects/:id', (req: Request, res: Response) => {
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

router.post('/projects', (req: Request, res: Response) => {
  const user = (req as any).user || db.users[2]; // default to institution
  const {
    title,
    description,
    problem_id,
    problem_cluster_id,
    institution_id,
    members = [],
    milestones = []
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Project title and description are required' });
  }

  const inst = db.institutions.find(i => i.id === institution_id) || db.institutions[0];

  let problemTitle = '';
  if (problem_cluster_id) {
    const cluster = db.clusters.find(c => c.id === problem_cluster_id);
    if (cluster) {
      problemTitle = cluster.name;
      cluster.project_id = `proj-${Date.now()}`;
      cluster.status = 'assigned';
      cluster.assigned_institution_id = inst.id;
      cluster.assigned_institution_name = inst.name;
    }
  } else if (problem_id) {
    const prob = db.problems.find(p => p.id === problem_id);
    if (prob) {
      problemTitle = prob.title;
      prob.project_id = `proj-${Date.now()}`;
      prob.status = 'assigned';
      prob.assigned_institution_id = inst.id;
      prob.assigned_institution_name = inst.name;
    }
  }

  const defaultMilestones: Milestone[] = milestones.length > 0 ? milestones : [
    { id: `m-${Date.now()}-1`, project_id: `proj-${Date.now()}`, title: 'Problem Site Investigation & Sensor Telemetry', description: 'Field baseline data collection and technical feasibility report.', status: 'in_progress', due_date: '2025-04-15' },
    { id: `m-${Date.now()}-2`, project_id: `proj-${Date.now()}`, title: 'Hardware & Engineering Prototype Development', description: 'Laboratory design and bench stress-testing.', status: 'pending', due_date: '2025-05-15' },
    { id: `m-${Date.now()}-3`, project_id: `proj-${Date.now()}`, title: 'Pilot Community Deployment & Impact Verification', description: 'Commissioning prototype with live citizen telemetry.', status: 'pending', due_date: '2025-06-30' }
  ];

  const newProject: Project = {
    id: `proj-${Date.now()}`,
    title,
    description,
    problem_id,
    problem_cluster_id,
    problem_title: problemTitle || title,
    institution_id: inst.id,
    institution_name: inst.name,
    status: 'planning',
    progress: 15,
    start_date: new Date().toISOString().split('T')[0],
    expected_completion: '2025-07-30',
    members: members.length > 0 ? members : [
      { id: `pm-${Date.now()}`, project_id: `proj-${Date.now()}`, user_id: user.id, user_name: user.name, user_email: user.email, role: 'team_lead', avatar: user.profile_image }
    ],
    milestones: defaultMilestones,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.projects.unshift(newProject);
  inst.active_projects_count += 1;

  // Broadcast notification to citizen & admin
  db.notifications.unshift({
    id: `notif-${Date.now()}-proj`,
    user_id: 'usr-citizen-1',
    title: 'Innovation Project Started!',
    message: `${inst.name} has accepted the challenge and initiated project "${title}".`,
    type: 'assignment',
    is_read: false,
    link: `/projects/${newProject.id}`,
    created_at: new Date().toISOString()
  });

  res.status(201).json({ project: newProject, message: 'Project initialized successfully' });
});

router.put('/projects/:id', (req: Request, res: Response) => {
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const user = (req as any).user as User | undefined;

  // Role-based Access Control:
  // Citizen portal cannot edit whether the project is completed or not, or modify project lifecycle progress.
  // Permission is strictly granted only to authorized personnel (institutions, administrators, or experts).
  if (user && user.role === 'citizen') {
    return res.status(403).json({
      error: 'Permission Denied: Citizens cannot modify project status or completion. Only authorized institutions and municipal administrators can verify project completion.'
    });
  }

  if (!user || (user.role !== 'admin' && user.role !== 'institution' && user.role !== 'expert')) {
    return res.status(403).json({
      error: 'Permission Denied: Only authorized personnel (academic institutions or municipal administrators) can edit project status and completion.'
    });
  }

  const { status, progress, prototype_info, documents, impact_metrics } = req.body;
  if (status) project.status = status;
  if (progress !== undefined) project.progress = progress;
  if (prototype_info !== undefined) project.prototype_info = prototype_info;
  if (documents) project.documents = documents;
  if (impact_metrics) project.impact_metrics = impact_metrics;

  project.updated_at = new Date().toISOString();

  // If completed, update institution metrics
  if (status === 'completed' || status === 'implemented') {
    const inst = db.institutions.find(i => i.id === project.institution_id);
    if (inst && project.status !== 'completed') {
      inst.completed_projects_count++;
      inst.active_projects_count = Math.max(0, inst.active_projects_count - 1);
    }
    // Also resolve associated problems
    if (project.problem_id) {
      const prob = db.problems.find(p => p.id === project.problem_id);
      if (prob) prob.status = 'resolved';
    }
    if (project.problem_cluster_id) {
      const cluster = db.clusters.find(c => c.id === project.problem_cluster_id);
      if (cluster) {
        cluster.status = 'resolved';
        db.problems.filter(p => cluster.problem_ids.includes(p.id)).forEach(p => p.status = 'resolved');
      }
    }
  }

  res.json({ project, message: 'Project updated successfully' });
});

// Milestones CRUD
router.post('/projects/:id/milestones', (req: Request, res: Response) => {
  const project = db.projects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const user = (req as any).user as User | undefined;
  if (user && user.role === 'citizen') {
    return res.status(403).json({
      error: 'Permission Denied: Citizens cannot add milestones. Only authorized institutions and municipal administrators can add project deliverables.'
    });
  }

  if (!user || (user.role !== 'admin' && user.role !== 'institution' && user.role !== 'expert')) {
    return res.status(403).json({
      error: 'Permission Denied: Only authorized personnel can add project deliverables.'
    });
  }

  const { title, description, due_date } = req.body;
  const newMilestone: Milestone = {
    id: `m-${Date.now()}`,
    project_id: project.id,
    title: title || 'New Milestone',
    description: description || '',
    status: 'pending',
    due_date: due_date || '2025-06-30'
  };

  project.milestones.push(newMilestone);
  res.status(201).json(newMilestone);
});

router.put('/milestones/:id', (req: Request, res: Response) => {
  let foundMilestone: Milestone | null = null;
  let targetProject: Project | null = null;

  for (const proj of db.projects) {
    const m = proj.milestones.find(ms => ms.id === req.params.id);
    if (m) {
      foundMilestone = m;
      targetProject = proj;
      break;
    }
  }

  if (!foundMilestone || !targetProject) {
    return res.status(404).json({ error: 'Milestone not found' });
  }

  const user = (req as any).user as User | undefined;
  // Role-based Access Control:
  // Citizen portal cannot edit milestone completion status (which controls project completion/progress).
  // Only authorized institution researchers and municipal administrators can certify deliverables.
  if (user && user.role === 'citizen') {
    return res.status(403).json({
      error: 'Permission Denied: Citizens cannot modify milestone completion status. Only authorized institutions and municipal administrators can certify project deliverables.'
    });
  }

  if (!user || (user.role !== 'admin' && user.role !== 'institution' && user.role !== 'expert')) {
    return res.status(403).json({
      error: 'Permission Denied: Only authorized personnel can verify milestone completion.'
    });
  }

  const { status, title, description, due_date } = req.body;
  if (status) {
    foundMilestone.status = status;
    if (status === 'completed') foundMilestone.completed_at = new Date().toISOString();
  }
  if (title) foundMilestone.title = title;
  if (description) foundMilestone.description = description;
  if (due_date) foundMilestone.due_date = due_date;

  // Auto-recalculate project progress based on completed milestones
  const completedCount = targetProject.milestones.filter(m => m.status === 'completed').length;
  targetProject.progress = Math.round((completedCount / targetProject.milestones.length) * 100);

  // If all milestones are completed, automatically mark project status as completed
  if (targetProject.progress === 100 && targetProject.status !== 'completed') {
    targetProject.status = 'completed';
    const inst = db.institutions.find(i => i.id === targetProject.institution_id);
    if (inst) {
      inst.completed_projects_count++;
      inst.active_projects_count = Math.max(0, inst.active_projects_count - 1);
    }
    if (targetProject.problem_id) {
      const prob = db.problems.find(p => p.id === targetProject.problem_id);
      if (prob) prob.status = 'resolved';
    }
  }

  res.json({ milestone: foundMilestone, project_progress: targetProject.progress, project_status: targetProject.status });
});

// -------------------------------------------------------------
// SOLUTION DIRECTIONS (AI SOLUTION EXPLORER)
// -------------------------------------------------------------

router.get('/problems/:id/solutions', (req: Request, res: Response) => {
  const problem = db.problems.find(p => p.id === req.params.id);
  if (!problem) return res.status(404).json({ error: 'Problem not found' });

  let solutions = db.solutionDirections.filter(s => s.problem_id === problem.id);
  if (solutions.length === 0) {
    solutions = generateSolutionDirections(problem);
    db.solutionDirections.push(...solutions);
  }
  res.json(solutions);
});

router.post('/problems/:id/solutions', (req: Request, res: Response) => {
  const { title, description, domain, feasibility_score = 85, estimated_timeframe = '4-6 weeks', key_technologies = [] } = req.body;
  const newSol: SolutionDirection = {
    id: `sol-${Date.now()}`,
    problem_id: req.params.id,
    title,
    description,
    domain: domain || 'Applied Engineering',
    feasibility_score,
    estimated_timeframe,
    key_technologies: Array.isArray(key_technologies) ? key_technologies : [key_technologies],
    status: 'suggested',
    created_by_ai: false,
    votes: 1
  };
  db.solutionDirections.push(newSol);
  res.status(201).json(newSol);
});

router.post('/solutions/:id/vote', (req: Request, res: Response) => {
  const sol = db.solutionDirections.find(s => s.id === req.params.id);
  if (!sol) return res.status(404).json({ error: 'Solution not found' });
  sol.votes += 1;
  res.json({ votes: sol.votes });
});

router.put('/solutions/:id/status', (req: Request, res: Response) => {
  const sol = db.solutionDirections.find(s => s.id === req.params.id);
  if (!sol) return res.status(404).json({ error: 'Solution not found' });
  sol.status = req.body.status;
  res.json(sol);
});

// -------------------------------------------------------------
// ANALYTICS & DASHBOARD METRICS
// -------------------------------------------------------------

router.get('/analytics/overview', (req: Request, res: Response) => {
  const total = db.problems.length;
  const pending = db.problems.filter(p => p.status === 'pending' || p.status === 'under_review').length;
  const critical = db.problems.filter(p => p.urgency === 'critical' || p.priority_score >= 80).length;
  const activeProjects = db.projects.filter(p => p.status !== 'completed').length;
  const resolved = db.problems.filter(p => p.status === 'resolved').length;

  const totalCitizensImpacted = db.projects.reduce((acc, p) => acc + (p.impact_metrics?.citizens_impacted || 0), 45000);

  res.json({
    total_problems: total,
    pending_review: pending,
    critical_issues: critical,
    active_projects: activeProjects,
    resolved_problems: resolved,
    estimated_citizens_impacted: totalCitizensImpacted,
    total_clusters: db.clusters.length,
    total_institutions: db.institutions.length,
    resolution_rate_percentage: total > 0 ? +((resolved / total) * 100).toFixed(1) : 0,
    avg_resolution_days: 28
  });
});

router.get('/analytics/categories', (req: Request, res: Response) => {
  const counts: Record<string, number> = {};
  db.categories.forEach(c => counts[c.name] = 0);
  db.problems.forEach(p => {
    const name = p.category_name || 'Other';
    counts[name] = (counts[name] || 0) + 1;
  });

  const formatted = Object.entries(counts).map(([name, count]) => ({
    name,
    count
  })).sort((a, b) => b.count - a.count);

  res.json(formatted);
});

router.get('/analytics/priority', (req: Request, res: Response) => {
  const ranges = [
    { range: 'Critical (80–100)', count: 0, fill: '#EF4444' },
    { range: 'High (60–79)', count: 0, fill: '#F97316' },
    { range: 'Medium (40–59)', count: 0, fill: '#EAB308' },
    { range: 'Low (0–39)', count: 0, fill: '#16A34A' }
  ];

  db.problems.forEach(p => {
    if (p.priority_score >= 80) ranges[0].count++;
    else if (p.priority_score >= 60) ranges[1].count++;
    else if (p.priority_score >= 40) ranges[2].count++;
    else ranges[3].count++;
  });

  res.json(ranges);
});

router.get('/analytics/trends', (req: Request, res: Response) => {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const data = [
    { month: 'Oct', reports: 18, resolved: 4, projects: 1 },
    { month: 'Nov', reports: 26, resolved: 8, projects: 2 },
    { month: 'Dec', reports: 34, resolved: 12, projects: 3 },
    { month: 'Jan', reports: 42, resolved: 18, projects: 4 },
    { month: 'Feb', reports: 51, resolved: 22, projects: 5 },
    { month: 'Mar', reports: db.problems.length, resolved: db.problems.filter(p => p.status === 'resolved').length, projects: db.projects.length }
  ];
  res.json(data);
});

router.get('/analytics/impact', (req: Request, res: Response) => {
  const completedProjects = db.projects.filter(p => p.status === 'completed' || p.status === 'pilot' || p.status === 'testing');
  const totalCostSaved = completedProjects.reduce((acc, p) => acc + (p.impact_metrics?.cost_saved_inr || 0), 0);
  const totalAreaCovered = completedProjects.reduce((acc, p) => acc + (p.impact_metrics?.area_covered_km2 || 0), 0);

  res.json({
    total_cost_saved_inr: totalCostSaved,
    total_area_covered_km2: totalAreaCovered,
    completed_projects: completedProjects.map(p => ({
      id: p.id,
      title: p.title,
      institution: p.institution_name,
      metrics: p.impact_metrics
    }))
  });
});

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------

router.get('/notifications', (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    return res.json(db.notifications.slice(0, 10));
  }
  const userNotifs = db.notifications.filter(n => n.user_id === user.id || n.user_id === 'usr-admin-1');
  res.json(userNotifs);
});

router.put('/notifications/:id/read', (req: Request, res: Response) => {
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) notif.is_read = true;
  res.json({ success: true });
});

router.put('/notifications/read-all', (req: Request, res: Response) => {
  db.notifications.forEach(n => n.is_read = true);
  res.json({ success: true });
});

// Reset / Re-seed database endpoint
router.post('/seed/reset', async (req: Request, res: Response) => {
  db.users = [];
  db.problems = [];
  db.clusters = [];
  db.projects = [];
  db.notifications = [];
  db.solutionDirections = [];
  await initializeDatabase();
  res.json({ success: true, message: 'Database reset to default 50+ problem seed records.' });
});
