import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import ListView from "@/components/tasks/ListView";
import { Kanban, List, Calendar, BarChart3 } from "lucide-react";

interface ProjectListPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default async function ProjectListPage({ params }: ProjectListPageProps) {
  const { workspaceId, projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Project not found.</p>
        <Link href={`/workspace/${workspaceId}`} className="btn btn-primary btn-sm mt-4">Back</Link>
      </div>
    );
  }

  const basePath = `/workspace/${workspaceId}/projects/${projectId}`;

  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-default)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{project.name}</h2>
          {project.description && (
            <span className="text-xs text-[var(--text-tertiary)] hidden md:inline">— {project.description}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link href={`${basePath}/board`} className="btn btn-ghost btn-sm">
            <Kanban className="w-4 h-4" /> Board
          </Link>
          <Link href={`${basePath}/list`} className="btn btn-sm bg-[var(--bg-active)] text-[var(--text-primary)]">
            <List className="w-4 h-4" /> List
          </Link>
          <Link href={`${basePath}/calendar`} className="btn btn-ghost btn-sm">
            <Calendar className="w-4 h-4" /> Calendar
          </Link>
          <Link href={`${basePath}/analytics`} className="btn btn-ghost btn-sm">
            <BarChart3 className="w-4 h-4" /> Analytics
          </Link>
        </div>
      </div>

      {/* List View */}
      <div className="flex-1 p-4 overflow-y-auto">
        <ListView projectId={projectId} workspaceId={workspaceId} />
      </div>
    </div>
  );
}
