import { Board } from '../models/Board.js';
import { BoardColumn } from '../models/BoardColumn.js';
import { Task } from '../models/Task.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getProjectBoard = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    let board = await Board.findOne({ project: projectId, isDefault: true });
    if (!board) {
      board = await Board.findOne({ project: projectId });
    }

    if (!board) {
      return ApiResponse.error(res, 'Board not found for this project', 404);
    }

    const columns = await BoardColumn.find({ board: board._id }).sort({ order: 1 });

    return ApiResponse.success(res, 'Board retrieved', {
      board,
      columns
    });
  } catch (error) {
    next(error);
  }
};

export const createColumn = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { name, color = '#64748b', limit = 0 } = req.body;

    if (!name) {
      return ApiResponse.error(res, 'Column name is required', 400);
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return ApiResponse.error(res, 'Board not found', 404);
    }

    const columnCount = await BoardColumn.countDocuments({ board: boardId });
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const column = await BoardColumn.create({
      board: boardId,
      project: board.project,
      workspace: board.workspace,
      name,
      key,
      order: columnCount,
      color,
      limit
    });

    return ApiResponse.success(res, 'Column created successfully', column, 201);
  } catch (error) {
    next(error);
  }
};

export const updateColumn = async (req, res, next) => {
  try {
    const { columnId } = req.params;
    const { name, color, limit } = req.body;

    const column = await BoardColumn.findById(columnId);
    if (!column) {
      return ApiResponse.error(res, 'Column not found', 404);
    }

    if (name) column.name = name;
    if (color) column.color = color;
    if (limit !== undefined) column.limit = limit;

    await column.save();

    return ApiResponse.success(res, 'Column updated successfully', column);
  } catch (error) {
    next(error);
  }
};

export const reorderColumns = async (req, res, next) => {
  try {
    const { columnIds } = req.body; // Array of column IDs in desired order

    if (!Array.isArray(columnIds)) {
      return ApiResponse.error(res, 'columnIds must be an array', 400);
    }

    const updates = columnIds.map((id, index) =>
      BoardColumn.findByIdAndUpdate(id, { order: index })
    );

    await Promise.all(updates);

    return ApiResponse.success(res, 'Columns reordered successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteColumn = async (req, res, next) => {
  try {
    const { columnId } = req.params;
    const { targetColumnId } = req.body; // Optional column to move tasks to

    const column = await BoardColumn.findById(columnId);
    if (!column) {
      return ApiResponse.error(res, 'Column not found', 404);
    }

    const taskCount = await Task.countDocuments({ column: columnId });
    if (taskCount > 0) {
      if (!targetColumnId) {
        return ApiResponse.error(
          res,
          `Cannot delete column with ${taskCount} tasks. Please specify a targetColumnId to move tasks to.`,
          400
        );
      }
      await Task.updateMany({ column: columnId }, { $set: { column: targetColumnId } });
    }

    await BoardColumn.findByIdAndDelete(columnId);

    return ApiResponse.success(res, 'Column deleted successfully');
  } catch (error) {
    next(error);
  }
};
