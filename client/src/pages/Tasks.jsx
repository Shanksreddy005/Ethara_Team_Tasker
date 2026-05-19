import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Clock, CheckCircle2, ListTodo, AlertCircle } from 'lucide-react';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: '', assignedToId: '', dueDate: '' });

  useEffect(() => {
    fetchTasks();
    if (user.role === 'ADMIN') {
      fetchProjects();
      fetchUsers();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setProjects(await res.json());
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setUsers(await res.json());
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setShowModal(false);
        setNewTask({ title: '', description: '', projectId: '', assignedToId: '', dueDate: '' });
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to update task status', err);
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e, status) => {
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) updateTaskStatus(taskId, status);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const getTasksByStatus = (status) => tasks.filter(task => task.status === status);

  const getStatusIcon = (status) => {
    if (status === 'TODO') return <ListTodo size={18} />;
    if (status === 'IN_PROGRESS') return <Clock size={18} />;
    if (status === 'DONE') return <CheckCircle2 size={18} />;
  };

  if (loading) return <div className="loader" style={{ margin: 'auto', marginTop: '4rem' }}></div>;

  return (
    <div>
      <div className="flex-between mb-8">
        <div>
          <h1>Tasks</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your assigned tasks using the Kanban board.</p>
        </div>
        {user.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Task
          </button>
        )}
      </div>

      <div className="board">
        {['TODO', 'IN_PROGRESS', 'DONE'].map(status => (
          <div 
            key={status} 
            className="board-column"
            onDrop={(e) => handleDrop(e, status)}
            onDragOver={handleDragOver}
          >
            <div className="board-column-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                {getStatusIcon(status)}
                {status.replace('_', ' ')}
              </div>
              <span className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                {getTasksByStatus(status).length}
              </span>
            </div>

            <div style={{ minHeight: '100px' }}>
              {getTasksByStatus(status).map(task => (
                <div 
                  key={task.id} 
                  className="task-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{task.title}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {task.description}
                  </p>
                  
                  <div className="flex-between" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div>
                      {task.project && <span className="badge badge-admin" style={{ marginRight: '0.5rem' }}>{task.project.name}</span>}
                      {task.assignedTo && <span>👤 {task.assignedTo.name}</span>}
                    </div>
                    {task.dueDate && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: new Date(task.dueDate) < new Date() && status !== 'DONE' ? 'var(--danger)' : 'inherit' }}>
                        <AlertCircle size={12} />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="mb-6">Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-input" 
                  rows="3"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>

              <div className="grid-3" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Project</label>
                  <select 
                    className="form-input"
                    value={newTask.projectId}
                    onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                    required
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select 
                    className="form-input"
                    value={newTask.assignedToId}
                    onChange={(e) => setNewTask({...newTask, assignedToId: e.target.value})}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex-between mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
