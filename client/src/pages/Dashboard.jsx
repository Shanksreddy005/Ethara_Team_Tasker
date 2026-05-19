import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, ListTodo, Users, FolderKanban } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  if (loading) return <div className="loader" style={{ margin: 'auto', marginTop: '4rem' }}></div>;

  return (
    <div>
      <div className="flex-between mb-8">
        <div>
          <h1>Welcome back, {user.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Here's an overview of your projects and tasks.</p>
        </div>
        <div className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-todo'}`} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          Role: {user.role}
        </div>
      </div>

      <div className="grid-3">
        <div className="stat-card info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <ListTodo size={20} /> Total Tasks
          </div>
          <div className="stat-value">{stats.totalTasks}</div>
        </div>
        
        <div className="stat-card warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <Clock size={20} /> In Progress
          </div>
          <div className="stat-value">{stats.inProgressTasks}</div>
        </div>

        <div className="stat-card success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={20} /> Completed
          </div>
          <div className="stat-value">{stats.completedTasks}</div>
        </div>

        {user.role === 'ADMIN' && (
          <>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <FolderKanban size={20} /> Total Projects
              </div>
              <div className="stat-value">{stats.projectsCount}</div>
            </div>
            
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <Users size={20} /> Total Users
              </div>
              <div className="stat-value">{stats.usersCount}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
