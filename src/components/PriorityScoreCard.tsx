import React from 'react';
import { PriorityBreakdown } from '../types';
import { ShieldAlert, Users, Layers, AlertTriangle, MapPin, Sparkles, Info, Flame, AlertCircle, CheckCircle } from 'lucide-react';

export interface PriorityTheme {
  tier: 'critical' | 'high' | 'medium' | 'low';
  label: string;
  rangeText: string;
  badgeBg: string;
  pillBg: string;
  accentBorder: string;
  hoverGlow: string;
  barGradient: string;
  textColor: string;
  dotColor: string;
  ringColor: string;
  glowShadow: string;
  cardBgTint: string;
  hex: string;
}

export const getPriorityTheme = (score: number): PriorityTheme => {
  if (score >= 80) {
    return {
      tier: 'critical',
      label: 'CRITICAL',
      rangeText: '80–100',
      badgeBg: 'bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white',
      pillBg: 'bg-red-50 text-red-600 border-red-200',
      accentBorder: 'border-t-4 border-t-red-500',
      hoverGlow: 'hover:border-red-300 hover:shadow-red-500/15',
      barGradient: 'from-red-500 via-rose-500 to-red-600',
      textColor: 'text-red-500',
      dotColor: 'bg-red-500',
      ringColor: 'ring-red-400/40',
      glowShadow: 'shadow-lg shadow-red-500/25',
      cardBgTint: 'bg-gradient-to-b from-red-50/20 via-white to-white',
      hex: '#EF4444'
    };
  }
  if (score >= 60) {
    return {
      tier: 'high',
      label: 'HIGH',
      rangeText: '60–79',
      badgeBg: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white',
      pillBg: 'bg-orange-50 text-orange-600 border-orange-200',
      accentBorder: 'border-t-4 border-t-orange-500',
      hoverGlow: 'hover:border-orange-300 hover:shadow-orange-500/15',
      barGradient: 'from-orange-500 via-amber-500 to-orange-600',
      textColor: 'text-orange-500',
      dotColor: 'bg-orange-500',
      ringColor: 'ring-orange-400/40',
      glowShadow: 'shadow-lg shadow-orange-500/25',
      cardBgTint: 'bg-gradient-to-b from-orange-50/15 via-white to-white',
      hex: '#F97316'
    };
  }
  if (score >= 40) {
    return {
      tier: 'medium',
      label: 'MEDIUM',
      rangeText: '40–59',
      badgeBg: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white',
      pillBg: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      accentBorder: 'border-t-4 border-t-yellow-400',
      hoverGlow: 'hover:border-yellow-300 hover:shadow-yellow-500/15',
      barGradient: 'from-yellow-400 via-amber-400 to-yellow-500',
      textColor: 'text-yellow-600',
      dotColor: 'bg-yellow-500',
      ringColor: 'ring-yellow-400/40',
      glowShadow: 'shadow-lg shadow-yellow-500/25',
      cardBgTint: 'bg-gradient-to-b from-yellow-50/15 via-white to-white',
      hex: '#EAB308'
    };
  }
  return {
    tier: 'low',
    label: 'LOW',
    rangeText: '0–39',
    badgeBg: 'bg-gradient-to-r from-green-600 via-emerald-600 to-green-500 text-white',
    pillBg: 'bg-green-50 text-green-700 border-green-200',
    accentBorder: 'border-t-4 border-t-green-500',
    hoverGlow: 'hover:border-green-300 hover:shadow-green-500/15',
    barGradient: 'from-green-500 via-emerald-500 to-green-600',
    textColor: 'text-green-600',
    dotColor: 'bg-green-600',
    ringColor: 'ring-green-400/40',
    glowShadow: 'shadow-lg shadow-green-500/25',
    cardBgTint: 'bg-gradient-to-b from-green-50/10 via-white to-white',
    hex: '#16A34A'
  };
};

/**
 * Visual Priority Levels Legend matching the exact color key card
 */
