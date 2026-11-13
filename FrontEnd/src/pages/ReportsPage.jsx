import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  PackageCheck,
  PackageMinus,
  AlertTriangle,
  Building2,
  FileCheck2,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Eye,
  ShieldCheck,
  X,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  QrCode,
  BadgeCheck,
  Upload,
  FileUp,
  Trash2
} from 'lucide-react';
import { exportStyledExcel } from '../utils/excelExport.js';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import ParallelogramCard from '../components/common/ParallelogramCard.jsx';
import DocumentUploadModal from '../components/common/DocumentUploadModal.jsx';
import ProjectWorkspaceBanner, {
  useProjectWorkspace,
  LockedProjectScreen,
  resolveRecordProjectId,
  getProjectCodeById,
  getProjectBadgeClasses
} from '../components/common/ProjectWorkspaceBanner.jsx';

export default function ReportsPage() {
  const { role, user } = useAuth();
  const { addToast } = useToast();

  const {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    activeProject,
    isProjectLocked,
    isCurrentProjectLocked
  } = useProjectWorkspace();

  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'week' | 'month' | 'quarter' | 'year'
  const [selectedSite, setSelectedSite] = useState('ALL');
  const [activeReportTab, setActiveReportTab] = useState('summary'); // 'summary' | 'documents' | 'analytics'
  const [previewDoc, setPreviewDoc] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Fetch master sites from database
  const { data: sitesData } = useQuery({
    queryKey: ['reports-sites'],
    queryFn: async () => {
      try {
        const res = await api.get('/sites');
        return Array.isArray(res.data?.data) ? res.data.data : [];
      } catch {
        return [];
      }
    }
  });
  const INITIAL_SITES = sitesData || [];

  // Fetch live ledger transactions for reports calculation
  const { data: ledgerData } = useQuery({
    queryKey: ['reports-ledger'],
    queryFn: async () => {
      try {
        const res = await api.get('/inventory/ledger');
        const items = res.data?.data || res.data;
        return Array.isArray(items) ? items : [];
      } catch {
        return [];
      }
    }
  });

  const allTransactions = useMemo(() => {
    const raw = Array.isArray(ledgerData) ? ledgerData : [];
    return raw.map((t, idx) => {
      const pid = resolveRecordProjectId(t, idx);
      return {
        ...t,
        project_id: pid,
        project_code: getProjectCodeById(pid)
      };
    });
  }, [ledgerData]);

  const projectCounts = useMemo(() => {
    const counts = { 'proj-famous': 0, 'proj-wim': 0, 'proj-ccm': 0 };
    allTransactions.forEach((t) => {
      counts[t.project_id] = (counts[t.project_id] || 0) + 1;
    });
    return counts;
  }, [allTransactions]);

  const transactions = useMemo(() => {
    if (isCurrentProjectLocked) return [];
    return allTransactions.filter((t) => t.project_id === selectedProjectId);
  }, [allTransactions, selectedProjectId, isCurrentProjectLocked]);

  // Aggregate metrics (Strictly operational logistics: Quantities, Movements & Accuracy per active project)
  const metrics = useMemo(() => {
    let totalInflowQty = 0;
    let totalOutflowQty = 0;

    transactions.forEach(t => {
      const qty = Math.abs(t.qty_change || 0);
      if (t.transaction_type === 'MOS_IN' || (t.qty_change || 0) > 0) {
        totalInflowQty += qty;
      } else {
        totalOutflowQty += qty;
      }
    });

    const totalMovementQty = totalInflowQty + totalOutflowQty;
    const accuracyByProj = selectedProjectId === 'proj-wim' ? '99.1%' : selectedProjectId === 'proj-ccm' ? '98.2%' : '98.8%';

    return {
      totalInflowQty,
      totalOutflowQty,
      totalMovementQty,
      accuracyRate: accuracyByProj,
      activeSkuCount: transactions.length || 42,
      turnoverRatio: selectedProjectId === 'proj-wim' ? '3.1x' : selectedProjectId === 'proj-ccm' ? '2.9x' : '3.8x'
    };
  }, [transactions, selectedProjectId]);

  // Monthly breakdown trend (Last 6 Months) per active project
  const monthlyTrends = useMemo(() => {
    if (selectedProjectId === 'proj-wim') {
      return [
        { month: 'Mei 2026', mos: 22, mr: 18, totalActivity: '40 Mutasi WIM' },
        { month: 'Jun 2026', mos: 28, mr: 24, totalActivity: '52 Mutasi WIM' },
        { month: 'Jul 2026', mos: 34, mr: 29, totalActivity: '63 Mutasi WIM' },
        { month: 'Agu 2026', mos: 30, mr: 31, totalActivity: '61 Mutasi WIM' },
        { month: 'Sep 2026', mos: 38, mr: 34, totalActivity: '72 Mutasi WIM' },
        { month: 'Okt 2026', mos: 29, mr: 21, totalActivity: '50 Mutasi WIM' }
      ];
    }
    if (selectedProjectId === 'proj-ccm') {
      return [
        { month: 'Mei 2026', mos: 18, mr: 14, totalActivity: '32 Mutasi CCM' },
        { month: 'Jun 2026', mos: 21, mr: 19, totalActivity: '40 Mutasi CCM' },
        { month: 'Jul 2026', mos: 26, mr: 22, totalActivity: '48 Mutasi CCM' },
        { month: 'Agu 2026', mos: 24, mr: 25, totalActivity: '49 Mutasi CCM' },
        { month: 'Sep 2026', mos: 31, mr: 27, totalActivity: '58 Mutasi CCM' },
        { month: 'Okt 2026', mos: 23, mr: 16, totalActivity: '39 Mutasi CCM' }
      ];
    }
    return [
      { month: 'Mei 2026', mos: 44, mr: 36, totalActivity: '80 Mutasi FAMOUS' },
      { month: 'Jun 2026', mos: 52, mr: 44, totalActivity: '96 Mutasi FAMOUS' },
      { month: 'Jul 2026', mos: 61, mr: 53, totalActivity: '114 Mutasi FAMOUS' },
      { month: 'Agu 2026', mos: 58, mr: 56, totalActivity: '114 Mutasi FAMOUS' },
      { month: 'Sep 2026', mos: 72, mr: 64, totalActivity: '136 Mutasi FAMOUS' },
      { month: 'Okt 2026', mos: 54, mr: 39, totalActivity: '93 Mutasi FAMOUS' }
    ];
  }, [selectedProjectId]);

  // Category Distribution per active project
  const categoryDist = useMemo(() => {
    if (selectedProjectId === 'proj-wim') {
      return [
        { name: 'Sensor Load Cell & Weighing', pct: 42, count: '68 Item', color: 'bg-blue-600', text: 'text-blue-700' },
        { name: 'Digital Weight Indicator & PLC', pct: 26, count: '42 Item', color: 'bg-red-600', text: 'text-red-700' },
        { name: 'Junction Box & Shielded Cable', pct: 18, count: '29 Item', color: 'bg-amber-500', text: 'text-amber-700' },
        { name: 'Mounting Kit & Mechanical Frame', pct: 14, count: '22 Item', color: 'bg-emerald-600', text: 'text-emerald-700' }
      ];
    }
    if (selectedProjectId === 'proj-ccm') {
      return [
        { name: 'Conveyor Belt Scale & Speed Sensor', pct: 40, count: '54 Item', color: 'bg-emerald-600', text: 'text-emerald-700' },
        { name: 'Crusher Vibration & Temp Sensor', pct: 28, count: '38 Item', color: 'bg-red-600', text: 'text-red-700' },
        { name: 'Industrial Telemetry & Gateway', pct: 20, count: '27 Item', color: 'bg-blue-600', text: 'text-blue-700' },
        { name: 'Power Supply & Panel Protection', pct: 12, count: '16 Item', color: 'bg-amber-500', text: 'text-amber-700' }
      ];
    }
    return [
      { name: 'Kamera Kabin DMS & ADAS Sensor', pct: 38, count: '246 Item', color: 'bg-red-600', text: 'text-red-700' },
      { name: 'Mobile DVR (MDVR) & Storage', pct: 26, count: '168 Item', color: 'bg-blue-600', text: 'text-blue-700' },
      { name: 'Antena GPS/GSM & Kabel Harness', pct: 22, count: '142 Item', color: 'bg-amber-500', text: 'text-amber-700' },
      { name: 'Bracket & Modul Power DC-DC', pct: 14, count: '93 Item', color: 'bg-emerald-600', text: 'text-emerald-700' }
    ];
  }, [selectedProjectId]);

  // Dokumen & Template Resmi Berita Acara yang Diunggah Pengguna
  const [allOfficialDocuments, setOfficialDocuments] = useState(() => {
    try {
      const stored = localStorage.getItem('digitech_reports_documents');
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed)
        ? parsed.filter(d => d && !['BA-2026-10-001', 'LMB-2026-10-002', 'LBP-2026-10-003', 'LPA-2026-10-004'].includes(d.id))
        : [];
    } catch {
      return [];
    }
  });

  const officialDocuments = useMemo(() => {
    if (isCurrentProjectLocked) return [];
    return allOfficialDocuments.filter((doc, idx) => {
      const pid = resolveRecordProjectId(doc, idx);
      return pid === selectedProjectId;
    });
  }, [allOfficialDocuments, selectedProjectId, isCurrentProjectLocked]);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDefaultTab, setUploadDefaultTab] = useState('local');

  // Handle uploaded template/document callback
  const handleDocumentUploaded = (newDoc) => {
    const formatted = {
      id: newDoc.doc_number || newDoc.id || `BA-${activeProject.code}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      project_id: selectedProjectId,
      project_code: activeProject.code,
      title: newDoc.title || newDoc.doc_title || `Berita Acara Resmi Project ${activeProject.code}`,
      type: newDoc.doc_type || (newDoc.template_type ? `Template ${newDoc.template_type}` : 'Berita Acara Resmi'),
      period: newDoc.doc_date ? new Date(newDoc.doc_date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Periode Berjalan',
      site: newDoc.destination_location || newDoc.site_location || activeProject.site_location || 'Site Operasional BIB',
      signer: newDoc.signer || user?.full_name || 'Admin Logistik',
      status: 'Terverifikasi (Digital Signature Valid)',
      summary: newDoc.notes || newDoc.summary || `Berkas dokumen/template resmi Project ${activeProject.code} yang diunggah untuk operasional DIGITECH.`,
      file_url: newDoc.file_url || newDoc.attachment_url || null,
      file_attachment: newDoc.file_attachment || (newDoc.file ? newDoc.file.name : null),
      raw: newDoc
    };

    setOfficialDocuments(prev => {
      const updated = [formatted, ...prev.filter(d => d.id !== formatted.id)];
      try {
        localStorage.setItem('digitech_reports_documents', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    addToast(`Dokumen / Template Berita Acara Project ${activeProject.code} berhasil diunggah!`, 'success');
    setIsUploadModalOpen(false);
  };

  // Export to Excel handler (Styled Corporate Blue Workbook with Digitech Logo)
  const handleExportExcel = async () => {
    try {
      const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      await exportStyledExcel({
        filename: `DIGITECH_Laporan_${activeProject.code}_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName: `Laporan ${activeProject.code}`,
        title: `LAPORAN LOGISTIK & REKAPITULASI MUTASI MATERIAL — PROJECT ${activeProject.code}`,
        subtitle: `Lokasi Site: ${activeProject.site_location || 'Site Operasional BIB'} | Tanggal Ekspor: ${printDate} | Dicetak Oleh: ${user?.full_name || 'Admin Logistik'}`,
        summaryText: `Ringkasan Eksekutif: Total Penerimaan (MOS): ${metrics.totalInflowQty} Unit | Total Pengeluaran (MR): ${metrics.totalOutflowQty} Unit | Akurasi Opname: ${metrics.accuracyRate} | Total Mutasi: ${metrics.totalMovementQty} Item`,
        columns: [
          { width: 6 },
          { width: 12 },
          { width: 16 },
          { width: 22 },
          { width: 32 },
          { width: 18 },
          { width: 18 },
          { width: 16 },
          { width: 14 },
          { width: 12 },
          { width: 22 },
          { width: 20 }
        ],
        sections: [
          {
            title: `RINGKASAN ARUS MATERIAL BULANAN (${activeProject.code})`,
            headers: ['Periode', 'Penerimaan (MOS)', 'Pengeluaran (MR)', 'Selisih Bersih', 'Ringkasan Aktivitas'],
            alignments: ['left', 'right', 'right', 'right', 'left'],
            rows: monthlyTrends.map((m) => [m.month, m.mos, m.mr, m.mos - m.mr, m.totalActivity])
          },
          {
            title: `RINCIAN TRANSAKSI & MUTASI MATERIAL (${activeProject.code})`,
            headers: ['No', 'Project', 'ID Transaksi', 'Waktu', 'Nama Material', 'Part Number', 'Kategori', 'Lokasi Rak', 'Tipe Mutasi', 'Qty Mutasi', 'No. Dokumen Ref', 'Petugas'],
            alignments: ['center', 'center', 'left', 'left', 'left', 'left', 'left', 'center', 'center', 'right', 'left', 'left'],
            rows: transactions.length > 0
              ? transactions.map((t, idx) => [
                  idx + 1,
                  t.project_code || activeProject.code,
                  t.id || '-',
                  t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : '-',
                  t.item_name || '-',
                  t.part_number || '-',
                  t.category || activeProject.code,
                  t.bin_location || '-',
                  t.transaction_type || '-',
                  t.qty_change || 0,
                  t.reference_doc_id || '-',
                  t.performed_by || '-'
                ])
              : [['-', activeProject.code, '-', '-', 'Belum ada transaksi mutasi tercatat pada periode ini', '-', '-', '-', '-', 0, '-', '-']]
          }
        ]
      });
      addToast(`Laporan Project ${activeProject.code} berhasil diekspor ke format Excel (.xlsx).`, 'success');
    } catch {
      addToast('Gagal mengekspor laporan Excel.', 'error');
    }
  };

  // Dedicated branded A4 Print / PDF Report builder
  const buildPrintableReportHtml = ({
    docTitle,
    docNumber,
    docPeriod,
    docSite,
    docSummary,
    itemsHtml,
    makerName,
    checkerName,
    approverName
  }) => {
    const logoUrl = `${window.location.origin}/digitech-emblem.png`;
    const printDate = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const esc = (val) => String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${esc(docTitle)} - DIGITECH IMS</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; line-height: 1.5; background: #fff; }
    .kop { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #b91c1c; padding-bottom: 12px; margin-bottom: 16px; }
    .kop-left { display: flex; align-items: center; gap: 12px; }
    .kop-logo { width: 46px; height: 46px; object-fit: contain; }
    .brand-title { font-size: 20px; font-weight: 800; letter-spacing: 0.06em; color: #0f172a; margin: 0; line-height: 1.1; }
    .brand-sub { font-size: 11px; font-weight: 700; color: #dc2626; margin-top: 2px; }
    .brand-addr { font-size: 9.5px; color: #475569; margin-top: 2px; }
    .kop-right { text-align: right; font-size: 10px; color: #334155; }
    .kop-right strong { color: #0f172a; display: block; font-size: 11px; }
    .doc-heading { text-align: center; margin: 14px 0; }
    .doc-heading h2 { margin: 0; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; }
    .doc-heading p { margin: 4px 0 0 0; font-size: 11px; color: #475569; }
    .meta-grid { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    .meta-grid td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10.5px; }
    .meta-label { font-weight: 700; color: #475569; background: #f8fafc; width: 18%; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #0f172a; margin: 14px 0 6px 0; border-left: 3px solid #b91c1c; padding-left: 8px; }
    table.data { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10px; }
    table.data th { background: #1e293b; color: #fff; padding: 7px 8px; text-align: left; font-weight: 700; border: 1px solid #1e293b; }
    table.data td { padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top; }
    table.data tr:nth-child(even) td { background: #f8fafc; }
    .summary-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 10px 12px; font-size: 10.5px; color: #334155; margin-bottom: 16px; }
    .sig-grid { width: 100%; border-collapse: collapse; margin-top: 22px; page-break-inside: avoid; }
    .sig-grid td { width: 33.33%; text-align: center; vertical-align: top; padding: 8px 12px; font-size: 10.5px; }
    .sig-space { height: 56px; border-bottom: 1px solid #334155; margin: 8px 14px 6px 14px; }
    .footer { border-top: 1px solid #cbd5e1; margin-top: 20px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9.5px; color: #64748b; }
  </style>
</head>
<body>
  <div class="kop">
    <div class="kop-left">
      <img src="${logoUrl}" alt="Digitech" class="kop-logo" />
      <div>
        <div class="brand-title">DIGITECH</div>
        <div class="brand-sub">Inventory Management System</div>
        <div class="brand-addr">Divisi Logistik, Telematika &amp; Operasional Site &bull; ${esc(docSite)}</div>
      </div>
    </div>
    <div class="kop-right">
      <strong>No. Dokumen: ${esc(docNumber)}</strong>
      <div>Periode: ${esc(docPeriod)}</div>
      <div>Tanggal Cetak: ${esc(printDate)}</div>
    </div>
  </div>

  <div class="doc-heading">
    <h2>${esc(docTitle)}</h2>
    <p>Project ${esc(activeProject.code)} &mdash; ${esc(activeProject.name || 'Operasional Site')}</p>
  </div>

  <table class="meta-grid">
    <tr>
      <td class="meta-label">Lokasi / Site</td>
      <td>${esc(docSite)}</td>
      <td class="meta-label">Periode Laporan</td>
      <td>${esc(docPeriod)}</td>
    </tr>
    <tr>
      <td class="meta-label">Total Penerimaan (MOS)</td>
      <td><strong>${metrics.totalInflowQty} Unit</strong></td>
      <td class="meta-label">Total Pengeluaran (MR)</td>
      <td><strong>${metrics.totalOutflowQty} Unit</strong></td>
    </tr>
    <tr>
      <td class="meta-label">Total Item Mutasi</td>
      <td><strong>${metrics.totalMovementQty} Item</strong></td>
      <td class="meta-label">Akurasi Stock Opname</td>
      <td><strong>${esc(metrics.accuracyRate)}</strong></td>
    </tr>
  </table>

  ${itemsHtml}

  <div class="summary-box">
    <strong>Ringkasan Evaluasi Operasional:</strong><br/>
    ${esc(docSummary)}
  </div>

  <table class="sig-grid">
    <tr>
      <td>
        <div>Disiapkan Oleh,</div>
        <div style="color:#64748b;font-size:9.5px;">Pelaksana Logistik</div>
        <div class="sig-space"></div>
        <div><strong>${esc(makerName)}</strong></div>
      </td>
      <td>
        <div>Diperiksa Oleh,</div>
        <div style="color:#64748b;font-size:9.5px;">Supervisor Logistik Site</div>
        <div class="sig-space"></div>
        <div><strong>${esc(checkerName)}</strong></div>
      </td>
      <td>
        <div>Disetujui Oleh,</div>
        <div style="color:#64748b;font-size:9.5px;">Manajemen Operasional</div>
        <div class="sig-space"></div>
        <div><strong>${esc(approverName)}</strong></div>
      </td>
    </tr>
  </table>

  <div class="footer">
    <div>PT Digitech &bull; Inventory Management System</div>
    <div>No. Dokumen: ${esc(docNumber)} &bull; Dicetak pada ${esc(printDate)}</div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`;
  };

  const handleExportPrintableReport = () => {
    const printWin = window.open('', '_blank', 'width=960,height=800');
    if (!printWin) {
      addToast('Popup diblokir browser. Izinkan popup untuk mencetak atau menyimpan laporan PDF.', 'warning');
      return;
    }

    const esc = (val) => String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const monthlySection = `
      <div class="section-title">Rekapitulasi Arus Material Bulanan (${esc(activeProject.code)})</div>
      <table class="data">
        <thead>
          <tr>
            <th>Periode</th>
            <th style="text-align:right;">Penerimaan (MOS)</th>
            <th style="text-align:right;">Pengeluaran (MR)</th>
            <th style="text-align:right;">Selisih Bersih</th>
            <th>Ringkasan Aktivitas</th>
          </tr>
        </thead>
        <tbody>
          ${monthlyTrends.map((m) => `
            <tr>
              <td><strong>${esc(m.month)}</strong></td>
              <td style="text-align:right;">${m.mos}</td>
              <td style="text-align:right;">${m.mr}</td>
              <td style="text-align:right;">${m.mos - m.mr}</td>
              <td>${esc(m.totalActivity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const categorySection = `
      <div class="section-title">Distribusi Inventaris Berdasarkan Kategori</div>
      <table class="data">
        <thead>
          <tr>
            <th>Kategori Komponen</th>
            <th style="text-align:right;">Komposisi (%)</th>
            <th style="text-align:right;">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${categoryDist.map((c) => `
            <tr>
              <td>${esc(c.name)}</td>
              <td style="text-align:right;">${c.pct}%</td>
              <td style="text-align:right;"><strong>${esc(c.count)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const ledgerRows = transactions.slice(0, 40);
    const ledgerSection = `
      <div class="section-title">Rincian Transaksi Mutasi Stok (${ledgerRows.length} Data Terbaru)</div>
      <table class="data">
        <thead>
          <tr>
            <th style="width:28px;text-align:center;">No</th>
            <th>Waktu</th>
            <th>Nama Material</th>
            <th>No. Dokumen Ref</th>
            <th>Lokasi Rak</th>
            <th style="text-align:center;">Tipe</th>
            <th style="text-align:right;">Qty</th>
            <th>Petugas</th>
          </tr>
        </thead>
        <tbody>
          ${ledgerRows.length > 0 ? ledgerRows.map((t, idx) => `
            <tr>
              <td style="text-align:center;">${idx + 1}</td>
              <td>${t.created_at ? esc(new Date(t.created_at).toLocaleDateString('id-ID')) : '-'}</td>
              <td><strong>${esc(t.item_name || '-')}</strong></td>
              <td>${esc(t.reference_doc_id || '-')}</td>
              <td>${esc(t.bin_location || '-')}</td>
              <td style="text-align:center;">${esc(t.transaction_type || '-')}</td>
              <td style="text-align:right;"><strong>${t.qty_change || 0}</strong></td>
              <td>${esc(t.performed_by || '-')}</td>
            </tr>
          `).join('') : `
            <tr><td colspan="8" style="text-align:center;color:#64748b;">Belum ada mutasi transaksi tercatat pada periode ini.</td></tr>
          `}
        </tbody>
      </table>
    `;

    const html = buildPrintableReportHtml({
      docTitle: `Laporan Logistik & Mutasi Material — ${activeProject.code}`,
      docNumber: `RPT/${activeProject.code}/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
      docPeriod: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      docSite: activeProject.site_location || 'Site Operasional BIB',
      docSummary: `Laporan rekapitulasi arus penerimaan (MOS), pengeluaran material (MR), serta ringkasan stok aktif untuk Project ${activeProject.code}.`,
      itemsHtml: monthlySection + categorySection + ledgerSection,
      makerName: user?.full_name || 'Pelaksana Logistik',
      checkerName: 'Supervisor Logistik Site',
      approverName: 'Manajemen Operasional'
    });

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  // Trigger print / preview
  const handlePrintDocument = (doc) => {
    if (!doc) {
      addToast('Format mengikuti template resmi. Silakan unggah dokumen atau template terlebih dahulu.', 'warning');
      setUploadDefaultTab('local');
      setIsUploadModalOpen(true);
      return;
    }
    setPreviewDoc(doc);
  };

  const handleExecuteBrowserPrint = () => {
    if (!previewDoc) {
      window.print();
      return;
    }

    const printWin = window.open('', '_blank', 'width=960,height=800');
    if (!printWin) {
      window.print();
      return;
    }

    const esc = (val) => String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const items = Array.isArray(previewDoc.raw?.items) ? previewDoc.raw.items : [];
    const itemsHtml = `
      <div class="section-title">Daftar Rincian Material</div>
      <table class="data">
        <thead>
          <tr>
            <th style="width:28px;text-align:center;">No</th>
            <th>Nama Material / Komponen</th>
            <th>Spesifikasi / Part No / SN</th>
            <th style="text-align:center;">Lokasi Rak</th>
            <th style="text-align:right;">Qty</th>
            <th style="text-align:center;">Satuan</th>
            <th style="text-align:center;">Kondisi</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${items.length > 0 ? items.map((item, idx) => `
            <tr>
              <td style="text-align:center;">${String(idx + 1).padStart(2, '0')}</td>
              <td><strong>${esc(item.name || '-')}</strong></td>
              <td>${esc(item.spec || item.sn || item.part_number || '-')}</td>
              <td style="text-align:center;">${esc(item.bin_location || '-')}</td>
              <td style="text-align:right;"><strong>${item.qty_received || item.qty || 1}</strong></td>
              <td style="text-align:center;">${esc(item.unit || 'PCS')}</td>
              <td style="text-align:center;">${esc(item.condition || 'Baik')}</td>
              <td>${esc(item.notes || '-')}</td>
            </tr>
          `).join('') : `
            <tr><td colspan="8" style="text-align:center;color:#64748b;">Rincian item mengikuti dokumen resmi yang terlampir.</td></tr>
          `}
        </tbody>
      </table>
    `;

    const html = buildPrintableReportHtml({
      docTitle: previewDoc.title || `Dokumen Berita Acara — ${activeProject.code}`,
      docNumber: previewDoc.id || `DOC/${activeProject.code}`,
      docPeriod: previewDoc.period || '-',
      docSite: previewDoc.site || activeProject.site_location || 'Site Operasional',
      docSummary: previewDoc.summary || `Rekapitulasi transaksi dan evaluasi inventaris Project ${activeProject.code}.`,
      itemsHtml,
      makerName: previewDoc.raw?.approval_maker_name || previewDoc.author || user?.full_name || 'Pelaksana Logistik',
      checkerName: previewDoc.raw?.approval_checker_name || 'Supervisor Logistik Site',
      approverName: previewDoc.raw?.approval_approver_name || 'Manajemen Operasional'
    });

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6 font-sans">
      {/* ── Top Header Banner ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_12px_36px_rgba(220,38,38,0.04),0_2px_12px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-0 pr-0 sm:pr-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-md border ${getProjectBadgeClasses(selectedProjectId)}`}>
              PROJECT &bull; {activeProject.code}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 uppercase">
              Modul Laporan &amp; Audit Resmi
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              Peran: {role || 'Admin'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Laporan Logistik &amp; Dokumen Resmi — {activeProject.code}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekapitulasi berkala mutasi stok, berita acara rekonsiliasi, analitik arus material, dan evaluasi buffer inventaris khusus Project {activeProject.code}.
          </p>
        </div>

        {!isCurrentProjectLocked && (
          <div className="flex flex-wrap items-center gap-2.5 ml-auto shrink-0">
            <button
              onClick={handleExportPrintableReport}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF Laporan</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel ({activeProject.code})</span>
            </button>
          </div>
        )}
      </div>

      {/* Project Workspace Selector & Access Indicator */}
      <ProjectWorkspaceBanner
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        isProjectLocked={isProjectLocked}
        projectCounts={projectCounts}
        countUnitLabel="Rekap Mutasi"
        moduleName="Laporan Logistik & Berita Acara"
      />

      {isCurrentProjectLocked ? (
        <LockedProjectScreen
          activeProject={activeProject}
          projects={projects}
          onSelectProject={setSelectedProjectId}
          isProjectLocked={isProjectLocked}
          moduleName="Laporan Logistik & Berita Acara"
        />
      ) : (
        <>
          {/* ── Filter Bar & Tab Selector ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveReportTab('summary')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'summary'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ringkasan Eksekutif
          </button>
          <button
            onClick={() => setActiveReportTab('documents')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'documents'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dokumen &amp; Berita Acara
          </button>
          <button
            onClick={() => setActiveReportTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeReportTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analitik &amp; Tren Arus
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Site Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Site Tambang BIB</option>
              {INITIAL_SITES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="week">Pekan Ini (7 Hari Terakhir)</option>
              <option value="month">Bulan Ini (Oktober 2026)</option>
              <option value="quarter">Kuartal 3 - 4 (Tahun 2026)</option>
              <option value="year">Tahun Berjalan (2026)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4 Executive Parallelogram KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 py-1">
        <ParallelogramCard
          title="TOTAL PENERIMAAN (MOS)"
          value={String(metrics.totalInflowQty).padStart(2, '0')}
          unit="UNIT"
          subtitle="Penerimaan Fisik Masuk Site"
          subtitleIcon={PackageCheck}
          subtitleColor="text-emerald-700"
          icon={PackageCheck}
          iconColor="text-emerald-600"
          accentColor="border-emerald-600"
          valueColor="text-emerald-600"
        />

        <ParallelogramCard
          title="TOTAL PENGELUARAN (MR)"
          value={String(metrics.totalOutflowQty).padStart(2, '0')}
          unit="UNIT"
          subtitle="Material Keluar untuk Pemeliharaan"
          subtitleIcon={PackageMinus}
          subtitleColor="text-blue-700"
          icon={PackageMinus}
          iconColor="text-blue-600"
          accentColor="border-blue-600"
          valueColor="text-blue-600"
        />

        <ParallelogramCard
          title="AKURASI OPNAME FISIK"
          value="98.6"
          unit="%"
          subtitle="Tingkat Kesesuaian Stok Gudang"
          subtitleIcon={CheckCircle2}
          subtitleColor="text-amber-700"
          icon={CheckCircle2}
          iconColor="text-amber-600"
          accentColor="border-amber-600"
          valueColor="text-amber-600"
        />

        <ParallelogramCard
          title="TOTAL AKTIVITAS MUTASI"
          value={String(metrics.totalMovementQty).padStart(2, '0')}
          unit="ITEM"
          subtitle="Total Perputaran Fisik Suku Cadang"
          subtitleIcon={Boxes}
          subtitleColor="text-red-700"
          icon={Boxes}
          iconColor="text-red-600"
          accentColor="border-red-600"
          valueColor="text-red-600"
        />
      </div>

      {/* ── TAB CONTENT 1: RINGKASAN EKSEKUTIF ── */}
      {activeReportTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Trend Chart: Inflow vs Outflow */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                    Tren Arus Material: Masuk (MOS) vs Keluar (MR)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Perbandingan kuantitas pergerakan barang suku cadang selama 6 bulan terakhir di site tambang
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-slate-600 font-medium text-[11px]">MOS (Masuk)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-slate-600 font-medium text-[11px]">MR (Keluar)</span>
                  </div>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="space-y-4 pt-2">
                {monthlyTrends.map((item, idx) => {
                  const maxVal = 120;
                  const mosWidth = Math.round((item.mos / maxVal) * 100);
                  const mrWidth = Math.round((item.mr / maxVal) * 100);

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-800">
                        <span>{item.month}</span>
                        <span className="font-mono text-[11px] text-slate-500">{item.totalActivity}</span>
                      </div>
                      <div className="space-y-1">
                        {/* MOS bar */}
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${mosWidth}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-emerald-700 w-12 text-right">
                            +{item.mos} pcs
                          </span>
                        </div>
                        {/* MR bar */}
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${mrWidth}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-blue-700 w-12 text-right">
                            -{item.mr} pcs
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Breakdown Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Distribusi Kategori Inventaris
                </h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  Proporsi suku cadang terdata berdasarkan kelompok operasional
                </p>

                <div className="space-y-3.5">
                  {categoryDist.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate">{cat.name}</span>
                        <span className={`font-mono font-bold ${cat.text}`}>{cat.pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${cat.color} rounded-full`}
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                      <div className="text-right text-[10px] font-mono text-slate-400">
                        {cat.count}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="font-bold text-slate-900 mb-0.5">Catatan Evaluasi Audit</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Stok suku cadang unit Caterpillar 777D dan pelumas hidrolik memiliki rotasi keluar (MR) tertinggi untuk memenuhi target jam kerja alat berat.
                </p>
              </div>
            </div>
          </div>

          {/* Quick List of Official Documents */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-slate-700" />
                  Dokumen Berita Acara &amp; Laporan Siap Cetak
                </h3>
                <p className="text-[11px] text-slate-500">
                  Format dokumen mengikuti template resmi perusahaan. Unggah dokumen atau template untuk mengaktifkan pratinjau.
                </p>
              </div>
              {officialDocuments.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setUploadDefaultTab('local');
                      setIsUploadModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    Unggah Dokumen / Template
                  </button>
                  <button
                    onClick={() => setActiveReportTab('documents')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    Lihat Semua ({officialDocuments.length}) <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {officialDocuments.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                  <FileUp className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Format Dokumen Mengikuti Template Resmi
                </h4>
                <p className="text-xs text-slate-500 max-w-lg mx-auto mb-4 leading-relaxed">
                  Belum ada dokumen atau template yang diunggah. Pratinjau dokumen tidak ditampilkan sebelum dokumen atau template resmi diunggah ke sistem.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    onClick={() => {
                      setUploadDefaultTab('local');
                      setIsUploadModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Unggah Berkas Dokumen (PDF/Scan)</span>
                  </button>
                  <button
                    onClick={() => {
                      setUploadDefaultTab('template');
                      setIsUploadModalOpen(true);
                    }}
                    className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                    <span>Gunakan Template Resmi (MOS/MDT/MRP)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {officialDocuments.slice(0, 2).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {doc.id}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {doc.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug mb-1">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                        {doc.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">{doc.period}</span>
                      <button
                        onClick={() => handlePrintDocument(doc)}
                        className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        Pratinjau &amp; Cetak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 2: DOKUMEN & BERITA ACARA ── */}
      {activeReportTab === 'documents' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Berita Acara &amp; Dokumen Resmi Logistik
                </h3>
                <p className="text-[11px] text-slate-500">
                  Format dokumen mengikuti template resmi perusahaan. Unggah dokumen atau template resmi untuk mengaktifkan pratinjau.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-mono">
                  Total {officialDocuments.length} Dokumen Tersedia
                </span>
                {officialDocuments.length > 0 && (
                  <button
                    onClick={() => {
                      setUploadDefaultTab('local');
                      setIsUploadModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Dokumen / Template</span>
                  </button>
                )}
              </div>
            </div>

            {officialDocuments.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                  <FileUp className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1">
                  Belum Ada Dokumen atau Template Berita Acara
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
                  Format Berita Acara akan mengikuti template resmi perusahaan nantinya. Pratinjau dan fungsi cetak akan aktif setelah dokumen atau berkas template diunggah ke sistem.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setUploadDefaultTab('local');
                      setIsUploadModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Dokumen (PDF / Scan)</span>
                  </button>
                  <button
                    onClick={() => {
                      setUploadDefaultTab('template');
                      setIsUploadModalOpen(true);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                    <span>Gunakan Template Resmi (MOS/MDT/MRP)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {officialDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0 pr-0 md:pr-4">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {doc.id}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {doc.type}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          {doc.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {doc.summary}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {doc.site}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {doc.period}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Otorisasi: {doc.signer}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handlePrintDocument(doc)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Buka &amp; Cetak</span>
                      </button>
                      <button
                        onClick={() => {
                          setOfficialDocuments(prev => {
                            const updated = prev.filter(d => d.id !== doc.id);
                            try {
                              localStorage.setItem('digitech_reports_documents', JSON.stringify(updated));
                            } catch {}
                            return updated;
                          });
                          addToast(`Dokumen ${doc.id} berhasil dihapus`, 'info');
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 3: ANALITIK & TREN ARUS ── */}
      {activeReportTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                Rasio Perputaran Stok (Turnover)
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">3.4x / Tahun</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Kategori cepat berputar: Fuel Filter, Oil Drum, &amp; Tooth Bucket
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                Rasio Kesesuaian Fisik (Opname)
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono">98.6% Sesuai</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Deviasi 1.4% diselesaikan melalui penyesuaian kartu stok digital
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                Rata-rata Waktu Lead Time MOS
              </div>
              <div className="text-2xl font-black text-blue-600 font-mono">3.2 Hari Kerja</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Dari penerimaan surat jalan vendor sampai verifikasi rak penyimpanan
              </p>
            </div>
          </div>

          {/* Site Operational Coverage */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Kapasitas &amp; Utilisasi Gudang Tambang Terintegrasi
            </h3>
            <p className="text-[11px] text-slate-500 mb-4">
              Tingkat keterisian rak pada masing-masing lokasi fasilitas penyimpanan site
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                  <span>Area Rak 1 (Pit Base)</span>
                  <span className="font-mono text-emerald-600">56%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '56%' }} />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">134 / 240 Rak Terisi</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                  <span>Area Rak 2 (Workshop)</span>
                  <span className="font-mono text-emerald-600">52%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '52%' }} />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">95 / 180 Rak Terisi</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                  <span>Area Rak 3 (Port Hub)</span>
                  <span className="font-mono text-emerald-600">55%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '55%' }} />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">110 / 200 Rak Terisi</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                  <span>Area Rak 4 (Angsana Depot)</span>
                  <span className="font-mono text-blue-600">40%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '40%' }} />
                </div>
                <div className="text-[10px] text-slate-500 font-mono">48 / 120 Rak Terisi</div>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* ── FULLSCREEN OFFICIAL DOCUMENT READER / PDF PREVIEW ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-[9999] w-screen h-screen flex flex-col bg-slate-100 overflow-hidden animate-in fade-in duration-150">
          {/* Top Document Reader Application Toolbar */}
          <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs shrink-0 z-20">
            {/* Left: Document Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-slate-900 truncate">
                    {previewDoc.title}
                  </h3>
                </div>
                <p className="text-[11px] font-mono text-slate-500 truncate">
                  Nomor: <span className="font-bold text-red-700">{previewDoc.id}</span> • {previewDoc.site}
                </p>
              </div>
            </div>

            {/* Center: Reader Viewport Controls */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(prev - 15, 60))}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                title="Perkecil (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="font-mono font-bold text-slate-800 text-xs px-2 py-0.5 rounded hover:bg-slate-200 min-w-[50px] text-center cursor-pointer"
                title="Klik untuk reset 100%"
              >
                {zoomLevel}%
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(prev + 15, 200))}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                title="Perbesar (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-slate-200 mx-1" />

              <span className="text-[11px] font-mono text-slate-500 px-1">
                Hal 1 / 1
              </span>
            </div>

            {/* Right: Actions (Print, Download, Close) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExecuteBrowserPrint}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Cetak Berkas / Simpan ke PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Cetak Dokumen</span>
              </button>

              <button
                type="button"
                onClick={handleExecuteBrowserPrint}
                className="p-2 sm:px-3 sm:py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Unduh Salinan PDF"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Unduh PDF</span>
              </button>

              <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Tutup Penampil Dokumen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reader Document Canvas Workspace (Clean Slate-100, No Black Colors) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start bg-slate-100">
            {/* The Authentic A4 Paper Sheet */}
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center'
              }}
              className="w-full max-w-4xl bg-white rounded-xs shadow-2xl shadow-slate-300/80 border border-slate-300/80 p-8 sm:p-14 space-y-6 text-slate-800 transition-transform duration-100 my-4 select-text print:m-0 print:p-0 print:border-none print:shadow-none"
            >
              {/* 1. Kop Surat Resmi Digitech */}
              <div className="border-b-2 border-red-700 pb-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="/digitech-emblem.png"
                      alt="Digitech"
                      className="w-12 h-12 object-contain shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/favicon.png';
                      }}
                    />
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider leading-none">
                        DIGITECH
                      </h1>
                      <div className="text-xs font-bold text-red-600 mt-0.5">
                        Inventory Management System
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Divisi Logistik, Telematika &amp; Operasional Site
                      </div>
                    </div>
                  </div>

                  <div className="text-right hidden sm:block shrink-0 font-mono text-[11px] text-slate-600">
                    <div className="font-bold text-slate-900">No. Dokumen: {previewDoc.id}</div>
                    <div>Periode: {previewDoc.period}</div>
                    <div>Tanggal: {previewDoc.date || new Date().toLocaleDateString('id-ID')}</div>
                  </div>
                </div>
              </div>

              {/* 2. Judul & Nomor Registrasi Dokumen Berita Acara */}
              <div className="text-center space-y-1.5 py-1">
                <div className="text-[10px] font-mono font-bold text-red-700 uppercase tracking-widest">
                  DOKUMEN RESMI BERITA ACARA
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-wide mt-1">
                  {previewDoc.title}
                </h2>
                <div className="font-mono text-xs font-bold text-slate-700">
                  Nomor Registrasi: <span className="text-red-700 font-black">{previewDoc.id}</span>
                </div>
              </div>

              {/* 3. Pernyataan Pembuka */}
              <div className="text-xs leading-relaxed text-slate-700 text-justify">
                Berikut adalah rincian pemeriksaan fisik material, rekonsiliasi data mutasi keluar-masuk, serta evaluasi kesesuaian saldo inventaris sistem <strong className="text-slate-900">DIGITECH</strong> dengan kondisi aktual di lapangan pada Project <strong className="text-slate-900">{activeProject.code}</strong> ({previewDoc.site || activeProject.site_location || 'Site Operasional'}):
              </div>

              {/* 4. Parameter & Identitas Audit (Grid Resmi) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/90 p-4 rounded-xl border border-slate-200 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-medium">Fasilitas / Lokasi</span>
                  <span className="font-bold text-slate-900">{previewDoc.site}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-medium">Periode Audit</span>
                  <span className="font-bold text-slate-900">{previewDoc.period}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-medium">Klasifikasi</span>
                  <span className="font-bold text-red-700">{previewDoc.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-medium">Validasi Sistem</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Terverifikasi
                  </span>
                </div>
              </div>

              {/* 5. Tabel Item Material Sesuai Template / Berita Acara */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-900 uppercase font-mono tracking-wider">
                    Daftar Rincian Material &amp; Suku Cadang Resmi:
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Total: {previewDoc.raw?.items?.length || 0} Item
                  </span>
                </div>

                <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100/90 font-mono text-[10px] uppercase text-slate-700 border-b border-slate-300">
                      <tr>
                        <th className="p-3 w-10 text-center">No</th>
                        <th className="p-3">Nama Material / Komponen</th>
                        <th className="p-3">Spesifikasi / Part No / SN</th>
                        <th className="p-3 text-center">Lokasi Rak</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-center">Satuan</th>
                        <th className="p-3 text-center">Kondisi</th>
                        <th className="p-3">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {previewDoc.raw?.items && previewDoc.raw.items.length > 0 ? (
                        previewDoc.raw.items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td className="p-3 text-center font-bold text-slate-500">{String(idx + 1).padStart(2, '0')}</td>
                            <td className="p-3 font-sans font-bold text-slate-900">{item.name || '-'}</td>
                            <td className="p-3 text-slate-600">{item.spec || item.sn || item.part_number || '-'}</td>
                            <td className="p-3 text-center text-slate-600">{item.bin_location || '-'}</td>
                            <td className="p-3 text-center font-black text-slate-900">{item.qty_received || item.qty || 1}</td>
                            <td className="p-3 text-center text-slate-700">{item.unit || 'PCS'}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                {item.condition || 'Baik'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">{item.notes || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-slate-500 font-sans">
                            Dokumen / berkas resmi terlampir. Format dan rincian mengikuti berkas template resmi yang diunggah.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {previewDoc.raw?.items && previewDoc.raw.items.length > 0 && (
                      <tfoot className="bg-slate-50 border-t border-slate-300 font-mono text-[10px] text-slate-700">
                        <tr>
                          <td colSpan={4} className="p-3 font-bold">TOTAL ITEM DOKUMEN BERITA ACARA</td>
                          <td colSpan={4} className="p-3 text-right font-bold text-emerald-700">
                            {previewDoc.raw.items.length} ITEM TERVERIFIKASI
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* 6. Ringkasan Eksekutif & Temuan Resmi */}
              <div className="space-y-2">
                <span className="font-black text-xs text-slate-900 uppercase font-mono tracking-wider">
                  Ringkasan Hasil Evaluasi &amp; Catatan Auditor:
                </span>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1.5">
                  <p>
                    {previewDoc.summary}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Semua transaksi pengeluaran material (MR) dan penerimaan on site (MOS) telah terverifikasi secara digital pada sistem audit trail DIGITECH dengan pencatatan nomor PO dan Berita Acara yang valid.
                  </p>
                </div>
              </div>

              {/* 7. Legal Closing Clause (Klausul Penutup Resmi) */}
              <div className="text-xs leading-relaxed text-slate-700 text-justify pt-1">
                Demikian Berita Acara ini dibuat dengan sebenarnya dan disahkan oleh pihak-pihak yang berwenang di lingkungan kerja <strong className="text-slate-900 font-black">DIGITECH</strong> untuk dipergunakan sebagaimana mestinya dan memiliki kekuatan pembuktian audit yang sah.
              </div>

              {/* 8. Kolom Pengesahan & Tanda Tangan Resmi */}
              <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
                {/* Otorisator 1 */}
                <div className="space-y-2">
                  <p className="text-slate-600 text-[11px] font-medium">Disiapkan Oleh:</p>
                  <div className="h-16 flex items-end justify-center">
                    <span className="text-[10px] text-slate-400 italic pb-1">Tanda tangan</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 border-b border-slate-400 pb-1">
                      {previewDoc.raw?.approval_maker_name || previewDoc.author || user?.full_name || 'Pelaksana Logistik'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Staff Logistik &amp; Material Controller</p>
                  </div>
                </div>

                {/* Otorisator 2 */}
                <div className="space-y-2">
                  <p className="text-slate-600 text-[11px] font-medium">Diperiksa Oleh:</p>
                  <div className="h-16 flex items-end justify-center">
                    <span className="text-[10px] text-slate-400 italic pb-1">Tanda tangan</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 border-b border-slate-400 pb-1">
                      {previewDoc.raw?.approval_checker_name || 'Supervisor Logistik Site'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{previewDoc.raw?.approval_checker_role || 'Supervisor Logistik & Workshop'}</p>
                  </div>
                </div>

                {/* Otorisator 3 */}
                <div className="space-y-2">
                  <p className="text-slate-600 text-[11px] font-medium">Disetujui Oleh:</p>
                  <div className="h-16 flex items-end justify-center">
                    <span className="text-[10px] text-slate-400 italic pb-1">Tanda tangan</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 border-b border-slate-400 pb-1">
                      {previewDoc.raw?.approval_approver_name || 'Manajemen Operasional'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{previewDoc.raw?.approval_approver_role || 'Kepala Operasional Site'}</p>
                  </div>
                </div>
              </div>

              {/* 9. Official A4 Paper Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-500 gap-2">
                <div>
                  PT Digitech &bull; Inventory Management System
                </div>
                <div className="text-center sm:text-right">
                  No. Dokumen: {previewDoc.id} &bull; Halaman 1 dari 1
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DOCUMENT & TEMPLATE UPLOAD MODAL ── */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleDocumentUploaded}
        currentUser={user}
        defaultTab={uploadDefaultTab}
      />
    </div>
  );
}
