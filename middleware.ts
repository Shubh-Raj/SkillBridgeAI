//runs at Edge

import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { rateLimit } from "@/lib/rate-limit-";

export async function middleware(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    //vercel gives ip via this header
    const { success, limit, remaining, reset } = await rateLimit.limit(ip);
    //if exceeded then success is false
    if (!success) {
        return NextResponse.json({
            success: false,
            error: "Rate limit exceeded. You can only create 4 interviews per hour. Please try again later."
        },
            {
                status: 429, //in network tab
                headers: {
                    "X-RateLimit-Limit": limit.toString(),
                    "X-RateLimit-Remaining": remaining.toString(),
                    "X-RateLimit-Reset": reset.toString(),
                }
            });
    }
    //if pass, continue to api route
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());
    return response;
}

//middleware run on sepcific route only

export const config = {
  matcher: [
    "/api/vapi/generate",
  ],
};