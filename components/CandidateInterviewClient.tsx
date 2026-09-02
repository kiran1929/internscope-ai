'use client';

import React, { useState, useTransition } from 'react';
import {
  Brain,
  CheckCircle,
  Sparkles,
  Play,
  History,
  Activity,
  ShieldCheck,
  Loader2,
  Upload,
  Terminal,
  Users,
  FileText,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createInterviewSessionAction } from '@/app/actions/interview';

interface JobOption {
  id: string;
  title: string;
  companyName: string;
}

interface PastSessionItem {
  id: string;
  title: string;
  status: string;
  sessionLength: number;
  difficulty: string;
  overallScore: number | null;
  createdAt: Date;
}

export interface LongitudinalSkillItem {
  skill: string;
  averageScore: number;
  recentScore: number;
  attemptCount: number;
  trend: 'improving' | 'steady' | 'weak';
  lastTested: string;
}

interface CandidateInterviewClientProps {
  readiness: {
    overall: number;
    technical: number;
    behavioral: number;
    communication: number;
  };
  stats: {
    totalSessions: number;
    avgScore: number;
    weakestAreas: string[];
    strongestAreas: string[];
    recommendedPractice: string[];
  };
  jobOptions: JobOption[];
  pastSessions: PastSessionItem[];
  hasResume: boolean;
  longitudinalSkills?: LongitudinalSkillItem[];
  dailyInterviewsRemaining?: number;
}

