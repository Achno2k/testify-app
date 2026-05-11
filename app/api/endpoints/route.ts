import { NextResponse } from "next/server";
import { db, getProject } from "@/lib/db";
import { newId } from "@/lib/id";
import { getCurrentUser } from "@/lib/session";

const ALLOWED_METHODS = new Set([
  "ANY",
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const data = payload as Record<string, unknown>;
  const method = String(data.method ?? "ANY").toUpperCase();
  if (!ALLOWED_METHODS.has(method)) {
    return NextResponse.json({ error: "invalid method" }, { status: 400 });
  }

  const status = Number(data.status_code ?? 200);
  if (!Number.isInteger(status) || status < 100 || status > 599) {
    return NextResponse.json({ error: "invalid status code" }, { status: 400 });
  }

  const delay = Number(data.delay_ms ?? 0);
  if (!Number.isFinite(delay) || delay < 0 || delay > 10000) {
    return NextResponse.json({ error: "delay must be 0-10000 ms" }, { status: 400 });
  }

  const rawBody = typeof data.response_body === "string" ? data.response_body : "";
  let contentType = "text/plain";
  const trimmed = rawBody.trim();
  if (trimmed.length === 0) {
    contentType = "application/json";
  } else {
    try {
      JSON.parse(trimmed);
      contentType = "application/json";
    } catch {
      contentType = "text/plain";
    }
  }

  const name =
    typeof data.name === "string" && data.name.trim().length > 0
      ? data.name.trim().slice(0, 80)
      : null;

  // Optional project attachment — requires sign-in + ownership.
  let projectId: string | null = null;
  let ownerId: string | null = null;
  if (typeof data.project_id === "string" && data.project_id.length > 0) {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "sign in to attach an endpoint to a project" },
        { status: 401 },
      );
    }
    const project = getProject(data.project_id);
    if (!project || project.owner_id !== user.id) {
      return NextResponse.json({ error: "project not found" }, { status: 404 });
    }
    projectId = project.id;
    ownerId = user.id;
  }

  const id = newId();
  db().prepare(
    `INSERT INTO endpoints
       (id, name, method, status_code, response_body, content_type, delay_ms, created_at, owner_id, project_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    name,
    method,
    status,
    rawBody,
    contentType,
    Math.round(delay),
    Date.now(),
    ownerId,
    projectId,
  );

  return NextResponse.json({ id });
}
