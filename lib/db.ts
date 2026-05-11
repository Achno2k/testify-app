import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

declare global {
  // eslint-disable-next-line no-var
  var __testify_db: DatabaseSync | undefined;
}

function init(): DatabaseSync {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const conn = new DatabaseSync(path.join(dir, "testify.db"));
  conn.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 2000;");
  conn.exec(`
    CREATE TABLE IF NOT EXISTS endpoints (
      id TEXT PRIMARY KEY,
      name TEXT,
      method TEXT NOT NULL,
      status_code INTEGER NOT NULL DEFAULT 200,
      response_body TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'application/json',
      delay_ms INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      hit_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint_id TEXT NOT NULL,
      method TEXT NOT NULL,
      headers TEXT NOT NULL,
      body TEXT,
      query TEXT,
      received_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_requests_endpoint
      ON requests(endpoint_id, received_at DESC);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firebase_uid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT,
      image TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_owner
      ON projects(owner_id, created_at DESC);
  `);

  // Idempotent column adds — SQLite has no IF NOT EXISTS for ALTER.
  for (const sql of [
    "ALTER TABLE endpoints ADD COLUMN owner_id TEXT",
    "ALTER TABLE endpoints ADD COLUMN project_id TEXT",
  ]) {
    try {
      conn.exec(sql);
    } catch (e) {
      if (!String(e).includes("duplicate column")) throw e;
    }
  }
  conn.exec(`
    CREATE INDEX IF NOT EXISTS idx_endpoints_project
      ON endpoints(project_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_endpoints_owner
      ON endpoints(owner_id, created_at DESC);
  `);
  return conn;
}

export function db(): DatabaseSync {
  if (!globalThis.__testify_db) {
    globalThis.__testify_db = init();
  }
  return globalThis.__testify_db;
}

export type Endpoint = {
  id: string;
  name: string | null;
  method: string;
  status_code: number;
  response_body: string;
  content_type: string;
  delay_ms: number;
  created_at: number;
  hit_count: number;
  owner_id: string | null;
  project_id: string | null;
};

export type RequestRow = {
  id: number;
  endpoint_id: string;
  method: string;
  headers: string;
  body: string | null;
  query: string | null;
  received_at: number;
};

export type User = {
  id: string;
  firebase_uid: string;
  email: string;
  name: string | null;
  image: string | null;
  created_at: number;
};

export type Project = {
  id: string;
  name: string;
  owner_id: string;
  created_at: number;
};

// node:sqlite returns rows with null prototypes; React Server Components
// can't serialize those to client components. Reshape to plain objects.
function plain<T>(row: unknown): T {
  return { ...(row as T) };
}
function plainAll<T>(rows: unknown[]): T[] {
  return rows.map((r) => ({ ...(r as T) }));
}

export function getEndpoint(id: string): Endpoint | null {
  const row = db()
    .prepare("SELECT * FROM endpoints WHERE id = ?")
    .get(id);
  return row ? plain<Endpoint>(row) : null;
}

export function listRequests(endpointId: string, limit = 25): RequestRow[] {
  const rows = db()
    .prepare(
      "SELECT * FROM requests WHERE endpoint_id = ? ORDER BY received_at DESC LIMIT ?",
    )
    .all(endpointId, limit);
  return plainAll<RequestRow>(rows);
}

export function getUserByFirebaseUid(uid: string): User | null {
  const row = db()
    .prepare("SELECT * FROM users WHERE firebase_uid = ?")
    .get(uid);
  return row ? plain<User>(row) : null;
}

export function upsertUser(input: {
  id: string;
  firebase_uid: string;
  email: string;
  name: string | null;
  image: string | null;
}): User {
  const now = Date.now();
  const existing = getUserByFirebaseUid(input.firebase_uid);
  if (existing) {
    db()
      .prepare(
        "UPDATE users SET email = ?, name = ?, image = ? WHERE firebase_uid = ?",
      )
      .run(input.email, input.name, input.image, input.firebase_uid);
    return { ...existing, email: input.email, name: input.name, image: input.image };
  }
  db()
    .prepare(
      "INSERT INTO users (id, firebase_uid, email, name, image, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(input.id, input.firebase_uid, input.email, input.name, input.image, now);
  return {
    id: input.id,
    firebase_uid: input.firebase_uid,
    email: input.email,
    name: input.name,
    image: input.image,
    created_at: now,
  };
}

export function listProjectsForUser(userId: string): Project[] {
  const rows = db()
    .prepare(
      "SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC",
    )
    .all(userId);
  return plainAll<Project>(rows);
}

export function getProject(id: string): Project | null {
  const row = db()
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(id);
  return row ? plain<Project>(row) : null;
}

export function createProject(input: {
  id: string;
  name: string;
  owner_id: string;
}): Project {
  const now = Date.now();
  db()
    .prepare(
      "INSERT INTO projects (id, name, owner_id, created_at) VALUES (?, ?, ?, ?)",
    )
    .run(input.id, input.name, input.owner_id, now);
  return { ...input, created_at: now };
}

export function listEndpointsInProject(projectId: string): Endpoint[] {
  const rows = db()
    .prepare(
      "SELECT * FROM endpoints WHERE project_id = ? ORDER BY created_at DESC",
    )
    .all(projectId);
  return plainAll<Endpoint>(rows);
}
