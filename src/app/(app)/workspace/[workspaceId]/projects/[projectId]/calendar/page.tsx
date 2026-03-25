"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Kanban, List, Calendar, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";

interface CalendarTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  section?: { name: string };
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-blue-500",
  NONE: "bg-gray-500",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { workspaceId, projectId } = params;
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tasks?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTasks(data.filter((t: CalendarTask) => t.dueDate));
        }
      })
      .finally(() => setLoading(false));

    fetch(`/api/sections?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.project) setProjectName(data.project);
      });
  }, [projectId]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter((t) => t.dueDate.startsWith(dateStr));
  };

  const isToday = (day: number) => {
    const now = new Date();
    return day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
  };

  const basePath = `/workspace/${workspaceId}/projects/${projectId}`;

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="min-h-[100px] border border-[var(--border-default)] bg-[var(--overlay-subtle)]" />);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dayTasks = getTasksForDay(day);
    cells.push(
      <div
        key={day}
        className={`min-h-[100px] border border-[var(--border-default)] p-1.5 ${
          isToday(day) ? "bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30" : "hover:bg-[var(--overlay-subtle)]"
        }`}
      >
        <div className={`text-xs font-medium mb-1 ${isToday(day) ? "text-[var(--accent-primary)]" : "text-[var(--text-tertiary)]"}`}>
          {day}
        </div>
        <div className="space-y-0.5">
          {dayTasks.slice(0, 3).map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate ${
                task.status === "DONE"
                  ? "line-through text-[var(--text-tertiary)] bg-[var(--overlay-subtle)]"
                  : "text-[var(--text-primary)] bg-[var(--overlay-medium)] hover:bg-[var(--overlay-heavy)]"
              }`}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${PRIORITY_COLORS[task.priority] || "bg-gray-500"}`} />
              {task.title}
            </button>
          ))}
          {dayTasks.length > 3 && (
            <div className="text-[10px] text-[var(--text-tertiary)] px-1">+{dayTasks.length - 3} more</div>
          )}
        </div>
      </div>
    );
  }

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
          <Link href={`${basePath}/calendar`} className="btn btn-sm bg-[var(--bg-active)] text-[var(--text-primary)]">
            <Calendar className="w-4 h-4" /> Calendar
          </Link>
          <Link href={`${basePath}/analytics`} className="btn btn-ghost btn-sm">
            <BarChart3 className="w-4 h-4" /> Analytics
          </Link>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="btn btn-ghost btn-sm p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold min-w-[200px] text-center">
            {MONTHS[month]} {year}
          </h3>
          <button onClick={nextMonth} className="btn btn-ghost btn-sm p-1">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <button onClick={today} className="btn btn-secondary btn-sm">Today</button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 px-6 pb-4 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : (
          <div>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-xs font-medium text-[var(--text-tertiary)] text-center py-2">{d}</div>
              ))}
            </div>
            {/* Grid */}
            <div className="grid grid-cols-7 border border-[var(--border-default)] rounded-lg overflow-hidden">
              {cells}
            </div>
          </div>
        )}
      </div>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          workspaceId={workspaceId}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={() => {
            fetch(`/api/tasks?projectId=${projectId}`)
              .then((r) => r.json())
              .then((data) => {
                if (Array.isArray(data)) setTasks(data.filter((t: CalendarTask) => t.dueDate));
              });
          }}
        />
      )}
    </div>
  );
}
