import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspaceAdmin, requireWorkspaceMember } from "@/lib/auth-helpers";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER", "GUEST"]).default("MEMBER"),
});

async function resolveParams(params: { workspaceId: string } | Promise<{ workspaceId: string }>) {
  if (typeof (params as Promise<unknown>)?.then === "function") return await (params as Promise<{ workspaceId: string }>);
  return params as { workspaceId: string };
}

export async function GET(
  request: Request,
  context: { params: { workspaceId: string } | Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await resolveParams(context.params);
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { error: memberError, membership } = await requireWorkspaceMember(userId!, workspaceId);
    if (memberError) return memberError;

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    const invites = await prisma.workspaceInvite.findMany({
      where: { workspaceId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ members, invites, currentUserRole: membership!.role });
  } catch (err) {
    console.error("[members GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: { workspaceId: string } | Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await resolveParams(context.params);
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { error: adminError } = await requireWorkspaceAdmin(userId!, workspaceId);
    if (adminError) return adminError;

    const body = await request.json().catch(() => ({}));
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findFirst({
        where: { userId: existingUser.id, workspaceId },
      });
      if (existingMember) {
        return NextResponse.json({ error: "User is already a member" }, { status: 409 });
      }
    }

    // Check for existing pending invite
    const existingInvite = await prisma.workspaceInvite.findFirst({
      where: { workspaceId, email: parsed.data.email.toLowerCase(), acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvite) {
      return NextResponse.json({ error: "Invite already pending" }, { status: 409 });
    }

    const invite = await prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Notify the user if they exist
    if (existingUser) {
      const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      await prisma.notification.create({
        data: {
          userId: existingUser.id,
          type: "INVITE_RECEIVED",
          title: "Workspace Invitation",
          message: `You've been invited to join "${workspace?.name}"`,
          entityType: "workspace",
          entityId: workspaceId,
        },
      });
    }

    return NextResponse.json({ invite }, { status: 201 });
  } catch (err) {
    console.error("[members POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: { workspaceId: string } | Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await resolveParams(context.params);
    const { userId, error } = await requireAuth();
    if (error) return error;

    const { error: adminError } = await requireWorkspaceAdmin(userId!, workspaceId);
    if (adminError) return adminError;

    const url = new URL(request.url);
    const memberId = url.searchParams.get("memberId");
    if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

    const member = await prisma.workspaceMember.findFirst({ where: { id: memberId, workspaceId } });
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    // Can't remove owner
    if (member.role === "OWNER") {
      return NextResponse.json({ error: "Cannot remove workspace owner" }, { status: 403 });
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });

    return NextResponse.json({ message: "Member removed" });
  } catch (err) {
    console.error("[members DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
