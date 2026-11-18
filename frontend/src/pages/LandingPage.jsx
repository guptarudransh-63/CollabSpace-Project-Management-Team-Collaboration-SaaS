import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Kanban,
  Zap,
  ShieldCheck,
  BarChart3,
  Users2,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Layers,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/common/Button.jsx';

export const LandingPage = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const handleQuickDemoLogin = async (email, password) => {
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      alert(`Login failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Collab<span className="text-brand-600">Space</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate('/dashboard')} variant="primary" size="sm" icon={ArrowRight} iconPosition="right">
                Open Dashboard
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-brand-600 px-3 py-1.5 transition-colors">
                  Sign In
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Next-Gen MERN SaaS Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Orchestrate Projects. <br />
            <span className="bg-gradient-to-r from-brand-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Accelerate Velocity.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The high-performance collaborative workspace inspired by Linear and ClickUp.
            Manage interactive Kanban boards, track deadlines, chat in real time, and analyze productivity metrics.
          </p>

          {/* Quick Demo Login Box */}
          <div className="mt-10 max-w-3xl mx-auto bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-modal text-left">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  ⚡ 1-Click Role Demonstrations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test the complete RBAC permission hierarchy instantly with pre-seeded demo accounts.
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                Database Seeded
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Owner */}
              <button
                onClick={() => handleQuickDemoLogin('owner@collabspace.io', 'Password123!')}
                className="p-3.5 rounded-xl border border-violet-200 bg-violet-50/50 hover:bg-violet-100/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-violet-800">Workspace Owner</span>
                  <ArrowRight className="w-3.5 h-3.5 text-violet-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs font-medium text-slate-700">Sarah Connor</p>
                <p className="text-[11px] text-slate-500 truncate">owner@collabspace.io</p>
              </button>

              {/* Admin */}
              <button
                onClick={() => handleQuickDemoLogin('admin@collabspace.io', 'Password123!')}
                className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-800">Admin</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs font-medium text-slate-700">Marcus Vance</p>
                <p className="text-[11px] text-slate-500 truncate">admin@collabspace.io</p>
              </button>

              {/* Project Manager */}
              <button
                onClick={() => handleQuickDemoLogin('pm@collabspace.io', 'Password123!')}
                className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-800">Project Manager</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs font-medium text-slate-700">Elena Rostova</p>
                <p className="text-[11px] text-slate-500 truncate">pm@collabspace.io</p>
              </button>

              {/* Member */}
              <button
                onClick={() => handleQuickDemoLogin('member@collabspace.io', 'Password123!')}
                className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-800">Member</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-xs font-medium text-slate-700">Alex Chen</p>
                <p className="text-[11px] text-slate-500 truncate">member@collabspace.io</p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Engineered for Modern Software & Product Teams
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Everything required to plan, build, and ship high-impact features with zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center mb-4">
                <Kanban className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Interactive Kanban Boards</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Persistent drag-and-drop powered by @dnd-kit. Custom workflow columns, WIP limits, subtasks checklists, and inline quick creation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Socket.IO Sync</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Instant multi-user updates. Moves in Kanban columns sync across connected browsers live with zero page refreshes and typing indicators.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Workspace RBAC</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Strict workspace data isolation with Owner, Admin, Project Manager, and Member role privileges verified on both frontend & backend.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Productivity & Velocity Analytics</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Recharts-driven interactive dashboards tracking completion velocity, weekly sprint trends, and team workload balances.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Calendar & Deadline Management</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Full calendar view highlighting overdue deadlines, approaching milestones, and automated hourly node-cron reminders.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 hover:shadow-card transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <BellRing className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">@Mentions & Discussion Hub</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tag teammates with @mention autocomplete, attach file references, and receive instantaneous in-app and email dispatch alerts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-500 text-white flex items-center justify-center font-bold text-xs">
              C
            </div>
            <span className="font-semibold text-white">CollabSpace SaaS</span>
            <span>— Production-Grade MERN Architecture</span>
          </div>

          <p>© 2026 CollabSpace. Designed with Tailwind CSS & Lucide Icons.</p>
        </div>
      </footer>
    </div>
  );
};
