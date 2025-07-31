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

// ─── Interview Actions ────────────────────────────────────────────────────────
// These are Next.js Server Actions. They are intentionally thin —
// they exist only to expose service functions to the React component tree.
// No database calls, no business logic, no AI calls live here.

export async function getInterviewsByUserId(
  userId: string,
  limitCount?: number,
  startAfterDate?: string
): Promise<Interview[] | null> {
  try {
    return await fetchInterviewsByUserId(userId, limitCount, startAfterDate);
  } catch (e) {
    console.error("[getInterviewsByUserId]", e);
    return null;
  }
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  try {
    return await fetchLatestInterviews(params);
  } catch (e) {
    console.error("[getLatestInterviews]", e);
    return null;
  }
}

export async function getInterviewById(
  id: string
): Promise<Interview | null> {
  try {
    return await fetchInterviewById(id);
  } catch (e) {
    console.error("[getInterviewById]", e);
    return null;
  }
}

// ─── Feedback Actions ─────────────────────────────────────────────────────────

export async function createFeedback(
  params: CreateFeedbackParams
): Promise<{ success: boolean; feedbackId?: string }> {
  try {
    return await generateAndSaveFeedback(params);
  } catch (e) {
    console.error("[createFeedback]", e);
    return { success: false };
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  try {
    return await fetchFeedbackByInterviewId(params);
  } catch (e) {
    console.error("[getFeedbackByInterviewId]", e);
    return null;
  }
}