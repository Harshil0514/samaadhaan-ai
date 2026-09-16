import React from 'react';
import { Problem } from '../types';
import { Layers, CheckCircle2, ThumbsUp, PlusCircle, AlertCircle, MapPin } from 'lucide-react';

interface DuplicateCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  similarProblems: { problem: Problem; similarityScore: number; distanceKm: number }[];
  duplicateScore: number;
  onSupportExisting: (problemId: string) => void;
  onSubmitAnyway: () => void;
}

export const DuplicateCheckModal: React.FC<DuplicateCheckModalProps> = ({
  isOpen,
  onClose,
  similarProblems,
  duplicateScore,
  onSupportExisting,
  onSubmitAnyway
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 text-amber-600 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Layers className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Similar Reports Found Near You</h2>
            <p className="text-xs text-slate-500 font-medium">CivicSetu Duplicate Detection Engine</p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Duplicate Match Score: {duplicateScore}%</span>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              We identified <strong className="font-bold">{similarProblems.length} closely related citizen complaints</strong> near your location.
              Supporting an existing report unites community voices and accelerates university challenge creation!
            </p>
          </div>
        </div>

        {/* Similar List */}
        <div className="mt-5 space-y-3">
          {similarProblems.map(({ problem, similarityScore, distanceKm }) => (
            <div
              key={problem.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      {problem.category_name || 'Community Issue'}
                    </span>
                    <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {similarityScore}% Match
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {distanceKm} km away
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{problem.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{problem.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onSupportExisting(problem.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Support ({problem.supports_count})
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSubmitAnyway}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            Submit as Independent Report
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md"
          >
            Review Details
          </button>
        </div>
      </div>
    </div>
  );
};
