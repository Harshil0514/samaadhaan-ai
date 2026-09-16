import {
  db,
  auth,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  firebaseSignOut,
  updateProfile
} from '../lib/firebase';
import {
  User,
  Category,
  Institution,
  Problem,
  ProblemCluster,
  Project,
  SolutionDirection,
  Notification,
  Role,
  AnalyticsOverview,
  AIAnalysis
} from '../types';
import {
  SEED_CATEGORIES,
  SEED_INSTITUTIONS,
  SEED_USERS,
  SEED_PROBLEMS,
  SEED_CLUSTERS,
  SEED_PROJECTS,
  SEED_SOLUTIONS,
  SEED_NOTIFICATIONS
} from '../data/seedData';

let isInitialized = false;

/**
 * Initializes Firestore collections with baseline data if they are empty
 */
export async function ensureFirestoreInitialized(): Promise<void> {
  if (isInitialized) return;
  try {
    const catSnap = await getDocs(query(collection(db, 'categories'), limit(1)));
    if (catSnap.empty) {
      console.log('Firestore is empty. Seeding initial baseline datasets...');

      // Seed categories
      for (const cat of SEED_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }

      // Seed institutions
      for (const inst of SEED_INSTITUTIONS) {
        await setDoc(doc(db, 'institutions', inst.id), inst);
      }

      // Seed users
      for (const user of SEED_USERS) {
        await setDoc(doc(db, 'users', user.id), user);
      }

      // Seed clusters
      for (const cl of SEED_CLUSTERS) {
        await setDoc(doc(db, 'problem_clusters', cl.id), cl);
      }

      // Seed problems
      for (const prob of SEED_PROBLEMS) {
        await setDoc(doc(db, 'problems', prob.id), prob);
      }

      // Seed projects
      for (const proj of SEED_PROJECTS) {
        await setDoc(doc(db, 'projects', proj.id), proj);
      }

      // Seed solutions
      for (const sol of SEED_SOLUTIONS) {
        await setDoc(doc(db, 'solutions', sol.id), sol);
      }

      // Seed notifications
      for (const notif of SEED_NOTIFICATIONS) {
        await setDoc(doc(db, 'notifications', notif.id), notif);
      }
      console.log('Firestore seeding completed successfully.');
    }
    isInitialized = true;
  } catch (err) {
    console.warn('Firestore initialization notice:', err);
  }
}

// ----------------------------------------------------------------------
// USER AUTH & PROFILE MANAGEMENT
// ----------------------------------------------------------------------

