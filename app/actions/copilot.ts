'use server';

import { getAuthenticatedUser } from './candidate';
import { prisma } from '@/lib/db';
import { ContextBuilder } from '@/lib/copilot/context-builder';
import { AIOrchestrator } from '@/lib/copilot/ai-orchestrator';
import { buildCopilotSystemPrompt } from '@/lib/copilot/prompts';
import { runWeeklyReportPipeline } from '@/trigger/copilot';
import { revalidatePath } from 'next/cache';

export async function askCopilotAction(params: {
  conversationId: string | null;
  messageContent: string;
}) {
  try {
    const user = await getAuthenticatedUser();
    const { conversationId, messageContent } = params;

    // 1. Find or create conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.copilotConversation.create({
        data: {
          userId: user.id,
          title: messageContent.slice(0, 40) + '...',
        },
      });
      convId = conv.id;
    } else {
      // Verify ownership
      const existingConv = await prisma.copilotConversation.findUnique({
        where: { id: convId },
      });
      if (!existingConv || existingConv.userId !== user.id) {
        throw new Error('Conversation not found or unauthorized');
      }
    }

    // 2. Fetch past conversation message history
    const pastMessages = await prisma.copilotMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
    });

    const chatHistory = pastMessages.map(msg => ({
      role: (msg.sender === 'USER' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: msg.content }],
    }));

    // 3. Build candidate context
    const context = await ContextBuilder.buildContext(user.id);

    // Save user message in DB
    await prisma.copilotMessage.create({
      data: {
        conversationId: convId,
        sender: 'USER',
        content: messageContent,
      },
    });

    // 4. Assemble system prompt
    const systemPrompt = buildCopilotSystemPrompt(context.contextString);

    // 5. Query the AI Orchestrator
    const aiResult = await AIOrchestrator.generate({
      systemInstruction: systemPrompt,
      prompt: messageContent,
      chatHistory,
    });

    // 6. Save assistant message response in DB
    const assistantMsg = await prisma.copilotMessage.create({
      data: {
        conversationId: convId,
        sender: 'ASSISTANT',
        content: aiResult.text,
        provider: aiResult.provider,
        model: aiResult.model,
        latencyMs: aiResult.latencyMs,
        tokensUsed: aiResult.tokensUsed,
        estimatedCost: aiResult.estimatedCost,
        contextSize: context.contextSize,
      },
    });

    revalidatePath('/copilot');
    return {
      success: true,
      conversationId: convId,
      message: {
        id: assistantMsg.id,
        sender: assistantMsg.sender,
        content: assistantMsg.content,
        createdAt: assistantMsg.createdAt,
      },
    };
  } catch (error) {
    console.error('Copilot chat error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function createCareerGoalAction(params: {
  title: string;
  targetDateStr?: string;
}) {
  try {
    const user = await getAuthenticatedUser();

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });
    const candidateSkills = profile?.skills || [];
    const titleLower = params.title.toLowerCase();

    // Map targets skills based on target goals
    const targetSkills: string[] = [];
    if (titleLower.includes('backend')) {
      targetSkills.push('Node.js', 'PostgreSQL', 'Docker', 'GraphQL', 'Prisma', 'Redis');
    } else if (titleLower.includes('frontend')) {
      targetSkills.push('React', 'TypeScript', 'Next.js', 'TailwindCSS', 'CSS');
    } else {
      targetSkills.push('TypeScript', 'Node.js', 'Git', 'Docker');
    }

    const missingSkills = targetSkills.filter(
      s => !candidateSkills.some(cs => cs.toLowerCase() === s.toLowerCase())
    );

    const matchingCount = targetSkills.length - missingSkills.length;
    const progress = targetSkills.length > 0 ? (matchingCount / targetSkills.length) * 100 : 50.0;

    const goal = await prisma.careerGoal.create({
      data: {
        userId: user.id,
        title: params.title,
        status: 'IN_PROGRESS',
        progress,
        missingSkills,
        targetDate: params.targetDateStr ? new Date(params.targetDateStr) : null,
      },
    });

    // Log action trigger
    await prisma.aIActionLog.create({
      data: {
        userId: user.id,
        actionType: 'CREATE_ROADMAP',
        status: 'SUCCESS',
        metadata: { goalId: goal.id },
      },
    });

    revalidatePath('/copilot');
    return { success: true, goalId: goal.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function updateGoalProgressAction(goalId: string, progress: number) {
  try {
    const user = await getAuthenticatedUser();
    
    await prisma.careerGoal.update({
      where: { id: goalId, userId: user.id },
      data: { progress },
    });

    revalidatePath('/copilot');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function deleteGoalAction(goalId: string) {
  try {
    const user = await getAuthenticatedUser();

    await prisma.careerGoal.delete({
      where: { id: goalId, userId: user.id },
    });

    revalidatePath('/copilot');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function triggerAIActionEngine(params: {
  actionType: 'GENERATE_INTERVIEW_PLAN' | 'GENERATE_COVER_LETTER' | 'RECALCULATE_ATS' | 'REFRESH_CAREER';
  metadata?: any;
}) {
  try {
    const user = await getAuthenticatedUser();

    // Log the action log attempt
    const actionLog = await prisma.aIActionLog.create({
      data: {
        userId: user.id,
        actionType: params.actionType,
        status: 'PENDING',
      },
    });

    // Invocations of existing platform actions
    let actionSuccess = true;
    
    try {
      if (params.actionType === 'REFRESH_CAREER') {
        // Mock success
      }
      
      await prisma.aIActionLog.update({
        where: { id: actionLog.id },
        data: { status: 'SUCCESS' },
      });
    } catch {
      actionSuccess = false;
      await prisma.aIActionLog.update({
        where: { id: actionLog.id },
        data: { status: 'FAILED' },
      });
    }

    revalidatePath('/copilot');
    return { success: actionSuccess };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function generateWeeklyReportManualAction() {
  try {
    const user = await getAuthenticatedUser();
    
    const res = await runWeeklyReportPipeline({ userId: user.id });
    
    revalidatePath('/copilot');
    return { success: true, reportId: res.reportId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
