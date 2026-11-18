import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Activity,
  Bell,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  LogOut,
  Calendar,
  Sparkles,
  Shield,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { projectAPI } from '../api/projects.js';
import { WorkspaceSwitcher } from './WorkspaceSwitcher.jsx';
import { Avatar } from '../components/common/Avatar.jsx';

export const Sidebar = ({ isMobileOpen, onCloseMobile, onOpenNewTaskModal, onOpenNewWorkspaceModal }) => {
  const { user, currentWorkspace, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      if (currentWorkspace?._id) {
        try {
          const res = await projectAPI.getProjects({ workspaceId: currentWorkspace._id });
          setProjects(res.data || []);
        } catch (err) {
          console.error('Failed to load sidebar projects:', err);
        }
      }
    };
    fetchProjects();
  }, [currentWorkspace?._id, location.pathname]);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Team Members', path: '/team', icon: Users },
    { label: 'Activity Feed', path: '/activity', icon: Activity },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null
    },
    { label: 'Workspace Settings', path: '/settings', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Workspace Switcher */}
        <div className="p-3 border-b border-slate-100">
          <WorkspaceSwitcher onOpenNewWorkspaceModal={onOpenNewWorkspaceModal} />
        </div>

        {/* Quick Action: New Task Button */}
        <div className="p-3">
          <button
            onClick={onOpenNewTaskModal}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium shadow-subtle transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[11px] font-bold bg-rose-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Projects Collapsible Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <button
                onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600"
              >
                {isProjectsOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>Projects ({projects.length})</span>
              </button>

              <button
                onClick={() => navigate('/projects?create=true')}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                title="Create Project"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isProjectsOpen && (
              <div className="space-y-0.5 mt-1">
                {projects.map((proj) => (
                  <NavLink
                    key={proj._id}
                    to={`/projects/${proj._id}`}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors group ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || '#6366f1' }}
                      />
                      <span className="truncate">{proj.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-500 shrink-0">
                      {proj.key}
                    </span>
                  </NavLink>
                ))}

                {projects.length === 0 && (
                  <div className="px-3 py-2 text-xs text-slate-400">No projects yet.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <NavLink
              to="/profile"
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
            >
              <Avatar name={user?.name} src={user?.avatar} size="sm" isOnline={true} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate capitalize">
                  {currentWorkspace?.role || currentWorkspace?.myRole || 'Member'}
                </p>
              </div>
            </NavLink>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
