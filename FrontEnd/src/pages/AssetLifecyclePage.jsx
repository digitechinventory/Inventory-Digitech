import React, { useState } from 'react';
import {
  Workflow,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  ShieldCheck,
  ChevronRight,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

const STAGES = [
  {
    num: 1,
    code: 'RFI',
    title: 'Request for Information',
    roles: 'User (Requester)',
    output: 'Dokumen RFI Digital (Tercatat)',
    desc: 'Input spesifikasi teknis awal barang atau perangkat yang dibutuhkan untuk kebutuhan modifikasi atau perbaikan operasional site.',
    status: 'Tercatat',
    badgeCls: 'bg-slate-100 text-slate-700'
  },
  {
    num: 2,
    code: 'PR',
    title: 'Purchase Requisition',
    roles: 'User & Admin (Staff)',
    output: 'Tiket PR Digital (Pending / Approved)',
    desc: 'Pengajuan pembelian material resmi saat stok menyentuh atau berada di bawah batas minimum (safety stock).',
    status: 'Approved',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  {
    num: 3,
    code: 'PO',
    title: 'Purchase Order',
    roles: 'Superadmin (Manajemen)',
    output: 'Nomor Registrasi PO Resmi',
    desc: 'Input nomor kontrak pemesanan resmi vendor, rincian biaya, serta tanggal komitmen pengiriman barang.',
    status: 'Active',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    num: 4,
    code: 'Delivery',
    title: 'Ekspedisi & Logistik',
    roles: 'Admin (Staff Gudang)',
    output: 'Log Status Pengiriman (In-Transit)',
    desc: 'Pencatatan status logistik ekspedisi/vendor pengirim menuju site beserta nomor surat jalan (Delivery Order / DO).',
    status: 'In-Transit',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    num: 5,
    code: 'MOS',
    title: 'Material On Site',
    roles: 'User, Admin, & Superadmin',
    output: 'Dokumen MOS Sah & Trigger Stok Masuk',
    desc: 'Pemeriksaan fisik langsung saat barang tiba di gerbang/gudang site, verifikasi kesesuaian DO, geofencing lokasi penerimaan, unggah bukti fisik, dan pembubuhan 3-slot digital signature.',
    status: 'Critical Gate',
    badgeCls: 'bg-red-50 text-red-700 border-red-300 font-bold',
    highlight: true
  },
  {
    num: 6,
    code: 'QC',
    title: 'Commissioning & QC',
    roles: 'Admin & Superadmin',
    output: 'Sertifikat QC Digital & Label QR Aktif',
    desc: 'Pengujian kelaikan teknis, inspeksi fungsi alat, penerbitan Berita Acara Commissioning, dan pencetakan label QR Code unik barang.',
    status: 'Certified',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    num: 7,
    code: 'Operational',
    title: 'Operasional & Perawatan',
    roles: 'User & Admin',
    output: 'Buku Besar Mutasi (Inventory Ledger)',
    desc: 'Pencatatan mutasi penggunaan material harian (Material Request / MR), peminjaman alat kerja (Tool Tracking), dan perbaikan berkala.',
    status: 'In-Use',
    badgeCls: 'bg-slate-100 text-slate-800 border-slate-300'
  },
  {
    num: 8,
    code: 'Disposal',
    title: 'Decommissioning & Afkir',
    roles: 'Admin & Superadmin',
    output: 'Status Decommissioned & Hapus Stok',
    desc: 'Penonaktifan aset rusak permanen atau habis masa pakai melalui Berita Acara Pemusnahan/Afkir dengan persetujuan final Superadmin.',
    status: 'Final State',
    badgeCls: 'bg-slate-200 text-slate-700'
  }
];

export default function AssetLifecyclePage() {
  const [selectedStage, setSelectedStage] = useState(STAGES[4]); // MOS default

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Pemantauan 8 Tahap Siklus Hidup Aset
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Prinsip "No Document, No Movement": Setiap pergerakan aset wajib memiliki jejak dokumen digital legal yang tak terputus.
        </p>
      </div>

      {/* Horizontal Interactive Pipeline */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm overflow-x-auto">
        <div className="flex items-center min-w-[850px] justify-between relative">
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
          {STAGES.map((st) => {
            const isSelected = selectedStage.num === st.num;
            return (
              <button
                key={st.code}
                type="button"
                onClick={() => setSelectedStage(st)}
                className={`relative z-10 flex flex-col items-center group cursor-pointer transition-all ${
                  isSelected ? 'scale-110' : 'hover:scale-105'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs transition-all shadow-md ${
                  isSelected
                    ? 'bg-red-700 text-white ring-4 ring-red-700/20 shadow-red-950/30'
                    : st.highlight
                    ? 'bg-red-50 text-red-700 border-2 border-red-500'
                    : 'bg-white text-slate-700 border border-slate-300'
                }`}>
                  {st.num}
                </div>
                <div className={`text-xs font-bold mt-2 ${isSelected ? 'text-red-700 font-black' : 'text-slate-700'}`}>
                  {st.code}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{st.status}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Card of Selected Stage */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center font-black text-lg border border-red-200">
              {selectedStage.num}
            </div>
            <div>
              <span className="text-[10px] font-mono text-red-600 font-bold uppercase">Tahap {selectedStage.num} dari 8</span>
              <h2 className="text-lg font-black text-slate-900">{selectedStage.title} ({selectedStage.code})</h2>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {selectedStage.desc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">Peran Pengguna Terlibat</div>
              <div className="text-xs font-bold text-slate-900 mt-1">{selectedStage.roles}</div>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">Output Dokumen & Sistem</div>
              <div className="text-xs font-bold text-red-700 mt-1">{selectedStage.output}</div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-slate-950 to-slate-900 text-white rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">Aturan Bisnis Kritis</div>
            <h4 className="text-sm font-bold text-white mt-1">Prasyarat Dokumen Berjenjang</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mt-2">
              Aset tidak dapat melangkah ke tahap selanjutnya tanpa kelengkapan berkas digital pada tahap sebelumnya. Tahap MOS (Tahap 5) memegang peranan krusial sebagai pintu masuk fisik barang site.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
            Status Validasi: Disetujui untuk Operasional Tambang BIB
          </div>
        </div>
      </div>
    </div>
  );
}
