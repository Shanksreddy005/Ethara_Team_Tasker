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

// =======================
// MIDDLEWARE
// =======================

app.use(cors());
app.use(express.json());

// =======================
// AUTH MIDDLEWARE
// =======================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Requires admin privileges'
    });
  }

  next();
};

// =======================
// HEALTH CHECK
// =======================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running'
  });
});

// =======================
// AUTH ROUTES
// =======================

app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('REGISTER BODY:', req.body);

    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole =
      role === 'ADMIN' ? 'ADMIN' : 'MEMBER';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole
      }
    });

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '24h'
      }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('REGISTER ERROR:', error);

    res.status(500).json({
      error: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('LOGIN BODY:', req.body);

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(400).json({
        error: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '24h'
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);

    res.status(500).json({
      error: error.message
    });
  }
});

// =======================
// DASHBOARD
// =======================

app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    let taskWhere = {};

    if (req.user.role !== 'ADMIN') {
      taskWhere = {
        assignedToId: req.user.userId
      };
    }

    const [
      totalTasks,
      completedTasks,
      todoTasks,
      inProgressTasks,
      usersCount,
      projectsCount
    ] = await Promise.all([
      prisma.task.count({
        where: taskWhere
      }),

      prisma.task.count({
        where: {
          ...taskWhere,
          status: 'DONE'
        }
      }),

      prisma.task.count({
        where: {
          ...taskWhere,
          status: 'TODO'
        }
      }),

      prisma.task.count({
        where: {
          ...taskWhere,
          status: 'IN_PROGRESS'
        }
      }),

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
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
});

// =======================
// PROJECTS
// =======================

app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },

        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    res.json(projects);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
});

app.post(
  '/api/projects',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
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
      console.error(error);

      res.status(500).json({
        error: error.message
      });
    }
  }
);

// =======================
// TASKS
// =======================

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;

    let whereClause = {};

    if (projectId) {
      whereClause.projectId = parseInt(projectId);
    }

    if (req.user.role !== 'ADMIN') {
      whereClause.assignedToId = req.user.userId;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,

      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        },

        assignedTo: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message
    });
  }
});

// =======================
// USERS
// =======================

app.get(
  '/api/users',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      res.json(users);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: error.message
      });
    }
  }
);

// =======================
// SERVE FRONTEND
// =======================

const clientDistPath = path.join(
  __dirname,
  '../client/dist'
);

app.use(express.static(clientDistPath));

app.use((req, res) => {
  res.sendFile(
    path.join(clientDistPath, 'index.html')
  );
});

// =======================
// START SERVER
// =======================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});