"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hash, ArrowRight, Trash2, MoreVertical } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  defaultView: string;
  sectionCount: number;
  taskCount: number;
}

interface ProjectCardGridProps {
  projects: Project[];
  workspaceId: string;
  canDelete: boolean;
}

export default function ProjectCardGrid({ projects, workspaceId, canDelete }: ProjectCardGridProps) {
  const router = useRouter();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(projectId: string, projectName: string) {
    if (!confirm(`Delete project "${projectName}"? This will permanently remove all tasks, sections, and data in this project.`)) {
      return;
    }

    setDeleting(projectId);
    setMenuOpenId(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete project");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <div
          key={project.id}
          className={`glass-card glass-card-lift glass-glow p-5 group relative cursor-pointer ${
            deleting === project.id ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Link
            href={`/workspace/${workspaceId}/projects/${project.id}/${project.defaultView === "LIST" ? "list" : "board"}`}
            className="block"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: project.color, color: project.color }} />
                <h3 className="font-bold tracking-tight">{project.name}</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
            </div>
            {project.description && (
              <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{project.description}</p>
            )}
            <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--text-tertiary)]">
              <span>{project.sectionCount} sections</span>
              <span className="w-1 h-1 rounded-full bg-[var(--overlay-strong)]"></span>
              <span>{project.taskCount} tasks</span>
              <span className="w-1 h-1 rounded-full bg-[var(--overlay-strong)]"></span>
              <span>{project.defaultView === "BOARD" ? "Kanban" : "List"}</span>
            </div>
          </Link>

          {/* Context Menu Button */}
          {canDelete && (
            <div className="absolute top-3 right-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === project.id ? null : project.id);
                }}
                className="p-1.5 rounded-xl hover:bg-[var(--overlay-medium)] text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-all duration-200"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpenId === project.id && (
                <>
                  {/* Backdrop to close menu */}
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                  <div className="absolute right-0 top-8 z-20 w-48 glass-card py-1.5 animate-slideUp" style={{ boxShadow: 'var(--shadow-xl)' }}>
                    <Link
                      href={`/workspace/${workspaceId}/projects/${project.id}/board`}
                      className="flex items-center gap-2 px-3 py-2.5 mx-1.5 rounded-xl text-sm hover:bg-[var(--overlay-light)] transition-all duration-200"
                      onClick={() => setMenuOpenId(null)}
                    >
                      Open Board
                    </Link>
                    <Link
                      href={`/workspace/${workspaceId}/projects/${project.id}/list`}
                      className="flex items-center gap-2 px-3 py-2.5 mx-1.5 rounded-xl text-sm hover:bg-[var(--overlay-light)] transition-all duration-200"
                      onClick={() => setMenuOpenId(null)}
                    >
                      Open List
                    </Link>
                    <hr className="border-[var(--border-default)] my-1" />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(project.id, project.name);
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 mx-1.5 rounded-xl text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200 w-[calc(100%-12px)] text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Project
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
