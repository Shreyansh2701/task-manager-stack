"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import MemberManager from "@/components/workspace/MemberManager";
import { Settings, Trash2, Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function WorkspaceSettingsPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const router = useRouter();
  const { addToast } = useToast();
  const [workspace, setWorkspace] = useState<{ id: string; name: string; slug: string; description?: string } | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState("MEMBER");

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}`)
      .then((r) => r.json())
      .then((data) => {
        const ws = data.workspace || data;
        if (ws?.id) {
          setWorkspace(ws);
          setName(ws.name);
          setDescription(ws.description || "");
        }
      })
      .finally(() => setLoading(false));
    // Fetch current user role
    fetch(`/api/workspaces/${workspaceId}/members`)
      .then((r) => r.json())
      .then((data) => {
        if (data.currentUserRole) {
          setCurrentUserRole(data.currentUserRole);
        }
      });
  }, [workspaceId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (res.ok) {
        addToast("Workspace updated", "success");
        const data = await res.json();
        const updated = data.workspace || data;
        setWorkspace(updated);
        setName(updated.name);
        setDescription(updated.description || "");
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to update", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
      if (res.ok) {
        addToast("Workspace deleted", "success");
        router.push("/dashboard");
      } else {
        const err = await res.json();
        addToast(err.error || "Failed to delete", "error");
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  if (!workspace) {
    return <p className="p-8 text-center text-red-400">Workspace not found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Settings className="w-6 h-6 text-[var(--accent-primary)]" />
        <h1 className="text-2xl font-bold">Workspace Settings</h1>
      </div>

      {/* General Settings */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">General</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input w-full resize-none"
            />
          </div>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="glass-card p-6">
        <MemberManager workspaceId={workspaceId} currentUserRole={currentUserRole} />
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 border-red-500/30">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-[var(--text-tertiary)] mb-4">
          Deleting a workspace will permanently remove all projects, tasks, and data.
        </p>
        <button onClick={handleDelete} disabled={deleting} className="btn btn-sm bg-red-600 hover:bg-red-700 text-white">
          <Trash2 className="w-4 h-4" /> {deleting ? "Deleting..." : "Delete Workspace"}
        </button>
      </div>
    </div>
  );
}
