import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { Board } from '../models/Board.js';
import { BoardColumn } from '../models/BoardColumn.js';
import { Task } from '../models/Task.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';

// Default Kanban columns for any new project
const DEFAULT_COLUMNS = [
  { name: 'Backlog', key: 'backlog', order: 0, color: '#64748b' },
  { name: 'To Do', key: 'todo', order: 1, color: '#3b82f6' },
  { name: 'In Progress', key: 'in_progress', order: 2, color: '#f59e0b' },
  { name: 'In Review', key: 'in_review', order: 3, color: '#8b5cf6' },
  { name: 'Done', key: 'done', order: 4, color: '#10b981' }
];

export const getProjects = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    const { status, priority, search, isArchived } = req.query;

    const query = {
      workspace: workspaceId,
      isArchived: isArchived === 'true'
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { key: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .sort({ updatedAt: -1 });

    // Attach task summary and member count to each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ project: project._id });
        const completedTasks = await Task.countDocuments({ project: project._id, isCompleted: true });
        const overdueTasks = await Task.countDocuments({
          project: project._id,
          isCompleted: false,
          dueDate: { $lt: new Date() }
        });
        const members = await ProjectMember.find({ project: project._id }).populate('user', 'name avatar email');

        const calculatedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress;

        return {
          ...project.toObject(),
          progress: calculatedProgress,
          stats: {
            totalTasks,
            completedTasks,
            overdueTasks,
            pendingTasks: totalTasks - completedTasks
          },
          members: members.map((m) => ({
            _id: m._id,
            user: m.user,
            role: m.role
          }))
        };
      })
    );

    return ApiResponse.success(res, 'Projects retrieved', projectsWithStats);
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const {
      name,
      key,
      description,
      workspaceId,
      status = 'active',
      priority = 'medium',
      color = '#6366f1',
      icon = 'briefcase',
      startDate,
      deadline,
      memberIds = []
    } = req.body;

    if (!name || !key || !workspaceId) {
      return ApiResponse.error(res, 'Project name, key, and workspace are required', 400);
    }

    const cleanKey = key.toUpperCase().trim();

    // Check key uniqueness in workspace
    const existingKey = await Project.findOne({ workspace: workspaceId, key: cleanKey });
    if (existingKey) {
      return ApiResponse.error(res, `Project key "${cleanKey}" already exists in this workspace`, 400);
    }

    // 1. Create Project
    const project = await Project.create({
      name,
      key: cleanKey,
      description,
      workspace: workspaceId,
      owner: req.user._id,
      status,
      priority,
      color,
      icon,
      startDate: startDate ? new Date(startDate) : undefined,
      deadline: deadline ? new Date(deadline) : undefined
    });

    // 2. Add creator as project manager
    await ProjectMember.create({
      project: project._id,
      user: req.user._id,
      workspace: workspaceId,
      role: 'manager'
    });

    // Add other members if provided
    for (const memberId of memberIds) {
      if (memberId !== req.user._id.toString()) {
        await ProjectMember.create({
          project: project._id,
          user: memberId,
          workspace: workspaceId,
          role: 'contributor'
        });

        await createNotification({
          recipient: memberId,
          sender: req.user._id,
          workspace: workspaceId,
          project: project._id,
          type: 'project_added',
          title: `Added to Project: ${project.name}`,
          message: `${req.user.name} added you to project ${project.name} (${cleanKey})`,
          link: `/projects/${project._id}`
        });
      }
    }

    // 3. Create default Kanban Board
    const board = await Board.create({
      name: 'Main Board',
      project: project._id,
      workspace: workspaceId,
      isDefault: true
    });

    // 4. Create default Columns
    for (const col of DEFAULT_COLUMNS) {
      await BoardColumn.create({
        board: board._id,
        project: project._id,
        workspace: workspaceId,
        name: col.name,
        key: col.key,
        order: col.order,
        color: col.color
      });
    }

    // 5. Activity log
    await logActivity({
      workspace: workspaceId,
      project: project._id,
      actor: req.user._id,
      action: 'project_created',
      entityType: 'project',
      entityId: project._id,
      entityTitle: project.name,
      metadata: { key: cleanKey, priority }
    });

    return ApiResponse.success(res, 'Project created successfully', project, 201);
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('owner', 'name email avatar')
      .populate('workspace', 'name slug');

    if (!project) {
      return ApiResponse.error(res, 'Project not found', 404);
    }

    const members = await ProjectMember.find({ project: project._id })
      .populate('user', 'name email avatar title')
      .sort({ createdAt: 1 });

    const defaultBoard = await Board.findOne({ project: project._id, isDefault: true });
    const columns = defaultBoard
      ? await BoardColumn.find({ board: defaultBoard._id }).sort({ order: 1 })
      : [];

    const totalTasks = await Task.countDocuments({ project: project._id });
    const completedTasks = await Task.countDocuments({ project: project._id, isCompleted: true });
    const overdueTasks = await Task.countDocuments({
      project: project._id,
      isCompleted: false,
      dueDate: { $lt: new Date() }
    });

    return ApiResponse.success(res, 'Project retrieved', {
      ...project.toObject(),
      board: defaultBoard,
      columns,
      members,
      stats: {
        totalTasks,
        completedTasks,
        overdueTasks,
        pendingTasks: totalTasks - completedTasks,
        progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : project.progress
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, status, priority, color, icon, startDate, deadline } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return ApiResponse.error(res, 'Project not found', 404);
    }

    const previousStatus = project.status;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (priority) project.priority = priority;
    if (color) project.color = color;
    if (icon) project.icon = icon;
    if (startDate !== undefined) project.startDate = startDate ? new Date(startDate) : null;
    if (deadline !== undefined) project.deadline = deadline ? new Date(deadline) : null;

    if (status === 'completed' && previousStatus !== 'completed') {
      project.progress = 100;
    }

    await project.save();

    await logActivity({
      workspace: project.workspace,
      project: project._id,
      actor: req.user._id,
      action: status === 'completed' ? 'project_completed' : 'project_updated',
      entityType: 'project',
      entityId: project._id,
      entityTitle: project.name,
      metadata: { previousStatus, currentStatus: project.status }
    });

    return ApiResponse.success(res, 'Project updated successfully', project);
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return ApiResponse.error(res, 'Project not found', 404);
    }

    // Cascade delete related records
    await Task.deleteMany({ project: id });
    await BoardColumn.deleteMany({ project: id });
    await Board.deleteMany({ project: id });
    await ProjectMember.deleteMany({ project: id });
    await Project.findByIdAndDelete(id);

    return ApiResponse.success(res, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Add member to project
export const addProjectMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role = 'contributor' } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return ApiResponse.error(res, 'Project not found', 404);
    }

    let member = await ProjectMember.findOne({ project: id, user: userId });
    if (member) {
      member.role = role;
      await member.save();
    } else {
      member = await ProjectMember.create({
        project: id,
        user: userId,
        workspace: project.workspace,
        role
      });
    }

    const populated = await ProjectMember.findById(member._id).populate('user', 'name email avatar');

    await createNotification({
      recipient: userId,
      sender: req.user._id,
      workspace: project.workspace,
      project: project._id,
      type: 'project_added',
      title: `Added to Project: ${project.name}`,
      message: `${req.user.name} added you to project ${project.name}`,
      link: `/projects/${project._id}`
    });

    return ApiResponse.success(res, 'Member added to project', populated);
  } catch (error) {
    next(error);
  }
};

// Remove member from project
export const removeProjectMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;

    const member = await ProjectMember.findOne({ _id: memberId, project: id });
    if (!member) {
      return ApiResponse.error(res, 'Project member not found', 404);
    }

    await ProjectMember.findByIdAndDelete(memberId);

    return ApiResponse.success(res, 'Member removed from project');
  } catch (error) {
    next(error);
  }
};
