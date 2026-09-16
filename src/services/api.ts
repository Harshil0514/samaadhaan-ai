import {
  AIAnalysis,
  AnalyticsOverview,
  Category,
  Institution,
  InstitutionRecommendation,
  Notification,
  Problem,
  ProblemCluster,
  Project,
  Role,
  SolutionDirection,
  User
} from '../types';
import {
  firestoreRegisterUser,
  firestoreLoginUser,
  firestoreGetMe,
  firestoreGetProblems,
  firestoreGetProblem,
  firestoreCreateProblem,
  firestoreUpdateProblem,
  firestoreSupportProblem,
  firestoreGetCategories,
  firestoreGetInstitutions,
  firestoreGetClusters,
  firestoreGetProjects,
  firestoreGetProject,
  firestoreCreateProject,
  firestoreGetSolutions,
  firestoreVoteSolution,
  firestoreGetNotifications,
  firestoreGetAnalyticsOverview,
  ensureFirestoreInitialized
} from './firestoreService';
import { db, doc, setDoc, updateDoc } from '../lib/firebase';

// Ensure API_BASE points to your deployed Render backend URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://backend-tbi5.onrender.com';

export const api = {
  // ... other methods

  supportProblem: async (problemId: string, userId?: string) => {
    return safeFetch(`${API_BASE}/api/problems/${problemId}/support/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ user_id: userId || 'usr-citizen-1' }),
    });
  },

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('civicsetu_token') || localStorage.getItem('samaadhaan_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  fallbackValue?: T,
  retries = 2
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        let errMessage = `HTTP error ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.error) errMessage = errData.error;
        } catch {
          // ignore non-json error
        }
        if (attempt < retries && res.status >= 500) {
          await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        if (fallbackValue !== undefined) return fallbackValue;
        throw new Error(errMessage);
      }
      return await res.json();
    } catch (err: any) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      if (fallbackValue !== undefined) {
        return fallbackValue;
      }
      throw err;
    }
  }
  if (fallbackValue !== undefined) return fallbackValue;
  throw new Error(`Failed to fetch ${url}`);
}

