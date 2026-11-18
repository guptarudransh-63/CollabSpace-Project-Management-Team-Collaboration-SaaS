import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [255, 'Title cannot exceed 255 characters']
    },
    description: {
      type: String,
      default: ''
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      index: true
    },
    column: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BoardColumn',
      required: true,
      index: true
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      index: true
    },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
      default: 'todo',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    startDate: {
      type: Date
    },
    dueDate: {
      type: Date,
      index: true
    },
    estimatedHours: {
      type: Number,
      default: 0
    },
    actualHours: {
      type: Number,
      default: 0
    },
    labels: [
      {
        type: String,
        trim: true
      }
    ],
    isCompleted: {
      type: Boolean,
      default: false,
      index: true
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

taskSchema.index({ project: 1, taskId: 1 }, { unique: true });
taskSchema.index({ column: 1, order: 1 });

export const Task = mongoose.model('Task', taskSchema);