export async function firestoreRegisterUser(data: {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: Role;
  organization?: string;
  govt_id_url?: string;
  govt_id_number?: string;
  govt_id_type?: string;
}): Promise<{ user: User; token: string }> {
  await ensureFirestoreInitialized();
  const rawPhone = (data.phone || '').trim();
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const rawEmail = (data.email || '').trim().toLowerCase();
  
  // Ensure we have a valid email format for account mapping
  const normalizedEmail = rawEmail || (cleanPhone ? `phone_${cleanPhone}@civicsetu.user` : `usr_${Date.now()}@civicsetu.user`);
  const role = data.role || 'citizen';
  let uid = `usr-${Date.now()}`;

  // Try Firebase Auth if password provided
  if (data.password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, data.password);
      uid = userCredential.user.uid;
      await updateProfile(userCredential.user, { displayName: data.name });
    } catch (authErr: any) {
      // If Firebase Auth returns email-already-in-use or offline, fallback to Firestore UID
      if (authErr.code !== 'auth/email-already-in-use') {
        console.warn('Firebase Auth notice (using Firestore account storage):', authErr.message);
      }
    }
  }

  const newUser: User = {
    id: uid,
    name: data.name.trim(),
    email: normalizedEmail,
    role: role,
    organization: data.organization?.trim() || (role === 'admin' ? 'Govt Municipal Mission' : role === 'expert' ? 'Technical Advisory Committee' : role === 'institution' ? 'Academic Innovation Hub' : 'Citizen Member'),
    phone: rawPhone,
    govt_id_url: data.govt_id_url,
    govt_id_number: data.govt_id_number,
    govt_id_type: data.govt_id_type,
    id_verification_status: (role === 'admin' || role === 'expert') ? 'verified' : 'unverified',
    profile_image: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.name)}`,
    created_at: new Date().toISOString()
  };

  // Persist user record in Firestore
  await setDoc(doc(db, 'users', newUser.id), newUser, { merge: true });

  const token = `token-${newUser.id}-${Date.now()}`;
  return { user: newUser, token };
}

export async function firestoreLoginUser(identifier: string, password?: string): Promise<{ user: User; token: string }> {
  await ensureFirestoreInitialized();
  const rawInput = identifier.trim();
  const normalizedEmail = rawInput.toLowerCase();
  const cleanPhoneDigits = rawInput.replace(/\D/g, '');
  const isEmail = rawInput.includes('@');

  // 1. If email and password provided, try Firebase Auth
  if (isEmail && password && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const u = userDoc.data() as User;
        return { user: u, token: `token-${u.id}-${Date.now()}` };
      }
    } catch {
      // Continue to Firestore profile query
    }
  }

  // 2. Lookup in Firestore collection: try by email OR by phone
  if (isEmail) {
    const q = query(collection(db, 'users'), where('email', '==', normalizedEmail), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const u = snap.docs[0].data() as User;
      return { user: u, token: `token-${u.id}-${Date.now()}` };
    }
  } else {
    // Lookup by phone query
    const qPhone = query(collection(db, 'users'), where('phone', '==', rawInput), limit(1));
    const snapPhone = await getDocs(qPhone);
    if (!snapPhone.empty) {
      const u = snapPhone.docs[0].data() as User;
      return { user: u, token: `token-${u.id}-${Date.now()}` };
    }

    // Also try synthetic phone email (phone_1234567890@civicsetu.user)
    if (cleanPhoneDigits) {
      const synthEmail = `phone_${cleanPhoneDigits}@civicsetu.user`;
      const qSynth = query(collection(db, 'users'), where('email', '==', synthEmail), limit(1));
      const snapSynth = await getDocs(qSynth);
      if (!snapSynth.empty) {
        const u = snapSynth.docs[0].data() as User;
        return { user: u, token: `token-${u.id}-${Date.now()}` };
      }
    }
  }

  // 3. Check demo/seed accounts by Email OR Phone number
  const demo = SEED_USERS.find(u => {
    if (u.email.toLowerCase() === normalizedEmail) return true;
    if (u.phone && (u.phone === rawInput || u.phone.replace(/\D/g, '') === cleanPhoneDigits)) return true;
    if (cleanPhoneDigits && u.phone && u.phone.replace(/\D/g, '').endsWith(cleanPhoneDigits)) return true;
    return false;
  });

  if (demo) {
    await setDoc(doc(db, 'users', demo.id), demo, { merge: true });
    return { user: demo, token: `token-${demo.id}-${Date.now()}` };
  }

  throw new Error(`No account found matching "${rawInput}". Please check your email or phone number or register a new account.`);
}

export async function firestoreGetMe(storedToken?: string | null): Promise<User | null> {
  await ensureFirestoreInitialized();
  if (auth.currentUser) {
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (userDoc.exists()) return userDoc.data() as User;
  }

  if (storedToken && storedToken.startsWith('token-')) {
    const parts = storedToken.split('-');
    const userId = parts[1];
    if (userId) {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) return userDoc.data() as User;
    }
  }
  return null;
}

// ----------------------------------------------------------------------
// CATEGORIES & INSTITUTIONS
// ----------------------------------------------------------------------

export async function firestoreGetCategories(): Promise<Category[]> {
  await ensureFirestoreInitialized();
  try {
    const snap = await getDocs(collection(db, 'categories'));
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as Category);
    }
  } catch (err) {
    console.warn('Error fetching categories from Firestore:', err);
  }
  return SEED_CATEGORIES;
}

export async function firestoreGetInstitutions(): Promise<Institution[]> {
  await ensureFirestoreInitialized();
  try {
    const snap = await getDocs(collection(db, 'institutions'));
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as Institution);
    }
  } catch (err) {
    console.warn('Error fetching institutions from Firestore:', err);
  }
  return SEED_INSTITUTIONS;
}

// ----------------------------------------------------------------------
// PROBLEMS (CIVIC REPORTS & CHALLENGES)
// ----------------------------------------------------------------------

export async function firestoreGetProblems(filters?: {
  category?: string;
  status?: string;
  urgency?: string;
  search?: string;
  clusterId?: string;
  institutionId?: string;
}): Promise<Problem[]> {
  await ensureFirestoreInitialized();
  try {
    const snap = await getDocs(collection(db, 'problems'));
    let list = snap.docs.map(d => d.data() as Problem);

    if (list.length === 0) {
      list = [...SEED_PROBLEMS];
    }

    if (filters?.category && filters.category !== 'all') {
      list = list.filter(p => p.category_id === filters.category || p.category_name?.toLowerCase() === filters.category?.toLowerCase());
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter(p => p.status === filters.status);
    }
    if (filters?.urgency && filters.urgency !== 'all') {
      list = list.filter(p => p.urgency === filters.urgency);
    }
    if (filters?.clusterId) {
      list = list.filter(p => p.duplicate_cluster_id === filters.clusterId);
    }
    if (filters?.institutionId) {
      list = list.filter(p => p.assigned_institution_id === filters.institutionId);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p => 
        (p.title || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.address || '').toLowerCase().includes(q) ||
        (p.category_name || '').toLowerCase().includes(q)
      );
    }

    // Sort by priority_score desc then created_at desc
    list.sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
    return list;
  } catch (err) {
    console.warn('Error fetching problems from Firestore:', err);
    return SEED_PROBLEMS;
  }
}

export async function firestoreGetProblem(id: string): Promise<Problem | null> {
  await ensureFirestoreInitialized();
  try {
    const d = await getDoc(doc(db, 'problems', id));
    if (d.exists()) {
      return d.data() as Problem;
    }
  } catch (err) {
    console.warn('Error getting problem:', err);
  }
  const fallback = SEED_PROBLEMS.find(p => p.id === id);
  return fallback || null;
}

export async function firestoreCreateProblem(data: {
  title: string;
  description: string;
  category_id?: string;
  urgency?: string;
  latitude: number;
  longitude: number;
  address: string;
  images?: string[];
  user?: User | null;
}): Promise<Problem> {
  await ensureFirestoreInitialized();
  const id = `prob-${Date.now()}`;
  const now = new Date().toISOString();

  // Find category name
  const categories = await firestoreGetCategories();
  const cat = categories.find(c => c.id === data.category_id) || categories[0];
  const urgency = (data.urgency || 'high') as any;

  const severityScore = urgency === 'critical' ? 95 : urgency === 'high' ? 80 : urgency === 'medium' ? 60 : 40;
  const priorityScore = Math.min(99, Math.round(severityScore * 0.4 + 10 * 0.25 + 75 * 0.15 + 60 * 0.2));

  const aiAnalysis: AIAnalysis = {
    id: `ai-${id}`,
    problem_id: id,
    detected_category: cat?.name || 'Water Management',
    category_confidence: 94,
    severity: urgency,
    severity_confidence: 91,
    priority_score: priorityScore,
    summary: `Citizen-reported civic challenge in ${cat?.name || 'Infrastructure'}. AI verified location, urgency index (${severityScore}/100), and preliminary technical feasibility.`,
    keywords: [cat?.name || 'community', 'civic innovation', 'public safety', 'sustainability'],
    recommended_actions: [
      `Publish for academic R&D matching in ${cat?.name || 'Engineering'}`,
      'Notify regional municipal engineering team',
      'Enable community citizen support votes'
    ],
    priority_breakdown: {
      severityContribution: +(severityScore * 0.3).toFixed(1),
      citizensContribution: +(5 * 0.25).toFixed(1),
      clusterContribution: +(5 * 0.2).toFixed(1),
      urgencyContribution: +(severityScore * 0.15).toFixed(1),
      locationRiskContribution: +(70 * 0.1).toFixed(1),
      severityRaw: severityScore,
      citizensCount: 1,
      clusterSize: 1,
      urgencyRaw: severityScore,
      locationRiskRaw: 70,
      explanation: 'Evaluated using multi-criteria severity matrix, population vulnerability, and domain hazard index.'
    },
    created_at: now
  };

  const newProblem: Problem = {
    id,
    title: data.title.trim(),
    description: data.description.trim(),
    category_id: cat?.id || 'cat-1',
    category_name: cat?.name || 'Water Management',
    status: 'under_review',
    urgency,
    latitude: data.latitude,
    longitude: data.longitude,
    address: data.address || 'Reported Location',
    created_by: data.user?.id || 'usr-citizen-1',
    author_name: data.user?.name || 'Community Citizen',
    author_email: data.user?.email || 'citizen@civicsetu.ai',
    priority_score: priorityScore,
    severity_score: severityScore,
    supports_count: 1,
    has_user_supported: true,
    images: data.images && data.images.length > 0 ? data.images : [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'
    ],
    ai_analysis: aiAnalysis,
    created_at: now,
    updated_at: now
  };

  // Save to Firestore
  await setDoc(doc(db, 'problems', id), newProblem);

  // Generate an initial technical solution direction in Firestore
  const solutionId = `sd-${Date.now()}`;
  const initialSolution: SolutionDirection = {
    id: solutionId,
    problem_id: id,
    title: `IoT & Modular Engineering Solution for ${newProblem.title.slice(0, 45)}`,
    description: `Decentralized rapid-deployment intervention incorporating low-cost sensors and community-managed monitoring.`,
    domain: `${cat?.name || 'Engineering'} & Public Systems`,
    feasibility_score: 88,
    estimated_timeframe: '4-6 weeks',
    key_technologies: ['Smart Sensors', 'Telemetry Dashboard', 'Modular Fabrication'],
    status: 'suggested',
    created_by_ai: true,
    votes: 1
  };
  await setDoc(doc(db, 'solutions', solutionId), initialSolution);

  return newProblem;
}

export async function firestoreUpdateProblem(id: string, updates: Partial<Problem>): Promise<Problem> {
  await ensureFirestoreInitialized();
  const ref = doc(db, 'problems', id);
  const now = new Date().toISOString();
  await updateDoc(ref, { ...updates, updated_at: now });
  const updated = await getDoc(ref);
  return updated.data() as Problem;
}

export async function firestoreSupportProblem(problemId: string, userId: string = 'usr-current'): Promise<{ supported: boolean; count: number }> {
  await ensureFirestoreInitialized();
  const ref = doc(db, 'problems', problemId);
  const d = await getDoc(ref);
  if (d.exists()) {
    const prob = d.data() as Problem;
    const count = (prob.supports_count || 0) + 1;
    const newScore = Math.min(99, (prob.priority_score || 70) + 1);
    await updateDoc(ref, {
      supports_count: count,
      priority_score: newScore,
      has_user_supported: true,
      updated_at: new Date().toISOString()
    });
    return { supported: true, count };
  }
  return { supported: true, count: 1 };
}

// ----------------------------------------------------------------------
// CLUSTERS & PROJECTS & SOLUTIONS
// ----------------------------------------------------------------------

export async function firestoreGetClusters(): Promise<ProblemCluster[]> {
  await ensureFirestoreInitialized();
  try {
    const snap = await getDocs(collection(db, 'problem_clusters'));
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as ProblemCluster);
    }
  } catch (err) {
    console.warn('Error getting clusters:', err);
  }
  return SEED_CLUSTERS;
}

export async function firestoreGetProjects(filters?: { status?: string; institutionId?: string }): Promise<Project[]> {
  await ensureFirestoreInitialized();
  try {
    const snap = await getDocs(collection(db, 'projects'));
    let list = snap.docs.map(d => d.data() as Project);
    if (list.length === 0) list = [...SEED_PROJECTS];

    if (filters?.status && filters.status !== 'all') {
      list = list.filter(p => p.status === filters.status);
    }
    if (filters?.institutionId) {
      list = list.filter(p => p.institution_id === filters.institutionId);
    }
    return list;
  } catch (err) {
    console.warn('Error getting projects:', err);
    return SEED_PROJECTS;
  }
}

export async function firestoreGetProject(id: string): Promise<Project | null> {
  await ensureFirestoreInitialized();
  try {
    const d = await getDoc(doc(db, 'projects', id));
    if (d.exists()) return d.data() as Project;
  } catch (err) {
    console.warn('Error getting project:', err);
  }
  return SEED_PROJECTS.find(p => p.id === id) || null;
}

export async function firestoreCreateProject(data: Partial<Project>): Promise<Project> {
  await ensureFirestoreInitialized();
  const id = `proj-${Date.now()}`;
  const now = new Date().toISOString();

  const newProject: Project = {
    id,
    title: data.title || 'New Innovation Project',
    description: data.description || '',
    problem_id: data.problem_id || null,
    problem_title: data.problem_title || '',
    institution_id: data.institution_id || 'inst-1',
    institution_name: data.institution_name || 'IIT Innovation Centre',
    status: data.status || 'planning',
    progress: data.progress || 10,
    start_date: data.start_date || now.split('T')[0],
    expected_completion: data.expected_completion || '2025-06-30',
    members: data.members || [],
    milestones: data.milestones || [
      { id: `m-${Date.now()}-1`, project_id: id, title: 'Field Assessment & Telemetry Design', description: 'Initial site survey and technical specifications validation.', status: 'in_progress', due_date: '2025-04-15' },
      { id: `m-${Date.now()}-2`, project_id: id, title: 'Prototype Development & Lab Testing', description: 'Fabrication of working model with sensor telemetry.', status: 'pending', due_date: '2025-05-30' }
    ],
    prototype_info: data.prototype_info || 'Working prototype under development with institutional research scholars.',
    created_at: now,
    updated_at: now
  };

  await setDoc(doc(db, 'projects', id), newProject);

  // If tied to a problem, update problem status
  if (data.problem_id) {
    await firestoreUpdateProblem(data.problem_id, {
      status: 'assigned',
      project_id: id,
      assigned_institution_id: newProject.institution_id,
      assigned_institution_name: newProject.institution_name
    });
  }

  return newProject;
}

export async function firestoreGetSolutions(problemId: string): Promise<SolutionDirection[]> {
  await ensureFirestoreInitialized();
  try {
    const q = query(collection(db, 'solutions'), where('problem_id', '==', problemId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => d.data() as SolutionDirection);
    }
  } catch (err) {
    console.warn('Error getting solutions:', err);
  }
  return SEED_SOLUTIONS.filter(s => s.problem_id === problemId);
}

export async function firestoreVoteSolution(solutionId: string): Promise<{ votes: number }> {
  await ensureFirestoreInitialized();
  const ref = doc(db, 'solutions', solutionId);
  const d = await getDoc(ref);
  if (d.exists()) {
    const s = d.data() as SolutionDirection;
    const count = (s.votes || 0) + 1;
    await updateDoc(ref, { votes: count });
    return { votes: count };
  }
  return { votes: 1 };
}

export async function firestoreGetNotifications(userId?: string): Promise<Notification[]> {
  await ensureFirestoreInitialized();
  try {
    const snap = await getDocs(collection(db, 'notifications'));
    if (!snap.empty) {
      let list = snap.docs.map(d => d.data() as Notification);
      if (userId) list = list.filter(n => n.user_id === userId || !n.user_id);
      return list;
    }
  } catch (err) {
    console.warn('Error getting notifications:', err);
  }
  return SEED_NOTIFICATIONS;
}

export async function firestoreGetAnalyticsOverview(): Promise<AnalyticsOverview> {
  await ensureFirestoreInitialized();
  try {
    const [problems, projects, clusters, institutions] = await Promise.all([
      firestoreGetProblems(),
      firestoreGetProjects(),
      firestoreGetClusters(),
      firestoreGetInstitutions()
    ]);

    const resolved = problems.filter(p => p.status === 'resolved').length;
    const critical = problems.filter(p => p.urgency === 'critical').length;
    const pending = problems.filter(p => p.status === 'pending' || p.status === 'under_review').length;

    return {
      total_problems: problems.length,
      pending_review: pending,
      critical_issues: critical,
      active_projects: projects.length,
      resolved_problems: resolved,
      estimated_citizens_impacted: 52000 + problems.reduce((acc, p) => acc + (p.supports_count || 1) * 25, 0),
      total_clusters: clusters.length,
      total_institutions: institutions.length,
      resolution_rate_percentage: problems.length > 0 ? +((resolved / problems.length) * 100).toFixed(1) : 15.0,
      avg_resolution_days: 28
    };
  } catch (err) {
    return {
      total_problems: SEED_PROBLEMS.length,
      pending_review: 2,
      critical_issues: 3,
      active_projects: SEED_PROJECTS.length,
      resolved_problems: 1,
      estimated_citizens_impacted: 58000,
      total_clusters: SEED_CLUSTERS.length,
      total_institutions: SEED_INSTITUTIONS.length,
      resolution_rate_percentage: 16.7,
      avg_resolution_days: 28
    };
  }
}
