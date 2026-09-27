import axios from 'axios';
import { WAREHOUSE_ZONES, SECTION_USAGE_STATS, INVENTORY_LEDGER, INITIAL_MOS_DOCUMENTS, INITIAL_SITES } from '../mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach bearer token if logged in
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Fetch list of warehouses
 */
export async function getWarehouses() {
  try {
    const res = await apiClient.get('/inventory/warehouses');
    if (res.data?.data && res.data.data.length > 0) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('[inventoryApi] Falling back to default warehouses:', err.message);
  }
  return [
    { id: 'wh-01', name: 'Warehouse 1 (Main Pit Site BIB-02)', code: 'BIB-WH1', location: 'Kec. Angsana, Kab. Tanah Bumbu, Kalsel', total_shelves: 240, occupied_shelves: 134 },
    { id: 'wh-02', name: 'Warehouse 2 (Central Workshop)', code: 'BIB-WH2', location: 'Workshop Sentral Tambang BIB', total_shelves: 180, occupied_shelves: 95 },
    { id: 'wh-03', name: 'Warehouse 3 (Sebamban Port Logistics)', code: 'BIB-WH3', location: 'Pelabuhan Khusus Batubara Sebamban', total_shelves: 200, occupied_shelves: 110 },
    { id: 'wh-04', name: 'Warehouse 4 (Sub-Depot Angsana)', code: 'BIB-WH4', location: 'Depot Penunjang Pit Selatan', total_shelves: 120, occupied_shelves: 48 }
  ];
}

/**
 * Fetch inventory items
 */
export async function getInventoryItems(params = {}) {
  try {
    const res = await apiClient.get('/inventory', { params });
    if (res.data?.data && res.data.data.length > 0) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('[inventoryApi] Falling back to default inventory items:', err.message);
  }
  return INVENTORY_LEDGER;
}

/**
 * Fetch inventory stats (Usage & Metrics)
 */
export async function getInventoryStats() {
  try {
    const res = await apiClient.get('/inventory/stats');
    if (res.data) {
      return {
        ...SECTION_USAGE_STATS,
        ...res.data
      };
    }
  } catch (err) {
    console.warn('[inventoryApi] Falling back to default stats:', err.message);
  }
  return SECTION_USAGE_STATS;
}

/**
 * Fetch MOS documents
 */
export async function getMosDocuments() {
  try {
    const res = await apiClient.get('/mos');
    if (res.data?.data && res.data.data.length > 0) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('[inventoryApi] Falling back to default MOS documents:', err.message);
  }
  return INITIAL_MOS_DOCUMENTS;
}

/**
 * Fetch Sites for GIS & Geofencing
 */
export async function getSites() {
  try {
    const res = await apiClient.get('/sites');
    if (res.data?.data && res.data.data.length > 0) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('[inventoryApi] Falling back to default sites:', err.message);
  }
  return INITIAL_SITES;
}

export default {
  getWarehouses,
  getInventoryItems,
  getInventoryStats,
  getMosDocuments,
  getSites
};
