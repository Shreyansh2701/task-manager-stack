"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const json = await response.json();
    if (!response.ok) {
      setError(json.error || "Unknown error");
      return;
    }

    setStatus(json.message || "Check your inbox for the reset link.");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="orb orb-primary w-[400px] h-[400px] -top-32 left-1/3" />
      <div className="orb orb-secondary w-[350px] h-[350px] -bottom-24 -right-24" />
      
      <div className="glass-card p-8 md:p-10 w-full max-w-md relative animate-floatIn" style={{ boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-[0_2px_12px_rgba(124,92,252,0.3)]" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, #a855f7 100%)' }}>T</div>
          <span className="text-lg font-bold tracking-tight">TodoByAI</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Reset your password</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">Enter your registered email to receive reset instructions.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.06em] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="input"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {status && <p className="text-sm text-emerald-400">{status}</p>}

          <button type="submit" className="btn btn-primary w-full py-3">Send reset link</button>
        </form>

        <p className="text-sm text-center mt-6">
          <Link href="/login" className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">Back to login</Link>
        </p>
      </div>
    </main>
  );
}
