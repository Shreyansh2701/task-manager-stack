import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const notifications = await prisma.notification.findMany({
      where: { userId: userId! },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[notifications GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json().catch(() => ({}));

    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: userId!, read: false },
        data: { read: true },
      });
      return NextResponse.json({ message: "All notifications marked as read" });
    }

    if (body.notificationId) {
      await prisma.notification.update({
        where: { id: body.notificationId, userId: userId! },
        data: { read: true },
      });
      return NextResponse.json({ message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err) {
    console.error("[notifications PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
