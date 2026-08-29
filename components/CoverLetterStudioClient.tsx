'use client';

import React, { useState, useTransition, useEffect } from 'react';
import {
  Brain,
  Award,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Bookmark,
  ChevronRight,
  Loader2,
  FileText,
  Save,
  RotateCw,
  GitBranch,
  Settings,
  CornerDownRight,
  Copy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { generateCoverLetterAction, updateCoverLetterAction, deleteCoverLetterAction } from '@/app/actions/optimize';

interface JobOption {
  id: string;
  title: string;
  companyName: string;
}

interface CoverLetterVersionItem {
  id: string;
  version: number;
  content: string;
  style: string;
  createdAt: Date;
}

interface CoverLetterItem {
  id: string;
  title: string;
  createdAt: Date;
  opportunityId: string | null;
  opportunity: { title: string; company: { name: string } } | null;
  versions: CoverLetterVersionItem[];
}

interface CoverLetterStudioClientProps {
  coverLetters: CoverLetterItem[];
  jobOptions: JobOption[];
  hasResume: boolean;
  preselectedJobId?: string;
}

export default function CoverLetterStudioClient({
  coverLetters,
  jobOptions,
  hasResume,
  preselectedJobId,
}: CoverLetterStudioClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Launcher configurations
  const [targetJobId, setTargetJobId] = useState<string>(preselectedJobId || 'general');
  const [title, setTitle] = useState<string>('');
  const [style, setStyle] = useState<'Professional' | 'Concise' | 'Enthusiastic' | 'Startup' | 'Corporate'>('Professional');

  // Selected Cover Letter to edit
  const [selectedLetterId, setSelectedLetterId] = useState<string>(coverLetters[0]?.id || '');
  const [editorContent, setEditorContent] = useState<string>('');

  const selectedLetter = coverLetters.find(c => c.id === selectedLetterId);

  // Sync editor content when selection or versions change
  useEffect(() => {
    if (selectedLetter && selectedLetter.versions.length > 0) {
      // Load latest version content
      setEditorContent(selectedLetter.versions[0].content);
    } else {
      setEditorContent('');
    }
  }, [selectedLetterId, selectedLetter?.versions?.length]);

  const handleCreate = () => {
    if (!title.trim()) {
      toast.warning('Please enter a title for this cover letter (e.g. "Google application").');
      return;
    }

    startTransition(async () => {
      toast.info('Drafting cover letter with Gemini AI...');
      const res = await generateCoverLetterAction({
        opportunityId: targetJobId === 'general' ? undefined : targetJobId,
        style,
        title,
      });

      if (res.success && res.coverLetterId) {
        toast.success('Cover letter created!');
        setTitle('');
        setSelectedLetterId(res.coverLetterId);
        router.refresh();
      } else {
        toast.error(`Generation failed: ${res.error}`);
      }
    });
  };

  const handleSaveVersion = () => {
    if (!selectedLetterId) return;
    if (!editorContent.trim()) {
      toast.warning('Cannot save empty cover letter content.');
      return;
    }

    startTransition(async () => {
      toast.info('Saving cover letter version...');
      const res = await updateCoverLetterAction({
        coverLetterId: selectedLetterId,
        content: editorContent,
        style: selectedLetter?.versions[0]?.style || 'Professional',
      });

      if (res.success) {
        toast.success('New version draft saved successfully!');
        router.refresh();
      } else {
        toast.error(`Save failed: ${res.error}`);
      }
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this cover letter?')) return;

    startTransition(async () => {
      const res = await deleteCoverLetterAction(id);
      if (res.success) {
        toast.success('Cover letter deleted.');
        if (selectedLetterId === id) {
          setSelectedLetterId('');
        }
        router.refresh();
      } else {
        toast.error(`Delete failed: ${res.error}`);
      }
    });
  };

  const handleAIToneAdjust = (targetTone: typeof style) => {
    if (!selectedLetterId) return;
    
    startTransition(async () => {
      toast.info(`Adjusting tone to ${targetTone}...`);
      
      // Call generate cover letter action with same opportunity but new tone
      const job = selectedLetter?.opportunity;
      const res = await generateCoverLetterAction({
        opportunityId: selectedLetter?.opportunityId || undefined,
        style: targetTone,
        title: `${selectedLetter?.title || 'Draft'} - ${targetTone} style`,
      });

      if (res.success && res.coverLetterId) {
        toast.success('New cover letter style generated!');
        setSelectedLetterId(res.coverLetterId);
        router.refresh();
      } else {
        toast.error(`Adjust tone failed: ${res.error}`);
      }
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editorContent);
    toast.success('Cover letter copied to clipboard!');
  };

  if (!hasResume) {
    return (
      <div className="bg-[#111113] border border-zinc-850 rounded-xl p-10 text-center max-w-xl mx-auto space-y-5 animate-fade-in text-white">
        <Brain className="w-12 h-12 text-zinc-650 mx-auto" />
        <h2 className="text-lg font-bold font-display">Resume Required</h2>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans font-normal">
          Cover Letter Studio requires your resume metrics and job matching indexes to draft matching letters. Please upload a resume first.
        </p>
        <button
          onClick={() => router.push('/resume')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-xs font-bold rounded-lg"
        >
          <span>Go to Resume Manager</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-white ">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" /> Cover Letter Studio
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Draft highly tailored letters matching target job descriptions in seconds.</p>
        </div>
      </div>

      {/* Main splits: selectors vs rich editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Launcher & History sidebar */}
        <div className="space-y-6">
          
          {/* Launcher card */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-primary" /> Start Cover Letter
            </h3>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold text-zinc-500 block">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Google Application Letter"
                disabled={isPending}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-650 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold text-zinc-500 block">Target Opportunity</label>
              <select
                value={targetJobId}
                onChange={(e) => setTargetJobId(e.target.value)}
                className="bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg p-2.5 w-full focus:outline-none"
              >
                <option value="general">General Fit Letter</option>
                {jobOptions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] uppercase font-bold text-zinc-500 block">Style / Tone</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg p-2 w-full focus:outline-none"
              >
                <option value="Professional">Professional</option>
                <option value="Concise">Concise</option>
                <option value="Enthusiastic">Enthusiastic</option>
                <option value="Startup">Startup</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>

            <button
              onClick={handleCreate}
              disabled={isPending}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-current" />}
              <span>Generate Draft Cover Letter</span>
            </button>
          </div>

          {/* Letter history selection log */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Cover Letter Logs</h3>
            
            {coverLetters.length === 0 ? (
              <p className="text-[10px] text-zinc-550 text-center py-4">No cover letters generated yet.</p>
            ) : (
              <div className="space-y-2">
                {coverLetters.map((cl) => {
                  const isActive = selectedLetterId === cl.id;
                  return (
                    <div
                      key={cl.id}
                      onClick={() => setSelectedLetterId(cl.id)}
                      className={`flex justify-between items-center p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950 hover:border-zinc-800'
                      }`}
                    >
                      <div className="max-w-[70%] space-y-0.5">
                        <span className="text-xs font-bold text-zinc-200 block truncate">{cl.title}</span>
                        <span className="text-[9px] text-zinc-550 block font-mono">
                          {cl.versions.length} versions • {new Date(cl.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDelete(cl.id, e)}
                        className="text-zinc-650 hover:text-red-400 p-1 hover:bg-zinc-900 rounded"
                        title="Delete letter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Columns: Editor Arena */}
        <div className="lg:col-span-2 space-y-6">
          
          {!selectedLetter ? (
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-12 text-center text-zinc-550 shadow-sm">
              <FileText className="w-10 h-10 text-zinc-7550 mx-auto mb-2" />
              <p className="text-xs">Select or generate a cover letter draft to start editing.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Document bar */}
              <div className="bg-[#111113] border border-zinc-850 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm text-xs">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold text-primary block font-mono">[Editor mode]</span>
                  <h3 className="text-sm font-bold text-white block">{selectedLetter.title}</h3>
                  {selectedLetter.opportunity && (
                    <span className="text-[10px] text-zinc-500 font-sans block">
                      Target: {selectedLetter.opportunity.title} at {selectedLetter.opportunity.company.name}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-1.5 border border-zinc-850 hover:bg-zinc-900 rounded-lg font-bold text-zinc-200 flex items-center gap-1.5"
                    title="Copy letter to clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Letter</span>
                  </button>
                  <button
                    onClick={handleSaveVersion}
                    disabled={isPending}
                    className="px-3 py-1.5 bg-primary hover:bg-primary/95 rounded-lg font-bold text-white flex items-center gap-1.5"
                  >
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Version</span>
                  </button>
                </div>
              </div>

              {/* Editor Workspace Panels */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
                
                {/* Left 3 columns: textarea editor */}
                <div className="md:col-span-3 space-y-4">
                  <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 shadow-sm space-y-4">
                    <textarea
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      rows={16}
                      disabled={isPending}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-4 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none font-mono leading-relaxed"
                    />

                    {/* AI Tone Adjust Action list */}
                    <div className="space-y-2 pt-2 border-t border-zinc-900">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block font-mono">Adjust Tone using AI:</span>
                      <div className="flex flex-wrap gap-1.5 text-[9px] font-mono font-bold">
                        {['Professional', 'Concise', 'Enthusiastic', 'Startup', 'Corporate'].map((t) => (
                          <button
                            key={t}
                            onClick={() => handleAIToneAdjust(t as any)}
                            disabled={isPending}
                            className="bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded hover:bg-zinc-900 flex items-center gap-1"
                          >
                            <RotateCw className="w-2.5 h-2.5" />
                            <span>{t}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 1 column: Version History Timeline sidebar */}
                <div className="bg-[#111113] border border-zinc-850 rounded-xl p-4 space-y-4 shadow-sm text-xs">
                  <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Version History</h4>
                  
                  <div className="space-y-4 relative font-mono">
                    {selectedLetter.versions.map((v, vidx) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          setEditorContent(v.content);
                          toast.success(`Restored Version ${v.version} content to editor workspace.`);
                        }}
                        className="flex gap-3 items-start cursor-pointer hover:text-white text-zinc-400 group"
                      >
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-5 h-5 rounded-full border border-zinc-800 bg-zinc-950 flex items-center justify-center text-[9px] font-bold text-zinc-400 group-hover:border-primary group-hover:text-primary">
                            v{v.version}
                          </div>
                          {vidx < selectedLetter.versions.length - 1 && (
                            <div className="w-px h-8 bg-zinc-900 mt-1" />
                          )}
                        </div>

                        <div className="space-y-0.5 pt-0.5">
                          <span className="text-[10px] font-bold group-hover:text-white block">Version {v.version}</span>
                          <span className="text-[8px] text-zinc-550 block">
                            {new Date(v.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
