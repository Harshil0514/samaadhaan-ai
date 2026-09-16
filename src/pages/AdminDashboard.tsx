import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  AnalyticsOverview,
  Institution,
  Problem,
  ProblemCluster
} from '../types';
import { api } from '../services/api';
import { LeafletMap } from '../components/LeafletMap';
import { PriorityLevelsLegend, PriorityScoreBadge, getPriorityTheme } from '../components/PriorityScoreCard';
import {
  ShieldAlert,
  Layers,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Users,
  Flame,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  Check,
  Plus,
  Search,
  X,
  RotateCcw,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminDashboardProps {
  onSelectProblem: (problem: Problem) => void;
  onSelectProject?: (projectId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectProblem, onSelectProject }) => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [clusters, setClusters] = useState<ProblemCluster[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; count: number }[]>([]);
  const [priorityData, setPriorityData] = useState<{ range: string; count: number; fill: string }[]>([]);
  const [trendsData, setTrendsData] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'queue' | 'clusters' | 'analytics'>('queue');
  const [selectedCluster, setSelectedCluster] = useState<ProblemCluster | null>(null);
  const [assigningProblemId, setAssigningProblemId] = useState<string | null>(null);
  const [assignInstId, setAssignInstId] = useState<string>('');

  // Queue Filtering & Sorting
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState('all');
  const [sortBy, setSortBy] = useState<'priority_desc' | 'priority_asc' | 'votes_desc' | 'recent' | 'oldest' | 'title_asc'>('priority_desc');

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [stats, probs, clus, insts, catCounts, priCounts, trends] = await Promise.all([
          api.getAnalyticsOverview(),
          api.getProblems(),
          api.getClusters(),
          api.getInstitutions(),
          api.getAnalyticsCategories(),
          api.getAnalyticsPriority(),
          api.getAnalyticsTrends()
        ]);
        setOverview(stats);
        setProblems(probs);
        setClusters(clus);
        setInstitutions(insts);
        setCategoryData(catCounts);
        setPriorityData(priCounts);
        setTrendsData(trends);
        if (clus.length > 0) setSelectedCluster(clus[0]);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      }
    }
    loadAdminData();
  }, []);

  const handleVerifyProblem = async (problemId: string) => {
    try {
      await api.updateProblem(problemId, { status: 'verified' });
      setProblems(prev => prev.map(p => p.id === problemId ? { ...p, status: 'verified' } : p));
      confetti({ particleCount: 40, spread: 50 });
    } catch {
      // Ignore
    }
  };

  const handleAssignInstitution = async (problemId: string, instId: string) => {
    if (!instId) return;
    const inst = institutions.find(i => i.id === instId);
    if (!inst) return;

    try {
      await api.updateProblem(problemId, {
        assigned_institution_id: instId,
        status: 'assigned'
      });

      await api.createProject({
        title: `R&D Challenge: ${problems.find(p => p.id === problemId)?.title}`,
        description: `Commissioned by Government Authority to ${inst.name}.`,
        problem_id: problemId,
        institution_id: instId
      });

      setProblems(prev => prev.map(p => p.id === problemId ? {
        ...p,
        assigned_institution_id: instId,
        assigned_institution_name: inst.name,
        status: 'assigned'
      } : p));

      setAssigningProblemId(null);
      setAssignInstId('');
      confetti({ particleCount: 70, spread: 60 });
    } catch (err: any) {
      alert(err.message || 'Failed to assign');
    }
  };

  const criticalIssues = problems.filter(p => p.urgency === 'critical' || p.priority_score >= 80);
  const pendingReview = problems.filter(p => p.status === 'under_review' || p.status === 'pending');

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    problems.forEach(p => {
      if (p.category_name) cats.add(p.category_name);
    });
    return Array.from(cats).sort();
  }, [problems]);

  const hasActiveFilters = search.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedCategory !== 'all' ||
    selectedUrgency !== 'all' ||
    selectedAssignment !== 'all' ||
    sortBy !== 'priority_desc';

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSelectedUrgency('all');
    setSelectedAssignment('all');
    setSortBy('priority_desc');
  };

  const filteredQueue = useMemo(() => {
    return problems.filter(p => {
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
      if (selectedCategory !== 'all' && (p.category_name || '').toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (selectedUrgency !== 'all') {
        const score = p.priority_score ?? 50;
        if (selectedUrgency === 'critical' && !(score >= 80 || p.urgency === 'critical')) return false;
        if (selectedUrgency === 'high' && !((score >= 60 && score < 80) || p.urgency === 'high')) return false;
        if (selectedUrgency === 'medium' && !((score >= 40 && score < 60) || p.urgency === 'medium')) return false;
        if (selectedUrgency === 'low' && !(score < 40 || p.urgency === 'low')) return false;
      }
      if (selectedAssignment !== 'all') {
        if (selectedAssignment === 'assigned' && !p.assigned_institution_id && !p.assigned_institution_name) return false;
        if (selectedAssignment === 'unassigned' && (p.assigned_institution_id || p.assigned_institution_name)) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = (p.title || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.address || '').toLowerCase().includes(q) ||
          (p.category_name || '').toLowerCase().includes(q) ||
          (p.assigned_institution_name || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'priority_desc':
          return (b.priority_score ?? 0) - (a.priority_score ?? 0);
        case 'priority_asc':
          return (a.priority_score ?? 0) - (b.priority_score ?? 0);
        case 'votes_desc':
          return (b.supports_count ?? 0) - (a.supports_count ?? 0);
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [problems, selectedStatus, selectedCategory, selectedUrgency, selectedAssignment, search, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-slate-800 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-400">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            Government Authority & Municipal Operations Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white">
            National Societal Oversight Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Monitor real-time citizen grievance streams, verify high-density community challenge clusters, and commission university innovation projects.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 flex-shrink-0">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
            <div className="text-xl font-black text-emerald-400">{overview?.resolution_rate_percentage || 28.5}%</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Resolution Rate</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
            <div className="text-xl font-black text-indigo-400">{overview?.avg_resolution_days || 28}d</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Avg Lead Time</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Reports</div>
          <div className="text-2xl font-black font-display text-slate-900 mt-1">{overview?.total_problems || 50}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% Geo-tagged</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical Issues</div>
          <div className="text-2xl font-black font-display text-red-600 mt-1">{criticalIssues.length}</div>
          <div className="text-[11px] text-red-500 font-semibold mt-1">Score 80–100/100</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Active Projects</div>
          <div className="text-2xl font-black font-display text-indigo-600 mt-1">{overview?.active_projects || 4}</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">In University Labs</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">Density Clusters</div>
          <div className="text-2xl font-black font-display text-amber-600 mt-1">{clusters.length}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">Correlated Issues</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Citizens Reached</div>
          <div className="text-2xl font-black font-display text-emerald-600 mt-1">
            {(overview?.estimated_citizens_impacted || 45000).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Across 4 Districts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'queue' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Review & Assignment Queue ({pendingReview.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('clusters')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'clusters' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Community Challenge Clusters ({clusters.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Visual Analytics & Trends
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: REVIEW & ASSIGNMENT QUEUE */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'queue' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Search Box */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search grievance, location, institution..."
                  className="w-full pl-10 pr-9 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="verified">Verified</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
                >
                  <option value="all">All Categories ({availableCategories.length})</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Lab Assignment Filter */}
              <div>
                <select
                  value={selectedAssignment}
                  onChange={e => setSelectedAssignment(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
                >
                  <option value="all">All Assignments</option>
                  <option value="assigned">🏛️ Assigned to Lab</option>
                  <option value="unassigned">⏳ Pending Lab Assignment</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-indigo-900"
                >
                  <option value="priority_desc">⚡ Severity: High to Low</option>
                  <option value="priority_asc">⚡ Severity: Low to High</option>
                  <option value="votes_desc">👍 Votes: Highest</option>
                  <option value="recent">🕒 Submission: Newest</option>
                  <option value="oldest">🕒 Submission: Oldest</option>
                  <option value="title_asc">🔤 Title: A to Z</option>
                </select>
              </div>
            </div>

            {/* Results Count & Active Filter Tags */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <span>
                  Showing <span className="font-bold text-slate-900">{filteredQueue.length}</span> of <span className="font-bold text-slate-900">{problems.length}</span> pipeline grievances
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors ml-2"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset filters
                  </button>
                )}
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {search && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                      "{search}"
                      <button type="button" onClick={() => setSearch('')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedStatus !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                      Status: {selectedStatus}
                      <button type="button" onClick={() => setSelectedStatus('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                      {selectedCategory}
                      <button type="button" onClick={() => setSelectedCategory('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedAssignment !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                      {selectedAssignment === 'assigned' ? 'Assigned' : 'Unassigned'}
                      <button type="button" onClick={() => setSelectedAssignment('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Queue List Container */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
            {filteredQueue.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">No grievances match your criteria</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Adjust or clear your filters to view more citizen submissions in the national queue.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredQueue.map(problem => {
            const theme = getPriorityTheme(problem.priority_score);

            return (
              <div key={problem.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-display font-black text-white flex-shrink-0 ${theme.badgeBg} ${theme.glowShadow}`}>
                    <span className="text-base leading-none">{problem.priority_score}</span>
                    <span className="text-[8px] uppercase tracking-tighter opacity-90">pts</span>
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${theme.pillBg}`}>
                        {theme.label} ({problem.priority_score}/100)
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {problem.category_name}
                      </span>
                      <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {problem.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        📍 {problem.address}
                      </span>
                    </div>

                    <h4
                      onClick={() => onSelectProblem(problem)}
                      className="font-bold text-base text-slate-900 hover:text-indigo-600 cursor-pointer truncate"
                    >
                      {problem.title}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-1">{problem.description}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {assigningProblemId === problem.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={assignInstId}
                        onChange={e => setAssignInstId(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="">Select University Lab...</option>
                        {institutions.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAssignInstitution(problem.id, assignInstId)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssigningProblemId(null)}
                        className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      {problem.status !== 'verified' && (
                        <button
                          type="button"
                          onClick={() => handleVerifyProblem(problem.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors"
                        >
                          Verify Issue
                        </button>
                      )}

                      {!problem.assigned_institution_id ? (
                        <button
                          type="button"
                          onClick={() => setAssigningProblemId(problem.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                        >
                          Assign to University
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl">
                          🏛️ {problem.assigned_institution_name}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectProblem(problem)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        View Full AI Analysis
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          }))}
        </div>
      </div>
    )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PROBLEM CLUSTERS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'clusters' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Cluster List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-bold text-sm text-slate-900 mb-2">Active Challenge Clusters</h3>
            {clusters.map(cluster => (
              <div
                key={cluster.id}
                onClick={() => setSelectedCluster(cluster)}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  selectedCluster?.id === cluster.id
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {cluster.category_name}
                  </span>
                  <span className="text-xs font-black text-red-600">
                    Score {cluster.priority_score}/100
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{cluster.name}</h4>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                  <span>{cluster.total_reports} Correlated Reports</span>
                  <span>{cluster.radius_km} km radius</span>
                </div>
              </div>
            ))}
          </div>

          {/* Cluster Detailed Preview & Map */}
          {selectedCluster && (
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                    Cluster Telemetry & Geographic Scope
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">{selectedCluster.name}</h3>
                  <p className="text-xs text-slate-500">
                    Center: Lat {selectedCluster.center_latitude}, Lng {selectedCluster.center_longitude} • Radius: {selectedCluster.radius_km} km
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold uppercase text-[10px]">Priority Index</div>
                  <div className="text-2xl font-black text-red-600">{selectedCluster.priority_score}/100</div>
                </div>
              </div>

              {/* Map displaying cluster radius */}
              <LeafletMap
                clusters={[selectedCluster]}
                height="320px"
                center={[selectedCluster.center_latitude, selectedCluster.center_longitude]}
                zoom={12}
              />

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Assigned University Lab</span>
                  <span className="text-xs font-bold text-indigo-600">{selectedCluster.assigned_institution_name || 'Unassigned'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Grouping multiple citizen complaints into this unified cluster prevents redundant municipal work orders and unlocks institutional R&D funding for long-term engineering infrastructure.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: VISUAL ANALYTICS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Priority Distribution Chart with Exact 4-Tier Colors */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">Priority Score Distribution</h3>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">4 Tiers</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <PriorityLevelsLegend className="!p-3 !shadow-none !border-slate-100 !bg-slate-50/70" />
            </div>

            {/* Category Distribution BarChart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Complaints by Societal Innovation Category</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData.slice(0, 8)} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Trend AreaChart */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Reporting & Resolution Trajectory (6 Months)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }} />
                    <Area type="monotone" dataKey="reports" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.15} name="Citizen Reports" />
                    <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Resolved Prototypes" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
