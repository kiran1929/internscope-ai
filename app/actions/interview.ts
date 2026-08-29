'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { AIQuestionService } from '@/lib/interview/ai-question-service';
import { AIEvalService } from '@/lib/interview/ai-eval-service';
import { interviewSummaryPipeline, runInterviewSummaryPipeline } from '@/trigger/interview';
import { INTERVIEW_LIMITS, isInterviewRateLimitExempt } from '@/lib/interview/constants';
import { revalidatePath } from 'next/cache';

export async function createInterviewSessionAction(params: {
  opportunityId?: string;
  sessionLength: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  categories: string[];
}) {
  try {
    const user = await getAuthenticatedUser();

    // 1. Check Daily Free Interview Rate Limit (Exempt Admin)
    const isAdmin = isInterviewRateLimitExempt(user.email);

    if (!isAdmin) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todaySessionCount = await prisma.interviewSession.count({
        where: {
          userId: user.id,
          createdAt: { gte: startOfDay },
        },
      });

      if (todaySessionCount >= INTERVIEW_LIMITS.maxFreeInterviewsPerDay) {
        throw new Error(`Daily limit reached: You can conduct up to ${INTERVIEW_LIMITS.maxFreeInterviewsPerDay} free AI interviews per day. Please return tomorrow!`);
      }
    }

    // 2. Fetch latest parsed resume for user
    const resume = await prisma.resume.findFirst({
      where: { userId: user.id, isParsed: true },
      orderBy: { version: 'desc' },
    });

    if (!resume) {
      throw new Error('Please upload and parse a resume first before starting interview practice sessions.');
    }

    // 3. Fetch target job details if provided
    let job = null;
    if (params.opportunityId && params.opportunityId !== 'general') {
      job = await prisma.opportunity.findUnique({
        where: { id: params.opportunityId },
        include: { company: true },
      });
    }

    // 4. Formulate session title
    const jobTitle = job ? `${job.title} at ${job.company.name}` : 'General Career Fit';
    const title = `Mock Interview - ${jobTitle} (${params.difficulty})`;

    const safeSessionLength = Math.min(
      Math.max(params.sessionLength || INTERVIEW_LIMITS.defaultQuestions, INTERVIEW_LIMITS.minQuestions),
      INTERVIEW_LIMITS.maxQuestions
    );

    // 5. Create Pending Session in DB
    const session = await prisma.interviewSession.create({
      data: {
        userId: user.id,
        opportunityId: job ? job.id : null,
        title,
        status: 'PENDING',
        sessionLength: safeSessionLength,
        difficulty: params.difficulty,
        categories: params.categories,
      },
    });

    // 6. Generate EXACTLY Question 1 using Planner + Router
    const generatedQuestions = await AIQuestionService.generate({
      resume: resume.structuredData,
      job: job ? { title: job.title, description: job.description, requirements: job.requirements, company: job.company } : undefined,
      difficulty: params.difficulty,
      categories: params.categories,
      userId: user.id,
      questionIndex: 0,
      totalSessionQuestions: safeSessionLength,
    });

    const q1 = generatedQuestions[0];

    // 7. Save ONLY Question 1 record
    await prisma.interviewQuestion.create({
      data: {
        sessionId: session.id,
        category: q1.category,
        text: q1.text,
        difficulty: q1.difficulty,
        sampleAnswer: q1.sampleAnswer,
        order: 1,
      },
    });

    // 8. Update Session status to IN_PROGRESS
    const updatedSession = await prisma.interviewSession.update({
      where: { id: session.id },
      data: { status: 'IN_PROGRESS' },
    });

    revalidatePath('/interview');
    revalidatePath(`/interview/${updatedSession.id}`);
    return { success: true, sessionId: updatedSession.id };
  } catch (error) {
    console.error('Failed to create mock interview session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function submitAnswerAction(params: {
  questionId: string;
  userAnswer: string;
}) {
  try {
    const user = await getAuthenticatedUser();
    const { questionId, userAnswer } = params;

    // 1. Sanitize & Length Check
    const trimmedAnswer = userAnswer.trim().slice(0, INTERVIEW_LIMITS.maxAnswerCharacters);
    if (!trimmedAnswer) {
      throw new Error('Answer cannot be empty');
    }

    // 2. Fetch question and check ownership
    const question = await prisma.interviewQuestion.findUnique({
      where: { id: questionId },
      include: {
        session: true,
        answer: true,
        evaluation: true,
      },
    });

    if (!question || question.session.userId !== user.id) {
      throw new Error('Question not found or unauthorized access');
    }

    // 3. Idempotency Check: If already answered and evaluated with exact same text, return existing
    if (question.answer && question.evaluation && question.answer.userAnswer === trimmedAnswer) {
      return {
        success: true,
        evaluationId: question.evaluation.id,
        allAnswered: question.order >= question.session.sessionLength,
      };
    }

    // 4. Save user answer
    await prisma.interviewAnswer.upsert({
      where: { questionId },
      create: {
        questionId,
        userAnswer: trimmedAnswer,
      },
      update: {
        userAnswer: trimmedAnswer,
      },
    });

    // 5. Evaluate answer inline using AI Evaluator
    const evalResult = await AIEvalService.evaluate({
      questionText: question.text,
      sampleAnswer: question.sampleAnswer || 'A structured answer detailing situations, actions taken, and final outcomes.',
      userAnswer: trimmedAnswer,
      category: question.category,
      difficulty: question.difficulty,
    });

    const data = evalResult.structuredData;

    // 6. Save evaluation to DB
    const evaluation = await prisma.interviewEvaluation.upsert({
      where: { questionId },
      create: {
        questionId,
        score: data.score,
        technicalAccuracy: data.technicalAccuracy,
        communication: data.communication,
        completeness: data.completeness,
        problemSolving: data.problemSolving,
        confidence: data.confidence,
        structure: data.structure,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        improvedAnswer: data.improvedAnswer,
        starMethodFollowed: data.starMethodFollowed,
        starSituation: data.starSituation,
        starTask: data.starTask,
        starAction: data.starAction,
        starResult: data.starResult,
        starCoachingFeedback: data.starCoachingFeedback,
        provider: evalResult.provider,
        model: evalResult.model,
        tokensUsed: evalResult.tokensUsed,
        latencyMs: evalResult.latencyMs,
      },
      update: {
        score: data.score,
        technicalAccuracy: data.technicalAccuracy,
        communication: data.communication,
        completeness: data.completeness,
        problemSolving: data.problemSolving,
        confidence: data.confidence,
        structure: data.structure,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        improvedAnswer: data.improvedAnswer,
        starMethodFollowed: data.starMethodFollowed,
        starSituation: data.starSituation,
        starTask: data.starTask,
        starAction: data.starAction,
        starResult: data.starResult,
        starCoachingFeedback: data.starCoachingFeedback,
        provider: evalResult.provider,
        model: evalResult.model,
        tokensUsed: evalResult.tokensUsed,
        latencyMs: evalResult.latencyMs,
      },
    });

    // 7. Check if we need to plan & generate next question
    const allSessionQuestions = await prisma.interviewQuestion.findMany({
      where: { sessionId: question.sessionId },
      include: { answer: true, evaluation: true },
      orderBy: { order: 'asc' },
    });

    const answeredCount = allSessionQuestions.filter((q) => q.answer !== null).length;
    let allAnswered = false;

    if (answeredCount < question.session.sessionLength) {
      // Check if next question was already generated
      const existingNextQuestion = allSessionQuestions.find((q) => q.order === question.order + 1);

      if (!existingNextQuestion) {
        const resume = await prisma.resume.findFirst({
          where: { userId: user.id, isParsed: true },
          orderBy: { version: 'desc' },
        });

        let job = null;
        if (question.session.opportunityId) {
          job = await prisma.opportunity.findUnique({
            where: { id: question.session.opportunityId },
            include: { company: true },
          });
        }

        // Collect all previous question texts and categories/topics/project mentions tested so far
        const recentQuestions = allSessionQuestions.map((q) => q.text);
        const testedSkills = allSessionQuestions.flatMap((q) => {
          const items = [q.category];
          // Also extract any quoted project titles or capitalized technology words from previous question texts
          const quotes = q.text.match(/"([^"]+)"/g);
          if (quotes) {
            quotes.forEach(qt => items.push(qt.replace(/"/g, '')));
          }
          return items;
        });

        const nextQuestionPayload = await AIQuestionService.generateFollowUp({
          resume: resume?.structuredData,
          job: job ? { title: job.title, description: job.description, requirements: job.requirements, company: job.company } : undefined,
          difficulty: question.session.difficulty,
          categories: question.session.categories,
          category: question.category,
          previousQuestion: question.text,
          recentQuestions,
          userAnswer: trimmedAnswer,
          userId: user.id,
          questionIndex: question.order,
          totalSessionQuestions: question.session.sessionLength,
          previousEvaluation: {
            score: data.score,
            strengths: data.strengths,
            weaknesses: data.weaknesses,
            missingConcepts: data.missingConcepts,
          },
          testedSkillsInSession: testedSkills,
        });

        await prisma.interviewQuestion.create({
          data: {
            sessionId: question.sessionId,
            category: nextQuestionPayload.category,
            text: nextQuestionPayload.text,
            difficulty: nextQuestionPayload.difficulty,
            sampleAnswer: nextQuestionPayload.sampleAnswer,
            order: question.order + 1,
          },
        });
      }
    } else {
      allAnswered = true;
      try {
        await interviewSummaryPipeline.trigger({
          sessionId: question.sessionId,
        });
      } catch (triggerError) {
        console.warn('Trigger.dev summary pipeline dispatch failed, running inline:', triggerError);
        await runInterviewSummaryPipeline({
          sessionId: question.sessionId,
        });
      }
    }

    revalidatePath(`/interview/${question.sessionId}`);
    return { success: true, evaluationId: evaluation.id, allAnswered };
  } catch (error) {
    console.error('Failed to submit interview answer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
