import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Tag,
  CheckSquare,
  Plus,
  Trash2,
  Copy,
  Paperclip,
  MessageSquare,
  Send,
  AlertCircle,
  Link as LinkIcon,
  CheckCircle,
  MoreVertical,
  Activity,
  Edit2
} from 'lucide-react';
import { taskAPI } from '../../api/tasks.js';
import { commentAPI } from '../../api/comments.js';
import { workspaceAPI } from '../../api/workspaces.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { PriorityBadge, StatusBadge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';

export const TaskDetailModal = ({ taskId, isOpen, onClose, onTaskUpdated, onTaskDeleted }) => {
  const { user, currentWorkspace } = useAuth();
  const { socket } = useSocket();

  const [task, setTask] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(0);

  // Subtasks
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Comments & Mentions
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [mentionedUserIds, setMentionedUserIds] = useState([]);

  // Attachments
  const [attachments, setAttachments] = useState([]);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAddAttachment, setShowAddAttachment] = useState(false);

  // Active Tab: discussion vs activity
  const [activeTab, setActiveTab] = useState('discussion');

  const commentInputRef = useRef(null);

  // Load Task Details
  useEffect(() => {
    if (!taskId || !isOpen) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const res = await taskAPI.getTaskById(taskId);
        const t = res.data;
        setTask(t);
        setTitle(t.title || '');
        setDescription(t.description || '');
        setStatus(t.status || 'todo');
        setPriority(t.priority || 'medium');
        setAssigneeId(t.assignee?._id || '');
        setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '');
        setEstimatedHours(t.estimatedHours || 0);
        setSubtasks(t.subtasks || []);
        setComments(t.comments || []);
        setAttachments(t.attachments || []);

        if (currentWorkspace?._id) {
          const memRes = await workspaceAPI.getMembers(currentWorkspace._id);
          setMembers(memRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load task details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [taskId, isOpen, currentWorkspace?._id]);

  if (!isOpen) return null;

  // Handle updates
  const handleUpdateField = async (updates) => {
    try {
      const res = await taskAPI.updateTask(taskId, updates);
      setTask(res.data);
      if (onTaskUpdated) onTaskUpdated(res.data);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  // Subtasks actions
  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    try {
      const res = await taskAPI.addSubtask(taskId, { title: newSubtaskTitle.trim() });
      setSubtasks((prev) => [...prev, res.data]);
      setNewSubtaskTitle('');
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error('Failed to add subtask:', err);
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      const res = await taskAPI.toggleSubtask(subtaskId);
      setSubtasks((prev) => prev.map((s) => (s._id === subtaskId ? res.data : s)));
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await taskAPI.deleteSubtask(subtaskId);
      setSubtasks((prev) => prev.filter((s) => s._id !== subtaskId));
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      console.error('Failed to delete subtask:', err);
    }
  };

  // Comment & @mention handling
  const handleCommentChange = (e) => {
    const text = e.target.value;
    setNewComment(text);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursor);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      const q = match[1].toLowerCase();
      setMentionQuery(q);
      const matches = members.filter(
        (m) =>
          m.user?.name.toLowerCase().includes(q) ||
          m.user?.email.toLowerCase().includes(q)
      );
      setMentionSuggestions(matches);
    } else {
      setMentionQuery(null);
      setMentionSuggestions([]);
    }
  };

  const selectMention = (member) => {
    const cursor = commentInputRef.current.selectionStart;
    const textBeforeCursor = newComment.slice(0, cursor);
    const textAfterCursor = newComment.slice(cursor);
    const replaced = textBeforeCursor.replace(/@\w*$/, `@${member.user.name} `);

    setNewComment(replaced + textAfterCursor);
    setMentionedUserIds((prev) => [...new Set([...prev, member.user._id])]);
    setMentionQuery(null);
    setMentionSuggestions([]);
    commentInputRef.current.focus();
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await commentAPI.addComment(taskId, {
        content: newComment.trim(),
        mentions: mentionedUserIds
      });
      setComments((prev) => [...prev, res.data]);
      setNewComment('');
      setMentionedUserIds([]);
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  // Attachment actions
  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!attachmentName || !attachmentUrl) return;

    try {
      const res = await commentAPI.addAttachment(taskId, {
        name: attachmentName,
        url: attachmentUrl,
        fileType: 'link'
      });
      setAttachments((prev) => [res.data, ...prev]);
      setAttachmentName('');
      setAttachmentUrl('');
      setShowAddAttachment(false);
    } catch (err) {
      console.error('Failed to add attachment:', err);
    }
  };

  const handleDeleteAttachment = async (attId) => {
    try {
      await commentAPI.deleteAttachment(attId);
      setAttachments((prev) => prev.filter((a) => a._id !== attId));
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  };

  // Duplicate / Delete Task
  const handleDuplicate = async () => {
    try {
      const res = await taskAPI.duplicateTask(taskId);
      if (onTaskUpdated) onTaskUpdated(res.data);
      onClose();
    } catch (err) {
      console.error('Failed to duplicate task:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete task ${task?.taskId}?`)) return;
    try {
      await taskAPI.deleteTask(taskId);
      if (onTaskDeleted) onTaskDeleted(taskId);
      onClose();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const completedSubtasksCount = subtasks.filter((s) => s.isCompleted).length;
  const subtasksPercent = subtasks.length > 0 ? Math.round((completedSubtasksCount / subtasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div
          className="relative bg-white rounded-2xl shadow-modal w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                {task?.taskId || 'TASK'}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-600">
                {task?.project?.name || 'Project'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDuplicate}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
                title="Duplicate Task"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Main Content (2-Column SaaS Layout) */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Left 2 Columns: Title, Description, Subtasks, Comments */}
            <div className="p-6 md:col-span-2 space-y-6">
              {/* Title Input */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleUpdateField({ title })}
                  placeholder="Task title..."
                  className="w-full text-xl font-bold text-slate-900 border-none hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 rounded-lg px-2 py-1 -ml-2 transition-all outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => handleUpdateField({ description })}
                  placeholder="Add a detailed description, specifications, or notes..."
                  className="w-full text-sm text-slate-700 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-y"
                />
              </div>

              {/* Subtasks / Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Checklist ({completedSubtasksCount}/{subtasks.length})
                    </span>
                  </div>
                  {subtasks.length > 0 && (
                    <span className="text-xs font-medium text-slate-500">{subtasksPercent}%</span>
                  )}
                </div>

                {/* Progress Bar */}
                {subtasks.length > 0 && (
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${subtasksPercent}%` }}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  {subtasks.map((st) => (
                    <div
                      key={st._id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={st.isCompleted}
                          onChange={() => handleToggleSubtask(st._id)}
                          className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                        />
                        <span
                          className={`text-sm truncate ${
                            st.isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {st.title}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteSubtask(st._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSubtask} className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add an item to checklist..."
                    className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <Button type="submit" size="xs" variant="secondary" icon={Plus}>
                    Add
                  </Button>
                </form>
              </div>

              {/* Attachments Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Attachments ({attachments.length})
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddAttachment(!showAddAttachment)}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Link/Asset
                  </button>
                </div>

                {showAddAttachment && (
                  <form
                    onSubmit={handleAddAttachment}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 mb-3"
                  >
                    <input
                      type="text"
                      placeholder="Asset Title (e.g. Figma Prototype, Specs Doc)"
                      value={attachmentName}
                      onChange={(e) => setAttachmentName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="xs"
                        variant="ghost"
                        type="button"
                        onClick={() => setShowAddAttachment(false)}
                      >
                        Cancel
                      </Button>
                      <Button size="xs" type="submit">
                        Attach
                      </Button>
                    </div>
                  </form>
                )}

                <div className="space-y-1">
                  {attachments.map((att) => (
                    <div
                      key={att._id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 group"
                    >
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs font-medium text-brand-700 hover:underline truncate"
                      >
                        <LinkIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{att.name}</span>
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(att._id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discussion Thread */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Discussion & Activity ({comments.length})
                  </span>
                </div>

                {/* Comment Box with @Mention Autosuggest */}
                <div className="relative mb-6">
                  {mentionQuery !== null && mentionSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-1 w-64 bg-white rounded-xl shadow-dropdown border border-slate-200 py-1 z-30 max-h-48 overflow-y-auto">
                      <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                        Mention Member
                      </div>
                      {mentionSuggestions.map((m) => (
                        <button
                          key={m._id}
                          type="button"
                          onClick={() => selectMention(m)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-slate-50 transition-colors"
                        >
                          <Avatar name={m.user?.name} src={m.user?.avatar} size="xs" />
                          <span className="font-medium text-slate-800 truncate">{m.user?.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handlePostComment} className="flex gap-2">
                    <Avatar name={user?.name} src={user?.avatar} size="sm" />
                    <div className="flex-1">
                      <textarea
                        ref={commentInputRef}
                        rows={2}
                        value={newComment}
                        onChange={handleCommentChange}
                        placeholder="Write a comment or type @ to mention a teammate..."
                        className="w-full text-xs p-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                      />
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[11px] text-slate-400">
                          Use <code className="bg-slate-100 px-1 rounded text-slate-600">@name</code> to alert teammates
                        </span>
                        <Button
                          type="submit"
                          size="xs"
                          variant="primary"
                          icon={Send}
                          disabled={!newComment.trim()}
                        >
                          Comment
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Comment History List */}
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div key={c._id} className="flex gap-2.5 text-xs">
                      <Avatar name={c.user?.name} src={c.user?.avatar} size="sm" />
                      <div className="flex-1 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-900">{c.user?.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Metadata Attributes & Selectors */}
            <div className="p-6 space-y-5 bg-slate-50/40">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Attributes
              </h4>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    handleUpdateField({ status: e.target.value });
                  }}
                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    handleUpdateField({ priority: e.target.value });
                  }}
                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Assignee Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAssigneeId(val);
                    handleUpdateField({ assignee: val || null });
                  }}
                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m._id} value={m.user?._id}>
                      {m.user?.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    handleUpdateField({ dueDate: e.target.value || null });
                  }}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Estimated Effort */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Estimated Hours</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  onBlur={() => handleUpdateField({ estimatedHours })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Task Metadata Read-Only */}
              <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1.5">
                <div className="flex justify-between">
                  <span>Created by:</span>
                  <span className="font-medium text-slate-700">{task?.creator?.name || 'User'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created on:</span>
                  <span>{task?.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Updated on:</span>
                  <span>{task?.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
