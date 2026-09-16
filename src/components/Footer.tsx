import React, { useState } from 'react';
import { Sparkles, RotateCcw, ShieldCheck, Award, Building, Heart } from 'lucide-react';
import { api } from '../services/api';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
  onRefreshData?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab, onRefreshData }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleResetData = async () => {
    if (confirm('Reset sample problems, clusters, and innovation projects back to initial 50+ seed records?')) {
      setIsResetting(true);
      try {
        await api.resetDatabase();
        setResetMessage('Database successfully re-seeded!');
        if (onRefreshData) onRefreshData();
        setTimeout(() => setResetMessage(''), 4000);
      } catch {
        setResetMessage('Reset failed.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xl font-display font-black tracking-tight text-white">
                CIVIC<span className="text-indigo-400">SETU</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              An AI-powered societal innovation platform transforming citizen-reported civic challenges into high-impact engineering projects with leading academic institutions and domain experts.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Smart India Hackathon 2026 Initiative</span>
            </div>
          </div>

          {/* Persona Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3.5">
              Platform Workspaces
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => setCurrentTab('citizen')} className="hover:text-white transition-colors">
                  Citizen Reporting Hub
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('institution')} className="hover:text-white transition-colors">
                  University R&D Portal
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('admin')} className="hover:text-white transition-colors">
                  Government Authority Board
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('expert')} className="hover:text-white transition-colors">
                  Domain Expert Mentorship
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3.5">
              Exploration
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button onClick={() => setCurrentTab('explore')} className="hover:text-white transition-colors">
                  Community Challenges
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('map')} className="hover:text-white transition-colors">
                  GIS Problem Heatmap
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('projects')} className="hover:text-white transition-colors">
                  Active Prototypes
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('impact')} className="hover:text-white transition-colors">
                  Social Impact Analytics
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('contact')} className="hover:text-white transition-colors font-bold text-indigo-400">
                  Contact Us Helpdesk
                </button>
              </li>
            </ul>
          </div>

          {/* Live Demo Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3.5">
              Hackathon Demo
            </h4>
            <p className="text-[11px] text-slate-400 mb-3 leading-snug">
              Reset the in-memory database at any time during evaluations to restore all 50+ benchmark problems and clusters.
            </p>
            <button
              type="button"
              disabled={isResetting}
              onClick={handleResetData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-2 transition-all hover:scale-105"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              {isResetting ? 'Resetting DB...' : 'Reset 50+ Seed Records'}
            </button>
            {resetMessage && (
              <p className="text-[11px] text-emerald-400 font-semibold mt-2">{resetMessage}</p>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 CivicSetu. Built for India's Societal Innovation Ecosystem.</p>
          <div className="flex items-center gap-6">
            <span>IIT Jodhpur • CSIR-NEERI • ICAR • AIIMS</span>
            <span className="flex items-center gap-1 text-slate-400">
              Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for Societal Good
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
