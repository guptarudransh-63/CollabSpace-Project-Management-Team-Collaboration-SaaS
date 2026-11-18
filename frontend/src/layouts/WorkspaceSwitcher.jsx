import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronsUpDown, Check, Plus, Settings, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export const WorkspaceSwitcher = ({ onOpenNewWorkspaceModal }) => {
  const { workspaces, currentWorkspace, switchWorkspace } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 transition-colors text-left group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-subtle shrink-0">
            {currentWorkspace?.name ? currentWorkspace.name[0].toUpperCase() : 'C'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-slate-900 truncate">
              {currentWorkspace?.name || 'CollabSpace'}
            </h2>
            <p className="text-[11px] text-slate-500 capitalize truncate">
              {currentWorkspace?.role || currentWorkspace?.myRole || 'Member'} Workspace
            </p>
          </div>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-dropdown border border-slate-200/80 py-1.5 z-40">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspaces ({workspaces.length})
          </div>

          <div className="max-h-48 overflow-y-auto py-1">
            {workspaces.map((ws) => {
              const isSelected = ws._id === currentWorkspace?._id;
              return (
                <button
                  key={ws._id}
                  onClick={() => {
                    switchWorkspace(ws);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                    isSelected ? 'bg-brand-50/70 text-brand-900 font-medium' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold shrink-0">
                      {ws.name[0].toUpperCase()}
                    </div>
                    <span className="truncate">{ws.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onOpenNewWorkspaceModal) onOpenNewWorkspaceModal();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Workspace</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/settings');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Workspace Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
