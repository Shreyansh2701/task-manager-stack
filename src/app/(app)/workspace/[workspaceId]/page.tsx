import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import CreateProjectModal from "@/components/workspace/CreateProjectModal";
import ProjectCardGrid from "@/components/workspace/ProjectCardGrid";
import { FolderKanban } from "lucide-react";

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: session.user.id },
    include: { workspace: true },
  });

  if (!membership) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Workspace not found or access denied.</p>
        <Link href="/dashboard" className="btn btn-primary btn-sm mt-4">Back to Dashboard</Link>
      </div>
    );
  }

  const workspace = membership.workspace;
  const isAdmin = membership.role === "OWNER" || membership.role === "ADMIN";

  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
        include: { _count: { select: { tasks: true } } },
      },
    },
  });

  const serializedProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    color: p.color,
    defaultView: p.defaultView,
    sectionCount: p.sections.length,
    taskCount: p.sections.reduce((sum, s) => sum + s._count.tasks, 0),
  }));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Workspace Header */}
      <div className="flex items-center justify-between animate-floatIn">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{workspace.name}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <CreateProjectModal workspaceId={workspace.id} />
      </div>

      {/* Project Grid */}
      {projects.length === 0 ? (
        <div className="glass-card p-16 text-center animate-floatIn stagger-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.1) 0%, rgba(168,85,247,0.05) 100%)' }}>
            <FolderKanban className="w-8 h-8 text-[var(--accent-primary)]" />
          </div>
          <h3 className="text-lg font-bold tracking-tight mb-2">No projects yet</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">Create your first project to start organizing tasks.</p>
          <CreateProjectModal workspaceId={workspace.id} />
        </div>
      ) : (
        <ProjectCardGrid
          projects={serializedProjects}
          workspaceId={workspace.id}
          canDelete={isAdmin}
        />
      )}
    </div>
  );
}
