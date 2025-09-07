'use server';

import {
  fetchInterviewsByUserId,
  fetchLatestInterviews,
  fetchInterviewById,
} from "@/lib/services/interview.service";
import {
  generateAndSaveFeedback,
  fetchFeedbackByInterviewId,
} from "@/lib/services/feedback.service";
import { logger } from "@/lib/logger";

export async function getInterviewsByUserId(
  userId: string,
  limitCount?: number,
  startAfterDate?: string
): Promise<Interview[] | null> {
  try {
    return await fetchInterviewsByUserId(userId, limitCount, startAfterDate);
  } catch (e) {
    logger.error({ err: e, userId }, "[getInterviewsByUserId]");
    return null;
  }
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  try {
    return await fetchLatestInterviews(params);
  } catch (e) {
    logger.error({ err: e, params }, "[getLatestInterviews]");
    return null;
  }
}

export async function getInterviewById(
  id: string
): Promise<Interview | null> {
  try {
    return await fetchInterviewById(id);
  } catch (e) {
    logger.error({ err: e, id }, "[getInterviewById]");
    return null;
  }
}

export async function createFeedback(
  params: CreateFeedbackParams
): Promise<{ success: boolean; feedbackId?: string }> {
  try {
    return await generateAndSaveFeedback(params);
  } catch (e) {
    logger.error({ err: e, params }, "[createFeedback]");
    return { success: false };
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  try {
    return await fetchFeedbackByInterviewId(params);
  } catch (e) {
    logger.error({ err: e, params }, "[getFeedbackByInterviewId]");
    return null;
  }
}