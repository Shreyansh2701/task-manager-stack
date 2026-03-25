"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Hash,
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
}

interface SidebarProps {
  workspaces: Workspace[];
  currentWorkspaceId?: string;
  projects: Project[];
  userName: string;
}

export default function Sidebar({ workspaces, currentWorkspaceId, projects, userName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0];

  useEffect(() => {
    setShowWorkspaceSwitcher(false);
  }, [pathname]);

  if (collapsed) {
    return (
      <aside className="w-16 h-screen flex flex-col items-center py-4 gap-2 border-r border-[var(--border-default)] bg-[var(--bg-secondary)]/80 backdrop-blur-xl flex-shrink-0 shadow-[var(--shadow-md)]">
        <button onClick={() => setCollapsed(false)} className="btn-icon btn-ghost p-2 hover:bg-[var(--overlay-medium)] rounded-xl transition-all duration-300">
          <PanelLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-[var(--overlay-medium)] to-transparent my-1" />
        <Link href="/dashboard" className="btn-icon btn-ghost p-2.5 hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary-hover)] rounded-xl transition-all duration-300" title="Dashboard">
          <LayoutDashboard className="w-5 h-5" />
        </Link>
        {currentWorkspace && (
          <Link href={`/workspace/${currentWorkspace.id}`} className="btn-icon btn-ghost p-2.5 hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary-hover)] rounded-xl transition-all duration-300" title="Workspace">
            <FolderKanban className="w-5 h-5" />
          </Link>
        )}
        {currentWorkspace && (
          <Link href={`/workspace/${currentWorkspace.id}/settings`} className="btn-icon btn-ghost p-2.5 hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary-hover)] rounded-xl transition-all duration-300" title="Settings">
            <Settings className="w-5 h-5" />
          </Link>
        )}
      </aside>
    );
  }

  return (
    <aside className="w-[var(--sidebar-width)] h-screen flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-secondary)]/80 backdrop-blur-xl flex-shrink-0 shadow-[var(--shadow-md)]">
      {/* Workspace Switcher */}
      <div className="p-3 border-b border-[var(--border-default)]">
        <div className="relative">
          <button
            onClick={() => setShowWorkspaceSwitcher(!showWorkspaceSwitcher)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--overlay-light)] transition-all duration-300 group"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-[0_2px_12px_rgba(124,92,252,0.3)]" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, #a855f7 100%)' }}>
              {currentWorkspace?.name?.[0]?.toUpperCase() || "W"}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold truncate tracking-tight">{currentWorkspace?.name || "Select workspace"}</div>
              <div className="text-[11px] text-[var(--text-tertiary)] truncate">{userName}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-300 group-hover:text-[var(--text-secondary)]" style={{ transform: showWorkspaceSwitcher ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>

          {showWorkspaceSwitcher && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 animate-slideUp" style={{ boxShadow: 'var(--shadow-xl)' }}>
              {workspaces.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/workspace/${ws.id}`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    ws.id === currentWorkspaceId ? "bg-[var(--accent-primary)]/10 text-[var(--text-primary)] border border-[var(--accent-primary)]/20" : "hover:bg-[var(--overlay-light)] text-[var(--text-secondary)]"
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, #a855f7 100%)' }}>
                    {ws.name[0]?.toUpperCase()}
                  </div>
                  <span className="truncate">{ws.name}</span>
                </Link>
              ))}
              <hr className="border-[var(--border-default)] my-1.5" />
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-[var(--overlay-light)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Create workspace
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            pathname === "/dashboard"
              ? "bg-[var(--accent-primary)]/10 text-[var(--text-primary)] shadow-[0_0_16px_rgba(124,92,252,0.1)] border border-[var(--accent-primary)]/15"
              : "hover:bg-[var(--overlay-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>

        {currentWorkspace && (
          <>
            {/* Projects Section */}
            <div className="pt-5">
              <button
                onClick={() => setProjectsOpen(!projectsOpen)}
                className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] w-full transition-colors duration-200"
              >
                <span className="transition-transform duration-200" style={{ transform: projectsOpen ? 'rotate(0)' : 'rotate(-90deg)' }}><ChevronDown className="w-3 h-3" /></span>
                Projects
              </button>

              {projectsOpen && (
                <div className="mt-1.5 space-y-0.5">
                  {projects.map((project) => {
                    const isActive = pathname.includes(`/projects/${project.id}`);
                    return (
                      <Link
                        key={project.id}
                        href={`/workspace/${currentWorkspaceId}/projects/${project.id}/board`}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                          isActive
                            ? "bg-[var(--overlay-medium)] text-[var(--text-primary)]"
                            : "hover:bg-[var(--overlay-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_6px_currentColor]" style={{ backgroundColor: project.color, color: project.color }} />
                        <span className="truncate">{project.name}</span>
                      </Link>
                    );
                  })}
                  <Link
                    href={`/workspace/${currentWorkspaceId}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[var(--overlay-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all duration-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New project
                  </Link>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="pt-2">
              <Link
                href={`/workspace/${currentWorkspaceId}/settings`}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  pathname.includes("/settings")
                    ? "bg-[var(--accent-primary)]/10 text-[var(--text-primary)] shadow-[0_0_16px_rgba(124,92,252,0.1)] border border-[var(--accent-primary)]/15"
                    : "hover:bg-[var(--overlay-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* Collapse Button */}
      <div className="p-3 border-t border-[var(--border-default)]">
        <button
          onClick={() => setCollapsed(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm hover:bg-[var(--overlay-light)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] w-full transition-all duration-300"
        >
          <PanelLeftClose className="w-4 h-4" />
          Collapse
        </button>
      </div>
    </aside>
  );
}
