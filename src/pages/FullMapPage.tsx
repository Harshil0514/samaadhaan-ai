import React, { useState, useEffect, useMemo } from 'react';
import { Problem, ProblemCluster, Category } from '../types';
import { api } from '../services/api';
import { LeafletMap } from '../components/LeafletMap';
import { PriorityScoreCard, PriorityLevelsLegend } from '../components/PriorityScoreCard';
import {
  MapPin,
  Layers,
  Filter,
  Sparkles,
  ThumbsUp,
  Building2,
  X,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Search,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';

interface FullMapPageProps {
  onSelectProblem: (problem: Problem) => void;
  onOpenReport: () => void;
}

export const FullMapPage: React.FC<FullMapPageProps> = ({ onSelectProblem, onOpenReport }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [clusters, setClusters] = useState<ProblemCluster[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [showClusters, setShowClusters] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMapData() {
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
        if (probs.length > 0) setActiveProblem(probs[0]);
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMapData();
  }, []);

  const hasActiveFilters = search.trim() !== '' ||
    selectedCat !== 'all' ||
    selectedUrgency !== 'all' ||
    selectedStatus !== 'all';

  const resetFilters = () => {
    setSearch('');
    setSelectedCat('all');
    setSelectedUrgency('all');
    setSelectedStatus('all');
  };

  const filteredProblems = useMemo(() => {
    return problems.filter(p => {
      if (selectedCat !== 'all' && p.category_id !== selectedCat && (p.category_name || '').toLowerCase() !== selectedCat.toLowerCase()) return false;
      if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
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
    });
  }, [problems, selectedCat, selectedUrgency, selectedStatus, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Layers className="w-4 h-4" />
            Interactive National Problem GIS Layer
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900">
            Societal Problem Heatmap & Density Clusters
          </h1>
          <p className="text-xs text-slate-500">
            Click any pin or cluster radius to inspect ground reports, severity scores, and assigned university research labs.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search location, problem..."
              className="pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedUrgency}
            onChange={e => setSelectedUrgency(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="all">All Priority Levels</option>
            <option value="critical">🔴 Critical (80–100)</option>
            <option value="high">🟠 High (60–79)</option>
            <option value="medium">🟡 Medium (40–59)</option>
            <option value="low">🟢 Low (0–39)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="verified">Verified</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <button
            type="button"
            onClick={() => setShowClusters(!showClusters)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              showClusters ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {showClusters ? 'Hide Clusters' : 'Show Clusters'}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}

          <div className="text-[11px] font-semibold text-slate-500 px-2 py-1 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900">{filteredProblems.length}</span>/{problems.length} Pins
          </div>
        </div>
      </div>

      {/* Main Map + Inspector Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full Interactive Map */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-4 border border-slate-200 shadow-xs overflow-hidden h-[600px] relative">
          <LeafletMap
            problems={filteredProblems}
            clusters={showClusters ? clusters : []}
            height="100%"
            center={[26.2389, 73.0243]}
            zoom={11}
            onSelectProblem={(p) => setActiveProblem(p)}
          />

          {/* Floating Priority Levels Legend */}
          <div className="absolute bottom-6 left-6 z-[999] pointer-events-auto hidden sm:block max-w-[210px]">
            <PriorityLevelsLegend
              selectedTier={selectedUrgency !== 'all' ? selectedUrgency : undefined}
              onSelectTier={(tier) => setSelectedUrgency(prev => prev === tier ? 'all' : tier)}
            />
          </div>
        </div>

        {/* Slide-over Problem Inspector */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between h-[600px] overflow-y-auto space-y-4">
          {activeProblem ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {activeProblem.category_name}
                </span>
                <PriorityScoreCard score={activeProblem.priority_score} compact />
              </div>

              {/* Problem Photo */}
              <div className="h-36 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={activeProblem.images[0] || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'}
                  alt={activeProblem.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 leading-snug">
                  {activeProblem.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 mt-1 leading-relaxed">
                  {activeProblem.description}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate">{activeProblem.address}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 pt-1">
                  <span>GPS: {activeProblem.latitude.toFixed(4)}, {activeProblem.longitude.toFixed(4)}</span>
                  <span className="font-bold text-indigo-600">👍 {activeProblem.supports_count} Voices</span>
                </div>
              </div>

              {activeProblem.assigned_institution_name ? (
                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] font-bold uppercase text-indigo-600 block">Assigned R&D Hub</span>
                    <span className="font-bold">{activeProblem.assigned_institution_name}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">Pending University Assignment</span>
                  <p className="text-[11px] text-amber-800">Ranked by AI for engineering lab claiming.</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => onSelectProblem(activeProblem)}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
              >
                Inspect Full AI Problem Dossier
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Click any problem pin on the GIS map to inspect details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
