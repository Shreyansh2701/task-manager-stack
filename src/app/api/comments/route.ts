import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceMember } from "@/lib/auth-helpers";
import { z } from "zod";

const commentSchema = z.object({
  taskId: z.string(),
  content: z.string().min(1).max(5000),
  mentions: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const url = new URL(request.url);
    const taskId = url.searchParams.get("taskId");
    if (!taskId) return NextResponse.json({ error: "taskId is required" }, { status: 400 });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { section: { include: { project: true } } },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const { error: memberError } = await requireWorkspaceMember(userId!, task.section.project.workspaceId);
    if (memberError) return memberError;

    const comments = await prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("[comments GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const parsed = commentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

    const task = await prisma.task.findUnique({
      where: { id: parsed.data.taskId },
      include: { section: { include: { project: true } } },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const { error: memberError } = await requireWorkspaceMember(userId!, task.section.project.workspaceId);
    if (memberError) return memberError;

    const comment = await prisma.comment.create({
      data: {
        taskId: parsed.data.taskId,
        userId: userId!,
        content: parsed.data.content,
        mentions: parsed.data.mentions || [],
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    // Create notifications for mentions
    if (parsed.data.mentions?.length) {
      const user = await prisma.user.findUnique({ where: { id: userId! }, select: { name: true } });
      await prisma.notification.createMany({
        data: parsed.data.mentions.map((mentionedUserId) => ({
          userId: mentionedUserId,
          type: "MENTIONED" as const,
          title: "You were mentioned",
          message: `${user?.name || "Someone"} mentioned you in a comment on "${task.title}"`,
          entityType: "task",
          entityId: task.id,
        })),
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error("[comments POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
