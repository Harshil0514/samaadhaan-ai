import React, { useState, useEffect } from 'react';
import { Institution, Milestone, Problem, Project } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  FolderKanban,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
  Plus,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InstitutionDashboardProps {
  onSelectProblem: (problem: Problem) => void;
  onSelectProject: (projectId: string) => void;
}

export const InstitutionDashboard: React.FC<InstitutionDashboardProps> = ({ onSelectProblem, onSelectProject }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recommendedProblems, setRecommendedProblems] = useState<Problem[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'matched'>('projects');
  const [isLoading, setIsLoading] = useState(true);
  const [claimingProblemId, setClaimingProblemId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [projs, probs, insts] = await Promise.all([
          api.getProjects(),
          api.getProblems(),
          api.getInstitutions()
        ]);
        setProjects(projs);
        setInstitutions(insts);

        // Problems with high compatibility score or unassigned
        const matched = probs.filter(p => !p.assigned_institution_id && p.priority_score >= 70);
        setRecommendedProblems(matched);
      } catch (err) {
        console.error('Failed to load institution data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleClaimChallenge = async (problem: Problem) => {
    setClaimingProblemId(problem.id);
    try {
      const inst = institutions[0] || { id: 'inst-1', name: 'IIT Jodhpur Centre for Water R&D' };

      // Update problem
      await api.updateProblem(problem.id, {
        assigned_institution_id: inst.id,
        status: 'assigned'
      });

      // Create new project
      const projRes = await api.createProject({
        title: `${problem.category_name} Innovation: ${problem.title}`,
        description: `Applied engineering prototype development by student researchers for ${problem.title}.`,
        problem_id: problem.id,
        institution_id: inst.id
      });

      setProjects(prev => [projRes.project, ...prev]);
      setRecommendedProblems(prev => prev.filter(p => p.id !== problem.id));

      confetti({ particleCount: 80, spread: 70 });
      alert(`Challenge claimed! Project "${projRes.project.title}" created.`);
    } catch (err: any) {
      alert(err.message || 'Failed to claim challenge');
    } finally {
      setClaimingProblemId(null);
    }
  };

  const handleToggleMilestone = async (projectId: string, milestoneId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const res = await api.updateMilestone(milestoneId, { status: nextStatus });
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          const updatedMs = p.milestones.map(m => m.id === milestoneId ? { ...m, status: nextStatus as any } : m);
          const completedCount = updatedMs.filter(m => m.status === 'completed').length;
          const progress = Math.round((completedCount / updatedMs.length) * 100);
          const nextProjectStatus = res?.project_status || (progress === 100 ? 'completed' : p.status);
          return { ...p, milestones: updatedMs, progress, status: nextProjectStatus as any };
        }
        return p;
      }));
      if (nextStatus === 'completed') {
        confetti({ particleCount: 30, spread: 40 });
      }
    } catch {
      // Ignore
    }
  };

  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const res = await api.updateProject(projectId, {
        status: newStatus as any,
        progress: newStatus === 'completed' ? 100 : undefined
      });
      setProjects(prev => prev.map(p => p.id === projectId ? res.project : p));
      if (newStatus === 'completed') {
        confetti({ particleCount: 50, spread: 60 });
      }
    } catch (err) {
      console.error('Failed to update project status:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-indigo-800/80 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-indigo-300">
            <Building2 className="w-4 h-4 text-indigo-300" />
            University Innovation & R&D Laboratory Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white">
            IIT Jodhpur Societal Engineering Lab
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl leading-relaxed">
            Claim AI-matched grassroots problems, deploy interdisciplinary student engineering teams, and deliver field-tested prototypes.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 flex-shrink-0">
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
            <div className="text-2xl font-black text-emerald-400">{projects.length}</div>
            <div className="text-[10px] uppercase font-bold text-indigo-200">Active Projects</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
            <div className="text-2xl font-black text-amber-400">95%</div>
            <div className="text-[10px] uppercase font-bold text-indigo-200">Domain Match</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'projects' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          My Active Innovation Projects ({projects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('matched')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'matched' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          AI-Recommended Challenges for Lab ({recommendedProblems.length})
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: ACTIVE PROJECTS & MILESTONES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'projects' && (
        <div className="space-y-6 animate-fade-in">
          {projects.map(project => (
            <div
              key={project.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      Phase: {project.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Project ID: {project.id}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{project.title}</h3>
                  <p className="text-xs text-slate-600 max-w-2xl">{project.description}</p>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Milestone Progress</div>
                    <div className="text-2xl font-black text-indigo-600">{project.progress}%</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {project.status === 'completed' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Completed & Certified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateProjectStatus(project.id, 'completed')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        title="Authorized Institution Action: Certify and mark project as completed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Certify Completed
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectProject(project.id)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      Open Workspace <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              {/* Interactive Milestone Checklist */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Deliverable Milestones
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {project.milestones.map(m => {
                    const isDone = m.status === 'completed';
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleToggleMilestone(project.id, m.id, m.status)}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                          isDone
                            ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            Due: {m.due_date}
                          </span>
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                            isDone ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                          }`}>
                            {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                        <h5 className="font-bold text-xs leading-snug">{m.title}</h5>
                        <p className="text-[11px] opacity-75 line-clamp-2 mt-1">{m.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: AI-RECOMMENDED CHALLENGES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'matched' && (
        <div className="space-y-4 animate-fade-in">
          {recommendedProblems.map(problem => (
            <div
              key={problem.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-indigo-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    {problem.category_name}
                  </span>
                  <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    Priority Score {problem.priority_score}/100
                  </span>
                  <span className="text-xs text-slate-500">📍 {problem.address}</span>
                </div>

                <h4
                  onClick={() => onSelectProblem(problem)}
                  className="font-bold text-base text-slate-900 hover:text-indigo-600 cursor-pointer"
                >
                  {problem.title}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-2">{problem.description}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-center">
                <button
                  type="button"
                  disabled={claimingProblemId === problem.id}
                  onClick={() => handleClaimChallenge(problem)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
                >
                  {claimingProblemId === problem.id ? 'Claiming...' : 'Claim Challenge for Lab'}
                </button>

                <button
                  type="button"
                  onClick={() => onSelectProblem(problem)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Inspect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
