'use client';

import React, { useState, useTransition } from 'react';
import {
  Award,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Activity,
  Trash2,
  Bookmark,
  ChevronRight,
  ListChecks,
  Plus,
  Loader2,
  Copy,
  CornerDownRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { optimizeResumeAction, deleteOptimizationAction } from '@/app/actions/optimize';

interface BulletRewriteItem {
  original: string;
  suggested: string;
  explanation: string;
}

interface JobOption {
  id: string;
  title: string;
  companyName: string;
}

interface OptimizationItem {
  id: string;
  title: string;
  atsScore: number | null;
  createdAt: Date;
  opportunity: { title: string; company: { name: string } } | null;
  atsAnalysis: {
    atsScore: number;
    keywordMatchScore: number;
    missingKeywords: string[];
    weakBullets: string[];
    strongBullets: string[];
    missingSkills: string[];
    suggestedProjects: string[];
    suggestedCertifications: string[];
    formattingIssues: string[];
    improvementChecklist: string[];
  } | null;
  sections: Array<{
    id: string;
    sectionType: string;
    originalContent: string;
    optimizedContent: string;
    bulletRewrites: any; // JSON Array
  }>;
}

interface ResumeOptimizerPanelProps {
  optimizations: OptimizationItem[];
  jobOptions: JobOption[];
  preselectedJobId?: string;
}

export function ResumeOptimizerPanel({
  optimizations,
  jobOptions,
  preselectedJobId,
}: ResumeOptimizerPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [targetJobId, setTargetJobId] = useState<string>(preselectedJobId || 'general');
  const [title, setTitle] = useState<string>('');

  // Selected optimization to review details
  const [selectedOptId, setSelectedOptId] = useState<string>(optimizations[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'analysis' | 'sections' | 'bullets'>('analysis');

  const selectedOpt = optimizations.find(o => o.id === selectedOptId);

  const handleLaunch = () => {
    if (!title.trim()) {
      toast.warning('Please enter a description title (e.g. "Tailored for Google Software Engineer").');
      return;
    }

    startTransition(async () => {
      toast.info('Running ATS scan and tailormade optimization...');
      const res = await optimizeResumeAction({
        opportunityId: targetJobId === 'general' ? undefined : targetJobId,
        title,
      });

      if (res.success) {
        toast.success('Resume optimized successfully!');
        setTitle('');
        router.refresh();
      } else {
        toast.error(`Optimization failed: ${res.error}`);
      }
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this optimization copy?')) return;
    
    startTransition(async () => {
      const res = await deleteOptimizationAction(id);
      if (res.success) {
        toast.success('Optimization version deleted.');
        if (selectedOptId === id) {
          setSelectedOptId('');
        }
        router.refresh();
      } else {
        toast.error(`Delete failed: ${res.error}`);
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-6">
          
          {/* Launcher Panel */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-primary" /> Start Optimization
            </h3>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold text-zinc-500 block">Version Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Optimized for Google Frontend Engineer"
                disabled={isPending}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-650 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold text-zinc-500 block">Target Job Description</label>
              <select
                value={targetJobId}
                onChange={(e) => setTargetJobId(e.target.value)}
                className="bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg p-2.5 w-full focus:outline-none"
              >
                <option value="general">General Professional Fit (Keywords Boost)</option>
                {jobOptions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.companyName}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLaunch}
              disabled={isPending}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-current" />}
              <span>Generate ATS Optimized Copy</span>
            </button>
          </div>

          {/* Saved optimized copies list */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Optimized Versions</h3>
            
            {optimizations.length === 0 ? (
              <p className="text-[10px] text-zinc-550 text-center py-4">No optimized versions found. Launch one above!</p>
            ) : (
              <div className="space-y-2">
                {optimizations.map((opt) => {
                  const isActive = selectedOptId === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedOptId(opt.id)}
                      className={`flex justify-between items-center p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950 hover:border-zinc-800'
                      }`}
                    >
                      <div className="max-w-[70%] space-y-0.5">
                        <span className="text-xs font-bold text-zinc-200 block truncate">{opt.title}</span>
                        <span className="text-[9px] text-zinc-550 block">
                          {new Date(opt.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {opt.atsScore !== null && (
                          <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                            ATS {opt.atsScore}%
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDelete(opt.id, e)}
                          className="text-zinc-650 hover:text-red-400 p-1 hover:bg-zinc-900 rounded"
                          title="Delete copy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right 2 Columns: Selected Optimizations details display */}
        <div className="lg:col-span-2 space-y-6">
          
          {!selectedOpt ? (
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-12 text-center text-zinc-550 shadow-sm">
              <FileText className="w-10 h-10 text-zinc-7550 mx-auto mb-2" />
              <p className="text-xs">Select or generate an optimized resume version to view ATS score evaluations.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Version title card */}
              <div className="bg-[#111113] border border-zinc-850 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                <div>
                  <span className="text-[9px] uppercase font-bold text-primary font-mono">[Optimized Draft Active]</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{selectedOpt.title}</h3>
                  {selectedOpt.opportunity && (
                    <p className="text-[10px] text-zinc-500 font-sans mt-0.5">
                      Tailored for: {selectedOpt.opportunity.title} at {selectedOpt.opportunity.company.name}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 items-center">
                  <div className="text-center font-mono">
                    <span className="text-[8px] text-zinc-550 block uppercase font-bold">ATS Score</span>
                    <span className="text-xl font-black text-white">{selectedOpt.atsScore || '---'}%</span>
                  </div>
                  <div className="text-center font-mono border-l border-zinc-900 pl-4">
                    <span className="text-[8px] text-zinc-550 block uppercase font-bold">Keyword Match</span>
                    <span className="text-xl font-black text-emerald-400">{selectedOpt.atsAnalysis?.keywordMatchScore || '---'}%</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-zinc-900 pb-px text-xs">
                <button
                  onClick={() => setActiveSubTab('analysis')}
                  className={`px-4 py-2 font-bold border-b-2 transition-all ${
                    activeSubTab === 'analysis' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  ATS Analysis Audit
                </button>
                <button
                  onClick={() => setActiveSubTab('sections')}
                  className={`px-4 py-2 font-bold border-b-2 transition-all ${
                    activeSubTab === 'sections' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Optimized Sections ({selectedOpt.sections.length})
                </button>
                <button
                  onClick={() => setActiveSubTab('bullets')}
                  className={`px-4 py-2 font-bold border-b-2 transition-all ${
                    activeSubTab === 'bullets' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Bullet point Rewriter
                </button>
              </div>

              {/* Sub-tab 1: ATS Audit details */}
              {activeSubTab === 'analysis' && selectedOpt.atsAnalysis && (
                <div className="space-y-6 animate-fade-in">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Missing Keywords */}
                    <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3 shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">Missing target Keywords</h4>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedOpt.atsAnalysis.missingKeywords.length > 0 ? (
                          selectedOpt.atsAnalysis.missingKeywords.map(k => (
                            <span key={k} className="text-[9px] bg-red-500/5 text-red-400 border border-red-500/10 px-2.5 py-1 rounded font-mono">
                              {k}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-zinc-650">No missing keywords detected. Complete density alignment!</span>
                        )}
                      </div>
                    </div>

                    {/* Formatting Issues */}
                    <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3 shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">ATS Formatting & Readability Warnings</h4>
                      <ul className="list-disc pl-4 space-y-1.5 text-[10px] text-zinc-400">
                        {selectedOpt.atsAnalysis.formattingIssues.length > 0 ? (
                          selectedOpt.atsAnalysis.formattingIssues.map((issue, idx) => (
                            <li key={idx} className="text-amber-400/90 leading-relaxed font-sans">{issue}</li>
                          ))
                        ) : (
                          <li className="text-emerald-400">No formatting issues detected. Perfect!</li>
                        )}
                      </ul>
                    </div>

                  </div>

                  {/* Action checklist */}
                  <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3.5 shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <ListChecks className="w-4.5 h-4.5 text-primary" /> Actionable Improvement Checklist
                    </h4>
                    <div className="space-y-2.5 pt-1 text-xs font-sans">
                      {selectedOpt.atsAnalysis.improvementChecklist.map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <input type="checkbox" className="mt-0.5 rounded border-zinc-800 bg-zinc-950 focus:ring-primary focus:ring-1 focus:outline-none" />
                          <span className="text-zinc-300 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills, Projects & Certifications suggestions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1.5">Missing Skills</span>
                      <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[10px]">
                        {selectedOpt.atsAnalysis.missingSkills.map((s, idx) => <li key={idx}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1.5">Suggested Projects</span>
                      <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[10px]">
                        {selectedOpt.atsAnalysis.suggestedProjects.map((p, idx) => <li key={idx}>{p}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1.5">Suggested Certifications</span>
                      <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[10px]">
                        {selectedOpt.atsAnalysis.suggestedCertifications.map((c, idx) => <li key={idx}>{c}</li>)}
                      </ul>
                    </div>
                  </div>

                </div>
              )}

              {/* Sub-tab 2: Sections comparisons */}
              {activeSubTab === 'sections' && (
                <div className="space-y-6 animate-fade-in">
                  {selectedOpt.sections.map((sect) => (
                    <div key={sect.id} className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
                      
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
                        <span className="text-xs font-bold text-white uppercase font-mono">{sect.sectionType} Section</span>
                        <button
                          onClick={() => copyToClipboard(sect.optimizedContent)}
                          className="flex items-center gap-1 text-[9px] text-zinc-400 border border-zinc-850 hover:bg-zinc-900 px-2 py-0.5 rounded"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Optimized Draft</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="space-y-1 bg-zinc-950/40 border border-zinc-900/60 p-3 rounded-lg">
                          <span className="text-[9px] uppercase font-mono font-bold text-zinc-500 block">[Original Text]</span>
                          <p className="text-zinc-400 whitespace-pre-wrap leading-relaxed">{sect.originalContent || '---'}</p>
                        </div>
                        <div className="space-y-1 bg-primary/5 border border-primary/10 p-3 rounded-lg">
                          <span className="text-[9px] uppercase font-mono font-bold text-primary block">[Optimized Text]</span>
                          <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">{sect.optimizedContent || '---'}</p>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              {/* Sub-tab 3: Bullet points rewrites details */}
              {activeSubTab === 'bullets' && (
                <div className="space-y-6 animate-fade-in">
                  {(() => {
                    const experienceSection = selectedOpt.sections.find(s => s.sectionType === 'Experience');
                    const rewrites: BulletRewriteItem[] = experienceSection?.bulletRewrites as any || [];

                    if (rewrites.length === 0) {
                      return (
                        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-10 text-center text-zinc-550">
                          <p className="text-xs">No bullet rewrites found or needed for this version.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {rewrites.map((item, idx) => (
                          <div key={idx} className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm text-xs font-sans leading-relaxed">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1 bg-zinc-950/40 border border-zinc-900 p-3 rounded-lg">
                                <span className="text-[8px] uppercase font-mono font-bold text-zinc-500 block">Original Bullet Point:</span>
                                <p className="text-zinc-450 leading-relaxed font-sans">{item.original}</p>
                              </div>

                              <div className="space-y-1 bg-primary/5 border border-primary/10 p-3 rounded-lg relative">
                                <button
                                  onClick={() => copyToClipboard(item.suggested)}
                                  className="absolute top-2 right-2 p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-900"
                                  title="Copy suggestion"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[8px] uppercase font-mono font-bold text-primary block">Suggested Bullet Point:</span>
                                <p className="text-zinc-200 leading-relaxed font-sans pr-6">{item.suggested}</p>
                              </div>
                            </div>

                            {item.explanation && (
                              <div className="flex gap-2 text-[10px] text-zinc-400 bg-zinc-950/60 p-2.5 rounded border border-zinc-900 leading-normal">
                                <CornerDownRight className="w-3.5 h-3.5 text-primary shrink-0" />
                                <p>{item.explanation}</p>
                              </div>
                            )}

                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          )}

        </div>

      </div>
  );
}
