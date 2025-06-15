
# 🎯 SkillBridge

**SkillBridge** is a real-time, AI-driven mock interview platform built with Next.js and Vapi AI Voice agents. Practice your technical interview skills, receive instant AI feedback on performance, and track your progress—all in one sleek and user-friendly web app.

---

## 🚀 Table of Contents

* [🤖 Introduction](#-introduction)
* [⚙️ Tech Stack](#️-tech-stack)
* [🔋 Features](#-features)
* [🎯 Project Setup & Quick Start](#-project-setup--quick-start)
* [🌐 Environment Variables](#-environment-variables)
* [🧱 Code Highlights & Architecture](#-code-highlights--architecture)
* [🛠️ Usage](#️-usage)
* [🛡️ Roadmap](#️-roadmap)
* [👤 Author](#-author)

---

## 🤖 Introduction

SkillBridge helps you prepare for job interviews in a realistic, engaging way. Launch mock interviews powered by Vapi's voice assistant and Google Gemini. Record answers, get real-time AI feedback, and refine your interviewing skills—all through a seamless, interactive interface.

---

## ⚙️ Tech Stack

* **Next.js 13+** – Frontend & backend logic
* **Tailwind CSS** – Responsive and modern design
* **shadcn/ui** – Prebuilt component library
* **Firebase** – Authentication & data storage
* **Vapi AI** – Voice-powered conversational interviews
* **Google Gemini** – Analyzing responses and generating insights
* **Zod** – Type-safe validation
* **Vercel** – Deployment platform

---

## 🔋 Features

* ✅ **Email/password sign-up & login** through Firebase
* ✅ **Create mock interviews** with customizable roles (e.g., "Software Developer")
* ✅ **AI voice-driven interactions** via Vapi
* ✅ **Instant AI feedback** in categories like Communication, Tech Knowledge, Problem Solving, etc.
* ✅ **Interview transcripts** with breakdown scores
* ✅ **Dashboard** listing all created interviews and statuses
* ✅ **Responsive design** for mobile and desktop
* ✅ **Reusable UI components** using Tailwind and shadcn/ui

---

## 🎯 Project Setup & Quick Start

### Prerequisites

* Git
* Node.js (v16 or higher)
* npm

### Installation

```bash
git clone https://github.com/Shubh-Raj/skillbridgeAI.git
cd skillbridgeAI
npm install
```

### Environment Variables

Create a `.env.local` file in the project root, and add the following with your own credentials:

```
NEXT_PUBLIC_VAPI_WEB_TOKEN=
NEXT_PUBLIC_VAPI_WORKFLOW_ID=
GOOGLE_GENERATIVE_AI_API_KEY=
NEXT_PUBLIC_BASE_URL=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to explore the app.

---

## 🧱 Code Highlights & Architecture

### UI Styling (`globals.css`)

Custom themes, dark/light variants, and Tailwind utility styles power the interface. Includes responsive buttons (`.btn-call`, `.btn-disconnect`, etc.) and card styles for sessions and feedback.

### Utility Functions (`lib/utils.ts`)

* `cn(...)`: Utility for Tailwind CSS class merging
* `getTechLogos()`: Dynamically fetches icons for tech stacks
* `getRandomInterviewCover()`: Provides random banner images for sessions

### Feedback Generation (AI Prompt)

Powered by a refined prompt template in `lib/actions/general.action.ts`:

```text
…evaluate candidate; score them 0–100 in Communication, Technical Knowledge, Problem-Solving, Cultural & Role Fit, Confidence & Clarity…
```

This ensures structured, actionable AI feedback.

### Feedback Page (`feedback/page.tsx`)

Displays:

* Overall score and date
* Final assessment summary
* Score breakdown with comments
* Strengths and areas for improvement
* Handy navigation buttons

### Data Handling

Workflows are stored in Firebase with Zod validation. The call flow:

1. User creates a session
2. Vapi voice interview is triggered
3. Transcript is captured
4. Feedback is analyzed and stored
5. Results are presented back to the user

---

## 🛠️ Usage

1. **Sign Up** or log in
2. Click **"Start an Interview"**
3. Select role & tech track
4. Press **Call** to initiate live AI interview
5. Speak through your session
6. Receive post-call feedback and score breakdown
7. Track sessions via **Dashboard**

---

## 🛡️ Roadmap

* ✅ Add user profile and statistics page
* ✅ Enable custom question sets
* ✅ Support peer reviews & shareable session links
* ⚙️ Add practice mode (without voice input)
* 📈 Generate visual trends over time
* 🌏 Support for other languages and accents

---

## 👤 Author

**Shubh Raj** (B.Tech – BIT Mesra)

* 📧 [btech10068.23@bitmesra.ac.in](mailto:btech10068.23@bitmesra.ac.in)
* 🧑‍💼 [LinkedIn](https://www.linkedin.com/in/shubhraj62/)
* Passionate about AI, web development, and improving developer onboarding

---

> 🚀 *SkillBridge: Build confidence, refine your skills, conquer your next interview.*

---

