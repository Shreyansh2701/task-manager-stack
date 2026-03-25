"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight, Plus, Clock, MessageSquare, CheckSquare } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import TaskDetailModal from "./TaskDetailModal";
import CreateTaskInline from "./CreateTaskInline";

interface TaskAssignee {
  user: { id: string; name: string; email: string; avatar: string | null };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  position: number;
  sectionId: string;
  assignees: TaskAssignee[];
  subtasks?: { id: string; status: string }[];
  _count?: { comments: number; attachments: number };
}

interface Section {
  id: string;
  name: string;
  position: number;
  tasks: Task[];
}

interface ListViewProps {
  projectId: string;
  workspaceId: string;
}

const statusColors: Record<string, string> = {
  TODO: "status-dot-todo",
  IN_PROGRESS: "status-dot-in-progress",
  IN_REVIEW: "status-dot-in-review",
  DONE: "status-dot-done",
};

const priorityIcons: Record<string, { label: string; color: string }> = {
  URGENT: { label: "!!!", color: "text-red-400" },
  HIGH: { label: "!!", color: "text-orange-400" },
  MEDIUM: { label: "!", color: "text-yellow-400" },
  LOW: { label: "↓", color: "text-blue-400" },
  NONE: { label: "", color: "" },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (diff < 0) return { text: formatted, color: "text-red-400" };
  if (diff === 0) return { text: "Today", color: "text-orange-400" };
  if (diff === 1) return { text: "Tomorrow", color: "text-yellow-400" };
  return { text: formatted, color: "text-[var(--text-tertiary)]" };
}

export default function ListView({ projectId, workspaceId }: ListViewProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchSections = useCallback(async () => {
    try {
      const res = await fetch(`/api/sections?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  function toggleSection(sectionId: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

  async function toggleTaskStatus(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchSections();
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="skeleton h-8 w-32 mb-2" />
            <div className="space-y-1">
              <div className="skeleton h-12 w-full rounded-lg" />
              <div className="skeleton h-12 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {sections.map((section) => {
          const isCollapsed = collapsedSections.has(section.id);
          const doneCount = section.tasks.filter((t) => t.status === "DONE").length;

          return (
            <div key={section.id}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="flex items-center gap-2.5 w-full mb-3 group"
              >
                <span className="transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)' }}>
                  <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                </span>
                <h3 className="text-sm font-semibold tracking-tight">{section.name}</h3>
                <span className="text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--overlay-light)] px-2 py-0.5 rounded-full">
                  {doneCount}/{section.tasks.length}
                </span>
                {section.tasks.length > 0 && (
                  <div className="flex-1 mx-3 h-1.5 bg-[var(--overlay-light)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(doneCount / section.tasks.length) * 100}%`, background: 'linear-gradient(90deg, var(--accent-success) 0%, #6ee7b7 100%)' }}
                    />
                  </div>
                )}
              </button>

              {/* Task List */}
              {!isCollapsed && (
                <div className="space-y-0.5 ml-6">
                  {/* Column Headers */}
                  <div className="grid grid-cols-[1fr,100px,100px,80px,80px] gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)] border-b border-[var(--border-default)]">
                    <span>Task</span>
                    <span>Status</span>
                    <span>Due</span>
                    <span>Priority</span>
                    <span>Assignee</span>
                  </div>

                  {section.tasks.map((task) => {
                    const due = task.dueDate ? formatDate(task.dueDate) : null;
                    const pri = priorityIcons[task.priority];
                    const subtasksDone = task.subtasks?.filter((s) => s.status === "DONE").length || 0;
                    const subtasksTotal = task.subtasks?.length || 0;

                    return (
                      <div
                        key={task.id}
                        className="grid grid-cols-[1fr,100px,100px,80px,80px] gap-2 px-3 py-2.5 rounded-xl hover:bg-[var(--overlay-subtle)] group cursor-pointer items-center transition-all duration-200"
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        {/* Title */}
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleTaskStatus(task.id, task.status); }}
                            className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all duration-300 ${
                              task.status === "DONE"
                                ? "border-[var(--accent-success)] shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                                : "border-[var(--border-default)] hover:border-[var(--accent-primary)] hover:shadow-[0_0_6px_rgba(124,92,252,0.2)]"
                            }`}
                            style={task.status === "DONE" ? { background: 'linear-gradient(135deg, var(--accent-success) 0%, #6ee7b7 100%)' } : {}}
                          >
                            {task.status === "DONE" && <span className="text-white text-[10px]">✓</span>}
                          </button>
                          <span className={`text-sm truncate ${task.status === "DONE" ? "line-through text-[var(--text-tertiary)]" : ""}`}>
                            {task.title}
                          </span>
                          {subtasksTotal > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-[var(--text-tertiary)]">
                              <CheckSquare className="w-3 h-3" />
                              {subtasksDone}/{subtasksTotal}
                            </span>
                          )}
                          {(task._count?.comments || 0) > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-[var(--text-tertiary)]">
                              <MessageSquare className="w-3 h-3" />
                              {task._count!.comments}
                            </span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-1.5">
                          <span className={`status-dot ${statusColors[task.status]}`} />
                          <span className="text-xs text-[var(--text-secondary)]">
                            {task.status.replace("_", " ")}
                          </span>
                        </div>

                        {/* Due */}
                        <div>
                          {due ? (
                            <span className={`text-xs ${due.color}`}>{due.text}</span>
                          ) : (
                            <span className="text-xs text-[var(--text-tertiary)]">—</span>
                          )}
                        </div>

                        {/* Priority */}
                        <div>
                          {pri.label ? (
                            <span className={`text-xs font-bold ${pri.color}`}>{pri.label}</span>
                          ) : (
                            <span className="text-xs text-[var(--text-tertiary)]">—</span>
                          )}
                        </div>

                        {/* Assignees */}
                        <div className="flex -space-x-1">
                          {task.assignees.slice(0, 2).map((a) => (
                            <Avatar key={a.user.id} name={a.user.name} avatar={a.user.avatar} size="sm" />
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <CreateTaskInline sectionId={section.id} onCreated={fetchSections} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          workspaceId={workspaceId}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={fetchSections}
        />
      )}
    </>
  );
}
