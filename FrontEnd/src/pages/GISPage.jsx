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
  Crosshair
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { INITIAL_SITES, calculateHaversineDistance } from '../mockData.js';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to capture map clicks and update coordinates
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export default function GISPage() {
  const { role } = useAuth();
  const isSuperadmin = role === 'Superadmin';

  // Sites state initialized from localStorage or mockData
  const [sites, setSites] = useState(() => {
    try {
      const saved = localStorage.getItem('digitech_gis_sites');
      return saved ? JSON.parse(saved) : INITIAL_SITES;
    } catch {
      return INITIAL_SITES;
    }
  });

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

  // Save updated geofence to sites list & localStorage
  const handleSaveGeofence = () => {
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

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // Add new site
  const handleCreateNewSite = (e) => {
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

    const updated = [...sites, newSite];
    setSites(updated);
    try {
      localStorage.setItem('digitech_gis_sites', JSON.stringify(updated));
    } catch {}

    handleSiteChange(newSite);
    setShowAddSiteModal(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-red-600" />
            GIS &amp; Geofencing Asset Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Konfigurasi perimeter geofence tambang, pemantauan koordinat GPS, dan validasi radius transaksi material MOS / MR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold ${
            isWithin ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {isWithin ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-red-600" />}
            <span>{isWithin ? `TERVERIFIKASI DALAM RADIUS (${Math.round(distance)}m)` : `DILUAR RADIUS GEOFENCE (${Math.round(distance)}m)`}</span>
          </div>

          <button
            onClick={() => setShowAddSiteModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Site</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Konfigurasi Geofence untuk <strong>{selectedSite.name}</strong> berhasil diperbarui dan disimpan ke sistem.</span>
        </div>
      )}

      {/* ── 2. Main Content Grid: Controls & Live Leaflet Map ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (5 cols): Site Selector & Geofence Editor */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Site Selector Cards */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pilih Area Site Geofence
              </h3>
              <span className="text-[11px] font-mono text-slate-400 font-semibold">{sites.length} Site Terdaftar</span>
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

          {/* Superadmin Geofence Configuration Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pengaturan Geofence Site
                </h3>
              </div>
              <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                Mode Editor
              </span>
            </div>

            {/* Click Mode Toggle for Map */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 block">
                Mode Klik Peta:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setClickMode('center')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    clickMode === 'center'
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Set Titik Pusat Site</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClickMode('test')}
                  className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    clickMode === 'test'
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Set Simulasi GPS</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                *Klik pada area peta untuk langsung memindahkan titik koordinat yang dipilih.
              </p>
            </div>

            {/* Coordinates Inputs */}
            <div className="grid grid-cols-2 gap-3 text-xs">
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

            {/* Radius Slider & Numeric Input */}
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

        {/* Right Column (7 cols): Interactive Leaflet Map */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Peta Interaktif — {selectedSite.name}</span>
              </h3>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Koordinat: {centerLat.toFixed(6)}, {centerLng.toFixed(6)} • Radius: {radiusMeters}m
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono font-semibold">
              <span className="flex items-center gap-1.5 text-red-700">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-200" />
                Pusat Site
              </span>
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200" />
                Simulasi GPS ({Math.round(distance)}m)
              </span>
            </div>
          </div>

          {/* Map Canvas */}
          <div className="flex-1 w-full min-h-[500px] relative">
            <MapContainer
              center={[centerLat, centerLng]}
              zoom={15}
              style={{ height: '100%', minHeight: '500px', width: '100%' }}
              key={`${selectedSite.id}-${centerLat}-${centerLng}`}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />

              {/* Map Click Listener */}
              <MapClickHandler onMapClick={handleMapClick} />

              {/* Geofence Perimeter Circle */}
              <Circle
                center={[centerLat, centerLng]}
                radius={radiusMeters}
                pathOptions={{
                  color: '#DC2626',
                  fillColor: '#DC2626',
                  fillOpacity: 0.12,
                  weight: 2.5,
                  dashArray: '8 6'
                }}
              />

              {/* Center Site Marker */}
              <Marker position={[centerLat, centerLng]}>
                <Popup>
                  <div className="text-xs font-sans">
                    <strong className="text-red-700 font-bold block">{selectedSite.name}</strong>
                    <div className="font-mono text-[11px] text-slate-600 mt-1">
                      Pusat: {centerLat.toFixed(6)}, {centerLng.toFixed(6)}<br />
                      Batas Radius: {radiusMeters} meter
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Test / Simulated Device Marker */}
              <Marker position={[testLat, testLng]}>
                <Popup>
                  <div className="text-xs font-sans">
                    <strong className="text-blue-700 font-bold block">Simulasi Perangkat Teknisi</strong>
                    <div className="font-mono text-[11px] text-slate-600 mt-1">
                      Lokasi: {testLat.toFixed(6)}, {testLng.toFixed(6)}<br />
                      Jarak ke Pusat: {Math.round(distance)}m<br />
                      Status: {isWithin ? '✅ Terverifikasi Didalam Geofence' : '❌ Diluar Batas Geofence'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>

      </div>

      {/* ── 3. Modal Tambah Site Baru ── */}
      {showAddSiteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Registrasi Site Geofence Baru</h3>
                  <p className="text-[11px] text-slate-500">DIGITECH — Tambang Site BIB</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddSiteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSite} className="py-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Site</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Site Port Batulicin Central"
                  value={newSiteForm.name}
                  onChange={e => setNewSiteForm({ ...newSiteForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode Site</label>
                  <input
                    type="text"
                    required
                    placeholder="BIB-PORT-02"
                    value={newSiteForm.code}
                    onChange={e => setNewSiteForm({ ...newSiteForm, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Radius (meter)</label>
                  <input
                    type="number"
                    required
                    value={newSiteForm.radius}
                    onChange={e => setNewSiteForm({ ...newSiteForm, radius: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newSiteForm.lat}
                    onChange={e => setNewSiteForm({ ...newSiteForm, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newSiteForm.lng}
                    onChange={e => setNewSiteForm({ ...newSiteForm, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSiteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition shadow-md shadow-red-600/20 cursor-pointer"
                >
                  Simpan Site Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
