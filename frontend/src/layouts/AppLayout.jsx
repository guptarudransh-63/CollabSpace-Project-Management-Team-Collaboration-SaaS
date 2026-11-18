import React, { useState, useEffect } from 'react';
import { Outlet, useSearchParams, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Navbar } from './Navbar.jsx';
import { GlobalSearchModal } from '../components/search/GlobalSearchModal.jsx';
import { TaskDetailModal } from '../components/tasks/TaskDetailModal.jsx';
import { TaskFormModal } from '../components/tasks/TaskFormModal.jsx';
import { WorkspaceModal } from '../components/common/WorkspaceModal.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { Bell, X } from 'lucide-react';

export const AppLayout = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toastNotification, dismissToast } = useNotifications();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

  // Active Task Detail from query param e.g. ?task=65f...
  const activeTaskId = searchParams.get('task');

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCloseTaskDetail = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('task');
    setSearchParams(nextParams);
  };

  const handleOpenTaskDetail = (id) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('task', id);
    setSearchParams(nextParams);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenNewTaskModal={() => setIsTaskFormOpen(true)}
        onOpenNewWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar */}
        <Navbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNewTaskModal={() => setIsTaskFormOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ onOpenTask: handleOpenTaskDetail, onOpenCreateTask: () => setIsTaskFormOpen(true) }} />
        </main>
      </div>

      {/* Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenTask={handleOpenTaskDetail}
      />

      {activeTaskId && (
        <TaskDetailModal
          taskId={activeTaskId}
          isOpen={!!activeTaskId}
          onClose={handleCloseTaskDetail}
        />
      )}

      <TaskFormModal
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
      />

      <WorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
      />

      {/* Real-Time Toast Notification Popup */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-slate-700 flex items-start justify-between gap-3 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-500 rounded-lg shrink-0 mt-0.5">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">{toastNotification.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{toastNotification.message}</p>
              {toastNotification.link && (
                <button
                  onClick={() => {
                    navigate(toastNotification.link);
                    dismissToast();
                  }}
                  className="text-xs font-medium text-brand-400 hover:text-brand-300 mt-2 block"
                >
                  View Details →
                </button>
              )}
            </div>
          </div>
          <button
            onClick={dismissToast}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
