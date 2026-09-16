import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { AIAnalysis, Category, Problem, UrgencyLevel } from '../types';
import { api } from '../services/api';
import { LeafletMap } from '../components/LeafletMap';
import { PriorityScoreCard } from '../components/PriorityScoreCard';
import { DuplicateCheckModal } from '../components/DuplicateCheckModal';
import {
  Sparkles,
  MapPin,
  Camera,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileText,
  ShieldCheck,
  Check,
  X,
  Compass,
  Trash2,
  Image as ImageIcon,
  Plus,
  Smartphone
} from 'lucide-react';

interface UploadedPhoto {
  id: string;
  name: string;
  size: string;
  dataUrl: string;
}

interface ReportProblemPageProps {
  onSuccess: (newProblem: Problem) => void;
  onCancel: () => void;
}

export const ReportProblemPage: React.FC<ReportProblemPageProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('high');
  const [latitude, setLatitude] = useState<number>(26.3530);
  const [longitude, setLongitude] = useState<number>(73.0420);
  const [address, setAddress] = useState('Mandore Industrial Zone, Jodhpur, Rajasthan');
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // AI & Duplicate State
  const [isScanningAI, setIsScanningAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [duplicateData, setDuplicateData] = useState<{
    duplicateScore: number;
    similarProblems: { problem: Problem; similarityScore: number; distanceKm: number }[];
    recommendedClusterId?: string;
  } | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      } catch {
        // Ignore
      }
    }
    loadCats();
  }, []);

  // Update images array whenever uploadedPhotos changes
  useEffect(() => {
    setImages(uploadedPhotos.map(p => p.dataUrl));
  }, [uploadedPhotos]);

  // Client-side image processor/compressor for real device photos
  const processImageFile = (file: File): Promise<UploadedPhoto> => {
    return new Promise((resolve, reject) => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic', 'image/avif'];
      if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
        return reject(new Error(`File ${file.name} is not a supported image format.`));
      }

      if (file.size > 20 * 1024 * 1024) {
        return reject(new Error(`File ${file.name} exceeds the 20MB limit.`));
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
            resolve({
              id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: file.name,
              size: sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`,
              dataUrl
            });
          } else {
            resolve({
              id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: file.name,
              size: `${Math.round(file.size / 1024)} KB`,
              dataUrl: e.target?.result as string
            });
          }
        };
        img.onerror = () => reject(new Error(`Failed to decode image ${file.name}`));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error(`Could not read file ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  const handleAddFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setError('');
    setIsProcessingFiles(true);

    try {
      const fileArray = Array.from(files);
      const remainingSlots = 6 - uploadedPhotos.length;
      if (remainingSlots <= 0) {
        setError('Maximum of 6 photos can be attached per problem report.');
        setIsProcessingFiles(false);
        return;
      }

      const filesToProcess = fileArray.slice(0, remainingSlots);
      const results: UploadedPhoto[] = [];

      for (const file of filesToProcess) {
        try {
          const photo = await processImageFile(file);
          results.push(photo);
        } catch (err: any) {
          setError(err.message || 'Error processing photo');
        }
      }

      if (results.length > 0) {
        setUploadedPhotos(prev => [...prev, ...results]);
      }
    } finally {
      setIsProcessingFiles(false);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setUploadedPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Run AI Preview Scan on transition to Step 4
  const runAIScan = async () => {
    setIsScanningAI(true);
    setError('');
    try {
      const res = await api.previewAIAnalysis({
        title,
        description,
        urgency,
        latitude,
        longitude
      });
      setAiAnalysis(res.analysis);
      setDuplicateData(res.duplicate_check);

      // If duplicate score >= 75, trigger duplicate modal prompt
      if (res.duplicate_check.duplicateScore >= 75 && res.duplicate_check.similarProblems.length > 0) {
        setShowDuplicateModal(true);
      }
    } catch (err: any) {
      console.warn('AI preview failed, falling back:', err);
    } finally {
      setIsScanningAI(false);
    }
  };

  const handleNextToAI = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please provide both a title and detailed problem description.');
      return;
    }
    setError('');
    setStep(4);
    await runAIScan();
  };

  const handleSupportExisting = async (existingId: string) => {
    try {
      await api.supportProblem(existingId);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      setShowDuplicateModal(false);
      onCancel(); // return to list with new upvote
    } catch {
      // Ignore
    }
  };

  const handleFinalSubmit = async (clusterIdToJoin?: string) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.createProblem({
        title,
        description,
        category_id: categoryId,
        urgency,
        latitude,
        longitude,
        address,
        images,
        cluster_id_to_join: clusterIdToJoin || duplicateData?.recommendedClusterId
      });

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      onSuccess(res.problem);
    } catch (err: any) {
      setError(err.message || 'Failed to submit problem report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(+pos.coords.latitude.toFixed(5));
          setLongitude(+pos.coords.longitude.toFixed(5));
          setAddress(`GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        () => {
          alert('Could not access current location. Please click on the map to drop pin.');
        }
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Duplicate Check Modal */}
      {duplicateData && (
        <DuplicateCheckModal
          isOpen={showDuplicateModal}
          onClose={() => setShowDuplicateModal(false)}
          similarProblems={duplicateData.similarProblems}
          duplicateScore={duplicateData.duplicateScore}
          onSupportExisting={handleSupportExisting}
          onSubmitAnyway={() => setShowDuplicateModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Sparkles className="w-4 h-4" />
            AI-Assisted Citizen Reporting Wizard
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900">
            Report a Community Issue
          </h1>
          <p className="text-xs text-slate-500">
            Your complaint will be categorized by AI, mapped to regional clusters, and routed to engineering research teams.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Stepper Tabs */}
      <div className="grid grid-cols-4 gap-2 my-8">
        {[
          { num: 1, label: '1. Problem Details', icon: FileText },
          { num: 2, label: '2. Location & Pin', icon: MapPin },
          { num: 3, label: '3. Photo Evidence', icon: Camera },
          { num: 4, label: '4. AI Brain Scan', icon: Sparkles }
        ].map(s => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isPassed = step > s.num;

          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num as any)}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : isPassed
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-white text-slate-500 border-slate-200 opacity-60'
              }`}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                isActive ? 'bg-white/20 text-white' : isPassed ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {isPassed ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <div className="hidden sm:block truncate">
                <span className="text-xs font-bold block">{s.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 1: PROBLEM DETAILS */}
      {/* ------------------------------------------------------------- */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Problem Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Acute Salinity & Fluoride in Mandore Drinking Wells"
              className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Be concise and include specific locality names if known.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Comprehensive Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue in detail: What is happening? How many families/students are affected? How long has this problem persisted? What dangers or health impacts are observed?"
              className="w-full px-4 py-3 text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Our AI analyzes keywords like "school", "fluoride", "infant", and "collapse" to compute severity.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Primary Category
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Citizen Perceived Urgency
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['low', 'medium', 'high', 'critical'] as UrgencyLevel[]).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUrgency(u)}
                    className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      urgency === u
                        ? u === 'critical'
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                          : u === 'high'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                          : u === 'medium'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                          : 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                if (!title || !description) {
                  setError('Title and description are required.');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              Continue to Location Pin
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 2: LOCATION SELECTION */}
      {/* ------------------------------------------------------------- */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pin Exact GPS Location</h3>
              <p className="text-xs text-slate-500">
                Click anywhere on the interactive map or use current device geolocation.
              </p>
            </div>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto transition-colors"
            >
              <Compass className="w-4 h-4 text-emerald-600" />
              Use My Device GPS
            </button>
          </div>

          {/* Interactive Map Picker */}
          <LeafletMap
            isPicker
            pickedLocation={{ lat: latitude, lng: longitude }}
            onPickLocation={(loc) => {
              setLatitude(loc.lat);
              setLongitude(loc.lng);
            }}
            center={[latitude, longitude]}
            zoom={13}
            height="360px"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={e => setLatitude(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={e => setLongitude(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Street / Area Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Mandore Ward 4, Jodhpur"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              Continue to Photos
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 3: PHOTO EVIDENCE (REAL PHOTO UPLOAD) */}
      {/* ------------------------------------------------------------- */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Real Photo Evidence</h3>
              <p className="text-xs text-slate-500">
                Attach real photographs taken on-site to help municipal authorities and research labs assess the damage.
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 self-start sm:self-auto">
              {uploadedPhotos.length} of 6 Photos Attached
            </div>
          </div>

          {/* Hidden file inputs for file picker and mobile camera */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/jpg,image/heic,image/avif"
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files.length > 0) {
                handleAddFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files.length > 0) {
                handleAddFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />

          {/* Drag and Drop Zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Click to choose real photos or drag & drop files here
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Upload genuine images of contamination, road cracks, leaking pipes, or broken community facilities.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Browse Device Files
              </button>

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                Take Photo via Camera
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 text-[11px] text-slate-400">
              Supports JPG, PNG, WEBP, HEIC • Max 20MB per photo • Up to 6 photos
            </div>
          </div>

          {/* Uploaded Photos Gallery Preview */}
          {uploadedPhotos.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Attached Real Photographs ({uploadedPhotos.length})
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready for AI Analysis
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {uploadedPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs flex flex-col"
                  >
                    <div className="relative aspect-video bg-slate-800 overflow-hidden">
                      <img
                        src={photo.dataUrl}
                        alt={photo.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Photo Badge */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-bold text-white">
                        {index === 0 ? 'Primary Photo' : `Photo #${index + 1}`}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(photo.id);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-sm"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2.5 bg-white text-left">
                      <div className="text-xs font-semibold text-slate-800 truncate" title={photo.name}>
                        {photo.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {photo.size}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add More Slot */}
                {uploadedPhotos.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-slate-400 hover:text-indigo-600 flex flex-col items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-xs font-bold">Add Another Photo</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {isProcessingFiles && (
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
              Processing and preparing uploaded photos...
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={handleNextToAI}
              className="px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Scan with AI Brain
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STEP 4: AI BRAIN SCAN & FINAL VERIFICATION */}
      {/* ------------------------------------------------------------- */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">AI Problem Intelligence Verification</h3>
              <p className="text-xs text-slate-500 font-medium">
                Automated NLP Classification, Duplicate Correlation & Explainable Priority Index
              </p>
            </div>
          </div>

          {isScanningAI ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 animate-spin">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-base text-slate-800">Analyzing Problem Telemetry...</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Running duplicate vector cosine search against 50+ regional reports and calculating 5-factor priority score.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Duplicate Warning Banner */}
              {duplicateData && duplicateData.duplicateScore >= 75 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <Layers className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-sm text-amber-950 block">
                        Correlated Issue Detected ({duplicateData.duplicateScore}% Match)
                      </span>
                      <p className="text-amber-800 mt-0.5">
                        {duplicateData.similarProblems.length} similar complaints exist within 2.5km. We recommend joining this challenge cluster to multiply community voting impact.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDuplicateModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex-shrink-0 shadow-sm"
                  >
                    View Matches
                  </button>
                </div>
              )}

              {/* AI Priority Breakdown Card */}
              {aiAnalysis && (
                <PriorityScoreCard
                  score={aiAnalysis.priority_score}
                  breakdown={aiAnalysis.priority_breakdown}
                />
              )}

              {/* AI Insights & Recommended Actions */}
              {aiAnalysis && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      AI Detected Category
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{aiAnalysis.detected_category}</span>
                      <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {aiAnalysis.category_confidence}% Confidence
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {aiAnalysis.keywords.map((kw, i) => (
                        <span key={i} className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                      Recommended Engineering Actions
                    </span>
                    <ul className="space-y-1 text-xs text-indigo-950 font-medium">
                      {aiAnalysis.recommended_actions.map((act, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Final Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Edit Evidence
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleFinalSubmit()}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-xl shadow-emerald-600/25 flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Publishing Report...' : 'Publish & Route to University Hub'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
