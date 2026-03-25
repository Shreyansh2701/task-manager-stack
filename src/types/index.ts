import { Role, TaskStatus, TaskPriority, NotificationType } from "@/generated/prisma/client";

// ─── API Response Types ──────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── User Types ──────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

// ─── Workspace Types ─────────────────────────────────────

export interface WorkspaceWithRole {
  id: string;
  name: string;
  slug: string;
  role: Role;
  memberCount: number;
}

// ─── Task Types ──────────────────────────────────────────

export interface TaskWithRelations {
  id: string;
  sectionId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  position: number;
  assignees: UserProfile[];
  subtaskCount: number;
  commentCount: number;
  attachmentCount: number;
}

export interface SectionWithTasks {
  id: string;
  name: string;
  position: number;
  tasks: TaskWithRelations[];
}

// ─── Socket Events ───────────────────────────────────────

export interface SocketEvents {
  "task:created": { task: TaskWithRelations; sectionId: string };
  "task:updated": { task: Partial<TaskWithRelations> & { id: string } };
  "task:moved": { taskId: string; fromSectionId: string; toSectionId: string; position: number };
  "task:deleted": { taskId: string; sectionId: string };
  "comment:added": { taskId: string; comment: { id: string; content: string; user: UserProfile; createdAt: string } };
  "member:joined": { user: UserProfile; workspaceId: string };
  "notification:new": { notification: { id: string; type: NotificationType; title: string; message: string | null; createdAt: string } };
}

// ─── Priority Config ─────────────────────────────────────

export const PRIORITY_CONFIG = {
  NONE: { label: "No priority", color: "#6b7280", icon: "minus" },
  LOW: { label: "Low", color: "#3b82f6", icon: "arrow-down" },
  MEDIUM: { label: "Medium", color: "#f59e0b", icon: "arrow-right" },
  HIGH: { label: "High", color: "#f97316", icon: "arrow-up" },
  URGENT: { label: "Urgent", color: "#ef4444", icon: "alert-circle" },
} as const;

export const STATUS_CONFIG = {
  TODO: { label: "To Do", color: "#6b7280" },
  IN_PROGRESS: { label: "In Progress", color: "#3b82f6" },
  IN_REVIEW: { label: "In Review", color: "#f59e0b" },
  DONE: { label: "Done", color: "#22c55e" },
} as const;
