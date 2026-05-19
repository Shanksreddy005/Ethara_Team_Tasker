const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Requires admin privileges' });
  }
  next();
};

// =======================
// AUTH ROUTES
// =======================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'MEMBER';

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: userRole }
    });
    
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// =======================
// DASHBOARD
// =======================
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    let taskWhere = {};
    if (req.user.role !== 'ADMIN') {
      taskWhere = { assignedToId: req.user.userId };
    }

    const [totalTasks, completedTasks, todoTasks, inProgressTasks, usersCount, projectsCount] = await Promise.all([
      prisma.task.count({ where: taskWhere }),
      prisma.task.count({ where: { ...taskWhere, status: 'DONE' } }),
      prisma.task.count({ where: { ...taskWhere, status: 'TODO' } }),
      prisma.task.count({ where: { ...taskWhere, status: 'IN_PROGRESS' } }),
      prisma.user.count(),
      prisma.project.count()
    ]);

    res.json({
      totalTasks,
      completedTasks,
      todoTasks,
      inProgressTasks,
      usersCount,
      projectsCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// =======================
// PROJECTS
// =======================

app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { tasks: true } }
      }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/projects', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name,
        description,
        createdById: req.user.userId
      }
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// =======================
// TASKS
// =======================

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;
    let whereClause = {};
    if (projectId) whereClause.projectId = parseInt(projectId);
    
    if (req.user.role !== 'ADMIN') {
      whereClause.assignedToId = req.user.userId;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/tasks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, projectId, assignedToId, dueDate } = req.body;
    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId: parseInt(projectId),
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/tasks/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // TODO, IN_PROGRESS, DONE

    const task = await prisma.task.findUnique({ where: { id: parseInt(id) } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Ensure member only updates their own task, Admin can update any
    if (req.user.role !== 'ADMIN' && task.assignedToId !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// =======================
// USERS (For Task Assignment)
// =======================
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve static assets in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
