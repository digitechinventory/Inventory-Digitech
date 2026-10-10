import api from './client';

/**
 * API client for Project-Specific Mining Inventory
 */

export async function getProjects() {
  const res = await api.get('/project-inventory/projects');
  return res.data?.data || [];
}

export async function createProject(data) {
  const res = await api.post('/project-inventory/projects', data);
  return res.data?.data;
}

export async function updateProject(id, data) {
  const res = await api.put(`/project-inventory/projects/${id}`, data);
  return res.data?.data;
}

export async function getProjectWarehouses(projectId) {
  const params = projectId ? { project_id: projectId } : {};
  const res = await api.get('/project-inventory/warehouses', { params });
  return res.data?.data || [];
}

export async function createProjectWarehouse(data) {
  const res = await api.post('/project-inventory/warehouses', data);
  return res.data?.data;
}

export async function deleteProjectWarehouse(warehouseId) {
  const res = await api.delete(`/project-inventory/warehouses/${warehouseId}`);
  return res.data;
}

export async function getProjectItems(params = {}) {
  const res = await api.get('/project-inventory/items', { params });
  return res.data?.data || [];
}

export async function createProjectItem(data) {
  const res = await api.post('/project-inventory/items', data);
  return res.data?.data;
}

export async function updateProjectItem(id, data) {
  const res = await api.put(`/project-inventory/items/${id}`, data);
  return res.data?.data;
}

export async function deleteProjectItem(id) {
  const res = await api.delete(`/project-inventory/items/${id}`);
  return res.data;
}

export async function installProjectItem(id, data) {
  const res = await api.post(`/project-inventory/items/${id}/install`, data);
  return res.data?.data;
}

export async function transferProjectItem(id, data) {
  const res = await api.post(`/project-inventory/items/${id}/transfer`, data);
  return res.data?.data;
}

export async function reportDamageProjectItem(id, data) {
  const res = await api.post(`/project-inventory/items/${id}/damage-report`, data);
  return res.data?.data;
}

export async function replaceProjectItem(id, data) {
  const res = await api.post(`/project-inventory/items/${id}/replace`, data);
  return res.data?.data;
}

export async function requestProjectItem(data) {
  const res = await api.post('/project-inventory/request', data);
  return res.data?.data;
}

export async function getProjectLogs(params = {}) {
  const res = await api.get('/project-inventory/logs', { params });
  return res.data?.data || [];
}

// ==========================================
// REAL FAMOUS DATASET APIS
// ==========================================

export async function getFamousSummary() {
  const res = await api.get('/project-inventory/famous/summary');
  return res.data?.data || {};
}

export async function getFamousFleetMatrix(params = {}) {
  const res = await api.get('/project-inventory/famous/fleet-matrix', { params });
  return res.data?.data || { units: [], pagination: {} };
}

export async function getFamousItems(params = {}) {
  const res = await api.get('/project-inventory/famous/items', { params });
  return res.data?.data || { items: [], pagination: {} };
}

export default {
  getProjects,
  createProject,
  updateProject,
  getProjectWarehouses,
  createProjectWarehouse,
  deleteProjectWarehouse,
  getProjectItems,
  createProjectItem,
  updateProjectItem,
  deleteProjectItem,
  installProjectItem,
  transferProjectItem,
  reportDamageProjectItem,
  replaceProjectItem,
  getProjectLogs,
  getFamousSummary,
  getFamousFleetMatrix,
  getFamousItems
};

