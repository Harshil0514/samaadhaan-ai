import React, { useState, useEffect, useMemo } from 'react';
import { Problem, User } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PriorityScoreCard, PriorityScoreBadge, getPriorityTheme } from '../components/PriorityScoreCard';
import {
  User as UserIcon,
  PlusCircle,
  Clock,
  CheckCircle2,
  ThumbsUp,
  MapPin,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  X,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';

interface CitizenDashboardProps {
  onOpenReport: () => void;
  onSelectProblem: (problem: Problem) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ onOpenReport, onSelectProblem }) => {
  const { user } = useAuth();
  const [myProblems, setMyProblems] = useState<Problem[]>([]);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'supported'>('my');
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Sort State
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [sortBy, setSortBy] = useState<'priority_desc' | 'priority_asc' | 'recent' | 'oldest' | 'votes_desc'>('priority_desc');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const probs = await api.getProblems();
        setAllProblems(probs);
        // Filter by user created or default demo citizen
        const mine = probs.filter(p => p.created_by === user?.id || p.author_email === user?.email || p.created_by === 'usr-citizen-1');
        setMyProblems(mine);
      } catch (err) {
        console.error('Failed to load citizen data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user?.id]);

  const supportedProblems = useMemo(() => {
    return allProblems.filter(p => p.has_user_supported || p.supports_count > 1);
  }, [allProblems]);

  const rawList = activeTab === 'my' ? myProblems : supportedProblems;

  // Derive unique categories from active tab
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    rawList.forEach(p => {
      if (p.category_name) cats.add(p.category_name);
    });
    return Array.from(cats).sort();
  }, [rawList]);

  const hasActiveFilters = search.trim() !== '' ||
    selectedStatus !== 'all' ||
    selectedCategory !== 'all' ||
    selectedUrgency !== 'all' ||
    sortBy !== 'priority_desc';

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedCategory('all');
    setSelectedUrgency('all');
    setSortBy('priority_desc');
  };

  const filteredList = useMemo(() => {
    return rawList.filter(p => {
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
      if (selectedCategory !== 'all' && (p.category_name || '').toLowerCase() !== selectedCategory.toLowerCase()) return false;
      if (selectedUrgency !== 'all') {
        const score = p.priority_score ?? 50;
        if (selectedUrgency === 'critical' && !(score >= 80 || p.urgency === 'critical')) return false;
        if (selectedUrgency === 'high' && !((score >= 60 && score < 80) || p.urgency === 'high')) return false;
        if (selectedUrgency === 'medium' && !((score >= 40 && score < 60) || p.urgency === 'medium')) return false;
        if (selectedUrgency === 'low' && !(score < 40 || p.urgency === 'low')) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = (p.title || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.address || '').toLowerCase().includes(q) ||
          (p.category_name || '').toLowerCase().includes(q);
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
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [rawList, selectedStatus, selectedCategory, selectedUrgency, search, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-300">
            <UserIcon className="w-4 h-4" />
            Citizen Innovation Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white">
            Welcome, {user?.name || 'Citizen User'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
            Track your community reports, monitor university prototype progress, and unite neighboring voices through community upvotes.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenReport}
          className="px-6 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 flex-shrink-0 z-10 transition-all hover:scale-105"
        >
          <PlusCircle className="w-4 h-4 text-emerald-600" />
          Report New Problem
        </button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-black font-display text-slate-900">{myProblems.length}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">My Submitted Reports</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-black font-display text-indigo-600">
              {myProblems.filter(p => p.status === 'assigned' || p.status === 'in_progress').length}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Active with Universities</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-black font-display text-amber-600">
              {myProblems.reduce((acc, p) => acc + p.supports_count, 0)}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Community Voices Gathered</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <ThumbsUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'my' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          My Reports ({myProblems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('supported')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'supported' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Supported Community Challenges ({supportedProblems.length})
        </button>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, location, category..."
              className="w-full pl-10 pr-9 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-700"
            >
              <option value="all">All Workflow Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="verified">Verified</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-700"
            >
              <option value="all">All Categories ({availableCategories.length})</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-semibold text-emerald-900"
            >
              <option value="priority_desc">⚡ AI Severity: High to Low</option>
              <option value="priority_asc">⚡ AI Severity: Low to High</option>
              <option value="votes_desc">👍 Support: Most Voices</option>
              <option value="recent">🕒 Submission Date: Newest</option>
              <option value="oldest">🕒 Submission Date: Oldest</option>
            </select>
          </div>
        </div>

        {/* Results Count & Reset Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>
              Showing <span className="font-bold text-slate-900">{filteredList.length}</span> of <span className="font-bold text-slate-900">{rawList.length}</span> reports
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors ml-2"
              >
                <RotateCcw className="w-3 h-3" />
                Reset filters
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                  "{search}"
                  <button type="button" onClick={() => setSearch('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedStatus !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                  Status: {selectedStatus}
                  <button type="button" onClick={() => setSelectedStatus('all')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                  {selectedCategory}
                  <button type="button" onClick={() => setSelectedCategory('all')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Problems List */}
      <div className="space-y-4">
        {rawList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">No reports found yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Submit your first citizen complaint to initiate AI analysis and university challenge routing.
            </p>
            <button
              onClick={onOpenReport}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              Report a Problem
            </button>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">No reports match your filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting or resetting your filter criteria to view all your reported or supported issues.
            </p>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredList.map(problem => {
            const theme = getPriorityTheme(problem.priority_score);

            return (
              <div
                key={problem.id}
                onClick={() => onSelectProblem(problem)}
                className={`bg-white rounded-3xl p-6 border border-slate-200 ${theme.accentBorder} ${theme.hoverGlow} shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer group`}
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Photo Thumbnail */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                    <img
                      src={problem.images[0] || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'}
                      alt={problem.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${theme.pillBg}`}>
                        {theme.label} ({problem.priority_score}/100)
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {problem.category_name}
                      </span>
                      <span className="text-[10px] font-bold capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Status: {problem.status.replace('_', ' ')}
                      </span>
                      {problem.assigned_institution_name && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          🏛️ {problem.assigned_institution_name}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {problem.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-1">{problem.description}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        {problem.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(problem.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Priority & Upvotes */}
                <div className="flex items-center gap-4 flex-shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 text-[10px]">AI Priority</div>
                    <div className={`text-lg font-black ${theme.textColor}`}>{problem.priority_score}/100</div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                    {problem.supports_count} Voices
                  </div>

                  <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
