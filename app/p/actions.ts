"use server";

import { redirect } from "next/navigation";
import { createProject } from "@/lib/db";
import { newId } from "@/lib/id";
import { requireUser } from "@/lib/session";

export async function createProjectAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const id = newId();
  createProject({
    id,
    name: name.slice(0, 80),
    owner_id: user.id,
  });
  redirect(`/p/${id}`);
}
