import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceMember } from "@/lib/auth-helpers";
import { z } from "zod";

const timeEntrySchema = z.object({
  taskId: z.string(),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string().optional().nullable(),
  duration: z.number().int().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const url = new URL(request.url);
    const taskId = url.searchParams.get("taskId");
    if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { section: { include: { project: true } } },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const { error: memberError } = await requireWorkspaceMember(userId!, task.section.project.workspaceId);
    if (memberError) return memberError;

    const entries = await prisma.timeEntry.findMany({
      where: { taskId },
      orderBy: { startTime: "desc" },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("[time-entries GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const parsed = timeEntrySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

    const task = await prisma.task.findUnique({
      where: { id: parsed.data.taskId },
      include: { section: { include: { project: true } } },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const { error: memberError } = await requireWorkspaceMember(userId!, task.section.project.workspaceId);
    if (memberError) return memberError;

    const startTime = new Date(parsed.data.startTime);
    const endTime = parsed.data.endTime ? new Date(parsed.data.endTime) : null;
    const duration = endTime
      ? Math.round((endTime.getTime() - startTime.getTime()) / 1000)
      : parsed.data.duration || null;

    const entry = await prisma.timeEntry.create({
      data: {
        taskId: parsed.data.taskId,
        userId: userId!,
        description: parsed.data.description,
        startTime,
        endTime,
        duration,
      },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    console.error("[time-entries POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
