import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await auth();

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] relative overflow-hidden">
        <div className="orb orb-primary w-[400px] h-[400px] top-1/4 left-1/4" />
        <div className="glass-card glass-glow p-8 max-w-md w-full text-center animate-floatIn relative">
          <h1 className="text-2xl font-bold tracking-tight mb-3 text-red-400">Invalid Invite</h1>
          <p className="mb-6" style={{ color: "var(--text-secondary)" }}>This invite link is invalid or has been revoked.</p>
          <Link href="/login" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] relative overflow-hidden">
        <div className="orb orb-primary w-[400px] h-[400px] top-1/4 right-1/4" />
        <div className="glass-card glass-glow p-8 max-w-md w-full text-center animate-floatIn relative">
          <h1 className="text-2xl font-bold tracking-tight mb-3 text-yellow-400">Invite Expired</h1>
          <p className="mb-6" style={{ color: "var(--text-secondary)" }}>This invite has expired. Please ask the workspace admin to send a new one.</p>
          <Link href="/login" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (invite.acceptedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] relative overflow-hidden">
        <div className="orb orb-primary w-[400px] h-[400px] bottom-1/4 left-1/3" />
        <div className="glass-card glass-glow p-8 max-w-md w-full text-center animate-floatIn relative">
          <h1 className="text-2xl font-bold tracking-tight mb-3">Already Accepted</h1>
          <p className="mb-6" style={{ color: "var(--text-secondary)" }}>This invite has already been accepted.</p>
          <Link href={`/workspace/${invite.workspaceId}`} className="btn btn-primary">Go to Workspace</Link>
        </div>
      </div>
    );
  }

  // If user is not logged in, redirect to login with callback
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/invite/${token}`);
  }

  // Check if user is already a member
  const existingMember = await prisma.workspaceMember.findFirst({
    where: { workspaceId: invite.workspaceId, userId: session.user.id },
  });

  if (existingMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] relative overflow-hidden">
        <div className="orb orb-primary w-[400px] h-[400px] top-1/3 right-1/4" />
        <div className="glass-card glass-glow p-8 max-w-md w-full text-center animate-floatIn relative">
          <h1 className="text-2xl font-bold tracking-tight mb-3">Already a Member</h1>
          <p className="mb-6" style={{ color: "var(--text-secondary)" }}>You&apos;re already a member of <strong>{invite.workspace.name}</strong>.</p>
          <Link href={`/workspace/${invite.workspaceId}`} className="btn btn-primary">Go to Workspace</Link>
        </div>
      </div>
    );
  }

  // Accept the invite
  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: {
        workspaceId: invite.workspaceId,
        userId: session.user.id,
        role: invite.role,
      },
    }),
    prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  redirect(`/workspace/${invite.workspaceId}`);
}
