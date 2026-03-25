import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth, requireWorkspaceMember } from "@/lib/auth-helpers";

const projectSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  defaultView: z.enum(["BOARD", "LIST"]).default("BOARD"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const { userId, error } = await requireAuth();
    if (error) return error;

    const { error: memberError } = await requireWorkspaceMember(userId!, workspaceId);
    if (memberError) return memberError;

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { sections: true } },
      },
    });

    return NextResponse.json({ projects });
  } catch (err) {
    console.error("[projects GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, error } = await requireAuth();
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 422 });
    }

    const { error: memberError } = await requireWorkspaceMember(userId!, parsed.data.workspaceId);
    if (memberError) return memberError;

    // Create project with default sections
    const project = await prisma.project.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        name: parsed.data.name,
        description: parsed.data.description ?? "",
        defaultView: parsed.data.defaultView,
        color: parsed.data.color,
        sections: {
          create: [
            { name: "To Do", position: 0 },
            { name: "In Progress", position: 1 },
            { name: "In Review", position: 2 },
            { name: "Done", position: 3 },
          ],
        },
      },
      include: { sections: true },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    console.error("[projects POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
