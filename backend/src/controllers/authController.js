import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { Invitation } from '../models/Invitation.js';
import { ApiResponse } from '../utils/apiResponse.js';

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'collabspace_super_secret_jwt_key_2026_xyz987',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, invitationToken } = req.body;

    if (!name || !email || !password) {
      return ApiResponse.error(res, 'Please provide name, email, and password.', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return ApiResponse.error(res, 'A user with this email already exists.', 400);
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password
    });

    let defaultWorkspace = null;

    // Check if registering via an invitation token
    if (invitationToken) {
      const invite = await Invitation.findOne({
        token: invitationToken,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      });

      if (invite) {
        await WorkspaceMember.create({
          workspace: invite.workspace,
          user: user._id,
          role: invite.role
        });
        invite.status = 'accepted';
        await invite.save();
        defaultWorkspace = await Workspace.findById(invite.workspace);
      }
    }

    // If no workspace joined from invite, create initial workspace
    if (!defaultWorkspace) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
      defaultWorkspace = await Workspace.create({
        name: `${name}'s Workspace`,
        slug,
        owner: user._id,
        description: 'Personal workspace for projects and tasks.'
      });

      await WorkspaceMember.create({
        workspace: defaultWorkspace._id,
        user: user._id,
        role: 'owner'
      });
    }

    const token = generateToken(user._id);

    return ApiResponse.success(
      res,
      'Registration successful',
      {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          title: user.title,
          preferences: user.preferences
        },
        defaultWorkspace: {
          _id: defaultWorkspace._id,
          name: defaultWorkspace.name,
          slug: defaultWorkspace.slug
        }
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return ApiResponse.error(res, 'Please provide email and password.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return ApiResponse.error(res, 'Invalid email or password.', 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return ApiResponse.error(res, 'Invalid email or password.', 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Fetch user's workspaces
    const memberships = await WorkspaceMember.find({ user: user._id })
      .populate('workspace')
      .sort({ createdAt: 1 });

    const workspaces = memberships
      .filter((m) => m.workspace && !m.workspace.isArchived)
      .map((m) => ({
        _id: m.workspace._id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
        logo: m.workspace.logo
      }));

    return ApiResponse.success(res, 'Login successful', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        title: user.title,
        bio: user.bio,
        systemRole: user.systemRole,
        preferences: user.preferences
      },
      workspaces
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const memberships = await WorkspaceMember.find({ user: user._id })
      .populate('workspace')
      .sort({ createdAt: 1 });

    const workspaces = memberships
      .filter((m) => m.workspace && !m.workspace.isArchived)
      .map((m) => ({
        _id: m.workspace._id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        role: m.role,
        logo: m.workspace.logo,
        settings: m.workspace.settings
      }));

    return ApiResponse.success(res, 'Profile retrieved', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        title: user.title,
        bio: user.bio,
        systemRole: user.systemRole,
        preferences: user.preferences
      },
      workspaces
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, title, bio, preferences } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (title !== undefined) user.title = title;
    if (bio !== undefined) user.bio = bio;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    return ApiResponse.success(res, 'Profile updated successfully', {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      title: user.title,
      bio: user.bio,
      preferences: user.preferences
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ApiResponse.error(res, 'Please provide both current and new password.', 400);
    }

    if (newPassword.length < 6) {
      return ApiResponse.error(res, 'New password must be at least 6 characters.', 400);
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return ApiResponse.error(res, 'Current password does not match.', 400);
    }

    user.password = newPassword;
    await user.save();

    return ApiResponse.success(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
