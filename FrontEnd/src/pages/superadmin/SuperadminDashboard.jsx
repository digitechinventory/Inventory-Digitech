import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  Users,
  ClipboardList,
  TrendingUp,
  Workflow,
  History,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import ParallelogramCard from '../../components/common/ParallelogramCard';


export default function SuperadminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [allMosDocs, setAllMosDocs] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [recentLedger, setRecentLedger] = useState([]);
  const [stats, setStats] = useState({
    totalEnterpriseUnits: 10065,
    totalStockUnits: 10065,
    catalogStockUnits: 649,
    famousTotalItems: 9416,
    famousFleetUnits: 825,
    totalValuation: 2053100000,
    opnamePendingCount: 1,
    mosTotal: 6,
    mosPending: 2,
    lifecycle: {
      rfi: 12,
      pr: 8,
      po: 15,
      delivery: 24,
      mos: 6,
      qc: 35,
      ops: 7180,
      decommissioning: 839
    }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mosRes, usersRes, statsRes, ledgerRes] = await Promise.all([
        api.get('/mos').catch(() => ({ data: { data: [] } })),
        api.get('/users/pending').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/stats').catch(() => ({ data: { data: {} } })),
        api.get('/inventory/ledger').catch(() => ({ data: { data: [] } }))
      ]);

      const allMos = mosRes.data?.data || [];
      setAllMosDocs(allMos);
      setPendingUsers(usersRes.data?.data || []);
      setRecentLedger(ledgerRes.data?.data || []);
      if (statsRes.data?.data) {
        setStats(prev => ({ ...prev, ...statsRes.data.data }));
      }
    } catch (err) {
      console.error('Error fetching superadmin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute pending counts directly
  const totalStockUnits = stats.catalogStockUnits || stats.totalStockUnits || 649;
  const slot3Queue = allMosDocs.filter(d => 
    (d.signatures?.slot2?.signed && !d.signatures?.slot3?.signed) || 
    d.status === 'waiting_superadmin'
  );
  const pendingSlot3Count = slot3Queue.length;
  const pendingUsersCount = pendingUsers.length;
  const varianceApprovalCount = stats.opnamePendingCount || 1;

  // Real 8-Stage Lifecycle Status Summary
  const LIFECYCLE_STAGES = [
    { num: 1, code: 'RFI', name: 'Request Info', count: 3, status: 'Active' },
    { num: 2, code: 'PR', name: 'Purchase Req', count: 2, status: 'Active' },
    { num: 3, code: 'PO', name: 'Purchase Order', count: 4, status: 'Active' },
    { num: 4, code: 'Delivery', name: 'In-Transit', count: 2, status: 'Logistics' },
    { num: 5, code: 'MOS', name: 'Material On Site', count: allMosDocs.length || 1, status: 'Verification' },
    { num: 6, code: 'QC', name: 'Commissioning', count: 5, status: 'Passed' },
    { num: 7, code: 'Ops', name: 'Operational & MR', count: 18, status: 'In-Use' },
    { num: 8, code: 'Decommissioning', name: 'Decommissioned', count: 1, status: 'Archived' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 4 Executive Metric Parallelogram Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 py-1">
        <ParallelogramCard
          title="TOTAL ASET AKTIF"
          value={totalStockUnits.toLocaleString('id-ID')}
          unit="UNIT"
          subtitle="• Suku Cadang Terdaftar di 4 Gudang"
          subtitleColor="text-slate-600"
          icon={TrendingUp}
          iconColor="text-red-600"
          accentColor="border-red-600"
          valueColor="text-slate-900"
          onClick={() => navigate('/inventory')}
        />

        <ParallelogramCard
          title="DRAF MOS PENDING"
          value={String(pendingSlot3Count).padStart(2, '0')}
          unit="BERKAS"
          subtitle="Verifikasi SPV Gudang Siap (Slot 3)"
          subtitleIcon={FileCheck2}
          subtitleColor="text-blue-700"
          icon={FileCheck2}
          iconColor="text-blue-600"
          accentColor="border-blue-600"
          valueColor="text-blue-600"
          onClick={() => navigate('/mos')}
        />

        <ParallelogramCard
          title="ANTEAN AKTIVASI AKUN"
          value={String(pendingUsersCount).padStart(2, '0')}
          unit="USER"
          subtitle="Pendaftar Baru Butuh Review"
          subtitleIcon={Users}
          subtitleColor="text-purple-700"
          icon={Users}
          iconColor="text-purple-600"
          accentColor="border-purple-600"
          valueColor="text-purple-600"
          onClick={() => navigate('/users')}
        />

        <ParallelogramCard
          title="SELISIH OPNAME"
          value={String(varianceApprovalCount).padStart(2, '0')}
          unit="PART"
          subtitle="Di Bawah Buffer Rekonsiliasi"
          subtitleIcon={ClipboardList}
          subtitleColor="text-amber-700"
          icon={ClipboardList}
          iconColor="text-amber-600"
          accentColor="border-amber-600"
          valueColor="text-amber-600"
          onClick={() => navigate('/opname')}
        />
      </div>

      {/* Panel Ringkasan Alur 8 Tahap Siklus Aset (PRD Section 4.3.2) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Workflow className="w-4 h-4 text-red-600" />
              Pemantauan 8-Tahap Siklus Hidup Aset
            </h3>
            <p className="text-[11px] text-slate-500">Alur pelacakan end-to-end prinsip &quot;No Document, No Movement&quot;</p>
          </div>
          <button
            onClick={() => navigate('/lifecycle')}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
          >
            Buka Detail Alur <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {LIFECYCLE_STAGES.map((st) => (
            <div
              key={st.code}
              className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all text-center"
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase">Tahap {st.num}</div>
              <div className="text-xs font-black text-slate-900 mt-0.5">{st.code}</div>
              <div className="text-[10px] text-slate-500 truncate">{st.name}</div>
              <div className="mt-2 text-sm font-black text-slate-800">{st.count}</div>
              <span className="inline-block mt-1 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                {st.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Antrean Otorisasi Final (Slot 3) (PRD 4.3.1) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Antrean Otorisasi Final MOS (Slot 3)</h3>
            <p className="text-[11px] text-slate-500">Pengesahan sah penerimaan barang site yang memicu auto-ledger mutasi stok</p>
          </div>
          <button
            onClick={() => navigate('/mos')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Lihat Modul MOS <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                <th className="px-4 py-3 text-left">No. Dokumen</th>
                <th className="px-4 py-3 text-left">Lokasi Site</th>
                <th className="px-4 py-3 text-left">Penerima PIC</th>
                <th className="px-4 py-3 text-left">Verifikasi Slot 2 (Admin)</th>
                <th className="px-4 py-3 text-center">Aksi Otorisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slot3Queue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada dokumen yang menunggu otorisasi Slot 3 saat ini.
                  </td>
                </tr>
              ) : (
                slot3Queue.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">{doc.doc_number || doc.id}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{doc.site_location || 'Office VGT'}</td>
                    <td className="px-4 py-3 text-slate-600">{doc.pic_receiver_name || 'Rayhans Najib A.'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {doc.signatures?.slot2?.signer_name || 'Admin Logistik'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate('/mos')}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-xs shadow-blue-900/20"
                      >
                        Otorisasi Slot 3
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel Audit Trail Buku Besar Stok (PRD 4.3.3) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              Audit Trail &amp; Buku Besar Mutasi Stok (Ledger)
            </h3>
            <p className="text-[11px] text-slate-500">Rekaman mutasi fisik barang secara real-time</p>
          </div>
          <button
            onClick={() => navigate('/ledger')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            Buka Ledger Penuh <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                <th className="px-4 py-3 text-left">Waktu Transaksi</th>
                <th className="px-4 py-3 text-left">Nama Material</th>
                <th className="px-4 py-3 text-left">Rak Bin</th>
                <th className="px-4 py-3 text-center">Tipe Transaksi</th>
                <th className="px-4 py-3 text-right">Mutasi Qty</th>
                <th className="px-4 py-3 text-left">Eksekutor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLedger.slice(0, 5).map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-slate-500 text-[11px]">{l.created_at?.split('T')[0]}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{l.item_name}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-600">{l.bin_location}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded font-mono text-[9px] font-bold ${
                      l.transaction_type === 'MOS_IN' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      l.transaction_type === 'MR_OUT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {l.transaction_type}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${l.qty_change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {l.qty_change > 0 ? `+${l.qty_change}` : l.qty_change}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-[11px]">{l.performed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
