import Link from "next/link";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Kanban, List, FolderOpen } from "lucide-react";

interface ProjectsPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { workspaceId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sections: true } },
      sections: {
        include: {
          _count: { select: { tasks: true } },
        },
      },
    },
  });

  const projectsWithTaskCount = projects.map((p) => ({
    ...p,
    taskCount: p.sections.reduce((sum, s) => sum + s._count.tasks, 0),
  }));

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FolderOpen className="w-6 h-6 text-[var(--accent-primary)]" />
        <h1 className="text-2xl font-bold">All Projects</h1>
      </div>

      {projectsWithTaskCount.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-[var(--text-secondary)]">No projects yet. Create one from the workspace page.</p>
          <Link href={`/workspace/${workspaceId}`} className="btn btn-primary btn-sm mt-4">Go to Workspace</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projectsWithTaskCount.map((project) => (
            <div key={project.id} className="glass-card p-5 hover:border-[var(--glass-border-hover)] transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || "#6366f1" }} />
                <h3 className="text-lg font-semibold">{project.name}</h3>
              </div>
              <p className="text-sm text-[var(--text-tertiary)] mb-3 line-clamp-2">
                {project.description || "No description"}
              </p>
              <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] mb-4">
                <span>{project._count.sections} sections</span>
                <span>•</span>
                <span>{project.taskCount} tasks</span>
                <span>•</span>
                <span className="capitalize">{project.status.toLowerCase()}</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/workspace/${workspaceId}/projects/${project.id}/board`} className="btn btn-secondary btn-sm">
                  <Kanban className="w-3.5 h-3.5" /> Board
                </Link>
                <Link href={`/workspace/${workspaceId}/projects/${project.id}/list`} className="btn btn-ghost btn-sm">
                  <List className="w-3.5 h-3.5" /> List
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
