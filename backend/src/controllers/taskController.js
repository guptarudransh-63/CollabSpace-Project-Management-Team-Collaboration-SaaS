import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { BoardColumn } from '../models/BoardColumn.js';
import { Board } from '../models/Board.js';
import { Subtask } from '../models/Subtask.js';
import { TaskComment } from '../models/TaskComment.js';
import { TaskAttachment } from '../models/TaskAttachment.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { logActivity } from '../services/activityService.js';
import { createNotification } from '../services/notificationService.js';

// Helper to update project progress
const updateProjectProgress = async (projectId) => {
  try {
    const total = await Task.countDocuments({ project: projectId });
    const completed = await Task.countDocuments({ project: projectId, isCompleted: true });
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    await Project.findByIdAndUpdate(projectId, { progress });
  } catch (err) {
    console.error('Error updating project progress:', err);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const {
      workspaceId,
      projectId,
      status,
      priority,
      assignee,
      labels,
      search,
      isOverdue,
      page = 1,
      limit = 100,
      sortBy = 'order',
      sortDirection = 'asc'
    } = req.query;

    const query = {};

    if (workspaceId) query.workspace = workspaceId;
    if (projectId) query.project = projectId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) {
      query.assignee = assignee === 'unassigned' ? null : assignee;
    }
    if (labels) {
      const labelArray = labels.split(',').map((l) => l.trim());
      query.labels = { $in: labelArray };
    }
    if (isOverdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.isCompleted = false;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { taskId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortDirection === 'desc' ? -1 : 1;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Task.countDocuments(query);

    const tasks = await Task.find(query)
      .populate('assignee', 'name email avatar title')
      .populate('creator', 'name email avatar')
      .populate('project', 'name key color')
      .populate('column', 'name key color order')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    // Attach subtask counts
    const tasksWithDetails = await Promise.all(
      tasks.map(async (task) => {
        const subtaskTotal = await Subtask.countDocuments({ task: task._id });
        const subtaskCompleted = await Subtask.countDocuments({ task: task._id, isCompleted: true });
        const commentCount = await TaskComment.countDocuments({ task: task._id });
        const attachmentCount = await TaskAttachment.countDocuments({ task: task._id });

        return {
          ...task.toObject(),
          subtaskCount: subtaskTotal,
          subtaskCompletedCount: subtaskCompleted,
          commentCount,
          attachmentCount
        };
      })
    );

    return ApiResponse.paginated(res, 'Tasks retrieved', tasksWithDetails, {
      page: Number(page),
      limit: Number(limit),
      total
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description = '',
      projectId,
      workspaceId,
      columnId,
      status = 'todo',
      priority = 'medium',
      assignee = null,
      startDate,
      dueDate,
      estimatedHours = 0,
      labels = []
    } = req.body;

    if (!title || !projectId || !workspaceId) {
      return ApiResponse.error(res, 'Title, project, and workspace are required', 400);
    }

    // Atomically increment project task sequence for unique sequential ID (e.g. CSP-101)
    const project = await Project.findByIdAndUpdate(
      projectId,
      { $inc: { taskSeq: 1 } },
      { new: true }
    );

    if (!project) {
      return ApiResponse.error(res, 'Project not found', 404);
    }

    const taskId = `${project.key}-${project.taskSeq}`;

    // Find target column
    let targetColumn = null;
    if (columnId) {
      targetColumn = await BoardColumn.findById(columnId);
    } else {
      // Find matching column or default to first column
      targetColumn = await BoardColumn.findOne({ project: projectId, key: status });
      if (!targetColumn) {
        targetColumn = await BoardColumn.findOne({ project: projectId }).sort({ order: 1 });
      }
    }

    if (!targetColumn) {
      return ApiResponse.error(res, 'No Kanban column found for this project', 400);
    }

    // Determine order (place at bottom of column)
    const taskCountInColumn = await Task.countDocuments({ column: targetColumn._id });

    const isCompleted = targetColumn.key === 'done' || status === 'done';

    const task = await Task.create({
      taskId,
      title,
      description,
      project: projectId,
      workspace: workspaceId,
      board: targetColumn.board,
      column: targetColumn._id,
      order: taskCountInColumn,
      status: targetColumn.key || status,
      priority,
      assignee: assignee || null,
      creator: req.user._id,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedHours,
      labels: Array.isArray(labels) ? labels : [],
      isCompleted,
      completedAt: isCompleted ? new Date() : undefined
    });

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email avatar title')
      .populate('creator', 'name email avatar')
      .populate('project', 'name key color')
      .populate('column', 'name key color order');

    // Notification if assigned
    if (assignee && assignee.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: assignee,
        sender: req.user._id,
        workspace: workspaceId,
        project: projectId,
        task: task._id,
        type: 'task_assigned',
        title: `Task Assigned: ${taskId}`,
        message: `${req.user.name} assigned you task: "${task.title}"`,
        link: `/projects/${projectId}?task=${task._id}`
      });
    }

    // Activity log
    await logActivity({
      workspace: workspaceId,
      project: projectId,
      task: task._id,
      actor: req.user._id,
      action: 'task_created',
      entityType: 'task',
      entityId: task._id,
      entityTitle: `${taskId}: ${task.title}`,
      metadata: { priority, status: task.status }
    });

    await updateProjectProgress(projectId);

    return ApiResponse.success(res, 'Task created successfully', populated, 201);
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('assignee', 'name email avatar title')
      .populate('creator', 'name email avatar')
      .populate('project', 'name key color')
      .populate('column', 'name key color order');

    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    const subtasks = await Subtask.find({ task: id }).sort({ order: 1 });
    const comments = await TaskComment.find({ task: id })
      .populate('user', 'name email avatar title')
      .sort({ createdAt: 1 });
    const attachments = await TaskAttachment.find({ task: id })
      .populate('uploader', 'name email avatar')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Task retrieved', {
      ...task.toObject(),
      subtasks,
      comments,
      attachments
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      assignee,
      startDate,
      dueDate,
      estimatedHours,
      actualHours,
      labels,
      isCompleted
    } = req.body;

    const task = await Task.findById(id).populate('project');
    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    const oldStatus = task.status;
    const oldAssignee = task.assignee?.toString();

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (labels !== undefined) task.labels = labels;
    if (startDate !== undefined) task.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    if (assignee !== undefined) {
      task.assignee = assignee || null;
    }

    // Status or completion update
    if (status !== undefined && status !== oldStatus) {
      task.status = status;
      // Sync column if available
      const matchingCol = await BoardColumn.findOne({ project: task.project._id, key: status });
      if (matchingCol) {
        task.column = matchingCol._id;
      }
    }

    if (isCompleted !== undefined) {
      task.isCompleted = isCompleted;
      task.completedAt = isCompleted ? new Date() : null;
      if (isCompleted && task.status !== 'done') {
        task.status = 'done';
        const doneCol = await BoardColumn.findOne({ project: task.project._id, key: 'done' });
        if (doneCol) task.column = doneCol._id;
      }
    } else if (task.status === 'done' && !task.isCompleted) {
      task.isCompleted = true;
      task.completedAt = new Date();
    } else if (task.status !== 'done' && task.isCompleted) {
      task.isCompleted = false;
      task.completedAt = null;
    }

    await task.save();

    // Notify new assignee if changed
    const newAssigneeStr = task.assignee?.toString();
    if (newAssigneeStr && newAssigneeStr !== oldAssignee && newAssigneeStr !== req.user._id.toString()) {
      await createNotification({
        recipient: task.assignee,
        sender: req.user._id,
        workspace: task.workspace,
        project: task.project._id,
        task: task._id,
        type: 'task_assigned',
        title: `Task Reassigned: ${task.taskId}`,
        message: `${req.user.name} assigned you to task: "${task.title}"`,
        link: `/projects/${task.project._id}?task=${task._id}`
      });

      await logActivity({
        workspace: task.workspace,
        project: task.project._id,
        task: task._id,
        actor: req.user._id,
        action: 'task_assigned',
        entityType: 'task',
        entityId: task._id,
        entityTitle: `${task.taskId}: ${task.title}`
      });
    }

    // Status change activity log
    if (status && status !== oldStatus) {
      await logActivity({
        workspace: task.workspace,
        project: task.project._id,
        task: task._id,
        actor: req.user._id,
        action: 'task_status_changed',
        entityType: 'task',
        entityId: task._id,
        entityTitle: `${task.taskId}: ${task.title}`,
        metadata: { fromStatus: oldStatus, toStatus: status }
      });
    }

    await updateProjectProgress(task.project._id);

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email avatar title')
      .populate('creator', 'name email avatar')
      .populate('project', 'name key color')
      .populate('column', 'name key color order');

    return ApiResponse.success(res, 'Task updated successfully', populated);
  } catch (error) {
    next(error);
  }
};

