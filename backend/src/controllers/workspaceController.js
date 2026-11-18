import crypto from 'crypto';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { Invitation } from '../models/Invitation.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';
import { sendEmail } from '../services/emailService.js';

// Get all workspaces the user belongs to
export const getMyWorkspaces = async (req, res, next) => {
  try {
    const memberships = await WorkspaceMember.find({ user: req.user._id })
      .populate('workspace')
      .sort({ createdAt: -1 });

    const workspaces = memberships
      .filter((m) => m.workspace && !m.workspace.isArchived)
      .map((m) => ({
        ...m.workspace.toObject(),
        myRole: m.role,
        joinedAt: m.joinedAt
      }));

    return ApiResponse.success(res, 'Workspaces retrieved', workspaces);
  } catch (error) {
    next(error);
  }
};

// Create a new workspace
export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description, logo } = req.body;

    if (!name) {
      return ApiResponse.error(res, 'Workspace name is required', 400);
    }

    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const workspace = await Workspace.create({
      name,
      slug,
      description: description || '',
      logo: logo || '',
      owner: req.user._id
    });

    await WorkspaceMember.create({
      workspace: workspace._id,
      user: req.user._id,
      role: 'owner'
    });

    await logActivity({
      workspace: workspace._id,
      actor: req.user._id,
      action: 'project_created',
      entityType: 'workspace',
      entityId: workspace._id,
      entityTitle: workspace.name,
      metadata: { description }
    });

    return ApiResponse.success(res, 'Workspace created successfully', {
      ...workspace.toObject(),
      myRole: 'owner'
    }, 201);
  } catch (error) {
    next(error);
  }
};

// Get single workspace details
export const getWorkspaceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id).populate('owner', 'name email avatar');

    if (!workspace || workspace.isArchived) {
      return ApiResponse.error(res, 'Workspace not found', 404);
    }

    const membership = await WorkspaceMember.findOne({
      workspace: workspace._id,
      user: req.user._id
    });

    if (!membership) {
      return ApiResponse.error(res, 'Access denied', 403);
    }

    const memberCount = await WorkspaceMember.countDocuments({ workspace: workspace._id });

    return ApiResponse.success(res, 'Workspace retrieved', {
      ...workspace.toObject(),
      myRole: membership.role,
      memberCount
    });
  } catch (error) {
    next(error);
  }
};

// Update workspace
export const updateWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, logo, settings } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return ApiResponse.error(res, 'Workspace not found', 404);
    }

    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (logo !== undefined) workspace.logo = logo;
    if (settings) {
      workspace.settings = { ...workspace.settings, ...settings };
    }

    await workspace.save();

    await logActivity({
      workspace: workspace._id,
      actor: req.user._id,
      action: 'project_updated',
      entityType: 'workspace',
      entityId: workspace._id,
      entityTitle: workspace.name
    });

    return ApiResponse.success(res, 'Workspace updated successfully', workspace);
  } catch (error) {
    next(error);
  }
};

// Get members of workspace with role & task workload
export const getWorkspaceMembers = async (req, res, next) => {
  try {
    const { id } = req.params;

    const members = await WorkspaceMember.find({ workspace: id })
      .populate('user', 'name email avatar title lastLoginAt')
      .sort({ createdAt: 1 });

    // Calculate workload (assigned active tasks)
    const membersWithWorkload = await Promise.all(
      members.map(async (m) => {
        if (!m.user) return null;
        const activeTasksCount = await Task.countDocuments({
          workspace: id,
          assignee: m.user._id,
          isCompleted: false
        });
        const completedTasksCount = await Task.countDocuments({
          workspace: id,
          assignee: m.user._id,
          isCompleted: true
        });

        return {
          _id: m._id,
          role: m.role,
          joinedAt: m.joinedAt,
          user: m.user,
          workload: {
            activeTasks: activeTasksCount,
            completedTasks: completedTasksCount
          }
        };
      })
    );

    return ApiResponse.success(
      res,
      'Members retrieved',
      membersWithWorkload.filter(Boolean)
    );
  } catch (error) {
    next(error);
  }
};

