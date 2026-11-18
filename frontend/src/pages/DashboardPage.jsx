import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Plus,
  Users,
  Activity,
  ArrowRight,
  Flame,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { analyticsAPI } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar } from '../components/common/Avatar.jsx';
import { Button } from '../components/common/Button.jsx';
import { PriorityBadge, StatusBadge } from '../components/common/Badge.jsx';

export const DashboardPage = () => {
  const { currentWorkspace } = useAuth();
  const navigate = useNavigate();
  const { onOpenTask, onOpenCreateTask } = useOutletContext() || {};

  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!currentWorkspace?._id) return;
      setIsLoading(true);
      try {
        const res = await analyticsAPI.getWorkspaceMetrics(currentWorkspace._id);
        setMetrics(res.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [currentWorkspace?._id]);

  if (isLoading || !metrics) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Loading workspace dashboard & analytics...
      </div>
    );
  }

  const { summary, tasksByStatus, tasksByPriority, memberWorkload, completionTrends, recentActivity } = metrics;

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Workspace Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time project orchestration and productivity analytics for {currentWorkspace?.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={FolderKanban}
            onClick={() => navigate('/projects?create=true')}
          >
            New Project
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={onOpenCreateTask}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Projects
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{summary.activeProjects}</span>
            <span className="text-xs text-slate-500">of {summary.totalProjects} total</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{summary.completedProjects}</span> completed
          </div>
        </div>

        {/* In Progress Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tasks In Progress
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{summary.pendingTasks}</span>
            <span className="text-xs text-slate-500">pending resolution</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="text-brand-600 font-semibold">{summary.totalTasks}</span> total tasks logged
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue Tasks
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${summary.overdueTasks > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {summary.overdueTasks}
            </span>
            <span className="text-xs text-slate-500">past deadline</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span className="text-amber-600 font-semibold">{summary.dueSoonTasks}</span> due this week
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Completion Rate
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{summary.completionRate}%</span>
            <span className="text-xs text-emerald-600 font-medium">overall sprint velocity</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${summary.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Section: Velocity Trends & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Weekly Velocity Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Task Completion Velocity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tasks marked completed across past 7 days</p>
            </div>
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
              Live DB Aggregation
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={completionTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#velocityGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Task Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Status Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown of tasks by Kanban column</p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksByStatus}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            {tasksByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.status}</span>
                </div>
                <span className="font-semibold text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Team Workload & Recent Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Workload */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Team Workload</h3>
              <p className="text-xs text-slate-500 mt-0.5">Active tasks assigned to workspace members</p>
            </div>
            <button
              onClick={() => navigate('/team')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Manage Team</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {memberWorkload.map((m) => (
              <div key={m.userId} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={m.name} src={m.avatar} size="sm" />
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-900 truncate">{m.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{m.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800">{m.activeTasks}</span>
                    <span className="text-[11px] text-slate-400 ml-1">active</span>
                  </div>
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{
                        width: `${m.total > 0 ? (m.completedTasks / m.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Workspace Activity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Automated backend event audit stream</p>
            </div>
            <button
              onClick={() => navigate('/activity')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {recentActivity.map((act) => (
              <div key={act._id} className="flex items-start gap-2.5 text-xs">
                <Avatar name={act.actor?.name} src={act.actor?.avatar} size="xs" className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 leading-snug">
                    <span className="font-semibold text-slate-900">{act.actor?.name}</span>{' '}
                    <span className="text-slate-600">{act.action.replace(/_/g, ' ')}</span>{' '}
                    <span className="font-medium text-slate-900">{act.entityTitle}</span>
                  </p>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {recentActivity.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
