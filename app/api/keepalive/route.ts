import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.user.findFirst({
      select: { id: true },
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Keepalive failed:", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
