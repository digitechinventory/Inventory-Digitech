import React, { useState } from 'react';
import {
  Workflow,
  FileText,
  Warehouse,
  Truck,
  ArrowRightLeft,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  X,
  Layers,
  CheckCircle2,
  Boxes,
  QrCode,
  PenTool,
  Clock,
  ExternalLink,
  MapPin,
  Building2
} from 'lucide-react';

/**
 * ProjectWorkflowGuide
 * 
 * Komponen visual interaktif untuk navigasi operasional dan modul aset proyek:
 * 1. Modul Operasional (Penerimaan MOS -> Gudang -> Pasang Unit -> Mutasi Unit -> Garansi RMA -> Pengesahan BASTM)
 * 2. Modal Panduan Arsitektur & Wewenang Proyek DIGITECH
 */
export default function ProjectWorkflowGuide({
  activeProject,
  activeTab,
  famousViewMode,
  wimViewMode,
  onNavigateStep,
  stats = {},
  isCollapsedDefault = false
}) {
  const [isCollapsed, setIsCollapsed] = useState(isCollapsedDefault);
  const [showModal, setShowModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('lifecycle'); // 'lifecycle' | 'architecture' | 'authority'

  const stages = [
    {
      id: 'mos',
      title: 'Penerimaan Material (MOS)',
      subtitle: 'Material On-Site Intake',
      description: 'Pemeriksaan fisik & verifikasi PO material saat tiba di site dari vendor.',
      icon: FileText,
      tag: 'Intake Site',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
      actionLabel: 'Buka Dokumen MOS',
      targetTab: 'documents'
    },
    {
      id: 'warehouse',
      title: 'Gudang & Buffer Stock',
      subtitle: 'Buffer Stock Ready',
      description: 'Penyimpanan di rak bin gudang proyek, cetak label QR thermal & status Siap.',
      icon: Warehouse,
      tag: 'Buffer Stock',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      actionLabel: 'Lihat Stok Rak',
      targetTab: 'warehouses'
    },
    {
      id: 'install',
      title: 'Instalasi Armada',
      subtitle: 'Deployment Unit / Stasiun',
      description: 'Pemasangan sensor ke armada hauling / gardu WIM dengan HM & nama teknisi.',
      icon: Truck,
      tag: 'Unit Active',
      tagColor: 'bg-red-50 text-red-700 border-red-200',
      actionLabel: 'Peta Armada Unit',
      targetTab: 'installed'
    },
    {
      id: 'transfer',
      title: 'Mutasi Antar-Unit',
      subtitle: 'Relokasi & Audit Trail',
      description: 'Pencatatan resmi relokasi sensor saat rotasi atau peremajaan unit armada mitra.',
      icon: ArrowRightLeft,
      tag: 'Relokasi',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
      actionLabel: 'Riwayat Pindahan',
      targetTab: 'transfers'
    },
    {
      id: 'rma',
      title: 'Garansi & Servis (RMA)',
      subtitle: 'Vendor Claim & Repair',
      description: 'Pencatatan kerusakan fisik, penelusuran garansi vendor 12 bulan, atau decommissioning.',
      icon: AlertTriangle,
      tag: 'RMA / Garansi',
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
      actionLabel: 'Status Garansi',
      targetTab: 'damaged'
    },
    {
      id: 'bastm',
      title: 'Pengesahan Legal (BASTM)',
      subtitle: 'Otorisasi 3-Pihak',
      description: 'Penerbitan Berita Acara Serah Terima dengan stempel dan TTD elektronik 3 pihak.',
      icon: ShieldCheck,
      tag: 'Legal Sah',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      actionLabel: 'Arsip BASTM',
      targetTab: 'documents'
    }
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all duration-300">
      
      {/* ── Header Strip: Manajemen Operasional Aset ── */}
      <div className="px-5 py-3 bg-gradient-to-r from-slate-50 via-white to-red-50/20 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                Navigasi Operasional &amp; Tata Letak Proyek ({activeProject?.code || 'PROJECT'})
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                Modul Terpadu
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Akses cepat ke modul penerimaan material, manajemen rak gudang, instalasi armada, mutasi, garansi, dan pengesahan BASTM.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Panduan Lengkap Modal */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-red-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Panduan Lengkap</span>
          </button>

          {/* Tombol Collapse / Expand */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
            title={isCollapsed ? 'Tampilkan Rincian Alur' : 'Ciutkan Rincian Alur'}
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span className="text-[11px]">Buka Alur</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span className="text-[11px]">Ciutkan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Stepper Grid (6 Connected Steps) ── */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 bg-slate-50/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 relative">
            {stages.map((st, idx) => {
              const Icon = st.icon;
              const isLast = idx === stages.length - 1;

              return (
                <div
                  key={st.id}
                  onClick={() => onNavigateStep && onNavigateStep(st.targetTab, st.id)}
                  className="group relative bg-white border border-slate-200/90 hover:border-red-400 rounded-2xl p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-md cursor-pointer text-left"
                >
                  <div>
                    {/* Top Tag & Icon */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${st.tagColor}`}>
                        {st.tag}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-red-50 text-slate-600 group-hover:text-red-600 flex items-center justify-center transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Step Title & Description */}
                    <div className="font-bold text-xs text-slate-900 group-hover:text-red-700 transition-colors">
                      {st.title}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                      {st.subtitle}
                    </div>
                    <p className="text-[10.5px] text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {st.description}
                    </p>
                  </div>

                  {/* Bottom Action Trigger */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-red-600 group-hover:text-red-700 flex items-center gap-0.5">
                      {st.actionLabel}
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] border ${st.badgeColor}`}>
                      {st.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Context Bar for Field Teams */}
          <div className="mt-3.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px]">
                <strong>Petunjuk Navigasi:</strong> Klik salah satu kotak langkah di atas untuk langsung membuka tabel atau filter operasional yang bersangkutan.
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Workspace Aktif: <strong className="text-slate-800">{activeProject?.name || 'Project'}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: PANDUAN LENGKAP ARSITEKTUR & ALUR KERJA PROYEK ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col my-auto text-left">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shadow-xs">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      ARSITEKTUR OPERASIONAL
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      SOP Digitech IMS
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                    Struktur &amp; Tata Kelola Operasional Proyek
                  </h3>
                  <p className="text-xs text-slate-500">
                    Memahami struktur hierarki, mutasi aset, serta pengesahan berita acara di site tambang.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 py-3 shrink-0">
              {[
                { id: 'lifecycle', label: '1. Modul Operasional', icon: Workflow },
                { id: 'architecture', label: '2. Tata Letak & Hierarki', icon: Layers },
                { id: 'authority', label: '3. Wewenang & Dokumen BASTM', icon: ShieldCheck }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveModalTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Scrollable Body */}
            <div className="py-5 overflow-y-auto pr-1 space-y-6 text-xs text-slate-700 flex-1">
              
              {/* TAB 1: MODUL OPERASIONAL PROYEK */}
              {activeModalTab === 'lifecycle' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      Arsitektur Modul Operasional Aset Proyek
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      Setiap perangkat keras (hardware) telematika seperti GPS Tracker, DSM Fatigue Camera, MDVR, dan sensor WIM memiliki nilai investasi tinggi dan mobilitas ekstrem di area tambang. Arsitektur modular ini memastikan tidak ada barang hilang, tertukar antar-kontraktor, atau dipasang tanpa legalitas resmi.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {stages.map(st => {
                      const Icon = st.icon;
                      return (
                        <div key={st.id} className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white flex items-start gap-3.5">
                          <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200 font-bold">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900 text-xs">
                                {st.title} — {st.subtitle}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${st.tagColor}`}>
                                {st.tag}
                              </span>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-xs">
                              {st.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: TATA LETAK & HIERARKI PROYEK */}
              {activeModalTab === 'architecture' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      Hierarki Tata Letak Data Proyek (Database Architecture)
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      Sistem mengelompokkan data secara terstruktur dari level proyek tertinggi sampai ke unit fisik terkecil:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <Building2 className="w-4 h-4 text-red-600" />
                        <span>1. Project Workspace</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Entitas kontrak proyek independen (misal <strong>FAMOUS</strong> untuk truk hauling mitra BIB, <strong>WIM</strong> untuk jembatan timbang, <strong>CCM</strong> untuk crusher). Masing-masing workspace memiliki kontrol akses otoritas sendiri.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <Warehouse className="w-4 h-4 text-emerald-600" />
                        <span>2. Gudang Site (Warehouse)</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Fasilitas penyimpanan fisik di site (seperti <em>Workshop Logistik BIB</em> atau <em>Gudang Bay 1</em>) yang dilengkapi rak bin, kontrol kapasitas, dan status buffer stock ready.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <Boxes className="w-4 h-4 text-blue-600" />
                        <span>3. Master Hardware &amp; Serial Number</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Identitas unik tiap komponen fisik yang memiliki Serial Number (SN), IMEI 1/2, Asset Tag, status garansi vendor 12 bulan, dan histori mutasi.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <Truck className="w-4 h-4 text-purple-600" />
                        <span>4. Unit Armada &amp; Lokasi Pemasangan</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Alokasi unit truk kontraktor mitra (RBT, AEK, BBA, dll) atau stasiun timbangan tempat sensor aktif bertugas mengirimkan data telematika.
                      </p>
                    </div>
                  </div>

                  {/* Mode Tampilan Explanation */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">
                      Perbedaan 2 Mode Tampilan di Workspace:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-red-600 block mb-1">Mode 1: Command Center Real-Time</span>
                        <p className="text-slate-600 text-[11px]">
                          Menampilkan matriks visual status unit, radar 9 sensor, serta interaksi filter cepat armada hauling. Dirancang untuk kontrol harian cepat.
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-800 block mb-1">Mode 2: Tabel &amp; Formulir Standar</span>
                        <p className="text-slate-600 text-[11px]">
                          Menampilkan tabel inventaris komprehensif, multi-filter gudang, input stok baru, pelaporan rusak, cetak label thermal, dan arsip dokumen.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WEWENANG & DOKUMEN BASTM */}
              {activeModalTab === 'authority' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      Hierarki Otorisasi 3-Pihak Dokumen BASTM / MOS
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      Setiap mutasi barang atau serah terima material fisik di lapangan wajib disahkan melalui lembar Berita Acara elektronik dengan 3 tanda tangan digital resmi:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-center">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        1
                      </div>
                      <div className="font-bold text-slate-900">Dibuat Oleh</div>
                      <div className="text-[11px] font-semibold text-slate-500">Teknisi Lapangan / Pelaksana</div>
                      <p className="text-[10.5px] text-slate-500">
                        Memeriksa kondisi fisik, mencatat Serial Number &amp; IMEI, dan menandatangani lembar berita acara.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-center">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        2
                      </div>
                      <div className="font-bold text-slate-900">Diperiksa Oleh</div>
                      <div className="text-[11px] font-semibold text-slate-500">Supervisor Vendor / Mitra Site</div>
                      <p className="text-[10.5px] text-slate-500">
                        Memvalidasi kesesuaian data pengiriman dengan manifest fisik barang di workshop atau gudang site.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-center">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        3
                      </div>
                      <div className="font-bold text-slate-900">Diketahui Oleh</div>
                      <div className="text-[11px] font-semibold text-slate-500">Head of DIGITECH</div>
                      <p className="text-[10.5px] text-slate-500">
                        Otorisasi final eksekutif. Sistem secara otomatis menyematkan stempel digital terenkripsi dan kode QR validasi.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-emerald-800 text-xs">
                      Dokumen yang telah berstatus <strong>Completed</strong> akan terkunci permanen di arsip audit trail dan dapat diunduh dalam format PDF standar kertas resmi.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 font-mono">
                Digitech Inventory Management System &bull; Standard Operating Procedure
              </span>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
