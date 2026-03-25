"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Kanban, List } from "lucide-react";

interface CreateProjectModalProps {
  workspaceId: string;
}

const PROJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#64748b",
];

export default function CreateProjectModal({ workspaceId }: CreateProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [defaultView, setDefaultView] = useState<"BOARD" | "LIST">("BOARD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name, description, color, defaultView }),
      });

      let payload: { error?: string; project?: { id: string } } = {};
      try {
        payload = await res.json();
      } catch {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(payload.error || "Failed to create project");
        setLoading(false);
        return;
      }

      setName("");
      setDescription("");
      setColor("#6366f1");
      setDefaultView("BOARD");
      setOpen(false);
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-sm btn-primary">
        <Plus className="w-4 h-4" /> New Project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md" style={{ background: 'var(--backdrop-bg)' }}>
          <div className="glass-card p-6 w-full max-w-md mx-4 animate-scaleIn" style={{ boxShadow: 'var(--shadow-xl)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold tracking-tight">Create Project</h2>
              <button
                onClick={() => { setOpen(false); setError(""); }}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[var(--overlay-medium)] text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Project name
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website Redesign"
                  className="input w-full"
                  required
                  minLength={2}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="project-desc" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Description <span className="text-[var(--text-tertiary)]">(optional)</span>
                </label>
                <textarea
                  id="project-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the project..."
                  rows={2}
                  className="input w-full resize-none"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        color === c ? "border-white scale-110" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Default View */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Default View</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDefaultView("BOARD")}
                    className={`btn btn-sm flex-1 ${defaultView === "BOARD" ? "bg-[var(--overlay-heavy)] text-[var(--text-primary)]" : "btn-ghost"}`}
                  >
                    <Kanban className="w-4 h-4" /> Board
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultView("LIST")}
                    className={`btn btn-sm flex-1 ${defaultView === "LIST" ? "bg-[var(--overlay-heavy)] text-[var(--text-primary)]" : "btn-ghost"}`}
                  >
                    <List className="w-4 h-4" /> List
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setError(""); }}
                  className="btn btn-sm btn-ghost"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary" disabled={loading}>
                  {loading ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
