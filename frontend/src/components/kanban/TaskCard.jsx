import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Avatar } from '../common/Avatar.jsx';
import { PriorityBadge } from '../common/Badge.jsx';

export const TaskCard = ({ task, onClick, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const isOverdue =
    task.dueDate && !task.isCompleted && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick && onClick(task)}
      className={`group relative bg-white p-3.5 rounded-xl border transition-all duration-150 select-none cursor-grab active:cursor-grabbing ${
        isDragging
          ? 'opacity-40 border-brand-400 shadow-md ring-2 ring-brand-400/20'
          : isOverlay
          ? 'shadow-xl border-brand-500 ring-2 ring-brand-500/30 rotate-2 scale-105'
          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-card shadow-subtle'
      }`}
    >
      {/* Top: Task ID & Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 group-hover:bg-slate-200/80 px-1.5 py-0.5 rounded transition-colors">
          {task.taskId}
        </span>
        <PriorityBadge priority={task.priority} size="xs" />
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-brand-700 transition-colors line-clamp-2 mb-2.5">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.labels.slice(0, 3).map((lbl, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded"
            >
              {lbl}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Due Date, Counts & Assignee Avatar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-slate-400 text-xs">
        <div className="flex items-center gap-3">
          {/* Due date */}
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 text-[11px] font-medium ${
                isOverdue
                  ? 'text-rose-600'
                  : task.isCompleted
                  ? 'text-emerald-600'
                  : 'text-slate-500'
              }`}
            >
              <Calendar className="w-3 h-3 shrink-0" />
              <span>
                {new Date(task.dueDate).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}

          {/* Subtasks count */}
          {task.subtaskCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <CheckSquare className="w-3 h-3" />
              <span>
                {task.subtaskCompletedCount}/{task.subtaskCount}
              </span>
            </div>
          )}

          {/* Comments count */}
          {task.commentCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <MessageSquare className="w-3 h-3" />
              <span>{task.commentCount}</span>
            </div>
          )}

          {/* Attachments count */}
          {task.attachmentCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachmentCount}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        <Avatar
          name={task.assignee?.name || 'Unassigned'}
          src={task.assignee?.avatar}
          size="xs"
        />
      </div>
    </div>
  );
};
