'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Brain,
  Award,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  BookOpen,
  X,
  Plus,
  BarChart,
  CornerDownRight,
  Info,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { submitAnswerAction } from '@/app/actions/interview';

interface EvaluationItem {
  score: number;
  technicalAccuracy: number;
  communication: number;
  completeness: number;
  problemSolving: number;
  confidence: number;
  structure: number;
  strengths: string[];
  weaknesses: string[];
  improvedAnswer: string | null;
  starMethodFollowed: boolean;
  starSituation: string | null;
  starTask: string | null;
  starAction: string | null;
  starResult: string | null;
  starCoachingFeedback: string | null;
}

interface QuestionItem {
  id: string;
  category: string;
  text: string;
  difficulty: string;
  order: number;
  answer: { userAnswer: string } | null;
  evaluation: EvaluationItem | null;
}

interface PracticeSession {
  id: string;
  title: string;
  status: string;
  sessionLength: number;
  difficulty: string;
  categories: string[];
  overallScore: number | null;
  technicalScore: number | null;
  behavioralScore: number | null;
  communicationScore: number | null;
  confidenceScore: number | null;
  summary: {
    overallFeedback: string;
    keyStrengths: string[];
    keyWeaknesses: string[];
    recommendedPractice: string[];
  } | null;
  questions: QuestionItem[];
}

interface CandidatePracticeSessionClientProps {
  session: PracticeSession;
}

