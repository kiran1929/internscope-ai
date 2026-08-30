'use client';

import React, { useState, useTransition } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  FileDown,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  Compass,
  Loader2,
  History,
  ShieldCheck,
  ScanLine,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { uploadResumeAction, deleteResumeAction } from '@/app/actions/resume';
import { ResumeOptimizerPanel } from '@/components/ResumeOptimizerClient';
import { cn } from '@/lib/utils';

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
    qualityFeedback: unknown;
    structuredData: unknown;
    createdAt: Date;
  } | null;
  optimizations: Array<{
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
      bulletRewrites: unknown;
    }>;
  }>;
  jobOptions: Array<{ id: string; title: string; companyName: string }>;
  initialTab?: 'profile' | 'quality' | 'history' | 'ats';
  preselectedJobId?: string;
}

type ResumeTab = 'profile' | 'quality' | 'history' | 'ats';

const TABS: { id: ResumeTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Structured Profile', icon: FileText },
  { id: 'quality', label: 'Quality Audit', icon: ShieldCheck },
  { id: 'ats', label: 'ATS Optimizer', icon: ScanLine },
  { id: 'history', label: 'Upload History', icon: History },
];

export default function CandidateResumeClient({
  resumes,
  latestResume,
  optimizations,
  jobOptions,
  initialTab = 'profile',
  preselectedJobId,
}: CandidateResumeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<ResumeTab>(initialTab);

  const switchTab = (tab: ResumeTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams();
    if (tab !== 'profile') params.set('tab', tab);
    const query = params.toString();
    router.replace(query ? `/resume?${query}` : '/resume', { scroll: false });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
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
        toast.success('Resume uploaded. Running AI parser...');
        setUploadFile(null);
        router.refresh();
      } else {
        toast.error(`Upload failed: ${res.error}`);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this resume version? Associated job match scores will also be removed.')) return;

    startTransition(async () => {
      const res = await deleteResumeAction(id);
      if (res.success) {
        toast.success('Resume deleted.');
        router.refresh();
      } else {
        toast.error(`Failed to delete: ${res.error}`);
      }
    });
  };

  const parsedData = latestResume?.structuredData as Record<string, unknown> | undefined;
  const qualityFeedback = (latestResume?.qualityFeedback as Array<{ type: string; category: string; message: string }>) || [];

  return (
    <div className="page-shell animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="page-header-title text-xl sm:text-2xl">Resume Intelligence</h1>
          <p className="page-header-subtitle max-w-xl">
            Upload your resume, review AI-parsed profile data, and optimize keywords for ATS screening.
          </p>
        </div>
        {latestResume?.isParsed && (
          <button
            type="button"
            onClick={() => switchTab('ats')}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shrink-0 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Run ATS Scan
          </button>
        )}
      </div>

      {/* Quick stats */}
      {latestResume?.isParsed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Quality Score', value: latestResume.qualityScore != null ? `${latestResume.qualityScore}%` : '—', accent: 'text-primary' },
            { label: 'Parse Confidence', value: latestResume.confidenceScore != null ? `${Math.round(latestResume.confidenceScore * 100)}%` : '—', accent: 'text-emerald-500' },
            { label: 'Versions', value: String(resumes.length), accent: 'text-foreground' },
            { label: 'ATS Scans', value: String(optimizations.length), accent: 'text-foreground' },
          ].map((stat) => (
            <div key={stat.label} className="dashboard-card px-4 py-3">
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-muted">{stat.label}</p>
              <p className={cn('text-xl font-bold font-mono mt-0.5', stat.accent)}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="dashboard-card p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              Upload Resume
            </h3>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div className="border border-dashed border-border-subtle hover:border-primary/40 rounded-xl p-6 text-center relative hover:bg-surface-muted/50 transition-all cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">
                  {uploadFile ? uploadFile.name : 'Drop PDF or DOCX here'}
                </p>
                <p className="text-xs text-text-muted mt-1">Max 5 MB</p>
              </div>

              {uploadFile && (
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setUploadFile(null)}
                    className="px-3 py-1.5 border border-border-subtle hover:bg-surface-muted text-text-muted rounded-lg text-xs font-semibold transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Upload &amp; Parse
                  </button>
                </div>
              )}
            </form>
          </div>

          {latestResume && (
            <div className="dashboard-card p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Parser Metadata</h3>
              <dl className="space-y-2 text-xs">
                {[
                  ['Provider', latestResume.aiProvider || 'Unknown'],
                  ['Version', latestResume.parserVersion || 'v1.0'],
                  ['Confidence', latestResume.confidenceScore != null ? `${Math.round(latestResume.confidenceScore * 100)}%` : '—'],
                  ['Latency', `${((latestResume.processingTimeMs || 0) / 1000).toFixed(1)}s`],
                  ['File', latestResume.fileName],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-text-muted">{label}</dt>
                    <dd className="text-foreground font-medium text-right truncate max-w-[55%]" title={String(value)}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab bar */}
          <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-surface-muted border border-border-subtle">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => switchTab(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                  activeTab === id
                    ? 'bg-card-bg text-foreground shadow-sm border border-border-subtle'
                    : 'text-text-muted hover:text-foreground'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {id === 'history' && (
                  <span className="ml-0.5 text-[10px] font-mono opacity-70">({resumes.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Profile tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {!latestResume ? (
                <EmptyState icon={FileText} message="No resume uploaded yet. Use the upload panel to index your profile." />
              ) : !latestResume.isParsed && latestResume.parsingError ? (
                <div className="dashboard-card p-5 border-danger/30 bg-danger/5 space-y-2">
                  <div className="flex items-center gap-2 text-danger font-semibold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Parsing failed
                  </div>
                  <p className="text-xs text-text-muted font-mono leading-relaxed">{latestResume.parsingError}</p>
                </div>
              ) : !latestResume.isParsed ? (
                <div className="dashboard-card p-10 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-foreground">Extracting document details…</p>
                  <p className="text-xs text-text-muted max-w-sm mx-auto">This usually takes a few seconds.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="dashboard-card p-5 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="text-base font-bold text-foreground">{String(parsedData?.fullName || 'No name extracted')}</h4>
                        <p className="text-xs text-primary font-medium mt-0.5">{String(parsedData?.location || 'Location not found')}</p>
                      </div>
                      <a
                        href={`/api/resumes/${latestResume.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-foreground hover:bg-surface-muted transition-all flex items-center gap-1.5 text-xs font-medium shrink-0"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Download
                      </a>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed italic border-l-2 border-primary/30 pl-3">
                      {String(parsedData?.summary || 'No summary extracted.')}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs border-t border-border-subtle pt-3">
                      <div>
                        <span className="text-text-muted block mb-0.5">Email</span>
                        <span className="text-foreground font-medium">{String(parsedData?.email || '—')}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block mb-0.5">Phone</span>
                        <span className="text-foreground font-medium">{String(parsedData?.phone || '—')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkillCard title="Core Skills" icon={Award} items={(parsedData?.skills as string[]) || []} />
                    <SkillCard title="Technologies" icon={Sparkles} items={(parsedData?.technologies as string[]) || []} accent="emerald" />
                  </div>

                  <SectionCard title="Professional Experience" icon={Briefcase} iconColor="text-indigo-400">
                    {(parsedData?.experience as Array<Record<string, unknown>>)?.length ? (
                      <div className="space-y-4 divide-y divide-border-subtle">
                        {(parsedData!.experience as Array<Record<string, unknown>>).map((exp, idx) => (
                          <div key={idx} className={cn('space-y-2', idx > 0 && 'pt-4')}>
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h6 className="font-semibold text-foreground text-sm">{String(exp.title)}</h6>
                                <p className="text-xs text-text-muted">{String(exp.company)}</p>
                              </div>
                              <span className="text-[10px] font-mono text-text-muted shrink-0">
                                {String(exp.startDate)} – {String(exp.endDate)}
                              </span>
                            </div>
                            {Boolean(exp.description) && (
                              <p className="text-xs text-text-muted leading-relaxed">{String(exp.description)}</p>
                            )}
                            {Array.isArray(exp.bullets) && (exp.bullets as string[]).length > 0 && (
                              <ul className="list-disc pl-4 space-y-1 text-xs text-text-muted">
                                {(exp.bullets as string[]).map((b, bidx) => (
                                  <li key={bidx}>{b}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted">No experience parsed.</p>
                    )}
                  </SectionCard>

                  <SectionCard title="Education" icon={BookOpen} iconColor="text-amber-500">
                    {(parsedData?.education as Array<Record<string, unknown>>)?.length ? (
                      <div className="space-y-3">
                        {(parsedData!.education as Array<Record<string, unknown>>).map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-2 text-sm">
                            <div>
                              <h6 className="font-semibold text-foreground">{String(edu.school)}</h6>
                              <p className="text-xs text-text-muted">
                                {String(edu.degree)}{edu.major ? ` in ${String(edu.major)}` : ''}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-text-muted shrink-0">
                              {String(edu.startYear)} – {String(edu.endYear)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted">No education parsed.</p>
                    )}
                  </SectionCard>

                  <SectionCard title="Projects" icon={Compass} iconColor="text-pink-400">
                    {(parsedData?.projects as Array<Record<string, unknown>>)?.length ? (
                      <div className="space-y-4 divide-y divide-border-subtle">
                        {(parsedData!.projects as Array<Record<string, unknown>>).map((proj, idx) => (
                          <div key={idx} className={cn('space-y-2', idx > 0 && 'pt-4')}>
                            <h6 className="font-semibold text-foreground text-sm">{String(proj.title)}</h6>
                            {Boolean(proj.description) && (
                              <p className="text-xs text-text-muted leading-relaxed">{String(proj.description)}</p>
                            )}
                            {Array.isArray(proj.technologies) && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {(proj.technologies as string[]).map((pt) => (
                                  <Tag key={pt} label={pt} />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted">No projects parsed.</p>
                    )}
                  </SectionCard>
                </div>
              )}
            </div>
          )}

          {/* Quality tab */}
          {activeTab === 'quality' && (
            <div className="space-y-4">
              {!latestResume?.isParsed ? (
                <EmptyState icon={ShieldCheck} message="Upload and parse a resume to see quality feedback." />
              ) : (
                <>
                  <div className="dashboard-card p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-1.5 text-center sm:text-left">
                      <h4 className="text-sm font-bold text-foreground">Resume Quality Audit</h4>
                      <p className="text-xs text-text-muted max-w-sm leading-relaxed">
                        Evaluates formatting, skills density, section completeness, and bullet structure.
                      </p>
                    </div>
                    <div
                      className={cn(
                        'w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shrink-0',
                        (latestResume.qualityScore ?? 0) >= 85
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : (latestResume.qualityScore ?? 0) >= 60
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'border-danger/30 bg-danger/5'
                      )}
                    >
                      <span className="text-2xl font-black text-foreground font-mono">{latestResume.qualityScore}</span>
                      <span className="text-[9px] uppercase font-bold text-text-muted">/ 100</span>
                    </div>
                  </div>

                  <div className="dashboard-card p-5 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">Suggestions</h5>
                    {qualityFeedback.length > 0 ? (
                      <div className="space-y-2">
                        {qualityFeedback.map((item, idx) => {
                          const isStrength = item.type === 'strength';
                          return (
                            <div
                              key={idx}
                              className={cn(
                                'flex items-start gap-2.5 p-3 rounded-lg border text-xs',
                                isStrength
                                  ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-amber-500/5 border-amber-500/15 text-amber-600 dark:text-amber-400'
                              )}
                            >
                              {isStrength ? (
                                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-semibold text-foreground block text-[10px] uppercase tracking-wide">
                                  {item.category} · {isStrength ? 'Strength' : 'Improve'}
                                </span>
                                <p className="text-text-muted mt-1 leading-relaxed">{item.message}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted text-center py-4">No suggestions generated.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ATS tab */}
          {activeTab === 'ats' && (
            <div>
              {!latestResume ? (
                <EmptyState
                  icon={ScanLine}
                  message="Upload a resume first to run ATS keyword optimization."
                  action={{ label: 'Go to upload', onClick: () => switchTab('profile') }}
                />
              ) : !latestResume.isParsed ? (
                <div className="dashboard-card p-10 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-foreground">Resume is still being parsed…</p>
                  <p className="text-xs text-text-muted">ATS optimization unlocks once parsing completes.</p>
                </div>
              ) : (
                <ResumeOptimizerPanel
                  optimizations={optimizations}
                  jobOptions={jobOptions}
                  preselectedJobId={preselectedJobId}
                />
              )}
            </div>
          )}

          {/* History tab */}
          {activeTab === 'history' && (
            <div className="dashboard-card p-5 space-y-4 overflow-hidden">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Upload Logs</h3>
              {resumes.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-6">No uploads yet.</p>
              ) : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider font-bold text-text-muted border-b border-border-subtle">
                        <th className="py-2.5 px-1">Ver</th>
                        <th className="py-2.5 px-1">File</th>
                        <th className="py-2.5 px-1">Status</th>
                        <th className="py-2.5 px-1">Quality</th>
                        <th className="py-2.5 px-1">Date</th>
                        <th className="py-2.5 px-1 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {resumes.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-muted/50 transition-colors">
                          <td className="py-3 px-1 font-mono font-bold text-foreground">v{item.version}</td>
                          <td className="py-3 px-1 text-foreground max-w-[140px] truncate" title={item.fileName}>
                            {item.fileName}
                          </td>
                          <td className="py-3 px-1">
                            <StatusBadge item={item} />
                          </td>
                          <td className="py-3 px-1 font-mono text-text-muted">
                            {item.qualityScore != null ? `${item.qualityScore}%` : '—'}
                          </td>
                          <td className="py-3 px-1 text-text-muted whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-1 text-right space-x-1">
                            <a
                              href={`/api/resumes/${item.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex p-1.5 rounded-md text-text-muted hover:text-foreground hover:bg-surface-muted transition-colors"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              disabled={isPending}
                              className="inline-flex p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/5 transition-colors"
                              title="Delete"
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

function Tag({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-medium text-text-muted bg-surface-muted border border-border-subtle px-2 py-0.5 rounded-md">
      {label}
    </span>
  );
}

function SkillCard({
  title,
  icon: Icon,
  items,
  accent = 'primary',
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
  accent?: 'primary' | 'emerald';
}) {
  return (
    <div className="dashboard-card p-5 space-y-3">
      <h5 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
        <Icon className={cn('w-4 h-4', accent === 'emerald' ? 'text-emerald-500' : 'text-primary')} />
        {title}
      </h5>
      <div className="flex flex-wrap gap-1.5">
        {items.length > 0 ? items.map((s) => <Tag key={s} label={s} />) : (
          <span className="text-xs text-text-muted">None listed.</span>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-card p-5 space-y-4">
      <h5 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
        <Icon className={cn('w-4 h-4', iconColor)} />
        {title}
      </h5>
      {children}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon: React.ElementType;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="dashboard-card p-10 text-center space-y-3">
      <Icon className="w-10 h-10 text-text-muted/40 mx-auto" />
      <p className="text-sm text-text-muted">{message}</p>
      {action && (
        <button type="button" onClick={action.onClick} className="text-sm text-primary font-semibold hover:underline">
          {action.label}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ item }: { item: ResumeHistoryItem }) {
  if (item.isParsed) {
    return (
      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
        Parsed
      </span>
    );
  }
  if (item.parsingError) {
    return (
      <span
        className="text-[10px] font-semibold text-danger bg-danger/10 px-2 py-0.5 rounded-md border border-danger/20"
        title={item.parsingError}
      >
        Error
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold text-text-muted bg-surface-muted px-2 py-0.5 rounded-md border border-border-subtle">
      Processing
    </span>
  );
}
