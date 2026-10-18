import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Navigation,
  Sliders,
  Save,
  Plus,
  Compass,
  CheckCircle2,
  X,
  Crosshair,
  Layers,
  Building2,
  Boxes,
  Truck,
  Wrench,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { INITIAL_SITES, calculateHaversineDistance } from '../mockData.js';

// Fix Leaflet marker icons with clean CDN links
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Icons for distinct entities on map
const createCustomIcon = (bgColor, iconChar, label) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%);">
        <div style="background-color:${bgColor}; color:white; font-size:11px; font-weight:800; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(0,0,0,0.35); border:2px solid #ffffff;">
          ${iconChar}
        </div>
        <div style="background:rgba(15,23,42,0.85); color:#ffffff; font-size:9px; font-weight:700; padding:2px 6px; border-radius:6px; margin-top:3px; white-space:nowrap; border:1px solid rgba(255,255,255,0.2); backdrop-filter:blur(4px);">
          ${label}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

const warehouseIcon = createCustomIcon('#DC2626', '🏭', 'Gudang');
const assetIcon = createCustomIcon('#2563EB', '🚜', 'Aset Unit');
const toolIcon = createCustomIcon('#D97706', '🔧', 'Peralatan');
const simulatedDeviceIcon = createCustomIcon('#10B981', '📍', 'GPS Perangkat');

// Sample Operational Assets & Equipment deployed across mining sites
const OPERATIONAL_ASSETS = [
  {
    id: 'ast-001',
    name: 'Caterpillar 777D Haul Truck #HT-08',
    category: 'Heavy Equipment',
    status: 'Operasional',
    lat: -3.620800,
    lng: 115.653400,
    siteName: 'BIB Pit Sebamban Base Workshop',
    condition: 'Optimal (Maintenance Overhaul)',
    assignedPIC: 'arya-user',
    lastPing: '2 menit lalu'
  },
  {
    id: 'ast-002',
    name: 'Komatsu PC2000-8 Excavator #EX-02',
    category: 'Excavator Fleet',
    status: 'Operasional',
    lat: -3.622100,
    lng: 115.655100,
    siteName: 'Area Tambang Pit Sebamban KM 24',
    condition: 'Siap Pakai (Hydraulic Normal)',
    assignedPIC: 'Mekanik Shift A',
    lastPing: '5 menit lalu'
  },
  {
    id: 'ast-003',
    name: 'Snap-on HD Digital Torque Wrench 1000Nm',
    category: 'Special Tool',
    status: 'Dipinjam',
    lat: -3.511900,
    lng: 115.820500,
    siteName: 'BIB Central Heavy Equipment Warehouse',
    condition: 'Terkalibrasi',
    assignedPIC: 'Budi Santoso',
    lastPing: '12 menit lalu'
  },
  {
    id: 'ast-004',
    name: 'Tangki Pasokan Pelumas Tellus S2 V46',
    category: 'Bulk Storage',
    status: 'Tersedia',
    lat: -3.456800,
    lng: 115.985100,
    siteName: 'BIB Port Batulicin Terminal',
    condition: 'Level 82% (28 Drum)',
    assignedPIC: 'arya-admin',
    lastPing: '1 jam lalu'
  }
];

