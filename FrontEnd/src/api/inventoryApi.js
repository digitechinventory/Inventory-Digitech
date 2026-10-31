import api from './client';

/**
 * Fetch all warehouses from database API
 */
export const getWarehouses = async () => {
  try {
    const res = await api.get('/inventory/warehouses');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('[inventoryApi] Failed to fetch warehouses:', err?.message);
  }
  return [];
};

/**
 * Fetch inventory items with optional filters from database API
 */
export const getInventoryItems = async (params = {}) => {
  try {
    const res = await api.get('/inventory', { params });
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('[inventoryApi] Failed to fetch inventory items:', err?.message);
  }
  return [];
};

/**
 * Fetch warehouse & order statistics from database API
 */
export const getInventoryStats = async () => {
  try {
    const res = await api.get('/inventory/stats');
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('[inventoryApi] Failed to fetch inventory stats:', err?.message);
  }
  return {
    totalItems: 0,
    lowStockCount: 0,
    totalWarehouses: 0,
    locationUsedPercent: 0,
    totalShelves: 0,
    emptyShelves: 0,
    fullShelves: 0,
    newlyAdded: 0,
    ordersReceived: 0,
    ordersShipped: 0,
    ordersReturned: 0,
    ordersCanceled: 0
  };
};

/**
 * Create a new stock request / order
 */
export const createStockRequest = async (payload) => {
  const res = await api.post('/inventory/request', payload);
  return res.data;
};
