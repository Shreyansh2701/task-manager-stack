"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/Toast";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Extract workspaceId from pathname
  const workspaceMatch = pathname.match(/\/workspace\/([^/]+)/);
  const urlWorkspaceId = workspaceMatch?.[1] || "";

  // Persist last-used workspace so sidebar works on non-workspace pages (/profile, /dashboard)
  const [storedWorkspaceId, setStoredWorkspaceId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lastWorkspaceId") || "";
    }
    return "";
  });

  useEffect(() => {
    if (urlWorkspaceId) {
      localStorage.setItem("lastWorkspaceId", urlWorkspaceId);
      setStoredWorkspaceId(urlWorkspaceId);
    }
  }, [urlWorkspaceId]);

  const currentWorkspaceId = urlWorkspaceId || storedWorkspaceId || workspaces[0]?.id || "";

  useEffect(() => {
    if (status === "authenticated") {
      fetchWorkspaces();
    }
  }, [status]);

  useEffect(() => {
    if (currentWorkspaceId) {
      fetchProjects(currentWorkspaceId);
    }
  }, [currentWorkspaceId]);

  async function fetchWorkspaces() {
    try {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const data = await res.json();
        const wsList = data.workspaces || [];
        setWorkspaces(wsList);
        // If no workspace in URL and none stored, default to first workspace
        if (!urlWorkspaceId && !storedWorkspaceId && wsList.length > 0) {
          setStoredWorkspaceId(wsList[0].id);
          localStorage.setItem("lastWorkspaceId", wsList[0].id);
        }
      }
    } catch {
      // silent
    }
  }

  async function fetchProjects(wsId: string) {
    try {
      const res = await fetch(`/api/projects?workspaceId=${wsId}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {
      // silent
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" style={{ boxShadow: '0 0 20px rgba(124,92,252,0.2)' }} />
          <span className="text-sm text-[var(--text-tertiary)] animate-pulse">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar
        workspaces={workspaces}
        currentWorkspaceId={currentWorkspaceId}
        projects={projects}
        userName={session?.user?.name || session?.user?.email || "User"}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent to-[rgba(124,92,252,0.01)]">{children}</main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </SessionProvider>
  );
}
