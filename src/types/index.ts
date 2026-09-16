export type Role = 'citizen' | 'admin' | 'institution' | 'expert';

export type ProblemStatus = 
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type ProjectStatus = 
  | 'planning'
  | 'research'
  | 'development'
  | 'testing'
  | 'pilot'
  | 'implemented'
  | 'completed';

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  profile_image?: string;
  phone?: string;
  organization?: string;
  govt_id_url?: string;
  govt_id_number?: string;
  govt_id_type?: string;
  id_verification_status?: 'pending' | 'verified' | 'unverified';
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  count?: number;
}

export interface ProblemMedia {
  id: string;
  problem_id: string;
  file_url: string;
  file_type: 'image' | 'video' | 'document';
  uploaded_at: string;
}

export interface PriorityBreakdown {
  severityContribution: number; // 30%
  citizensContribution: number; // 25%
  clusterContribution: number;  // 20%
  urgencyContribution: number;  // 15%
  locationRiskContribution: number; // 10%
  severityRaw: number;
  citizensCount: number;
  clusterSize: number;
  urgencyRaw: number;
  locationRiskRaw: number;
  explanation: string;
}

export interface AIAnalysis {
  id: string;
  problem_id: string;
  detected_category: string;
  category_confidence: number;
  severity: UrgencyLevel;
  severity_confidence: number;
  priority_score: number;
  summary: string;
  keywords: string[];
  duplicate_score?: number;
  similar_problem_ids?: string[];
  recommended_actions: string[];
  priority_breakdown?: PriorityBreakdown;
  created_at: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_name?: string;
  status: ProblemStatus;
  urgency: UrgencyLevel;
  latitude: number;
  longitude: number;
  address: string;
  created_by: string;
  author_name?: string;
  author_email?: string;
  priority_score: number;
  severity_score: number;
  duplicate_cluster_id?: string | null;
  cluster_name?: string;
  supports_count: number;
  has_user_supported?: boolean;
  images: string[];
  ai_analysis?: AIAnalysis;
  assigned_institution_id?: string | null;
  assigned_institution_name?: string;
  project_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProblemCluster {
  id: string;
  name: string;
  category_id: string;
  category_name?: string;
  center_latitude: number;
  center_longitude: number;
  radius_km: number;
  total_reports: number;
  priority_score: number;
  status: ProblemStatus;
  assigned_institution_id?: string | null;
  assigned_institution_name?: string;
  project_id?: string | null;
  problem_ids: string[];
  created_at: string;
}

export interface InstitutionExpertise {
  id: string;
  institution_id: string;
  category_id: string;
  category_name?: string;
  expertise_level: number; // 1 to 5 or percentage
  keywords: string[];
}

export interface Institution {
  id: string;
  name: string;
  description: string;
  location: string;
  type?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  contact_email: string;
  website: string;
  expertise: InstitutionExpertise[];
  active_projects_count: number;
  completed_projects_count: number;
  created_at: string;
}

export interface InstitutionRecommendation {
  institution: Institution;
  compatibility_score: number;
  category_match_score: number;
  keyword_match_score: number;
  expertise_score: number;
  availability_score: number;
  match_reasons: string[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: 'team_lead' | 'student' | 'mentor' | 'expert';
  avatar?: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  due_date: string;
  completed_at?: string | null;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  problem_id?: string | null;
  problem_cluster_id?: string | null;
  problem_title?: string;
  institution_id: string;
  institution_name: string;
  status: ProjectStatus;
  progress: number; // 0 to 100
  start_date: string;
  expected_completion: string;
  members: ProjectMember[];
  milestones: Milestone[];
  prototype_info?: string;
  documents?: { name: string; url: string; size: string }[];
  impact_metrics?: ImpactMetric;
  created_at: string;
  updated_at: string;
}

export interface SolutionDirection {
  id: string;
  problem_id: string;
  title: string;
  description: string;
  domain: string;
  feasibility_score: number; // 1-100
  estimated_timeframe: string;
  key_technologies: string[];
  status: 'suggested' | 'approved' | 'rejected' | 'in_development';
  created_by_ai: boolean;
  votes: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'problem' | 'analysis' | 'verification' | 'assignment' | 'milestone' | 'status_change' | 'critical';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface ImpactMetric {
  id?: string;
  project_id?: string;
  citizens_impacted: number;
  reports_resolved: number;
  area_covered_km2: number;
  cost_saved_inr?: number;
  time_saved_days?: number;
  environmental_impact?: string;
  measurable_outcomes: string[];
  before_image?: string;
  after_image?: string;
}

export interface AnalyticsOverview {
  total_problems: number;
  pending_review: number;
  critical_issues: number;
  active_projects: number;
  resolved_problems: number;
  estimated_citizens_impacted: number;
  total_clusters: number;
  total_institutions: number;
  resolution_rate_percentage: number;
  avg_resolution_days: number;
}
