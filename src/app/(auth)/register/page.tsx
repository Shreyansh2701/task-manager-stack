"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    let payload: { error?: string; message?: string } = {};
    try {
      payload = await response.json();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    if (!response.ok) {
      setError(payload.error || "Failed to register");
      setLoading(false);
      return;
    }

    setSuccess("Registration successful! Redirecting...");

    const signInResult = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (signInResult?.error) {
      setError(signInResult.error);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="orb orb-primary w-[500px] h-[500px] -top-40 -right-40" />
      <div className="orb orb-secondary w-[400px] h-[400px] -bottom-32 -left-32" />
      
      <div className="glass-card p-8 md:p-10 w-full max-w-md relative animate-floatIn" style={{ boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-[0_2px_12px_rgba(124,92,252,0.3)]" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, #a855f7 100%)' }}>T</div>
          <span className="text-lg font-bold tracking-tight">TodoByAI</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Create your account</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">Get started with TodoByAI in seconds.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.06em] mb-1.5">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.06em] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.06em] mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.06em] mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              minLength={6}
              required
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
          <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="text-sm text-center mt-6 text-[var(--text-secondary)]">
          Already have an account? <Link href="/login" className="text-[var(--accent-primary-hover)] hover:text-[var(--accent-primary)] font-medium transition-colors">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
