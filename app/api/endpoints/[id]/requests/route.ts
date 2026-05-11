import { NextResponse } from "next/server";
import { listRequests } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rows = listRequests(id, 50);
  return NextResponse.json({
    requests: rows.map((r) => ({
      id: r.id,
      method: r.method,
      headers: r.headers ? JSON.parse(r.headers) : {},
      body: r.body,
      query: r.query,
      received_at: r.received_at,
    })),
  });
}
