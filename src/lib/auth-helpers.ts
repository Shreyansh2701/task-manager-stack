import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function getSession() {
  const session = await auth();
  return session;
}

export async function requireAuth() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), userId: null, session: null };
  }
  return { userId, session, error: null };
}

export async function requireWorkspaceMember(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });
  if (!membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), membership: null };
  }
  return { membership, error: null };
}

export async function requireWorkspaceAdmin(userId: string, workspaceId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId, role: { in: ["OWNER", "ADMIN"] } },
  });
  if (!membership) {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }), membership: null };
  }
  return { membership, error: null };
}

export async function requireWorkspaceOwner(userId: string, workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) {
    return { error: NextResponse.json({ error: "Workspace not found" }, { status: 404 }), workspace: null };
  }
  if (workspace.ownerId !== userId) {
    return { error: NextResponse.json({ error: "Owner access required" }, { status: 403 }), workspace: null };
  }
  return { workspace, error: null };
}
