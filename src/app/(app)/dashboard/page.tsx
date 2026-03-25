import Link from "next/link";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FolderKanban, CheckCircle2, Clock, Users, ArrowRight, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          projects: {
            where: { status: "ACTIVE" },
            take: 5,
            orderBy: { updatedAt: "desc" },
          },
          _count: { select: { members: true } },
        },
      },
    },
  });

  const workspaces = memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
    memberCount: m.workspace._count.members,
  }));

  // Get recent tasks assigned to user
  const recentTasks = await prisma.task.findMany({
    where: {
      assignees: { some: { userId } },
      isArchived: false,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: {
      section: { include: { project: { include: { workspace: true } } } },
    },
  });

  // Get task stats
  const taskStats = await prisma.task.groupBy({
    by: ["status"],
    where: {
      assignees: { some: { userId } },
      isArchived: false,
    },
    _count: true,
  });

  const totalTasks = taskStats.reduce((sum, s) => sum + s._count, 0);
  const doneTasks = taskStats.find((s) => s.status === "DONE")?._count || 0;
  const inProgressTasks = taskStats.find((s) => s.status === "IN_PROGRESS")?._count || 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between animate-floatIn">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome back, {session.user.name || "there"} 👋</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">Here&apos;s what&apos;s happening across your workspaces.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card glass-card-lift glass-glow p-5 animate-floatIn stagger-1 cursor-default">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_0_16px_rgba(96,165,250,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.15) 0%, rgba(96,165,250,0.05) 100%)' }}>
              <FolderKanban className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">{totalTasks}</div>
              <div className="text-xs text-[var(--text-tertiary)] font-medium">Total Tasks</div>
            </div>
          </div>
        </div>
        <div className="glass-card glass-card-lift glass-glow p-5 animate-floatIn stagger-2 cursor-default">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_0_16px_rgba(251,191,36,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 100%)' }}>
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">{inProgressTasks}</div>
              <div className="text-xs text-[var(--text-tertiary)] font-medium">In Progress</div>
            </div>
          </div>
        </div>
        <div className="glass-card glass-card-lift glass-glow p-5 animate-floatIn stagger-3 cursor-default">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_0_16px_rgba(52,211,153,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(52,211,153,0.05) 100%)' }}>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">{doneTasks}</div>
              <div className="text-xs text-[var(--text-tertiary)] font-medium">Completed</div>
            </div>
          </div>
        </div>
        <div className="glass-card glass-card-lift glass-glow p-5 animate-floatIn stagger-4 cursor-default">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-[0_0_16px_rgba(168,85,247,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0.05) 100%)' }}>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">{workspaces.length}</div>
              <div className="text-xs text-[var(--text-tertiary)] font-medium">Workspaces</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 animate-floatIn stagger-5">
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <h2 className="text-sm font-semibold tracking-tight">My Recent Tasks</h2>
            </div>
            {recentTasks.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[var(--text-tertiary)]">
                No tasks assigned to you yet. Create or join a project to get started.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-default)]">
                {recentTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/workspace/${task.section.project.workspace.id}/projects/${task.section.project.id}/board`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--overlay-subtle)] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`status-dot ${
                        task.status === "DONE" ? "status-dot-done" :
                        task.status === "IN_PROGRESS" ? "status-dot-in-progress" :
                        task.status === "IN_REVIEW" ? "status-dot-in-review" :
                        "status-dot-todo"
                      }`} />
                      <div className="min-w-0">
                        <div className={`text-sm truncate ${task.status === "DONE" ? "line-through text-[var(--text-tertiary)]" : ""}`}>
                          {task.title}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {task.section.project.name}
                        </div>
                      </div>
                    </div>
                    {task.dueDate && (
                      <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0 ml-2">
                        {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Workspaces */}
        <div className="animate-floatIn stagger-6">
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-default)]">
              <h2 className="text-sm font-semibold tracking-tight">Workspaces</h2>
            </div>
            {workspaces.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-[var(--text-tertiary)]">
                No workspaces yet. Create one to get started.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-default)]">
                {workspaces.map((workspace) => (
                  <Link
                    key={workspace.id}
                    href={`/workspace/${workspace.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[var(--overlay-subtle)] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-[0_2px_12px_rgba(124,92,252,0.2)]" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, #a855f7 100%)' }}>
                        {workspace.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{workspace.name}</div>
                        <div className="text-xs text-[var(--text-tertiary)]">
                          {workspace.memberCount} members · {workspace.projects.length} projects
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
