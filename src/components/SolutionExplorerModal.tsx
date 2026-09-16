import React, { useState } from 'react';
import { Problem, SolutionDirection } from '../types';
import { Sparkles, ThumbsUp, Plus, Lightbulb, Clock, Check, X, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface SolutionExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: Problem;
  initialSolutions?: SolutionDirection[];
  userRole?: string;
  onSolutionAdded?: () => void;
}

export const SolutionExplorerModal: React.FC<SolutionExplorerModalProps> = ({
  isOpen,
  onClose,
  problem,
  initialSolutions = [],
  userRole = 'citizen',
  onSolutionAdded
}) => {
  const [solutions, setSolutions] = useState<SolutionDirection[]>(initialSolutions);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDomain, setNewDomain] = useState('Applied Technology & IoT');
  const [newTimeframe, setNewTimeframe] = useState('4-6 weeks');
  const [newTechs, setNewTechs] = useState('IoT, Microcontrollers, Open Hardware');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleVote = async (solId: string) => {
    try {
      const res = await api.voteSolution(solId);
      setSolutions(prev => prev.map(s => s.id === solId ? { ...s, votes: res.votes } : s));
    } catch {
      // Fallback local update
      setSolutions(prev => prev.map(s => s.id === solId ? { ...s, votes: s.votes + 1 } : s));
    }
  };

  const handleUpdateStatus = async (solId: string, status: string) => {
    try {
      await api.updateSolutionStatus(solId, status);
      setSolutions(prev => prev.map(s => s.id === solId ? { ...s, status: status as any } : s));
    } catch {
      setSolutions(prev => prev.map(s => s.id === solId ? { ...s, status: status as any } : s));
    }
  };

  const handleAddCustomSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;

    setIsSubmitting(true);
    try {
      const created = await api.getSolutions(problem.id); // trigger list
      const added = await fetch(`/api/problems/${problem.id}/solutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          domain: newDomain,
          estimated_timeframe: newTimeframe,
          key_technologies: newTechs.split(',').map(t => t.trim())
        })
      }).then(r => r.json());

      setSolutions(prev => [added, ...prev]);
      setShowAddForm(false);
      setNewTitle('');
      setNewDesc('');
      if (onSolutionAdded) onSolutionAdded();
    } catch {
      // Local fallback
      const mockSol: SolutionDirection = {
        id: `sol-${Date.now()}`,
        problem_id: problem.id,
        title: newTitle,
        description: newDesc,
        domain: newDomain,
        feasibility_score: 90,
        estimated_timeframe: newTimeframe,
        key_technologies: newTechs.split(',').map(t => t.trim()),
        status: 'suggested',
        created_by_ai: false,
        votes: 1
      };
      setSolutions(prev => [mockSol, ...prev]);
      setShowAddForm(false);
      setNewTitle('');
      setNewDesc('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">AI Solution Explorer</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  AI-Assisted Directions
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">Challenge: {problem.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Disclaimer Notice */}
        <div className="my-4 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>
            These are <strong>AI-assisted solution directions</strong> designed to catalyze research proposals. University teams and experts can approve, vote, or contribute domain-specific blueprints.
          </span>
        </div>

        {/* Solution Cards */}
        <div className="space-y-4 my-6">
          {solutions.map((sol) => (
            <div
              key={sol.id}
              className={`p-5 rounded-2xl border transition-all ${
                sol.status === 'approved'
                  ? 'border-emerald-300 bg-emerald-50/30 shadow-sm'
                  : sol.status === 'in_development'
                  ? 'border-indigo-300 bg-indigo-50/30'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {sol.domain}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Feasibility {sol.feasibility_score}%
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {sol.estimated_timeframe}
                    </span>
                    {sol.status === 'approved' && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        ✓ Approved Direction
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    {sol.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">{sol.description}</p>

                  {/* Key Technologies */}
                  {sol.key_technologies && sol.key_technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {sol.key_technologies.map((tech, idx) => (
                        <span key={idx} className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md">
                          #{tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vote & Role Action Controls */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleVote(sol.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all hover:scale-105"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-indigo-600" />
                    {sol.votes} Votes
                  </button>

                  {(userRole === 'institution' || userRole === 'expert' || userRole === 'admin') && (
                    <div className="flex items-center gap-1">
                      {sol.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(sol.id, 'approved')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[11px] font-bold transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {sol.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(sol.id, 'rejected')}
                          className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[11px] font-bold transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Propose Custom Direction Form */}
        {showAddForm ? (
          <form onSubmit={handleAddCustomSolution} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-fade-in">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Propose Expert Innovation Direction
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Solution Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Gravity Hydro-Filter with Solar Micro-telemetry"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Technical Approach</label>
              <textarea
                required
                rows={3}
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Explain the engineering mechanism, materials needed, and community deployment strategy..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Engineering Domain</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  placeholder="e.g. Environmental Chemistry"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Key Technologies (comma separated)</label>
                <input
                  type="text"
                  value={newTechs}
                  onChange={e => setNewTechs(e.target.value)}
                  placeholder="e.g. Bio-filtration, IoT, Solar"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Direction'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="px-5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Propose Additional Solution Direction
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
