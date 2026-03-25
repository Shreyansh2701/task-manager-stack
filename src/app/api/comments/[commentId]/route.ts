import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

async function resolveParams(params: { commentId: string } | Promise<{ commentId: string }>) {
  if (typeof (params as Promise<unknown>)?.then === "function") return await (params as Promise<{ commentId: string }>);
  return params as { commentId: string };
}

export async function DELETE(
  request: Request,
  context: { params: { commentId: string } | Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await resolveParams(context.params);
    const { userId, error } = await requireAuth();
    if (error) return error;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== userId) {
      return NextResponse.json({ error: "You can only delete your own comments" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ message: "Comment deleted" });
  } catch (err) {
    console.error("[comment DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
