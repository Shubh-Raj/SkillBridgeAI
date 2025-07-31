import { auth } from "@/firebase/admin";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

// ─── Auth Service ─────────────────────────────────────────────────────────────

export async function createUserRecord(params: {
  uid: string;
  name: string;
  email: string;
}): Promise<{ success: boolean; message: string }> {
  const { uid, name, email } = params;

  const existingUser = await db.user.findUnique({ where: { id: uid } });

  if (existingUser) {
    return {
      success: false,
      message: "User already exists. Please sign in instead.",
    };
  }

  await db.user.create({ data: { id: uid, name, email } });

  return {
    success: true,
    message: "Account created successfully. Please sign in.",
  };
}

export async function verifyFirebaseUser(email: string): Promise<boolean> {
  const userRecord = await auth.getUserByEmail(email);
  return !!userRecord;
}

export async function createSession(idToken: string): Promise<void> {
  const cookieStore = await cookies();

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_SECONDS * 1000,
  });

  cookieStore.set("session", sessionCookie, {
    maxAge: SESSION_DURATION_SECONDS,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set("session", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function resolveCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) return null;

  const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

  const user = await db.user.findUnique({
    where: { id: decodedClaims.uid },
  });

  if (!user) return null;

  return { id: user.id, name: user.name, email: user.email };
}
