import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ShieldAlert, ShieldCheck, Radio, Navigation } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { INITIAL_SITES, calculateHaversineDistance } from '../mockData.js';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function GISPage() {
  const { isSuperadmin, role } = useAuth();

  const [selectedSite, setSelectedSite] = useState(INITIAL_SITES[1]);
  const [testLat, setTestLat] = useState(selectedSite.lat + 0.0008);
  const [testLng, setTestLng] = useState(selectedSite.lng + 0.0006);
  const [radiusMeters, setRadiusMeters] = useState(selectedSite.radius || 200);

  const distance = calculateHaversineDistance(selectedSite.lat, selectedSite.lng, testLat, testLng);
  const isWithin = distance <= radiusMeters;

  const handleSiteChange = (site) => {
    setSelectedSite(site);
    setRadiusMeters(site.radius);
    setTestLat(site.lat + 0.0005);
    setTestLng(site.lng + 0.0005);
  };

  return (
    <div className="p-5 lg:p-7 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
            GIS & Geofencing
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time geofence monitoring for BIB mining sites</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isWithin ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          {isWithin
            ? <ShieldCheck className="w-4 h-4 text-emerald-600" />
            : <ShieldAlert className="w-4 h-4 text-red-600" />
          }
          <span className={`text-xs font-mono font-bold ${isWithin ? 'text-emerald-700' : 'text-red-700'}`}>
            {isWithin ? `WITHIN — ${Math.round(distance)}m` : `OUT OF BOUNDS — ${Math.round(distance)}m`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left Panel */}
        <div className="space-y-4">
          {/* Site Selector */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Select Site
            </h3>
            <div className="space-y-2">
              {INITIAL_SITES.map(site => (
                <button
                  key={site.id}
                  onClick={() => handleSiteChange(site)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all cursor-pointer text-sm ${
                    selectedSite.id === site.id
                      ? 'border-[#DC2626] bg-red-50 text-[#DC2626]'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs">{site.name}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">{site.code} • {site.radius}m radius</div>
                </button>
              ))}
            </div>
          </div>

          {/* Geofence Controls */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Geofence Config
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                  Radius (meters): {radiusMeters}m
                </label>
                <input
                  type="range" min={50} max={1000} step={25}
                  value={radiusMeters}
                  onChange={e => setRadiusMeters(Number(e.target.value))}
                  className="w-full accent-[#DC2626]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  onClick={() => { setTestLat(selectedSite.lat); setTestLng(selectedSite.lng); }}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer font-semibold"
                >
                  Reset to Center
                </button>
                <button
                  onClick={() => { setTestLat(selectedSite.lat + 0.003); setTestLng(selectedSite.lng + 0.003); }}
                  className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-colors cursor-pointer font-semibold"
                >
                  Simulate OOB
                </button>
              </div>
            </div>
          </div>

          {/* Site Info */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Site Info
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Site Code', val: selectedSite.code },
                { label: 'Area', val: selectedSite.areaName },
                { label: 'Active Staff', val: selectedSite.activeStaffCount },
                { label: 'Status', val: selectedSite.status },
                { label: 'Center Lat', val: selectedSite.lat.toFixed(6) },
                { label: 'Center Lng', val: selectedSite.lng.toFixed(6) },
                { label: 'Test Distance', val: `${Math.round(distance)}m` },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-[11px] font-mono text-slate-500">{label}</span>
                  <span className="text-xs font-mono font-semibold text-slate-800">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]" style={{ minHeight: '500px' }}>
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A]" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Live Map — {selectedSite.name}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-emerald-600 font-semibold">LIVE</span>
            </div>
          </div>
          <div style={{ height: '460px' }}>
            <MapContainer
              center={[selectedSite.lat, selectedSite.lng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              key={selectedSite.id}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {/* Geofence circle */}
              <Circle
                center={[selectedSite.lat, selectedSite.lng]}
                radius={radiusMeters}
                pathOptions={{
                  color: '#DC2626',
                  fillColor: '#DC2626',
                  fillOpacity: 0.08,
                  weight: 2,
                  dashArray: '6 4'
                }}
              />
              {/* Site center marker */}
              <Marker position={[selectedSite.lat, selectedSite.lng]}>
                <Popup>
                  <div className="text-xs font-mono">
                    <strong>{selectedSite.name}</strong><br />
                    Center: {selectedSite.lat.toFixed(6)}, {selectedSite.lng.toFixed(6)}<br />
                    Radius: {radiusMeters}m
                  </div>
                </Popup>
              </Marker>
              {/* Test position marker */}
              <Marker position={[testLat, testLng]}>
                <Popup>
                  <div className="text-xs font-mono">
                    <strong>Test Position</strong><br />
                    {testLat.toFixed(6)}, {testLng.toFixed(6)}<br />
                    Distance: {Math.round(distance)}m<br />
                    Status: {isWithin ? '✅ Within' : '❌ Out of Bounds'}
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
