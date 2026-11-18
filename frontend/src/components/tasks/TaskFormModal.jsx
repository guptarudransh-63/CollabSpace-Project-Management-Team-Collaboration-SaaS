import React, { useState, useEffect } from 'react';
import { projectAPI } from '../../api/projects.js';
import { taskAPI } from '../../api/tasks.js';
import { workspaceAPI } from '../../api/workspaces.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Modal } from '../common/Modal.jsx';
import { Button } from '../common/Button.jsx';

export const TaskFormModal = ({ isOpen, onClose, defaultProjectId = null, onTaskCreated }) => {
  const { currentWorkspace } = useAuth();
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(0);

  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  useEffect(() => {
    if (!currentWorkspace?._id || !isOpen) return;

    const loadData = async () => {
      try {
        const [projRes, memRes] = await Promise.all([
          projectAPI.getProjects({ workspaceId: currentWorkspace._id }),
          workspaceAPI.getMembers(currentWorkspace._id)
        ]);
        setProjects(projRes.data || []);
        setMembers(memRes.data || []);

        if (!projectId && projRes.data?.length > 0) {
          setProjectId(projRes.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load projects/members for task creation:', err);
      }
    };

    loadData();
  }, [currentWorkspace?._id, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    setIsSubmitting(true);
    try {
      const res = await taskAPI.createTask({
        title: title.trim(),
        description: description.trim(),
        projectId,
        workspaceId: currentWorkspace._id,
        status,
        priority,
        assignee: assignee || null,
        dueDate: dueDate || undefined,
        estimatedHours: Number(estimatedHours) || 0
      });

      if (onTaskCreated) onTaskCreated(res.data);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setAssignee('');
      setDueDate('');
      setEstimatedHours(0);
    } catch (err) {
      alert(`Error creating task: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" subtitle="Add a new task to your project workflow">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Project *</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </div>

        {/* Task Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Implement drag-and-drop Kanban column reordering"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            placeholder="Write brief task specifications or requirements..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
          />
        </div>

        {/* Grid: Priority, Status, Assignee, Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m._id} value={m.user?._id}>
                  {m.user?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
