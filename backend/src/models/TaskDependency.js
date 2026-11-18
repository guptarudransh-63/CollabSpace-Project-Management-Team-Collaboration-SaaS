import mongoose from 'mongoose';

const taskDependencySchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true
    },
    dependsOn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['blocks', 'blocked_by'],
      default: 'blocked_by'
    }
  },
  {
    timestamps: true
  }
);

taskDependencySchema.index({ task: 1, dependsOn: 1 }, { unique: true });

export const TaskDependency = mongoose.model('TaskDependency', taskDependencySchema);
