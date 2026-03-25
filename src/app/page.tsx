import Link from "next/link";
import {
  CheckCircle2,
  Kanban,
  Users,
  Zap,
  ArrowRight,
  Clock,
  BarChart3,
  Shield,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Navbar ───────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg, var(--accent-primary) 0%, #a855f7 100%)", boxShadow: "0 2px 12px rgba(124,92,252,0.3)" }}
          >
            T
          </div>
          <span className="text-lg font-bold tracking-tight">TodoByAI</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium transition-colors duration-200" style={{ color: "var(--text-secondary)" }}>
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium transition-colors duration-200" style={{ color: "var(--text-secondary)" }}>
            How It Works
          </a>
          <a href="#pricing" className="text-sm font-medium transition-colors duration-200" style={{ color: "var(--text-secondary)" }}>
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn btn-ghost btn-sm">
            Log In
          </Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="pt-36 pb-24 px-6 text-center relative overflow-hidden">
          {/* Gradient orbs */}
          <div
            className="absolute top-10 left-1/4 w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
            style={{ background: "var(--accent-primary)" }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
            style={{ background: "#a855f7" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03] blur-[120px]"
            style={{ background: "#60a5fa" }}
          />

          <div className="relative max-w-4xl mx-auto">
            <div className="badge badge-accent mb-6 inline-flex">
              <Zap className="w-3 h-3" />
              AI-Powered Task Management
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-[1.05]">
              Ship faster with
              <br />
              <span style={{ color: "var(--accent-primary)" }}>smart workflows</span>
            </h1>
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              The collaborative task manager that understands your team. Kanban boards,
              real-time sync, time tracking, and AI insights — all in one beautiful interface.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/register" className="btn btn-primary btn-lg group">
                Start Free Trial
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="#features" className="btn btn-secondary btn-lg">
                See Features
              </Link>
            </div>
            <p className="mt-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </section>

        {/* ─── Features Grid ──────────────────────────────── */}
        <section id="features" className="py-28 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-5">
                Everything your team needs
              </h2>
              <p style={{ color: "var(--text-secondary)" }} className="text-lg max-w-2xl mx-auto">
                Built for modern teams who value speed, clarity, and collaboration.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Kanban className="w-5 h-5" />,
                  title: "Kanban & List Views",
                  desc: "Switch between board and list views instantly. Drag and drop to reorganize.",
                },
                {
                  icon: <Users className="w-5 h-5" />,
                  title: "Real-Time Collaboration",
                  desc: "See changes live as your team updates tasks, adds comments, and moves cards.",
                },
                {
                  icon: <Clock className="w-5 h-5" />,
                  title: "Time Tracking",
                  desc: "Built-in timer and manual entries. Know exactly how long tasks take.",
                },
                {
                  icon: <CheckCircle2 className="w-5 h-5" />,
                  title: "Subtasks & Checklists",
                  desc: "Break complex tasks into manageable subtasks with nested progress tracking.",
                },
                {
                  icon: <BarChart3 className="w-5 h-5" />,
                  title: "Analytics Dashboard",
                  desc: "Burndown charts, velocity tracking, and workload distribution at a glance.",
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: "Role-Based Access",
                  desc: "Granular permissions with Owner, Admin, Member, and Guest roles.",
                },
              ].map((feature, i) => (
                <div key={i} className="glass-card glass-card-lift glass-glow p-7 animate-floatIn" style={{ animationDelay: `${i * 80}ms` }}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{
                      background: "linear-gradient(135deg, rgba(124, 92, 252, 0.12) 0%, rgba(168, 85, 247, 0.06) 100%)",
                      color: "var(--accent-primary-hover)",
                      boxShadow: "0 0 16px rgba(124, 92, 252, 0.1)",
                    }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-2">{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ───────────────────────────────── */}
        <section id="how-it-works" className="py-28 px-6" style={{ background: "var(--overlay-subtle)" }}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-5">Get started in minutes</h2>
            <p style={{ color: "var(--text-secondary)" }} className="text-lg mb-20">
              Three simple steps to supercharge your team&apos;s productivity.
            </p>
            <div className="grid md:grid-cols-3 gap-10">
              {[
                {
                  step: "01",
                  title: "Create a workspace",
                  desc: "Sign up, name your workspace, and invite your team members.",
                },
                {
                  step: "02",
                  title: "Set up projects",
                  desc: "Create projects with Kanban boards or list views — your choice.",
                },
                {
                  step: "03",
                  title: "Ship & iterate",
                  desc: "Add tasks, assign team members, track time, and review analytics.",
                },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div
                    className="text-5xl font-bold mb-5 bg-gradient-to-b from-[var(--accent-primary)] to-transparent bg-clip-text text-transparent opacity-40"
                  >
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-2">{item.title}</h3>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ────────────────────────────────────────── */}
        <section className="py-28 px-6 text-center relative overflow-hidden">
          <div className="orb orb-primary w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="max-w-3xl mx-auto relative">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-6">
              Ready to build
              <br />
              <span style={{ color: "var(--accent-primary)" }}>something great?</span>
            </h2>
            <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
              Join thousands of teams already using TodoByAI to ship faster, collaborate better,
              and stay on top of their work.
            </p>
            <Link href="/register" className="btn btn-primary btn-lg group">
              Start Your Free Trial
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer
        className="py-10 px-6 text-center text-sm"
        style={{
          borderTop: "1px solid var(--border-default)",
          color: "var(--text-tertiary)",
        }}
      >
        <p>© {new Date().getFullYear()} TodoByAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
