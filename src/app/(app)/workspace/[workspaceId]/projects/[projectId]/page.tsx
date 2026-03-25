import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

interface ProjectPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { workspaceId, projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });

  if (!project) {
    redirect(`/workspace/${workspaceId}`);
  }

  // Redirect to default view
  const view = project.defaultView === "LIST" ? "list" : "board";
  redirect(`/workspace/${workspaceId}/projects/${projectId}/${view}`);
}
