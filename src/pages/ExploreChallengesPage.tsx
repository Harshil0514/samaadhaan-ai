import React, { useState, useEffect, useMemo } from 'react';
import { Problem, Category, ProblemCluster } from '../types';
import { api } from '../services/api';
import { LeafletMap } from '../components/LeafletMap';
import { PriorityScoreCard, PriorityScoreBadge, getPriorityTheme, PriorityLevelsLegend } from '../components/PriorityScoreCard';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  Map as MapIcon,
  MapPin,
  ThumbsUp,
  Building2,
  Sparkles,
  ArrowUpDown,
  Flame,
  AlertTriangle,
  X,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';

interface ExploreChallengesPageProps {
  onSelectProblem: (problem: Problem) => void;
  onOpenReport: () => void;
}

export const ExploreChallengesPage: React.FC<ExploreChallengesPageProps> = ({ onSelectProblem, onOpenReport }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [clusters, setClusters] = useState<ProblemCluster[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & State
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState<'priority_desc' | 'priority_asc' | 'votes_desc' | 'votes_asc' | 'recent' | 'oldest' | 'title_asc' | 'title_desc'>('priority_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [supportedMap, setSupportedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [probs, clus, cats] = await Promise.all([
          api.getProblems(),
          api.getClusters(),
          api.getCategories()
        ]);
        setProblems(probs);
        setClusters(clus);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load explore data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSupport = async (pId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.supportProblem(pId);
      setSupportedMap(prev => ({ ...prev, [pId]: res.supported }));
      setProblems(prev => prev.map(p => p.id === pId ? { ...p, supports_count: res.count, priority_score: res.new_priority_score || p.priority_score } : p));
    } catch {
      // Ignore
    }
  };

  // Derive available cities/regions dynamically from problems data
  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    problems.forEach(p => {
      if (p.address) {
        const parts = p.address.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          citySet.add(parts[parts.length - 2]);
        } else if (parts.length === 1 && parts[0]) {
          citySet.add(parts[0]);
        }
      }
    });
    return Array.from(citySet).filter(Boolean).sort();
  }, [problems]);

  // Dynamic counts for filter options
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    problems.forEach(p => {
      const catKey = p.category_id || p.category_name || 'unknown';
      counts[catKey] = (counts[catKey] || 0) + 1;
    });
    return counts;
  }, [problems]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      submitted: 0,
      verified: 0,
      assigned: 0,
      in_progress: 0,
      resolved: 0
    };
    problems.forEach(p => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });
    return counts;
  }, [problems]);

  // Check if any filter is active
  const hasActiveFilters = search.trim() !== '' ||
    selectedCat !== 'all' ||
    selectedUrgency !== 'all' ||
    selectedStatus !== 'all' ||
    selectedAssignment !== 'all' ||
    selectedCity !== 'all' ||
    sortBy !== 'priority_desc';

  const resetFilters = () => {
    setSearch('');
    setSelectedCat('all');
    setSelectedUrgency('all');
    setSelectedStatus('all');
    setSelectedAssignment('all');
    setSelectedCity('all');
    setSortBy('priority_desc');
  };

  // Filter & Sort logic
  const filtered = useMemo(() => {
    return problems.filter(p => {
      // Category filter
      if (selectedCat !== 'all') {
        const matchesCat = p.category_id === selectedCat ||
          (p.category_name || '').toLowerCase() === selectedCat.toLowerCase();
        if (!matchesCat) return false;
      }

      // Urgency / Priority filter
      if (selectedUrgency !== 'all') {
        const score = p.priority_score ?? 50;
        if (selectedUrgency === 'critical' && !(score >= 80 || p.urgency === 'critical')) return false;
        if (selectedUrgency === 'high' && !((score >= 60 && score < 80) || p.urgency === 'high')) return false;
        if (selectedUrgency === 'medium' && !((score >= 40 && score < 60) || p.urgency === 'medium')) return false;
        if (selectedUrgency === 'low' && !(score < 40 || p.urgency === 'low')) return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;

      // Assignment filter
      if (selectedAssignment === 'assigned' && !p.assigned_institution_id && !p.assigned_institution_name) return false;
      if (selectedAssignment === 'unassigned' && (p.assigned_institution_id || p.assigned_institution_name)) return false;

      // City / Location filter
      if (selectedCity !== 'all' && !(p.address || '').toLowerCase().includes(selectedCity.toLowerCase())) return false;

      // Search Query
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
        case 'votes_asc':
          return (a.supports_count ?? 0) - (b.supports_count ?? 0);
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title_desc':
          return (b.title || '').localeCompare(a.title || '');
        default:
          return (b.priority_score ?? 0) - (a.priority_score ?? 0);
      }
    });
  }, [problems, selectedCat, selectedUrgency, selectedStatus, selectedAssignment, selectedCity, search, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Sparkles className="w-4 h-4" />
            National Societal Challenge Repository
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900">
            Explore Community Challenges
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Browse, upvote, and track {problems.length} citizen-reported societal issues ranked by AI Priority Score.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-4 h-4" /> GIS Map
          </button>
        </div>
      </div>

      {/* Filter & Search Facility */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        {/* Main Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search challenges, keywords, city, labs..."
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

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
            >
              <option value="all">All Domains ({problems.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {categoryCounts[c.id] ? `(${categoryCounts[c.id]})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
            >
              <option value="all">All Lifecycle Statuses</option>
              <option value="submitted">Under Review ({statusCounts.submitted})</option>
              <option value="verified">Verified ({statusCounts.verified})</option>
              <option value="assigned">Assigned to Lab ({statusCounts.assigned})</option>
              <option value="in_progress">In Progress ({statusCounts.in_progress})</option>
              <option value="resolved">Resolved ({statusCounts.resolved})</option>
            </select>
          </div>

          {/* Urgency / Priority Dropdown */}
          <div>
            <select
              value={selectedUrgency}
              onChange={e => setSelectedUrgency(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
            >
              <option value="all">All Severities</option>
              <option value="critical">🔴 Critical (80–100)</option>
              <option value="high">🟠 High (60–79)</option>
              <option value="medium">🟡 Medium (40–59)</option>
              <option value="low">🟢 Low (0–39)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-indigo-900"
            >
              <option value="priority_desc">⚡ AI Priority: High to Low</option>
              <option value="priority_asc">⚡ AI Priority: Low to High</option>
              <option value="votes_desc">👍 Most Citizen Voices</option>
              <option value="votes_asc">👍 Fewest Citizen Voices</option>
              <option value="recent">🕒 Newest Submissions</option>
              <option value="oldest">⏳ Oldest Submissions</option>
              <option value="title_asc">🔤 Title: A to Z</option>
              <option value="title_desc">🔤 Title: Z to A</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Controls (Assignment & City / Region) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              R&D Lab Assignment
            </label>
            <select
              value={selectedAssignment}
              onChange={e => setSelectedAssignment(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium text-slate-700"
            >
              <option value="all">All (Assigned & Unassigned)</option>
              <option value="unassigned">⏳ Seeking University Lab</option>
              <option value="assigned">🏛️ Assigned to University Lab</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              City / Regional Scope
            </label>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium text-slate-700"
            >
              <option value="all">All Locations ({availableCities.length} detected)</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 flex flex-col justify-end">
            {/* Results Count & Reset Action */}
            <div className="flex items-center justify-between gap-2 py-1">
              <span className="text-xs font-semibold text-slate-600">
                Showing <span className="font-bold text-slate-900">{filtered.length}</span> of <span className="font-bold text-slate-900">{problems.length}</span> challenges
              </span>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset All Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Filter Tags & Active Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider mr-1">Quick Select:</span>
          
          <button
            type="button"
            onClick={() => {
              setSelectedUrgency('critical');
              setSelectedStatus('all');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedUrgency === 'critical'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
            }`}
          >
            🔴 Critical Emergencies (80+)
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedAssignment('unassigned');
              setSelectedUrgency('all');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedAssignment === 'unassigned'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            ⏳ Seeking University Labs
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedAssignment('assigned');
              setSelectedUrgency('all');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedAssignment === 'assigned'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            🏛️ Assigned to Labs
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedStatus('resolved');
              setSelectedAssignment('all');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedStatus === 'resolved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            ✅ Resolved & Completed
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCat('cat-water');
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCat === 'cat-water'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200'
            }`}
          >
            💧 Water & Sanitation
          </button>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Active filters:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                Keyword: "{search}"
                <button type="button" onClick={() => setSearch('')} className="hover:text-indigo-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCat !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                Domain: {categories.find(c => c.id === selectedCat)?.name || selectedCat}
                <button type="button" onClick={() => setSelectedCat('all')} className="hover:text-indigo-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                Status: {selectedStatus.replace('_', ' ')}
                <button type="button" onClick={() => setSelectedStatus('all')} className="hover:text-indigo-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedUrgency !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                Severity: {selectedUrgency}
                <button type="button" onClick={() => setSelectedUrgency('all')} className="hover:text-indigo-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedAssignment !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                Assignment: {selectedAssignment === 'assigned' ? 'Assigned' : 'Seeking Lab'}
                <button type="button" onClick={() => setSelectedAssignment('all')} className="hover:text-indigo-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCity !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                City: {selectedCity}
                <button type="button" onClick={() => setSelectedCity('all')} className="hover:text-indigo-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {sortBy !== 'priority_desc' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                Sorted by custom order
                <button type="button" onClick={() => setSortBy('priority_desc')} className="hover:text-slate-950">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAP VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'map' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4 animate-fade-in relative overflow-hidden">
          <LeafletMap
            problems={filtered}
            clusters={clusters}
            height="550px"
            center={[26.2389, 73.0243]}
            zoom={10}
            onSelectProblem={onSelectProblem}
          />
          {/* Floating Priority Levels Legend */}
          <div className="absolute bottom-10 left-10 z-[999] pointer-events-auto hidden sm:block max-w-[210px]">
            <PriorityLevelsLegend
              selectedTier={selectedUrgency !== 'all' ? selectedUrgency : undefined}
              onSelectTier={(tier) => setSelectedUrgency(prev => prev === tier ? 'all' : tier)}
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ZERO MATCHES STATE */}
      {/* ------------------------------------------------------------- */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4 animate-fade-in">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No community challenges match your criteria</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We couldn't find any challenges matching your active filters. Try broadening your criteria or reset all filters.
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Filters
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* GRID VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filtered.map(problem => {
            const isSupported = supportedMap[problem.id] || problem.has_user_supported;
            const theme = getPriorityTheme(problem.priority_score);

            return (
              <div
                key={problem.id}
                onClick={() => onSelectProblem(problem)}
                className={`bg-white rounded-3xl border border-slate-200 ${theme.accentBorder} ${theme.hoverGlow} overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group relative`}
              >
                {/* Image & Badges */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={problem.images[0] || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'}
                    alt={problem.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

                  {/* Category Pill */}
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-extrabold uppercase text-slate-900 tracking-wider shadow-sm">
                    {problem.category_name}
                  </span>

                  {/* Dynamic Priority Badge with Score Color Effect */}
                  <div className="absolute top-3 right-3">
                    <PriorityScoreBadge score={problem.priority_score} showLabel={false} size="sm" />
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="flex items-center gap-1 font-medium text-slate-200 text-[11px] truncate max-w-[200px]">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      {problem.address}
                    </span>
                    <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {new Date(problem.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${theme.pillBg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`} />
                        {theme.label} ({problem.priority_score}/100)
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {problem.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                      {problem.description}
                    </p>
                  </div>

                  {/* Priority Meter Progress Bar */}
                  <div className="space-y-1 py-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className={`w-3 h-3 ${theme.textColor}`} />
                        AI Severity Index
                      </span>
                      <span className={`font-bold text-xs ${theme.textColor}`}>
                        {problem.priority_score}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${theme.barGradient} rounded-full transition-all duration-500`}
                        style={{ width: `${problem.priority_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Institution Assignment */}
                  {problem.assigned_institution_name ? (
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] font-bold uppercase text-indigo-600 block">Assigned University</span>
                        <span className="font-semibold">{problem.assigned_institution_name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Status</span>
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full capitalize">
                        {problem.status.replace('_', ' ')}
                      </span>
                    </div>
                  )}

                  {/* Footer Support Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => handleSupport(problem.id, e)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isSupported
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isSupported ? 'text-emerald-600 fill-emerald-600' : 'text-slate-500'}`} />
                      <span>{problem.supports_count} Voices</span>
                    </button>

                    <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Challenge →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LIST VIEW */}
      {/* ------------------------------------------------------------- */}
      {viewMode === 'list' && filtered.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100 animate-fade-in">
          {filtered.map(problem => {
            const isSupported = supportedMap[problem.id] || problem.has_user_supported;
            const theme = getPriorityTheme(problem.priority_score);

            return (
              <div
                key={problem.id}
                onClick={() => onSelectProblem(problem)}
                className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-2xl ${theme.badgeBg} ${theme.glowShadow} flex flex-col items-center justify-center font-display font-black text-white flex-shrink-0`}>
                    <span className="text-base leading-none">{problem.priority_score}</span>
                    <span className="text-[8px] uppercase tracking-tighter opacity-80">pts</span>
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${theme.pillBg}`}>
                        {theme.label} ({problem.priority_score}/100)
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {problem.category_name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {problem.address}
                      </span>
                      {problem.assigned_institution_name && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          🏛️ {problem.assigned_institution_name}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors">
                      {problem.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{problem.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => handleSupport(problem.id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSupported ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {problem.supports_count}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectProblem(problem)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
