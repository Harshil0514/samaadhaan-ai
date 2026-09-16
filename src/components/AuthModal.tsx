import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  Mail,
  Phone,
  Lock,
  X,
  ShieldCheck,
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Sparkles,
  Smartphone,
  User as UserIcon,
  Check
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login state
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [registerMethod, setRegisterMethod] = useState<'email' | 'phone'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('citizen');
  const [govtIdType, setGovtIdType] = useState('Official Govt Service ID / Badge');
  const [govtIdNumber, setGovtIdNumber] = useState('');
  const [govtIdUrl, setGovtIdUrl] = useState<string>('');
  const [govtIdFileName, setGovtIdFileName] = useState<string>('');
  const [govtIdFileSize, setGovtIdFileSize] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Status
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const identifier = loginMethod === 'email' ? loginEmail.trim() : loginPhone.trim();

    if (!identifier) {
      setError(`Please enter your ${loginMethod === 'email' ? 'email address' : 'mobile phone number'}.`);
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(identifier, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'citizen' | 'admin' | 'expert' | 'institution', usePhoneMode: boolean) => {
    setError('');
    setIsLoading(true);
    try {
      let identifier = '';
      if (role === 'citizen') identifier = usePhoneMode ? '+91 98123 45678' : 'citizen@civicsetu.ai';
      if (role === 'admin') identifier = usePhoneMode ? '+91 98765 43210' : 'admin@civicsetu.ai';
      if (role === 'expert') identifier = usePhoneMode ? '+91 96345 67890' : 'expert@civicsetu.ai';
      if (role === 'institution') identifier = usePhoneMode ? '+91 97234 56789' : 'institution@civicsetu.ai';

      await login(identifier, 'Citizen123!');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
      setError('Please upload a valid image (JPG, PNG) or PDF document.');
      return;
    }

    // Check size limit (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setError('File size exceeds 8MB limit. Please upload a smaller document.');
      return;
    }

    setGovtIdFileName(file.name);
    setGovtIdFileSize(`${(file.size / 1024).toFixed(0)} KB`);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      setGovtIdUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleUseSampleId = () => {
    setGovtIdFileName(selectedRole === 'admin' ? 'govt_service_id_officer.jpg' : 'expert_council_license.jpg');
    setGovtIdFileSize('420 KB');
    setGovtIdUrl(
      selectedRole === 'admin'
        ? 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80'
        : 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80'
    );
    if (!govtIdNumber) {
      setGovtIdNumber(selectedRole === 'admin' ? 'GOV-IND-2026-8941' : 'EXP-LIC-7729-IN');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (registerMethod === 'email' && !email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (registerMethod === 'phone' && !phone.trim()) {
      setError('Please enter your mobile phone number.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // If Govt Authority or Expert, require ID document
    const isSpecialRole = selectedRole === 'admin' || selectedRole === 'expert';
    if (isSpecialRole && !govtIdUrl) {
      setError(`Please upload a valid government/official ID document to register as a ${selectedRole === 'admin' ? 'Govt Authority / Admin' : 'Domain Expert'}.`);
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        role: selectedRole,
        govt_id_url: isSpecialRole ? govtIdUrl : undefined,
        govt_id_number: isSpecialRole ? govtIdNumber : undefined,
        govt_id_type: isSpecialRole ? govtIdType : undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const isGovtOrExpert = selectedRole === 'admin' || selectedRole === 'expert';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {tab === 'login' ? 'Sign In to CivicSetu' : 'Create an Account'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">Civic Innovation & Research Platform</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Tab Selector (Sign In vs Register) */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl my-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError('');
            }}
            className={`py-2 rounded-xl transition-all ${tab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError('');
            }}
            className={`py-2 rounded-xl transition-all ${tab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: Sign In (With Email or Phone Number) */}
        {/* ========================================================================= */}
        {tab === 'login' && (
          <div className="space-y-4">
            {/* Email / Phone Toggle Switch */}
            <div className="flex items-center justify-between p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('email');
                  setError('');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  loginMethod === 'email' ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Address</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('phone');
                  setError('');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  loginMethod === 'phone' ? 'bg-white text-indigo-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone Number</span>
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginMethod === 'email' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="e.g. citizen@civicsetu.ai"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1 text-xs font-bold text-slate-500 border-r border-slate-200 pr-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>+91</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={loginPhone}
                      onChange={e => setLoginPhone(e.target.value)}
                      placeholder="98765 43210"
                      className="w-full pl-20 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter your 10-digit registered Indian mobile number
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Signing In...</span>
                ) : (
                  <span>Sign In with {loginMethod === 'email' ? 'Email' : 'Phone Number'}</span>
                )}
              </button>
            </form>

            {/* Quick Demo Accounts Selection with Email / Phone */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  1-Click Quick Demo Sign-In
                </span>
                <span className="text-[10px] text-slate-400">Testing Sandbox</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('citizen', loginMethod === 'phone')}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-300 text-left transition-all group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Citizen</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {loginMethod === 'phone' ? '+91 98123 45678' : 'citizen@civicsetu.ai'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', loginMethod === 'phone')}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-300 text-left transition-all group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Govt Authority</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {loginMethod === 'phone' ? '+91 98765 43210' : 'admin@civicsetu.ai'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('expert', loginMethod === 'phone')}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-300 text-left transition-all group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">Domain Expert</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {loginMethod === 'phone' ? '+91 96345 67890' : 'expert@civicsetu.ai'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('institution', loginMethod === 'phone')}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-300 text-left transition-all group"
                >
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600">IIT R&D Lab</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {loginMethod === 'phone' ? '+91 97234 56789' : 'institution@civicsetu.ai'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: Register (With Email or Phone Number Option) */}
        {/* ========================================================================= */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma / Priya Patel"
                  className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Primary Registration Choice: Email or Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Account Identifier
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <button
                  type="button"
                  onClick={() => setRegisterMethod('email')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    registerMethod === 'email'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Register with Email</span>
                  {registerMethod === 'email' && <Check className="w-3 h-3 ml-auto text-indigo-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setRegisterMethod('phone')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    registerMethod === 'phone'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Register with Phone</span>
                  {registerMethod === 'phone' && <Check className="w-3 h-3 ml-auto text-indigo-600" />}
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address {registerMethod === 'email' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="email"
                  required={registerMethod === 'email'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="user@domain.com"
                  className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Mobile Phone Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Phone Number {registerMethod === 'phone' ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1 text-xs font-bold text-slate-500 border-r border-slate-200 pr-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  required={registerMethod === 'phone'}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full pl-20 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Account Role</label>
              <select
                value={selectedRole}
                onChange={e => {
                  const role = e.target.value as Role;
                  setSelectedRole(role);
                  if (role === 'admin') {
                    setGovtIdType('Official Govt Department Service ID');
                  } else if (role === 'expert') {
                    setGovtIdType('Professional Board / Council License');
                  }
                }}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="citizen">Citizen User</option>
                <option value="expert">Domain Expert (Govt/Professional ID Required)</option>
                <option value="admin">Govt Authority / Admin (Govt ID Required)</option>
                <option value="institution">University / Academic Institution</option>
              </select>
            </div>

            {/* MANDATORY GOVT / EXPERT ID SECTION */}
            {isGovtOrExpert && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>
                      {selectedRole === 'admin' ? 'Govt Authority Verification' : 'Domain Expert Verification'}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-800">
                    Mandatory ID
                  </span>
                </div>

                <p className="text-[11px] text-amber-800/90 leading-tight">
                  Please provide your official government credentials or department ID for account authorization.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">ID Document Type</label>
                    <select
                      value={govtIdType}
                      onChange={e => setGovtIdType(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {selectedRole === 'admin' ? (
                        <>
                          <option value="Official Govt Department Service ID">Govt Department ID Card</option>
                          <option value="Municipal Corporation Badge">Municipal Corporation Badge</option>
                          <option value="Ministry Authorization Letter">Ministry Authorization Letter</option>
                          <option value="Administrative Gazette Card">Administrative Gazette ID</option>
                        </>
                      ) : (
                        <>
                          <option value="Professional Board / Council License">Professional Board License</option>
                          <option value="National Technology Board ID">National Tech Board ID</option>
                          <option value="Research Institute Faculty ID">Research Institute Faculty ID</option>
                          <option value="Govt Advisory Panel Empanelment">Govt Advisory Empanelment</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">ID / Badge Number</label>
                    <input
                      type="text"
                      value={govtIdNumber}
                      onChange={e => setGovtIdNumber(e.target.value)}
                      placeholder={selectedRole === 'admin' ? 'e.g. GOV-RAJ-8941' : 'e.g. EXP-ENG-7729'}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-amber-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* File Upload Box */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Upload Valid Govt / Official ID <span className="text-red-500">*</span>
                  </label>

                  {govtIdUrl ? (
                    <div className="p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {govtIdUrl.startsWith('data:image') || govtIdUrl.startsWith('http') ? (
                          <img
                            src={govtIdUrl}
                            alt="Govt ID Preview"
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            {govtIdFileName || 'Govt_ID_Document.png'}
                          </div>
                          <p className="text-[10px] text-slate-500">{govtIdFileSize || 'Verified Document'}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setGovtIdUrl('');
                          setGovtIdFileName('');
                          setGovtIdFileSize('');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove ID document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={e => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-4 text-center transition-all bg-white cursor-pointer ${
                        isDragging ? 'border-amber-500 bg-amber-50/50' : 'border-amber-300 hover:border-amber-400'
                      }`}
                      onClick={() => {
                        const input = document.getElementById('govt-id-file-input') as HTMLInputElement;
                        input?.click();
                      }}
                    >
                      <input
                        id="govt-id-file-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                      <UploadCloud className="w-6 h-6 text-amber-600 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-slate-800">
                        Click to browse or drag & drop Govt ID
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Accepts JPG, PNG, or PDF (Max 8MB)
                      </p>
                    </div>
                  )}

                  {/* Sample ID button for quick sandbox verification */}
                  {!govtIdUrl && (
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-slate-400">Testing portal?</span>
                      <button
                        type="button"
                        onClick={handleUseSampleId}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        Use Sample {selectedRole === 'admin' ? 'Govt' : 'Expert'} ID
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <span>
                  {isGovtOrExpert
                    ? 'Verify ID & Register Account'
                    : `Create Account with ${registerMethod === 'email' ? 'Email' : 'Phone'}`}
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
