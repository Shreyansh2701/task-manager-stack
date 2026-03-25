"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import TaskCard from "./TaskCard";
import CreateTaskInline from "./CreateTaskInline";
import TaskDetailModal from "./TaskDetailModal";

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

interface KanbanBoardProps {
  projectId: string;
  workspaceId: string;
}

function sectionNameToStatus(name: string): string | null {
  const n = name.toLowerCase().replace(/[^a-z ]/g, "").trim();
  if (n === "to do" || n === "todo" || n === "backlog") return "TODO";
  if (n === "in progress" || n === "doing" || n === "wip") return "IN_PROGRESS";
  if (n === "in review" || n === "review" || n === "testing" || n === "qa") return "IN_REVIEW";
  if (n === "done" || n === "complete" || n === "completed" || n === "finished") return "DONE";
  return null;
}

function SortableTaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task, sectionId: task.sectionId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        // Only fire click if this wasn't a drag
        if (!isDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <TaskCard task={task} onClick={() => {}} isDragging={isDragging} />
    </div>
  );
}

function DroppableColumn({
  section,
  children,
  onDeleteSection,
  onRenameSection,
}: {
  section: Section;
  children: React.ReactNode;
  onDeleteSection: (sectionId: string) => void;
  onRenameSection: (sectionId: string, newName: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameName, setRenameName] = useState(section.name);
  const taskIds = section.tasks.map((t) => t.id);

  function startRename() {
    setRenameName(section.name);
    setRenaming(true);
    setMenuOpen(false);
  }

  function submitRename() {
    const trimmed = renameName.trim();
    if (trimmed && trimmed !== section.name) {
      onRenameSection(section.id, trimmed);
    }
    setRenaming(false);
  }

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          {renaming ? (
            <input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") setRenaming(false);
              }}
              className="input text-sm py-0.5 px-1.5 w-36"
              autoFocus
            />
          ) : (
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] tracking-tight">{section.name}</h3>
          )}
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--overlay-light)] px-2 py-0.5 rounded-full border border-[var(--border-default)]">
            {section.tasks.length}
          </span>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-[var(--overlay-light)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all duration-200"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-44 glass-card py-1.5 animate-slideUp" style={{ boxShadow: 'var(--shadow-xl)' }}>
                <button
                  onClick={startRename}
                  className="flex items-center gap-2 px-3 py-2 mx-1.5 rounded-xl text-sm w-[calc(100%-12px)] hover:bg-[var(--overlay-light)] transition-all duration-200"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Rename
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDeleteSection(section.id); }}
                  className="flex items-center gap-2 px-3 py-2 mx-1.5 rounded-xl text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/8 w-[calc(100%-12px)] transition-all duration-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <DroppableArea sectionId={section.id}>
          {children}
        </DroppableArea>
      </SortableContext>
    </div>
  );
}

