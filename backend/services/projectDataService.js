import zlib from 'zlib';
import db from './localDb.js';
import { supabase } from './supabase.js';

const DATASET_KEYS = [
  'famous_items',
  'famous_fleet_matrix',
  'famous_summary',
  'wim_components',
  'wim_transactions',
  'wim_warranty',
  'wim_summary',
  'project_documents',
  'project_authorities'
];

const store = {
  famous_items: [],
  famous_fleet_matrix: [],
  famous_summary: {
    total_items: 0,
    total_pindahan: 0,
    by_category: {},
    by_status: {},
    by_mitra: {},
    fleet_summary: { total_units: 0, optimal_units: 0, partial_units: 0, critical_units: 0 }
  },
  wim_components: [],
  wim_transactions: [],
  wim_warranty: [],
  wim_summary: {
    total_components: 0,
    total_transactions: 0,
    total_warranty_items: 0,
    by_category: {},
    by_status: {},
    by_lane: {},
    lanes_summary: []
  },
  project_documents: [],
  project_authorities: {}
};

let initPromise = null;
let initialized = false;

function decodeGzB64(gzB64) {
  if (!gzB64 || typeof gzB64 !== 'string') return null;
  const buf = zlib.gunzipSync(Buffer.from(gzB64, 'base64'));
  return JSON.parse(buf.toString('utf8'));
}

function encodeGzB64(data) {
  return zlib.gzipSync(Buffer.from(JSON.stringify(data), 'utf8'), { level: 9 }).toString('base64');
}

export async function ensureProjectDatasetsLoaded() {
  if (initialized) return store;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const loadedKeys = new Set();

    // 1. Try loading from PostgreSQL system_settings
    if (db.isConnected()) {
      try {
        const { rows } = await db.query(
          `SELECT key, value FROM system_settings WHERE key LIKE 'dataset:%'`
        );
        for (const row of rows || []) {
          const k = row.key.replace(/^dataset:/, '');
          if (DATASET_KEYS.includes(k)) {
            const parsed = decodeGzB64(row.value);
            if (parsed !== null) {
              store[k] = parsed;
              loadedKeys.add(k);
            }
          }
        }
      } catch (e) {
        console.warn('[ProjectDataService] PG dataset load warning:', e.message);
      }
    }

    // 2. For any dataset not yet loaded, fetch from Supabase Cloud
    const missing = DATASET_KEYS.filter(k => !loadedKeys.has(k));
    if (missing.length > 0) {
      try {
        const ids = missing.map(k => `sys-ds:${k}`);
        const { data, error } = await supabase
          .from('project_inventory_logs')
          .select('id, destination_location, notes')
          .in('id', ids);
        if (!error && Array.isArray(data)) {
          for (const row of data) {
            const k = row.destination_location || String(row.id).replace(/^sys-ds:/, '');
            if (DATASET_KEYS.includes(k) && row.notes) {
              const parsed = decodeGzB64(row.notes);
              if (parsed !== null) {
                store[k] = parsed;
                loadedKeys.add(k);
              }
            }
          }
        }
      } catch (e) {
        console.warn('[ProjectDataService] Supabase dataset load warning:', e.message);
      }
    }

    initialized = true;
    console.log(
      `[ProjectDataService] Loaded datasets from DB: FAMOUS (${store.famous_items.length} items, ${store.famous_fleet_matrix.length} fleet), WIM (${store.wim_components.length} components, ${store.wim_transactions.length} tx), Docs (${store.project_documents.length})`
    );
    return store;
  })();

  return initPromise;
}

export async function persistDataset(key, value) {
  store[key] = value;
  const gzB64 = encodeGzB64(value);

  if (db.isConnected()) {
    db.query(
      `INSERT INTO system_settings (key, value, updated_by, updated_at)
       VALUES ($1, $2, 'system', NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [`dataset:${key}`, gzB64]
    ).catch(() => {});
  }

  supabase
    .from('project_inventory_logs')
    .upsert({
      id: `sys-ds:${key}`,
      project_id: key.startsWith('wim') ? 'proj-wim' : 'proj-famous',
      item_id: null,
      action_type: 'SYSTEM_DATASET',
      source_location: 'DB_STORAGE',
      destination_location: key,
      technician_name: 'SYSTEM',
      document_number: `DS-${key.toUpperCase()}`,
      notes: gzB64
    })
    .then(() => {})
    .catch(() => {});
}

export function getDatasetStore() {
  return store;
}

// Kick off background load on import
ensureProjectDatasetsLoaded().catch(() => {});
