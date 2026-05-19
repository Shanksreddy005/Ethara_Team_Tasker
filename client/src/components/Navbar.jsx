import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, ShieldAlert } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--accent-primary)' }}>
        <CheckSquare size={24} />
        TeamTasker
      </div>
      
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <FolderKanban size={18} /> Projects
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <CheckSquare size={18} /> Tasks
        </NavLink>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem' }}>{user.name}</span>
          <span className={`badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-todo'}`}>
            {user.role}
          </span>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" title="Logout" style={{ padding: '0.5rem' }}>
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
