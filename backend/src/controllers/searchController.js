import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { TaskComment } from '../models/TaskComment.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const globalSearch = async (req, res, next) => {
  try {
    const { workspaceId, query } = req.query;

    if (!workspaceId || !query || query.trim().length < 2) {
      return ApiResponse.success(res, 'Search results', {
        tasks: [],
        projects: [],
        members: [],
        comments: []
      });
    }

    const cleanQuery = query.trim();
    const regex = new RegExp(cleanQuery, 'i');

    // 1. Search Tasks
    const tasks = await Task.find({
      workspace: workspaceId,
      $or: [{ title: regex }, { taskId: regex }, { description: regex }]
    })
      .populate('project', 'name key color')
      .populate('assignee', 'name avatar')
      .limit(10);

    // 2. Search Projects
    const projects = await Project.find({
      workspace: workspaceId,
      $or: [{ name: regex }, { key: regex }, { description: regex }]
    }).limit(6);

    // 3. Search Members
    const members = await WorkspaceMember.find({ workspace: workspaceId })
      .populate({
        path: 'user',
        match: { $or: [{ name: regex }, { email: regex }] },
        select: 'name email avatar title'
      })
      .limit(6);

    const validMembers = members.filter((m) => m.user !== null);

    // 4. Search Comments
    const comments = await TaskComment.find({
      content: regex
    })
      .populate({
        path: 'task',
        match: { workspace: workspaceId },
        select: 'taskId title project',
        populate: { path: 'project', select: 'name key color' }
      })
      .populate('user', 'name avatar')
      .limit(6);

    const validComments = comments.filter((c) => c.task !== null);

    return ApiResponse.success(res, 'Search results', {
      tasks,
      projects,
      members: validMembers,
      comments: validComments
    });
  } catch (error) {
    next(error);
  }
};
