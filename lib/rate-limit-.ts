//utility file
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

//4 req per hour per user's ip

export const rateLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(4,"1h"),
    //pf to keep redis db organised
    prefix: "@upstash/ratelimit/generate-interview",
});
