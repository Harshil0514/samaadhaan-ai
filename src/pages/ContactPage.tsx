import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Building2,
  Shield,
  HelpCircle,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

interface ContactPageProps {
  onOpenReport?: () => void;
  setCurrentTab?: (tab: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onOpenReport, setCurrentTab }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'general',
    subject: '',
    message: '',
    problemRefId: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; time: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      return;
    }

    setIsSubmitting(true);
    // Simulate support ticket generation
    setTimeout(() => {
      setIsSubmitting(false);
      const ticketNum = `SMD-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicket({
        id: ticketNum,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: 'general',
        subject: '',
        message: '',
        problemRefId: ''
      });
    }, 1000);
  };

  const faqs = [
    {
      q: 'How does CivicSetu route citizen problems to universities?',
      a: 'Our Explainable AI algorithm groups duplicate civic issues into Problem Clusters and matches them with university engineering departments and research laboratories based on domain specialization and geographical proximity.'
    },
    {
      q: 'How can our institution or university onboard our research labs?',
      a: 'Universities can register as an "Academic / University" entity or submit an institutional inquiry here. Our team verifies the accreditation and allocates sandbox project access within 24 hours.'
    },
    {
      q: 'Can government bodies monitor municipal problem resolutions in real time?',
      a: 'Yes. Verified municipal authorities and district administrators receive access to the Govt Authority Portal with live GIS heatmaps, SLA tracking, and resource allocation dashboards.'
    },
    {
      q: 'What is the standard SLA for citizen grievance escalations?',
      a: 'Critical safety and infrastructure hazards are flagged to municipal officers within 2 hours. General civic innovation challenges are analyzed and assigned to research cohorts within 48 to 72 hours.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Civic Innovation Helpdesk & Inquiries</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-black text-slate-900 tracking-tight">
            Get in Touch with <span className="text-indigo-600">CivicSetu</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Have questions about civic challenges, university R&D partnerships, or government integration? Reach out to our dedicated support and coordination team.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Contact Cards & Directory */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Contact Info Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                Contact Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Us</div>
                    <a href="mailto:support@civicsetu.ai" className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                      support@civicsetu.ai
                    </a>
                    <p className="text-xs text-slate-500">For general & citizen queries</p>
                    <a href="mailto:partnerships@civicsetu.ai" className="text-xs font-semibold text-indigo-600 hover:underline block mt-0.5">
                      partnerships@civicsetu.ai (Institutions)
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toll-Free Helpline</div>
                    <div className="text-sm font-bold text-slate-900">+91 (1800) 123-7262</div>
                    <p className="text-xs text-slate-500">Toll-free across India (24/7 Civic Support)</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Headquarters</div>
                    <p className="text-sm font-bold text-slate-900">
                      National Civic Innovation Cell
                    </p>
                    <p className="text-xs text-slate-500">
                      Technology Bhawan, New Mehrauli Road, New Delhi 110016
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Support Hours</div>
                    <p className="text-sm font-bold text-slate-900">Mon – Sat: 9:00 AM – 7:00 PM IST</p>
                    <p className="text-xs text-slate-500">Emergency escalations monitored 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Routing Quick Cards */}
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-extrabold uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                Direct Desk Routing
              </div>
              <h4 className="text-base font-bold text-white">Need immediate civic assistance?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you have an urgent public safety hazard or want to submit a formal ground problem with photo/video evidence:
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                {onOpenReport && (
                  <button
                    type="button"
                    onClick={onOpenReport}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <span>Report a Civic Problem</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {setCurrentTab && (
                  <button
                    type="button"
                    onClick={() => setCurrentTab('explore')}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <span>Browse Challenges</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Message / Ticket Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              {submittedTicket ? (
                <div className="py-10 text-center space-y-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Message Received!</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Thank you for reaching out. Your inquiry has been routed to the respective desk with ticket reference ID:
                  </p>
                  <div className="inline-block px-5 py-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-mono font-bold text-base shadow-xs">
                    {submittedTicket.id}
                  </div>
                  <p className="text-xs text-slate-400">
                    Submitted today at {submittedTicket.time}. You will receive a response within 24–48 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedTicket(null)}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Send us a Message</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Fill out the form below and our team will get back to you promptly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Dr. Rajesh Sharma / Priya Patel"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. rajesh@university.edu.in"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Inquiry Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        <option value="general">General Support & Inquiry</option>
                        <option value="citizen">Citizen Grievance / Problem Follow-up</option>
                        <option value="institution">University / Lab Research Partnership</option>
                        <option value="government">Municipal / Govt Authority Integration</option>
                        <option value="expert">Domain Expert Empanelment</option>
                        <option value="technical">Technical Bug / Platform Feedback</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Brief summary of your inquiry"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Problem Reference ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.problemRefId}
                        onChange={e => setFormData({ ...formData, problemRefId: e.target.value })}
                        placeholder="e.g. prob-001 or cluster-003"
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Detailed Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please provide complete details regarding your inquiry, partnership request, or feedback..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-y"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-500">
                    <Shield className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Your data is protected under India's Digital Personal Data Protection standards.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Sending inquiry...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Inquiry Ticket</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold">
            <HelpCircle className="w-4 h-4" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Common Inquiries & Guidelines</h2>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all ${
                    isOpen ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left gap-4"
                  >
                    <span className="text-sm font-bold text-slate-900">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-indigo-100/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
