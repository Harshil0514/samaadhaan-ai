import React, { useState, useEffect } from 'react';
import { Problem, Project, SolutionDirection } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SolutionExplorerModal } from '../components/SolutionExplorerModal';
import {
  Lightbulb,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Cpu,
  Award,
  ArrowRight,
  Plus,
  Clock,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExpertDashboardProps {
  onSelectProblem: (problem: Problem) => void;
  onSelectProject: (projectId: string) => void;
}

export const ExpertDashboard: React.FC<ExpertDashboardProps> = ({ onSelectProblem, onSelectProject }) => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'evaluate' | 'projects'>('evaluate');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExpertData() {
      setIsLoading(true);
      try {
        const [probs, projs] = await Promise.all([
          api.getProblems(),
          api.getProjects()
        ]);
        setProblems(probs);
        setProjects(projs);
      } catch (err) {
        console.error('Failed to load expert data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadExpertData();
  }, []);

  const openSolutionPropose = (problem: Problem) => {
    setSelectedProblem(problem);
    setShowSolutionModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Solution Proposal Modal */}
      {selectedProblem && (
        <SolutionExplorerModal
          isOpen={showSolutionModal}
          onClose={() => setShowSolutionModal(false)}
          problem={selectedProblem}
          initialSolutions={[]}
          userRole="expert"
        />
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-amber-800/80 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            <Award className="w-4 h-4" />
            Technical Mentorship & Expert Peer Review Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white">
            Domain Specialist Board
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 max-w-2xl leading-relaxed">
            Evaluate grassroots community problems, author engineering blueprints for student innovation teams, and conduct technical feasibility reviews.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center flex-shrink-0 z-10">
          <div className="text-2xl font-black text-amber-400">{problems.length}</div>
          <div className="text-[10px] uppercase font-bold text-amber-200">Challenges to Review</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('evaluate')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'evaluate' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Engineering Evaluation Queue ({problems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'projects' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Active Student Projects Under Mentorship ({projects.length})
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: EVALUATE & PROPOSE SOLUTIONS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'evaluate' && (
        <div className="space-y-4 animate-fade-in">
          {problems.map(problem => (
            <div
              key={problem.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-amber-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {problem.category_name}
                  </span>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Priority Score {problem.priority_score}/100
                  </span>
                  <span className="text-xs text-slate-500">📍 {problem.address}</span>
                </div>

                <h4
                  onClick={() => onSelectProblem(problem)}
                  className="font-bold text-base text-slate-900 hover:text-amber-700 cursor-pointer"
                >
                  {problem.title}
                </h4>

                <p className="text-xs text-slate-600 line-clamp-2">{problem.description}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-center">
                <button
                  type="button"
                  onClick={() => openSolutionPropose(problem)}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Lightbulb className="w-4 h-4" />
                  Propose Solution Blueprint
                </button>

                <button
                  type="button"
                  onClick={() => onSelectProblem(problem)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Inspect Issue
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: ACTIVE STUDENT PROJECTS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-indigo-300 shadow-xs cursor-pointer space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {project.status.replace('_', ' ')}
                </span>
                <span className="text-xs font-black text-indigo-600">
                  {project.progress}% Completed
                </span>
              </div>

              <h4 className="font-bold text-base text-slate-900">{project.title}</h4>
              <p className="text-xs text-slate-600 line-clamp-2">{project.description}</p>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>🏛️ {project.institution_name}</span>
                <span className="font-bold text-indigo-600">Review Milestones →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
