import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Table as TableIcon,
  Clock,
  ArrowRight
} from 'lucide-react';
import { projectAPI } from '../api/projects.js';
import { workspaceAPI } from '../api/workspaces.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar } from '../components/common/Avatar.jsx';
import { StatusBadge, PriorityBadge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Modal } from '../components/common/Modal.jsx';

export const ProjectsPage = () => {
  const { currentWorkspace, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Views
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Create Project Modal
  const isCreateParam = searchParams.get('create') === 'true';
  const [showCreateModal, setShowCreateModal] = useState(isCreateParam);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [priority, setPriority] = useState('medium');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    if (!currentWorkspace?._id) return;
    setIsLoading(true);
    try {
      const res = await projectAPI.getProjects({
        workspaceId: currentWorkspace._id,
        search: search || undefined,
        status: statusFilter || undefined
      });
      setProjects(res.data || []);

      const memRes = await workspaceAPI.getMembers(currentWorkspace._id);
      setWorkspaceMembers(memRes.data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentWorkspace?._id, search, statusFilter]);

  // Auto-generate project key from name
  const handleNameChange = (val) => {
    setName(val);
    if (!key || key.length <= 4) {
      const generated = val
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 3)
        .toUpperCase();
      if (generated) setKey(generated);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await projectAPI.createProject({
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description: description.trim(),
        workspaceId: currentWorkspace._id,
        priority,
        color,
        startDate: startDate || undefined,
        deadline: deadline || undefined,
        memberIds: selectedMemberIds
      });

      setShowCreateModal(false);
      setName('');
      setKey('');
      setDescription('');
      setSelectedMemberIds([]);
      navigate(`/projects/${res.data._id}`);
    } catch (err) {
      alert(`Error creating project: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMemberSelection = (id) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your workspace roadmap, teams, and milestones
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${
                viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table view"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-subtle">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="text-slate-900 font-bold">{projects.length}</span> projects
        </div>
      </div>

      {/* Project Display: Grid or Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj._id}
              onClick={() => navigate(`/projects/${proj._id}`)}
              className="group bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-brand-500/50 hover:shadow-card transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header: Key & Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: proj.color || '#6366f1' }}
                    />
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {proj.key}
                    </span>
                  </div>
                  <StatusBadge status={proj.status} size="xs" />
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-700 transition-colors mb-1.5">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              <div>
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Progress</span>
                    <span className="font-bold text-slate-800">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all duration-300"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>

                {/* Task Stats Row */}
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 rounded-xl text-center mb-4">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{proj.stats?.totalTasks || 0}</span>
                    <span className="block text-[10px] text-slate-400 font-medium">Total</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-600">{proj.stats?.completedTasks || 0}</span>
                    <span className="block text-[10px] text-slate-400 font-medium">Done</span>
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${proj.stats?.overdueTasks > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {proj.stats?.overdueTasks || 0}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">Overdue</span>
                  </div>
                </div>

                {/* Footer: Members & Deadline */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {proj.members?.slice(0, 4).map((m) => (
                      <Avatar key={m._id} name={m.user?.name} src={m.user?.avatar} size="xs" />
                    ))}
                    {proj.members?.length > 4 && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                        +{proj.members.length - 4}
                      </span>
                    )}
                  </div>

                  {proj.deadline && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date(proj.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Tasks</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((proj) => (
                <tr
                  key={proj._id}
                  onClick={() => navigate(`/projects/${proj._id}`)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || '#6366f1' }}
                      />
                      <span className="font-mono text-slate-500 font-bold">{proj.key}</span>
                      <span className="font-semibold text-slate-900">{proj.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={proj.status} size="xs" />
                  </td>
                  <td className="px-4 py-3.5">
                    <PriorityBadge priority={proj.priority} size="xs" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-brand-600 rounded-full"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700">{proj.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    <span className="font-semibold text-slate-900">{proj.stats?.completedTasks}</span>/{proj.stats?.totalTasks}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">
                    {proj.deadline ? new Date(proj.deadline).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex -space-x-1.5">
                      {proj.members?.slice(0, 3).map((m) => (
                        <Avatar key={m._id} name={m.user?.name} src={m.user?.avatar} size="xs" />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {projects.length === 0 && !isLoading && (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No projects found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create your first project to start organizing tasks, workflows, and milestones.
          </p>
          <div className="mt-4">
            <Button size="sm" icon={Plus} onClick={() => setShowCreateModal(true)}>
              Create Project
            </Button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        subtitle="Configure your project workflow, members, and roadmap"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mobile App Redesign"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Key *</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="MOB"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="w-full text-sm font-mono uppercase px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="What is the objective and scope of this project?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Theme Color</label>
              <div className="flex gap-2 pt-1">
                {['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'].map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                      }`}
                    />
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none"
              />
            </div>
          </div>

          {/* Assign Team Members */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assign Team Members
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {workspaceMembers.map((m) => {
                const isSelected = selectedMemberIds.includes(m.user?._id);
                return (
                  <div
                    key={m._id}
                    onClick={() => toggleMemberSelection(m.user?._id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-50 text-brand-900' : 'hover:bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={m.user?.name} src={m.user?.avatar} size="xs" />
                      <span className="text-xs font-medium">{m.user?.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 capitalize">{m.role}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowCreateModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
