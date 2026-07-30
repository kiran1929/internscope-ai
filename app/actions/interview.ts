'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { AIQuestionService } from '@/lib/interview/ai-question-service';
import { AIEvalService } from '@/lib/interview/ai-eval-service';
import { interviewSummaryPipeline, runInterviewSummaryPipeline } from '@/trigger/interview';
import { revalidatePath } from 'next/cache';

export async function createInterviewSessionAction(params: {
  opportunityId?: string;
  sessionLength: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  categories: string[];
}) {
  try {
    const user = await getAuthenticatedUser();

    // 1. Fetch latest parsed resume for user
    const resume = await prisma.resume.findFirst({
      where: { userId: user.id, isParsed: true },
      orderBy: { version: 'desc' },
    });

    if (!resume) {
      throw new Error('Please upload and parse a resume first before starting interview practice sessions.');
    }

    // 2. Fetch target job details if provided
    let job = null;
    if (params.opportunityId) {
      job = await prisma.opportunity.findUnique({
        where: { id: params.opportunityId },
        include: { company: true },
      });
    }

    // 3. Formulate session title
    const jobTitle = job ? `${job.title} at ${job.company.name}` : 'General Career Fit';
    const title = `Mock Interview - ${jobTitle} (${params.difficulty})`;

    // 4. Create Pending Session in DB
    const session = await prisma.interviewSession.create({
      data: {
        userId: user.id,
        opportunityId: params.opportunityId || null,
        title,
        status: 'PENDING',
        sessionLength: params.sessionLength,
        difficulty: params.difficulty,
        categories: params.categories,
      },
    });

    // 5. Generate Questions tailored to target job + resume
    const generatedQuestions = await AIQuestionService.generate({
      resume: resume.structuredData,
      job: job ? { title: job.title, description: job.description, requirements: job.requirements } : undefined,
      difficulty: params.difficulty,
      categories: params.categories,
      count: params.sessionLength,
    });

    // 6. Bulk create question records
    const questionPromises = generatedQuestions.map((q, idx) =>
      prisma.interviewQuestion.create({
        data: {
          sessionId: session.id,
          category: q.category,
          text: q.text,
          difficulty: q.difficulty,
          sampleAnswer: q.sampleAnswer,
          order: idx + 1,
        },
      })
    );

    await Promise.all(questionPromises);

    // 7. Update Session status to IN_PROGRESS
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

    // 1. Fetch question and check ownership
    const question = await prisma.interviewQuestion.findUnique({
      where: { id: questionId },
      include: {
        session: true,
      },
    });

    if (!question || question.session.userId !== user.id) {
      throw new Error('Question not found or unauthorized access');
    }

    // 2. Save user answer
    const answer = await prisma.interviewAnswer.upsert({
      where: { questionId },
      create: {
        questionId,
        userAnswer,
      },
      update: {
        userAnswer,
      },
    });

    // 3. Evaluate answer inline using AI Evaluator
    const evalResult = await AIEvalService.evaluate({
      questionText: question.text,
      sampleAnswer: question.sampleAnswer || 'A structured answer detailing situations, actions taken, and final outcomes.',
      userAnswer,
      category: question.category,
    });

    const data = evalResult.structuredData;

    // 4. Save evaluation to DB
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

    // 5. Check if all questions in session are answered
    const allSessionQuestions = await prisma.interviewQuestion.findMany({
      where: { sessionId: question.sessionId },
      include: { answer: true },
    });

    const allAnswered = allSessionQuestions.every(q => q.answer !== null);

    if (allAnswered) {
      // Trigger summary and readiness update pipeline
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
