# TaskFlow - Team Task Manager

A full-stack web application for teams to manage projects, assign tasks, and track progress with **role-based access control (Admin/Member)**.

## 🚀 Live Demo
- **Frontend:** [your-frontend-url.railway.app]
- **Backend API:** [your-backend-url.railway.app]

## ✨ Features

- **Authentication** — JWT-based Signup/Login with role selection (Admin/Member)
- **Role-Based Access Control** — Admins can create projects; all members can create/update tasks
- **Project Management** — Create projects, add team members, track status
- **Task Management** — Create, assign, update, and delete tasks with priorities
- **Dashboard** — Stats overview: total projects, tasks by status, overdue tasks
- **Overdue Tracking** — Visual indicators for tasks past their due date
- **Task Filtering** — Filter tasks by status (Todo / In Progress / Done)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Deployment | Railway |

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express app entry point
│   │   ├── models/
│   │   │   ├── User.js       # User schema (name, email, password, role)
│   │   │   ├── Project.js    # Project schema (owner, members, status)
│   │   │   └── Task.js       # Task schema (title, assignee, status, priority, dueDate)
│   │   ├── routes/
│   │   │   ├── auth.js       # POST /register, POST /login, GET /me
│   │   │   ├── projects.js   # CRUD for projects
│   │   │   ├── tasks.js      # CRUD for tasks + dashboard stats
│   │   │   └── users.js      # GET all users
│   │   └── middleware/
│   │       └── auth.js       # JWT verification + adminOnly guard
│   ├── package.json
│   └── railway.json
└── frontend/
    ├── src/
    │   ├── App.js             # Routes + PrivateRoute guard
    │   ├── context/
    │   │   └── AuthContext.js # Global auth state
    │   ├── services/
    │   │   └── api.js         # Axios API helpers
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Dashboard.js   # Stats + recent tasks
    │   │   ├── Projects.js    # Projects list + create
    │   │   └── ProjectDetail.js # Tasks CRUD
    │   └── components/
    │       └── Navbar.js
    ├── package.json
    └── railway.json
```

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get JWT token |
| GET | `/api/auth/me` | Get logged-in user |

### Projects (Auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all user's projects |
| GET | `/api/projects/:id` | Get single project |
| POST | `/api/projects` | Create project (Admin only) |
| PUT | `/api/projects/:id` | Update project (owner only) |
| DELETE | `/api/projects/:id` | Delete project + tasks (owner only) |

### Tasks (Auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/dashboard` | Dashboard stats |
| GET | `/api/tasks/project/:id` | Get tasks for a project |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## ⚙️ Local Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGODB_URI and JWT_SECRET in .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# Create .env file:
echo "REACT_APP_API_URL=http://localhost:5000" > .env
npm start
```

## 🚂 Railway Deployment

### Backend
1. Create new project on [Railway](https://railway.app)
2. Add a MongoDB service (or use MongoDB Atlas)
3. Deploy backend folder
4. Set environment variables:
   - `MONGODB_URI` = your MongoDB connection string
   - `JWT_SECRET` = any random secret string
5. Copy the deployed URL

### Frontend
1. Create another Railway service
2. Deploy frontend folder
3. Set environment variable:
   - `REACT_APP_API_URL` = your backend Railway URL
4. Deploy

## 🔐 Role-Based Access

| Feature | Admin | Member |
|---------|-------|--------|
| Create Projects | ✅ | ❌ |
| View Projects (member of) | ✅ | ✅ |
| Create Tasks | ✅ | ✅ |
| Update Tasks | ✅ | ✅ |
| Delete Tasks | ✅ | Own tasks only |
| Delete Projects | Own projects | ❌ |

## 👨‍💻 Author
**Arpit Narang** — [github.com/arpitnarang17](https://github.com/arpitnarang17)
