import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksAPI.getDashboard()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isOverdue = (task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>👋 Welcome, {user?.name}!</h1>
          <p style={{ color: '#888', marginTop: '0.3rem' }}>Here's your task overview</p>
        </div>
        <Link to="/projects" className="btn btn-red">View Projects</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats?.projectCount || 0}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-number">{stats?.total || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.todo || 0}</div>
          <div className="stat-label">To Do</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-number">{stats?.inProgress || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card green">
          <div className="stat-number">{stats?.done || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-number">{stats?.overdue || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="recent-tasks card">
        <h2>Recent Tasks</h2>
        {stats?.recentTasks?.length === 0 ? (
          <p style={{ color: '#888', marginTop: '1rem' }}>No tasks yet. <Link to="/projects" style={{ color: '#e94560' }}>Create a project</Link> to get started.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentTasks?.map(task => (
                  <tr key={task._id}>
                    <td><strong>{task.title}</strong></td>
                    <td>
                      <Link to={`/projects/${task.project?._id}`} style={{ color: '#0f3460', textDecoration: 'none' }}>
                        {task.project?.name}
                      </Link>
                    </td>
                    <td>{task.assignedTo?.name || <span style={{ color: '#aaa' }}>Unassigned</span>}</td>
                    <td><span className={`status-badge status-${task.status}`}>{task.status}</span></td>
                    <td>
                      {task.dueDate ? (
                        <span className={isOverdue(task) ? 'overdue-text' : ''}>
                          {isOverdue(task) ? '⚠️ ' : ''}{new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      ) : <span style={{ color: '#aaa' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
