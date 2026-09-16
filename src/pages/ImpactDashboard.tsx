import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Users,
  Building2,
  DollarSign,
  Droplets,
  Zap,
  Sparkles,
  CheckCircle2,
  Sliders,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const ImpactDashboard: React.FC = () => {
  const [problemsCount, setProblemsCount] = useState<number>(30);

  // Dynamic ROI calculation based on slider
  const estimatedSavings = (problemsCount * 11.5).toFixed(1); // Lakhs
  const citizensReached = (problemsCount * 1450).toLocaleString();
  const studentHours = (problemsCount * 280).toLocaleString();

  const caseStudies = [
    {
      id: 'cs-1',
      title: 'Solar Electro-Deionization for Mandore High-Salinity Drinking Wells',
      domain: 'Water & Sanitation',
      institution: 'IIT Jodhpur Centre for Water R&D',
      location: 'Mandore Ward 4, Rajasthan',
      before: 'Groundwater TDS exceeded 3,200 ppm and Fluoride was 4.8 ppm, causing skeletal fluorosis in 250+ schoolchildren.',
      after: 'Low-cost solar-powered deionization unit deployed at community borehole. TDS reduced to 180 ppm, Fluoride 0.4 ppm with zero chemical additives.',
      impactMetric: '1,400+ Villagers & Students Protected Daily',
      costSaved: '₹18.4 Lakhs vs commercial municipal tender',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'cs-2',
      title: 'Phase-Change Material (PCM) Thermal Sleeves for Rural Vaccine Coolers',
      domain: 'Healthcare & Cold Chain',
      institution: 'AIIMS & Engineering Innovation Hub',
      location: 'Phalodi Primary Health Centre',
      before: 'Frequent 8-hour power blackouts caused critical temperature excursions, spoiling ₹4.5 Lakhs of polio & tetanus vaccines annually.',
      after: 'Passive PCM gel insulation sleeves engineered by student researchers maintain 2°C–8°C for 36 continuous hours without electricity.',
      impactMetric: '100% Vaccine Potency Retained across 14 Villages',
      costSaved: '₹8.2 Lakhs annual cold chain loss prevented',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'cs-3',
      title: 'LoRaWAN Ultrasonic Canal Silt & Gate Flow Optimization',
      domain: 'Agriculture & Irrigation',
      institution: 'ICAR-CAZRI & Engineering Consortium',
      location: 'Indira Gandhi Canal Feeder Zone',
      before: 'Manual sluice gates and silt blockage resulted in 40% tail-end water starvation for dryland mustard farmers.',
      after: 'Battery-operated solar LoRa ultrasonic sensors detect canal silt buildup and optimize gate schedules in real-time.',
      impactMetric: '38% Water Efficiency Gain for 850 Farmers',
      costSaved: '₹24.0 Lakhs in crop yield rescue',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-indigo-900/60">
        <div className="space-y-3 z-10 relative max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            <Award className="w-4 h-4" />
            National Societal Return on Innovation (SROI)
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-black text-white leading-tight">
            Measurable Societal Impact
          </h1>
          <p className="text-xs sm:text-base text-slate-300 leading-relaxed font-medium">
            Bridging grassroots citizen issues with university engineering talent delivers localized solutions at 1/10th the traditional municipal cost.
          </p>
        </div>

        {/* Floating background decorative orbs */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl" />
      </div>

      {/* Global Impact Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black font-display text-slate-900">45,000+</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Citizens Positively Impacted</div>
          <p className="text-[11px] text-slate-400">Verified through post-deployment ward audits.</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black font-display text-indigo-600">₹3.4 Cr+</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Municipal Taxpayer Savings</div>
          <p className="text-[11px] text-slate-400">Compared against traditional commercial tenders.</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black font-display text-amber-600">14 Hubs</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Universities & Research Labs</div>
          <p className="text-[11px] text-slate-400">IITs, NITs, AIIMS, and ICAR institutions.</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black font-display text-teal-600">94.2%</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Citizen Satisfaction Rate</div>
          <p className="text-[11px] text-slate-400">Measured across resolved problem clusters.</p>
        </div>
      </div>

      {/* Interactive SROI Impact Simulator */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Interactive Societal ROI Simulator</h3>
            <p className="text-xs text-slate-500 font-medium">
              Simulate economic, health, and engineering productivity outcomes at regional scale.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800">
              Community Problems Solved by Student Engineering Labs: <strong className="text-indigo-600 text-sm font-black">{problemsCount} Challenges</strong>
            </label>
            <span className="text-xs text-slate-400">Slide to test (5 - 100)</span>
          </div>

          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={problemsCount}
            onChange={e => setProblemsCount(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs font-bold text-emerald-800 uppercase text-[10px]">Estimated Municipal Savings</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">₹{estimatedSavings} Lakhs</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Direct taxpayer capital preserved</div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200">
              <div className="text-xs font-bold text-indigo-800 uppercase text-[10px]">Beneficiaries Protected</div>
              <div className="text-2xl font-black text-indigo-700 mt-1">{citizensReached} Citizens</div>
              <div className="text-[11px] text-indigo-600 mt-0.5">Across urban wards & rural panchayats</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="text-xs font-bold text-amber-800 uppercase text-[10px]">Student Research Applied</div>
              <div className="text-2xl font-black text-amber-700 mt-1">{studentHours} Hours</div>
              <div className="text-[11px] text-amber-600 mt-0.5">Real-world STEM experiential learning</div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Studies */}
      <div className="space-y-6">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 mb-1">
            Proven Field Deployments
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900">
            Before & After Field Transformation Studies
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {caseStudies.map(cs => (
            <div
              key={cs.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div className="relative h-44 w-full bg-slate-100">
                <img src={cs.image} alt={cs.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-extrabold uppercase text-white tracking-wider">
                  {cs.domain}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">{cs.title}</h3>
                  <div className="text-xs text-slate-500 font-medium mt-1">
                    🏛️ {cs.institution} • {cs.location}
                  </div>

                  {/* Before / After Comparison Blocks */}
                  <div className="space-y-2.5 mt-4">
                    <div className="p-3 rounded-2xl bg-red-50/70 border border-red-200 text-xs">
                      <strong className="text-red-800 block text-[10px] uppercase">Before Intervention</strong>
                      <p className="text-red-900 mt-0.5 leading-relaxed">{cs.before}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs">
                      <strong className="text-emerald-800 block text-[10px] uppercase">University Prototype Solution</strong>
                      <p className="text-emerald-900 mt-0.5 leading-relaxed">{cs.after}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="text-emerald-700">{cs.impactMetric}</span>
                  <span className="text-slate-500">{cs.costSaved}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
