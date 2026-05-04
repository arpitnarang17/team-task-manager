const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Helper to check project access
const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const hasAccess = project.owner.equals(userId) || project.members.some(m => m.equals(userId));
  return hasAccess ? project : null;
};

// GET tasks for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const project = await checkProjectAccess(req.params.projectId, req.user._id);
    if (!project) return res.status(403).json({ message: 'Access denied or project not found' });

    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }]
    });
    const projectIds = projects.map(p => p._id);

    const now = new Date();
    const [total, todo, inProgress, done, overdue] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'todo' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'in-progress' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
      Task.countDocuments({ project: { $in: projectIds }, status: { $ne: 'done' }, dueDate: { $lt: now } }),
    ]);

    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ total, todo, inProgress, done, overdue, recentTasks, projectCount: projects.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, dueDate } = req.body;
    if (!title || !projectId) return res.status(400).json({ message: 'Title and project required' });

    const project = await checkProjectAccess(projectId, req.user._id);
    if (!project) return res.status(403).json({ message: 'Access denied or project not found' });

    const task = new Task({
      title, description, project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority: priority || 'medium',
      dueDate: dueDate || null,
    });
    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await checkProjectAccess(task.project, req.user._id);
    if (!project) return res.status(403).json({ message: 'Access denied' });

    const { title, description, status, assignedTo, priority, dueDate } = req.body;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await checkProjectAccess(task.project, req.user._id);
    if (!project) return res.status(403).json({ message: 'Access denied' });

    if (req.user.role !== 'admin' && !task.createdBy.equals(req.user._id))
      return res.status(403).json({ message: 'Only task creator or admin can delete' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
