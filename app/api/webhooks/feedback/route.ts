import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { processFeedbackJob } from "@/lib/services/feedback.service";
import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis";

async function handler(req: Request) {
  const body = await req.json();
  const { interviewId, transcript, userId } = body as {
    interviewId: string;
    transcript: { role: string; content: string }[];
    userId: string;
  };

  logger.info({ interviewId }, "Started processing background feedback job from QStash");

  try {
    // Process the feedback job (calls Gemini and saves to DB)
    await processFeedbackJob({ interviewId, transcript, userId });

    // Invalidate the cache because the feedback score has now been calculated
    await redis.del(`user:${userId}:interviews:page1`);
    await redis.del(`user:${userId}:latest_interviews:page1`);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error, interviewId }, "Background feedback job failed");
    return NextResponse.json({ error: "Job Failed" }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(handler);