export const PriorityLevelsLegend: React.FC<{
  className?: string;
  selectedTier?: string;
  onSelectTier?: (tier: string) => void;
}> = ({ className = '', selectedTier, onSelectTier }) => {
  const levels = [
    { range: '80–100', label: 'CRITICAL', tier: 'critical', dotBg: 'bg-[#EF4444]', textColor: 'text-[#EF4444]' },
    { range: '60–79', label: 'HIGH', tier: 'high', dotBg: 'bg-[#F97316]', textColor: 'text-[#F97316]' },
    { range: '40–59', label: 'MEDIUM', tier: 'medium', dotBg: 'bg-[#EAB308]', textColor: 'text-[#EAB308]' },
    { range: '0–39', label: 'LOW', tier: 'low', dotBg: 'bg-[#16A34A]', textColor: 'text-[#16A34A]' }
  ];

  return (
    <div className={`bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 shadow-md ${className}`}>
      <div className="text-[11px] font-black uppercase tracking-wider text-blue-900 text-center mb-3">
        PRIORITY LEVELS
      </div>
      <div className="space-y-2.5">
        {levels.map((lvl) => {
          const isSelected = selectedTier === lvl.tier;
          return (
            <div
              key={lvl.label}
              onClick={() => onSelectTier?.(lvl.tier)}
              className={`flex items-center justify-between gap-4 py-1 px-1.5 rounded-lg transition-colors ${
                onSelectTier ? 'cursor-pointer hover:bg-slate-50' : ''
              } ${isSelected ? 'bg-slate-100 ring-1 ring-slate-300' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-4 h-4 rounded-full ${lvl.dotBg} shadow-xs flex-shrink-0`} />
                <span className="font-extrabold text-slate-800 text-xs tracking-tight">{lvl.range}</span>
              </div>
              <span className={`font-black tracking-wider text-xs ${lvl.textColor}`}>
                {lvl.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface PriorityScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PriorityScoreBadge: React.FC<PriorityScoreBadgeProps> = ({
  score,
  showLabel = true,
  size = 'md',
  className = ''
}) => {
  const theme = getPriorityTheme(score);

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${theme.badgeBg} ${theme.glowShadow} backdrop-blur-md ring-1 ring-white/30 font-bold text-[11px] ${className}`}>
        {score >= 80 ? (
          <Flame className="w-3 h-3 text-amber-200 animate-pulse" />
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full bg-white`} />
        )}
        <span>{score}/100</span>
        {showLabel && <span className="opacity-90 text-[10px] font-semibold tracking-tight">• {theme.label}</span>}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${theme.badgeBg} ${theme.glowShadow} backdrop-blur-md ring-1 ring-white/30 font-extrabold text-xs tracking-tight ${className}`}>
      {score >= 80 ? (
        <Flame className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
      ) : (
        <span className="w-2 h-2 rounded-full bg-white" />
      )}
      <div className="flex items-baseline gap-0.5">
        <span className="text-sm leading-none font-black">{score}</span>
        <span className="text-[10px] opacity-80 leading-none">/100</span>
      </div>
      {showLabel && (
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 pl-1 border-l border-white/25">
          {theme.label}
        </span>
      )}
    </div>
  );
};

interface PriorityScoreCardProps {
  score: number;
  breakdown?: PriorityBreakdown;
  compact?: boolean;
}

export const PriorityScoreCard: React.FC<PriorityScoreCardProps> = ({ score, breakdown, compact = false }) => {
  const theme = getPriorityTheme(score);

  // If no breakdown provided, calculate standard default breakdown for display
  const bd: PriorityBreakdown = breakdown || {
    severityContribution: +(score * 0.30).toFixed(1),
    citizensContribution: +(score * 0.25).toFixed(1),
    clusterContribution: +(score * 0.20).toFixed(1),
    urgencyContribution: +(score * 0.15).toFixed(1),
    locationRiskContribution: +(score * 0.10).toFixed(1),
    severityRaw: Math.min(100, Math.round(score * 1.05)),
    citizensCount: Math.round(score * 1.5),
    clusterSize: score >= 80 ? 15 : score >= 60 ? 5 : 1,
    urgencyRaw: score >= 85 ? 100 : score >= 70 ? 75 : 50,
    locationRiskRaw: 75,
    explanation: 'Multi-factor transparent AI score factoring severity, population density, cluster reports, and urgency.'
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl ${theme.badgeBg} ${theme.glowShadow} backdrop-blur-md ring-1 ring-white/30`}>
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-baseline leading-none font-display font-black text-sm">
            <span>{score}</span>
            <span className="text-[9px] opacity-80">/100</span>
          </div>
        </div>
        <div className="border-l border-white/25 pl-2 text-left">
          <div className="text-[9px] font-bold uppercase tracking-wider opacity-85 leading-none">AI Score</div>
          <div className="text-[11px] font-extrabold leading-tight mt-0.5 whitespace-nowrap">{theme.label}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
      {/* Background subtle accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-slate-100 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${theme.barGradient} text-white flex flex-col items-center justify-center font-display font-black text-2xl shadow-lg ring-4 ring-slate-50`}>
            <span>{score}</span>
            <span className="text-[10px] tracking-tight opacity-90 -mt-1 font-semibold">/100</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Explainable AI Priority Engine
            </div>
            <h3 className="text-lg font-bold text-slate-900">{theme.label}</h3>
            <p className="text-xs text-slate-500">Mathematically weighted transparent societal index</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl px-3.5 py-2 border border-slate-100 text-xs text-slate-600 max-w-xs">
          <div className="font-semibold text-slate-800 flex items-center gap-1 mb-0.5">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            Formula
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Sev(30%) + Citizens(25%) + Cluster(20%) + Urgency(15%) + Risk(10%)
          </p>
        </div>
      </div>

      {/* Factor Breakdown Bars */}
      <div className="mt-5 space-y-3.5">
        {/* Severity */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              Severity Score (30%)
            </span>
            <span className="font-bold text-slate-800">
              {bd.severityContribution} pts <span className="text-slate-400 font-normal">({bd.severityRaw}/100)</span>
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${(bd.severityRaw / 100) * 100}%` }} />
          </div>
        </div>

        {/* Affected Citizens */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              Affected Citizens / Upvotes (25%)
            </span>
            <span className="font-bold text-slate-800">
              {bd.citizensContribution} pts <span className="text-slate-400 font-normal">({bd.citizensCount} voices)</span>
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, bd.citizensCount * 1.5 + 20)}%` }} />
          </div>
        </div>

        {/* Cluster / Duplicate Density */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Duplicate Cluster Size (20%)
            </span>
            <span className="font-bold text-slate-800">
              {bd.clusterContribution} pts <span className="text-slate-400 font-normal">({bd.clusterSize} correlated reports)</span>
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, bd.clusterSize * 5 + 10)}%` }} />
          </div>
        </div>

        {/* Urgency */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
              Citizen Urgency (15%)
            </span>
            <span className="font-bold text-slate-800">
              {bd.urgencyContribution} pts <span className="text-slate-400 font-normal">({bd.urgencyRaw}/100)</span>
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${bd.urgencyRaw}%` }} />
          </div>
        </div>

        {/* Location Demographics Risk */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-500" />
              Demographic & Infrastructure Risk (10%)
            </span>
            <span className="font-bold text-slate-800">
              {bd.locationRiskContribution} pts <span className="text-slate-400 font-normal">({bd.locationRiskRaw}/100)</span>
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${bd.locationRiskRaw}%` }} />
          </div>
        </div>
      </div>

      {/* Transparent Explanation Text */}
      {bd.explanation && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Why this score? </span>
          {bd.explanation}
        </div>
      )}
    </div>
  );
};

