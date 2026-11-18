import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: [100, 'Workspace name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    logo: {
      type: String,
      default: ''
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    settings: {
      allowMemberInvites: {
        type: Boolean,
        default: true
      },
      defaultMemberRole: {
        type: String,
        enum: ['admin', 'project_manager', 'member'],
        default: 'member'
      },
      billingPlan: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'pro'
      }
    },
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const Workspace = mongoose.model('Workspace', workspaceSchema);