// Reorder or Move task across Kanban columns
export const moveTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { destinationColumnId, newIndex } = req.body;

    if (!destinationColumnId || newIndex === undefined) {
      return ApiResponse.error(res, 'destinationColumnId and newIndex are required', 400);
    }

    const task = await Task.findById(id);
    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    const targetColumn = await BoardColumn.findById(destinationColumnId);
    if (!targetColumn) {
      return ApiResponse.error(res, 'Destination column not found', 404);
    }

    const sourceColumnId = task.column;
    const isColumnChange = sourceColumnId.toString() !== destinationColumnId.toString();

    // 1. Fetch tasks currently in target column sorted by order
    const targetTasks = await Task.find({
      column: destinationColumnId,
      _id: { $ne: task._id }
    }).sort({ order: 1 });

    // 2. Insert moved task at newIndex
    targetTasks.splice(newIndex, 0, task);

    // 3. Batch update orders
    const updatePromises = targetTasks.map((t, idx) =>
      Task.findByIdAndUpdate(t._id, {
        order: idx,
        column: destinationColumnId,
        status: targetColumn.key,
        isCompleted: targetColumn.key === 'done',
        completedAt: targetColumn.key === 'done' ? new Date() : null
      })
    );
    await Promise.all(updatePromises);

    // 4. If column changed, reorder remaining tasks in source column
    if (isColumnChange) {
      const sourceTasks = await Task.find({
        column: sourceColumnId,
        _id: { $ne: task._id }
      }).sort({ order: 1 });

      const sourceUpdates = sourceTasks.map((t, idx) =>
        Task.findByIdAndUpdate(t._id, { order: idx })
      );
      await Promise.all(sourceUpdates);

      await logActivity({
        workspace: task.workspace,
        project: task.project,
        task: task._id,
        actor: req.user._id,
        action: 'task_moved',
        entityType: 'task',
        entityId: task._id,
        entityTitle: `${task.taskId}: ${task.title}`,
        metadata: {
          toColumn: targetColumn.name,
          toStatus: targetColumn.key
        }
      });

      await updateProjectProgress(task.project);
    }

    const updatedTask = await Task.findById(id)
      .populate('assignee', 'name email avatar title')
      .populate('creator', 'name email avatar')
      .populate('project', 'name key color')
      .populate('column', 'name key color order');

    return ApiResponse.success(res, 'Task moved successfully', updatedTask);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    const projectId = task.project;

    await Subtask.deleteMany({ task: id });
    await TaskComment.deleteMany({ task: id });
    await TaskAttachment.deleteMany({ task: id });
    await Task.findByIdAndDelete(id);

    await logActivity({
      workspace: task.workspace,
      project: projectId,
      actor: req.user._id,
      action: 'task_deleted',
      entityType: 'task',
      entityId: task._id,
      entityTitle: `${task.taskId}: ${task.title}`
    });

    await updateProjectProgress(projectId);

    return ApiResponse.success(res, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const duplicateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const original = await Task.findById(id);
    if (!original) {
      return ApiResponse.error(res, 'Task not found', 404);
    }

    const project = await Project.findByIdAndUpdate(
      original.project,
      { $inc: { taskSeq: 1 } },
      { new: true }
    );
    const newTaskId = `${project.key}-${project.taskSeq}`;

    const taskCountInCol = await Task.countDocuments({ column: original.column });

    const duplicate = await Task.create({
      taskId: newTaskId,
      title: `${original.title} (Copy)`,
      description: original.description,
      project: original.project,
      workspace: original.workspace,
      board: original.board,
      column: original.column,
      order: taskCountInCol,
      status: original.status,
      priority: original.priority,
      assignee: original.assignee,
      creator: req.user._id,
      startDate: original.startDate,
      dueDate: original.dueDate,
      estimatedHours: original.estimatedHours,
      labels: original.labels
    });

    // Duplicate subtasks
    const subtasks = await Subtask.find({ task: id }).sort({ order: 1 });
    for (const sub of subtasks) {
      await Subtask.create({
        task: duplicate._id,
        title: sub.title,
        order: sub.order,
        isCompleted: false
      });
    }

    const populated = await Task.findById(duplicate._id)
      .populate('assignee', 'name email avatar title')
      .populate('creator', 'name email avatar')
      .populate('project', 'name key color')
      .populate('column', 'name key color order');

    await updateProjectProgress(original.project);

    return ApiResponse.success(res, 'Task duplicated successfully', populated, 201);
  } catch (error) {
    next(error);
  }
};

