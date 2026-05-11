import { NextRequest, NextResponse } from "next/server";
import { createSession, clearSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { idToken } = (await req.json().catch(() => ({}))) as {
    idToken?: string;
  };
  if (!idToken) {
    return NextResponse.json({ error: "missing idToken" }, { status: 400 });
  }
  try {
    await createSession(idToken);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "sign-in failed" },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