export default function CandidateInterviewClient({
  readiness,
  stats,
  jobOptions,
  pastSessions,
  hasResume,
  longitudinalSkills = [],
  dailyInterviewsRemaining = 2,
}: CandidateInterviewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadSection, setShowUploadSection] = useState(false);

  // Launcher configurations (called unconditionally at top of component)
  const [targetJobId, setTargetJobId] = useState<string>('general');
  const [sessionLength, setSessionLength] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  
  // Categories selection
  const [categories, setCategories] = useState<string[]>([
    'Technical',
    'Behavioral',
    'Resume-based',
    'Problem Solving'
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsUploading(true);
    const { uploadResumeAction } = await import('@/app/actions/resume');
    const formData = new FormData();
    formData.append('file', uploadFile);
    const res = await uploadResumeAction(formData);
    setIsUploading(false);
    if (res.success) {
      toast.success('Resume uploaded successfully! Initializing mock interviewer...');
      setShowUploadSection(false);
      setUploadFile(null);
      router.refresh();
    } else {
      toast.error(`Upload failed: ${res.error}`);
    }
  };

  if (!hasResume) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-fade-in text-white ">
        <div className="border-b border-zinc-900 pb-5">
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" /> AI Interview Prep
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Practice customized role-specific questions and get instant STAR behavioral coaching.</p>
        </div>

        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-10 text-center max-w-xl mx-auto space-y-5">
          <Brain className="w-12 h-12 text-zinc-650 mx-auto" />
          <h2 className="text-lg font-bold font-display">Resume Required</h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans font-normal">
            The AI Interview Coach generates highly relevant, mock interview questions specifically tailored to your work history and tech stack. Please upload a resume first.
          </p>

          <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
            <div className="border border-dashed border-zinc-850 hover:border-zinc-800 rounded-lg p-6 text-center relative hover:bg-zinc-950/20 transition-all cursor-pointer">
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
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setUploadFile(null)}
                  className="px-3.5 py-1.5 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 rounded-lg text-xs font-bold"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Upload & Process</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      if (categories.length > 1) {
        setCategories(categories.filter(c => c !== cat));
      }
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleLaunch = () => {
    startTransition(async () => {
      toast.info('Generating tailor-made mock interview questions...');
      const res = await createInterviewSessionAction({
        opportunityId: targetJobId === 'general' ? undefined : targetJobId,
        sessionLength,
        difficulty,
        categories,
      });

      if (res.success && res.sessionId) {
        toast.success('Interview questions generated! Redirecting to practice room...');
        router.push(`/interview/${res.sessionId}`);
      } else {
        toast.error(`Failed to launch session: ${res.error}`);
      }
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-white ">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" /> AI Interview Prep
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Practice customized role-specific questions and get instant STAR behavioral coaching.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
            Free Sessions Remaining Today: <strong className="text-emerald-400">{dailyInterviewsRemaining}</strong>
          </span>
        </div>
      </div>

      {/* Top Stats Readiness Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Overall Score */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 flex flex-col items-center justify-between text-center relative shadow-sm">
          <div className="absolute top-0 right-0 p-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 opacity-60" />
          </div>
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Interview Readiness</h3>
          
          <div className="w-24 h-24 rounded-full border-[5px] border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center shadow-lg my-3 relative">
            <span className="text-2xl font-black text-white font-mono leading-none">
              {readiness.overall}
            </span>
            <span className="text-[8px] uppercase font-bold text-zinc-500 mt-1 font-mono">Score</span>
          </div>

          <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
            Composite score tracked over {stats.totalSessions} sessions.
          </p>
        </div>

        {/* Readiness Sub-scores progress cards */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 lg:col-span-3 flex flex-col justify-between shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Readiness Breakdown</h3>
          
          <div className="space-y-4 py-3">
            {[
              { label: 'Technical Prep Level', val: readiness.technical, color: 'bg-indigo-500' },
              { label: 'Behavioral Communication Level', val: readiness.behavioral, color: 'bg-emerald-500' },
              { label: 'Platform Performance Avg', val: stats.avgScore, color: 'bg-primary' },
            ].map((bar) => (
              <div key={bar.label} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-450">{bar.label}</span>
                  <span className="text-white font-bold font-mono">{bar.val}%</span>
                </div>
                <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                  <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${bar.val}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 border-t border-zinc-900/60 pt-3.5 mt-2">
            <span>Avg Session: ~12 mins</span>
            <span>STAR Coach Active</span>
          </div>
        </div>

      </div>

      {/* Main Row Splits: Practice Launcher vs Feedback Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Columns: Launcher Room Configuration */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Practice Room Setup */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Play className="w-4 h-4 text-primary" /> Setup Mock Session
            </h3>

            {/* Target Job Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-500 block">Target Opportunity</label>
              <select
                value={targetJobId}
                onChange={(e) => setTargetJobId(e.target.value)}
                className="bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg p-2.5 w-full focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="general">General Career Readiness (Resume-based)</option>
                {jobOptions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.companyName}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Resume / Change Resume Section */}
            <div className="bg-zinc-950/45 border border-zinc-850/60 rounded-lg p-3.5 space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-zinc-400 uppercase tracking-wider">Active Base Resume</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadSection(!showUploadSection);
                    setUploadFile(null);
                  }}
                  className="text-primary hover:text-blue-400 font-bold transition-all"
                >
                  {showUploadSection ? 'Cancel' : 'Upload Different Resume'}
                </button>
              </div>

              {!showUploadSection ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 p-2 rounded-md">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Resume loaded. Interview questions will auto-tune to your resume.</span>
                </div>
              ) : (
                <form onSubmit={handleUploadSubmit} className="space-y-3 pt-1">
                  <div className="border border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg p-4 text-center relative hover:bg-zinc-950/40 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-6 h-6 text-zinc-650 mx-auto mb-1.5" />
                    <p className="text-[10px] font-semibold text-zinc-400">
                      {uploadFile ? uploadFile.name : 'Choose new resume (PDF/DOCX)'}
                    </p>
                    <p className="text-[8px] text-zinc-600 mt-0.5">Max file size 5MB</p>
                  </div>
                  {uploadFile && (
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setUploadFile(null); setShowUploadSection(false); }}
                        className="px-2.5 py-1.5 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 rounded-lg text-[9px] font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUploading}
                        className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-lg text-[9px] font-bold flex items-center gap-1"
                      >
                        {isUploading && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                        <span>Upload & Sync</span>
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Difficulty and Length */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500 block">Session Length</label>
                <div className="flex gap-2">
                  {[5, 10].map((len) => (
                    <button
                      key={len}
                      type="button"
                      onClick={() => setSessionLength(len)}
                      className={`flex-1 py-1.5 border text-xs font-mono font-bold rounded-lg transition-all ${
                        sessionLength === len
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-zinc-850 bg-zinc-950 text-zinc-400 hover:bg-zinc-900'
                      }`}
                    >
                      {len} Qs
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-500 block">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
                  className="bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg p-1.5 w-full focus:outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Categories Multi-selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Practice Categories</label>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {categories.length} selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'Technical', label: 'Technical & Coding', desc: 'Core CS, system design, data structures', icon: Terminal },
                  { id: 'Behavioral', label: 'Behavioral (STAR)', desc: 'Leadership, teamwork, conflict resolution', icon: Users },
                  { id: 'Resume-based', label: 'Resume-Based', desc: 'Deep dive on your projects & work experience', icon: FileText },
                  { id: 'Problem Solving', label: 'Problem Solving', desc: 'Analytical thinking, case studies & estimations', icon: Sparkles },
                ].map((cat) => {
                  const selected = categories.includes(cat.id);
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-start gap-2.5 relative group ${
                        selected
                          ? 'border-primary/60 bg-primary/10 shadow-sm shadow-primary/10 text-white'
                          : 'border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900/60 hover:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          selected
                            ? 'bg-primary text-white shadow-sm shadow-primary/30'
                            : 'bg-zinc-900 text-zinc-400 group-hover:text-zinc-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>

                      <div className="flex-1 min-w-0 pr-5">
                        <span className={`text-xs font-bold block transition-colors ${selected ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                          {cat.label}
                        </span>
                        <span className="text-[10px] text-zinc-500 leading-tight block mt-0.5 font-normal">
                          {cat.desc}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                            selected
                              ? 'border-primary bg-primary text-white'
                              : 'border-zinc-700 bg-zinc-900/50'
                          }`}
                        >
                          {selected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleLaunch}
              disabled={isPending}
              className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              <span>Launch Mock Interview Session</span>
            </button>
          </div>

          {/* Past Sessions List */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-zinc-400" /> Completed Mock Attempts
            </h3>
            
            {pastSessions.length === 0 ? (
              <p className="text-[10px] text-zinc-550 text-center py-4">No past mock attempts found.</p>
            ) : (
              <div className="space-y-2">
                {pastSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => router.push(`/interview/${session.id}`)}
                    className="flex justify-between items-center p-3 rounded-lg border border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950 hover:border-zinc-800 transition-all cursor-pointer"
                  >
                    <div className="space-y-0.5 max-w-[70%]">
                      <span className="text-xs font-bold text-zinc-200 block truncate" title={session.title}>{session.title}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {session.sessionLength} questions • {session.difficulty} • {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-right">
                      {session.status === 'COMPLETED' ? (
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                          {session.overallScore}%
                        </span>
                      ) : (
                        <span className="text-zinc-500 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-[9px] font-mono">
                          Incomplete
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Weaknesses, Strengths, RecommendedPractice */}
        <div className="space-y-6">
          
          {/* Practice Recommendations */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3.5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> Focus Practice Topics
            </h3>
            <div className="space-y-2 text-xs leading-normal">
              {stats.recommendedPractice.length === 0 ? (
                <p className="text-[10px] text-zinc-550 py-3 text-center">Complete a mock attempt to map targeted focus topics.</p>
              ) : (
                stats.recommendedPractice.map((topic) => (
                  <div key={topic} className="flex gap-2 text-zinc-300 font-medium">
                    <span className="text-primary font-bold shrink-0">•</span>
                    <span>{topic}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Longitudinal Candidate Skill Memory */}
          {longitudinalSkills.length > 0 && (
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3.5 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-emerald-400" /> Longitudinal Skill Memory
                </h3>
                <span className="text-[9px] font-mono text-zinc-500">{longitudinalSkills.length} Tracked</span>
              </div>
              <p className="text-[10px] text-zinc-450 leading-relaxed">
                Adaptive memory tracked across your interview history. Future questions adaptively target your weaker trends.
              </p>
              <div className="space-y-2 pt-1">
                {longitudinalSkills.slice(0, 5).map((skillItem) => (
                  <div
                    key={skillItem.skill}
                    className="flex justify-between items-center p-2.5 rounded-lg border border-zinc-900 bg-zinc-950/40 text-xs"
                  >
                    <div>
                      <span className="font-bold text-zinc-200 capitalize block">{skillItem.skill}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {skillItem.attemptCount} attempts • {skillItem.trend}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                        skillItem.averageScore >= 75
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : skillItem.averageScore >= 55
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      }`}>
                        Avg: {skillItem.averageScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strongest vs Weakest areas splits */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" /> Performance Analysis
            </h3>
            
            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-1">Strongest Skills</span>
                {stats.strongestAreas.length === 0 ? (
                  <span className="text-[10px] text-zinc-650">No analysis computed yet.</span>
                ) : (
                  <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[10px]">
                    {stats.strongestAreas.map((area, idx) => <li key={idx}>{area}</li>)}
                  </ul>
                )}
              </div>

              <div className="border-t border-zinc-900/60 pt-3">
                <span className="text-[9px] uppercase font-bold text-amber-500 block mb-1">Development Gaps</span>
                {stats.weakestAreas.length === 0 ? (
                  <span className="text-[10px] text-zinc-650">No analysis computed yet.</span>
                ) : (
                  <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[10px]">
                    {stats.weakestAreas.map((area, idx) => <li key={idx}>{area}</li>)}
                  </ul>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