// Invite a member
export const inviteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role = 'member' } = req.body;

    if (!email) {
      return ApiResponse.error(res, 'Email is required', 400);
    }

    const cleanEmail = email.toLowerCase().trim();
    const workspace = await Workspace.findById(id);

    // Check if user already in workspace
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const existingMember = await WorkspaceMember.findOne({
        workspace: id,
        user: existingUser._id
      });
      if (existingMember) {
        return ApiResponse.error(res, 'User is already a member of this workspace', 400);
      }
    }

    // Check existing pending invitation
    let invitation = await Invitation.findOne({
      workspace: id,
      email: cleanEmail,
      status: 'pending'
    });

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (invitation) {
      invitation.token = token;
      invitation.role = role;
      invitation.expiresAt = expiresAt;
      await invitation.save();
    } else {
      invitation = await Invitation.create({
        workspace: id,
        inviter: req.user._id,
        email: cleanEmail,
        role,
        token,
        expiresAt
      });
    }

    // Send invitation email
    const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/invite/${token}`;
    await sendEmail({
      to: cleanEmail,
      subject: `You have been invited to join ${workspace.name} on CollabSpace`,
      html: `
        <h2>Join ${workspace.name} on CollabSpace</h2>
        <p><strong>${req.user.name}</strong> has invited you to join the workspace as a <strong>${role}</strong>.</p>
        <p><a href="${inviteUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a></p>
        <p>Or paste this link in your browser: ${inviteUrl}</p>
      `
    });

    if (existingUser) {
      await createNotification({
        recipient: existingUser._id,
        sender: req.user._id,
        workspace: id,
        type: 'workspace_invite',
        title: `Workspace Invitation: ${workspace.name}`,
        message: `${req.user.name} invited you to join ${workspace.name} as a ${role}.`,
        link: `/invite/${token}`
      });
    }

    await logActivity({
      workspace: id,
      actor: req.user._id,
      action: 'member_invited',
      entityType: 'member',
      entityTitle: cleanEmail,
      metadata: { role, invitedEmail: cleanEmail }
    });

    return ApiResponse.success(res, 'Invitation sent successfully', {
      invitationId: invitation._id,
      email: cleanEmail,
      role,
      token,
      expiresAt
    });
  } catch (error) {
    next(error);
  }
};

// Accept an invitation
export const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return ApiResponse.error(res, 'Invitation token is required', 400);
    }

    const invitation = await Invitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('workspace');

    if (!invitation) {
      return ApiResponse.error(res, 'Invalid or expired invitation token', 400);
    }

    // Check if user is already a member
    let membership = await WorkspaceMember.findOne({
      workspace: invitation.workspace._id,
      user: req.user._id
    });

    if (!membership) {
      membership = await WorkspaceMember.create({
        workspace: invitation.workspace._id,
        user: req.user._id,
        role: invitation.role
      });
    }

    invitation.status = 'accepted';
    await invitation.save();

    await logActivity({
      workspace: invitation.workspace._id,
      actor: req.user._id,
      action: 'member_joined',
      entityType: 'member',
      entityTitle: req.user.name,
      metadata: { role: invitation.role }
    });

    return ApiResponse.success(res, 'Invitation accepted successfully', {
      workspace: invitation.workspace,
      role: invitation.role
    });
  } catch (error) {
    next(error);
  }
};

// Update member role
export const updateMemberRole = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body;

    if (!['admin', 'project_manager', 'member'].includes(role)) {
      return ApiResponse.error(res, 'Invalid role specified', 400);
    }

    const targetMember = await WorkspaceMember.findOne({ _id: memberId, workspace: id }).populate('user');
    if (!targetMember) {
      return ApiResponse.error(res, 'Member not found', 404);
    }

    if (targetMember.role === 'owner') {
      return ApiResponse.error(res, 'Cannot modify workspace owner role', 400);
    }

    const oldRole = targetMember.role;
    targetMember.role = role;
    await targetMember.save();

    await logActivity({
      workspace: id,
      actor: req.user._id,
      action: 'member_role_changed',
      entityType: 'member',
      entityTitle: targetMember.user.name,
      metadata: { fromRole: oldRole, toRole: role }
    });

    return ApiResponse.success(res, 'Member role updated successfully', targetMember);
  } catch (error) {
    next(error);
  }
};

// Remove member from workspace
export const removeMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;

    const targetMember = await WorkspaceMember.findOne({ _id: memberId, workspace: id }).populate('user');
    if (!targetMember) {
      return ApiResponse.error(res, 'Member not found', 404);
    }

    if (targetMember.role === 'owner') {
      return ApiResponse.error(res, 'Cannot remove the workspace owner', 400);
    }

    await WorkspaceMember.findByIdAndDelete(memberId);

    // Unassign tasks in this workspace
    await Task.updateMany(
      { workspace: id, assignee: targetMember.user._id },
      { $set: { assignee: null } }
    );

    await logActivity({
      workspace: id,
      actor: req.user._id,
      action: 'member_removed',
      entityType: 'member',
      entityTitle: targetMember.user.name
    });

    return ApiResponse.success(res, 'Member removed successfully');
  } catch (error) {
    next(error);
  }
};

// Get pending invitations
export const getPendingInvitations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invitations = await Invitation.find({
      workspace: id,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).populate('inviter', 'name email');

    return ApiResponse.success(res, 'Invitations retrieved', invitations);
  } catch (error) {
    next(error);
  }
};
