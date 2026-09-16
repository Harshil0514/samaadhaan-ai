import React, { useState, useEffect, useMemo } from 'react';
import { Milestone, Project } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  Users,
  ChevronRight,
  ArrowLeft,
  Sliders,
  Award,
  Layers,
  FileCheck,
  Lock,
  ShieldCheck,
  CheckCheck,
  RotateCcw,
  AlertCircle,
  Search,
  X,
  SlidersHorizontal
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectsPageProps {
  selectedProjectId?: string | null;
  onBack?: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ selectedProjectId, onBack }) => {
  const { user, role } = useAuth();
  const isAuthority = role === 'admin' || role === 'institution';

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [selectedProgressTier, setSelectedProgressTier] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'progress_desc' | 'progress_asc' | 'recent' | 'title_asc' | 'inst_asc'>('progress_desc');
  const [isLoading, setIsLoading] = useState(true);
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      setIsLoading(true);
      try {
        const data = await api.getProjects();
        setProjects(data);
        if (selectedProjectId) {
          const found = data.find(p => p.id === selectedProjectId);
          if (found) setActiveProject(found);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, [selectedProjectId]);

  const handleToggleMilestone = async (projectId: string, milestoneId: string, currentStatus: string) => {
    // Strict RBAC: Citizens cannot edit milestone completion status
    if (!isAuthority) {
      setPermissionNotice(
        'Citizen Portal Notice: Milestone completion verification is restricted to authorized institutions and municipal administrators. Citizen accounts have transparent view-only access.'
      );
      return;
    }

    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const res = await api.updateMilestone(milestoneId, { status: nextStatus });
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          const updatedMs = p.milestones.map(m => m.id === milestoneId ? { ...m, status: nextStatus as any } : m);
          const completedCount = updatedMs.filter(m => m.status === 'completed').length;
          const progress = Math.round((completedCount / updatedMs.length) * 100);
          const nextProjectStatus = res?.project_status || (progress === 100 ? 'completed' : p.status);
          const updatedProj = { ...p, milestones: updatedMs, progress, status: nextProjectStatus as any };
          if (activeProject?.id === projectId) setActiveProject(updatedProj);
          return updatedProj;
        }
        return p;
      }));
      if (nextStatus === 'completed') {
        confetti({ particleCount: 40, spread: 50 });
      }
    } catch (err: any) {
      setPermissionNotice(err.message || 'Failed to update milestone status');
    }
  };

  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    // Strict RBAC: Citizens cannot edit whether the project is completed or not
    if (!isAuthority) {
      setPermissionNotice(
        'Permission Denied: Citizens cannot edit project status or mark projects completed. Only authorized institutions and municipal administrators have verification permission.'
      );
      return;
    }

    setIsUpdatingStatus(true);
    setPermissionNotice(null);
    try {
      const isMarkingCompleted = newStatus === 'completed';
      const progressValue = isMarkingCompleted ? 100 : (activeProject?.progress ?? 50);
      const res = await api.updateProject(projectId, {
        status: newStatus as any,
        progress: progressValue
      });

      setProjects(prev => prev.map(p => p.id === projectId ? res.project : p));
      if (activeProject?.id === projectId) {
        setActiveProject(res.project);
      }

      if (isMarkingCompleted) {
        confetti({ particleCount: 90, spread: 80 });
      }
    } catch (err: any) {
      setPermissionNotice(err.message || 'Failed to update project status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const availableInstitutions = useMemo(() => {
    const instSet = new Set<string>();
    projects.forEach(p => {
      if (p.institution_name) instSet.add(p.institution_name);
    });
    return Array.from(instSet).sort();
  }, [projects]);

  const hasActiveFilters = search.trim() !== '' ||
    selectedPhase !== 'all' ||
    selectedInstitution !== 'all' ||
    selectedProgressTier !== 'all' ||
    sortBy !== 'progress_desc';

  const resetFilters = () => {
    setSearch('');
    setSelectedPhase('all');
    setSelectedInstitution('all');
    setSelectedProgressTier('all');
    setSortBy('progress_desc');
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (selectedPhase !== 'all' && p.status !== selectedPhase) return false;
      if (selectedInstitution !== 'all' && p.institution_name !== selectedInstitution) return false;
      if (selectedProgressTier !== 'all') {
        if (selectedProgressTier === 'completed' && (p.progress ?? 0) < 100) return false;
        if (selectedProgressTier === 'advanced' && ((p.progress ?? 0) < 75 || (p.progress ?? 0) === 100)) return false;
        if (selectedProgressTier === 'mid' && ((p.progress ?? 0) < 25 || (p.progress ?? 0) >= 75)) return false;
        if (selectedProgressTier === 'starting' && (p.progress ?? 0) >= 25) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const match = (p.title || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.institution_name || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'progress_desc':
          return (b.progress ?? 0) - (a.progress ?? 0);
        case 'progress_asc':
          return (a.progress ?? 0) - (b.progress ?? 0);
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'inst_asc':
          return (a.institution_name || '').localeCompare(b.institution_name || '');
        case 'recent':
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });
  }, [projects, selectedPhase, selectedInstitution, selectedProgressTier, search, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <FolderKanban className="w-4 h-4" />
            University R&D Engineering Workspace
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900">
            Societal Innovation Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Track prototype milestones, student lab allocations, and field deployment validation.
          </p>
        </div>

        {activeProject && (
          <button
            type="button"
            onClick={() => {
              setActiveProject(null);
              setPermissionNotice(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" /> All Projects List
          </button>
        )}
      </div>

      {/* Permission alert banner */}
      {permissionNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start justify-between gap-3 text-xs font-medium animate-fade-in">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-950">Access Restricted</span>
              <span>{permissionNotice}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPermissionNotice(null)}
            className="text-amber-700 hover:text-amber-950 font-extrabold text-xs ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Detail View of a Selected Project */}
      {activeProject ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border ${
                    activeProject.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                  }`}>
                    Phase: {activeProject.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                    🏛️ {activeProject.institution_name}
                  </span>
                  {activeProject.status === 'completed' && (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Certified Completed Solution
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900">
                  {activeProject.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeProject.description}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center flex-shrink-0 min-w-[170px]">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Completion</div>
                <div className="text-3xl font-black text-indigo-600 mt-1">{activeProject.progress}%</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {activeProject.milestones.filter(m => m.status === 'completed').length} of {activeProject.milestones.length} Milestones
                </div>
              </div>
            </div>

            {/* Authority Completion & Lifecycle Management Controls OR Citizen Verification Record */}
            {isAuthority ? (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 space-y-4 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                        Authority Control: Project Completion & Lifecycle
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Authorized institution researchers and municipal administrators have official sign-off permissions.
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
                    Active Authority: {user?.role?.toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-300 font-semibold mr-1">Change Phase:</span>
                    {[
                      { id: 'solution_design', label: 'Solution Design' },
                      { id: 'prototype', label: 'Prototype Lab' },
                      { id: 'testing', label: 'Field Testing' },
                      { id: 'pilot', label: 'Pilot Live' },
                      { id: 'completed', label: 'Completed' }
                    ].map(st => (
                      <button
                        key={st.id}
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateProjectStatus(activeProject.id, st.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          activeProject.status === st.id
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white/10 hover:bg-white/20 text-slate-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {activeProject.status === 'completed' ? (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateProjectStatus(activeProject.id, 'testing')}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm flex-shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reopen for Field Re-validation
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateProjectStatus(activeProject.id, 'completed')}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg hover:scale-105 flex-shrink-0"
                    >
                      <CheckCheck className="w-4 h-4 text-emerald-950" />
                      {isUpdatingStatus ? 'Certifying...' : 'Mark Project as Completed & Delivered'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Citizen Portal Mode: Verified Public Record (Read-Only)
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Project status and milestone sign-off is restricted to authorized academic leads ({activeProject.institution_name}) and municipal authorities.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] flex items-center gap-1.5 border ${
                    activeProject.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                  }`}>
                    {activeProject.status === 'completed' ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Status: Certified Completed
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        Status: {activeProject.status.replace('_', ' ')}
                      </>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Student & Faculty Team Allocation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Student Innovation Lead</div>
                  <div className="text-[11px] text-slate-500">Rohit Verma (B.Tech IITJ)</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Faculty Research Mentor</div>
                  <div className="text-[11px] text-slate-500">Dr. A. Sharma (HOD Enviro)</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Laboratory Facility</div>
                  <div className="text-[11px] text-slate-500">{activeProject.institution_name}</div>
                </div>
              </div>
            </div>

            {/* Milestones Checklist */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Engineering Deliverables Checklist
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAuthority
                      ? 'Authorized personnel: Click deliverables to certify completion and update project progress.'
                      : 'Verified by authorized university R&D leads and municipal administrators (Citizen View-Only).'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isAuthority ? (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Authority Sign-off Enabled
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-slate-500" />
                      Citizen View-Only
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {activeProject.milestones.map((m, idx) => {
                  const isDone = m.status === 'completed';
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleToggleMilestone(activeProject.id, m.id, m.status)}
                      title={isAuthority ? 'Click to toggle completion' : 'Citizen view-only: Only authorized personnel can modify completion'}
                      className={`p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        isAuthority
                          ? 'cursor-pointer hover:border-indigo-300'
                          : 'cursor-default'
                      } ${
                        isDone
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm">{m.title}</h4>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isDone ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {isDone ? 'Completed (Verified)' : m.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-slate-400 font-semibold">
                          Due: {m.due_date}
                        </div>
                        {isAuthority ? (
                          <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                            {isDone ? 'Click to Reopen' : 'Click to Verify'}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1 justify-end">
                            <Lock className="w-2.5 h-2.5" /> Certified
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search projects, labs, solutions..."
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

              {/* Institution Filter */}
              <div>
                <select
                  value={selectedInstitution}
                  onChange={e => setSelectedInstitution(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
                >
                  <option value="all">All University Labs ({availableInstitutions.length})</option>
                  {availableInstitutions.map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>

              {/* Progress Tier Filter */}
              <div>
                <select
                  value={selectedProgressTier}
                  onChange={e => setSelectedProgressTier(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
                >
                  <option value="all">All Progress Stages</option>
                  <option value="completed">🏆 Completed (100%)</option>
                  <option value="advanced">🚀 Advanced Stage (75–99%)</option>
                  <option value="mid">🔬 Lab Development (25–74%)</option>
                  <option value="starting">📐 Early Architecture (0–24%)</option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-indigo-900"
                >
                  <option value="progress_desc">📈 Progress: High to Low</option>
                  <option value="progress_asc">📉 Progress: Low to High</option>
                  <option value="recent">🕒 Recently Added</option>
                  <option value="title_asc">🔤 Project Title: A to Z</option>
                  <option value="inst_asc">🏛️ University Lab: A to Z</option>
                </select>
              </div>
            </div>

            {/* Phase Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2">Lifecycle Phase:</span>
              {[
                { id: 'all', label: 'All Phases' },
                { id: 'solution_design', label: '1. Solution Design' },
                { id: 'prototype', label: '2. Prototype Lab' },
                { id: 'testing', label: '3. Field Testing' },
                { id: 'pilot', label: '4. Pilot Live' },
                { id: 'completed', label: '5. Completed & Implemented' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedPhase(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedPhase === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Results Count & Active Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">
                  Showing <span className="font-bold text-slate-900">{filteredProjects.length}</span> of <span className="font-bold text-slate-900">{projects.length}</span> projects
                </span>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors ml-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {search && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                      "{search}"
                      <button type="button" onClick={() => setSearch('')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedInstitution !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                      {selectedInstitution}
                      <button type="button" onClick={() => setSelectedInstitution('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedProgressTier !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                      Stage: {selectedProgressTier}
                      <button type="button" onClick={() => setSelectedProgressTier('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedPhase !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-medium">
                      Phase: {selectedPhase.replace('_', ' ')}
                      <button type="button" onClick={() => setSelectedPhase('all')}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Zero Results State */}
          {filteredProjects.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4 animate-fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <SlidersHorizontal className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">No innovation projects match your filters</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try adjusting the lifecycle phase, university lab, or search keyword to view other engineering initiatives.
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map(project => (
              <div
                key={project.id}
                onClick={() => {
                  setActiveProject(project);
                  setPermissionNotice(null);
                }}
                className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      project.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      project.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {project.progress}% Done
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {project.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium truncate max-w-[200px]">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      {project.institution_name}
                    </span>
                    <span className="font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Workspace →
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        project.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
