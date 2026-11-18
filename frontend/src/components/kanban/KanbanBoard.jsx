import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { Plus, Search, Filter, X, Sparkles } from 'lucide-react';
import { taskAPI } from '../../api/tasks.js';
import { boardAPI } from '../../api/boards.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { KanbanColumn } from './KanbanColumn.jsx';
import { TaskCard } from './TaskCard.jsx';
import { Button } from '../common/Button.jsx';
import { Modal } from '../common/Modal.jsx';

export const KanbanBoard = ({
  projectId,
  workspaceId,
  columns = [],
  tasks = [],
  members = [],
  onTaskClick,
  onTasksChanged,
  onColumnsChanged
}) => {
  const { socket } = useSocket();

  // Local state for optimistic updates
  const [boardTasks, setBoardTasks] = useState(tasks);
  const [activeTask, setActiveTask] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');

  // Column creation modal
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#6366f1');

  // Keep tasks synced with prop changes
  useEffect(() => {
    setBoardTasks(tasks);
  }, [tasks]);

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!socket || !projectId) return;

    socket.emit('project:join', projectId);

    const handleRemoteTaskMove = ({ taskId, fromColumnId, toColumnId, newOrder }) => {
      setBoardTasks((prev) => {
        const moved = prev.find((t) => t._id === taskId);
        if (!moved) return prev;

        const updated = {
          ...moved,
          column: toColumnId,
          order: newOrder
        };

        const remaining = prev.filter((t) => t._id !== taskId);
        return [...remaining, updated];
      });

      if (onTasksChanged) onTasksChanged();
    };

    socket.on('kanban:task_moved', handleRemoteTaskMove);

    return () => {
      socket.emit('project:leave', projectId);
      socket.off('kanban:task_moved', handleRemoteTaskMove);
    };
  }, [socket, projectId, onTasksChanged]);

  // Sensors configuration with mobile touch constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Filter tasks
  const filteredTasks = boardTasks.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchKey = t.taskId?.toLowerCase().includes(q);
      if (!matchTitle && !matchKey) return false;
    }
    if (selectedPriority && t.priority !== selectedPriority) return false;
    if (selectedAssignee) {
      if (selectedAssignee === 'unassigned') {
        if (t.assignee) return false;
      } else if (t.assignee?._id !== selectedAssignee) {
        return false;
      }
    }
    return true;
  });

  const handleDragStart = (event) => {
    const { active } = event;
    const task = boardTasks.find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Dropping task over another task in another column
    if (isActiveTask && isOverTask) {
      setBoardTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t._id === activeId);
        const overIndex = prev.findIndex((t) => t._id === overId);

        if (prev[activeIndex].column !== prev[overIndex].column) {
          prev[activeIndex].column = prev[overIndex].column;
          prev[activeIndex].status = prev[overIndex].status;
          return arrayMove(prev, activeIndex, overIndex);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Dropping task over a column container directly
    if (isActiveTask && isOverColumn) {
      setBoardTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t._id === activeId);
        prev[activeIndex].column = overId;
        const col = columns.find((c) => c._id === overId);
        if (col) prev[activeIndex].status = col.key;
        return arrayMove(prev, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTaskObj = boardTasks.find((t) => t._id === activeId);
    if (!activeTaskObj) return;

    let destinationColumnId = null;
    let targetIndex = 0;

    if (over.data.current?.type === 'Column') {
      destinationColumnId = overId;
      const tasksInCol = boardTasks.filter((t) => t.column === destinationColumnId);
      targetIndex = tasksInCol.length;
    } else if (over.data.current?.type === 'Task') {
      const overTaskObj = boardTasks.find((t) => t._id === overId);
      destinationColumnId = overTaskObj.column;
      const tasksInCol = boardTasks.filter((t) => t.column === destinationColumnId);
      targetIndex = tasksInCol.findIndex((t) => t._id === overId);
      if (targetIndex < 0) targetIndex = 0;
    }

    if (!destinationColumnId) return;

    // Optimistically update
    try {
      await taskAPI.moveTask(activeId, {
        destinationColumnId,
        newIndex: targetIndex
      });

      // Broadcast move to other peers via Socket.IO
      if (socket) {
        socket.emit('kanban:task_moved', {
          projectId,
          taskId: activeId,
          fromColumnId: activeTaskObj.column,
          toColumnId: destinationColumnId,
          newOrder: targetIndex,
          task: activeTaskObj
        });
      }

      if (onTasksChanged) onTasksChanged();
    } catch (err) {
      console.error('Failed to persist task move:', err);
      // Revert if error
      if (onTasksChanged) onTasksChanged();
    }
  };

  // Quick Add Task inline
  const handleQuickAddTask = async (columnId, statusKey, title) => {
    try {
      const res = await taskAPI.createTask({
        title,
        projectId,
        workspaceId,
        columnId,
        status: statusKey
      });
      setBoardTasks((prev) => [...prev, res.data]);
      if (onTasksChanged) onTasksChanged();
    } catch (err) {
      console.error('Failed to create quick task:', err);
    }
  };

  // Create Custom Column
  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (!newColumnName.trim() || columns.length === 0) return;

    try {
      const boardId = columns[0].board;
      await boardAPI.createColumn(boardId, {
        name: newColumnName.trim(),
        color: newColumnColor
      });
      setShowAddColumnModal(false);
      setNewColumnName('');
      if (onColumnsChanged) onColumnsChanged();
    } catch (err) {
      alert(`Error creating column: ${err.message}`);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!window.confirm('Are you sure you want to delete this column?')) return;
    try {
      await boardAPI.deleteColumn(columnId);
      if (onColumnsChanged) onColumnsChanged();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Kanban Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-subtle">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-700"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-700"
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {members.map((m) => (
              <option key={m._id} value={m.user?._id}>
                {m.user?.name}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {(searchQuery || selectedPriority || selectedAssignee) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedPriority('');
                setSelectedAssignee('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Add Column Button */}
        <Button
          size="sm"
          variant="secondary"
          icon={Plus}
          onClick={() => setShowAddColumnModal(true)}
        >
          Add Column
        </Button>
      </div>

      {/* DndContext Board Columns Container */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 pt-1 items-start">
          {columns.map((col) => {
            const tasksInCol = filteredTasks
              .filter((t) => t.column === col._id || t.status === col.key)
              .sort((a, b) => (a.order || 0) - (b.order || 0));

            return (
              <KanbanColumn
                key={col._id}
                column={col}
                tasks={tasksInCol}
                onTaskClick={onTaskClick}
                onQuickAddTask={handleQuickAddTask}
                onDeleteColumn={columns.length > 2 ? handleDeleteColumn : null}
              />
            );
          })}
        </div>

        {/* Smooth Drag Overlay Preview */}
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay={true} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Add Column Modal */}
      <Modal
        isOpen={showAddColumnModal}
        onClose={() => setShowAddColumnModal(false)}
        title="Add Workflow Column"
        subtitle="Create a custom status column for your Kanban board"
      >
        <form onSubmit={handleCreateColumn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Column Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. QA Testing, Staging, Blocked"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Color Tag</label>
            <div className="flex gap-2">
              {['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#64748b'].map(
                (color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColumnColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      newColumnColor === color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                    }`}
                  />
                )
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowAddColumnModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Column</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
