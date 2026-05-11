import { NextResponse } from "next/server";
import { db, getEndpoint } from "@/lib/db";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const existing = getEndpoint(id);
  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const conn = db();
  conn.prepare("DELETE FROM requests WHERE endpoint_id = ?").run(id);
  conn.prepare("DELETE FROM endpoints WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
