'use client';

import React, { useState, useTransition } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  FileDown,
  Clock,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  Compass,
  ArrowRight,
  TrendingUp,
  X,
  ExternalLink,
  Plus,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { uploadResumeAction, deleteResumeAction } from '@/app/actions/resume';

interface ResumeHistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
  version: number;
  isParsed: boolean;
  parsingError: string | null;
  qualityScore: number | null;
}

interface CandidateResumeClientProps {
  resumes: ResumeHistoryItem[];
  latestResume: {
    id: string;
    fileName: string;
    mimeType: string;
    isParsed: boolean;
    parsingError: string | null;
    parserVersion: string | null;
    aiProvider: string | null;
    confidenceScore: number | null;
    processingTimeMs: number | null;
    qualityScore: number | null;
    qualityFeedback: any;
    structuredData: any;
    createdAt: Date;
  } | null;
}

export default function CandidateResumeClient({
  resumes,
  latestResume,
}: CandidateResumeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'quality' | 'history'>('profile');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);

    startTransition(async () => {
      toast.info('Uploading resume document...');
      const res = await uploadResumeAction(formData);
      if (res.success) {
        toast.success('Resume uploaded successfully. Running AI parser...');
        setUploadFile(null);
        router.refresh();
      } else {
        toast.error(`Upload failed: ${res.error}`);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this resume record? This will also remove all associated job matching scores.')) {
      return;
    }

    startTransition(async () => {
      const res = await deleteResumeAction(id);
      if (res.success) {
        toast.success('Resume deleted successfully.');
        router.refresh();
      } else {
        toast.error(`Failed to delete resume: ${res.error}`);
      }
    });
  };

  const parsedData = latestResume?.structuredData;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-white ">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">Resume Intelligence</h2>
          <p className="text-xs text-zinc-400 mt-1">Upload your resume to extract structured data, analyze formatting quality, and generate match scores.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Upload box and history list */}
        <div className="space-y-6">
          
          {/* Upload Card */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Upload Resume</h3>
            
            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div className="border border-dashed border-zinc-850 hover:border-zinc-800 rounded-lg p-5 text-center relative hover:bg-zinc-950/20 transition-all cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-zinc-650 mx-auto mb-2" />
                <p className="text-[10px] font-semibold text-zinc-400">
                  {uploadFile ? uploadFile.name : 'Select PDF or DOCX'}
                </p>
                <p className="text-[8px] text-zinc-650 mt-1">Max file size 5MB</p>
              </div>

              {uploadFile && (
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setUploadFile(null)}
                    className="px-3 py-1.5 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 rounded-lg text-[10px] font-bold"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5"
                  >
                    {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Upload & Process</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Quick Metrics */}
          {latestResume && (
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3.5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Parser Metadata</h3>
              <div className="space-y-2 text-[10px] text-zinc-400 font-mono">
                <div className="flex justify-between">
                  <span>AI Parser:</span>
                  <span className="text-zinc-200 font-bold">{latestResume.aiProvider || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="text-zinc-200">{latestResume.parserVersion || 'v1.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Confidence:</span>
                  <span className="text-zinc-200 font-bold">{latestResume.confidenceScore ? `${Math.round(latestResume.confidenceScore * 100)}%` : '---'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span className="text-zinc-200">{(latestResume.processingTimeMs || 0) / 1000}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Quality Audit:</span>
                  <span className={`font-bold ${latestResume.qualityScore && latestResume.qualityScore >= 85 ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {latestResume.qualityScore ? `${latestResume.qualityScore}/100` : '---'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Parsed resume details and suggestions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tabs Menu */}
          <div className="flex border-b border-zinc-900 pb-px text-xs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 font-bold border-b-2 transition-all ${
                activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Structured Profile
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              className={`px-4 py-2 font-bold border-b-2 transition-all ${
                activeTab === 'quality' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Quality Evaluation
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-bold border-b-2 transition-all ${
                activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Upload History ({resumes.length})
            </button>
          </div>

          {/* TAB 1: Structured Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {!latestResume ? (
                <div className="bg-[#111113] border border-zinc-850 rounded-xl p-8 text-center text-zinc-500 space-y-2">
                  <FileText className="w-8 h-8 text-zinc-700 mx-auto" />
                  <p className="text-xs">No resume uploaded yet. Complete the upload form to index your profile.</p>
                </div>
              ) : !latestResume.isParsed && latestResume.parsingError ? (
                <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-5 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Parsing Failed</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">{latestResume.parsingError}</p>
                </div>
              ) : !latestResume.isParsed ? (
                <div className="bg-[#111113] border border-zinc-850 rounded-xl p-8 text-center text-zinc-500 space-y-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-zinc-300">Extracting document details...</p>
                  <p className="text-[10px] text-zinc-550 max-w-xs mx-auto">This takes a few seconds. The Trigger.dev parser is structured to run metadata normalization in the background.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Details Card */}
                  <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{parsedData.fullName || 'No Name Extracted'}</h4>
                        <p className="text-[10px] text-primary font-semibold mt-0.5">{parsedData.location || 'Location undisclosed'}</p>
                      </div>
                      <a
                        href={`/api/resumes/${latestResume.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-950 transition-all flex items-center gap-1 text-[10px]"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed font-sans italic">
                      &ldquo;{parsedData.summary || 'No summary extracted.'}&rdquo;
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-zinc-400 border-t border-zinc-900 pt-3">
                      <div>
                        <span className="text-zinc-500 block">Email:</span>
                        <span className="text-zinc-200">{parsedData.email || '---'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Phone:</span>
                        <span className="text-zinc-200">{parsedData.phone || '---'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-primary" /> Core Skills
                      </h5>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {parsedData.skills && parsedData.skills.length > 0 ? (
                          parsedData.skills.map((s: string) => (
                            <span key={s} className="text-[9px] bg-zinc-950 text-zinc-400 border border-zinc-900 px-2 py-1 rounded">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-zinc-600">No skills listed.</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" /> Technologies & Tools
                      </h5>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {parsedData.technologies && parsedData.technologies.length > 0 ? (
                          parsedData.technologies.map((t: string) => (
                            <span key={t} className="text-[9px] bg-zinc-950 text-zinc-400 border border-zinc-900 px-2 py-1 rounded">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-zinc-600">No technologies listed.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Work Experience */}
                  <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-indigo-400" /> Professional Experience
                    </h5>
                    {parsedData.experience && parsedData.experience.length > 0 ? (
                      <div className="space-y-4 divide-y divide-zinc-900">
                        {parsedData.experience.map((exp: any, idx: number) => (
                          <div key={idx} className={`space-y-2 text-xs ${idx > 0 ? 'pt-4' : ''}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h6 className="font-bold text-zinc-200">{exp.title}</h6>
                                <p className="text-[10px] text-zinc-500 font-semibold">{exp.company}</p>
                              </div>
                              <span className="text-[9px] font-mono text-zinc-500">{exp.startDate} - {exp.endDate}</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{exp.description}</p>
                            {exp.bullets && exp.bullets.length > 0 && (
                              <ul className="list-disc pl-4 space-y-1 text-[10px] text-zinc-450 font-sans leading-relaxed">
                                {exp.bullets.map((b: string, bidx: number) => (
                                  <li key={bidx}>{b}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-500">No experience parsed.</p>
                    )}
                  </div>

                  {/* Education */}
                  <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-500" /> Academic History
                    </h5>
                    {parsedData.education && parsedData.education.length > 0 ? (
                      <div className="space-y-3.5">
                        {parsedData.education.map((edu: any, idx: number) => (
                          <div key={idx} className="text-xs flex justify-between items-start">
                            <div>
                              <h6 className="font-bold text-zinc-200">{edu.school}</h6>
                              <p className="text-[10px] text-zinc-500 mt-0.5">{edu.degree} in {edu.major}</p>
                            </div>
                            <div className="text-right text-[9px] font-mono text-zinc-500 space-y-1">
                              <span>Class of {edu.endYear}</span>
                              {edu.gpa && <span className="block text-zinc-400 font-bold">GPA: {edu.gpa}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-500">No academic log parsed.</p>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 2: Quality Score & Feedback */}
          {activeTab === 'quality' && (
            <div className="space-y-6">
              {!latestResume || !latestResume.isParsed ? (
                <div className="bg-[#111113] border border-zinc-850 rounded-xl p-8 text-center text-zinc-500">
                  <p className="text-xs">No parsed quality analysis available. Upload a resume to generate feedback.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Quality Audit Meter */}
                  <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center sm:text-left">
                      <h4 className="text-sm font-bold text-white">Resume Quality Audit</h4>
                      <p className="text-[10px] text-zinc-500 leading-relaxed max-w-sm">
                        This score is evaluated by checking formatting density, skills presence, completeness headers, and bullet formats.
                      </p>
                    </div>
                    <div className="w-24 h-24 rounded-full border-4 border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center shadow-lg shrink-0">
                      <span className="text-2xl font-black text-white font-mono leading-none">
                        {latestResume.qualityScore}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-zinc-500 mt-1 font-mono">Score</span>
                    </div>
                  </div>

                  {/* Feedback items splits */}
                  <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Actionable Suggestions</h5>
                    
                    {latestResume.qualityFeedback && latestResume.qualityFeedback.length > 0 ? (
                      <div className="space-y-3 text-xs leading-relaxed font-sans">
                        {latestResume.qualityFeedback.map((item: any, idx: number) => {
                          const isStrength = item.type === 'strength';
                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-2.5 p-3 rounded-lg border ${
                                isStrength 
                                  ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' 
                                  : 'bg-amber-500/5 border-amber-500/10 text-amber-400'
                              }`}
                            >
                              {isStrength ? (
                                <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-bold text-white block text-[10px] uppercase font-mono tracking-wide">
                                  [{item.category}] {isStrength ? 'Strength' : 'Improvement suggestion'}
                                </span>
                                <p className="text-[10px] text-zinc-350 mt-1 leading-relaxed">{item.message}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-500 text-center py-4">No suggestions generated.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Upload History */}
          {activeTab === 'history' && (
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Upload Logs & Versions</h3>
              
              {resumes.length === 0 ? (
                <p className="text-[10px] text-zinc-550 text-center py-4">No uploaded resume records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-400">
                    <thead className="text-[9px] uppercase tracking-wider font-bold border-b border-zinc-900 text-zinc-500">
                      <tr>
                        <th className="py-2.5">Version</th>
                        <th className="py-2.5">Filename</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5">Upload Date</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60 font-mono text-[10px]">
                      {resumes.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-950/20">
                          <td className="py-3 text-zinc-300 font-bold">v{item.version}</td>
                          <td className="py-3 text-zinc-300 max-w-[150px] truncate" title={item.fileName}>
                            {item.fileName}
                          </td>
                          <td className="py-3">
                            {item.isParsed ? (
                              <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15">Parsed</span>
                            ) : item.parsingError ? (
                              <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/15" title={item.parsingError}>Error</span>
                            ) : (
                              <span className="text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-850">Processing</span>
                            )}
                          </td>
                          <td className="py-3 text-zinc-500">
                            {new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 text-right space-x-1.5">
                            <a
                              href={`/api/resumes/${item.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block p-1 text-zinc-400 hover:text-white"
                              title="Download document"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={isPending}
                              className="p-1 text-zinc-500 hover:text-red-400"
                              title="Delete version record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
