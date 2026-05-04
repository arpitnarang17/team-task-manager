import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', members: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([projectsAPI.getAll(), usersAPI.getAll()])
      .then(([pRes, uRes]) => {
        setProjects(pRes.data);
        setUsers(uRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await projectsAPI.create(form);
      setProjects([res.data, ...projects]);
      setShowModal(false);
      setForm({ name: '', description: '', members: [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMember = (userId) => {
    setForm(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId]
    }));
  };

  if (loading) return <div className="loading">Loading projects...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>🗂️ Projects</h1>
        {user?.role === 'admin' && (
          <button className="btn btn-red" onClick={() => setShowModal(true)}>+ New Project</button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
          <p style={{ fontSize: '1.1rem' }}>No projects yet.</p>
          {user?.role === 'admin' && <p>Create your first project to get started!</p>}
          {user?.role !== 'admin' && <p>Ask an admin to add you to a project.</p>}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <div key={project._id} className="project-card" onClick={() => navigate(`/projects/${project._id}`)}>
              <h3>{project.name}</h3>
              <p>{project.description || 'No description'}</p>
              <div className="project-meta">
                <span className={`status-badge status-${project.status}`}>{project.status}</span>
                <span style={{ color: '#888', fontSize: '0.82rem' }}>
                  👥 {project.members.length + 1} members
                </span>
                <span style={{ color: '#888', fontSize: '0.82rem' }}>
                  by {project.owner?.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create New Project</h3>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Project Name *</label>
                <input type="text" placeholder="Enter project name" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Project description (optional)" rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label>Add Members</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {users.filter(u => u._id !== user.id).map(u => (
                    <label key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem',
                      background: form.members.includes(u._id) ? '#fff0f3' : '#f5f5f5',
                      padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem',
                      border: form.members.includes(u._id) ? '1px solid #e94560' : '1px solid #e8e8e8' }}>
                      <input type="checkbox" checked={form.members.includes(u._id)}
                        onChange={() => toggleMember(u._id)} style={{ display: 'none' }} />
                      {form.members.includes(u._id) ? '✓ ' : ''}{u.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-gray" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-red" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
