import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/app/api/auth/[...nextauth]/route";

const workspaceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9\-]+$/i).optional(),
});

export async function GET(_request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
    });

    const workspaces = memberships.map((membership: { workspace: unknown }) => membership.workspace);
    return NextResponse.json({ workspaces });
  } catch (err) {
    console.error("[workspaces GET] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = workspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 422 });
    }

    const name = parsed.data.name;
    const slug = parsed.data.slug
      ? parsed.data.slug.toLowerCase()
      : `${name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

    const existing = await prisma.workspace.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Workspace slug already in use" }, { status: 409 });
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (err) {
    console.error("[workspaces POST] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
