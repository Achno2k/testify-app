import { db, getEndpoint } from "@/lib/db";

async function handle(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await ctx.params;
  const endpoint = getEndpoint(id);
  if (!endpoint) {
    return new Response(
      JSON.stringify({ error: "endpoint not found", id }),
      { status: 404, headers: { "content-type": "application/json" } },
    );
  }

  if (endpoint.method !== "ANY" && endpoint.method !== req.method) {
    return new Response(
      JSON.stringify({
        error: "method not allowed",
        expected: endpoint.method,
        received: req.method,
      }),
      {
        status: 405,
        headers: {
          "content-type": "application/json",
          allow: endpoint.method,
        },
      },
    );
  }

  // Capture the incoming request.
  const url = new URL(req.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    query[k] = v;
  });
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k] = v;
  });
  let bodyText: string | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      bodyText = await req.text();
    } catch {
      bodyText = null;
    }
  }

  const conn = db();
  conn.prepare(
    `INSERT INTO requests (endpoint_id, method, headers, body, query, received_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    req.method,
    JSON.stringify(headers),
    bodyText,
    Object.keys(query).length ? JSON.stringify(query) : null,
    Date.now(),
  );
  conn.prepare("UPDATE endpoints SET hit_count = hit_count + 1 WHERE id = ?").run(id);

  if (endpoint.delay_ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, endpoint.delay_ms));
  }

  return new Response(endpoint.response_body, {
    status: endpoint.status_code,
    headers: {
      "content-type": endpoint.content_type,
      "access-control-allow-origin": "*",
      "x-testify-endpoint": endpoint.id,
    },
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "access-control-allow-headers": "*",
    },
  });
}
