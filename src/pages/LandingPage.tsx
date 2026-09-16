import React, { useState, useEffect } from 'react';
import { Problem, ProblemCluster, Category, AnalyticsOverview } from '../types';
import { api } from '../services/api';
import { LeafletMap } from '../components/LeafletMap';
import { PriorityScoreCard, PriorityScoreBadge, getPriorityTheme } from '../components/PriorityScoreCard';
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Users,
  Building2,
  Cpu,
  CheckCircle2,
  Layers,
  ThumbsUp,
  MapPin,
  TrendingUp,
  Flame,
  Award,
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onOpenReport: () => void;
  onSelectProblem: (problem: Problem) => void;
  setCurrentTab: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenReport,
  onSelectProblem,
  setCurrentTab
}) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [clusters, setClusters] = useState<ProblemCluster[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [supportedMap, setSupportedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const [probs, clus, cats, stats] = await Promise.all([
          api.getProblems({ limit: 12 }),
          api.getClusters(),
          api.getCategories(),
          api.getAnalyticsOverview()
        ]);
        setProblems(probs);
        setClusters(clus);
        setCategories(cats);
        setOverview(stats);
      } catch (err) {
        console.error('Failed to load landing data:', err);
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

  const filteredProblems = selectedCat === 'all'
    ? problems
    : problems.filter(p => p.category_id === selectedCat || (p.category_name || '').toLowerCase() === selectedCat.toLowerCase());

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-800 shadow-xs animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              <span>National Societal Innovation Platform</span>
              <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
              <span className="text-indigo-600">SIH 2026</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black text-slate-900 tracking-tight leading-[1.1]">
              Turning Citizen Problems Into <span className="text-indigo-600 underline decoration-emerald-400 decoration-wavy decoration-2">Real Innovations</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Empowering citizens to report critical civic and rural challenges. CivicSetu's AI brain clusters local signals, computes multi-factor priority scores, and pairs them directly with premier university research labs to engineer real-world hardware & IoT solutions.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={onOpenReport}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                Report a Community Issue
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('explore')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <CompassIcon className="w-4 h-4 text-indigo-600" />
                Explore Active Challenges ({problems.length})
              </button>
            </div>
          </div>

          {/* 2. INNOVATION LIFECYCLE PIPELINE (INTERACTIVE PROCESS FLOW) */}
          <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                  End-to-End Governance Engine
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                  The CivicSetu Innovation Pipeline
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                From Grassroots Complaint to Functional Deployed Prototype
              </span>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h4 className="font-bold text-sm text-white">Citizen Report</h4>
                <p className="text-[11px] text-slate-400 leading-snug">
                  GPS-tagged photo & complaint submitted via web portal or mobile.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-indigo-500/50 space-y-2 shadow-lg shadow-indigo-500/10">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  AI Brain Analysis
                </h4>
                <p className="text-[11px] text-slate-400 leading-snug">
                  NLP categorization, duplicate detection, and 5-factor priority calculation.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h4 className="font-bold text-sm text-white">Challenge Cluster</h4>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Similar local reports merged into a high-impact community innovation challenge.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  04
                </div>
                <h4 className="font-bold text-sm text-white">University R&D</h4>
                <p className="text-[11px] text-slate-400 leading-snug">
                  IIT/CSIR lab assigned via 4-factor compatibility matching for hardware development.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-emerald-500/40 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  05
                </div>
                <h4 className="font-bold text-sm text-emerald-400">Field Deployment</h4>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Prototype stress-tested on-site, resolving the citizen issue permanently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. KEY METRICS COUNTER BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-2xl sm:text-3xl font-display font-black text-slate-900">
              {overview?.total_problems || 50}+
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              Active Community Reports
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">100% Geo-tagged & AI Ranked</div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-2xl sm:text-3xl font-display font-black text-indigo-600">
              {overview?.active_projects || 4}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              University R&D Projects
            </div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-1">IIT Jodhpur, NEERI, ICAR</div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-2xl sm:text-3xl font-display font-black text-amber-600">
              {overview?.total_clusters || 6}
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              High-Density Clusters
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-1">Auto-merged by location & NLP</div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="text-2xl sm:text-3xl font-display font-black text-emerald-600">
              {(overview?.estimated_citizens_impacted || 45000).toLocaleString()}+
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
              Citizens Impacted
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">Across 4 Pilot Districts</div>
          </div>
        </div>
      </section>

      {/* 4. GIS LIVE PROBLEM HEATMAP SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Live Geospatial Telemetry
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
                National Societal Challenge Map
              </h2>
              <p className="text-xs text-slate-500">
                Pins indicate citizen reports sized & color-coded by AI Priority Score. Pulsing rings highlight critical emergency zones.
              </p>
            </div>

            <button
              onClick={() => setCurrentTab('map')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto transition-colors"
            >
              Open Fullscreen GIS Workspace
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Leaflet Map Preview */}
          <LeafletMap
            problems={problems}
            clusters={clusters}
            height="460px"
            center={[26.2389, 73.0243]} // Jodhpur/Rajasthan active cluster center
            zoom={11}
            onSelectProblem={onSelectProblem}
          />

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-2 gap-4 border-t border-slate-100">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span> Critical Priority (85-100)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span> High Priority (70-84)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span> Moderate (50-69)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Low (0-49)
              </span>
            </div>
            <span className="font-semibold text-indigo-600">
              Interactive Leaflet GIS with OpenStreetMap Engine
            </span>
          </div>
        </div>
      </section>

      {/* 5. CATEGORIES EXPLORER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
            Societal Innovation Domains
          </h2>
          <p className="text-xs text-slate-500">
            Click on any domain to filter active citizen challenges and university innovation pipelines.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setSelectedCat('all')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              selectedCat === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-xs font-bold">All Domains</div>
            <div className={`text-[11px] mt-1 ${selectedCat === 'all' ? 'text-indigo-200' : 'text-slate-500'}`}>
              {problems.length} Total Issues
            </div>
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                selectedCat === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold truncate">{cat.name}</div>
              <div className={`text-[11px] mt-1 ${selectedCat === cat.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                {cat.count || problems.filter(p => p.category_id === cat.id).length} Challenges
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 6. FEATURED HIGH-PRIORITY CHALLENGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-600">
              <Flame className="w-4 h-4 text-red-500" />
              Prioritized by AI Score
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Top Community Challenges
            </h2>
          </div>
          <button
            onClick={() => setCurrentTab('explore')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View All ({problems.length})
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProblems.slice(0, 6).map(problem => {
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

                  {/* Institution Assignment or Status Tag */}
                  {problem.assigned_institution_name ? (
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <div className="truncate">
                        <span className="text-[10px] font-bold uppercase text-indigo-600 block">Assigned R&D Hub</span>
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
                      View Challenge
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. PERSONA WORKSPACE TILES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
            Tailored Stakeholder Ecosystem
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">
            Designed for Every Stakeholder
          </h2>
          <p className="text-xs text-slate-500">
            CivicSetu bridges civic reality with academia, government administrators, and industrial mentorship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Citizen Tile */}
          <div
            onClick={() => setCurrentTab('citizen')}
            className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">For Citizens</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Report issues with live GPS photos, unite community support via upvotes, and track prototype development milestones.
            </p>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Enter Citizen Portal <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* University Tile */}
          <div
            onClick={() => setCurrentTab('institution')}
            className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">For Universities & Labs</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Review AI-matched problem challenges, assign student innovation teams, build real hardware prototypes, and track deliverables.
            </p>
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Enter R&D Workspace <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Govt Admin Tile */}
          <div
            onClick={() => setCurrentTab('admin')}
            className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-slate-900 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">For Govt & Municipalities</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Geospatial cluster analysis, priority oversight, problem verification, and university R&D grant disbursement.
            </p>
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Enter Admin Portal <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Expert Mentor Tile */}
          <div
            onClick={() => setCurrentTab('expert')}
            className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">For Domain Experts</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Provide engineering review, evaluate prototype feasibility, propose innovative directions, and mentor student projects.
            </p>
            <span className="text-xs font-bold text-amber-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Enter Expert Hub <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </section>

      {/* 8. REPORT CALL-TO-ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-emerald-700 p-8 sm:p-12 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
              Witness a Problem in Your Locality?
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              Don't let it stay ignored. Submit a report in 60 seconds with our AI Assistant. Our duplicate detection engine connects you with neighboring citizens immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenReport}
            className="px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm shadow-xl flex items-center gap-2 flex-shrink-0 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Start Instant AI Report
          </button>
        </div>
      </section>
    </div>
  );
};

function CompassIcon(props: any) {
  return <Compass {...props} />;
}
import { Compass } from 'lucide-react';
