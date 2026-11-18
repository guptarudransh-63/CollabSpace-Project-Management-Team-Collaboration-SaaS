import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../models/User.js';
import { Workspace } from '../models/Workspace.js';
import { WorkspaceMember } from '../models/WorkspaceMember.js';
import { Project } from '../models/Project.js';
import { ProjectMember } from '../models/ProjectMember.js';
import { Board } from '../models/Board.js';
import { BoardColumn } from '../models/BoardColumn.js';
import { Task } from '../models/Task.js';
import { Subtask } from '../models/Subtask.js';
import { TaskComment } from '../models/TaskComment.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Notification } from '../models/Notification.js';
import { SavedView } from '../models/SavedView.js';
import { ProjectMilestone } from '../models/ProjectMilestone.js';

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/collabspace';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      WorkspaceMember.deleteMany({}),
      Project.deleteMany({}),
      ProjectMember.deleteMany({}),
      Board.deleteMany({}),
      BoardColumn.deleteMany({}),
      Task.deleteMany({}),
      Subtask.deleteMany({}),
      TaskComment.deleteMany({}),
      ActivityLog.deleteMany({}),
      Notification.deleteMany({}),
      SavedView.deleteMany({}),
      ProjectMilestone.deleteMany({})
    ]);

    console.log('Existing collections cleared.');

    // 1. Create Users
    const ownerUser = await User.create({
      name: 'Sarah Connor',
      email: 'owner@collabspace.io',
      password: 'Password123!',
      title: 'Founder & CEO',
      bio: 'Building the future of team orchestration and modern SaaS engineering.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      preferences: { theme: 'light', defaultView: 'kanban' }
    });

    const adminUser = await User.create({
      name: 'Marcus Vance',
      email: 'admin@collabspace.io',
      password: 'Password123!',
      title: 'VP of Engineering',
      bio: 'Cloud architecture enthusiast, distributed systems lead.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      preferences: { theme: 'light', defaultView: 'kanban' }
    });

    const pmUser = await User.create({
      name: 'Elena Rostova',
      email: 'pm@collabspace.io',
      password: 'Password123!',
      title: 'Lead Product Manager',
      bio: 'Obsessed with user experience, agile velocity, and crisp roadmaps.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      preferences: { theme: 'light', defaultView: 'kanban' }
    });

    const memberUser = await User.create({
      name: 'Alex Chen',
      email: 'member@collabspace.io',
      password: 'Password123!',
      title: 'Senior Full Stack Engineer',
      bio: 'TypeScript, React, Golang, and high performance APIs.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      preferences: { theme: 'light', defaultView: 'kanban' }
    });

    const designerUser = await User.create({
      name: 'Maya Patel',
      email: 'designer@collabspace.io',
      password: 'Password123!',
      title: 'Principal Product Designer',
      bio: 'Figma wizard, design tokens, micro-interactions, and accessible web standards.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      preferences: { theme: 'light', defaultView: 'kanban' }
    });

    const qaUser = await User.create({
      name: 'Liam O\'Connor',
      email: 'qa@collabspace.io',
      password: 'Password123!',
      title: 'QA Automation Architect',
      bio: 'E2E testing with Playwright, Cypress, CI regressions, and chaos engineering.',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      preferences: { theme: 'light', defaultView: 'list' }
    });

    const devopsUser = await User.create({
      name: 'Jordan Taylor',
      email: 'devops@collabspace.io',
      password: 'Password123!',
      title: 'Staff DevOps & SRE',
      bio: 'Kubernetes orchestration, Terraform IAC, zero-downtime blue/green rollouts.',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      preferences: { theme: 'dark', defaultView: 'kanban' }
    });

    const allUsers = [ownerUser, adminUser, pmUser, memberUser, designerUser, qaUser, devopsUser];
    console.log(`Created ${allUsers.length} demo users.`);

    // 2. Create Workspaces
    const workspaceAcme = await Workspace.create({
      name: 'Acme Technologies',
      slug: 'acme-tech',
      description: 'Global engineering, product innovation, and customer platform.',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80',
      owner: ownerUser._id,
      settings: {
        allowMemberInvites: true,
        defaultMemberRole: 'member',
        billingPlan: 'pro'
      }
    });

    const workspaceQuantum = await Workspace.create({
      name: 'Quantum Labs',
      slug: 'quantum-labs',
      description: 'Applied AI research, intelligent automation workflows, and model fine-tuning.',
      logo: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=100&auto=format&fit=crop&q=80',
      owner: adminUser._id,
      settings: {
        allowMemberInvites: true,
        defaultMemberRole: 'member',
        billingPlan: 'enterprise'
      }
    });

    // 3. Workspace Memberships
    // Acme Memberships
    await Promise.all([
      WorkspaceMember.create({ workspace: workspaceAcme._id, user: ownerUser._id, role: 'owner' }),
      WorkspaceMember.create({ workspace: workspaceAcme._id, user: adminUser._id, role: 'admin' }),
      WorkspaceMember.create({ workspace: workspaceAcme._id, user: pmUser._id, role: 'project_manager' }),
      WorkspaceMember.create({ workspace: workspaceAcme._id, user: memberUser._id, role: 'member' }),
      WorkspaceMember.create({ workspace: workspaceAcme._id, user: designerUser._id, role: 'member' }),
      WorkspaceMember.create({ workspace: workspaceAcme._id, user: qaUser._id, role: 'member' }),
      WorkspaceMember.create({ workspace: workspaceAcme._id, user: devopsUser._id, role: 'member' })
    ]);

    // Quantum Memberships
    await Promise.all([
      WorkspaceMember.create({ workspace: workspaceQuantum._id, user: adminUser._id, role: 'owner' }),
      WorkspaceMember.create({ workspace: workspaceQuantum._id, user: ownerUser._id, role: 'admin' }),
      WorkspaceMember.create({ workspace: workspaceQuantum._id, user: pmUser._id, role: 'project_manager' }),
      WorkspaceMember.create({ workspace: workspaceQuantum._id, user: memberUser._id, role: 'member' }),
      WorkspaceMember.create({ workspace: workspaceQuantum._id, user: devopsUser._id, role: 'member' })
    ]);

    console.log('Workspaces and memberships created.');

    // Helper to generate board & standard columns
    const setupBoardAndColumns = async (project, workspaceId) => {
      const board = await Board.create({
        name: 'Main Board',
        project: project._id,
        workspace: workspaceId,
        isDefault: true
      });

      const colBacklog = await BoardColumn.create({ board: board._id, project: project._id, workspace: workspaceId, name: 'Backlog', key: 'backlog', order: 0, color: '#64748b' });
      const colTodo = await BoardColumn.create({ board: board._id, project: project._id, workspace: workspaceId, name: 'To Do', key: 'todo', order: 1, color: '#3b82f6' });
      const colInProgress = await BoardColumn.create({ board: board._id, project: project._id, workspace: workspaceId, name: 'In Progress', key: 'in_progress', order: 2, color: '#f59e0b' });
      const colInReview = await BoardColumn.create({ board: board._id, project: project._id, workspace: workspaceId, name: 'In Review', key: 'in_review', order: 3, color: '#8b5cf6' });
      const colDone = await BoardColumn.create({ board: board._id, project: project._id, workspace: workspaceId, name: 'Done', key: 'done', order: 4, color: '#10b981' });

      return {
        board,
        columns: {
          backlog: colBacklog,
          todo: colTodo,
          in_progress: colInProgress,
          in_review: colInReview,
          done: colDone
        }
      };
    };

    // 4. Create Projects
    // Acme Project 1: Cloud Platform 2.0
    const project1 = await Project.create({
      name: 'Cloud Platform 2.0',
      key: 'CLD',
      description: 'Next-generation distributed microservices infrastructure and multi-tenant telemetry.',
      workspace: workspaceAcme._id,
      owner: ownerUser._id,
      status: 'active',
      priority: 'urgent',
      color: '#6366f1',
      icon: 'server',
      startDate: new Date('2026-10-01'),
      deadline: new Date('2026-12-15'),
      progress: 68,
      taskSeq: 8
    });

    // Acme Project 2: Mobile App Redesign
    const project2 = await Project.create({
      name: 'Mobile App Redesign',
      key: 'MOB',
      description: 'Native iOS & Android overhaul with fluid gesture animations, offline sync, and biometric auth.',
      workspace: workspaceAcme._id,
      owner: pmUser._id,
      status: 'active',
      priority: 'high',
      color: '#06b6d4',
      icon: 'smartphone',
      startDate: new Date('2026-10-15'),
      deadline: new Date('2026-12-30'),
      progress: 52,
      taskSeq: 6
    });

    // Acme Project 3: SOC2 Type II Compliance
    const project3 = await Project.create({
      name: 'SOC2 Type II Compliance',
      key: 'SEC',
      description: 'Audit preparation, automated security scans, zero-trust network policies, and role boundaries.',
      workspace: workspaceAcme._id,
      owner: adminUser._id,
      status: 'active',
      priority: 'medium',
      color: '#10b981',
      icon: 'shield-check',
      startDate: new Date('2026-11-01'),
      deadline: new Date('2027-01-31'),
      progress: 40,
      taskSeq: 5
    });

    // Acme Project 4: Design System & UI Kit
    const project4 = await Project.create({
      name: 'Design System & UI Kit',
      key: 'DSK',
      description: 'Unified React component library with Tailwind CSS tokens, Radix UI accessibility, and Storybook docs.',
      workspace: workspaceAcme._id,
      owner: designerUser._id,
      status: 'active',
      priority: 'high',
      color: '#ec4899',
      icon: 'palette',
      startDate: new Date('2026-10-20'),
      deadline: new Date('2026-12-10'),
      progress: 60,
      taskSeq: 4
    });

    // Quantum Project 1: AI Workflow Automations
    const projectQuantum1 = await Project.create({
      name: 'AI Workflow Automations',
      key: 'AIW',
      description: 'LLM agents, vector embeddings, streaming inference APIs, and automated task summarization.',
      workspace: workspaceQuantum._id,
      owner: adminUser._id,
      status: 'active',
      priority: 'urgent',
      color: '#8b5cf6',
      icon: 'sparkles',
      startDate: new Date('2026-10-25'),
      deadline: new Date('2026-12-20'),
      progress: 50,
      taskSeq: 4
    });

    // Assign Project Memberships
    for (const proj of [project1, project2, project3, project4]) {
      for (const u of allUsers) {
        await ProjectMember.create({
          project: proj._id,
          user: u._id,
          workspace: workspaceAcme._id,
          role: u._id.equals(proj.owner) ? 'manager' : 'contributor'
        });
      }
    }

    const quantumUsers = [adminUser, ownerUser, pmUser, memberUser, devopsUser];
    for (const u of quantumUsers) {
      await ProjectMember.create({
        project: projectQuantum1._id,
        user: u._id,
        workspace: workspaceQuantum._id,
        role: u._id.equals(projectQuantum1.owner) ? 'manager' : 'contributor'
      });
    }

    // Set up Boards & Columns
    const b1 = await setupBoardAndColumns(project1, workspaceAcme._id);
    const b2 = await setupBoardAndColumns(project2, workspaceAcme._id);
    const b3 = await setupBoardAndColumns(project3, workspaceAcme._id);
    const b4 = await setupBoardAndColumns(project4, workspaceAcme._id);
    const bQ = await setupBoardAndColumns(projectQuantum1, workspaceQuantum._id);

    console.log('Projects, members, and boards initialized.');

    // 5. Tasks for Project 1: Cloud Platform 2.0 (CLD)
    const taskCLD1 = await Task.create({
      taskId: 'CLD-1',
      title: 'Architect multi-tenant event gateway with Socket.IO & Redis',
      description: 'Establish bidirectional streaming clusters with JWT authorization and automated horizontal scaling.',
      project: project1._id,
      workspace: workspaceAcme._id,
      board: b1.board._id,
      column: b1.columns.done._id,
      order: 0,
      status: 'done',
      priority: 'urgent',
      assignee: memberUser._id,
      creator: ownerUser._id,
      dueDate: new Date('2026-10-25'),
      estimatedHours: 24,
      actualHours: 22,
      labels: ['Backend', 'Sockets', 'Infra'],
      isCompleted: true,
      completedAt: new Date('2026-10-24')
    });

    const taskCLD2 = await Task.create({
      taskId: 'CLD-2',
      title: 'Implement role-based permissions matrix across all routes',
      description: 'Audit workspace owner, admin, project manager, and member permission boundaries.',
      project: project1._id,
      workspace: workspaceAcme._id,
      board: b1.board._id,
      column: b1.columns.done._id,
      order: 1,
      status: 'done',
      priority: 'high',
      assignee: adminUser._id,
      creator: ownerUser._id,
      dueDate: new Date('2026-10-28'),
      estimatedHours: 16,
      actualHours: 14,
      labels: ['Security', 'RBAC'],
      isCompleted: true,
      completedAt: new Date('2026-10-27')
    });

    const taskCLD3 = await Task.create({
      taskId: 'CLD-3',
      title: 'Build interactive Kanban board with @dnd-kit drag-and-drop',
      description: 'Smooth visual drag handles, column position persistence, optimistic state updates and socket broadcast.',
      project: project1._id,
      workspace: workspaceAcme._id,
      board: b1.board._id,
      column: b1.columns.in_progress._id,
      order: 0,
      status: 'in_progress',
      priority: 'urgent',
      assignee: memberUser._id,
      creator: pmUser._id,
      startDate: new Date('2026-11-01'),
      dueDate: new Date('2026-11-20'),
      estimatedHours: 20,
      actualHours: 8,
      labels: ['Frontend', 'Kanban', 'UI/UX']
    });

    const taskCLD4 = await Task.create({
      taskId: 'CLD-4',
      title: 'Real-time @mention notification parsing and deep link alerts',
      description: 'Parse user mentions inside comments and dispatch in-app notifications and email summaries.',
      project: project1._id,
      workspace: workspaceAcme._id,
      board: b1.board._id,
      column: b1.columns.in_review._id,
      order: 0,
      status: 'in_review',
      priority: 'high',
      assignee: pmUser._id,
      creator: memberUser._id,
      dueDate: new Date('2026-11-22'),
      estimatedHours: 12,
      actualHours: 10,
      labels: ['Notifications', 'Collaboration']
    });

    const taskCLD5 = await Task.create({
      taskId: 'CLD-5',
      title: 'Productivity metrics & Recharts burndown chart calculation',
      description: 'Aggregate historical completion trends, member workload balance, and task velocity curves.',
      project: project1._id,
      workspace: workspaceAcme._id,
      board: b1.board._id,
      column: b1.columns.todo._id,
      order: 0,
      status: 'todo',
      priority: 'medium',
      assignee: memberUser._id,
      creator: pmUser._id,
      dueDate: new Date('2026-11-25'),
      estimatedHours: 18,
      labels: ['Analytics', 'Charts']
    });

    const taskCLD6 = await Task.create({
      taskId: 'CLD-6',
      title: 'Calendar view synchronization with deadline drag-to-reschedule',
      description: 'Enable month, week, and agenda view with milestone indicators and date picker integration.',
      project: project1._id,
      workspace: workspaceAcme._id,
      board: b1.board._id,
      column: b1.columns.todo._id,
      order: 1,
      status: 'todo',
      priority: 'medium',
      assignee: adminUser._id,
      creator: pmUser._id,
      dueDate: new Date('2026-11-28'),
      estimatedHours: 14,
      labels: ['Calendar', 'UI/UX']
    });

    const taskCLD7 = await Task.create({
      taskId: 'CLD-7',
      title: 'Automated database backup replication to AWS S3 & daily snapshot tests',
      description: 'Schedule mongodump backups every 6 hours and test automated restore pipelines.',
      project: project1._id,
      workspace: workspaceAcme._id,
      board: b1.board._id,
      column: b1.columns.in_progress._id,
      order: 1,
      status: 'in_progress',
      priority: 'high',
      assignee: devopsUser._id,
      creator: adminUser._id,
      dueDate: new Date('2026-11-26'),
      estimatedHours: 16,
      actualHours: 6,
      labels: ['DevOps', 'Database', 'AWS']
    });

    const taskCLD8 = await Task.create({
      taskId: 'CLD-8',
      title: 'Evaluate distributed Redis cache layer for high-throughput workspaces',
      description: 'Benchmark query latency reduction under 5,000 concurrent socket connections.',
      project: project1._id,
      workspace: workspaceAcme._id,
      board: b1.board._id,
      column: b1.columns.backlog._id,
      order: 0,
      status: 'backlog',
      priority: 'low',
      assignee: devopsUser._id,
      creator: adminUser._id,
      dueDate: new Date('2026-12-05'),
      estimatedHours: 30,
      labels: ['Research', 'Performance']
    });

    // 6. Tasks for Project 2: Mobile App Redesign (MOB)
    const taskMOB1 = await Task.create({
      taskId: 'MOB-1',
      title: 'Migrate React Native navigation to Expo Router v4',
      description: 'Deep linking configuration, typed routes, seamless tab navigation and stack transitions.',
      project: project2._id,
      workspace: workspaceAcme._id,
      board: b2.board._id,
      column: b2.columns.done._id,
      order: 0,
      status: 'done',
      priority: 'high',
      assignee: memberUser._id,
      creator: pmUser._id,
      dueDate: new Date('2026-11-05'),
      estimatedHours: 20,
      actualHours: 18,
      labels: ['Mobile', 'Navigation', 'Expo'],
      isCompleted: true,
      completedAt: new Date('2026-11-04')
    });

    const taskMOB2 = await Task.create({
      taskId: 'MOB-2',
      title: 'Offline SQLite database sync queue with Conflict-Free Replicated Data Types',
      description: 'Ensure users can edit tasks, add comments, and reorder boards while offline in flight mode.',
      project: project2._id,
      workspace: workspaceAcme._id,
      board: b2.board._id,
      column: b2.columns.in_progress._id,
      order: 0,
      status: 'in_progress',
      priority: 'urgent',
      assignee: memberUser._id,
      creator: pmUser._id,
      dueDate: new Date('2026-11-24'),
      estimatedHours: 32,
      actualHours: 14,
      labels: ['Mobile', 'Offline', 'Database']
    });

    const taskMOB3 = await Task.create({
      taskId: 'MOB-3',
      title: 'Implement FaceID / TouchID biometric session unlock',
      description: 'Secure keychain token storage with biometric fallback to system PIN.',
      project: project2._id,
      workspace: workspaceAcme._id,
      board: b2.board._id,
      column: b2.columns.in_review._id,
      order: 0,
      status: 'in_review',
      priority: 'high',
      assignee: memberUser._id,
      creator: pmUser._id,
      dueDate: new Date('2026-11-21'),
      estimatedHours: 12,
      actualHours: 11,
      labels: ['Mobile', 'Security', 'Auth']
    });

    const taskMOB4 = await Task.create({
      taskId: 'MOB-4',
      title: 'Card swipe gestures for quick status change (Archive / Done / Snooze)',
      description: 'Implement fluid react-native-reanimated swipeable rows with tactile haptic feedback.',
      project: project2._id,
      workspace: workspaceAcme._id,
      board: b2.board._id,
      column: b2.columns.todo._id,
      order: 0,
      status: 'todo',
      priority: 'medium',
      assignee: designerUser._id,
      creator: pmUser._id,
      dueDate: new Date('2026-11-29'),
      estimatedHours: 16,
      labels: ['Mobile', 'UI/UX', 'Gestures']
    });

    const taskMOB5 = await Task.create({
      taskId: 'MOB-5',
      title: 'End-to-end device testing matrix for iOS 18 and Android 15',
      description: 'Automate test passes on real device farm using Maestro and Detox test suites.',
      project: project2._id,
      workspace: workspaceAcme._id,
      board: b2.board._id,
      column: b2.columns.todo._id,
      order: 1,
      status: 'todo',
      priority: 'medium',
      assignee: qaUser._id,
      creator: pmUser._id,
      dueDate: new Date('2026-12-02'),
      estimatedHours: 24,
      labels: ['Mobile', 'QA', 'Automation']
    });

    const taskMOB6 = await Task.create({
      taskId: 'MOB-6',
      title: 'Push notification sound pack and interactive actionable banners',
      description: 'Allow team members to mark done directly from phone lockscreen notifications.',
      project: project2._id,
      workspace: workspaceAcme._id,
      board: b2.board._id,
      column: b2.columns.backlog._id,
      order: 0,
      status: 'backlog',
      priority: 'low',
      assignee: designerUser._id,
      creator: pmUser._id,
      dueDate: new Date('2026-12-18'),
      estimatedHours: 10,
      labels: ['Mobile', 'Notifications']
    });

    // 7. Tasks for Project 3: SOC2 Type II Compliance (SEC)
    const taskSEC1 = await Task.create({
      taskId: 'SEC-1',
      title: 'Automated daily dependency vulnerability scan with Snyk in GitHub Actions',
      description: 'Fail CI builds on critical CVE disclosures and automatically open PR remediation patches.',
      project: project3._id,
      workspace: workspaceAcme._id,
      board: b3.board._id,
      column: b3.columns.done._id,
      order: 0,
      status: 'done',
      priority: 'high',
      assignee: devopsUser._id,
      creator: adminUser._id,
      dueDate: new Date('2026-11-08'),
      estimatedHours: 12,
      actualHours: 10,
      labels: ['Security', 'CI/CD', 'Compliance'],
      isCompleted: true,
      completedAt: new Date('2026-11-07')
    });

    const taskSEC2 = await Task.create({
      taskId: 'SEC-2',
      title: 'Immutable audit log retention and encryption at rest in S3 Glacier',
      description: 'Enforce WORM (Write Once Read Many) policy on customer activity logs with KMS master key rotation.',
      project: project3._id,
      workspace: workspaceAcme._id,
      board: b3.board._id,
      column: b3.columns.in_progress._id,
      order: 0,
      status: 'in_progress',
      priority: 'urgent',
      assignee: devopsUser._id,
      creator: adminUser._id,
      dueDate: new Date('2026-11-25'),
      estimatedHours: 20,
      actualHours: 8,
      labels: ['Security', 'AWS', 'Audit']
    });

    const taskSEC3 = await Task.create({
      taskId: 'SEC-3',
      title: 'Zero Trust network policy enforcement & TLS 1.3 verification',
      description: 'Deprecate legacy cipher suites and require mTLS for internal microservice communication.',
      project: project3._id,
      workspace: workspaceAcme._id,
      board: b3.board._id,
      column: b3.columns.todo._id,
      order: 0,
      status: 'todo',
      priority: 'high',
      assignee: adminUser._id,
      creator: adminUser._id,
      dueDate: new Date('2026-11-30'),
      estimatedHours: 18,
      labels: ['Infra', 'Networking', 'Security']
    });

    const taskSEC4 = await Task.create({
      taskId: 'SEC-4',
      title: 'SOC2 Type II Auditor walkthrough preparation and evidence package',
      description: 'Collate access review spreadsheets, employee onboarding background checks, and incident response drill notes.',
      project: project3._id,
      workspace: workspaceAcme._id,
      board: b3.board._id,
      column: b3.columns.todo._id,
      order: 1,
      status: 'todo',
      priority: 'urgent',
      assignee: ownerUser._id,
      creator: adminUser._id,
      dueDate: new Date('2026-12-05'),
      estimatedHours: 28,
      labels: ['Audit', 'Legal', 'Compliance']
    });

    const taskSEC5 = await Task.create({
      taskId: 'SEC-5',
      title: 'Penetration testing with external red team firm',
      description: 'Scope external black-box and grey-box API penetration test with third-party security firm.',
      project: project3._id,
      workspace: workspaceAcme._id,
      board: b3.board._id,
      column: b3.columns.backlog._id,
      order: 0,
      status: 'backlog',
      priority: 'medium',
      assignee: adminUser._id,
      creator: adminUser._id,
      dueDate: new Date('2026-12-20'),
      estimatedHours: 40,
      labels: ['Pentest', 'Security']
    });

    // 8. Tasks for Project 4: Design System & UI Kit (DSK)
    const taskDSK1 = await Task.create({
      taskId: 'DSK-1',
      title: 'Standardize semantic design tokens for light/dark color themes',
      description: 'Define OKLCH color palettes, contrast ratios, spacing scales, and border radiuses in Tailwind config.',
      project: project4._id,
      workspace: workspaceAcme._id,
      board: b4.board._id,
      column: b4.columns.done._id,
      order: 0,
      status: 'done',
      priority: 'urgent',
      assignee: designerUser._id,
      creator: designerUser._id,
      dueDate: new Date('2026-11-06'),
      estimatedHours: 18,
      actualHours: 16,
      labels: ['Design', 'Tailwind', 'Tokens'],
      isCompleted: true,
      completedAt: new Date('2026-11-06')
    });

    const taskDSK2 = await Task.create({
      taskId: 'DSK-2',
      title: 'Accessible Dropdown, Modal Dialog, and Tooltip components',
      description: 'Wrap Radix UI primitives with keyboard navigation, focus traps, and screen-reader ARIA live announcements.',
      project: project4._id,
      workspace: workspaceAcme._id,
      board: b4.board._id,
      column: b4.columns.in_progress._id,
      order: 0,
      status: 'in_progress',
      priority: 'high',
      assignee: designerUser._id,
      creator: designerUser._id,
      dueDate: new Date('2026-11-23'),
      estimatedHours: 24,
      actualHours: 12,
      labels: ['Accessibility', 'React', 'Components']
    });

    const taskDSK3 = await Task.create({
      taskId: 'DSK-3',
      title: 'Interactive Storybook documentation with controls and zero-height layout tests',
      description: 'Publish Storybook site to Chromatic with automated visual regression diff snapshots.',
      project: project4._id,
      workspace: workspaceAcme._id,
      board: b4.board._id,
      column: b4.columns.todo._id,
      order: 0,
      status: 'todo',
      priority: 'medium',
      assignee: qaUser._id,
      creator: designerUser._id,
      dueDate: new Date('2026-11-28'),
      estimatedHours: 16,
      labels: ['Storybook', 'Documentation', 'VisualRegression']
    });

    const taskDSK4 = await Task.create({
      taskId: 'DSK-4',
      title: 'Custom micro-animations for task card drops and celebration confetti',
      description: 'Design lightweight SVG and canvas particles using framer-motion when milestone or sprint is reached.',
      project: project4._id,
      workspace: workspaceAcme._id,
      board: b4.board._id,
      column: b4.columns.backlog._id,
      order: 0,
      status: 'backlog',
      priority: 'low',
      assignee: designerUser._id,
      creator: designerUser._id,
      dueDate: new Date('2026-12-12'),
      estimatedHours: 14,
      labels: ['Animations', 'Delight']
    });

    // 9. Tasks for Quantum Project: AI Workflow Automations (AIW)
    const taskAIW1 = await Task.create({
      taskId: 'AIW-1',
      title: 'Implement streaming completions with Server-Sent Events (SSE)',
      description: 'Deliver low-latency token-by-token streaming responses directly to collaborative workspace chat.',
      project: projectQuantum1._id,
      workspace: workspaceQuantum._id,
      board: bQ.board._id,
      column: bQ.columns.done._id,
      order: 0,
      status: 'done',
      priority: 'urgent',
      assignee: memberUser._id,
      creator: adminUser._id,
      dueDate: new Date('2026-11-10'),
      estimatedHours: 20,
      actualHours: 19,
      labels: ['AI', 'Streaming', 'SSE'],
      isCompleted: true,
      completedAt: new Date('2026-11-09')
    });

    const taskAIW2 = await Task.create({
      taskId: 'AIW-2',
      title: 'Automated meeting transcript and comment summarizer agent',
      description: 'Generate concise 3-bullet sprint takeaways and action item assignments from task discussions.',
      project: projectQuantum1._id,
      workspace: workspaceQuantum._id,
      board: bQ.board._id,
      column: bQ.columns.in_progress._id,
      order: 0,
      status: 'in_progress',
      priority: 'high',
      assignee: memberUser._id,
      creator: adminUser._id,
      dueDate: new Date('2026-11-26'),
      estimatedHours: 25,
      actualHours: 10,
      labels: ['AI', 'Agents', 'Automation']
    });

    const taskAIW3 = await Task.create({
      taskId: 'AIW-3',
      title: 'Vector index for workspace knowledge base semantic search',
      description: 'Embed task titles, descriptions, and comments with pgvector / Atlas Search vector indexes.',
      project: projectQuantum1._id,
      workspace: workspaceQuantum._id,
      board: bQ.board._id,
      column: bQ.columns.todo._id,
      order: 0,
      status: 'todo',
      priority: 'high',
      assignee: devopsUser._id,
      creator: adminUser._id,
      dueDate: new Date('2026-12-04'),
      estimatedHours: 22,
      labels: ['Embeddings', 'VectorSearch', 'Atlas']
    });

    const taskAIW4 = await Task.create({
      taskId: 'AIW-4',
      title: 'Guardrail evaluations for hallucination prevention & PII masking',
      description: 'Integrate automated safety checks on LLM outputs before storing to database or showing users.',
      project: projectQuantum1._id,
      workspace: workspaceQuantum._id,
      board: bQ.board._id,
      column: bQ.columns.backlog._id,
      order: 0,
      status: 'backlog',
      priority: 'medium',
      assignee: adminUser._id,
      creator: adminUser._id,
      dueDate: new Date('2026-12-15'),
      estimatedHours: 16,
      labels: ['Safety', 'Compliance', 'AI']
    });

    console.log('All project tasks created.');

    // 10. Subtasks
    await Subtask.create([
      // Subtasks for CLD-3
      { task: taskCLD3._id, title: 'Configure DndContext with PointerSensor & TouchSensor', order: 0, isCompleted: true },
      { task: taskCLD3._id, title: 'Build SortableContext container for BoardColumn', order: 1, isCompleted: true },
      { task: taskCLD3._id, title: 'Implement smooth drag overlay with card tilt animation', order: 2, isCompleted: true },
      { task: taskCLD3._id, title: 'Connect drag end handler to backend order re-indexing API', order: 3, isCompleted: false },
      { task: taskCLD3._id, title: 'Handle real-time remote drag events from peer sockets', order: 4, isCompleted: false },

      // Subtasks for MOB-2
      { task: taskMOB2._id, title: 'Initialize local SQLite schema migrations', order: 0, isCompleted: true },
      { task: taskMOB2._id, title: 'Implement write-ahead transaction log for offline mutations', order: 1, isCompleted: true },
      { task: taskMOB2._id, title: 'Build conflict resolution handler with timestamp victory rule', order: 2, isCompleted: false },
      { task: taskMOB2._id, title: 'Background sync reconciliation worker with NetInfo listener', order: 3, isCompleted: false },

      // Subtasks for SEC-2
      { task: taskSEC2._id, title: 'Create AWS S3 bucket with Object Lock in Compliance mode', order: 0, isCompleted: true },
      { task: taskSEC2._id, title: 'Configure daily cron batch stream to gzip and sign audit records', order: 1, isCompleted: false },
      { task: taskSEC2._id, title: 'Write integration test verifying write-tampering fails', order: 2, isCompleted: false },

      // Subtasks for DSK-2
      { task: taskDSK2._id, title: 'Create Accessible Dialog primitive with portal container', order: 0, isCompleted: true },
      { task: taskDSK2._id, title: 'Keyboard Tab / Shift-Tab focus trap with Esc to dismiss', order: 1, isCompleted: true },
      { task: taskDSK2._id, title: 'Custom responsive Popover & Dropdown menu item triggers', order: 2, isCompleted: false },

      // Subtasks for AIW-2
      { task: taskAIW2._id, title: 'Design prompt template for action-item extraction', order: 0, isCompleted: true },
      { task: taskAIW2._id, title: 'Build webhook trigger on task resolution with comment history', order: 1, isCompleted: false },
      { task: taskAIW2._id, title: 'Add thumbs-up/down feedback button for LLM summary accuracy', order: 2, isCompleted: false }
    ]);

    console.log('Subtasks created.');

    // 11. Comments & Mentions
    await TaskComment.create([
      // Comments on CLD-3
      {
        task: taskCLD3._id,
        user: pmUser._id,
        content: 'Hey @Alex Chen, make sure the drag handle is accessible and supports mobile touch properly without triggering page scroll.',
        mentions: [memberUser._id]
      },
      {
        task: taskCLD3._id,
        user: memberUser._id,
        content: '@Elena Rostova verified! Tested with TouchSensor activation constraint (delay 250ms, tolerance 5px). Works silky smooth on mobile devices.',
        mentions: [pmUser._id]
      },
      {
        task: taskCLD3._id,
        user: designerUser._id,
        content: 'I also noticed the drop target shadow is gorgeous! Great job on matching Figma spec.',
        mentions: []
      },

      // Comments on MOB-2
      {
        task: taskMOB2._id,
        user: memberUser._id,
        content: '@Liam O\'Connor can you set up a mock network condition test simulating spotty 3G/subway disconnects?',
        mentions: [qaUser._id]
      },
      {
        task: taskMOB2._id,
        user: qaUser._id,
        content: 'On it! Adding a Detox test suite with Network Link Conditioner throttling.',
        mentions: [memberUser._id]
      },

      // Comments on SEC-2
      {
        task: taskSEC2._id,
        user: adminUser._id,
        content: '@Jordan Taylor make sure the KMS customer master key has annual auto-rotation enabled in Terraform.',
        mentions: [devopsUser._id]
      },
      {
        task: taskSEC2._id,
        user: devopsUser._id,
        content: 'Done! `enable_key_rotation = true` is committed and merged in the infra repo.',
        mentions: [adminUser._id]
      },

      // Comments on DSK-2
      {
        task: taskDSK2._id,
        user: designerUser._id,
        content: '@Elena Rostova the modal dialog now supports nested alert dialogs and full dark mode contrast!',
        mentions: [pmUser._id]
      }
    ]);

    console.log('Task comments created.');

    // 12. Activity Logs
    await ActivityLog.create([
      {
        workspace: workspaceAcme._id,
        project: project1._id,
        task: taskCLD3._id,
        actor: pmUser._id,
        action: 'task_created',
        entityType: 'task',
        entityTitle: 'CLD-3: Build interactive Kanban board with @dnd-kit',
        metadata: { priority: 'urgent' }
      },
      {
        workspace: workspaceAcme._id,
        project: project1._id,
        task: taskCLD1._id,
        actor: memberUser._id,
        action: 'task_status_changed',
        entityType: 'task',
        entityTitle: 'CLD-1: Architect multi-tenant event gateway',
        metadata: { fromStatus: 'in_review', toStatus: 'done' }
      },
      {
        workspace: workspaceAcme._id,
        project: project1._id,
        task: taskCLD3._id,
        actor: memberUser._id,
        action: 'comment_added',
        entityType: 'comment',
        entityTitle: 'CLD-3: Comment by Alex Chen'
      },
      {
        workspace: workspaceAcme._id,
        project: project2._id,
        task: taskMOB1._id,
        actor: memberUser._id,
        action: 'task_status_changed',
        entityType: 'task',
        entityTitle: 'MOB-1: Migrate React Native navigation to Expo Router v4',
        metadata: { fromStatus: 'in_review', toStatus: 'done' }
      },
      {
        workspace: workspaceAcme._id,
        project: project3._id,
        task: taskSEC1._id,
        actor: devopsUser._id,
        action: 'task_status_changed',
        entityType: 'task',
        entityTitle: 'SEC-1: Automated daily dependency vulnerability scan with Snyk',
        metadata: { fromStatus: 'in_progress', toStatus: 'done' }
      },
      {
        workspace: workspaceAcme._id,
        project: project4._id,
        task: taskDSK1._id,
        actor: designerUser._id,
        action: 'task_status_changed',
        entityType: 'task',
        entityTitle: 'DSK-1: Standardize semantic design tokens for light/dark color themes',
        metadata: { fromStatus: 'in_review', toStatus: 'done' }
      },
      {
        workspace: workspaceQuantum._id,
        project: projectQuantum1._id,
        task: taskAIW1._id,
        actor: memberUser._id,
        action: 'task_status_changed',
        entityType: 'task',
        entityTitle: 'AIW-1: Implement streaming completions with Server-Sent Events',
        metadata: { fromStatus: 'in_progress', toStatus: 'done' }
      }
    ]);

    // 13. Notifications
    await Notification.create([
      {
        recipient: memberUser._id,
        sender: pmUser._id,
        workspace: workspaceAcme._id,
        project: project1._id,
        task: taskCLD3._id,
        type: 'mention',
        title: 'Mentioned in CLD-3',
        message: 'Elena Rostova mentioned you in a comment on "Build interactive Kanban board with @dnd-kit drag-and-drop"',
        link: `/projects/${project1._id}?task=${taskCLD3._id}`,
        isRead: false
      },
      {
        recipient: memberUser._id,
        sender: ownerUser._id,
        workspace: workspaceAcme._id,
        project: project1._id,
        task: taskCLD1._id,
        type: 'task_assigned',
        title: 'Task Assigned: CLD-1',
        message: 'Sarah Connor assigned you task: "Architect multi-tenant event gateway with Socket.IO & Redis"',
        link: `/projects/${project1._id}?task=${taskCLD1._id}`,
        isRead: true
      },
      {
        recipient: adminUser._id,
        sender: ownerUser._id,
        workspace: workspaceAcme._id,
        project: project1._id,
        task: taskCLD2._id,
        type: 'task_assigned',
        title: 'Task Assigned: CLD-2',
        message: 'Sarah Connor assigned you task: "Implement role-based permissions matrix across all routes"',
        link: `/projects/${project1._id}?task=${taskCLD2._id}`,
        isRead: false
      },
      {
        recipient: qaUser._id,
        sender: memberUser._id,
        workspace: workspaceAcme._id,
        project: project2._id,
        task: taskMOB2._id,
        type: 'mention',
        title: 'Mentioned in MOB-2',
        message: 'Alex Chen mentioned you in a comment on "Offline SQLite database sync queue"',
        link: `/projects/${project2._id}?task=${taskMOB2._id}`,
        isRead: false
      },
      {
        recipient: devopsUser._id,
        sender: adminUser._id,
        workspace: workspaceAcme._id,
        project: project3._id,
        task: taskSEC2._id,
        type: 'mention',
        title: 'Mentioned in SEC-2',
        message: 'Marcus Vance mentioned you in a comment on "Immutable audit log retention"',
        link: `/projects/${project3._id}?task=${taskSEC2._id}`,
        isRead: false
      },
      {
        recipient: designerUser._id,
        sender: pmUser._id,
        workspace: workspaceAcme._id,
        project: project4._id,
        task: taskDSK2._id,
        type: 'task_assigned',
        title: 'Task Assigned: DSK-2',
        message: 'Elena Rostova assigned you task: "Accessible Dropdown, Modal Dialog, and Tooltip components"',
        link: `/projects/${project4._id}?task=${taskDSK2._id}`,
        isRead: false
      }
    ]);

    // 14. Project Milestones
    await ProjectMilestone.create([
      // Milestones for CLD
      {
        project: project1._id,
        workspace: workspaceAcme._id,
        title: 'Alpha Release & Internal Dogfooding',
        description: 'Complete core auth, workspaces, kanban drag & drop, and socket synchronization.',
        dueDate: new Date('2026-11-15'),
        isReached: true,
        reachedAt: new Date('2026-11-01')
      },
      {
        project: project1._id,
        workspace: workspaceAcme._id,
        title: 'Beta Public Preview',
        description: 'Open access for team workspaces, analytics dashboard, and calendar scheduling.',
        dueDate: new Date('2026-12-01'),
        isReached: false
      },

      // Milestones for MOB
      {
        project: project2._id,
        workspace: workspaceAcme._id,
        title: 'TestFlight Internal Beta v2.0-b1',
        description: 'First testable build with Expo Router, offline cache, and biometric authentication.',
        dueDate: new Date('2026-11-20'),
        isReached: true,
        reachedAt: new Date('2026-11-12')
      },
      {
        project: project2._id,
        workspace: workspaceAcme._id,
        title: 'App Store & Google Play Public Release',
        description: 'Production submission passing all App Review guidelines and Android vitals.',
        dueDate: new Date('2026-12-25'),
        isReached: false
      },

      // Milestones for SEC
      {
        project: project3._id,
        workspace: workspaceAcme._id,
        title: 'Auditor Evidence Collection Finalized',
        description: 'Complete all 42 control questionnaires and automated report exports.',
        dueDate: new Date('2026-12-10'),
        isReached: false
      },
      {
        project: project3._id,
        workspace: workspaceAcme._id,
        title: 'Final SOC2 Type II Attestation Issued',
        description: 'Clean CPA auditor report without exceptions.',
        dueDate: new Date('2027-01-31'),
        isReached: false
      },

      // Milestones for DSK
      {
        project: project4._id,
        workspace: workspaceAcme._id,
        title: 'v1.0 Component Library NPM Release',
        description: 'Full Radix UI accessible wrappers, Storybook chromatic docs, and theme provider.',
        dueDate: new Date('2026-11-30'),
        isReached: false
      },

      // Milestones for AIW
      {
        project: projectQuantum1._id,
        workspace: workspaceQuantum._id,
        title: 'Agent Pipeline End-to-End Latency < 600ms',
        description: 'Token streaming and caching verification in staging.',
        dueDate: new Date('2026-12-15'),
        isReached: false
      }
    ]);

    // 15. Saved Views
    await SavedView.create([
      {
        workspace: workspaceAcme._id,
        project: project1._id,
        user: pmUser._id,
        name: 'High Priority Sprint',
        type: 'kanban',
        filters: { priority: ['high', 'urgent'] },
        isShared: true
      },
      {
        workspace: workspaceAcme._id,
        project: project1._id,
        user: memberUser._id,
        name: 'My Incomplete Tasks',
        type: 'list',
        filters: { status: ['todo', 'in_progress', 'in_review'] },
        isShared: false
      },
      {
        workspace: workspaceAcme._id,
        project: project2._id,
        user: pmUser._id,
        name: 'Mobile Release Roadmap',
        type: 'calendar',
        filters: {},
        isShared: true
      }
    ]);

    console.log('✅ Database seeded successfully with expanded demo accounts and comprehensive mock data!');
    console.log(`
Demo Accounts Available:
---------------------------------------------------------------------------------------------------
1. Workspace Owner:    owner@collabspace.io     | Password123! | Sarah Connor (CEO)
2. Admin:              admin@collabspace.io     | Password123! | Marcus Vance (VP Eng)
3. Project Manager:    pm@collabspace.io        | Password123! | Elena Rostova (Lead PM)
4. Full Stack Member:  member@collabspace.io    | Password123! | Alex Chen (Senior Full Stack)
5. Designer:           designer@collabspace.io  | Password123! | Maya Patel (Principal Designer)
6. QA Lead:            qa@collabspace.io        | Password123! | Liam O'Connor (QA Architect)
7. DevOps / SRE:       devops@collabspace.io    | Password123! | Jordan Taylor (Staff DevOps)
---------------------------------------------------------------------------------------------------

Workspaces:
- Acme Technologies (slug: acme-tech) -> 4 Projects (CLD, MOB, SEC, DSK)
- Quantum Labs      (slug: quantum-labs) -> 1 Project (AIW)
`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
