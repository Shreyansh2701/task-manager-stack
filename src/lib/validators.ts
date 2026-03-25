import { z } from "zod";

// ─── Auth Validators ─────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must include uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Workspace Validators ────────────────────────────────

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["ADMIN", "MEMBER", "GUEST"]),
});

// ─── Project Validators ──────────────────────────────────

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Name cannot exceed 100 characters"),
  description: z.string().max(500).optional(),
  defaultView: z.enum(["BOARD", "LIST"]).default("BOARD"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color format"),
});

// ─── Task Validators ─────────────────────────────────────

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Title cannot exceed 200 characters"),
  description: z.string().max(5000).optional(),
  sectionId: z.string().cuid(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).default("NONE"),
  dueDate: z.string().datetime().optional(),
  assigneeIds: z.array(z.string().cuid()).optional(),
  parentTaskId: z.string().cuid().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  position: z.number().int().min(0).optional(),
});

export const moveTaskSchema = z.object({
  taskId: z.string().cuid(),
  toSectionId: z.string().cuid(),
  position: z.number().int().min(0),
});

// ─── Section Validators ──────────────────────────────────

export const createSectionSchema = z.object({
  name: z
    .string()
    .min(1, "Section name is required")
    .max(50, "Name cannot exceed 50 characters"),
  projectId: z.string().cuid(),
});

// ─── Comment Validators ──────────────────────────────────

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment cannot exceed 5000 characters"),
  mentions: z.array(z.string().cuid()).optional(),
});

// ─── Type exports ────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
