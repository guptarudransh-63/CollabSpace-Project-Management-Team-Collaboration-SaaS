import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { ProjectMilestone } from '../models/ProjectMilestone.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getWorkspaceDashboardMetrics = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    // 1. Projects stats
    const totalProjects = await Project.countDocuments({ workspace: workspaceId, isArchived: false });
    const activeProjects = await Project.countDocuments({ workspace: workspaceId, status: 'active', isArchived: false });
    const completedProjects = await Project.countDocuments({ workspace: workspaceId, status: 'completed' });
    const planningProjects = await Project.countDocuments({ workspace: workspaceId, status: 'planning' });

    // 2. Tasks stats
    const totalTasks = await Task.countDocuments({ workspace: workspaceId });
    const completedTasks = await Task.countDocuments({ workspace: workspaceId, isCompleted: true });
    const inProgressTasks = await Task.countDocuments({ workspace: workspaceId, status: 'in_progress' });
    const inReviewTasks = await Task.countDocuments({ workspace: workspaceId, status: 'in_review' });
    const todoTasks = await Task.countDocuments({ workspace: workspaceId, status: 'todo' });
    const backlogTasks = await Task.countDocuments({ workspace: workspaceId, status: 'backlog' });

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const overdueTasks = await Task.countDocuments({
      workspace: workspaceId,
      isCompleted: false,
      dueDate: { $lt: now }
    });

    const dueSoonTasks = await Task.countDocuments({
      workspace: workspaceId,
      isCompleted: false,
      dueDate: { $gte: now, $lte: in7Days }
    });

    // 3. Priority distribution
    const tasksByPriority = [
      { priority: 'urgent', count: await Task.countDocuments({ workspace: workspaceId, priority: 'urgent' }) },
      { priority: 'high', count: await Task.countDocuments({ workspace: workspaceId, priority: 'high' }) },
      { priority: 'medium', count: await Task.countDocuments({ workspace: workspaceId, priority: 'medium' }) },
      { priority: 'low', count: await Task.countDocuments({ workspace: workspaceId, priority: 'low' }) }
    ];

    // 4. Status distribution
    const tasksByStatus = [
      { status: 'Backlog', count: backlogTasks, color: '#64748b' },
      { status: 'To Do', count: todoTasks, color: '#3b82f6' },
      { status: 'In Progress', count: inProgressTasks, color: '#f59e0b' },
      { status: 'In Review', count: inReviewTasks, color: '#8b5cf6' },
      { status: 'Done', count: completedTasks, color: '#10b981' }
    ];

    // 5. Workload by member
    const members = await WorkspaceMember.find({ workspace: workspaceId }).populate('user', 'name email avatar');
    const memberWorkload = await Promise.all(
      members.map(async (m) => {
        if (!m.user) return null;
        const activeCount = await Task.countDocuments({
          workspace: workspaceId,
          assignee: m.user._id,
          isCompleted: false
        });
        const completedCount = await Task.countDocuments({
          workspace: workspaceId,
          assignee: m.user._id,
          isCompleted: true
        });

        return {
          userId: m.user._id,
          name: m.user.name,
          email: m.user.email,
          avatar: m.user.avatar,
          activeTasks: activeCount,
          completedTasks: completedCount,
          total: activeCount + completedCount
        };
      })
    );

    // 6. Weekly completion trend (past 7 days)
    const completionTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const count = await Task.countDocuments({
        workspace: workspaceId,
        isCompleted: true,
        completedAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const dayName = startOfDay.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      completionTrends.push({ day: dayName, completed: count });
    }

    // 7. Recent workspace activity
    const recentActivity = await ActivityLog.find({ workspace: workspaceId })
      .populate('actor', 'name avatar')
      .populate('project', 'name key color')
      .populate('task', 'taskId title')
      .sort({ createdAt: -1 })
      .limit(6);

    return ApiResponse.success(res, 'Dashboard metrics retrieved', {
      summary: {
        totalProjects,
        activeProjects,
        completedProjects,
        planningProjects,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        overdueTasks,
        dueSoonTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      tasksByStatus,
      tasksByPriority,
      memberWorkload: memberWorkload.filter(Boolean),
      completionTrends,
      recentActivity
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectAnalytics = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return ApiResponse.error(res, 'Project not found', 404);
    }

    const totalTasks = await Task.countDocuments({ project: projectId });
    const completedTasks = await Task.countDocuments({ project: projectId, isCompleted: true });
    const inProgressTasks = await Task.countDocuments({ project: projectId, status: 'in_progress' });
    const inReviewTasks = await Task.countDocuments({ project: projectId, status: 'in_review' });
    const todoTasks = await Task.countDocuments({ project: projectId, status: 'todo' });
    const backlogTasks = await Task.countDocuments({ project: projectId, status: 'backlog' });

    const now = new Date();
    const overdueTasks = await Task.countDocuments({
      project: projectId,
      isCompleted: false,
      dueDate: { $lt: now }
    });

    const tasksByPriority = [
      { priority: 'urgent', count: await Task.countDocuments({ project: projectId, priority: 'urgent' }) },
      { priority: 'high', count: await Task.countDocuments({ project: projectId, priority: 'high' }) },
      { priority: 'medium', count: await Task.countDocuments({ project: projectId, priority: 'medium' }) },
      { priority: 'low', count: await Task.countDocuments({ project: projectId, priority: 'low' }) }
    ];

    const milestones = await ProjectMilestone.find({ project: projectId }).sort({ dueDate: 1 });

    return ApiResponse.success(res, 'Project analytics retrieved', {
      project: {
        name: project.name,
        key: project.key,
        progress: project.progress
      },
      summary: {
        totalTasks,
        completedTasks,
        overdueTasks,
        inProgressTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      statusBreakdown: [
        { name: 'Backlog', count: backlogTasks, color: '#64748b' },
        { name: 'To Do', count: todoTasks, color: '#3b82f6' },
        { name: 'In Progress', count: inProgressTasks, color: '#f59e0b' },
        { name: 'In Review', count: inReviewTasks, color: '#8b5cf6' },
        { name: 'Done', count: completedTasks, color: '#10b981' }
      ],
      priorityBreakdown: tasksByPriority,
      milestones
    });
  } catch (error) {
    next(error);
  }
};