export default function CandidatePracticeSessionClient({
  session,
}: CandidatePracticeSessionClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Find the first unanswered question
  const unansweredIndex = session.questions.findIndex(q => q.answer === null);
  const currentQuestionIndex = unansweredIndex === -1 ? session.questions.length - 1 : unansweredIndex;
  
  const currentQuestion = session.questions[currentQuestionIndex];
  const isSessionCompleted = session.status === 'COMPLETED' || unansweredIndex === -1;

  // Answer state
  const [answerText, setAnswerText] = useState<string>('');
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [showEvaluation, setShowEvaluation] = useState<boolean>(false);
  const [localEvaluation, setLocalEvaluation] = useState<EvaluationItem | null>(null);

  // Active review question select in summary report
  const [reviewIndex, setReviewIndex] = useState<number>(0);

  // Question timer
  useEffect(() => {
    if (isSessionCompleted || showEvaluation) return;
    
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionCompleted, showEvaluation, currentQuestionIndex]);

  // Reset local states on question change
  useEffect(() => {
    setAnswerText('');
    setTimerSeconds(0);
    setShowEvaluation(false);
    setLocalEvaluation(null);
  }, [currentQuestionIndex]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim()) {
      toast.warning('Please type an answer before submitting.');
      return;
    }

    startTransition(async () => {
      toast.info('Evaluating answer using STAR communication coach...');
      const res = await submitAnswerAction({
        questionId: currentQuestion.id,
        userAnswer: answerText,
      });

      if (res.success) {
        toast.success('Answer evaluated!');
        // Load the evaluation we just generated to present intermediate feedback
        const refreshedQuestion = await fetch(`/api/interview-eval/${currentQuestion.id}`).then(r => r.json());
        if (refreshedQuestion && refreshedQuestion.evaluation) {
          setLocalEvaluation(refreshedQuestion.evaluation);
          setShowEvaluation(true);
        } else {
          // If api fetch fails, refresh route direct
          router.refresh();
        }
      } else {
        toast.error(`Submission failed: ${res.error}`);
      }
    });
  };

  const handleNext = () => {
    setShowEvaluation(false);
    setLocalEvaluation(null);
    router.refresh();
  };

  // 1. COMPLETED SESSION SUMMARY VIEW
  if (isSessionCompleted) {
    const summary = session.summary;
    const activeReviewQuestion = session.questions[reviewIndex];
    const activeEval = activeReviewQuestion?.evaluation;

    return (
      <div className="space-y-6 sm:space-y-8 animate-fade-in text-white select-none">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">{session.title}</h2>
            <p className="text-xs text-zinc-400 mt-1">Mock session complete. View comprehensive evaluation scores below.</p>
          </div>
          <button
            onClick={() => router.push('/interview')}
            className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 rounded-lg text-xs font-bold"
          >
            Practice Dashboard
          </button>
        </div>

        {/* Aggregate Score Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
          
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 flex flex-col items-center justify-between text-center relative shadow-sm">
            <h3 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Session Score</h3>
            
            <div className="w-24 h-24 rounded-full border-[5px] border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center shadow-lg my-3 relative">
              <span className="text-2xl font-black text-white font-mono leading-none">
                {session.overallScore || '---'}
              </span>
              <span className="text-[8px] uppercase font-bold text-zinc-500 mt-1 font-mono">Score</span>
            </div>

            <p className="text-[10px] text-zinc-500 font-sans">
              Average across {session.sessionLength} questions.
            </p>
          </div>

          {/* Core breakdown progress list */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 lg:col-span-3 flex flex-col justify-between shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Evaluation Breakdown</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 text-center text-xs">
              {[
                { label: 'Technical Score', val: session.technicalScore, color: 'bg-indigo-500' },
                { label: 'Behavioral Score', val: session.behavioralScore, color: 'bg-emerald-500' },
                { label: 'Communication Score', val: session.communicationScore, color: 'bg-primary' },
                { label: 'Confidence Score', val: session.confidenceScore, color: 'bg-pink-500' },
              ].map((bar) => (
                <div key={bar.label} className="bg-zinc-950/40 border border-zinc-900/60 p-3 rounded-lg flex flex-col justify-between">
                  <span className="text-[8px] uppercase font-bold text-zinc-500 block leading-tight">{bar.label}</span>
                  <div className="my-1.5">
                    <span className="text-lg font-mono font-extrabold text-white">{bar.val || '---'}</span>
                    <span className="text-[9px] text-zinc-550 font-mono">%</span>
                  </div>
                  <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${bar.val || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Summary Feedback paragraph */}
        {summary && (
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Mock Session Summary
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              {summary.overallFeedback}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-zinc-900 pt-4 mt-2">
              <div>
                <span className="text-[9px] uppercase font-bold text-emerald-400 block mb-1">Key Strengths</span>
                <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[10px]">
                  {summary.keyStrengths.map((str, idx) => <li key={idx}>{str}</li>)}
                </ul>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-amber-500 block mb-1">Areas to Improve</span>
                <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[10px]">
                  {summary.keyWeaknesses.map((weak, idx) => <li key={idx}>{weak}</li>)}
                </ul>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-primary block mb-1">Practice Recommendations</span>
                <ul className="list-disc pl-4 space-y-1 text-zinc-400 text-[10px]">
                  {summary.recommendedPractice.map((rec, idx) => <li key={idx}>{rec}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Question Review Splits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Questions Selector list */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-3.5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Questions list</h3>
            
            <div className="space-y-2">
              {session.questions.map((q, idx) => {
                const isActive = reviewIndex === idx;
                const score = q.evaluation?.score;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => setReviewIndex(idx)}
                    className={`w-full flex justify-between items-center p-3 rounded-lg border text-left transition-all ${
                      isActive
                        ? 'border-primary bg-primary/5 text-white font-bold'
                        : 'border-zinc-900 bg-zinc-950/40 text-zinc-400 hover:bg-zinc-950'
                    }`}
                  >
                    <div className="max-w-[70%]">
                      <span className="text-[10px] text-zinc-550 block font-mono font-bold">Question {q.order}</span>
                      <span className="text-xs block truncate text-zinc-300 font-normal">{q.text}</span>
                    </div>
                    {score !== undefined && (
                      <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                        {score}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Selected Question Review details */}
          <div className="lg:col-span-2 space-y-6">
            
            {activeReviewQuestion && (
              <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
                
                {/* Question Text */}
                <div className="border-b border-zinc-900 pb-3">
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold text-zinc-500 uppercase">
                    <span>Category: {activeReviewQuestion.category}</span>
                    <span>Difficulty: {activeReviewQuestion.difficulty}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1.5 leading-relaxed">
                    Q: {activeReviewQuestion.text}
                  </h4>
                </div>

                {/* Candidate Answer */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 block">Your Answer:</span>
                  <p className="text-[11px] text-zinc-350 bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg leading-relaxed font-sans">
                    {activeReviewQuestion.answer?.userAnswer || 'No answer submitted.'}
                  </p>
                </div>

                {/* Question Evaluations */}
                {activeEval && (
                  <div className="space-y-4 pt-2 border-t border-zinc-900">
                    
                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg text-emerald-400">
                        <span className="font-bold text-white block text-[9px] uppercase font-mono mb-1">Answer Strengths</span>
                        <ul className="list-disc pl-4 space-y-1 text-[10px] text-zinc-300">
                          {activeEval.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                        </ul>
                      </div>

                      <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg text-amber-400">
                        <span className="font-bold text-white block text-[9px] uppercase font-mono mb-1">Answer Weaknesses</span>
                        <ul className="list-disc pl-4 space-y-1 text-[10px] text-zinc-300">
                          {activeEval.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* STAR method details coach */}
                    {activeReviewQuestion.category === 'Behavioral' && (
                      <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-lg space-y-3 text-xs leading-relaxed">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5">
                          <span className="font-bold text-zinc-300 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-primary" /> STAR Coach Audit
                          </span>
                          <span className={`text-[10px] font-bold font-mono ${activeEval.starMethodFollowed ? 'text-emerald-400' : 'text-amber-500'}`}>
                            {activeEval.starMethodFollowed ? 'STAR Method Followed' : 'STAR Method Incomplete'}
                          </span>
                        </div>

                        {!activeEval.starMethodFollowed && activeEval.starCoachingFeedback && (
                          <div className="text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/15 p-2 rounded leading-relaxed">
                            {activeEval.starCoachingFeedback}
                          </div>
                        )}

                        <div className="space-y-2 pt-1 font-sans text-[10px] text-zinc-400 leading-relaxed">
                          {activeEval.starSituation && (
                            <div>
                              <span className="font-bold text-zinc-200 block font-mono text-[9px]">[S] Situation:</span>
                              <p className="pl-3 border-l border-zinc-900 mt-0.5">{activeEval.starSituation}</p>
                            </div>
                          )}
                          {activeEval.starTask && (
                            <div>
                              <span className="font-bold text-zinc-200 block font-mono text-[9px]">[T] Task:</span>
                              <p className="pl-3 border-l border-zinc-900 mt-0.5">{activeEval.starTask}</p>
                            </div>
                          )}
                          {activeEval.starAction && (
                            <div>
                              <span className="font-bold text-zinc-200 block font-mono text-[9px]">[A] Action:</span>
                              <p className="pl-3 border-l border-zinc-900 mt-0.5">{activeEval.starAction}</p>
                            </div>
                          )}
                          {activeEval.starResult && (
                            <div>
                              <span className="font-bold text-zinc-200 block font-mono text-[9px]">[R] Result:</span>
                              <p className="pl-3 border-l border-zinc-900 mt-0.5">{activeEval.starResult}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Improved Answer Example */}
                    {activeEval.improvedAnswer && (
                      <div className="space-y-1.5 text-xs leading-relaxed">
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block">Suggested Model Answer:</span>
                        <p className="p-3 bg-primary/5 border border-primary/10 text-zinc-200 rounded-lg font-sans leading-relaxed text-[10px]">
                          {activeEval.improvedAnswer}
                        </p>
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>
    );
  }

  // 2. ACTIVE PRACTICE SESSION INTERACTION VIEW
  const unansweredCount = session.questions.length - unansweredIndex;
  const progressPct = Math.round(((currentQuestionIndex) / session.questions.length) * 100);

  const evaluationToShow = localEvaluation || currentQuestion?.evaluation;

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fade-in text-white select-none">
      
      {/* Title Bar info */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
        <div>
          <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase block">Mock Interview Arena</span>
          <h2 className="text-sm font-bold text-white mt-0.5">{session.title}</h2>
        </div>
        <button
          onClick={() => { if(confirm('Exit mock interview? Your answers so far are saved, but the summary report will not generate.')) router.push('/interview'); }}
          className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg border border-zinc-900 hover:bg-zinc-900"
          title="Exit Practice Room"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress timeline meter */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>Progress: Question {currentQuestionIndex + 1} of {session.questions.length}</span>
          <span>{progressPct}% Complete</span>
        </div>
        <div className="h-1.5 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Active Question Card */}
      <div className="bg-[#111113] border border-zinc-850 rounded-xl p-6 space-y-5 shadow-sm">
        
        {/* Category Details */}
        <div className="flex justify-between items-center text-[9px] font-mono font-bold text-zinc-500 uppercase border-b border-zinc-900 pb-2">
          <span className="text-zinc-400">Category: {currentQuestion.category}</span>
          <span>Difficulty: {currentQuestion.difficulty}</span>
        </div>

        {/* Text */}
        <h3 className="text-sm sm:text-base font-bold text-zinc-150 leading-relaxed">
          {currentQuestion.text}
        </h3>

        {/* Input / Form area */}
        {!showEvaluation ? (
          <form onSubmit={handleSubmitAnswer} className="space-y-4">
            <div className="relative">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={6}
                placeholder="Type your answer here. Provide details and framework metrics where applicable..."
                disabled={isPending}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-3 text-xs text-white placeholder:text-zinc-650 focus:ring-1 focus:ring-primary focus:outline-none font-sans leading-relaxed"
              />
              
              {/* Floating Timer */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded">
                <Clock className="w-3 h-3 text-zinc-450 animate-pulse" />
                <span>Timer: {formatTime(timerSeconds)}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 hover:cursor-pointer"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Submit Answer</span>
              </button>
            </div>
          </form>
        ) : (
          // Intermediate Evaluation Feedback block
          <div className="space-y-4 pt-3 border-t border-zinc-900 animate-in fade-in duration-200">
            
            {/* Answer feedback badge */}
            <div className="flex justify-between items-center bg-zinc-950/60 border border-zinc-900 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200">Answer Evaluated Successfully</span>
              </div>
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                Score: {evaluationToShow?.score || 70}%
              </span>
            </div>

            {evaluationToShow && (
              <div className="space-y-4 text-xs leading-relaxed">
                
                {/* Strengths / Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg text-emerald-400">
                    <span className="font-bold text-white block text-[9px] uppercase font-mono mb-1">Strengths</span>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-zinc-300">
                      {evaluationToShow.strengths.map((s, idx) => <li key={idx}>{s}</li>)}
                    </ul>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg text-amber-400">
                    <span className="font-bold text-white block text-[9px] uppercase font-mono mb-1">Weaknesses</span>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] text-zinc-300">
                      {evaluationToShow.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Behavioral STAR Method coach details */}
                {currentQuestion.category === 'Behavioral' && (
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg space-y-2">
                    <span className="font-bold text-zinc-300 block text-[9px] uppercase font-mono border-b border-zinc-900 pb-1">STAR Method Coaching Review</span>
                    {evaluationToShow.starCoachingFeedback && (
                      <p className="text-[10px] text-zinc-400 font-sans">{evaluationToShow.starCoachingFeedback}</p>
                    )}
                  </div>
                )}

                {/* Improved rewrite suggestion snippet */}
                {evaluationToShow.improvedAnswer && (
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Suggested Model Answer:</span>
                    <p className="p-3 bg-primary/5 border border-primary/10 text-zinc-200 rounded-lg font-sans leading-relaxed text-[10px]">
                      {evaluationToShow.improvedAnswer}
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* Next buttons */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 hover:cursor-pointer"
              >
                <span>{unansweredCount <= 1 ? 'Finish Session & View Report' : 'Next Question'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
