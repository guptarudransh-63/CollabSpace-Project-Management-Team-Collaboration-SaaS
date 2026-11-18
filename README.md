# CollabSpace — Project Management & Team Collaboration SaaS

**CollabSpace** is a production-quality, enterprise-grade project management and team collaboration SaaS platform built on the **MERN stack** (MongoDB, Express.js, React 18, and Node.js). Inspired by modern developer tools like **Linear**, **ClickUp**, **Notion**, and **Asana**, CollabSpace provides real-time multi-workspace synchronization, interactive drag-and-drop Kanban boards, role-based access control (RBAC), and automated deadline intelligence.

---

## 🌟 Key Capabilities

- **Modern Minimal SaaS Aesthetic**: High-contrast, clean typography, refined borders, micro-interactions, responsive desktop/tablet/mobile layouts using Tailwind CSS and Lucide icons.
- **Interactive Kanban Boards**: Powered by `@dnd-kit` with persistent task reordering, column customizability, WIP limits, touch & pointer sensors, and smooth card tilt drag overlays.
- **Real-Time Collaboration**: Full bidirectional synchronization using **Socket.IO** with authenticated JWT handshakes, room isolation (`workspace:id`, `project:id`), live Kanban card movements across peer browsers, and user presence indicators.
- **Role-Based Access Control (RBAC)**: Strict multi-workspace isolation with four permission tiers: **Workspace Owner**, **Admin**, **Project Manager**, and **Member**.
- **Task Management**: Hierarchical task tracking with unique project keys (e.g. `CLD-1`), rich descriptions, checklists with progress percentage, labels, estimated/actual hours, due date overdue alerts, and duplicate/bulk actions.
- **Mentions & Discussion Hub**: In-task discussion thread with `@mention` autocomplete, attachments, and real-time push alerts.
- **Audit Activity Stream**: Automated backend event logging (`activityService`) tracking project creation, task movements, reassignments, and comments.
- **Analytics & Velocity Insights**: Interactive **Recharts** visualizations for weekly completion velocity curves, status distribution doughnuts, and member workload balancing.
- **Global Search**: Modal search (`Cmd+K` / `Ctrl+K`) across projects, tasks, comments, and teammates.
- **Deadline Intelligence**: Hourly background cron (`node-cron`) scanning for upcoming and overdue tasks, dispatching in-app alerts and Nodemailer email notifications.

---

## 👥 Demo Accounts (Pre-Seeded)

CollabSpace includes a complete database seed script with four accounts representing each role in the permission matrix:

| Role | Email | Password | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Workspace Owner** | `owner@collabspace.io` | `Password123!` | Complete administrative authority, workspace deletion, billing & ownership |
| **Admin** | `admin@collabspace.io` | `Password123!` | Member invitations, role modifications, project management & settings |
| **Project Manager** | `pm@collabspace.io` | `Password123!` | Project creation, task scheduling, deadlines, workflows & milestones |
| **Member** | `member@collabspace.io` | `Password123!` | Task updates, Kanban drag-and-drop, comments, checklist execution |

*Note: You can also click the 1-Click Demo Account buttons directly on the Landing Page and Login Page for instantaneous access.*

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Custom CSS Design System
- **Drag-and-Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios with JWT interceptors
- **Real-Time Client**: Socket.IO Client
- **Charts & Visualizations**: Recharts
- **Icons**: Lucide React
- **Date Utilities**: Date-fns

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Real-Time Server**: Socket.IO Server (Rooms & Handshake Authentication)
- **Security**: Helmet, CORS, Express Rate Limit
- **Scheduled Jobs**: node-cron (Hourly Deadline Sweeper)
- **Email Service**: Nodemailer

---

## 📁 Project Architecture

```
project-management/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection (Mongoose) & configuration
│   │   ├── models/          # 18 Mongoose Schemas (User, Workspace, Task, Board...)
│   │   ├── middleware/      # JWT Protect, RBAC Matrix, Error Handler
│   │   ├── controllers/     # Business logic (Auth, Workspace, Project, Task...)
│   │   ├── routes/          # Express REST endpoints
│   │   ├── services/        # Activity Logger, Notifications, Email
│   │   ├── sockets/         # Socket.IO Event Handlers & Presence Tracker
│   │   ├── jobs/            # Node-cron Deadline Reminders
│   │   ├── utils/           # Standardized ApiResponse helper
│   │   ├── seed/            # Seed script with realistic projects & tasks
│   │   └── server.js        # Express HTTP & Socket.IO server bootstrap
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client modules
│   │   ├── context/         # AuthContext, SocketContext, NotificationContext
│   │   ├── layouts/         # AppLayout, Sidebar, Navbar, WorkspaceSwitcher
│   │   ├── components/
│   │   │   ├── common/      # Avatar, Badge, Button, Modal
│   │   │   ├── kanban/      # KanbanBoard, KanbanColumn, TaskCard (@dnd-kit)
│   │   │   ├── tasks/       # TaskDetailModal, TaskFormModal
│   │   │   └── search/      # GlobalSearchModal (Cmd+K)
│   │   ├── pages/           # Landing, Login, Dashboard, Projects, Team, Activity...
│   │   ├── App.jsx          # Routes & Providers
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── package.json             # Root orchestrator
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v26)
- **MongoDB** running locally or a MongoDB Atlas URI

### 2. Installation
Install all dependencies for backend and frontend:
```bash
npm run install:all
```

### 3. Environment Configuration
**Backend Environment** (`backend/.env`):
```env
PORT=5100
MONGODB_URI=mongodb://127.0.0.1:27017/collabspace
JWT_SECRET=collabspace_super_secret_jwt_key_2026_xyz987
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=test_user
SMTP_PASS=test_pass
EMAIL_FROM=noreply@collabspace.io
```

### 4. Database Seeding
Seed the database with demo users, workspaces, projects, Kanban boards, tasks, comments, and activity logs:
```bash
npm run seed
```

### 5. Running the Application
Run backend API server:
```bash
npm run server
```
Run frontend client:
```bash
npm run client
```

Navigate to `http://localhost:5180` (or the port Vite prints in your console) to explore CollabSpace!

---

## 🔒 Role-Based Permissions Matrix (RBAC)

| Action | Workspace Owner | Admin | Project Manager | Member |
| :--- | :---: | :---: | :---: | :---: |
| Delete Workspace | ✅ | ❌ | ❌ | ❌ |
| Update Workspace Settings | ✅ | ✅ | ❌ | ❌ |
| Invite Members & Assign Roles | ✅ | ✅ | ❌ | ❌ |
| Create Projects | ✅ | ✅ | ✅ | ❌ |
| Delete Projects | ✅ | ✅ | ❌ | ❌ |
| Add / Delete Board Columns | ✅ | ✅ | ✅ | ❌ |
| Create / Edit Tasks | ✅ | ✅ | ✅ | ✅ |
| Move Kanban Cards (Drag & Drop) | ✅ | ✅ | ✅ | ✅ |
| Post Comments & @Mention | ✅ | ✅ | ✅ | ✅ |

---

## 🚀 Production Deployment

### Backend on Render / Railway
1. Push repository to GitHub.
2. Create a **Web Service** on Render pointing to `backend/`.
3. Set build command: `npm install`
4. Set start command: `node src/server.js`
5. Configure environment variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`).

### Frontend on Vercel
1. Create a new project on Vercel pointing to `frontend/`.
2. Framework Preset: **Vite**
3. Output Directory: `dist`
4. Configure environment variable: `VITE_API_URL` (pointing to Render backend).

---

## 📄 License
MIT © 2026 CollabSpace. Production-ready SaaS platform.
