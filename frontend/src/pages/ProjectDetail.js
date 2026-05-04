import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['all', 'todo', 'in-progress', 'done'];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      projectsAPI.getOne(id),
      tasksAPI.getByProject(id),
      usersAPI.getAll()
    ]).then(([pRes, tRes, uRes]) => {
      setProject(pRes.data);
      setTasks(tRes.data);
      setUsers(uRes.data);
    }).catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id]);

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
    setError('');
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      status: task.status,
    });
    setError('');
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...taskForm,
        assignedTo: taskForm.assignedTo || null,
        dueDate: taskForm.dueDate || null,
        projectId: id,
      };
      if (editingTask) {
        const res = await tasksAPI.update(editingTask._id, payload);
        setTasks(tasks.map(t => t._id === editingTask._id ? res.data : t));
      } else {
        const res = await tasksAPI.create(payload);
        setTasks([res.data, ...tasks]);
      }
      setShowTaskModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const res = await tasksAPI.update(task._id, { status: newStatus });
      setTasks(tasks.map(t => t._id === task._id ? res.data : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksAPI.delete(taskId);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await projectsAPI.delete(id);
      navigate('/projects');
    } catch (err) {
      console.error(err);
    }
  };

  const isOverdue = (task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const filteredTasks = tasks.filter(t => filter === 'all' || t.status === filter);

  const projectMembers = project ? [project.owner, ...project.members] : [];

  if (loading) return <div className="loading">Loading project...</div>;
  if (!project) return null;

  const isOwner = project.owner._id === user.id || project.owner._id === user._id;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button className="btn btn-gray btn-sm" onClick={() => navigate('/projects')}
            style={{ marginBottom: '0.5rem' }}>← Back</button>
          <h1>{project.name}</h1>
          {project.description && <p style={{ color: '#888', marginTop: '0.3rem' }}>{project.description}</p>}
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className={`status-badge status-${project.status}`}>{project.status}</span>
            <span style={{ color: '#888', fontSize: '0.85rem' }}>Owner: {project.owner.name}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-red" onClick={openCreateTask}>+ Add Task</button>
          {isOwner && (
            <button className="btn btn-gray" onClick={handleDeleteProject}>🗑️ Delete Project</button>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <strong>Team Members:</strong>
        <div className="members-list">
          {projectMembers.map(m => (
            <span key={m._id} className="member-chip">
              {m.name} {m._id === project.owner._id ? '👑' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Task stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {['todo', 'in-progress', 'done'].map(s => (
          <div key={s} className={`stat-card ${s === 'in-progress' ? 'orange' : s === 'done' ? 'green' : ''}`}>
            <div className="stat-number">{tasks.filter(t => t.status === s).length}</div>
            <div className="stat-label">{s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</div>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div className="tasks-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Tasks ({filteredTasks.length})</h2>
        </div>
        <div className="tasks-filters">
          {STATUSES.map(s => (
            <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {filteredTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
            No tasks {filter !== 'all' ? `with status "${filter}"` : ''}. Click "+ Add Task" to create one.
          </div>
        ) : (
          <div className="task-list">
            {filteredTasks.map(task => (
              <div key={task._id} className={`task-item ${task.status}`}>
                <div className="task-info">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span className={`status-badge priority-${task.priority}`}>{task.priority}</span>
                    {task.assignedTo
                      ? <span>👤 {task.assignedTo.name}</span>
                      : <span style={{ color: '#bbb' }}>Unassigned</span>}
                    {task.dueDate && (
                      <span className={isOverdue(task) ? 'overdue-text' : ''}>
                        📅 {isOverdue(task) ? '⚠️ Overdue: ' : ''}{new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-actions">
                  <select value={task.status} onChange={e => handleStatusChange(task, e.target.value)}
                    className={`status-badge status-${task.status}`}
                    style={{ border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button className="btn btn-blue btn-sm" onClick={() => openEditTask(task)}>Edit</button>
                  {(user.role === 'admin' || task.createdBy?._id === user.id) && (
                    <button className="btn btn-gray btn-sm" onClick={() => handleDeleteTask(task._id)}>🗑️</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" placeholder="Task title" value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Task description (optional)" rows={3} value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group">
                <label>Assign To</label>
                <select value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {projectMembers.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              {editingTask && (
                <div className="form-group">
                  <label>Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={taskForm.dueDate}
                  onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-gray" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-red" disabled={submitting}>
                  {submitting ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
