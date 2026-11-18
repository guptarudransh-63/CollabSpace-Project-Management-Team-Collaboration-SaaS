import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckSquare, Folder, Users, MessageSquare, ArrowRight, X, Command } from 'lucide-react';
import { searchAPI } from '../../api/services.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { PriorityBadge } from '../common/Badge.jsx';

export const GlobalSearchModal = ({ isOpen, onClose, onOpenTask }) => {
  const { currentWorkspace } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tasks: [], projects: [], members: [], comments: [] });
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ tasks: [], projects: [], members: [], comments: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2 || !currentWorkspace?._id) {
      setResults({ tasks: [], projects: [], members: [], comments: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchAPI.search({
          workspaceId: currentWorkspace._id,
          query: query.trim()
        });
        setResults(res.data || { tasks: [], projects: [], members: [], comments: [] });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, currentWorkspace?._id]);

  if (!isOpen) return null;

  const totalResults =
    results.tasks.length + results.projects.length + results.members.length + results.comments.length;

  const handleSelectTask = (task) => {
    onClose();
    if (onOpenTask) {
      onOpenTask(task._id);
    } else {
      navigate(`/projects/${task.project?._id || task.project}?task=${task._id}`);
    }
  };

  const handleSelectProject = (project) => {
    onClose();
    navigate(`/projects/${project._id}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="min-h-full flex items-start justify-center p-4 pt-16 sm:pt-24 text-center">
        <div
          className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all w-full max-w-2xl border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search tasks, projects, members, comments... (e.g. 'Kanban', 'CLD-3')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-medium text-slate-400 bg-slate-100 rounded border border-slate-200">
              ESC
            </kbd>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50/50 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'tasks' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Tasks ({results.tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'projects' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Projects ({results.projects.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'members' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Members ({results.members.length})
            </button>
          </div>

          {/* Search Body */}
          <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
            {isLoading && (
              <div className="py-8 text-center text-sm text-slate-500">
                Searching workspace...
              </div>
            )}

            {!isLoading && query && totalResults === 0 && (
              <div className="py-12 text-center">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">No results found for "{query}"</p>
                <p className="text-xs text-slate-400 mt-1">Try searching by task key, title, or member name.</p>
              </div>
            )}

            {!query && (
              <div className="p-4 text-xs text-slate-400">
                <p className="font-semibold text-slate-500 uppercase tracking-wider text-[11px] mb-2">Search Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  {['CLD-1', 'Kanban', 'Elena', 'Sprint', 'SOC2'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      className="px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks Section */}
            {(activeTab === 'all' || activeTab === 'tasks') && results.tasks.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Tasks</span>
                </div>
                {results.tasks.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => handleSelectTask(task)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                        {task.taskId}
                      </span>
                      <span className="text-sm font-medium text-slate-800 truncate">{task.title}</span>
                      {task.project?.name && (
                        <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                          in <span className="text-slate-600">{task.project.name}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <PriorityBadge priority={task.priority} size="xs" />
                      <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Projects Section */}
            {(activeTab === 'all' || activeTab === 'projects') && results.projects.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5" />
                  <span>Projects</span>
                </div>
                {results.projects.map((project) => (
                  <button
                    key={project._id}
                    onClick={() => handleSelectProject(project)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: project.color || '#6366f1' }}
                      />
                      <span className="text-sm font-medium text-slate-800">{project.name}</span>
                      <span className="text-xs font-mono text-slate-400">({project.key})</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}

            {/* Members Section */}
            {(activeTab === 'all' || activeTab === 'members') && results.members.length > 0 && (
              <div className="py-2">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>Members</span>
                </div>
                {results.members.map((m) => (
                  <div
                    key={m._id}
                    className="px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={m.user?.name} src={m.user?.avatar} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{m.user?.name}</p>
                        <p className="text-xs text-slate-400">{m.user?.email}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 capitalize">{m.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
