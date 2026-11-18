import React, { useState, useEffect } from 'react';
import { Activity, Filter, CheckCircle2, MessageSquare, FolderKanban, Users, Clock } from 'lucide-react';
import { activityAPI } from '../api/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Avatar } from '../components/common/Avatar.jsx';

export const ActivityFeedPage = () => {
  const { currentWorkspace } = useAuth();
  const { socket } = useSocket();

  const [activities, setActivities] = useState([]);
  const [filterAction, setFilterAction] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = async () => {
    if (!currentWorkspace?._id) return;
    setIsLoading(true);
    try {
      const res = await activityAPI.getActivities({
        workspaceId: currentWorkspace._id,
        action: filterAction || undefined,
        limit: 50
      });
      setActivities(res.data || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [currentWorkspace?._id, filterAction]);

  // Live real-time stream via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (activity) => {
      setActivities((prev) => [activity, ...prev]);
    };

    socket.on('activity:created', handleNewActivity);

    return () => {
      socket.off('activity:created', handleNewActivity);
    };
  }, [socket]);

  const getActionIcon = (action) => {
    if (action.includes('project')) return FolderKanban;
    if (action.includes('comment')) return MessageSquare;
    if (action.includes('member')) return Users;
    return CheckCircle2;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Feed</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time audit log of all project and task operations in {currentWorkspace?.name}
          </p>
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none text-slate-700 shadow-2xs"
          >
            <option value="">All Activities</option>
            <option value="task_created">Task Created</option>
            <option value="task_status_changed">Status Changed</option>
            <option value="task_moved">Task Moved</option>
            <option value="task_assigned">Task Assigned</option>
            <option value="comment_added">Comments</option>
            <option value="project_created">Project Created</option>
            <option value="member_joined">Members</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {activities.map((act) => {
            const Icon = getActionIcon(act.action);
            return (
              <div key={act._id} className="relative flex items-start gap-4 text-xs group">
                {/* Timeline node */}
                <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                </span>

                <Avatar name={act.actor?.name} src={act.actor?.avatar} size="sm" />

                <div className="flex-1 bg-slate-50/70 group-hover:bg-slate-50 p-3.5 rounded-xl border border-slate-100 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <p className="font-semibold text-slate-900">
                      {act.actor?.name}
                      <span className="font-normal text-slate-600 ml-1.5">
                        {act.action.replace(/_/g, ' ')}
                      </span>
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-slate-800 font-medium">{act.entityTitle}</p>

                  {/* Metadata pills */}
                  {act.metadata && Object.keys(act.metadata).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-200/50 text-[11px] text-slate-500">
                      {act.metadata.fromStatus && act.metadata.toStatus && (
                        <span>
                          Status: <span className="font-medium">{act.metadata.fromStatus}</span> →{' '}
                          <span className="font-medium text-brand-600">{act.metadata.toStatus}</span>
                        </span>
                      )}
                      {act.metadata.toColumn && (
                        <span>Column: <span className="font-medium">{act.metadata.toColumn}</span></span>
                      )}
                      {act.metadata.priority && (
                        <span>Priority: <span className="font-medium uppercase">{act.metadata.priority}</span></span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {activities.length === 0 && !isLoading && (
            <div className="py-12 text-center text-xs text-slate-400">
              No activity logs match the selected filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
