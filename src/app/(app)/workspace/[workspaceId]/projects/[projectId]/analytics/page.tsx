"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Kanban, List, Calendar, BarChart3, TrendingUp, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface TaskData {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  section?: { name: string };
}

interface SectionData {
  id: string;
  name: string;
  tasks: TaskData[];
}

export default function AnalyticsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { workspaceId, projectId } = params;
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/sections?projectId=${projectId}`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}`).then((r) => r.json()),
    ])
      .then(([sectionsData, projectData]) => {
        if (sectionsData.sections && Array.isArray(sectionsData.sections)) {
          setSections(sectionsData.sections);
        }
        if (projectData.project?.name) {
          setProjectName(projectData.project.name);
        }
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const allTasks = sections.flatMap((s) => s.tasks);
  const total = allTasks.length;
  const done = allTasks.filter((t) => t.status === "DONE").length;
  const inProgress = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const inReview = allTasks.filter((t) => t.status === "IN_REVIEW").length;
  const todo = allTasks.filter((t) => t.status === "TODO").length;

  const overdue = allTasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const priorityCounts = {
    URGENT: allTasks.filter((t) => t.priority === "URGENT" && t.status !== "DONE").length,
    HIGH: allTasks.filter((t) => t.priority === "HIGH" && t.status !== "DONE").length,
    MEDIUM: allTasks.filter((t) => t.priority === "MEDIUM" && t.status !== "DONE").length,
    LOW: allTasks.filter((t) => t.priority === "LOW" && t.status !== "DONE").length,
    NONE: allTasks.filter((t) => t.priority === "NONE" && t.status !== "DONE").length,
  };

  const basePath = `/workspace/${workspaceId}/projects/${projectId}`;

  // Status bar chart data
  const statusData = [
    { label: "To Do", count: todo, color: "bg-gray-500" },
    { label: "In Progress", count: inProgress, color: "bg-blue-500" },
    { label: "In Review", count: inReview, color: "bg-yellow-500" },
    { label: "Done", count: done, color: "bg-green-500" },
  ];

  const maxStatusCount = Math.max(...statusData.map((s) => s.count), 1);

  // Section distribution
  const sectionData = sections.map((s) => ({
    name: s.name,
    count: s.tasks.length,
    done: s.tasks.filter((t) => t.status === "DONE").length,
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Project Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-default)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{projectName || "Project"}</h2>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`${basePath}/board`} className="btn btn-ghost btn-sm">
            <Kanban className="w-4 h-4" /> Board
          </Link>
          <Link href={`${basePath}/list`} className="btn btn-ghost btn-sm">
            <List className="w-4 h-4" /> List
          </Link>
          <Link href={`${basePath}/calendar`} className="btn btn-ghost btn-sm">
            <Calendar className="w-4 h-4" /> Calendar
          </Link>
          <Link href={`${basePath}/analytics`} className="btn btn-sm bg-[var(--bg-active)] text-[var(--text-primary)]">
            <BarChart3 className="w-4 h-4" /> Analytics
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span className="text-xs text-[var(--text-tertiary)]">Total Tasks</span>
                </div>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-[var(--text-tertiary)]">Completed</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{done}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{completionRate}% done</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-[var(--text-tertiary)]">In Progress</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">{inProgress}</p>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-[var(--text-tertiary)]">Overdue</span>
                </div>
                <p className="text-2xl font-bold text-red-400">{overdue}</p>
              </div>
            </div>

            {/* Completion Progress */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold mb-4">Completion Progress</h3>
              <div className="relative h-4 bg-[var(--overlay-medium)] rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-[var(--accent-primary)] to-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-[var(--text-tertiary)]">
                <span>{done} of {total} tasks completed</span>
                <span className="font-semibold text-[var(--text-primary)]">{completionRate}%</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold mb-4">Tasks by Status</h3>
                <div className="space-y-3">
                  {statusData.map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)]">{s.label}</span>
                        <span className="font-medium">{s.count}</span>
                      </div>
                      <div className="h-2 bg-[var(--overlay-medium)] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${s.color} rounded-full transition-all duration-500`}
                          style={{ width: `${(s.count / maxStatusCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority Distribution */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold mb-4">Open Tasks by Priority</h3>
                <div className="space-y-3">
                  {Object.entries(priorityCounts).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          priority === "URGENT" ? "bg-red-500" :
                          priority === "HIGH" ? "bg-orange-500" :
                          priority === "MEDIUM" ? "bg-yellow-500" :
                          priority === "LOW" ? "bg-blue-500" : "bg-gray-500"
                        }`} />
                        <span className="text-sm text-[var(--text-secondary)] capitalize">{priority.toLowerCase()}</span>
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section Breakdown */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold mb-4">Tasks by Section</h3>
              {sectionData.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)]">No sections yet.</p>
              ) : (
                <div className="space-y-4">
                  {sectionData.map((s) => {
                    const pct = s.count > 0 ? Math.round((s.done / s.count) * 100) : 0;
                    return (
                      <div key={s.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--text-secondary)]">{s.name}</span>
                          <span className="text-[var(--text-tertiary)]">{s.done}/{s.count} done ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-[var(--overlay-medium)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
