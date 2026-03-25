"use client";

import { useState } from "react";
import { Clock, MessageSquare, Paperclip, CheckSquare } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

interface TaskAssignee {
  user: { id: string; name: string; email: string; avatar: string | null };
}

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: string | null;
    position: number;
    assignees: TaskAssignee[];
    subtasks?: { id: string; status: string }[];
    _count?: { comments: number; attachments: number };
  };
  onClick?: () => void;
  isDragging?: boolean;
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-blue-500",
  NONE: "bg-transparent",
};

const priorityLabels: Record<string, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  NONE: "",
};

function formatDueDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (diffDays < 0) return { text: formatted, className: "text-red-400" };
  if (diffDays === 0) return { text: "Today", className: "text-orange-400" };
  if (diffDays === 1) return { text: "Tomorrow", className: "text-yellow-400" };
  if (diffDays <= 7) return { text: formatted, className: "text-blue-400" };
  return { text: formatted, className: "text-[var(--text-tertiary)]" };
}

export default function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const subtasksDone = task.subtasks?.filter((s) => s.status === "DONE").length || 0;
  const subtasksTotal = task.subtasks?.length || 0;
  const commentCount = task._count?.comments || 0;
  const attachmentCount = task._count?.attachments || 0;
  const due = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <div
      onClick={onClick}
      className={`glass-card-sm p-3.5 cursor-pointer hover:border-[var(--glass-border-hover)] hover:shadow-[var(--shadow-md)] transition-all duration-300 group ${
        isDragging ? "opacity-50 rotate-2 shadow-[var(--shadow-xl)]" : "hover:-translate-y-0.5"
      }`}
    >
      {/* Priority bar */}
      {task.priority !== "NONE" && (
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className={`w-2 h-2 rounded-full ${priorityColors[task.priority]} shadow-[0_0_6px_currentColor]`} />
          <span className="text-[11px] font-medium text-[var(--text-tertiary)]">{priorityLabels[task.priority]}</span>
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium leading-snug mb-1.5 group-hover:text-[var(--text-primary)] transition-colors duration-200 tracking-tight">
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-[var(--text-tertiary)] mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* Metadata row */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--border-default)]">
        <div className="flex items-center gap-2.5">
          {/* Due date */}
          {due && (
            <div className={`flex items-center gap-1 text-xs ${due.className}`}>
              <Clock className="w-3 h-3" />
              {due.text}
            </div>
          )}

          {/* Subtasks */}
          {subtasksTotal > 0 && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
              <CheckSquare className="w-3 h-3" />
              {subtasksDone}/{subtasksTotal}
            </div>
          )}

          {/* Comments */}
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
              <MessageSquare className="w-3 h-3" />
              {commentCount}
            </div>
          )}

          {/* Attachments */}
          {attachmentCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
              <Paperclip className="w-3 h-3" />
              {attachmentCount}
            </div>
          )}
        </div>

        {/* Assignees */}
        {task.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((a) => (
              <Avatar key={a.user.id} name={a.user.name} avatar={a.user.avatar} size="sm" />
            ))}
            {task.assignees.length > 3 && (
              <div className="avatar avatar-sm text-[10px] bg-[var(--bg-elevated)]">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
