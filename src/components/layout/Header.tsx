"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, ChevronDown, Sun, Moon } from "lucide-react";
import NotificationBell from "./NotificationBell";
import Avatar from "@/components/ui/Avatar";
import { useTheme } from "@/hooks/useTheme";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-[var(--header-height)] flex items-center justify-between px-6 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/60 backdrop-blur-xl flex-shrink-0 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-2.5">
        <h2 className="text-sm font-semibold tracking-tight bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">Todo</h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-[var(--overlay-light)] transition-all duration-300 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
        <NotificationBell />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-[var(--overlay-light)] transition-all duration-300 group"
          >
            <Avatar name={session?.user?.name || "U"} size="sm" />
            <span className="text-sm font-medium hidden md:inline text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{session?.user?.name}</span>
            <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)] transition-transform duration-300" style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 glass-card p-2 w-52 z-50 animate-slideUp" style={{ boxShadow: 'var(--shadow-xl)' }}>
              <div className="px-3 py-2.5 text-xs text-[var(--text-tertiary)] border-b border-[var(--border-default)] mb-1 truncate">
                {session?.user?.email}
              </div>
              <button
                onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-[var(--overlay-light)] w-full text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm hover:bg-red-500/8 w-full text-left text-red-400/80 hover:text-red-400 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
