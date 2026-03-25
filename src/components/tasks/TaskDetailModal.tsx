"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Calendar,
  Flag,
  Users,
  CheckSquare,
  MessageSquare,
  Clock,
  Trash2,
  Plus,
  Send,
  UserPlus,
  Check,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
}

interface Subtask {
  id: string;
  title: string;
  status: string;
  assignees: { user: User }[];
}

interface TimeEntry {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  user: User;
}

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  position: number;
  sectionId: string;
  assignees: { user: User }[];
  subtasks: Subtask[];
  comments: Comment[];
  attachments: { id: string; fileName: string; fileUrl: string; fileSize: number; mimeType: string; createdAt: string }[];
  timeEntries: TimeEntry[];
  section: { id: string; name: string; projectId: string };
}

interface TaskDetailModalProps {
  taskId: string;
  workspaceId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const statuses = [
  { value: "TODO", label: "To Do", dotClass: "status-dot-todo" },
  { value: "IN_PROGRESS", label: "In Progress", dotClass: "status-dot-in-progress" },
  { value: "IN_REVIEW", label: "In Review", dotClass: "status-dot-in-review" },
  { value: "DONE", label: "Done", dotClass: "status-dot-done" },
];

const priorities = [
  { value: "NONE", label: "None", color: "" },
  { value: "LOW", label: "Low", color: "text-blue-400" },
  { value: "MEDIUM", label: "Medium", color: "text-yellow-400" },
  { value: "HIGH", label: "High", color: "text-orange-400" },
  { value: "URGENT", label: "Urgent", color: "text-red-400" },
];

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function TaskDetailModal({ taskId, workspaceId, onClose, onUpdated }: TaskDetailModalProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [commentText, setCommentText] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "time">("details");
  const [projectSections, setProjectSections] = useState<{ id: string; name: string }[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const fetchTask = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
        setTitle(data.task.title);
        setDescription(data.task.description || "");

        // Fetch project sections for status-to-section mapping
        const projectId = data.task.section?.projectId || data.task.section?.project?.id;
        if (projectId && projectSections.length === 0) {
          const secRes = await fetch(`/api/sections?projectId=${encodeURIComponent(projectId)}`);
          if (secRes.ok) {
            const secData = await secRes.json();
            setProjectSections((secData.sections || []).map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })));
          }
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // Fetch workspace members for assignee picker
  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/members`);
        if (res.ok) {
          const data = await res.json();
          setWorkspaceMembers((data.members || []).map((m: { user: User }) => m.user));
        }
      } catch { /* silent */ }
    })();
  }, [workspaceId]);

  async function toggleAssignee(userId: string) {
    if (!task) return;
    const currentIds = task.assignees.map((a) => a.user.id);
    const newIds = currentIds.includes(userId)
      ? currentIds.filter((id) => id !== userId)
      : [...currentIds, userId];
    await updateField("assigneeIds", newIds);
  }

  async function updateField(field: string, value: unknown) {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { [field]: value };

      // When changing status, also move the task to the matching section
      if (field === "status" && task && projectSections.length > 0) {
        const statusToSectionName: Record<string, string> = {
          TODO: "to do",
          IN_PROGRESS: "in progress",
          IN_REVIEW: "in review",
          DONE: "done",
        };
        const targetName = statusToSectionName[value as string];
        if (targetName) {
          const targetSection = projectSections.find(
            (s) => s.name.toLowerCase() === targetName
          );
          if (targetSection && targetSection.id !== task.sectionId) {
            body.sectionId = targetSection.id;
          }
        }
      }

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchTask();
        onUpdated();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleTitleBlur() {
    if (title !== task?.title && title.trim()) {
      await updateField("title", title.trim());
    }
  }

  async function handleDescBlur() {
    if (description !== (task?.description || "")) {
      await updateField("description", description || null);
    }
  }

  async function addComment() {
    if (!commentText.trim()) return;
    try {
      // Extract mentioned user IDs from @name patterns in the comment text
      const mentionedIds: string[] = [];
      const mentionPattern = /@([\w\s]+?)(?=\s@|\s*$|[^@\w])/g;
      let match;
      while ((match = mentionPattern.exec(commentText)) !== null) {
        const mentionName = match[1].trim().toLowerCase();
        const member = workspaceMembers.find(
          (m) => m.name.toLowerCase() === mentionName
        );
        if (member && member.id !== currentUserId && !mentionedIds.includes(member.id)) {
          mentionedIds.push(member.id);
        }
      }

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          content: commentText.trim(),
          mentions: mentionedIds.length > 0 ? mentionedIds : undefined,
        }),
      });
      if (res.ok) {
        setCommentText("");
        fetchTask();
      }
    } catch {
      // silent
    }
  }

  async function deleteComment(commentId: string) {
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        fetchTask();
      }
    } catch {
      // silent
    }
  }

  function handleCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setCommentText(val);
    const cursorPos = e.target.selectionStart;
    // Find the @ symbol before cursor
    const textBeforeCursor = val.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([\w\s]*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1].toLowerCase());
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  function insertMention(member: User) {
    const input = commentInputRef.current;
    if (!input) return;
    const cursorPos = input.selectionStart;
    const textBeforeCursor = commentText.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    if (atIndex === -1) return;
    const before = commentText.slice(0, atIndex);
    const after = commentText.slice(cursorPos);
    const mention = `@${member.name} `;
    const newText = before + mention + after;
    setCommentText(newText);
    setMentionQuery(null);
    // Restore focus and cursor
    setTimeout(() => {
      input.focus();
      const newCursor = before.length + mention.length;
      input.setSelectionRange(newCursor, newCursor);
    }, 0);
  }

  function handleCommentKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && filteredMentionMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => Math.min(i + 1, filteredMentionMembers.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMentionMembers[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey && mentionQuery === null) {
      e.preventDefault();
      addComment();
    }
  }

  const filteredMentionMembers = mentionQuery !== null
    ? workspaceMembers.filter(
        (m) =>
          m.name.toLowerCase().includes(mentionQuery) ||
          m.email.toLowerCase().includes(mentionQuery)
      )
    : [];

  // Render comment content with highlighted @mentions
  function renderCommentContent(content: string) {
    const memberNames = workspaceMembers.map((m) => m.name);
    if (memberNames.length === 0) return content;
    // Match @Name patterns
    const escapedNames = memberNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const mentionRegex = new RegExp(`(@(?:${escapedNames.join("|")}))(\\b|\\s|$)`, "gi");
    const parts = content.split(mentionRegex);
    if (parts.length === 1) return content;
    return parts.map((part, i) => {
      if (mentionRegex.test("@" + part.slice(1)) || memberNames.some((n) => part.toLowerCase() === `@${n.toLowerCase()}`)) {
        return (
          <span key={i} className="text-blue-400 font-medium bg-blue-500/10 rounded px-0.5">
            {part}
          </span>
        );
      }
      return part;
    });
  }

  async function addSubtask() {
    if (!newSubtaskTitle.trim() || !task) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: task.sectionId,
          title: newSubtaskTitle.trim(),
          parentTaskId: taskId,
        }),
      });
      if (res.ok) {
        setNewSubtaskTitle("");
        fetchTask();
        onUpdated();
      }
    } catch {
      // silent
    }
  }

  async function toggleSubtask(subtaskId: string, currentStatus: string) {
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    try {
      await fetch(`/api/tasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTask();
      onUpdated();
    } catch {
      // silent
    }
  }

  async function deleteTask() {
    if (!confirm("Delete this task?")) return;
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      onUpdated();
      onClose();
    } catch {
      // silent
    }
  }

  async function addTimeEntry() {
    const now = new Date();
    const startTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago
    try {
      await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
          description: "Manual entry",
        }),
      });
      fetchTask();
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md" style={{ background: 'var(--backdrop-bg)' }}>
        <div className="glass-card w-full max-w-3xl p-8" style={{ boxShadow: 'var(--shadow-xl)' }}>
          <div className="skeleton h-8 w-64 mb-4" />
          <div className="skeleton h-24 w-full mb-4" />
          <div className="skeleton h-6 w-32" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md" style={{ background: 'var(--backdrop-bg)' }}>
        <div className="glass-card p-8" style={{ boxShadow: 'var(--shadow-xl)' }}>
          <p className="text-red-400">Task not found</p>
          <button onClick={onClose} className="btn btn-ghost btn-sm mt-4">Close</button>
        </div>
      </div>
    );
  }

  const totalTime = task.timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4" style={{ background: 'var(--backdrop-bg)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="glass-card w-full max-w-3xl max-h-[90vh] flex flex-col animate-scaleIn" style={{ boxShadow: 'var(--shadow-xl)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`status-dot ${statuses.find((s) => s.value === task.status)?.dotClass}`} />
            <span className="text-xs font-medium text-[var(--text-tertiary)] bg-[var(--overlay-light)] px-2.5 py-1 rounded-lg border border-[var(--border-default)]">
              {task.section?.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={deleteTask} className="p-2 rounded-xl hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all duration-200" title="Delete task">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--overlay-light)] transition-all duration-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className="w-full text-xl font-bold bg-transparent border-none outline-none mb-4 focus:ring-0 tracking-tight"
            />

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Status */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Status</label>
                <select
                  value={task.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="input text-sm"
                >
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Priority</label>
                <select
                  value={task.priority}
                  onChange={(e) => updateField("priority", e.target.value)}
                  className="input text-sm"
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs text-[var(--text-tertiary)] mb-1 block flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Due Date
                </label>
                <input
                  type="date"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => updateField("dueDate", e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="input text-sm"
                />
              </div>

              {/* Assignees */}
              <div className="relative">
                <label className="text-xs text-[var(--text-tertiary)] mb-1 block flex items-center gap-1">
                  <Users className="w-3 h-3" /> Assignees
                </label>
                <div
                  className="flex items-center gap-1 flex-wrap cursor-pointer group min-h-[32px] px-2 py-1 rounded-lg hover:bg-[var(--overlay-light)] transition-colors"
                  onClick={() => setShowAssigneePicker(!showAssigneePicker)}
                >
                  {task.assignees.map((a) => (
                    <div key={a.user.id} className="flex items-center gap-1 bg-[var(--overlay-light)] rounded-full px-2 py-1">
                      <Avatar name={a.user.name} avatar={a.user.avatar} size="sm" />
                      <span className="text-xs">{a.user.name}</span>
                    </div>
                  ))}
                  {task.assignees.length === 0 && (
                    <span className="text-xs text-[var(--text-tertiary)]">Click to assign</span>
                  )}
                  <UserPlus className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] ml-auto transition-colors" />
                </div>

                {/* Assignee Picker Dropdown */}
                {showAssigneePicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass-card p-1 z-50 max-h-48 overflow-y-auto">
                    {workspaceMembers.length === 0 && (
                      <div className="px-3 py-2 text-xs text-[var(--text-tertiary)]">No members found</div>
                    )}
                    {workspaceMembers.map((member) => {
                      const isAssigned = task.assignees.some((a) => a.user.id === member.id);
                      return (
                        <button
                          key={member.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAssignee(member.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--overlay-heavy)] transition-colors"
                        >
                          <Avatar name={member.name} avatar={member.avatar} size="sm" />
                          <div className="flex-1 text-left min-w-0">
                            <div className="text-sm truncate">{member.name}</div>
                            <div className="text-xs text-[var(--text-tertiary)] truncate">{member.email}</div>
                          </div>
                          {isAssigned && <Check className="w-4 h-4 text-green-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="text-xs text-[var(--text-tertiary)] mb-1 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescBlur}
                placeholder="Add a description..."
                className="input text-sm min-h-[100px] resize-y"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-5 border-b border-[var(--border-default)] mb-5">
              {(["details", "comments", "time"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-all duration-300 ${
                    activeTab === tab
                      ? "border-[var(--accent-primary)] text-white"
                      : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {tab === "details" && (
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      Subtasks ({task.subtasks.length})
                    </span>
                  )}
                  {tab === "comments" && (
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Comments ({task.comments.length})
                    </span>
                  )}
                  {tab === "time" && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Time {totalTime > 0 ? `(${formatDuration(totalTime)})` : ""}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Subtasks Tab */}
            {activeTab === "details" && (
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--overlay-subtle)]">
                    <button
                      onClick={() => toggleSubtask(subtask.id, subtask.status)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        subtask.status === "DONE"
                          ? "bg-[var(--accent-success)] border-[var(--accent-success)]"
                          : "border-[var(--border-default)] hover:border-[var(--accent-primary)]"
                      }`}
                    >
                      {subtask.status === "DONE" && <span className="text-white text-xs">✓</span>}
                    </button>
                    <span className={`text-sm flex-1 ${subtask.status === "DONE" ? "line-through text-[var(--text-tertiary)]" : ""}`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                    placeholder="Add a subtask..."
                    className="input text-sm flex-1"
                  />
                  <button onClick={addSubtask} className="btn btn-primary btn-sm" disabled={!newSubtaskTitle.trim()}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === "comments" && (
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <Avatar name={comment.user.name} avatar={comment.user.avatar} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{comment.user.name}</span>
                        <span className="text-xs text-[var(--text-tertiary)]">{timeAgo(new Date(comment.createdAt))}</span>
                        {comment.user.id === currentUserId && (
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="ml-auto opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">{renderCommentContent(comment.content)}</p>
                    </div>
                  </div>
                ))}

                <div className="relative mt-4">
                  <div className="flex gap-2">
                    <textarea
                      ref={commentInputRef}
                      value={commentText}
                      onChange={handleCommentChange}
                      onKeyDown={handleCommentKeyDown}
                      onBlur={() => setTimeout(() => setMentionQuery(null), 200)}
                      placeholder="Write a comment... Type @ to mention"
                      className="input text-sm flex-1 min-h-[40px] max-h-[120px] resize-none"
                      rows={1}
                    />
                    <button onClick={addComment} className="btn btn-primary btn-sm self-end" disabled={!commentText.trim()}>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mention Dropdown */}
                  {mentionQuery !== null && filteredMentionMembers.length > 0 && (
                    <div className="absolute bottom-full left-0 right-12 mb-1 glass-card p-1 z-50 max-h-40 overflow-y-auto">
                      <div className="px-2 py-1 text-xs text-[var(--text-tertiary)] font-medium">Members</div>
                      {filteredMentionMembers.map((member, idx) => (
                        <button
                          key={member.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            insertMention(member);
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                            idx === mentionIndex
                              ? "bg-[var(--overlay-heavy)] text-[var(--text-primary)]"
                              : "hover:bg-[var(--overlay-light)] text-[var(--text-secondary)]"
                          }`}
                        >
                          <Avatar name={member.name} avatar={member.avatar} size="sm" />
                          <div className="flex-1 text-left min-w-0">
                            <span className="truncate">{member.name}</span>
                          </div>
                          <span className="text-xs text-[var(--text-tertiary)] truncate">{member.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Time Tab */}
            {activeTab === "time" && (
              <div className="space-y-3">
                {totalTime > 0 && (
                  <div className="text-sm text-[var(--text-secondary)] mb-2">
                    Total: <span className="font-semibold text-[var(--text-primary)]">{formatDuration(totalTime)}</span>
                  </div>
                )}

                {task.timeEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 px-3 py-2 glass-card-sm">
                    <Avatar name={entry.user.name} avatar={entry.user.avatar} size="sm" />
                    <div className="flex-1">
                      <div className="text-sm">{entry.description || "Time entry"}</div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        {new Date(entry.startTime).toLocaleDateString()} · {entry.duration ? formatDuration(entry.duration) : "Running..."}
                      </div>
                    </div>
                  </div>
                ))}

                <button onClick={addTimeEntry} className="btn btn-secondary btn-sm">
                  <Plus className="w-4 h-4" />
                  Add 30min entry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