function DroppableArea({ sectionId, children }: { sectionId: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: sectionId });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2.5 flex-1 min-h-[100px] p-1 rounded-xl transition-colors duration-200 ${
        isOver ? "bg-[var(--overlay-subtle)] ring-1 ring-[var(--accent-primary)]/20" : ""
      }`}
    >
      {children}
    </div>
  );
}

export default function KanbanBoard({ projectId, workspaceId }: KanbanBoardProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [addingSectionName, setAddingSectionName] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

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

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = sections.flatMap((s) => s.tasks).find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData) return;

    const activeSectionId = activeData.sectionId;
    let overSectionId: string;

    if (overData?.type === "task") {
      overSectionId = overData.sectionId;
    } else {
      // Over is a section itself
      overSectionId = over.id as string;
    }

    if (activeSectionId === overSectionId) return;

    setSections((prev) => {
      const fromSection = prev.find((s) => s.id === activeSectionId);
      const toSection = prev.find((s) => s.id === overSectionId);
      if (!fromSection || !toSection) return prev;

      const taskIndex = fromSection.tasks.findIndex((t) => t.id === active.id);
      if (taskIndex === -1) return prev;

      const task = { ...fromSection.tasks[taskIndex], sectionId: overSectionId };

      return prev.map((section) => {
        if (section.id === activeSectionId) {
          return { ...section, tasks: section.tasks.filter((t) => t.id !== active.id) };
        }
        if (section.id === overSectionId) {
          const overIndex = overData?.type === "task"
            ? section.tasks.findIndex((t) => t.id === over.id)
            : section.tasks.length;
          const newTasks = [...section.tasks];
          newTasks.splice(overIndex >= 0 ? overIndex : newTasks.length, 0, task);
          return { ...section, tasks: newTasks };
        }
        return section;
      });
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeData = active.data.current;
    if (!activeData) return;

    // Find which section the task is now in
    const currentSection = sections.find((s) => s.tasks.some((t) => t.id === active.id));
    if (!currentSection) return;

    const taskIndex = currentSection.tasks.findIndex((t) => t.id === active.id);

    // Same section reorder
    if (activeData.sectionId === currentSection.id && active.id !== over.id) {
      const overIndex = currentSection.tasks.findIndex((t) => t.id === over.id);
      if (overIndex >= 0) {
        setSections((prev) =>
          prev.map((section) => {
            if (section.id === currentSection.id) {
              return { ...section, tasks: arrayMove(section.tasks, taskIndex, overIndex) };
            }
            return section;
          })
        );
      }
    }

    // Derive status from the target section name
    const newStatus = sectionNameToStatus(currentSection.name);

    // Optimistically update local task status
    if (newStatus) {
      setSections((prev) =>
        prev.map((section) => {
          if (section.id === currentSection.id) {
            return {
              ...section,
              tasks: section.tasks.map((t) =>
                t.id === active.id ? { ...t, status: newStatus } : t
              ),
            };
          }
          return section;
        })
      );
    }

    // Save to server
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move",
          taskId: active.id,
          toSectionId: currentSection.id,
          position: taskIndex,
          ...(newStatus ? { status: newStatus } : {}),
        }),
      });
    } catch {
      // Refetch on error
      fetchSections();
    }
  }

  async function handleAddSection() {
    if (!addingSectionName.trim()) return;
    try {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, name: addingSectionName.trim() }),
      });
      if (res.ok) {
        setAddingSectionName("");
        setShowAddSection(false);
        fetchSections();
      }
    } catch {
      // silent
    }
  }

  async function handleDeleteSection(sectionId: string) {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const msg = section.tasks.length > 0
      ? `Delete "${section.name}"? This will also delete ${section.tasks.length} task(s) inside it.`
      : `Delete "${section.name}"?`;
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/sections/${sectionId}`, { method: "DELETE" });
      if (res.ok) {
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
      }
    } catch {
      // silent
    }
  }

  async function handleRenameSection(sectionId: string, newName: string) {
    try {
      const res = await fetch(`/api/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setSections((prev) =>
          prev.map((s) => (s.id === sectionId ? { ...s, name: newName } : s))
        );
      }
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="flex gap-4 p-2 overflow-x-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-72 flex-shrink-0">
            <div className="skeleton h-6 w-24 mb-3" />
            <div className="space-y-2">
              <div className="skeleton h-20 w-full rounded-lg" />
              <div className="skeleton h-16 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-5 overflow-x-auto pb-4 min-h-[calc(100vh-200px)] px-1">
          {sections.map((section) => (
            <DroppableColumn key={section.id} section={section} onDeleteSection={handleDeleteSection} onRenameSection={handleRenameSection}>
              {section.tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setSelectedTaskId(task.id)}
                />
              ))}
              <CreateTaskInline sectionId={section.id} onCreated={fetchSections} />
            </DroppableColumn>
          ))}

          {/* Add Section */}
          <div className="w-72 flex-shrink-0">
            {showAddSection ? (
              <div className="glass-card-sm p-3.5">
                <input
                  type="text"
                  value={addingSectionName}
                  onChange={(e) => setAddingSectionName(e.target.value)}
                  placeholder="Section name..."
                  className="input text-sm mb-2.5"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
                />
                <div className="flex gap-2">
                  <button onClick={handleAddSection} className="btn btn-primary btn-sm">
                    Add
                  </button>
                  <button
                    onClick={() => { setShowAddSection(false); setAddingSectionName(""); }}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddSection(true)}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--overlay-subtle)] border border-dashed border-[var(--overlay-medium)] hover:border-[var(--overlay-heavy)] transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                Add section
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
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
