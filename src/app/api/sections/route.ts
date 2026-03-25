import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceMember } from "@/lib/auth-helpers";
import { z } from "zod";

const sectionSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(50),
});

export async function GET(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { error: memberError } = await requireWorkspaceMember(userId!, project.workspaceId);
    if (memberError) return memberError;

    const sections = await prisma.section.findMany({
      where: { projectId },
      include: {
        tasks: {
          where: { parentTaskId: null, isArchived: false },
          orderBy: { position: "asc" },
          include: {
            assignees: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
            subtasks: { select: { id: true, status: true } },
            _count: { select: { comments: true, attachments: true } },
          },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ sections });
  } catch (err) {
    console.error("[sections GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const parsed = sectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 422 });
    }

    const project = await prisma.project.findUnique({ where: { id: parsed.data.projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const { error: memberError } = await requireWorkspaceMember(userId!, project.workspaceId);
    if (memberError) return memberError;

    const maxPosition = await prisma.section.aggregate({
      where: { projectId: parsed.data.projectId },
      _max: { position: true },
    });

    const section = await prisma.section.create({
      data: {
        projectId: parsed.data.projectId,
        name: parsed.data.name,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (err) {
    console.error("[sections POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