// Component to capture map clicks and update coordinates
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function AssetTrackingPage() {
  const { role } = useAuth();
  const { addToast } = useToast();
  const isSuperadmin = role === 'Superadmin';

  // Map Tile Layers: HD Satellite (Esri), Hybrid, or OpenStreetMap
  const [mapLayer, setMapLayer] = useState('satellite'); // 'satellite' | 'hybrid' | 'streets'

  // Visibility filters for multi-layer inspection
  const [showAllWarehouses, setShowAllWarehouses] = useState(true);
  const [showAllAssets, setShowAllAssets] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);

  // Sites state initialized from localStorage or mockData, then synced from DB
  const [sites, setSites] = useState(() => {
    try {
      const saved = localStorage.getItem('digitech_gis_sites');
      return saved ? JSON.parse(saved) : INITIAL_SITES;
    } catch {
      return INITIAL_SITES;
    }
  });

  // Sync master sites from backend database
  React.useEffect(() => {
    async function loadSites() {
      try {
        const res = await api.get('/sites');
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map(s => ({
            id: s.id,
            name: s.name,
            code: s.code,
            lat: Number(s.lat),
            lng: Number(s.lng),
            radius: Number(s.radius || 200),
            areaName: s.area_name || s.name,
            activeStaffCount: s.activeStaffCount || 20,
            status: s.status || 'active'
          }));
          setSites(mapped);
        }
      } catch (err) {
        console.warn('[AssetTracking] Using cached sites:', err.message);
      }
    }
    loadSites();
  }, []);

  const [selectedSiteId, setSelectedSiteId] = useState(sites[1]?.id || sites[0]?.id);
  const selectedSite = useMemo(() => {
    return sites.find(s => s.id === selectedSiteId) || sites[0];
  }, [sites, selectedSiteId]);

  // Editable Site Coordinates and Radius
  const [centerLat, setCenterLat] = useState(selectedSite.lat);
  const [centerLng, setCenterLng] = useState(selectedSite.lng);
  const [radiusMeters, setRadiusMeters] = useState(selectedSite.radius || 200);

  // Test simulation coordinates
  const [testLat, setTestLat] = useState(selectedSite.lat + 0.0008);
  const [testLng, setTestLng] = useState(selectedSite.lng + 0.0006);

  // Click mode: 'center' | 'test'
  const [clickMode, setClickMode] = useState('center');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);

  // New site form state
  const [newSiteForm, setNewSiteForm] = useState({
    name: '',
    code: '',
    areaName: 'Site PIT BIB-02',
    lat: -3.6120,
    lng: 115.5890,
    radius: 250
  });

  // Calculate live Haversine distance between center and simulated test pin
  const distance = calculateHaversineDistance(centerLat, centerLng, testLat, testLng);
  const isWithin = distance <= radiusMeters;

  // Handle switching site selection
  const handleSiteChange = (site) => {
    setSelectedSiteId(site.id);
    setCenterLat(site.lat);
    setCenterLng(site.lng);
    setRadiusMeters(site.radius || 200);
    setTestLat(site.lat + 0.0006);
    setTestLng(site.lng + 0.0006);
    setSaveSuccess(false);
  };

  // Handle map click
  const handleMapClick = (lat, lng) => {
    if (clickMode === 'center') {
      setCenterLat(Number(lat.toFixed(6)));
      setCenterLng(Number(lng.toFixed(6)));
    } else {
      setTestLat(Number(lat.toFixed(6)));
      setTestLng(Number(lng.toFixed(6)));
    }
  };

  // Save updated geofence to sites list & localStorage & database
  const handleSaveGeofence = async () => {
    const updated = sites.map(s => {
      if (s.id === selectedSite.id) {
        return {
          ...s,
          lat: centerLat,
          lng: centerLng,
          radius: radiusMeters
        };
      }
      return s;
    });

    setSites(updated);
    try {
      localStorage.setItem('digitech_gis_sites', JSON.stringify(updated));
    } catch {}

    if (isSuperadmin) {
      try {
        await api.put(`/sites/${selectedSite.id}`, {
          lat: centerLat,
          lng: centerLng,
          radius: radiusMeters
        });
      } catch {}
    }

    setSaveSuccess(true);
    addToast(`Koordinat geofence ${selectedSite.name} berhasil diperbarui.`, 'success');
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // Add new site
  const handleCreateNewSite = async (e) => {
    e.preventDefault();
    const newSite = {
      id: `site-${Date.now()}`,
      name: newSiteForm.name,
      code: newSiteForm.code || `BIB-SITE-${sites.length + 1}`,
      areaName: newSiteForm.areaName,
      lat: Number(newSiteForm.lat),
      lng: Number(newSiteForm.lng),
      radius: Number(newSiteForm.radius),
      activeStaffCount: 0,
      status: 'Active'
    };

    if (isSuperadmin) {
      try {
        await api.post('/sites', {
          name: newSite.name,
          code: newSite.code,
          lat: newSite.lat,
          lng: newSite.lng,
          radius: newSite.radius,
          area_name: newSite.areaName
        });
      } catch {}
    }

    const updated = [...sites, newSite];
    setSites(updated);
    try {
      localStorage.setItem('digitech_gis_sites', JSON.stringify(updated));
    } catch {}

    handleSiteChange(newSite);
    setShowAddSiteModal(false);
    setSaveSuccess(true);
    addToast(`Master lokasi site ${newSite.name} berhasil didaftarkan ke sistem.`, 'success');
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6">
      {/* ── 1. Page Header (No 'interaktif', No 'GIS' term) ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-0 pr-0 sm:pr-4">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-red-600" />
            Asset Tracking &amp; Wilayah Operasional
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pemantauan posisi seluruh gudang, aset alat berat, dan batas perimeter geofence wilayah kerja.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 ml-auto shrink-0">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold ${
            isWithin ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {isWithin ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-red-600" />}
            <span>{isWithin ? `DALAM RADIUS VALID (${Math.round(distance)}m)` : `DILUAR RADIUS GEOFENCE (${Math.round(distance)}m)`}</span>
          </div>

          <button
            onClick={() => setShowAddSiteModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Lokasi / Gudang</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Konfigurasi Wilayah &amp; Geofence untuk <strong>{selectedSite.name}</strong> berhasil disimpan.</span>
        </div>
      )}

      {/* ── 2. Layer Filter & Satellite Switcher Strip ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-semibold">
        {/* Layer Switches: Satelit HD vs Hybrid vs Streets */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono text-[11px] uppercase mr-1">Tampilan Peta:</span>
          <button
            type="button"
            onClick={() => setMapLayer('satellite')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              mapLayer === 'satellite'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            🛰️ Satelit HD (Esri)
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('hybrid')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              mapLayer === 'hybrid'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            🗺️ Satelit + Label
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('streets')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              mapLayer === 'streets'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            🛣️ Peta Jalan (OSM)
          </button>
        </div>

        {/* Visibility Toggles for All Warehouses, Assets, and Boundaries — Pushed to right edge */}
        <div className="flex flex-wrap items-center justify-end gap-2 ml-auto shrink-0">
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              checked={showAllWarehouses}
              onChange={(e) => setShowAllWarehouses(e.target.checked)}
              className="accent-red-600 rounded"
            />
            <span>Semua Gudang ({sites.length})</span>
          </label>
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              checked={showAllAssets}
              onChange={(e) => setShowAllAssets(e.target.checked)}
              className="accent-blue-600 rounded"
            />
            <span>Aset &amp; Unit Tambang ({OPERATIONAL_ASSETS.length})</span>
          </label>
          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              checked={showGeofences}
              onChange={(e) => setShowGeofences(e.target.checked)}
              className="accent-red-600 rounded"
            />
            <span>Perimeter Geofence</span>
          </label>
        </div>
      </div>

      {/* ── 3. Main Content Grid: Controls & Live Map ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (5 cols): Site Selector & Geofence Editor */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Site Selector Cards */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-red-600" />
                <span>Pilih Wilayah Operasional &amp; Gudang</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400 font-semibold">{sites.length} Lokasi</span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {sites.map(site => {
                const isSelected = selectedSite.id === site.id;
                return (
                  <button
                    key={site.id}
                    onClick={() => handleSiteChange(site)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-red-500 bg-red-50/60 text-slate-900 shadow-2xs ring-1 ring-red-500/20'
                        : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-red-600' : 'text-slate-400'}`} />
                        <span>{site.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5 ml-5">
                        {site.code} • Radius {site.radius || 200}m
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                      Lat: {site.lat.toFixed(4)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asset & Unit Tracking Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Posisi Aset &amp; Unit Bergerak</span>
              </h3>
              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
                {OPERATIONAL_ASSETS.length} Terdeteksi
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {OPERATIONAL_ASSETS.map(asset => (
                <div key={asset.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white transition text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{asset.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {asset.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between font-mono">
                    <span>{asset.siteName}</span>
                    <span className="text-slate-400">{asset.lastPing}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Geofence Configuration Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pengaturan Geofence Wilayah
                </h3>
              </div>
              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                Mode Editor
              </span>
            </div>

            {/* Click Mode Toggle for Map */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-slate-500 font-bold uppercase block">
                Target Klik Pada Peta:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setClickMode('center')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    clickMode === 'center'
                      ? 'bg-red-50 border-red-500 text-red-700 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5 text-red-600" />
                  <span>Pusat Gudang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClickMode('test')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    clickMode === 'test'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Simulasi GPS</span>
                </button>
              </div>
            </div>

            {/* Coordinates Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase mb-1">
                  Latitude Pusat
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={centerLat}
                  onChange={(e) => setCenterLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase mb-1">
                  Longitude Pusat
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={centerLng}
                  onChange={(e) => setCenterLng(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Radius Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Radius Batas Geofence:</span>
                <span className="font-mono font-bold text-red-600 text-sm">{radiusMeters} meter</span>
              </div>
              <input
                type="range"
                min={50}
                max={2500}
                step={25}
                value={radiusMeters}
                onChange={e => setRadiusMeters(Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>50m (Gudang/Rak)</span>
                <span>500m (Workshop)</span>
                <span>2500m (Pit Tambang)</span>
              </div>
            </div>

            {/* Quick Testing Actions */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <button
                type="button"
                onClick={() => { setTestLat(centerLat); setTestLng(centerLng); }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer font-bold text-center"
              >
                Posisikan di Tengah
              </button>
              <button
                type="button"
                onClick={() => { setTestLat(centerLat + 0.005); setTestLng(centerLng + 0.005); }}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl transition cursor-pointer font-bold text-center"
              >
                Simulasi Diluar Radius
              </button>
            </div>

            {/* Save Geofence Button */}
            <button
              type="button"
              onClick={handleSaveGeofence}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi Geofence</span>
            </button>
          </div>

        </div>

        {/* Right Column (7 cols): High-Resolution Satellite Map */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col isolate relative z-0">
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Peta Satelit Wilayah — {selectedSite.name}</span>
              </h3>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Koordinat: {centerLat.toFixed(6)}, {centerLng.toFixed(6)} • Radius: {radiusMeters}m
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono font-semibold">
              <span className="flex items-center gap-1.5 text-red-700">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-200" />
                Pusat Gudang
              </span>
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200" />
                Simulasi GPS ({Math.round(distance)}m)
              </span>
            </div>
          </div>

          {/* Map Canvas (Isolate ensures Leaflet z-indexes stay contained) */}
          <div className="flex-1 w-full min-h-[560px] relative isolate z-0">
            <MapContainer
              center={[centerLat, centerLng]}
              zoom={15}
              style={{ height: '100%', minHeight: '560px', width: '100%' }}
              key={`${selectedSite.id}-${centerLat}-${centerLng}-${mapLayer}`}
            >
              {/* TileLayer Selection */}
              {mapLayer === 'satellite' && (
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="&copy; Esri &mdash; High-Resolution Satellite Imagery"
                  maxZoom={19}
                />
              )}

              {mapLayer === 'hybrid' && (
                <>
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="&copy; Esri World Imagery"
                    maxZoom={19}
                  />
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                    attribution="&copy; Esri Labels"
                    maxZoom={19}
                  />
                </>
              )}

              {mapLayer === 'streets' && (
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                  maxZoom={19}
                />
              )}

              {/* Map Click Listener */}
              <MapClickHandler onMapClick={handleMapClick} />

              {/* Geofence Perimeter Circles */}
              {showGeofences && (
                <>
                  {/* Selected Site Geofence */}
                  <Circle
                    center={[centerLat, centerLng]}
                    radius={radiusMeters}
                    pathOptions={{
                      color: '#DC2626',
                      fillColor: '#DC2626',
                      fillOpacity: 0.18,
                      weight: 2.5,
                      dashArray: '8 6'
                    }}
                  />

                  {/* Other Registered Sites Geofences */}
                  {sites.filter(s => s.id !== selectedSite.id).map(otherSite => (
                    <Circle
                      key={`circle-${otherSite.id}`}
                      center={[otherSite.lat, otherSite.lng]}
                      radius={otherSite.radius || 200}
                      pathOptions={{
                        color: '#EA580C',
                        fillColor: '#EA580C',
                        fillOpacity: 0.08,
                        weight: 1.5,
                        dashArray: '4 4'
                      }}
                    />
                  ))}
                </>
              )}

              {/* Markers for All Warehouses / Sites */}
              {showAllWarehouses && sites.map(site => {
                const isCurrent = site.id === selectedSite.id;
                const pos = isCurrent ? [centerLat, centerLng] : [site.lat, site.lng];
                return (
                  <Marker key={site.id} position={pos} icon={warehouseIcon}>
                    <Popup>
                      <div className="text-xs font-sans">
                        <strong className="text-red-700 font-bold block">{site.name}</strong>
                        <div className="font-mono text-[11px] text-slate-600 mt-1">
                          Kode: {site.code}<br />
                          Area: {site.areaName}<br />
                          Pusat: {pos[0].toFixed(6)}, {pos[1].toFixed(6)}<br />
                          Radius Geofence: {site.radius || 200} meter
                        </div>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleSiteChange(site)}
                            className="mt-2 w-full py-1 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Pilih Lokasi Ini
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Markers for All Operational Assets */}
              {showAllAssets && OPERATIONAL_ASSETS.map(asset => (
                <Marker key={asset.id} position={[asset.lat, asset.lng]} icon={assetIcon}>
                  <Popup>
                    <div className="text-xs font-sans">
                      <strong className="text-blue-700 font-bold block">{asset.name}</strong>
                      <div className="font-mono text-[11px] text-slate-600 mt-1">
                        Kategori: {asset.category}<br />
                        Status: <strong>{asset.status}</strong><br />
                        Kondisi: {asset.condition}<br />
                        PIC: {asset.assignedPIC}<br />
                        Update Terakhir: {asset.lastPing}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Test / Simulated Device Marker */}
              <Marker position={[testLat, testLng]} icon={simulatedDeviceIcon}>
                <Popup>
                  <div className="text-xs font-sans">
                    <strong className="text-emerald-700 font-bold block">Simulasi Perangkat Teknisi</strong>
                    <div className="font-mono text-[11px] text-slate-600 mt-1">
                      Lokasi: {testLat.toFixed(6)}, {testLng.toFixed(6)}<br />
                      Jarak ke Pusat: {Math.round(distance)}m<br />
                      Status Radius: <span className={isWithin ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                        {isWithin ? 'VALID (Di Dalam Geofence)' : 'INVALID (Di Luar Batas)'}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

      </div>

      {/* Modal Tambah Site / Gudang Baru */}
      {showAddSiteModal && (
        <div className="fixed inset-0 z-50 bg-slate-800/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md overflow-hidden p-6 pt-8 pb-8 space-y-4" style={{ clipPath: "polygon(0 14px, 100% 0, 100% calc(100% - 14px), 0 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.14), 0 8px 24px rgba(220,38,38,0.10)" }}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600" />
                <span>Tambah Lokasi Gudang / Wilayah Site</span>
              </h3>
              <button
                onClick={() => setShowAddSiteModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSite} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Nama Gudang / Site
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Workshop Pit 3 Sentral"
                  value={newSiteForm.name}
                  onChange={e => setNewSiteForm({ ...newSiteForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Kode Lokasi
                  </label>
                  <input
                    type="text"
                    placeholder="BIB-PIT-03"
                    value={newSiteForm.code}
                    onChange={e => setNewSiteForm({ ...newSiteForm, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Radius (meter)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={2500}
                    value={newSiteForm.radius}
                    onChange={e => setNewSiteForm({ ...newSiteForm, radius: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newSiteForm.lat}
                    onChange={e => setNewSiteForm({ ...newSiteForm, lat: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newSiteForm.lng}
                    onChange={e => setNewSiteForm({ ...newSiteForm, lng: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSiteModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-600/20 cursor-pointer"
                >
                  Simpan Lokasi Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


