import React, { useState, useEffect } from 'react';
import { Problem, InstitutionRecommendation, SolutionDirection, Role } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PriorityScoreCard } from '../components/PriorityScoreCard';
import { SolutionExplorerModal } from '../components/SolutionExplorerModal';
import { LeafletMap } from '../components/LeafletMap';
import {
  ArrowLeft,
  ThumbsUp,
  Sparkles,
  MapPin,
  Building2,
  CheckCircle2,
  Layers,
  Lightbulb,
  Cpu,
  Calendar,
  User,
  ShieldAlert,
  Clock,
  Share2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProblemDetailPageProps {
  problemId: string;
  onBack: () => void;
  onSelectProject?: (projectId: string) => void;
}

export const ProblemDetailPage: React.FC<ProblemDetailPageProps> = ({ problemId, onBack, onSelectProject }) => {
  const { role, user } = useAuth();
  const [problem, setProblem] = useState<(Problem & {
    similar_problems?: { problem: Problem; similarityScore: number; distanceKm: number }[];
    recommended_institutions?: InstitutionRecommendation[];
    solutions?: SolutionDirection[];
  }) | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [supportsCount, setSupportsCount] = useState(0);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      setIsLoading(true);
      try {
        const data = await api.getProblem(problemId);
        setProblem(data);
        setIsSupported(!!data.has_user_supported);
        setSupportsCount(data.supports_count);
      } catch (err) {
        console.error('Failed to load problem:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDetail();
  }, [problemId]);

  const handleSupport = async () => {
  if (!problem || !user) {
    alert("Please log in to support this challenge!");
    return;
  }
  
  try {
    // Pass user.id or user token to the API service
    const res = await api.supportProblem(problem.id, user.id);
    
    setIsSupported(res.supported);
    setSupportsCount(res.count);
    if (res.new_priority_score) {
      setProblem(prev => prev ? { ...prev, priority_score: res.new_priority_score! } : null);
    }
    if (res.supported) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
  } catch (err: any) {
    console.error('Failed to update support in Supabase:', err);
    alert(err.response?.data?.detail || 'Could not register your support. Check backend logs.');
  }
};

  const handleAssignInstitution = async (instId: string, instName: string) => {
    if (!problem) return;
    setAssigningId(instId);
    try {
      // 1. Update problem status
      await api.updateProblem(problem.id, {
        assigned_institution_id: instId,
        status: 'assigned'
      });

      // 2. Initialize project
      const projRes = await api.createProject({
        title: `${problem.category_name} Solution: ${problem.title}`,
        description: `Applied societal engineering research and prototype deployment initiated for ${problem.title}.`,
        problem_id: problem.id,
        institution_id: instId
      });

      setProblem(prev => prev ? {
        ...prev,
        assigned_institution_id: instId,
        assigned_institution_name: instName,
        status: 'assigned',
        project_id: projRes.project.id
      } : null);

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
      alert(`Challenge successfully assigned to ${instName}! Innovation project initialized.`);
    } catch (err: any) {
      alert(err.message || 'Failed to assign institution');
    } finally {
      setAssigningId(null);
    }
  };

  if (isLoading || !problem) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 animate-spin mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Loading Challenge Data & AI Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Solution Explorer Modal */}
      <SolutionExplorerModal
        isOpen={showSolutionModal}
        onClose={() => setShowSolutionModal(false)}
        problem={problem}
        initialSolutions={problem.solutions || []}
        userRole={role}
      />

      {/* Top Breadcrumbs & Back */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Challenges
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Challenge ID: {problem.id}</span>
        </div>
      </div>

      {/* Main Title & Action Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-extrabold uppercase tracking-wider">
                {problem.category_name}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold capitalize">
                {problem.status.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold capitalize">
                Urgency: {problem.urgency}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-slate-900 leading-tight">
              {problem.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {problem.address}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Reported by {problem.author_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(problem.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Upvote / Support Big Action */}
          <div className="flex flex-col items-center sm:items-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleSupport}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-105 ${
                isSupported
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-4 ring-emerald-100'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${isSupported ? 'fill-white' : ''}`} />
              <span>{isSupported ? 'Supported by You' : 'Support this Challenge'}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px]">{supportsCount}</span>
            </button>

            <span className="text-[11px] text-slate-400">
              Each upvote increases Priority Score by +0.25 pts
            </span>
          </div>
        </div>

        {/* Media & Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Photos */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 h-72 relative bg-slate-100">
            <img
              src={problem.images[0] || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'}
              alt={problem.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-white text-[11px] font-semibold">
              Verified Citizen Photo Evidence
            </div>
          </div>

          {/* Map Location */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 h-72">
            <LeafletMap
              problems={[problem]}
              height="100%"
              center={[problem.latitude, problem.longitude]}
              zoom={14}
            />
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider text-[11px]">
            Problem Field Narrative
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {problem.description}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. EXPLAINABLE AI PRIORITY BREAKDOWN CARD */}
      {/* ------------------------------------------------------------- */}
      <PriorityScoreCard
        score={problem.priority_score}
        breakdown={problem.ai_analysis?.priority_breakdown}
      />

      {/* ------------------------------------------------------------- */}
      {/* 3. AI PROBLEM INTELLIGENCE & RECOMMENDED ACTIONS */}
      {/* ------------------------------------------------------------- */}
      {problem.ai_analysis && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI Problem Intelligence Insights</h3>
              <p className="text-xs text-slate-500 font-medium">
                NLP Classification & Societal Risk Evaluation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">
                  Executive Summary
                </span>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                  {problem.ai_analysis.summary}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Extracted Societal Keywords
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {problem.ai_analysis.keywords.map((kw, i) => (
                    <span key={i} className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-100">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 block">
                Recommended Innovation Actions
              </span>
              <div className="space-y-2">
                {problem.ai_analysis.recommended_actions.map((act, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. AI SOLUTION DIRECTIONS (PROPOSALS) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI-Suggested Solution Directions</h3>
              <p className="text-xs text-slate-500 font-medium">
                Engineered blueprints for academic researchers and student innovation teams
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSolutionModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 flex items-center gap-1.5 self-start sm:self-auto transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Explore / Propose Solution
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(problem.solutions || []).slice(0, 2).map((sol) => (
            <div key={sol.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                  {sol.domain}
                </span>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {sol.feasibility_score}% Feasible
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{sol.title}</h4>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{sol.description}</p>
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {sol.estimated_timeframe}
                </span>
                <span className="font-bold text-indigo-600">👍 {sol.votes} votes</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. RECOMMENDED ACADEMIC INSTITUTIONS & LAB MATCHING */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Institution & Laboratory Matcher</h3>
            <p className="text-xs text-slate-500 font-medium">
              Ranked by 4-Factor Compatibility: Category (40%), Keywords (25%), Expertise (20%), Availability (15%)
            </p>
          </div>
        </div>

        {/* Assigned Notice if already assigned */}
        {problem.assigned_institution_name && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="font-bold">Officially Assigned to {problem.assigned_institution_name}</span>
                <p className="text-emerald-800 text-[11px]">Active innovation project initialized with student research team.</p>
              </div>
            </div>

            {problem.project_id && onSelectProject && (
              <button
                type="button"
                onClick={() => onSelectProject(problem.project_id!)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                View Project Workspace
              </button>
            )}
          </div>
        )}

        {/* Recommendations List */}
        <div className="space-y-4">
          {(problem.recommended_institutions || []).map((rec, index) => {
            const inst = rec?.institution;
            if (!inst) return null;
            const isCurrentlyAssigned = problem.assigned_institution_id === inst.id;
            const institutionType = (inst.type || 'R&D Institution').toUpperCase();
            const locationLabel = inst.location || (inst.city ? `${inst.city}, ${inst.state || 'India'}` : 'National Innovation Hub');

            return (
              <div
                key={inst.id || index}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {institutionType}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {rec.compatibility_score}% AI Compatibility Match
                    </span>
                    <span className="text-xs text-slate-500">
                      📍 {locationLabel}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900">{inst.name}</h4>

                  <ul className="space-y-1 text-xs text-slate-600">
                    {(rec.match_reasons || []).map((reason, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span>Active Projects: <strong className="text-slate-800">{inst.active_projects_count ?? 0}</strong></span>
                    <span>Completed Deployments: <strong className="text-slate-800">{inst.completed_projects_count ?? 0}</strong></span>
                  </div>
                </div>

                {/* Assignment Action */}
                <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
                  {isCurrentlyAssigned ? (
                    <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Assigned Hub
                    </span>
                  ) : (role === 'admin' || role === 'institution') ? (
                    <button
                      type="button"
                      disabled={assigningId === inst.id}
                      onClick={() => handleAssignInstitution(inst.id, inst.name)}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
                    >
                      {assigningId === inst.id ? 'Assigning...' : 'Assign Challenge to Lab'}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Matched by AI Engine
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
