import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { workspaceAPI } from '../api/workspaces.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Avatar } from '../components/common/Avatar.jsx';
import { RoleBadge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Modal } from '../components/common/Modal.jsx';

export const TeamMembersPage = () => {
  const { currentWorkspace, user } = useAuth();
  const { isUserOnline } = useSocket();

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchMembers = async () => {
    if (!currentWorkspace?._id) return;
    setIsLoading(true);
    try {
      const [memRes, invRes] = await Promise.all([
        workspaceAPI.getMembers(currentWorkspace._id),
        workspaceAPI.getInvitations(currentWorkspace._id)
      ]);
      setMembers(memRes.data || []);
      setInvitations(invRes.data || []);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentWorkspace?._id]);

  const canManageMembers =
    currentWorkspace?.myRole === 'owner' ||
    currentWorkspace?.myRole === 'admin' ||
    currentWorkspace?.role === 'owner' ||
    currentWorkspace?.role === 'admin';

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      const res = await workspaceAPI.inviteMember(currentWorkspace._id, {
        email: inviteEmail.trim(),
        role: inviteRole
      });

      const inviteUrl = `${window.location.origin}/register?token=${res.data.token}`;
      setGeneratedInviteLink(inviteUrl);
      fetchMembers();
    } catch (err) {
      alert(`Invite error: ${err.message}`);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await workspaceAPI.updateMemberRole(currentWorkspace._id, memberId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m._id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      alert(`Role update error: ${err.message}`);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;
    try {
      await workspaceAPI.removeMember(currentWorkspace._id, memberId);
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
    } catch (err) {
      alert(`Remove error: ${err.message}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Members</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage workspace collaborators, access permissions, and roles
          </p>
        </div>

        {canManageMembers && (
          <Button
            size="sm"
            variant="primary"
            icon={UserPlus}
            onClick={() => {
              setGeneratedInviteLink('');
              setInviteEmail('');
              setShowInviteModal(true);
            }}
          >
            Invite Member
          </Button>
        )}
      </div>

      {/* Members Directory List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Active Members ({members.length})
          </h3>
          <span className="text-xs text-slate-500">
            {members.filter((m) => isUserOnline(m.user?._id)).length} online right now
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((member) => {
            const isSelf = member.user?._id === user?._id;
            const isOnline = isUserOnline(member.user?._id);

            return (
              <div
                key={member._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                {/* Member Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={member.user?.name}
                    src={member.user?.avatar}
                    size="md"
                    isOnline={isOnline}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {member.user?.name}
                      </p>
                      {isSelf && (
                        <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{member.user?.email}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {member.user?.title || 'Product Specialist'}
                    </p>
                  </div>
                </div>

                {/* Role & Workload Stats */}
                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                  {/* Task Workload */}
                  <div className="text-left sm:text-right text-xs">
                    <div className="font-semibold text-slate-800">
                      <span>{member.workload?.activeTasks || 0} active</span>
                      <span className="text-slate-400 font-normal"> / {member.workload?.completedTasks || 0} done</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Assigned workload</span>
                  </div>

                  {/* Role Selector or Badge */}
                  {canManageMembers && member.role !== 'owner' && !isSelf ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member._id, e.target.value)}
                      className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
                    >
                      <option value="admin">Admin</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="member">Member</option>
                    </select>
                  ) : (
                    <RoleBadge role={member.role} />
                  )}

                  {/* Remove Member button */}
                  {canManageMembers && member.role !== 'owner' && !isSelf && (
                    <button
                      onClick={() => handleRemoveMember(member._id, member.user?.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invitations Section */}
      {canManageMembers && invitations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Pending Invitations ({invitations.length})
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {invitations.map((inv) => (
              <div key={inv._id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{inv.email}</p>
                  <p className="text-[11px] text-slate-400">
                    Role: <span className="capitalize">{inv.role}</span> • Invited by {inv.inviter?.name}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite New Member"
        subtitle="Send an invitation link to collaborate in this workspace"
      >
        {!generatedInviteLink ? (
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none"
              >
                <option value="member">Member — view & update assigned tasks</option>
                <option value="project_manager">Project Manager — manage projects & tasks</option>
                <option value="admin">Admin — manage projects, members, & settings</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setShowInviteModal(false)}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isInviting}>
                Send Invitation
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Invitation Link Generated!</h4>
              <p className="text-xs text-slate-500 mt-1">
                Share this secure link with <strong>{inviteEmail}</strong> to join as {inviteRole}:
              </p>
            </div>

            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={generatedInviteLink}
                className="flex-1 bg-transparent text-xs text-slate-700 focus:outline-none truncate"
              />
              <Button size="xs" variant="secondary" icon={copied ? Check : Copy} onClick={copyToClipboard}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="pt-3">
              <Button size="sm" variant="primary" onClick={() => setShowInviteModal(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