// Subtask management
export const addSubtask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return ApiResponse.error(res, 'Subtask title is required', 400);
    }

    const count = await Subtask.countDocuments({ task: id });
    const subtask = await Subtask.create({
      task: id,
      title,
      order: count
    });

    return ApiResponse.success(res, 'Subtask added', subtask, 201);
  } catch (error) {
    next(error);
  }
};

export const toggleSubtask = async (req, res, next) => {
  try {
    const { subtaskId } = req.params;

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask) {
      return ApiResponse.error(res, 'Subtask not found', 404);
    }

    subtask.isCompleted = !subtask.isCompleted;
    subtask.completedAt = subtask.isCompleted ? new Date() : null;
    subtask.completedBy = subtask.isCompleted ? req.user._id : null;
    await subtask.save();

    return ApiResponse.success(res, 'Subtask updated', subtask);
  } catch (error) {
    next(error);
  }
};

export const deleteSubtask = async (req, res, next) => {
  try {
    const { subtaskId } = req.params;
    await Subtask.findByIdAndDelete(subtaskId);
    return ApiResponse.success(res, 'Subtask deleted');
  } catch (error) {
    next(error);
  }
};

// Bulk Operations
export const bulkUpdateTasks = async (req, res, next) => {
  try {
    const { taskIds, updates } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return ApiResponse.error(res, 'taskIds must be a non-empty array', 400);
    }

    const validUpdates = {};
    if (updates.status) validUpdates.status = updates.status;
    if (updates.priority) validUpdates.priority = updates.priority;
    if (updates.assignee !== undefined) validUpdates.assignee = updates.assignee || null;

    if (updates.status === 'done') {
      validUpdates.isCompleted = true;
      validUpdates.completedAt = new Date();
    } else if (updates.status) {
      validUpdates.isCompleted = false;
      validUpdates.completedAt = null;
    }

    await Task.updateMany({ _id: { $in: taskIds } }, { $set: validUpdates });

    return ApiResponse.success(res, `${taskIds.length} tasks updated successfully`);
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteTasks = async (req, res, next) => {
  try {
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return ApiResponse.error(res, 'taskIds must be a non-empty array', 400);
    }

    await Subtask.deleteMany({ task: { $in: taskIds } });
    await TaskComment.deleteMany({ task: { $in: taskIds } });
    await TaskAttachment.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ _id: { $in: taskIds } });

    return ApiResponse.success(res, `${taskIds.length} tasks deleted successfully`);
  } catch (error) {
    next(error);
  }
};
