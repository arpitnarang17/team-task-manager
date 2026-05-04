import axios from 'axios';

const API = process.env.REACT_APP_API_URL || '';

export const projectsAPI = {
  getAll: () => axios.get(`${API}/api/projects`),
  getOne: (id) => axios.get(`${API}/api/projects/${id}`),
  create: (data) => axios.post(`${API}/api/projects`, data),
  update: (id, data) => axios.put(`${API}/api/projects/${id}`, data),
  delete: (id) => axios.delete(`${API}/api/projects/${id}`),
};

export const tasksAPI = {
  getByProject: (projectId) => axios.get(`${API}/api/tasks/project/${projectId}`),
  getDashboard: () => axios.get(`${API}/api/tasks/dashboard`),
  create: (data) => axios.post(`${API}/api/tasks`, data),
  update: (id, data) => axios.put(`${API}/api/tasks/${id}`, data),
  delete: (id) => axios.delete(`${API}/api/tasks/${id}`),
};

export const usersAPI = {
  getAll: () => axios.get(`${API}/api/users`),
};
