"use client";

import { useState, useEffect } from "react";
import { UserPlus, Trash2, Shield, Crown, User as UserIcon } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: { id: string; name: string; email: string; avatar: string | null };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
}

interface MemberManagerProps {
  workspaceId: string;
  currentUserRole: string;
}

const roleIcons: Record<string, React.ReactNode> = {
  OWNER: <Crown className="w-3.5 h-3.5 text-yellow-400" />,
  ADMIN: <Shield className="w-3.5 h-3.5 text-blue-400" />,
  MEMBER: <UserIcon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />,
  GUEST: <UserIcon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />,
};

const roleBadgeColors: Record<string, string> = {
  OWNER: "badge-warning",
  ADMIN: "badge-accent",
  MEMBER: "",
  GUEST: "",
};

export default function MemberManager({ workspaceId, currentUserRole }: MemberManagerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastInviteLink, setLastInviteLink] = useState("");

  const isAdmin = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

  useEffect(() => {
    fetchMembers();
  }, [workspaceId]);

  async function fetchMembers() {
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setInvites(data.invites || []);
      }
    } catch {
      // silent
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase(), role: inviteRole }),
      });

      if (res.ok) {
        const data = await res.json();
        const link = `${window.location.origin}/invite/${data.invite?.token}`;
        setLastInviteLink(link);
        setInviteEmail("");
        fetchMembers();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to invite");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member?")) return;
    try {
      await fetch(`/api/workspaces/${workspaceId}/members?memberId=${memberId}`, { method: "DELETE" });
      fetchMembers();
    } catch {
      // silent
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Members ({members.length})</h3>
        {isAdmin && (
          <button onClick={() => setShowInviteModal(true)} className="btn btn-primary btn-sm">
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        )}
      </div>

      {/* Member List */}
      <div className="space-y-1">
        {members.map((member) => (
          <div key={member.id} className="group flex items-center justify-between px-3 py-3 rounded-xl hover:bg-[var(--overlay-subtle)] transition-all duration-200">
            <div className="flex items-center gap-3">
              <Avatar name={member.user.name} avatar={member.user.avatar} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{member.user.name}</span>
                  <span className={`badge text-xs ${roleBadgeColors[member.role]}`}>
                    {roleIcons[member.role]}
                    {member.role}
                  </span>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{member.user.email}</span>
              </div>
            </div>
            {isAdmin && member.role !== "OWNER" && (
              <button
                onClick={() => removeMember(member.id)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Last Invite Link */}
      {lastInviteLink && (
        <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-400 font-medium mb-1">Invite link created!</p>
          <p className="text-xs text-[var(--text-tertiary)] mb-2">Share this link with the person you want to invite:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={lastInviteLink}
              className="input text-xs flex-1 font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(lastInviteLink);
                setLastInviteLink("");
              }}
              className="btn btn-sm btn-primary"
            >
              Copy & Close
            </button>
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Pending Invites</h4>
          <div className="space-y-1">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--overlay-subtle)]">
                <div>
                  <span className="text-sm">{invite.email}</span>
                  <span className="text-xs text-[var(--text-tertiary)] ml-2">({invite.role})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/invite/${invite.token}`;
                      navigator.clipboard.writeText(link);
                    }}
                    className="text-xs text-[var(--accent-primary)] hover:underline"
                    title="Copy invite link"
                  >
                    Copy Link
                  </button>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <Modal open={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Member" size="sm">
        <form onSubmit={handleInvite} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="input"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Role</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="input">
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="GUEST">Guest</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowInviteModal(false)} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
