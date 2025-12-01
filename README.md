# SkillBridge

**SkillBridge** is a production-grade, AI-driven mock interview SaaS. It features real-time voice interviews, end-to-end AI feedback pipelines, and track your progress—all in one sleek and user-friendly web app.

---

## Table of Contents
* [Introduction](#introduction)
* [Tech Stack](#tech-stack)
* [System Architecture](#system-architecture)
* [Folder Structure](#folder-structure)
* [Engineering Highlights](#engineering-highlights)
* [Project Setup & Quick Start](#project-setup--quick-start)
* [Environment Variables](#environment-variables)
* [Author](#author)

---

## Introduction
SkillBridge enables candidates to practice technical interviews using conversational AI. Beyond just a wrapper, it implements true enterprise-grade backend patterns: asynchronous message queues, sliding window rate limiters, layered service architecture, and robust caching mechanisms.

---

## Tech Stack
* **Framework:** Next.js 14+ (App Router)
* **Language:** TypeScript
* **Database:** PostgreSQL (Supabase) + Prisma ORM + PgBouncer (Transaction Pooling)
* **Auth:** Firebase Session-Based Authentication (Secure httpOnly Cookies)
* **Caching & Rate Limiting:** Upstash Redis
* **Message Queue:** Upstash QStash (Serverless Event-Driven Workers)
* **AI & Voice:** Google Gemini (Feedback Generation) + Vapi (Voice Conversational AI)
* **Observability:** Pino (Structured Logging) + Sentry (Error Tracking)
* **Styling:** Tailwind CSS + shadcn/ui

---

## System Architecture

### 1. High-Level Architecture
```mermaid
graph TD
    Client[Client Browser] -->|HTTP/REST| NextJS[Next.js App Router]
    NextJS -->|Server Actions| ServiceLayer[Service Layer]
    ServiceLayer -->|Transaction Pooling| PgBouncer[PgBouncer]
    PgBouncer --> DB[(PostgreSQL)]
    ServiceLayer -->|JWT Verification| FirebaseAuth[Firebase Auth]
    ServiceLayer -->|Logging| Sentry[Sentry & Pino]
```

### 2. Main Interview Flow
The real-time interaction between the user, the Vapi conversational AI, and the backend tracking system.
```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Client
    participant Vapi as Vapi Voice AI
    participant Action as Server Action
    participant DB as PostgreSQL

    User->>Frontend: Start Mock Interview
    Frontend->>Action: createInterview(role, techstack)
    Action->>DB: Save Interview State
    Action-->>Frontend: Interview ID
    Frontend->>Vapi: Initialize Voice Session
    Vapi-->>User: "Hello, let's start the interview..."
    User->>Vapi: Speaks Answer
    Vapi->>Frontend: Return Transcript Stream
```

### 3. Asynchronous Event-Driven Feedback Pipeline
Converting a synchronous 15-20s LLM call into a background job returning 202 Accepted in under 100ms.
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Action as Action/Service
    participant QStash as Upstash QStash
    participant Webhook as API Webhook
    participant Gemini as Google Gemini
    participant DB as PostgreSQL

    User->>Frontend: Finish Interview
    Frontend->>Action: createFeedback(transcript)
    Action->>QStash: Publish Job JSON
    QStash-->>Action: 202 Accepted
    Action-->>Frontend: Success under 100ms
    
    Note over QStash,Webhook: Async Processing
    QStash->>Webhook: POST /api/webhooks/feedback
    Webhook->>Gemini: Analyze Transcript
    Gemini-->>Webhook: AI Assessment
    Webhook->>DB: Save Feedback
    Webhook->>QStash: 200 OK Job Done
```

### 4. Redis Cache-Aside Strategy
Reducing database read load by up to 80% on the user dashboard.
```mermaid
graph TD
    Dashboard[User Dashboard] --> FetchInterviews[fetchInterviewsByUserId]
    FetchInterviews -->|1. Check Cache| Redis[(Upstash Redis)]
    Redis -- Cache Hit --> Return[Return Data Fast]
    Redis -- Cache Miss --> Postgres[(PostgreSQL)]
    Postgres -->|2. Query Data| FetchInterviews
    FetchInterviews -->|3. Save TTL 15m| Redis
    FetchInterviews --> Return
```

---

## Folder Structure

```text
skillbridgeAI/
├── app/                  # Next.js App Router pages and API routes
│   ├── (auth)/           # Authentication pages (Sign In / Sign Up)
│   ├── (root)/           # Main application layouts and pages
│   └── api/              # API endpoints and webhooks
├── components/           # Reusable React components (shadcn/ui & custom)
├── firebase/             # Firebase configuration and admin setup
├── lib/                  # Core backend logic
│   ├── actions/          # Next.js Server Actions (Controllers)
│   ├── services/         # Business logic layer (Auth, Interview, Feedback)
│   ├── db.ts             # Prisma client initialization
│   ├── logger.ts         # Pino structured logging setup
│   ├── rate-limit.ts     # Upstash Redis rate limiting utility
│   └── redis.ts          # Upstash Redis global client
├── prisma/               # Prisma schema and migrations
├── public/               # Static assets
└── types/                # Global TypeScript definitions
```

---

## Engineering Highlights

* **Service Layer Pattern:** Decoupled business logic from routing. Next.js Server Actions act purely as controllers, delegating heavy lifting to a strictly typed `lib/services/` layer, enabling independent testability.
* **Fault-Tolerant Background Jobs:** The integration of QStash removes Vercel's strict serverless timeout bottleneck. It implements automatic exponential backoff retry on LLM failures to guarantee feedback delivery.
* **Database Optimization:** Migrated from NoSQL to a relational model using Prisma ORM. Utilized Supabase with a PgBouncer connection pooler on Port 6543 to prevent connection exhaustion during serverless cold starts.
* **Sliding Window Rate Limiting:** Implemented at the Next.js edge using Redis to cap AI interview generation at 4 requests/hour/IP, effectively preventing LLM API abuse and cost overruns.
* **Cache Invalidation Engine:** Real-time cache invalidation triggered immediately upon interview creation and AI feedback completion, guaranteeing users never see stale dashboard data.

---

## Project Setup & Quick Start

### Prerequisites
* Node.js (v18+)
* npm / pnpm / yarn

### Installation
```bash
git clone https://github.com/Shubh-Raj/skillbridgeAI.git
cd skillbridgeAI
npm install
```

### Run Locally
```bash
npm run dev
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="postgresql://postgres:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@host:5432/postgres"

# Upstash Redis
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Upstash QStash
QSTASH_URL=""
QSTASH_TOKEN=""
QSTASH_CURRENT_SIGNING_KEY=""
QSTASH_NEXT_SIGNING_KEY=""

# AI & External APIs
NEXT_PUBLIC_VAPI_WEB_TOKEN=""
NEXT_PUBLIC_VAPI_WORKFLOW_ID=""
GOOGLE_GENERATIVE_AI_API_KEY=""
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Firebase (Auth)
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""

# Sentry
SENTRY_AUTH_TOKEN=""
```

---

## Author
**Shubh Raj** (B.Tech CSE – BIT Mesra)
* [LinkedIn](https://www.linkedin.com/in/shubhraj62/)
