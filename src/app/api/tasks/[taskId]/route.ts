import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceMember } from "@/lib/auth-helpers";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().nullable().optional(),
  position: z.number().int().min(0).optional(),
  sectionId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  isArchived: z.boolean().optional(),
});

async function resolveParams(params: { taskId: string } | Promise<{ taskId: string }>) {
  if (typeof (params as Promise<unknown>)?.then === "function") return await (params as Promise<{ taskId: string }>);
  return params as { taskId: string };
}

async function getTaskWithAccess(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { section: { include: { project: true } } },
  });
  if (!task) return { error: NextResponse.json({ error: "Task not found" }, { status: 404 }), task: null };

  const { error: memberError } = await requireWorkspaceMember(userId, task.section.project.workspaceId);
  if (memberError) return { error: memberError, task: null };

  return { task, error: null };
}

export async function GET(
  request: Request,
  context: { params: { taskId: string } | Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await resolveParams(context.params);
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { task, error: taskError } = await getTaskWithAccess(taskId, userId!);
    if (taskError) return taskError;

    const fullTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignees: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        subtasks: {
          orderBy: { position: "asc" },
          include: {
            assignees: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        attachments: { orderBy: { createdAt: "desc" } },
        timeEntries: {
          orderBy: { startTime: "desc" },
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        section: { include: { project: { select: { id: true, workspaceId: true } } } },
      },
    });

    return NextResponse.json({ task: fullTask });
  } catch (err) {
    console.error("[task GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: { taskId: string } | Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await resolveParams(context.params);
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { task, error: taskError } = await getTaskWithAccess(taskId, userId!);
    if (taskError) return taskError;

    const body = await request.json().catch(() => ({}));
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 422 });

    const { assigneeIds, dueDate, ...updateData } = parsed.data;

    const data: Record<string, unknown> = { ...updateData };
    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate) : null;
    }

    // Handle assignees first so the returned task has fresh data
    if (assigneeIds !== undefined) {
      await prisma.taskAssignee.deleteMany({ where: { taskId } });
      if (assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: assigneeIds.map((uid) => ({ taskId, userId: uid })),
        });
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignees: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        subtasks: { select: { id: true, status: true } },
        _count: { select: { comments: true, attachments: true } },
      },
    });

    return NextResponse.json({ task: updated });
  } catch (err) {
    console.error("[task PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: { taskId: string } | Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await resolveParams(context.params);
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { error: taskError } = await getTaskWithAccess(taskId, userId!);
    if (taskError) return taskError;

    await prisma.task.delete({ where: { id: taskId } });

    return NextResponse.json({ message: "Task deleted" });
  } catch (err) {
    console.error("[task DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
