import {generateText} from "ai";
import {google} from "@ai-sdk/google";
import {getRandomInterviewCover} from "@/lib/utils";
import {db} from "@/firebase/admin";

export async function GET() {
    return Response.json({ success: true, data: 'THANK YOU!'}, { status: 200 });
}

export async function POST(request: Request) {
    const { type, role, level, techstack, amount, userid, questions: providedQuestions } = await request.json();

    try {
        let questions;

        // If questions are provided from the conversation, use those
        if (providedQuestions && Array.isArray(providedQuestions) && providedQuestions.length > 0) {
            questions = providedQuestions;
            console.log("Using provided questions:", questions);
        } else {
            // Otherwise generate questions using AI
            console.log("Generating questions using AI");
            const { text: questionsText } = await generateText({
                model: google("gemini-2.0-flash-001"),
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
                
                Thank you! <3
            `,
            });

            try {
                questions = JSON.parse(questionsText);
            } catch (e) {
                console.error("Failed to parse generated questions, using as text:", e);
                // If parsing fails, try to clean up the text and make it into an array
                const cleaned = questionsText.replace(/^\s*\[|\]\s*$/g, '').trim();
                questions = cleaned.split('","').map(q => q.replace(/^"|"$/g, '').trim());
            }
        }

        const interview = {
            role, 
            type, 
            level,
            techstack: Array.isArray(techstack) ? techstack : techstack.split(','),
            questions: questions,
            userId: userid,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString()
        }

        await db.collection("interviews").add(interview);

        return Response.json({ success: true}, {status: 200})
    } catch (error) {
        console.error("Error in /api/vapi/generate:", error);
        return Response.json({ success: false, error: String(error) }, { status: 500 });
    }
}