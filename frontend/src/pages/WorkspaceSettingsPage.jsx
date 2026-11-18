import React, { useState, useEffect } from 'react';
import { Settings, Building2, Shield, CreditCard, AlertTriangle, Check, Sparkles } from 'lucide-react';
import { workspaceAPI } from '../api/workspaces.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/common/Button.jsx';

export const WorkspaceSettingsPage = () => {
  const { currentWorkspace, refreshWorkspaces } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allowInvites, setAllowInvites] = useState(true);
  const [defaultRole, setDefaultRole] = useState('member');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      setName(currentWorkspace.name || '');
      setDescription(currentWorkspace.description || '');
      setAllowInvites(currentWorkspace.settings?.allowMemberInvites ?? true);
      setDefaultRole(currentWorkspace.settings?.defaultMemberRole || 'member');
    }
  }, [currentWorkspace]);

  const canManage =
    currentWorkspace?.myRole === 'owner' ||
    currentWorkspace?.myRole === 'admin' ||
    currentWorkspace?.role === 'owner' ||
    currentWorkspace?.role === 'admin';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    setIsSaving(true);
    try {
      await workspaceAPI.updateWorkspace(currentWorkspace._id, {
        name,
        description,
        settings: {
          allowMemberInvites: allowInvites,
          defaultMemberRole: defaultRole
        }
      });
      await refreshWorkspaces();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure preferences, collaboration rules, and billing details
        </p>
      </div>

      {!canManage && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>You are viewing workspace settings in read-only mode. Only Owners and Admins can modify settings.</span>
        </div>
      )}

      {/* General Settings */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building2 className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-900">General Information</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Workspace Name</label>
            <input
              type="text"
              disabled={!canManage}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Workspace Slug</label>
            <input
              type="text"
              disabled
              value={currentWorkspace?.slug || ''}
              className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed font-mono text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            disabled={!canManage}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 resize-none"
          />
        </div>

        {/* Member Permissions */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-brand-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Member Permissions & Defaults
            </h4>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              disabled={!canManage}
              checked={allowInvites}
              onChange={(e) => setAllowInvites(e.target.checked)}
              className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
            />
            <div>
              <span className="text-xs font-semibold text-slate-800">Allow Member Invitations</span>
              <p className="text-[11px] text-slate-500">Allow admins and managers to invite new teammates</p>
            </div>
          </label>

          <div className="max-w-xs pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Invite Role</label>
            <select
              disabled={!canManage}
              value={defaultRole}
              onChange={(e) => setDefaultRole(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none disabled:bg-slate-50"
            >
              <option value="member">Member</option>
              <option value="project_manager">Project Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {savedSuccess ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Changes saved successfully!
              </span>
            ) : <span />}
            <Button type="submit" isLoading={isSaving}>
              Save Workspace
            </Button>
          </div>
        )}
      </form>

      {/* Subscription Tier Showcase */}
      <div className="bg-gradient-to-br from-brand-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-brand-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>CollabSpace Pro Tier</span>
          </div>
          <h3 className="text-xl font-extrabold text-white mb-2">Unlimited Scalability & Real-Time Sync</h3>
          <p className="text-xs text-brand-200 max-w-xl leading-relaxed mb-4">
            Your workspace is operating on the Enterprise Pro tier with zero rate-limits, full Socket.IO concurrency, and comprehensive audit history.
          </p>

          <div className="flex flex-wrap gap-4 text-xs font-medium text-brand-100">
            <span>✓ Unlimited Projects & Boards</span>
            <span>✓ Real-time Socket.IO Sync</span>
            <span>✓ Automated Deadline Cron</span>
            <span>✓ Full Role Hierarchy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
