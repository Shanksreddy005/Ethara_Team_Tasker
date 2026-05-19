# Team Task Manager

A full-stack web application designed to help teams manage projects, assign tasks, and track their progress effectively. 

## 🚀 Features

- **Authentication**: Secure Login and Registration with role selection.
- **Role-Based Access Control**:
  - **Admin**: Can create projects and assign tasks.
  - **Member**: Can view assigned tasks and update task statuses.
- **Project Management**: View all projects, and details like active tasks count and creation dates.
- **Kanban Task Board**: Drag-and-drop tasks to update statuses (TODO, IN_PROGRESS, DONE).
- **Interactive Dashboard**: Quick statistics on tasks and projects.
- **Modern UI**: Custom-built Dark Mode aesthetics with glassmorphism effects using Vanilla CSS.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), React Router DOM, Vanilla CSS, Lucide React (Icons).
- **Backend**: Node.js, Express.js.
- **Database & ORM**: SQLite, Prisma.
- **Authentication**: JSON Web Tokens (JWT), bcrypt.

## 📦 Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd Ethara_Assessment
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the `server` directory and add:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your_super_secret_key"
   PORT=3000
   ```

4. **Run Prisma Migrations:**
   ```bash
   cd server
   npx prisma migrate dev --name init
   ```

5. **Start Development Servers:**
   - For backend: `cd server && npm run dev`
   - For frontend: `cd client && npm run dev`

## 🌐 Railway Deployment

This project is configured as a monorepo for seamless deployment on Railway:

1. Connect your GitHub repository to Railway.
2. Railway will automatically detect the root `package.json`.
3. Add the `JWT_SECRET` environment variable in Railway.
4. The deployment will install dependencies, build the Vite frontend, and start the Express server, serving the client assets directly from `client/dist`.

## 📹 Demo Video

*(Add your 2-5 min demo video link here)*
