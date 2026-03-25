"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (!result) {
      setError("Login failed");
      return;
    }

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="orb orb-primary w-[500px] h-[500px] -top-40 -left-40" />
      <div className="orb orb-secondary w-[400px] h-[400px] -bottom-32 -right-32" />
      
      <div className="glass-card p-8 md:p-10 w-full max-w-md relative animate-floatIn" style={{ boxShadow: 'var(--shadow-xl)' }}>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-[0_2px_12px_rgba(124,92,252,0.3)]" style={{ background: 'linear-gradient(135deg, var(--accent-primary) 0%, #a855f7 100%)' }}>T</div>
          <span className="text-lg font-bold tracking-tight">TodoByAI</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome back</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed">Enter your credentials to access your account.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="text-sm text-center mt-6 space-y-2">
          <p className="text-[var(--text-secondary)]">
            Don&apos;t have an account? <Link href="/register" className="text-[var(--accent-primary-hover)] hover:text-[var(--accent-primary)] font-medium transition-colors">Register</Link>
          </p>
          <p>
            <Link href="/forgot-password" className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors text-sm">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
