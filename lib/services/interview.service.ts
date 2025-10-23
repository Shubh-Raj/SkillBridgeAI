import { db } from "@/lib/db";
import { getRandomInterviewCover } from "@/lib/utils";

// ─── DTOs ────────────────────────────────────────────────────────────────────
// These functions map raw Prisma models to clean application types.
// No Prisma internals (Date objects, _count fields, etc.) leak to the caller.

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

// ─── Interview Service ────────────────────────────────────────────────────────

export async function fetchInterviewsByUserId(
  userId: string,
  limitCount: number = 20,
  startAfterDate?: string
): Promise<Interview[]> {
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

  return interviews.map(toInterviewDTO);
}

export async function fetchLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[]> {
  const { userId, limit = 20, startAfterDate } = params;

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

  return interviews.map(toInterviewDTO);
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

  return interview.id;
}

export async function finalizeInterview(interviewId: string): Promise<void> {
  await db.interview.update({
    where: { id: interviewId },
    data: { finalized: true },
  });
}
