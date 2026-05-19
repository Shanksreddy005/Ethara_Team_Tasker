import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, Plus, Calendar, ListTodo } from 'lucide-react';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        setShowModal(false);
        setNewProject({ name: '', description: '' });
        fetchProjects();
      }
    } catch (err) {
      console.error('Failed to create project', err);
    }
  };

  if (loading) return <div className="loader" style={{ margin: 'auto', marginTop: '4rem' }}></div>;

  return (
    <div>
      <div className="flex-between mb-8">
        <div>
          <h1>Projects</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage and view all team projects.</p>
        </div>
        {user.role === 'ADMIN' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <FolderKanban size={48} style={{ margin: '0 auto', marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No projects found</h3>
          <p>Get started by creating a new project.</p>
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(project => (
            <div key={project.id} className="card">
              <div className="flex-between mb-4">
                <h3 style={{ margin: 0 }}>{project.name}</h3>
                <span className="badge badge-in-progress">Active</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', minHeight: '40px' }}>
                {project.description || 'No description provided.'}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ListTodo size={16} /> 
                  {project._count.tasks} Tasks
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} /> 
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="mb-6">Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-input" 
                  rows="3"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex-between mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
