import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// /workspace (no ID) → redirect to first workspace or dashboard
export default async function WorkspaceIndexPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Find the user's first workspace and redirect there
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: { select: { id: true } } },
    orderBy: { joinedAt: "asc" },
  });

  if (membership?.workspace?.id) {
    redirect(`/workspace/${membership.workspace.id}`);
  }

  // No workspaces — send to dashboard where they can create one
  redirect("/dashboard");
}
