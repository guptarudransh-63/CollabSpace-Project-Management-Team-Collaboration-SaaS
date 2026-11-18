import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Kanban as KanbanIcon,
  List as ListIcon,
  Calendar as CalendarIcon,
  BarChart3,
  Settings as SettingsIcon,
  Users,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  ArrowLeft
} from 'lucide-react';
import { projectAPI } from '../api/projects.js';
import { taskAPI } from '../api/tasks.js';
import { boardAPI } from '../api/boards.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar } from '../components/common/Avatar.jsx';
import { StatusBadge, PriorityBadge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { KanbanBoard } from '../components/kanban/KanbanBoard.jsx';
import { Modal } from '../components/common/Modal.jsx';

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentWorkspace } = useAuth();
  const { onOpenTask, onOpenCreateTask } = useOutletContext() || {};

  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'list' | 'calendar' | 'analytics'
  const [isLoading, setIsLoading] = useState(true);

  // List View sorting & selection
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [listSortBy, setListSortBy] = useState('order');

  // Edit Project Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editPriority, setEditPriority] = useState('medium');

  const fetchProjectData = async () => {
    setIsLoading(true);
    try {
      const [projRes, boardRes, taskRes] = await Promise.all([
        projectAPI.getProjectById(id),
        boardAPI.getBoard(id),
        taskAPI.getTasks({ projectId: id, limit: 150 })
      ]);

      setProject(projRes.data);
      setEditName(projRes.data.name);
      setEditDesc(projRes.data.description || '');
      setEditStatus(projRes.data.status);
      setEditPriority(projRes.data.priority);

      setColumns(boardRes.data?.columns || []);
      setTasks(taskRes.data || []);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  if (isLoading || !project) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Loading project workspace & workflow...
      </div>
    );
  }

  // Handle Edit Project
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await projectAPI.updateProject(id, {
        name: editName,
        description: editDesc,
        status: editStatus,
        priority: editPriority
      });
      setProject(res.data);
      setShowEditModal(false);
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Permanently delete project ${project.name} and all its tasks?`)) return;
    try {
      await projectAPI.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Bulk operations in List view
  const handleBulkStatus = async (newStatus) => {
    if (selectedTaskIds.length === 0) return;
    try {
      await taskAPI.bulkUpdate({ taskIds: selectedTaskIds, updates: { status: newStatus } });
      setSelectedTaskIds([]);
      fetchProjectData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedTaskIds.length} tasks?`)) return;
    try {
      await taskAPI.bulkDelete({ taskIds: selectedTaskIds });
      setSelectedTaskIds([]);
      fetchProjectData();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleSelectTask = (taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((t) => t._id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Project Header */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </button>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 mt-0.5"
                style={{ backgroundColor: project.color || '#6366f1' }}
              >
                {project.key}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {project.name}
                  </h1>
                  <StatusBadge status={project.status} size="xs" />
                  <PriorityBadge priority={project.priority} size="xs" />
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* Quick Actions & Progress */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
              <div className="w-40 sm:w-44">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">Sprint Progress</span>
                  <span className="font-bold text-slate-800">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Edit2}
                  onClick={() => setShowEditModal(true)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  icon={Plus}
                  onClick={onOpenCreateTask}
                >
                  Add Task
                </Button>
              </div>
            </div>
          </div>

          {/* Members & Dates Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-medium">Assigned Team:</span>
              <div className="flex -space-x-1.5 overflow-hidden">
                {project.members?.map((m) => (
                  <Avatar key={m._id} name={m.user?.name} src={m.user?.avatar} size="xs" />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-500">
              {project.startDate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
                </div>
              )}
              {project.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('kanban')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'kanban'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <KanbanIcon className="w-4 h-4" />
          <span>Kanban Board</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full font-bold text-[10px]">
            {tasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'list'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ListIcon className="w-4 h-4" />
          <span>List View</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Calendar</span>
        </button>
      </div>

      {/* View Content */}
      {activeTab === 'kanban' && (
        <KanbanBoard
          projectId={id}
          workspaceId={currentWorkspace?._id}
          columns={columns}
          tasks={tasks}
          members={project.members || []}
          onTaskClick={(t) => onOpenTask && onOpenTask(t._id)}
          onTasksChanged={fetchProjectData}
          onColumnsChanged={fetchProjectData}
        />
      )}

      {/* List View with Bulk Operations */}
      {activeTab === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          {/* Bulk Action Bar */}
          {selectedTaskIds.length > 0 && (
            <div className="bg-brand-50 p-3 px-4 flex items-center justify-between border-b border-brand-100">
              <span className="text-xs font-semibold text-brand-900">
                {selectedTaskIds.length} tasks selected
              </span>
              <div className="flex items-center gap-2">
                <Button size="xs" variant="secondary" onClick={() => handleBulkStatus('in_progress')}>
                  Move to In Progress
                </Button>
                <Button size="xs" variant="secondary" onClick={() => handleBulkStatus('done')}>
                  Mark Done
                </Button>
                <Button size="xs" variant="danger" onClick={handleBulkDelete}>
                  Delete Selected
                </Button>
              </div>
            </div>
          )}

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.length === tasks.length && tasks.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="px-4 py-3">Task ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr
                  key={task._id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  onClick={() => onOpenTask && onOpenTask(task._id)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.includes(task._id)}
                      onChange={() => toggleSelectTask(task._id)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-600">
                    {task.taskId}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 group-hover:text-brand-700">
                    {task.title}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.status}
                      onChange={async (e) => {
                        await taskAPI.updateTask(task._id, { status: e.target.value });
                        fetchProjectData();
                      }}
                      className="text-xs font-medium bg-slate-50 border border-slate-200 rounded px-2 py-1"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={task.priority} size="xs" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={task.assignee?.name || 'Unassigned'} src={task.assignee?.avatar} size="xs" />
                      <span className="text-slate-700 font-medium truncate max-w-[120px]">
                        {task.assignee?.name || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Calendar View */}
      {activeTab === 'calendar' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Project Deadlines & Schedule</h3>
            <span className="text-xs text-slate-500">Scheduled by due date</span>
          </div>

          <div className="space-y-3">
            {tasks
              .filter((t) => t.dueDate)
              .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
              .map((t) => {
                const isOverdue = !t.isCompleted && new Date(t.dueDate) < new Date();
                return (
                  <div
                    key={t._id}
                    onClick={() => onOpenTask && onOpenTask(t._id)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        {t.taskId}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">{t.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StatusBadge status={t.status} size="xs" />
                          <PriorityBadge priority={t.priority} size="xs" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Avatar name={t.assignee?.name} src={t.assignee?.avatar} size="xs" />
                        <span className="text-slate-600">{t.assignee?.name || 'Unassigned'}</span>
                      </div>
                      <div className={`flex items-center gap-1 font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

            {tasks.filter((t) => t.dueDate).length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                No tasks have due dates set yet. Edit a task to assign deadlines.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Project"
        subtitle="Update project settings, scope, or roadmap status"
      >
        <form onSubmit={handleUpdateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="dangerOutline"
              size="sm"
              icon={Trash2}
              onClick={handleDeleteProject}
            >
              Delete Project
            </Button>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
