import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Layers,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building2,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  RotateCcw,
  Edit3,
  ArrowRight
} from 'lucide-react';
import ParallelogramCard from './ParallelogramCard.jsx';

/**
 * DocumentWaitingList
 * 
 * Renders the queue / waiting list of approval documents.
 * Displays both template-based documents (MOS, MDT, MRP) and custom uploaded
 * documents from user's local computer.
 */
export default function DocumentWaitingList({
  documents = [],
  loading = false,
  currentUser,
  onSelectDocument,
  onOpenUploadModal,
  onOpenSignatureModal,
  onEditDocument,
  userSignature
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'my_pending' | 'waiting_admin' | 'waiting_superadmin' | 'completed'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'MOS' | 'MDT' | 'MRP' | 'CUSTOM'

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      doc.doc_number?.toLowerCase().includes(q) ||
      doc.title?.toLowerCase().includes(q) ||
      doc.site_location?.toLowerCase().includes(q) ||
      doc.pic_receiver_name?.toLowerCase().includes(q);

    let matchStatus = true;
    if (statusFilter === 'waiting_user') {
      matchStatus =
        doc.status === 'waiting_user' ||
        doc.status === 'waiting_sign' ||
        doc.status === 'draft' ||
        ((!doc.signatures_placed || doc.signatures_placed.length === 0) && doc.status !== 'completed');
    } else if (statusFilter !== 'ALL') {
      matchStatus = doc.status === statusFilter;
    }

    const matchType = typeFilter === 'ALL' || doc.template_type === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  // Calculate status counts
  const totalCount = documents.length;
  const completedCount = documents.filter(d => d.status === 'completed').length;
  const waitingAdminCount = documents.filter(d => d.status === 'waiting_admin').length;
  const waitingSuperadminCount = documents.filter(d => d.status === 'waiting_superadmin').length;
  const waitingUserCount = documents.filter(d =>
    d.status === 'waiting_user' ||
    d.status === 'waiting_sign' ||
    d.status === 'draft' ||
    ((!d.signatures_placed || d.signatures_placed.length === 0) && d.status !== 'completed')
  ).length;

  return (
    <div className="space-y-3.5">
      
      {/* ── Top Metric Parallelogram Cards (Signature Desktop Shape) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 py-0">
        <ParallelogramCard
          title="TOTAL DOKUMEN MOS"
          value={String(totalCount).padStart(2, '0')}
          unit="BERKAS"
          subtitle="Arsip & Antrean Terdaftar"
          subtitleColor="text-slate-600"
          icon={Layers}
          iconColor="text-slate-600"
          accentColor="border-slate-600"
          valueColor="text-slate-900"
          badgeDotColor={statusFilter === 'ALL' ? 'bg-slate-700 ring-4 ring-slate-200' : undefined}
          padding="p-3 sm:p-3.5"
          onClick={() => setStatusFilter('ALL')}
        />

        <ParallelogramCard
          title="MENUNGGU TTD USER"
          value={String(waitingUserCount).padStart(2, '0')}
          unit="BERKAS"
          subtitle="Tahap Slot 1 Pembuat"
          subtitleIcon={UserCheck}
          subtitleColor="text-red-700"
          icon={UserCheck}
          iconColor="text-red-600"
          accentColor="border-red-600"
          valueColor="text-red-700"
          badgeDotColor={statusFilter === 'waiting_user' ? 'bg-red-600 ring-4 ring-red-100' : undefined}
          padding="p-3 sm:p-3.5"
          onClick={() => setStatusFilter('waiting_user')}
        />

        <ParallelogramCard
          title="DALAM PROSES REVIEW"
          value={String(waitingAdminCount + waitingSuperadminCount).padStart(2, '0')}
          unit="BERKAS"
          subtitle="Verifikasi Slot 2 & Slot 3"
          subtitleIcon={Clock}
          subtitleColor="text-amber-700"
          icon={Clock}
          iconColor="text-amber-600"
          accentColor="border-amber-600"
          valueColor="text-amber-700"
          badgeDotColor={statusFilter === 'waiting_admin' ? 'bg-amber-600 ring-4 ring-amber-100' : undefined}
          padding="p-3 sm:p-3.5"
          onClick={() => setStatusFilter('waiting_admin')}
        />

        <ParallelogramCard
          title="SELESAI DISETUJUI"
          value={String(completedCount).padStart(2, '0')}
          unit="BERKAS"
          subtitle="Sah 3 Tanda Tangan"
          subtitleIcon={CheckCircle2}
          subtitleColor="text-emerald-700"
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          accentColor="border-emerald-600"
          valueColor="text-emerald-700"
          badgeDotColor={statusFilter === 'completed' ? 'bg-emerald-600 ring-4 ring-emerald-100' : undefined}
          padding="p-3 sm:p-3.5"
          onClick={() => setStatusFilter('completed')}
        />
      </div>

      {/* ── Signature Requirement Banner ── */}
      <div className="bg-gradient-to-r from-red-900 to-slate-900 text-white rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 flex-1 min-w-[260px]">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md text-red-300 flex items-center justify-center border border-white/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Tanda Tangan Digital Transparan Anda
              </h3>
              {userSignature ? (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  ✓ Terdaftar &amp; Siap
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/40 animate-pulse">
                  ⚠ Wajib Diunggah
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Setiap user wajib memiliki tanda tangan. Unggah foto atau PDF tanda tangan, background otomatis dihapus transparan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto justify-end shrink-0">
          {userSignature && (
            <div className="h-9 px-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center">
              <img
                src={userSignature}
                alt="My Signature"
                className="max-h-7 max-w-[90px] object-contain filter drop-shadow-sm invert brightness-200"
              />
            </div>
          )}

          <button
            onClick={onOpenSignatureModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{userSignature ? 'Perbarui TTD' : 'Upload TTD Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* ── Search, Filters, and Add Actions ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 px-4 py-3 sm:px-5 sm:py-3.5 shadow-2xs space-y-2.5">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no. dokumen, judul, lokasi site, atau PIC..."
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-red-500 bg-slate-50/50"
            />
          </div>

          {/* Action Buttons: Local Upload & Template — Pushed to right edge */}
          <div className="flex items-center gap-2 ml-auto justify-end shrink-0">
            <button
              onClick={() => onOpenUploadModal?.('local')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4 text-red-600" />
              <span>Upload Dokumen Lokal (PC)</span>
            </button>

            <button
              onClick={() => onOpenUploadModal?.('template')}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Buat dari Template</span>
            </button>
          </div>

        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { key: 'ALL', label: 'Semua Status' },
              { key: 'waiting_user', label: 'Menunggu TTD User', badge: waitingUserCount },
              { key: 'waiting_admin', label: 'Menunggu Admin', badge: waitingAdminCount },
              { key: 'waiting_superadmin', label: 'Menunggu Superadmin', badge: waitingSuperadminCount },
              { key: 'completed', label: 'Selesai Disetujui', badge: completedCount }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge != null && tab.badge > 0 && (
                  <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    statusFilter === tab.key ? 'bg-white text-red-600' : 'bg-red-100 text-red-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Template Type Filter — Pushed to right edge */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 ml-auto justify-end shrink-0">
            <span>Filter Tipe:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 bg-white"
            >
              <option value="ALL">Semua Format</option>
              <option value="MOS">001 - MOS</option>
              <option value="MDT">005 - MDT</option>
              <option value="MRP">006 - MRP</option>
              <option value="CUSTOM">Upload Lokal</option>
            </select>
          </div>

        </div>

      </div>

      {/* ── Waiting List Document Cards ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200">
            <Clock className="w-8 h-8 text-red-600 animate-spin mx-auto" />
            <div className="text-sm font-semibold">Memuat daftar antrean dokumen approval...</div>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3 bg-white rounded-3xl border border-slate-200">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-slate-700">
              Tidak ada dokumen approval yang sesuai dengan filter.
            </div>
            <p className="text-xs text-slate-400">
              Silakan unggah dokumen baru dari komputer lokal atau buat dari template resmi.
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const stampedCount = doc.signatures_placed?.length || 0;
            const isCompleted = doc.status === 'completed';
            const isLandscape = doc.orientation !== 'portrait';

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="bg-white hover:bg-slate-50/80 px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-200/90 hover:border-red-300 shadow-2xs transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Left: Document Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-lg border border-red-100">
                        {doc.doc_number}
                      </span>

                      {/* Template badge */}
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.template_type === 'MDT'
                          ? '005_VGT_MDT'
                          : doc.template_type === 'MRP'
                          ? '006_VGT_MRP'
                          : doc.template_type === 'CUSTOM'
                          ? 'DOKUMEN LOKAL PC'
                          : '001_VGT_MOS'}
                      </span>

                      {/* Orientation badge */}
                      <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
                        {isLandscape ? 'Landscape (A4)' : 'Portrait (A4)'}
                      </span>

                      {/* Status badge */}
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : doc.status === 'waiting_superadmin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : doc.status === 'waiting_admin'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {isCompleted
                          ? '✓ Disetujui Lengkap'
                          : doc.status === 'waiting_superadmin'
                          ? 'Menunggu Otorisasi Superadmin'
                          : doc.status === 'waiting_admin'
                          ? 'Menunggu Diperiksa Admin'
                          : 'Menunggu TTD User'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                      {doc.title}
                    </h4>

                    {/* Route: Dari Asal ➔ Ke Tujuan */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Rute:</span>
                        <span className="font-semibold text-slate-800">{doc.origin_location || 'Office VGT'}</span>
                        <ArrowRight className="w-3 h-3 text-red-500 shrink-0" />
                        <span className="font-semibold text-slate-800">{doc.destination_location || doc.site_location || 'BIB Pit Sebamban KM-14'}</span>
                      </div>
                      {doc.destination_receiver && (
                        <span className="text-[11px] text-slate-500">
                          (Penerima: <strong className="text-slate-700">{doc.destination_receiver}</strong>)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{doc.received_date || doc.created_at?.split('T')[0]}</span>
                      </span>

                      <span>PIC Pengirim: <strong className="text-slate-700">{doc.sender_name || doc.pic_receiver_name || 'Rayhans Najib'}</strong></span>

                      {doc.intended_for && (
                        <span className="text-slate-400">| Peruntukan: <strong className="text-slate-700">{doc.intended_for}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Right: Signature Progress & CTA */}
                  <div className="flex items-center gap-3 sm:border-l sm:border-slate-100 sm:pl-5 shrink-0">
                    
                    {/* Edit Document Info Button */}
                    {onEditDocument && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditDocument(doc);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        title="Sesuaikan Nomor, Rute & Approval Dokumen"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}

                    {/* Stamped signatures pill count */}
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Progress TTD
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {(doc.signatures_placed || []).map((s, idx) => (
                            <div
                              key={s.id || idx}
                              className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-800"
                              title={`${s.signer_name} (${s.signer_role})`}
                            >
                              {s.signer_name?.[0] || '✓'}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {stampedCount}/3 TTD
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 group-hover:bg-red-600 text-slate-700 group-hover:text-white rounded-xl text-xs font-bold transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review &amp; TTD</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
