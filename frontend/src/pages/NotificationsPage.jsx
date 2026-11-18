import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2, CheckCircle2, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext.jsx';
import { Button } from '../components/common/Button.jsx';
import { Avatar } from '../components/common/Avatar.jsx';

export const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.isRead : true));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time mentions, assignments, deadlines, and project updates
          </p>
        </div>

        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" icon={Check} onClick={markAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setFilter('all')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
            filter === 'all'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
            filter === 'unread'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle divide-y divide-slate-100 overflow-hidden">
        {filtered.map((n) => (
          <div
            key={n._id}
            onClick={() => {
              if (!n.isRead) markAsRead(n._id);
              if (n.link) navigate(n.link);
            }}
            className={`p-4 flex items-start justify-between gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${
              !n.isRead ? 'bg-brand-50/20' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar name={n.sender?.name || 'System'} src={n.sender?.avatar} size="sm" className="mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                  {!n.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-slate-400 mt-1.5 block">
                  {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at{' '}
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {!n.isRead && (
                <button
                  onClick={() => markAsRead(n._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-16 text-center text-xs text-slate-400">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No {filter === 'unread' ? 'unread ' : ''}notifications at this time.
          </div>
        )}
      </div>
    </div>
  );
};
