import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const updateWorkspaceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().max(500).optional().nullable(),
  slug: z.string().regex(/^[a-z0-9\-]+$/i).optional(),
});

const resolveParams = async (
  params: { workspaceId: string } | Promise<{ workspaceId: string }>
) => {
  if (typeof (params as any)?.then === "function") {
    return await (params as Promise<{ workspaceId: string }>);
  }
  return params as { workspaceId: string };
};

const authorize = async (workspaceId: string) => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), userId: null };
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });

  if (!membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), userId: null };
  }

  return { userId, membership, error: null };
};

export async function GET(
  request: Request,
  context: { params: { workspaceId: string } | Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await resolveParams(context.params);
    const { error } = await authorize(workspaceId);
    if (error) return error;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json({ workspace });
  } catch (err) {
    console.error("[workspace GET] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: { workspaceId: string } | Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await resolveParams(context.params);
    const { userId, error } = await authorize(workspaceId);
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const parsed = updateWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 422 });
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (workspace.ownerId !== userId) {
      return NextResponse.json({ error: "Only owner can update workspace" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.name) updateData.name = parsed.data.name;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.slug) updateData.slug = parsed.data.slug.toLowerCase();

    const updated = await prisma.workspace.update({ where: { id: workspaceId }, data: updateData });

    return NextResponse.json({ workspace: updated });
  } catch (err) {
    console.error("[workspace PATCH] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: { workspaceId: string } | Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await resolveParams(context.params);
    const { userId, error } = await authorize(workspaceId);
    if (error) return error;

    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (workspace.ownerId !== userId) {
      return NextResponse.json({ error: "Only owner can delete workspace" }, { status: 403 });
    }

    await prisma.workspace.delete({ where: { id: workspaceId } });

    return NextResponse.json({ message: "Workspace deleted" });
  } catch (err) {
    console.error("[workspace DELETE] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
