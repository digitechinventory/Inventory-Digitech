import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Eye,
  X,
  FolderGit2
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ProjectWorkspaceBanner, {
  useProjectWorkspace,
  LockedProjectScreen,
  resolveRecordProjectId,
  getProjectCodeById,
  getProjectBadgeClasses
} from '../components/common/ProjectWorkspaceBanner.jsx';

export default function StockOpnamePage() {
  const { role, isSuperadmin } = useAuth();
  const { addToast } = useToast();
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedOpname, setSelectedOpname] = useState(null);
  const [showBlindCountModal, setShowBlindCountModal] = useState(null);

  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    activeProject,
    isProjectLocked,
    isCurrentProjectLocked
  } = useProjectWorkspace();

  // Fetch opname sessions
  const { data: opnameData, refetch } = useQuery({
    queryKey: ['opname'],
    queryFn: async () => {
      const res = await api.get('/opname');
      return res.data?.data || [];
    }
  });

  const allOpnames = useMemo(() => {
    const raw = Array.isArray(opnameData) ? opnameData : [];
    return raw.map((so, idx) => {
      const pid = resolveRecordProjectId(so, idx);
      return {
        ...so,
        project_id: pid,
        project_code: getProjectCodeById(pid)
      };
    });
  }, [opnameData]);

  // Count per project
  const projectCounts = useMemo(() => {
    const counts = { 'proj-famous': 0, 'proj-wim': 0, 'proj-ccm': 0 };
    allOpnames.forEach((so) => {
      counts[so.project_id] = (counts[so.project_id] || 0) + 1;
    });
    return counts;
  }, [allOpnames]);

  // Filter opnames strictly for the active authorized project
  const opnames = useMemo(() => {
    if (isCurrentProjectLocked) return [];
    return allOpnames.filter((so) => so.project_id === selectedProjectId);
  }, [allOpnames, selectedProjectId, isCurrentProjectLocked]);

  // Superadmin approves variance
  const handleApproveVariance = async (opnameId) => {
    try {
      await api.put(`/opname/${opnameId}/approve-variance`);
      addToast('Otorisasi varians disetujui. Penyesuaian stok telah dibukukan ke buku besar mutasi secara otomatis.', 'success');
      refetch();
      setSelectedOpname(null);
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal menyetujui varians.', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-md border ${getProjectBadgeClasses(selectedProjectId)}`}>
              PROJECT &bull; {activeProject.code}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {activeProject.site_location}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Stock Opname Fisik — {activeProject.code}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemeriksaan fisik periodik, verifikasi saldo riil material, dan rekonsiliasi buku besar otomatis per project workspace
          </p>
        </div>

        {['Admin', 'Superadmin'].includes(role) && !isCurrentProjectLocked && (
          <button
            onClick={() => setShowStartModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-950/30 cursor-pointer self-start md:self-auto md:ml-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            Mulai Sesi Opname ({activeProject.code})
          </button>
        )}
      </div>

      {/* Project Workspace Selector & Access Indicator */}
      <ProjectWorkspaceBanner
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        isProjectLocked={isProjectLocked}
        projectCounts={projectCounts}
        countUnitLabel="Sesi Audit"
        moduleName="Stock Opname Fisik"
      />

      {/* If selected project is unauthorized for this user, render Locked Screen */}
      {isCurrentProjectLocked ? (
        <LockedProjectScreen
          activeProject={activeProject}
          projects={projects}
          onSelectProject={setSelectedProjectId}
          isProjectLocked={isProjectLocked}
          moduleName="Stock Opname Fisik"
        />
      ) : (
        /* Table of Sessions for Active Project */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Riwayat Sesi Audit Stock Opname — Project {activeProject.code}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              Total Sesi {activeProject.code}: {opnames.length} Sesi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                  <th className="px-4 py-3 text-left">Project</th>
                  <th className="px-4 py-3 text-left">No. Sesi Opname</th>
                  <th className="px-4 py-3 text-left">Zona Rak Diaudit</th>
                  <th className="px-4 py-3 text-left">Auditor Pelaksana</th>
                  <th className="px-4 py-3 text-left">Tanggal Sesi</th>
                  <th className="px-4 py-3 text-left">Status Audit</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {opnames.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      Belum ada sesi stock opname untuk Project <strong>{activeProject.code}</strong>.
                    </td>
                  </tr>
                ) : (
                  opnames.map((so) => (
                    <tr key={so.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md border ${getProjectBadgeClasses(so.project_id)}`}>
                          {so.project_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{so.opname_number}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{so.zone}</td>
                      <td className="px-4 py-3 text-slate-600">{so.auditor_name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{so.created_at?.split('T')[0]}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                          so.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : so.status === 'pending_approval'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {so.status === 'completed' ? 'Selesai Direkonsiliasi' : so.status === 'pending_approval' ? 'Menunggu Otorisasi Varians' : 'Sedang Berjalan'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {so.status === 'in_progress' ? (
                            <button
                              onClick={() => setShowBlindCountModal(so)}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Input Cacah Fisik
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedOpname(so)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              Detail &amp; Rekonsiliasi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: MULAI SESI OPNAME BARU */}
      {showStartModal && !isCurrentProjectLocked && (
        <StartOpnameModal
          activeProject={activeProject}
          onClose={() => setShowStartModal(false)}
          onSuccess={() => {
            setShowStartModal(false);
            refetch();
          }}
        />
      )}

      {/* MODAL 2: INPUT BLIND COUNT */}
      {showBlindCountModal && !isCurrentProjectLocked && (
        <BlindCountInputModal
          opname={showBlindCountModal}
          activeProject={activeProject}
          onClose={() => setShowBlindCountModal(null)}
          onSuccess={() => {
            setShowBlindCountModal(null);
            refetch();
          }}
        />
      )}

      {/* MODAL 3: DETAIL VARIAN & OTORISASI SUPERADMIN */}
      {selectedOpname && (
        <div className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" style={{ clipPath: "polygon(0 14px, 100% 0, 100% calc(100% - 14px), 0 100%)", boxShadow: "0 25px 60px rgba(0,0,0,0.14), 0 8px 24px rgba(220,38,38,0.10)" }}>
            <div className="bg-white text-slate-900 px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-red-600 font-bold uppercase">Laporan Varians Opname</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getProjectBadgeClasses(selectedOpname.project_id)}`}>
                    {selectedOpname.project_code || activeProject.code}
                  </span>
                </div>
                <h3 className="text-base font-bold mt-0.5">{selectedOpname.opname_number} — {selectedOpname.zone}</h3>
              </div>
              <button onClick={() => setSelectedOpname(null)} className="p-1 text-slate-400 hover:text-red-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                      <th className="px-3 py-2 text-left">SKU &amp; Nama Barang</th>
                      <th className="px-3 py-2 text-left">Rak</th>
                      <th className="px-3 py-2 text-center">Sistem</th>
                      <th className="px-3 py-2 text-center">Fisik Riil</th>
                      <th className="px-3 py-2 text-center">Selisih</th>
                      <th className="px-3 py-2 text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedOpname.items || []).map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 font-bold text-slate-900">{it.item_name}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">{it.rack}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold">{it.system_qty}</td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-700">{it.physical_qty}</td>
                        <td className={`px-3 py-2.5 text-center font-mono font-black ${it.variance === 0 ? 'text-slate-400' : it.variance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {it.variance > 0 ? `+${it.variance}` : it.variance}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 text-[11px]">{it.variance_reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 pt-3 pb-8 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedOpname(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Tutup
              </button>

              {isSuperadmin && selectedOpname.status === 'pending_approval' && (
                <button
                  type="button"
                  onClick={() => handleApproveVariance(selectedOpname.id)}
                  className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-950/20 cursor-pointer"
                >
                  Setujui Varians &amp; Mutasi Ledger
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StartOpnameModal({ activeProject, onClose, onSuccess }) {
  const { addToast } = useToast();
  const zoneOptions = useMemo(() => {
    if (activeProject?.id === 'proj-wim') {
      return [
        'Zona B1 (Gudang WIM KM-14 - Load Cell & Sensor)',
        'Zona B2 (Gudang WIM KM-28 - Indicator & Junction Box)',
        'Zona B3 (Sparepart Jembatan Timbang WIM)'
      ];
    }
    if (activeProject?.id === 'proj-ccm') {
      return [
        'Zona C1 (Gudang Port Bunati - Belt Scale Sensor)',
        'Zona C2 (ROM Stockpile - Crusher Telemetry)',
        'Zona C3 (Sparepart Conveyor & Analyzer CCM)'
      ];
    }
    return [
      'Zona A1 (Gudang FAMOUS KM-24 - Kamera DMS & ADAS)',
      'Zona A2 (Gudang FAMOUS KM-24 - Unit MDVR & GPS)',
      'Zona A3 (Sparepart Kabel & Bracket Armada FAMOUS)'
    ];
  }, [activeProject]);

  const [zone, setZone] = useState(zoneOptions[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/opname/start', {
        zone,
        notes: `[PROJECT:${activeProject.code}] ${notes}`,
        project_id: activeProject.id
      });
      addToast(`Sesi stock opname baru untuk Project ${activeProject.code} berhasil dimulai.`, 'success');
      onSuccess();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal memulai opname.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-md overflow-hidden p-6 pt-8 pb-8"
        style={{
          clipPath: "polygon(0 14px, 100% 0, 100% calc(100% - 14px), 0 100%)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.14), 0 8px 24px rgba(220,38,38,0.10)"
        }}
      >
        <div style={{ background: 'linear-gradient(90deg, #DC2626, #EF4444)', height: '4px', width: '100%', marginBottom: '16px' }} />
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <span className="text-[10px] font-mono font-bold text-red-600 uppercase">Workspace Project {activeProject.code}</span>
            <h3 className="text-base font-black text-slate-900">Mulai Sesi Stock Opname</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Zona Rak Project {activeProject.code}
            </label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              {zoneOptions.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Catatan / Alasan Audit
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Contoh: Audit fisik berkala gudang ${activeProject.code}`}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-700/20 cursor-pointer"
            >
              {loading ? 'Memproses...' : `Mulai Audit ${activeProject.code}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BlindCountInputModal({ opname, activeProject, onClose, onSuccess }) {
  const { addToast } = useToast();
  const defaultItems = useMemo(() => {
    const pid = opname?.project_id || activeProject?.id;
    if (pid === 'proj-wim') {
      return [
        { sku: 'WIM-LC-50T-IP68', item_name: 'Compression Load Cell 50 Ton IP68', rack: 'R-B01', physical_qty: 8, system_qty: 8, variance_reason: '' },
        { sku: 'WIM-IND-DGT-02', item_name: 'Digital Weight Indicator Controller WIM', rack: 'R-B02', physical_qty: 5, system_qty: 5, variance_reason: '' },
        { sku: 'WIM-JBOX-SS304', item_name: 'Signal Junction Box 8-Cell SS304', rack: 'R-B03', physical_qty: 12, system_qty: 12, variance_reason: '' }
      ];
    }
    if (pid === 'proj-ccm') {
      return [
        { sku: 'CCM-BS-BELT-01', item_name: 'Conveyor Belt Scale Speed Sensor', rack: 'R-C01', physical_qty: 6, system_qty: 6, variance_reason: '' },
        { sku: 'CCM-CRSH-VIB-02', item_name: 'Crusher Vibration & Bearing Transmitter', rack: 'R-C02', physical_qty: 10, system_qty: 10, variance_reason: '' },
        { sku: 'CCM-PLC-MOD-03', item_name: 'Industrial Modbus RTU Telemetry Gateway', rack: 'R-C03', physical_qty: 4, system_qty: 4, variance_reason: '' }
      ];
    }
    return [
      { sku: 'FAM-MDVR-8CH-01', item_name: 'Mobile DVR 8-Channel Telemetry', rack: 'R-A01', physical_qty: 14, system_qty: 14, variance_reason: '' },
      { sku: 'FAM-CAM-DMS-IR', item_name: 'Infrared Driver Monitoring Camera (DMS)', rack: 'R-A02', physical_qty: 21, system_qty: 21, variance_reason: '' },
      { sku: 'FAM-ADAS-CAM-03', item_name: 'Forward Collision ADAS Cabin Sensor', rack: 'R-A03', physical_qty: 16, system_qty: 16, variance_reason: '' }
    ];
  }, [opname, activeProject]);

  const [items, setItems] = useState(defaultItems);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/opname/${opname.id}/submit-count`, {
        items,
        project_id: opname.project_id || activeProject?.id
      });
      addToast(`Hasil cacah fisik Project ${opname.project_code || activeProject.code} berhasil disimpan dan direkonsiliasi.`, 'success');
      onSuccess();
    } catch (err) {
      addToast(err.response?.data?.error?.message || err.message || 'Gagal menyimpan hasil cacah.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-6 pt-8 pb-8"
        style={{
          clipPath: "polygon(0 14px, 100% 0, 100% calc(100% - 14px), 0 100%)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.14), 0 8px 24px rgba(220,38,38,0.10)"
        }}
      >
        <div style={{ background: 'linear-gradient(90deg, #F59E0B, #DC2626)', height: '4px', width: '100%', marginBottom: '14px' }} />
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <span className="text-[10px] font-mono text-amber-600 font-bold uppercase">
              Formulir Verifikasi Fisik &bull; Project {opname.project_code || activeProject?.code}
            </span>
            <h3 className="text-base font-black text-slate-900">Input Hasil Cacah Fisik: {opname.opname_number}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Masukkan kuantitas fisik riil hasil perhitungan di lapangan untuk rekonsiliasi otomatis buku besar.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-red-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4">
          <div className="space-y-2.5">
            {items.map((it, idx) => (
              <div key={it.sku} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{it.item_name}</div>
                    <div className="text-[10px] font-mono text-red-700">{it.sku} • Lokasi: {it.rack}</div>
                  </div>
                  <div className="w-24">
                    <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase">Jml Fisik</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={it.physical_qty}
                      onChange={(e) => {
                        const copy = [...items];
                        copy[idx].physical_qty = Number(e.target.value);
                        setItems(copy);
                      }}
                      className="w-full px-2 py-1 text-xs font-mono font-bold border border-slate-200 bg-white rounded-lg text-center"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Catatan fisik jika ada kerusakan atau kelebihan..."
                  value={it.variance_reason}
                  onChange={(e) => {
                    const copy = [...items];
                    copy[idx].variance_reason = e.target.value;
                    setItems(copy);
                  }}
                  className="w-full px-2 py-1 text-[11px] border border-slate-200 bg-white rounded-lg outline-none"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold shadow-md shadow-red-700/20 cursor-pointer"
            >
              {loading ? 'Menghitung Varians...' : 'Kirim Hasil Cacah Fisik'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
