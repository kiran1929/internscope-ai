'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
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
  Plus,
  Trash2,
  Bookmark,
  ChevronRight,
  Loader2,
  FileText,
  Calendar,
  Goal,
  TrendingUp,
  Mail,
  Activity,
  History,
  Play
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { askCopilotAction, createCareerGoalAction, deleteGoalAction, generateWeeklyReportManualAction } from '@/app/actions/copilot';

interface MessageItem {
  id: string;
  sender: string;
  content: string;
  createdAt: Date;
}

interface GoalItem {
  id: string;
  title: string;
  progress: number;
  missingSkills: string[];
  targetDate: Date | null;
}

interface MatchJob {
  title: string;
  companyName: string;
  score: number;
}

interface ConversationItem {
  id: string;
  title: string;
  createdAt: Date;
}

interface ReportItem {
  id: string;
  createdAt: Date;
  careerScoreDelta: number;
  recommendations: string[];
}

interface CandidateCopilotClientProps {
  careerScore: number;
  activeGoals: GoalItem[];
  matchingJobs: MatchJob[];
  conversations: ConversationItem[];
  reports: ReportItem[];
  activeConvId: string | null;
  initialMessages: MessageItem[];
  skillsProgress: { name: string; count: number }[];
}

export default function CandidateCopilotClient({
  careerScore,
  activeGoals,
  matchingJobs,
  conversations,
  reports,
  activeConvId,
  initialMessages,
  skillsProgress,
}: CandidateCopilotClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Chat states
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [inputText, setInputText] = useState<string>('');
  const [currentConvId, setCurrentConvId] = useState<string | null>(activeConvId);

  // Goal config launcher
  const [goalTitle, setGoalTitle] = useState<string>('');
  const [goalDate, setGoalDate] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync initial messages when conversation ID changes
  useEffect(() => {
    setMessages(initialMessages);
    setCurrentConvId(activeConvId);
  }, [activeConvId, initialMessages]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Optimistically push user message
    const userMsg: MessageItem = {
      id: Math.random().toString(),
      sender: 'USER',
      content: textToSend,
      createdAt: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    startTransition(async () => {
      const res = await askCopilotAction({
        conversationId: currentConvId,
        messageContent: textToSend,
      });

      if (res.success && res.message && res.conversationId) {
        setMessages(prev => [...prev, res.message as MessageItem]);
        if (!currentConvId) {
          setCurrentConvId(res.conversationId);
          router.push(`/copilot?convId=${res.conversationId}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(`Copilot error: ${res.error}`);
      }
    });
  };

  const handleCreateGoal = () => {
    if (!goalTitle.trim()) {
      toast.warning('Please enter a goal target title.');
      return;
    }

    startTransition(async () => {
      const res = await createCareerGoalAction({
        title: goalTitle,
        targetDateStr: goalDate || undefined,
      });

      if (res.success) {
        toast.success('Career goal created!');
        setGoalTitle('');
        setGoalDate('');
        router.refresh();
      } else {
        toast.error(`Goal creation failed: ${res.error}`);
      }
    });
  };

  const handleDeleteGoal = (id: string) => {
    if (!confirm('Are you sure you want to delete this career goal?')) return;
    
    startTransition(async () => {
      const res = await deleteGoalAction(id);
      if (res.success) {
        toast.success('Goal deleted.');
        router.refresh();
      } else {
        toast.error(`Delete failed: ${res.error}`);
      }
    });
  };

  const handleTriggerReport = () => {
    startTransition(async () => {
      toast.info('Analyzing snapshot delta aggregates...');
      const res = await generateWeeklyReportManualAction();
      if (res.success) {
        toast.success('Weekly career performance report generated!');
        router.refresh();
      } else {
        toast.error(`Failed to generate report: ${res.error}`);
      }
    });
  };

  const suggestedQuestions = [
    'What should I learn this week?',
    'How can I improve my resume?',
    'How do I answer: conflict with a teammate?',
    'Which internship should I apply to first?',
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-foreground ">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" /> AI Career Copilot
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Career intelligence from your resume and matches, plus behavioral interview coaching with STAR-format answers.</p>
        </div>

        <button
          onClick={handleTriggerReport}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 rounded-lg text-[10px] font-bold text-zinc-200"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Generate Performance Report</span>
        </button>
      </div>

      {/* Top Overview Progress widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Career Score */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 flex flex-col items-center justify-between text-center relative shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Career Index Score</h3>
          <div className="w-20 h-20 rounded-full border-[4px] border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center shadow-lg my-2 relative">
            <span className="text-xl font-black text-white font-mono leading-none">{careerScore}</span>
            <span className="text-[7px] uppercase font-bold text-zinc-500 mt-0.5">Rating</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono">Real-time profile status</span>
        </div>

        {/* Active Goals widget */}
        <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 lg:col-span-3 flex flex-col justify-between shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Goal className="w-4 h-4 text-primary" /> Goal Target Alignment
          </h3>
          
          <div className="py-2 space-y-3.5">
            {activeGoals.length === 0 ? (
              <p className="text-[10px] text-zinc-550 py-3">No active career goals configured. Add one below to track readiness progress!</p>
            ) : (
              activeGoals.map(g => (
                <div key={g.id} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-zinc-200">{g.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-mono">Est Readiness: {Math.round(g.progress)}%</span>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="text-zinc-650 hover:text-red-400 p-0.5"
                        title="Delete target"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${g.progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2 items-center text-[9px] border-t border-zinc-900 pt-3.5 mt-2">
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g. Backend Internship"
              className="bg-zinc-950 border border-zinc-850 text-white rounded px-2.5 py-1.5 flex-1 focus:outline-none placeholder:text-zinc-700"
            />
            <input
              type="date"
              value={goalDate}
              onChange={(e) => setGoalDate(e.target.value)}
              className="bg-zinc-950 border border-zinc-850 text-white rounded px-2.5 py-1.5 focus:outline-none"
            />
            <button
              onClick={handleCreateGoal}
              className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-white font-bold rounded"
            >
              Add Goal
            </button>
          </div>
        </div>

      </div>

      {/* Main Splits: Copilot Chat Room vs Career Intelligence Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 columns: Chat Copilot Arena */}
        <div className="lg:col-span-2 bg-[#111113] border border-zinc-850 rounded-xl flex flex-col h-[550px] shadow-sm relative overflow-hidden">
          
          {/* Chat Arena Header */}
          <div className="border-b border-zinc-900 p-4 flex justify-between items-center text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-primary animate-pulse" /> Copilot Chat Thread
            </span>
            <button
              onClick={() => {
                setCurrentConvId(null);
                setMessages([]);
                router.push('/copilot');
              }}
              className="text-[10px] text-zinc-400 hover:text-white border border-zinc-850 px-2 py-0.5 rounded"
            >
              New Thread
            </button>
          </div>

          {/* Messages list area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
            {messages.length === 0 ? (
              <div className="text-center py-16 space-y-3 max-w-sm mx-auto text-zinc-550">
                <Brain className="w-10 h-10 text-zinc-700 mx-auto" />
                <p className="text-[11px] leading-relaxed">
                  Ask about match scores, resume improvements, or how to answer behavioral questions like teamwork and conflict. Pick a prompt below to start!
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isUser = msg.sender === 'USER';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[85%] rounded-xl p-3 border leading-relaxed ${
                      isUser
                        ? 'bg-primary/10 border-primary/20 text-white font-sans'
                        : 'bg-zinc-950/40 border-zinc-900 text-zinc-300 whitespace-pre-wrap'
                    }`}>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested follow-up helper buttons */}
          {messages.length === 0 && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 text-[9px] font-mono border-t border-zinc-900">
              {suggestedQuestions.map(q => (
                <button
                  key={q}
                  onClick={() => handleSendMessage(q)}
                  className="bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-900"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Chat input block */}
          <div className="p-3 border-t border-zinc-900 bg-zinc-950/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about match scores, resume tips, or behavioral questions (e.g. conflict with a teammate)..."
                disabled={isPending}
                className="bg-zinc-950 border border-zinc-850 text-xs text-white placeholder:text-zinc-700 rounded-lg p-2.5 flex-1 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isPending}
                className="p-2.5 bg-primary hover:bg-primary/95 text-white rounded-lg hover:cursor-pointer flex items-center justify-center shrink-0"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Recommendations + History Lists */}
        <div className="space-y-6">
          
          {/* Top Job Recommendations */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Matches Recommendations
            </h3>
            
            <div className="space-y-2">
              {matchingJobs.length === 0 ? (
                <p className="text-[10px] text-zinc-550 text-center py-4">No matching job records found.</p>
              ) : (
                matchingJobs.map((job, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded border border-zinc-900 bg-zinc-950/30 text-xs leading-normal">
                    <div>
                      <span className="font-bold text-zinc-200 block truncate max-w-[130px]">{job.title}</span>
                      <span className="text-[9px] text-primary font-semibold truncate">{job.companyName}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      {job.score}% Fit
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conversations History threads */}
          <div className="bg-[#111113] border border-zinc-850 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <History className="w-4 h-4 text-zinc-400" /> Saved Threads
            </h3>

            <div className="space-y-2">
              {conversations.length === 0 ? (
                <p className="text-[10px] text-zinc-550 text-center py-4">No conversations saved yet.</p>
              ) : (
                conversations.map(c => {
                  const isActive = currentConvId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setCurrentConvId(c.id);
                        router.push(`/copilot?convId=${c.id}`);
                      }}
                      className={`p-2.5 rounded border text-xs cursor-pointer block truncate transition-all ${
                        isActive
                          ? 'border-primary bg-primary/5 font-bold text-white'
                          : 'border-zinc-900 bg-zinc-950/30 text-zinc-400 hover:bg-zinc-950'
                      }`}
                      title={c.title}
                    >
                      {c.title}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