export const api = {
  // Auth with Firebase & Backend Sync
  async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, email: identifier, phone: identifier, password })
      });
      if (res.ok) {
        const data = await res.json();
        // Sync user profile to Firestore
        setDoc(doc(db, 'users', data.user.id), data.user, { merge: true }).catch(() => {});
        return data;
      }
    } catch {
      // Backend unavailable, fallback to direct Firestore login
    }
    return firestoreLoginUser(identifier, password);
  },

  async register(data: {
    name: string;
    email?: string;
    phone?: string;
    password: string;
    role?: Role;
    organization?: string;
    govt_id_url?: string;
    govt_id_number?: string;
    govt_id_type?: string;
  }): Promise<{ user: User; token: string }> {
    // 1. Register in Firestore Database
    let firestoreResult: { user: User; token: string } | null = null;
    try {
      firestoreResult = await firestoreRegisterUser(data);
    } catch (err) {
      console.warn('Firestore direct register note:', err);
    }

    // 2. Also register in backend Express server if accessible
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const backendData = await res.json();
        // Sync to Firestore
        if (backendData.user) {
          setDoc(doc(db, 'users', backendData.user.id), backendData.user, { merge: true }).catch(() => {});
        }
        return backendData;
      }
    } catch {
      // Server down, continue with Firestore result
    }

    if (firestoreResult) {
      return firestoreResult;
    }
    throw new Error('Registration failed. Please try again.');
  },

  async getMe(): Promise<{ user: User }> {
    const token = localStorage.getItem('civicsetu_token') || localStorage.getItem('samaadhaan_token');
    try {
      const res = await safeFetch<{ user: User }>(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders()
      });
      if (res?.user) {
        setDoc(doc(db, 'users', res.user.id), res.user, { merge: true }).catch(() => {});
        return res;
      }
    } catch {
      // Fallback to Firestore user lookup
    }

    const firestoreUser = await firestoreGetMe(token);
    if (firestoreUser) {
      return { user: firestoreUser };
    }
    throw new Error('User not found');
  },

  async switchDemoRole(role: Role): Promise<{ user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/switch-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (res.ok) {
      const data = await res.json();
      setDoc(doc(db, 'users', data.user.id), data.user, { merge: true }).catch(() => {});
      return data;
    }
    return firestoreLoginUser(`${role}@civicsetu.ai`);
  },

  // Categories & Institutions
  async getCategories(): Promise<Category[]> {
    try {
      const list = await safeFetch<Category[]>(`${API_BASE}/categories`, undefined, []);
      if (list && list.length > 0) return list;
    } catch {
      // Fallback
    }
    return firestoreGetCategories();
  },

  async getInstitutions(): Promise<Institution[]> {
    try {
      const list = await safeFetch<Institution[]>(`${API_BASE}/institutions`, undefined, []);
      if (list && list.length > 0) return list;
    } catch {
      // Fallback
    }
    return firestoreGetInstitutions();
  },

  async getInstitutionRecommendations(problemId: string): Promise<InstitutionRecommendation[]> {
    return safeFetch<InstitutionRecommendation[]>(`${API_BASE}/institutions/recommendations/${problemId}`, undefined, []);
  },

  // Problems
  async getProblems(params?: {
    category?: string;
    status?: string;
    urgency?: string;
    search?: string;
    clusterId?: string;
    institutionId?: string;
    limit?: number;
  }): Promise<Problem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.status) query.set('status', params.status);
      if (params?.urgency) query.set('urgency', params.urgency);
      if (params?.search) query.set('search', params.search);
      if (params?.clusterId) query.set('clusterId', params.clusterId);
      if (params?.institutionId) query.set('institutionId', params.institutionId);
      if (params?.limit) query.set('limit', params.limit.toString());

      const res = await safeFetch<Problem[]>(`${API_BASE}/problems?${query.toString()}`, {
        headers: getAuthHeaders()
      }, []);

      if (res && res.length > 0) {
        return res;
      }
    } catch {
      // Fallback
    }
    return firestoreGetProblems(params);
  },

  async getProblem(id: string): Promise<Problem & {
    similar_problems: { problem: Problem; similarityScore: number; distanceKm: number }[];
    recommended_institutions: InstitutionRecommendation[];
    solutions: SolutionDirection[];
  }> {
    try {
      const res = await safeFetch<any>(`${API_BASE}/problems/${id}`, {
        headers: getAuthHeaders()
      });
      if (res && res.id) return res;
    } catch {
      // Fallback
    }
    const prob = await firestoreGetProblem(id);
    const solutions = await firestoreGetSolutions(id);
    if (!prob) throw new Error('Problem not found');
    return {
      ...prob,
      similar_problems: [],
      recommended_institutions: [],
      solutions
    };
  },

  async previewAIAnalysis(data: {
    title: string;
    description: string;
    urgency?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<{
    analysis: AIAnalysis;
    duplicate_check: {
      duplicateScore: number;
      similarProblems: { problem: Problem; similarityScore: number; distanceKm: number }[];
      recommendedClusterId?: string;
    };
  }> {
    const res = await fetch(`${API_BASE}/ai/preview-analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('AI preview failed');
    return res.json();
  },

  async createProblem(data: {
    title: string;
    description: string;
    category_id?: string;
    urgency?: string;
    latitude: number;
    longitude: number;
    address: string;
    images?: string[];
    cluster_id_to_join?: string;
  }): Promise<{ problem: Problem; ai_analysis: AIAnalysis; solutions: SolutionDirection[] }> {
    // 1. Create on server backend (runs Gemini & clustering)
    try {
      const res = await fetch(`${API_BASE}/problems`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const payload = await res.json();
        // Persist new problem directly to Firestore
        if (payload.problem) {
          setDoc(doc(db, 'problems', payload.problem.id), payload.problem, { merge: true }).catch(() => {});
        }
        return payload;
      }
    } catch {
      // Fallback to Firestore directly
    }

    const createdProb = await firestoreCreateProblem(data);
    const solutions = await firestoreGetSolutions(createdProb.id);
    return {
      problem: createdProb,
      ai_analysis: createdProb.ai_analysis!,
      solutions
    };
  },

  async updateProblem(id: string, updates: Partial<Problem>): Promise<{ problem: Problem }> {
    // Update both Firestore and server
    firestoreUpdateProblem(id, updates).catch(() => {});
    return safeFetch<{ problem: Problem }>(`${API_BASE}/problems/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
  },

  async supportProblem(id: string): Promise<{ supported: boolean; count: number; new_priority_score?: number }> {
    // Update Firestore directly for instant persistence
    firestoreSupportProblem(id).catch(() => {});
    return safeFetch<{ supported: boolean; count: number; new_priority_score?: number }>(`${API_BASE}/problems/${id}/support`, {
      method: 'POST',
      headers: getAuthHeaders()
    }, { supported: true, count: 1 });
  },

  // Problem Clusters
  async getClusters(): Promise<ProblemCluster[]> {
    try {
      const list = await safeFetch<ProblemCluster[]>(`${API_BASE}/clusters`, undefined, []);
      if (list && list.length > 0) return list;
    } catch {
      // Fallback
    }
    return firestoreGetClusters();
  },

  async getCluster(id: string): Promise<ProblemCluster & { problems: Problem[] }> {
    return safeFetch<ProblemCluster & { problems: Problem[] }>(`${API_BASE}/clusters/${id}`);
  },

  async createCluster(data: {
    name: string;
    category_id: string;
    problem_ids: string[];
    radius_km?: number;
  }): Promise<{ cluster: ProblemCluster }> {
    return safeFetch<{ cluster: ProblemCluster }>(`${API_BASE}/clusters`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
  },

  async updateCluster(id: string, updates: Partial<ProblemCluster>): Promise<{ cluster: ProblemCluster }> {
    return safeFetch<{ cluster: ProblemCluster }>(`${API_BASE}/clusters/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
  },

  // Projects
  async getProjects(params?: { status?: string; institution_id?: string }): Promise<Project[]> {
    try {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.institution_id) query.set('institution_id', params.institution_id);

      const list = await safeFetch<Project[]>(`${API_BASE}/projects?${query.toString()}`, undefined, []);
      if (list && list.length > 0) return list;
    } catch {
      // Fallback
    }
    return firestoreGetProjects({ status: params?.status, institutionId: params?.institution_id });
  },

  async getProject(id: string): Promise<Project> {
    try {
      const p = await safeFetch<Project>(`${API_BASE}/projects/${id}`);
      if (p && p.id) return p;
    } catch {
      // Fallback
    }
    const p = await firestoreGetProject(id);
    if (!p) throw new Error('Project not found');
    return p;
  },

  async createProject(data: Partial<Project>): Promise<{ project: Project }> {
    const created = await firestoreCreateProject(data);
    safeFetch<{ project: Project }>(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).catch(() => {});
    return { project: created };
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<{ project: Project }> {
    const res = await safeFetch<{ project: Project }>(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    updateDoc(doc(db, 'projects', id), { ...updates, updated_at: new Date().toISOString() }).catch(() => {});
    return res;
  },

  async updateMilestone(id: string, updates: { status?: string; title?: string; description?: string }): Promise<any> {
    return safeFetch<any>(`${API_BASE}/milestones/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
  },

  // Solution Directions
  async getSolutions(problemId: string): Promise<SolutionDirection[]> {
    try {
      const list = await safeFetch<SolutionDirection[]>(`${API_BASE}/problems/${problemId}/solutions`, undefined, []);
      if (list && list.length > 0) return list;
    } catch {
      // Fallback
    }
    return firestoreGetSolutions(problemId);
  },

  async voteSolution(solutionId: string): Promise<{ votes: number }> {
    firestoreVoteSolution(solutionId).catch(() => {});
    return safeFetch<{ votes: number }>(`${API_BASE}/solutions/${solutionId}/vote`, {
      method: 'POST',
      headers: getAuthHeaders()
    }, { votes: 1 });
  },

  async updateSolutionStatus(solutionId: string, status: string): Promise<SolutionDirection> {
    updateDoc(doc(db, 'solutions', solutionId), { status }).catch(() => {});
    return safeFetch<SolutionDirection>(`${API_BASE}/solutions/${solutionId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
  },

  // Analytics
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    try {
      const data = await safeFetch<AnalyticsOverview>(`${API_BASE}/analytics/overview`);
      if (data && data.total_problems > 0) return data;
    } catch {
      // Fallback
    }
    return firestoreGetAnalyticsOverview();
  },

  async getAnalyticsCategories(): Promise<{ name: string; count: number }[]> {
    return safeFetch<{ name: string; count: number }[]>(`${API_BASE}/analytics/categories`, undefined, []);
  },

  async getAnalyticsPriority(): Promise<{ range: string; count: number; fill: string }[]> {
    return safeFetch<{ range: string; count: number; fill: string }[]>(`${API_BASE}/analytics/priority`, undefined, []);
  },

  async getAnalyticsTrends(): Promise<any[]> {
    return safeFetch<any[]>(`${API_BASE}/analytics/trends`, undefined, []);
  },

  async getAnalyticsImpact(): Promise<any> {
    return safeFetch<any>(`${API_BASE}/analytics/impact`, undefined, {});
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    try {
      const list = await safeFetch<Notification[]>(`${API_BASE}/api/notifications/`, {
        headers: getAuthHeaders()
      }, []);
      if (list && list.length > 0) return list;
    } catch {
      // Fallback
    }
    return firestoreGetNotifications();
  },

  async markNotificationRead(id: string): Promise<void> {
    updateDoc(doc(db, 'notifications', id), { is_read: true }).catch(() => {});
    await safeFetch(`${API_BASE}/api/notifications/${id}/read/`, {
      method: 'PUT',
      headers: getAuthHeaders()
    }, undefined);
  },

  async markAllNotificationsRead(): Promise<void> {
    await safeFetch(`${API_BASE}/api/notifications/read-all/`, {
      method: 'PUT',
      headers: getAuthHeaders()
    }, undefined);
  },
  // Seed Reset
  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    return safeFetch<{ success: boolean; message: string }>(`${API_BASE}/seed/reset`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  }
};

