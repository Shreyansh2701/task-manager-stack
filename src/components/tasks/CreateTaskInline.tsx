"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

interface CreateTaskInlineProps {
  sectionId: string;
  onCreated: () => void;
}

export default function CreateTaskInline({ sectionId, onCreated }: CreateTaskInlineProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, title: title.trim() }),
      });
      if (res.ok) {
        setTitle("");
        setIsOpen(false);
        onCreated();
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 w-full px-3 py-2.5 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--overlay-subtle)] rounded-xl border border-dashed border-transparent hover:border-[var(--overlay-medium)] transition-all duration-300"
      >
        <Plus className="w-4 h-4" />
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card-sm p-3.5">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="input text-sm mb-2.5"
        autoFocus
        disabled={loading}
      />
      <div className="flex items-center gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !title.trim()}>
          {loading ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          onClick={() => { setIsOpen(false); setTitle(""); }}
          className="btn btn-ghost btn-sm"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
