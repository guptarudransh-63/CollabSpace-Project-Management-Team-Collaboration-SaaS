import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  Circle,
  Shield,
  UserCheck,
  User,
  Sparkles
} from 'lucide-react';

export const PriorityBadge = ({ priority = 'medium', showIcon = true, size = 'sm' }) => {
  const configs = {
    urgent: {
      label: 'Urgent',
      icon: AlertCircle,
      classes: 'bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/60'
    },
    high: {
      label: 'High',
      icon: ArrowUp,
      classes: 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/60'
    },
    medium: {
      label: 'Medium',
      icon: Clock,
      classes: 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100/60'
    },
    low: {
      label: 'Low',
      icon: ArrowDown,
      classes: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/60'
    }
  };

  const current = configs[priority?.toLowerCase()] || configs.medium;
  const Icon = current.icon;

  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-0.5 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border transition-colors ${sizeClasses} ${current.classes}`}
    >
      {showIcon && <Icon className={size === 'xs' ? 'w-2.5 h-2.5 shrink-0' : 'w-3 h-3 shrink-0'} />}
      <span>{current.label}</span>
    </span>
  );
};

export const StatusBadge = ({ status = 'todo', size = 'sm' }) => {
  const configs = {
    backlog: { label: 'Backlog', classes: 'bg-slate-100 text-slate-700 border-slate-200' },
    todo: { label: 'To Do', classes: 'bg-sky-50 text-sky-700 border-sky-200' },
    in_progress: { label: 'In Progress', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
    in_review: { label: 'In Review', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
    done: { label: 'Done', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    planning: { label: 'Planning', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    active: { label: 'Active', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    on_hold: { label: 'On Hold', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
    completed: { label: 'Completed', classes: 'bg-teal-50 text-teal-700 border-teal-200' },
    archived: { label: 'Archived', classes: 'bg-slate-100 text-slate-500 border-slate-200' }
  };

  const normalized = status?.toLowerCase().replace(/\s+/g, '_');
  const current = configs[normalized] || {
    label: status,
    classes: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span className={`inline-flex items-center font-medium rounded-md border ${sizeClasses} ${current.classes}`}>
      {current.label}
    </span>
  );
};

export const RoleBadge = ({ role = 'member' }) => {
  const configs = {
    owner: {
      label: 'Workspace Owner',
      icon: Sparkles,
      classes: 'bg-violet-50 text-violet-700 border-violet-200'
    },
    admin: {
      label: 'Admin',
      icon: Shield,
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    project_manager: {
      label: 'Project Manager',
      icon: UserCheck,
      classes: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    member: {
      label: 'Member',
      icon: User,
      classes: 'bg-slate-100 text-slate-700 border-slate-200'
    }
  };

  const current = configs[role] || configs.member;
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md border ${current.classes}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span>{current.label}</span>
    </span>
  );
};
