import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [255, 'Subtask title cannot exceed 255 characters']
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    order: {
      type: Number,
      default: 0
    },
    completedAt: {
      type: Date
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

subtaskSchema.index({ task: 1, order: 1 });

export const Subtask = mongoose.model('Subtask', subtaskSchema);
