'use client';

import React, { useState, useTransition } from 'react';
import {
  Brain,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  BookOpen,
  Briefcase,
  Compass,
  ArrowRight,
  RefreshCw,
  GitBranch,
  ShieldCheck,
  Flame,
  Check,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Bookmark,
  X,
  Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { recalculateCareerAnalysisAction } from '@/app/actions/career';

interface SnapshotItem {
  id: string;
  createdAt: Date;
  careerScore: number;
  overallMatchScore: number;
  resumeQualityScore: number;
  analysisData: any;
}

interface LearningRoadmapItem {
  id: string;
  skillName: string;
  steps: any; // JSON Array of steps [{name, details}]
  estimatedHours: number;
  difficulty: string;
  prerequisites: string[];
  expectedImpact: string | null;
  learningOrder: number;
}

interface CareerAnalysisData {
  id: string;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  suitableRoles: string[];
  careerPaths: any;
  hiringIndustries: string[];
  estimatedReadiness: number | null;
  
  missingSkills: string[];
  missingTechnologies: string[];
  frequentSkills: string[];
  criticalGaps: string[];
  strengthAreas: string[];
  
  interviewReadinessScore: number | null;
  technicalReadiness: number | null;
  behavioralReadiness: number | null;
  portfolioStrength: number | null;
  projectQuality: number | null;
  communicationReadiness: number | null;

  careerScore: number | null;
  resumeQualityScore: number | null;
  jobMatchAvg: number | null;
  skillCoverageScore: number | null;
  projectQualityScore: number | null;
  experienceScore: number | null;
  consistencyScore: number | null;
  
  provider: string | null;
  model: string | null;
  tokensUsed: number;
  latencyMs: number;
  estimatedCost: number;
  updatedAt: Date;
  
  roadmaps: LearningRoadmapItem[];
}

interface CandidateCareerClientProps {
  analysis: CareerAnalysisData | null;
  snapshots: SnapshotItem[];
  hasResume: boolean;
}

export default function CandidateCareerClient({
  analysis,
  snapshots,
  hasResume,
}: CandidateCareerClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'roadmaps' | 'comparison' | 'simulator' | 'github' | 'portfolio'>('overview');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');

  // What-If Simulator state
  const [simSkills, setSimSkills] = useState<string[]>([]);
  const [simInput, setSimInput] = useState('');
  const [simResults, setSimResults] = useState<{
    actualAvg: number;
    simulatedAvg: number;
    delta: number;
    topImprovements: { jobId: string; jobTitle: string; companyName: string; actualScore: number; simulatedScore: number; delta: number }[];
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // GitHub Intel state
  const [githubUser, setGithubUser] = useState('');
  const [githubResults, setGithubResults] = useState<{
    githubScore: number;
    analysis: string;
    languageBreakdown: Record<string, number>;
    recommendations: string[];
    username: string;
    reposCount: number;
  } | null>(null);
  const [isGitHubPending, setIsGitHubPending] = useState(false);

  // Portfolio Intel state
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [portfolioResults, setPortfolioResults] = useState<{
    portfolioScore: number;
    analysis: string;
    recommendations: string[];
    url: string;
  } | null>(null);
  const [isPortfolioPending, setIsPortfolioPending] = useState(false);

  const handleSimulate = async () => {
    if (simSkills.length === 0) return;
    setIsSimulating(true);
    const { simulateCareerSkillAction } = await import('@/app/actions/candidate');
    const res = await simulateCareerSkillAction(simSkills);
    setIsSimulating(false);
    if (res.success) {
      setSimResults(res as any);
      toast.success('Simulation complete!');
    } else {
      toast.error(`Simulation failed: ${res.error}`);
    }
  };

  const handleGitHubAudit = async () => {
    if (!githubUser.trim()) return;
    setIsGitHubPending(true);
    const { analyzeGitHubIntelligenceAction } = await import('@/app/actions/candidate');
    const res = await analyzeGitHubIntelligenceAction(githubUser);
    setIsGitHubPending(false);
    if (res.success) {
      setGithubResults(res as any);
      toast.success('GitHub profile audited successfully!');
    } else {
      toast.error(`Audit failed: ${res.error}`);
    }
  };

  const handlePortfolioAudit = async () => {
    if (!portfolioUrl.trim()) return;
    setIsPortfolioPending(true);
    const { analyzePortfolioIntelligenceAction } = await import('@/app/actions/candidate');
    const res = await analyzePortfolioIntelligenceAction(portfolioUrl);
    setIsPortfolioPending(false);
    if (res.success) {
      setPortfolioResults(res as any);
      toast.success('Portfolio audited successfully!');
    } else {
      toast.error(`Audit failed: ${res.error}`);
    }
  };

  const handleRecalculate = () => {
    startTransition(async () => {
      toast.info('Recalculating Career Intelligence indices...');
      const res = await recalculateCareerAnalysisAction();
      if (res.success) {
        toast.success('Career Intelligence updated successfully!');
        router.refresh();
      } else {
        toast.error(`Update failed: ${res.error}`);
      }
    });
  };

  const selectedSnapshot = snapshots.find(s => s.id === selectedSnapshotId);

  // If no resume uploaded, prompt them to upload first
  if (!hasResume) {
    return (
      <div className="bg-[#111113] border border-zinc-850 rounded-xl p-10 text-center max-w-xl mx-auto space-y-5 animate-fade-in text-white">
        <Brain className="w-12 h-12 text-zinc-650 mx-auto" />
        <h2 className="text-lg font-bold font-display">Resume Required</h2>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          The Career Intelligence Engine extracts requirements and analyzes gaps by comparing your resume structure against matched opportunities. Please upload a resume first.
        </p>
        <button
          onClick={() => router.push('/resume')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-xs font-bold rounded-lg text-white"
        >
          <span>Go to Resume Manager</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // If resume exists but no career analysis run yet (or in processing state)
  if (!analysis) {
    return (
      <div className="bg-[#111113] border border-zinc-850 rounded-xl p-10 text-center max-w-xl mx-auto space-y-5 animate-fade-in text-white">
        <Brain className="w-12 h-12 text-primary animate-pulse mx-auto" />
        <h2 className="text-lg font-bold font-display">Run Career Analysis</h2>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          Analyze your resume details, skills gaps, and formulate personalized learning roadmaps using the Gemini AI Career assistant.
        </p>
        <button
          onClick={handleRecalculate}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary/95 text-xs font-bold rounded-lg text-white"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>Generate Career Insights</span>
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
            <Brain className="w-6 h-6 text-primary" /> AI Career Intelligence
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Discover customized skill gaps, interview readiness, and multi-step learning paths.</p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-800 hover:bg-zinc-900 rounded-lg text-[10px] font-bold text-zinc-200"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>Recalculate Score</span>
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex flex-wrap border-b border-zinc-900 pb-px text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Overview & Analysis
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'skills' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Skill Gaps
        </button>
        <button
          onClick={() => setActiveTab('roadmaps')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'roadmaps' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Learning Roadmaps ({analysis.roadmaps.length})
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'simulator' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          What-If Simulator
        </button>
        <button
          onClick={() => setActiveTab('github')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'github' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          GitHub Intelligence
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'portfolio' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Portfolio Intelligence
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
            activeTab === 'comparison' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Snapshot Comparison
        </button>
      </div>

      {/* TAB 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Main Top Cards Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* Score Ring Card */}
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 flex flex-col items-center justify-between text-center relative shadow-sm overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <TrendingUp className="w-4 h-4 text-primary opacity-60" />
              </div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">AI Career Score</h3>
              
              <div className="w-28 h-28 rounded-full border-[6px] border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center shadow-lg my-4 relative">
                <span className="text-3xl font-black text-white font-mono leading-none">
                  {analysis.careerScore}
                </span>
                <span className="text-[8px] uppercase font-bold text-zinc-500 mt-1 font-mono">Index</span>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 text-[9px] font-mono text-zinc-500 border-t border-zinc-900/60 pt-3">
                <div className="text-left">
                  <span>Resume Score:</span>
                  <span className="text-zinc-200 font-bold block">{analysis.resumeQualityScore}/100</span>
                </div>
                <div className="text-right">
                  <span>Job Match Avg:</span>
                  <span className="text-zinc-200 font-bold block">{analysis.jobMatchAvg}%</span>
                </div>
              </div>
            </div>

            {/* Career Summary Card */}
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 lg:col-span-2 flex flex-col justify-between shadow-sm">
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" /> Career Intelligence Summary
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {analysis.summary || 'Summary analysis was not generated.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-900/60 mt-4 text-[9px] font-mono text-zinc-500">
                <span>Model: <span className="text-zinc-300 font-bold">{analysis.model || 'Gemini'}</span></span>
                <span>•</span>
                <span>Readiness Score: <span className="text-emerald-400 font-bold">{Math.round((analysis.estimatedReadiness || 0.7) * 100)}%</span></span>
              </div>
            </div>

          </div>

          {/* Suitable roles and Hiring sectors row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Suitable Roles */}
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-400" /> Best Fit Careers & Roles
              </h3>
              <div className="space-y-2 pt-1.5">
                {analysis.suitableRoles.map((role, rIdx) => (
                  <div key={role} className="flex items-center justify-between text-xs py-1 border-b border-zinc-900/60 last:border-none">
                    <span className="text-zinc-200 font-bold flex items-center gap-2">
                      <span className="text-zinc-650 font-mono">#{rIdx + 1}</span>
                      <span>{role}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Recommended</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target hiring industries */}
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-400" /> Top Hiring Industries
              </h3>
              <div className="flex flex-wrap gap-2 pt-1.5">
                {analysis.hiringIndustries.map((ind) => (
                  <span key={ind} className="text-[10px] bg-zinc-950 text-zinc-400 border border-zinc-900 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{ind}</span>
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Interview Readiness details */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> Interview Readiness Audit
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 py-2">
              {[
                { label: 'Overall Readiness', val: analysis.interviewReadinessScore, color: 'bg-primary' },
                { label: 'Technical Prep', val: analysis.technicalReadiness, color: 'bg-indigo-500' },
                { label: 'Behavioral Skills', val: analysis.behavioralReadiness, color: 'bg-emerald-500' },
                { label: 'Portfolio Strength', val: analysis.portfolioStrength, color: 'bg-pink-500' },
                { label: 'Project Quality', val: analysis.projectQualityScore || analysis.projectQuality, color: 'bg-amber-500' },
                { label: 'Communication Prep', val: analysis.communicationReadiness, color: 'bg-teal-500' },
              ].map((item) => (
                <div key={item.label} className="bg-zinc-950/40 border border-zinc-900/60 p-3 rounded-lg text-center flex flex-col justify-between">
                  <span className="text-[8px] uppercase font-bold text-zinc-500 block leading-tight">{item.label}</span>
                  <div className="my-2.5">
                    <span className="text-xl font-mono font-extrabold text-white">{item.val || '---'}</span>
                    <span className="text-[9px] text-zinc-550 font-mono">%</span>
                  </div>
                  <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses details splits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-400" /> Career Strengths
              </h3>
              <ul className="space-y-2 pt-1 text-xs">
                {analysis.strengths.map((str, idx) => (
                  <li key={idx} className="flex gap-2 text-zinc-350 leading-relaxed font-sans">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500" /> Areas of Development
              </h3>
              <ul className="space-y-2 pt-1 text-xs">
                {analysis.weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex gap-2 text-zinc-350 leading-relaxed font-sans">
                    <span className="text-amber-500 font-bold shrink-0">!</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Skill Gaps */}
      {activeTab === 'skills' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Missing Skills */}
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3.5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" /> Missing Job Skills Gaps
              </h3>
              <p className="text-[10px] text-zinc-500 leading-normal">
                Frequently demanded skills across opportunities matching your profile that are not listed on your resume.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {analysis.missingSkills.length > 0 ? (
                  analysis.missingSkills.map((s) => (
                    <span key={s} className="text-[9px] bg-red-500/5 text-red-400 border border-red-500/10 px-2.5 py-1 rounded font-mono">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-zinc-650">No missing skills detected. Excellent alignment!</span>
                )}
              </div>
            </div>

            {/* Missing Technologies */}
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3.5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" /> Missing Technologies Gaps
              </h3>
              <p className="text-[10px] text-zinc-500 leading-normal">
                Modern tools, framework tags, or databases required in target job descriptions.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {analysis.missingTechnologies.length > 0 ? (
                  analysis.missingTechnologies.map((t) => (
                    <span key={t} className="text-[9px] bg-red-500/5 text-red-400 border border-red-500/10 px-2.5 py-1 rounded font-mono">
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-zinc-650">No missing technologies detected.</span>
                )}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Frequent Skills */}
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Frequently Required</h3>
              <div className="space-y-2 pt-1 text-xs">
                {analysis.frequentSkills.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Gaps */}
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white text-red-400">Critical Gaps</h3>
              <div className="space-y-2 pt-1 text-xs">
                {analysis.criticalGaps.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strength Areas */}
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Strength Areas</h3>
              <div className="space-y-2 pt-1 text-xs">
                {analysis.strengthAreas.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: Roadmaps */}
      {activeTab === 'roadmaps' && (
        <div className="space-y-6 animate-fade-in">
          {analysis.roadmaps.length === 0 ? (
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-10 text-center text-zinc-550">
              <p className="text-xs">No learning roadmaps needed. Your resume matches target requirements perfectly!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {analysis.roadmaps.map((mapItem) => (
                <div key={mapItem.id} className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
                  
                  {/* Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-900 pb-3.5">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-4.5 h-4.5 text-primary" /> Personalized Roadmap: {mapItem.skillName}
                      </h4>
                      {mapItem.expectedImpact && (
                        <p className="text-[10px] text-zinc-400 mt-1 font-sans italic leading-relaxed">
                          Expected Impact: &ldquo;{mapItem.expectedImpact}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-[9px] font-mono font-bold">
                      <span className="bg-zinc-950 text-zinc-400 border border-zinc-900 px-2 py-0.5 rounded">
                        {mapItem.difficulty}
                      </span>
                      <span className="bg-primary/10 text-primary border border-primary/15 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {mapItem.estimatedHours} hours
                      </span>
                    </div>
                  </div>

                  {/* Prerequisites */}
                  {mapItem.prerequisites && mapItem.prerequisites.length > 0 && (
                    <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
                      <span>Prerequisites:</span>
                      <div className="flex flex-wrap gap-1">
                        {mapItem.prerequisites.map(p => (
                          <span key={p} className="bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900 text-zinc-400">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Roadmap Steps list */}
                  <div className="space-y-3 pt-2 font-mono">
                    {Array.isArray(mapItem.steps) && mapItem.steps.map((step: any, sidx: number) => (
                      <div key={sidx} className="flex gap-4 items-start relative text-xs">
                        {/* Timeline bubble */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-5 h-5 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">
                            {sidx + 1}
                          </div>
                          {sidx < mapItem.steps.length - 1 && (
                            <div className="w-0.5 h-10 bg-zinc-900 mt-1" />
                          )}
                        </div>

                        {/* Step content */}
                        <div className="space-y-1 pt-0.5">
                          <span className="font-bold text-zinc-200">{step.name}</span>
                          <p className="text-[10px] text-zinc-400 leading-relaxed font-sans font-normal">{step.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Snapshot Comparisons */}
      {activeTab === 'comparison' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Selector box */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Compare Historical Snapshot</h3>
              <p className="text-[10px] text-zinc-500">Select a previous career snapshot logs to evaluate progress differences.</p>
            </div>
            
            <select
              value={selectedSnapshotId}
              onChange={(e) => setSelectedSnapshotId(e.target.value)}
              className="bg-zinc-950 border border-zinc-850 text-xs text-white rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none min-w-[200px]"
            >
              <option value="">-- Choose past snapshot --</option>
              {snapshots.map((snap) => (
                <option key={snap.id} value={snap.id}>
                  {new Date(snap.createdAt).toLocaleDateString()} - Score {snap.careerScore}
                </option>
              ))}
            </select>
          </div>

          {/* Comparison comparison panels */}
          {!selectedSnapshot ? (
            <div className="bg-[#111113] border border-zinc-850 rounded-xl p-10 text-center text-zinc-550">
              <p className="text-xs">Choose a previous analysis date snapshot above to run comparisons.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score comparisons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Career Score Diff */}
                <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 text-center flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">AI Career Score</span>
                  
                  <div className="flex justify-center items-center gap-6 my-4 font-mono">
                    <div className="text-center">
                      <span className="text-zinc-500 block text-[9px]">Past</span>
                      <span className="text-xl font-bold text-zinc-400">{selectedSnapshot.careerScore}</span>
                    </div>
                    <div className="text-zinc-650 text-xl font-bold">→</div>
                    <div className="text-center">
                      <span className="text-primary block text-[9px] font-bold">Current</span>
                      <span className="text-2xl font-black text-white">{analysis.careerScore}</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-900/60 mt-2 text-[10px] font-bold">
                    {Number(analysis.careerScore) >= selectedSnapshot.careerScore ? (
                      <span className="text-emerald-400">+{(Number(analysis.careerScore) - selectedSnapshot.careerScore)} Increase</span>
                    ) : (
                      <span className="text-red-400">-{(selectedSnapshot.careerScore - Number(analysis.careerScore))} Decrease</span>
                    )}
                  </div>
                </div>

                {/* Match Score Diff */}
                <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 text-center flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Avg Opportunity Match</span>
                  
                  <div className="flex justify-center items-center gap-6 my-4 font-mono">
                    <div className="text-center">
                      <span className="text-zinc-500 block text-[9px]">Past</span>
                      <span className="text-xl font-bold text-zinc-400">{selectedSnapshot.overallMatchScore}%</span>
                    </div>
                    <div className="text-zinc-650 text-xl font-bold">→</div>
                    <div className="text-center">
                      <span className="text-primary block text-[9px] font-bold">Current</span>
                      <span className="text-2xl font-black text-white">{analysis.jobMatchAvg}%</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-900/60 mt-2 text-[10px] font-bold">
                    {Number(analysis.jobMatchAvg) >= selectedSnapshot.overallMatchScore ? (
                      <span className="text-emerald-400">+{(Number(analysis.jobMatchAvg) - selectedSnapshot.overallMatchScore)}% Increase</span>
                    ) : (
                      <span className="text-red-400">-{(selectedSnapshot.overallMatchScore - Number(analysis.jobMatchAvg))}% Decrease</span>
                    )}
                  </div>
                </div>

                {/* Resume Score Diff */}
                <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 text-center flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Resume Quality</span>
                  
                  <div className="flex justify-center items-center gap-6 my-4 font-mono">
                    <div className="text-center">
                      <span className="text-zinc-500 block text-[9px]">Past</span>
                      <span className="text-xl font-bold text-zinc-400">{selectedSnapshot.resumeQualityScore}</span>
                    </div>
                    <div className="text-zinc-650 text-xl font-bold">→</div>
                    <div className="text-center">
                      <span className="text-primary block text-[9px] font-bold">Current</span>
                      <span className="text-2xl font-black text-white">{analysis.resumeQualityScore}</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-zinc-900/60 mt-2 text-[10px] font-bold">
                    {Number(analysis.resumeQualityScore) >= selectedSnapshot.resumeQualityScore ? (
                      <span className="text-emerald-400">+{(Number(analysis.resumeQualityScore) - selectedSnapshot.resumeQualityScore)} Increase</span>
                    ) : (
                      <span className="text-red-400">-{(selectedSnapshot.resumeQualityScore - Number(analysis.resumeQualityScore))} Decrease</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Snapshot Comparison Details */}
              <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm text-xs leading-relaxed font-sans">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Analysis Comparison Summary</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  <div className="space-y-2">
                    <span className="text-zinc-500 block font-mono text-[9px] uppercase tracking-wider">Past Analysis ({new Date(selectedSnapshot.createdAt).toLocaleDateString()})</span>
                    <p className="text-zinc-400 font-sans leading-relaxed">{selectedSnapshot.analysisData?.summary || 'No summary snapshot recorded.'}</p>
                    <div className="space-y-1">
                      <span className="font-bold text-zinc-300">Roles:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedSnapshot.analysisData?.suitableRoles?.map((r: string) => (
                          <span key={r} className="text-[9px] bg-zinc-950 border border-zinc-900 text-zinc-450 px-2 py-0.5 rounded">{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t md:border-t-0 md:border-l border-zinc-900 pt-4 md:pt-0 md:pl-6">
                    <span className="text-primary block font-mono text-[9px] uppercase tracking-wider font-bold">Current Analysis</span>
                    <p className="text-zinc-200 font-sans leading-relaxed">{analysis.summary}</p>
                    <div className="space-y-1">
                      <span className="font-bold text-white">Roles:</span>
                      <div className="flex flex-wrap gap-1">
                        {analysis.suitableRoles.map((r: string) => (
                          <span key={r} className="text-[9px] bg-zinc-950 border border-zinc-900 text-zinc-200 px-2 py-0.5 rounded">{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* TAB 5: What-If Simulator */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">What-If Skill Simulator</h3>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Add technical skills to your simulation profile and preview the immediate impact on your average job match percentage across all available opportunities.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                placeholder="Type a skill (e.g. Docker, Redis, Kubernetes, Next.js)"
                className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white outline-none focus:border-primary placeholder-zinc-650"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (simInput.trim() && !simSkills.includes(simInput.trim())) {
                      setSimSkills([...simSkills, simInput.trim()]);
                      setSimInput('');
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (simInput.trim() && !simSkills.includes(simInput.trim())) {
                    setSimSkills([...simSkills, simInput.trim()]);
                    setSimInput('');
                  }
                }}
                className="px-4 py-2 bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 rounded-lg text-xs font-bold text-zinc-200"
              >
                Add Skill
              </button>
            </div>

            {/* Popular quick add skills */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] text-zinc-500 font-bold">Quick Add:</span>
              {['Docker', 'Redis', 'Kubernetes', 'Next.js', 'AWS', 'Python', 'Golang', 'TypeScript'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    if (!simSkills.includes(s)) {
                      setSimSkills([...simSkills, s]);
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-900 text-[10px] text-zinc-400 hover:border-zinc-800"
                >
                  +{s}
                </button>
              ))}
            </div>

            {simSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {simSkills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-850 text-[10px] text-zinc-300"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => setSimSkills(simSkills.filter((x) => x !== s))}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating || simSkills.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 text-xs font-bold rounded-lg text-white disabled:opacity-50"
              >
                {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Calculate Simulated Match Score</span>
              </button>
            </div>
          </div>

          {simResults && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 text-center flex flex-col justify-between shadow-sm">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Simulated Impact</span>
                
                <div className="flex justify-center items-center gap-6 my-6 font-mono">
                  <div className="text-center">
                    <span className="text-zinc-500 block text-[9px]">Actual Avg</span>
                    <span className="text-xl font-bold text-zinc-400">{simResults.actualAvg}%</span>
                  </div>
                  <div className="text-zinc-650 text-xl font-bold">→</div>
                  <div className="text-center">
                    <span className="text-primary block text-[9px] font-bold">Simulated Avg</span>
                    <span className="text-2xl font-black text-white">{simResults.simulatedAvg}%</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-zinc-900/60 mt-2 text-xs font-bold">
                  {simResults.delta > 0 ? (
                    <span className="text-emerald-400">+{simResults.delta}% Match Increase!</span>
                  ) : (
                    <span className="text-zinc-400">No score change. Add more core technical skills.</span>
                  )}
                </div>
              </div>

              <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 lg:col-span-2 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Target Roles Reached</h4>
                <div className="space-y-3">
                  {simResults.topImprovements.length > 0 ? (
                    simResults.topImprovements.map((imp) => (
                      <div key={imp.jobId} className="flex justify-between items-center text-xs py-2 border-b border-zinc-900/60 last:border-none">
                        <div>
                          <span className="text-zinc-200 font-bold block">{imp.jobTitle}</span>
                          <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">{imp.companyName}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-emerald-400 font-bold block">+{imp.delta}% Match</span>
                          <span className="text-[10px] text-zinc-500 block">({imp.actualScore}% → {imp.simulatedScore}%)</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500 py-4 text-center">No matching delta found for these skills.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: GitHub Intelligence */}
      {activeTab === 'github' && (
        <div className="space-y-6">
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">GitHub Profile Intelligence</h3>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Scan repository statistics, primary languages, documentation depth, and technical scope to construct a recruiter-focused GitHub Career Score.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={githubUser}
                onChange={(e) => setGithubUser(e.target.value)}
                placeholder="Enter GitHub username (e.g. torvalds)"
                className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white outline-none focus:border-primary placeholder-zinc-650"
              />
              <button
                type="button"
                onClick={handleGitHubAudit}
                disabled={isGitHubPending || !githubUser.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary/95 rounded-lg text-xs font-bold text-white disabled:opacity-50"
              >
                {isGitHubPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Scan Repos</span>}
              </button>
            </div>
          </div>

          {githubResults && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 flex flex-col items-center justify-between text-center relative shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">GitHub Code Score</h3>
                
                <div className="w-28 h-28 rounded-full border-[6px] border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center shadow-lg my-6">
                  <span className="text-3xl font-black text-white font-mono leading-none">
                    {githubResults.githubScore}
                  </span>
                  <span className="text-[8px] uppercase font-bold text-indigo-400 mt-1 font-mono">Rating</span>
                </div>

                <div className="w-full text-left border-t border-zinc-900/60 pt-3">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">Languages Distribution</span>
                  <div className="space-y-2">
                    {Object.entries(githubResults.languageBreakdown).map(([lang, count]) => (
                      <div key={lang} className="text-xs">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-zinc-300 font-semibold">{lang}</span>
                          <span className="text-zinc-500 font-mono">{count} repo{count > 1 ? 's' : ''}</span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-1.5 border border-zinc-900">
                          <div
                            className="bg-indigo-500 h-1 rounded-full"
                            style={{ width: `${Math.min(100, (count / githubResults.reposCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 lg:col-span-2 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">GitHub Portfolio Audit Summary</h4>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{githubResults.analysis}</p>
                
                <div className="space-y-2.5 pt-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Recruiter Recommendations</span>
                  {githubResults.recommendations.map((rec, rIdx) => (
                    <div key={rIdx} className="flex gap-2.5 items-start text-xs text-zinc-400 leading-relaxed font-sans">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: Portfolio Intelligence */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Portfolio Website Intelligence</h3>
            </div>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Verify page structuring, loading weights, responsiveness, SEO tags, and accessibility checkpoints to optimize developer portfolio page utility.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="Enter portfolio site URL (e.g. https://mywebsite.com)"
                className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-white outline-none focus:border-primary placeholder-zinc-650"
              />
              <button
                type="button"
                onClick={handlePortfolioAudit}
                disabled={isPortfolioPending || !portfolioUrl.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary/95 rounded-lg text-xs font-bold text-white disabled:opacity-50"
              >
                {isPortfolioPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Audit Site</span>}
              </button>
            </div>
          </div>

          {portfolioResults && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 flex flex-col items-center justify-between text-center relative shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Usability & Performance</h3>
                
                <div className="w-28 h-28 rounded-full border-[6px] border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center shadow-lg my-6">
                  <span className="text-3xl font-black text-white font-mono leading-none">
                    {portfolioResults.portfolioScore}
                  </span>
                  <span className="text-[8px] uppercase font-bold text-emerald-400 mt-1 font-mono">Rating</span>
                </div>

                <div className="w-full text-left border-t border-zinc-900/60 pt-3 space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Auditor Checkpoints</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 p-2 rounded">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SEO Tags</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 p-2 rounded">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Responsive</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 p-2 rounded">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Aria Role</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 p-2 rounded">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SSL Check</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 lg:col-span-2 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-zinc-900 pb-2">Auditor Usability Feedback</h4>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">{portfolioResults.analysis}</p>
                
                <div className="space-y-2.5 pt-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Optimizations Checklist</span>
                  {portfolioResults.recommendations.map((rec, rIdx) => (
                    <div key={rIdx} className="flex gap-2.5 items-start text-xs text-zinc-400 leading-relaxed font-sans">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
