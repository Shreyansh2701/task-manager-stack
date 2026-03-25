import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth, requireWorkspaceMember } from "@/lib/auth-helpers";

function sectionNameToStatus(name: string): "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" {
  const n = name.toLowerCase().replace(/[^a-z ]/g, "").trim();
  if (n === "in progress" || n === "doing" || n === "wip") return "IN_PROGRESS";
  if (n === "in review" || n === "review" || n === "testing" || n === "qa") return "IN_REVIEW";
  if (n === "done" || n === "complete" || n === "completed" || n === "finished") return "DONE";
  return "TODO";
}

const taskSchema = z.object({
  sectionId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).default("NONE"),
  dueDate: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
  parentTaskId: z.string().optional().nullable(),
});

const moveTaskSchema = z.object({
  taskId: z.string(),
  toSectionId: z.string(),
  position: z.number().int().min(0),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
});

export async function GET(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const sectionId = url.searchParams.get("sectionId");

    if (!projectId && !sectionId) {
      return NextResponse.json({ error: "projectId or sectionId required" }, { status: 400 });
    }

    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

      const { error: memberError } = await requireWorkspaceMember(userId!, project.workspaceId);
      if (memberError) return memberError;

      const tasks = await prisma.task.findMany({
        where: { section: { projectId }, isArchived: false },
        orderBy: { position: "asc" },
        include: {
          assignees: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
          subtasks: { select: { id: true, status: true } },
          _count: { select: { comments: true, attachments: true } },
          section: true,
        },
      });
      return NextResponse.json({ tasks });
    }

    return NextResponse.json({ tasks: [] });
  } catch (err) {
    console.error("[tasks GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json().catch(() => ({}));

    // Handle task move
    if (body.action === "move") {
      const parsed = moveTaskSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

      const task = await prisma.task.findUnique({
        where: { id: parsed.data.taskId },
        include: { section: { include: { project: true } } },
      });
      if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

      const { error: memberError } = await requireWorkspaceMember(userId!, task.section.project.workspaceId);
      if (memberError) return memberError;

      const updated = await prisma.task.update({
        where: { id: parsed.data.taskId },
        data: {
          sectionId: parsed.data.toSectionId,
          position: parsed.data.position,
          ...(parsed.data.status ? { status: parsed.data.status } : {}),
        },
      });

      return NextResponse.json({ task: updated });
    }

    // Create task
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 422 });
    }

    const section = await prisma.section.findUnique({ where: { id: parsed.data.sectionId }, include: { project: true } });
    if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });

    const { error: memberError } = await requireWorkspaceMember(userId!, section.project.workspaceId);
    if (memberError) return memberError;

    // Get max position in section
    const maxPos = await prisma.task.aggregate({
      where: { sectionId: parsed.data.sectionId, parentTaskId: parsed.data.parentTaskId || null },
      _max: { position: true },
    });

    // Derive status from section name
    const sectionStatus = sectionNameToStatus(section.name);

    const task = await prisma.task.create({
      data: {
        sectionId: parsed.data.sectionId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        parentTaskId: parsed.data.parentTaskId || null,
        position: (maxPos._max.position ?? -1) + 1,
        status: sectionStatus,
      },
      include: {
        assignees: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        subtasks: { select: { id: true, status: true } },
        _count: { select: { comments: true, attachments: true } },
      },
    });

    // Assign users
    if (parsed.data.assigneeIds?.length) {
      await prisma.taskAssignee.createMany({
        data: parsed.data.assigneeIds.map((uid) => ({ taskId: task.id, userId: uid })),
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("[tasks POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
