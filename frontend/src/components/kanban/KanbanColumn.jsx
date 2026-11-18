import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal, X, Check } from 'lucide-react';
import { TaskCard } from './TaskCard.jsx';

export const KanbanColumn = ({
  column,
  tasks = [],
  onTaskClick,
  onQuickAddTask,
  onDeleteColumn
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column._id,
    data: {
      type: 'Column',
      column
    }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAddTask(column._id, column.key, quickTitle.trim());
    setQuickTitle('');
    setIsAdding(false);
  };

  const isWipExceeded = column.limit > 0 && tasks.length > column.limit;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 shrink-0 bg-slate-100/70 rounded-2xl p-2.5 max-h-[calc(100vh-14rem)] border transition-all ${
        isOver
          ? 'border-brand-500 bg-brand-50/30 ring-2 ring-brand-500/10'
          : 'border-slate-200/60'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: column.color || '#64748b' }}
          />
          <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            {column.name}
          </h3>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isWipExceeded
                ? 'bg-rose-100 text-rose-700'
                : 'bg-white text-slate-600 shadow-2xs'
            }`}
          >
            {tasks.length}
            {column.limit > 0 && `/${column.limit}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
            title="Quick add task"
          >
            <Plus className="w-4 h-4" />
          </button>
          {onDeleteColumn && (
            <button
              onClick={() => onDeleteColumn(column._id)}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
              title="Delete column"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inline Quick Task Creator */}
      {isAdding && (
        <form onSubmit={handleQuickSubmit} className="mb-2 p-2 bg-white rounded-xl shadow-subtle border border-slate-200">
          <input
            type="text"
            autoFocus
            placeholder="Task title..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 mb-2"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs px-2 py-1 text-slate-500 hover:bg-slate-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs px-2.5 py-1 bg-brand-600 text-white font-medium rounded hover:bg-brand-700 shadow-2xs"
            >
              Add Task
            </button>
          </div>
        </form>
      )}

      {/* Task Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 pb-1">
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <div className="py-8 text-center border-2 border-dashed border-slate-200/80 rounded-xl">
            <p className="text-xs text-slate-400 font-medium">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
};
