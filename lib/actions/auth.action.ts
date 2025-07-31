'use server';

import {
  createUserRecord,
  verifyFirebaseUser,
  createSession,
  destroySession,
  resolveCurrentUser,
} from "@/lib/services/auth.service";

// ─── Auth Actions ─────────────────────────────────────────────────────────────
// Thin Server Action layer — handles errors and delegates to the auth service.

export async function signUp(
  params: SignUpParams
): Promise<{ success: boolean; message: string }> {
  try {
    return await createUserRecord({
      uid: params.uid,
      name: params.name,
      email: params.email,
    });
  } catch (e: any) {
    console.error("[signUp]", e);

    if (e.code === "auth/email-already-exists") {
      return { success: false, message: "This email is already in use." };
    }

    return { success: false, message: "Failed to create an account." };
  }
}

export async function signIn(
  params: SignInParams
): Promise<{ success: boolean; message: string }> {
  try {
    const userExists = await verifyFirebaseUser(params.email);

    if (!userExists) {
      return {
        success: false,
        message: "User does not exist. Create an account instead.",
      };
    }

    await createSession(params.idToken);
    return { success: true, message: "Signed in successfully." };
  } catch (e) {
    console.error("[signIn]", e);
    return { success: false, message: "Failed to log into an account." };
  }
}

export async function setSessionCookie(idToken: string): Promise<void> {
  await createSession(idToken);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    return await resolveCurrentUser();
  } catch (e) {
    console.error("[getCurrentUser]", e);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

export async function signOut(): Promise<{ success: boolean }> {
  try {
    await destroySession();
    return { success: true };
  } catch (e) {
    console.error("[signOut]", e);
    return { success: false };
  }
}