import { db } from "@/lib/db";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { feedbackSchema } from "@/constants";
import { finalizeInterview } from "./interview.service";
import { logger } from "@/lib/logger";
import {Client} from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

export async function publishFeedbackJob(params: CreateFeedbackParams) {
  const { interviewId, transcript, userId } = params;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    const res = await qstash.publishJSON({
      url: `${baseUrl}/api/webhooks/feedback`,
      body: {
        interviewId,
        transcript,
        userId,
      },
    });

    logger.info({ messageId: res.messageId, interviewId }, "Queued feedback job to QStash");
    return { success: true, messageId: res.messageId };
  } catch (error) {
    logger.error({ err: error, interviewId }, "Failed to enqueue feedback job");
    throw error;
  }
}

export async function processFeedbackJob(
  params: CreateFeedbackParams
): Promise<{ success: true; feedbackId: string } | { success: false }> {
  const { interviewId, transcript } = params;

  const formattedTranscript = transcript
    .map((s) => `- ${s.role}: ${s.content}\n`)
    .join("");

  const startTime = performance.now();

  const { object: aiResult } = await generateObject({
    model: google("gemini-2.5-flash", { structuredOutputs: false }),
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

  const durationMs = Math.round(performance.now() - startTime);
  logger.info({ interviewId, durationMs }, "Successfully generated AI feedback");

  const feedback = await db.feedback.create({
    data: {
      interviewId,
      totalScore: aiResult.totalScore,
      strengths: aiResult.strengths,
      areasForImprovement: aiResult.areasForImprovement,
      finalAssessment: aiResult.finalAssessment,
      categoryScores: {
        create: aiResult.categoryScores.map((cs) => ({
          name: cs.name,
          score: cs.score,
          comment: cs.comment,
        })),
      },
    },
  });

  await finalizeInterview(interviewId);

  return { success: true, feedbackId: feedback.id };
}

export async function fetchFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId } = params;

  const feedback = await db.feedback.findUnique({
    where: { interviewId },
    include: { categoryScores: true },
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
