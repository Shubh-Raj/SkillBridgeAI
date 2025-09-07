import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createInterview } from "@/lib/services/interview.service";
import { logger } from "@/lib/logger";

export async function GET() {
  return Response.json({ success: true, data: "THANK YOU!" }, { status: 200 });
}

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid, questions: providedQuestions } =
    await request.json();

  try {
    let questions: string[];
    const startTime = performance.now();

    if (providedQuestions?.length > 0) {
      questions = providedQuestions;
    } else {
      const { text: questionsText } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: `Prepare questions for a job interview.
                The job role is ${role}.
                The job experience level is ${level}.
                The tech stack used in the job is: ${techstack}.
                The focus between behavioural and technical questions should lean towards: ${type}.
                The amount of questions required is: ${amount}.
                Please return only the questions, without any additional text.
                The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
                Return the questions formatted like this:
                ["Question 1", "Question 2", "Question 3"]
            `,
      });

      try {
        questions = JSON.parse(questionsText);
      } catch {
        const cleaned = questionsText.replace(/^\s*\[|\]\s*$/g, "").trim();
        questions = cleaned
          .split('","')
          .map((q) => q.replace(/^"|"$/g, "").trim());
      }
    }

    const durationMs = Math.round(performance.now() - startTime);
    logger.info({ userId: userid, role, durationMs }, "Generated interview questions successfully");

    const techstackArray = Array.isArray(techstack)
      ? techstack
      : techstack.split(",").map((t: string) => t.trim());

    await createInterview({
      role,
      type,
      level,
      techstack: techstackArray,
      questions,
      userId: userid,
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    logger.error({ err: error, userId: userid }, "[POST /api/vapi/generate] Failed to generate or save interview");
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}