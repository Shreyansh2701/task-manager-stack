import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceMember, requireWorkspaceAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  defaultView: z.enum(["BOARD", "LIST"]).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

async function resolveParams(params: { projectId: string } | Promise<{ projectId: string }>) {
  if (typeof (params as Promise<unknown>)?.then === "function") return await (params as Promise<{ projectId: string }>);
  return params as { projectId: string };
}

export async function GET(
  request: Request,
  context: { params: { projectId: string } | Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await resolveParams(context.params);
    const { userId, error } = await requireAuth();
    if (error) return error;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: { _count: { select: { tasks: true } } },
        },
        _count: { select: { sections: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { error: memberError } = await requireWorkspaceMember(userId!, project.workspaceId);
    if (memberError) return memberError;

    return NextResponse.json({ project });
  } catch (err) {
    console.error("[project GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: { projectId: string } | Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await resolveParams(context.params);
    const { userId, error } = await requireAuth();
    if (error) return error;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { error: memberError } = await requireWorkspaceMember(userId!, project.workspaceId);
    if (memberError) return memberError;

    const body = await request.json().catch(() => ({}));
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 422 });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: parsed.data,
    });

    return NextResponse.json({ project: updated });
  } catch (err) {
    console.error("[project PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: { projectId: string } | Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await resolveParams(context.params);
    const { userId, error } = await requireAuth();
    if (error) return error;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Require at least admin to delete a project
    const { error: adminError } = await requireWorkspaceAdmin(userId!, project.workspaceId);
    if (adminError) return adminError;

    // Cascade delete handles sections, tasks, etc.
    await prisma.project.delete({ where: { id: projectId } });

    return NextResponse.json({ message: "Project deleted" });
  } catch (err) {
    console.error("[project DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
