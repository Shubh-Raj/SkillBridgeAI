import { db } from "@/lib/db";
import { getRandomInterviewCover } from "@/lib/utils";
import { redis } from "@/lib/redis";


function toInterviewDTO(
  iv: Awaited<ReturnType<typeof db.interview.findMany>>[number] & {
    questions: { content: string; position: number }[];
  }
): Interview {
  return {
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
  };
}

export async function fetchInterviewsByUserId(
  userId: string,
  limitCount: number = 20,
  startAfterDate?: string
): Promise<Interview[]> {
  const isFirstPage = !startAfterDate;
  const cacheKey = `user:${userId}:interviews:page1`;

  if (isFirstPage) {
    const cachedData = await redis.get<Interview[]>(cacheKey);
    if (cachedData) {
      console.log("CACHE HIT: Returning fast data from Redis");
      return cachedData;
    }
  }

  console.log("CACHE MISS: Querying PostgreSQL...");
  const interviews = await db.interview.findMany({
    where: {
      userId,
      ...(startAfterDate && {
        createdAt: { lt: new Date(startAfterDate) },
      }),
    },
    orderBy: { createdAt: "desc" },
    take: limitCount,
    include: {
      questions: { orderBy: { position: "asc" } },
      feedback: { select: { totalScore: true } },
    },
  });

  const formattedInterviews = interviews.map(toInterviewDTO);

  if (isFirstPage) {
    await redis.set(cacheKey, formattedInterviews, { ex: 900 });
  }

  return formattedInterviews;
}

export async function fetchLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[]> {
  const { userId, limit = 20, startAfterDate } = params;

  const isFirstPage = !startAfterDate;
  const cacheKey = `user:${userId}:latest_interviews:page1`;

  if (isFirstPage) {
    const cachedData = await redis.get<Interview[]>(cacheKey);
    if (cachedData) {
      console.log("CACHE HIT: Returning fast data from Redis (latest)");
      return cachedData;
    }
  }

  console.log("CACHE MISS: Querying PostgreSQL (latest)...");
  const interviews = await db.interview.findMany({
    where: {
      finalized: true,
      userId,
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

  const formattedInterviews = interviews.map(toInterviewDTO);

  if (isFirstPage) {
    await redis.set(cacheKey, formattedInterviews, { ex: 900 });
  }

  return formattedInterviews;
}

export async function fetchInterviewById(
  id: string
): Promise<Interview | null> {
  const interview = await db.interview.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { position: "asc" } },
    },
  });

  if (!interview) return null;
  return toInterviewDTO(interview);
}

export async function createInterview(params: {
  role: string;
  type: string;
  level: string;
  techstack: string[];
  questions: string[];
  userId: string;
}): Promise<string> {
  const { role, type, level, techstack, questions, userId } = params;

  const interview = await db.interview.create({
    data: {
      role,
      type,
      level,
      techstack,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      userId,
      questions: {
        create: questions.map((content, position) => ({ content, position })),
      },
    },
  });

  await redis.del(`user:${userId}:interviews:page1`);
  await redis.del(`user:${userId}:latest_interviews:page1`);

  return interview.id;
}

export async function finalizeInterview(interviewId: string): Promise<void> {
  await db.interview.update({
    where: { id: interviewId },
    data: { finalized: true },
  });
}
