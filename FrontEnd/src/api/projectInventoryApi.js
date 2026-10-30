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

// ==========================================
// REAL WIM DATASET APIS
// ==========================================

export async function getWimSummary() {
  const res = await api.get('/project-inventory/wim/summary');
  return res.data?.data || {};
}

export async function getWimComponents(params = {}) {
  const res = await api.get('/project-inventory/wim/components', { params });
  return res.data?.data || { components: [], pagination: {} };
}

export async function getWimTransactions(params = {}) {
  const res = await api.get('/project-inventory/wim/transactions', { params });
  return res.data?.data || { transactions: [], pagination: {} };
}

export async function getWimWarranty(params = {}) {
  const res = await api.get('/project-inventory/wim/warranty', { params });
  return res.data?.data || { warranty_items: [], total: 0 };
}

// ==========================================
// PROJECT 8-STAGE DOCUMENTS APIS
// ==========================================

export async function getProjectDocuments(params = {}) {
  const res = await api.get('/project-inventory/documents', { params });
  return res.data?.data || { documents: [], total: 0 };
}

export async function createProjectDocument(data) {
  const res = await api.post('/project-inventory/documents', data);
  return res.data?.data;
}

export async function uploadProjectDocumentAttachment(id, data) {
  const res = await api.post(`/project-inventory/documents/${id}/attachment`, data);
  return res.data?.data;
}

export async function signProjectDocument(id, data) {
  const res = await api.post(`/project-inventory/documents/${id}/sign`, data);
  return res.data?.data;
}

export async function getProjectAuthorities() {
  const res = await api.get('/project-inventory/authorities');
  return res.data?.data;
}

export async function updateUserProjectAuthority(userId, allowedProjects) {
  const res = await api.put(`/project-inventory/authorities/${userId}`, {
    allowed_projects: allowedProjects
  });
  return res.data?.data;
}

export async function getMyProjectAuthorities() {
  const res = await api.get('/project-inventory/my-authorities');
  return res.data?.data;
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
  getFamousItems,
  getWimSummary,
  getWimComponents,
  getWimTransactions,
  getWimWarranty,
  getProjectDocuments,
  createProjectDocument,
  uploadProjectDocumentAttachment,
  signProjectDocument,
  getProjectAuthorities,
  updateUserProjectAuthority,
  getMyProjectAuthorities
};


