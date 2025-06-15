'use client';

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { vapi } from '@/lib/vapi.sdk';
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
}

interface SavedMessage {
    role: 'user' | 'system' | 'assistant';
    content: string;
}

const Agent = ({ userName, userId, type, interviewId, questions }: AgentProps) => {
    const router = useRouter();
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [isCreatingInterview, setIsCreatingInterview] = useState(false);

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
        const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

        const onMessage = (message: Message) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                const newMessage = { role: message.role, content: message.transcript }

                setMessages((prev) => [...prev, newMessage]);
            }
        }

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);

        const onError = (error: Error) => console.log('Error', error);

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('error', onError);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
            vapi.off('error', onError)
        }
    }, [])

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
        console.log('Generate feedback here.');

        const { success, feedbackId: id } = await createFeedback({
            interviewId: interviewId!,
            userId: userId!,
            transcript: messages
        })

        if (success && id) {
            router.push(`/interview/${interviewId}/feedback`);
        } else {
            console.log('Error saving feedback');
            router.push('/');
        }
    }

    const extractInterviewDetails = (messages: SavedMessage[]) => {
        const assistantMessages = messages.filter(msg => msg.role === 'assistant');
        let extractedQuestions: string[] = [];
        let role = 'Software Developer';
        let level = 'Junior';
        let type = 'Technical';
        let techstack = ['JavaScript', 'React'];
        
        for (const msg of assistantMessages) {
            const content = msg.content;
            
            const roleMatch = content.match(/(?:role|position)(?:\s+is)?(?:\s*:)?\s*([\w\s-]+Developer|[\w\s-]+Engineer|[\w\s-]+Designer|[\w\s-]+Manager)/i);
            if (roleMatch) role = roleMatch[1].trim();
            
            const levelMatch = content.match(/(?:level|experience)(?:\s+is)?(?:\s*:)?\s*(Junior|Mid|Senior|Lead|Principal)/i);
            if (levelMatch) level = levelMatch[1].trim();
            
            const typeMatch = content.match(/(?:focus|type)(?:\s+is)?(?:\s*:)?\s*(Technical|Behavioral|Mixed)/i);
            if (typeMatch) type = typeMatch[1].trim();
            
            const techMatch = content.match(/(?:tech stack|technologies|skills)(?:\s+include)?(?:\s*:)?\s*([\w\s,.]+)/i);
            if (techMatch) {
                techstack = techMatch[1].split(/[,.]/).map(item => item.trim()).filter(Boolean);
            }
            
            const arrayMatch = content.match(/\[([^\]]+)\]/);
            if (arrayMatch) {
                try {
                    const array = JSON.parse(`[${arrayMatch[1]}]`);
                    if (Array.isArray(array) && array.every(item => typeof item === 'string')) {
                        extractedQuestions = array;
                        continue;
                    }
                } catch (e) {
                    // If JSON parsing fails, try other methods
                }
            }
            
            // Look for numbered questions (1. Question)
            const numberedQuestions = content.match(/\d+\.\s*(.*?)(?=\d+\.|$)/g);
            if (numberedQuestions && numberedQuestions.length > 0) {
                extractedQuestions = numberedQuestions.map(q => 
                    q.replace(/^\d+\.\s*/, '').trim()
                ).filter(Boolean);
                continue;
            }
            
            // Look for bullet point questions (- Question or • Question)
            const bulletQuestions = content.match(/[-•]\s*(.*?)(?=[-•]|$)/g);
            if (bulletQuestions && bulletQuestions.length > 0) {
                extractedQuestions = bulletQuestions.map(q => 
                    q.replace(/^[-•]\s*/, '').trim()
                ).filter(Boolean);
                continue;
            }
        }

        // If no questions found, extract potential questions
        if (extractedQuestions.length === 0) {
            extractedQuestions = assistantMessages
                .filter(msg => msg.content.includes('?'))
                .flatMap(msg => 
                    msg.content.split('?')
                        .map(q => q.trim() + '?')
                        .filter(q => q.length > 5 && q !== '?')
                );
        }

        return {
            questions: extractedQuestions,
            role,
            level,
            type,
            techstack: techstack.filter(Boolean)
        };
    }

    const createInterviewFromConversation = async (messages: SavedMessage[]) => {
        if (!userId) {
            console.error("User ID is required to create an interview");
            return false;
        }

        try {
            setIsCreatingInterview(true);
            
            const interviewDetails = extractInterviewDetails(messages);
            console.log("Extracted interview details:", interviewDetails);
            
            // Make sure we have at least some questions
            if (interviewDetails.questions.length === 0) {
                console.error("No questions extracted from the conversation");
                return false;
            }
            
            // Post to API to create interview
            const response = await fetch('/api/vapi/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userid: userId,
                    questions: interviewDetails.questions,
                    role: interviewDetails.role,
                    level: interviewDetails.level,
                    type: interviewDetails.type,
                    techstack: interviewDetails.techstack.join(','),
                    amount: interviewDetails.questions.length
                }),
            });
            
            const result = await response.json();
            
            return result.success;
        } catch (error) {
            console.error("Error creating interview:", error);
            return false;
        } finally {
            setIsCreatingInterview(false);
        }
    }

    useEffect(() => {
        if (callStatus === CallStatus.FINISHED) {
            if (type === 'generate') {
                createInterviewFromConversation(messages)
                    .then(success => {
                        if (success) {
                            console.log("Interview created successfully");
                        } else {
                            console.error("Failed to create interview");
                        }
                        router.push('/');
                    });
            } else {
                handleGenerateFeedback(messages);
            }
        }
    }, [messages, callStatus, type, userId]);

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);

        try {
            if (type === "generate") {
                // For generator, use the workflow ID directly
                await vapi.start(
                    undefined, // No assistant 
                    undefined, // No assistant overrides
                    undefined, // No squad
                    process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID // Workflow ID
                );
            } else {
                let formattedQuestions = "";
                if (questions) {
                    formattedQuestions = questions
                        .map((question) => `- ${question}`)
                        .join("\n");
                }

                // For interviewer, use the assistant definition with variable values
                const assistantOverrides = {
                    variableValues: {
                        questions: formattedQuestions,
                    },
                } as any; // Type assertion to bypass strict type checking

                await vapi.start(
                    interviewer, // Use the interviewer assistant
                    assistantOverrides
                );
            }
        } catch (error) {
            console.error("Error starting call:", error);
            setCallStatus(CallStatus.INACTIVE);
        }
    };

    const handleDisconnect = () => {
        setCallStatus(CallStatus.FINISHED);
        vapi.stop();
    };

    const latestMessage = messages[messages.length - 1]?.content;
    const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

    return (
        <>
            <div className="call-view">
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image src="/ai-avatar.png" alt="vapi" width={65} height={54} className="object-cover" />
                        {isSpeaking && <span className="animate-speak" />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                <div className="card-border">
                    <div className="card-content">
                        <Image src="/user-avatar.png" alt="user avatar" width={540} height={540} className="rounded-full object-cover size-[120px]" />
                        <h3>{userName}</h3>
                    </div>
                </div>
            </div>
            {messages.length > 0 && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p key={latestMessage} className={cn('transition-opacity duration-500 opacity-0', 'animate-fadeIn opacity-100')}>
                            {latestMessage}
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full flex justify-center">
                {callStatus !== 'ACTIVE' ? (
                    <button 
                        className="relative btn-call" 
                        onClick={handleCall}
                        disabled={isCreatingInterview}
                    >
                        <span className={cn('absolute animate-ping rounded-full opacity-75', 
                            callStatus !== 'CONNECTING' && !isCreatingInterview && 'hidden')}
                        />

                        <span>
                            {isCallInactiveOrFinished ? 
                                (isCreatingInterview ? 'Creating Interview...' : 'Call') : 
                                '. . .'}
                        </span>
                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={handleDisconnect}>
                        End
                    </button>
                )}
            </div>
        </>
    )
}
export default Agent