'use server';

import { db } from "@/lib/db";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { feedbackSchema } from "@/constants";

export async function getInterviewsByUserId(
  userId: string,
  limitCount: number = 20,
  startAfterDate?: string
): Promise<Interview[] | null> {
  const interviews = await db.interview.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limitCount,
    ...(startAfterDate && {
      cursor: undefined,
      where: {
        userId,
        createdAt: { lt: new Date(startAfterDate) },
      },
    }),
    include: {
      questions: { orderBy: { position: "asc" } },
      feedback: { select: { totalScore: true } },
    },
  });

  return interviews.map((iv) => ({
    id: iv.id,
    role: iv.role,
    level: iv.level,
    type: iv.type,
    techstack: iv.techstack,
    finalized: iv.finalized,
    coverImage: iv.coverImage ?? undefined,
    userId: iv.userId,
    createdAt: iv.createdAt.toISOString(),
    questions: iv.questions.map((q) => q.content),
  }));
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20, startAfterDate } = params;

  const interviews = await db.interview.findMany({
    where: {
      finalized: true,
      NOT: { userId },
      ...(startAfterDate && {
        createdAt: { lt: new Date(startAfterDate) },
      }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      questions: { orderBy: { position: "asc" } },
    },
  });

  return interviews.map((iv) => ({
    id: iv.id,
    role: iv.role,
    level: iv.level,
    type: iv.type,
    techstack: iv.techstack,
    finalized: iv.finalized,
    coverImage: iv.coverImage ?? undefined,
    userId: iv.userId,
    createdAt: iv.createdAt.toISOString(),
    questions: iv.questions.map((q) => q.content),
  }));
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.interview.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { position: "asc" } },
    },
  });

  if (!interview) return null;

  return {
    id: interview.id,
    role: interview.role,
    level: interview.level,
    type: interview.type,
    techstack: interview.techstack,
    finalized: interview.finalized,
    coverImage: interview.coverImage ?? undefined,
    userId: interview.userId,
    createdAt: interview.createdAt.toISOString(),
    questions: interview.questions.map((q) => q.content),
  };
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    const {
      object: {
        totalScore,
        categoryScores,
        strengths,
        areasForImprovement,
        finalAssessment,
      },
    } = await generateObject({
      model: google("gemini-2.5-flash", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
      Transcript:
      ${formattedTranscript}

      Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
      - **Communication Skills**: Clarity, articulation, structured responses.
      - **Technical Knowledge**: Understanding of key concepts for the role.
      - **Problem-Solving**: Ability to analyze problems and propose solutions.
      - **Cultural & Role Fit**: Alignment with company values and job role.
      - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
      `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const feedback = await db.feedback.create({
      data: {
        interviewId,
        totalScore,
        strengths,
        areasForImprovement,
        finalAssessment,
        categoryScores: {
          create: categoryScores.map((cs) => ({
            name: cs.name,
            score: cs.score,
            comment: cs.comment,
          })),
        },
      },
    });

    // Mark interview as finalized
    await db.interview.update({
      where: { id: interviewId },
      data: { finalized: true },
    });

    return { success: true, feedbackId: feedback.id };
  } catch (e) {
    console.error("Error saving feedback", e);
    return { success: false };
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId } = params;

  const feedback = await db.feedback.findUnique({
    where: { interviewId },
    include: {
      categoryScores: true,
    },
  });

  if (!feedback) return null;

  return {
    id: feedback.id,
    interviewId: feedback.interviewId,
    totalScore: feedback.totalScore,
    strengths: feedback.strengths,
    areasForImprovement: feedback.areasForImprovement,
    finalAssessment: feedback.finalAssessment,
    createdAt: feedback.createdAt.toISOString(),
    categoryScores: feedback.categoryScores.map((cs) => ({
      name: cs.name,
      score: cs.score,
      comment: cs.comment,
    })),
  };
}