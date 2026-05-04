import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">📋 TaskFlow</Link>
      <div className="navbar-links">
        <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
          Dashboard
        </Link>
        <Link to="/projects" className={location.pathname.startsWith('/projects') ? 'active' : ''}>
          Projects
        </Link>
        <span className="navbar-user">
          {user?.name} <span className="badge">{user?.role}</span>
        </span>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
