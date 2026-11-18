import mongoose from 'mongoose';

const taskCommentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskComment',
      default: null
    },
    attachments: [
      {
        name: String,
        url: String,
        fileType: String,
        size: Number
      }
    ],
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const TaskComment = mongoose.model('TaskComment', taskCommentSchema);
