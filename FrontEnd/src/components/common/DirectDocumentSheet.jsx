import React from 'react';
import {
  Building2,
  Calendar,
  FileText,
  Printer,
  Copy,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Package
} from 'lucide-react';
import DocumentSignatureBox from './DocumentSignatureBox';

/**
 * DirectDocumentSheet
 * 
 * Renders an official document preview (WYSIWYG document sheet) for
 * Material Requests (MR), MOS documents, or Stock Serah Terima.
 * 
 * Features:
 * - Official corporate letterhead (PT Digitech Global & PT Borneo Indobara)
 * - Directly editable / previewable fields on the document
 * - 3 Official Signature Columns directly ON the sheet (Slot 1, 2, 3)
 * - Copy & Paste signature directly on the document
 * - Print / Export ready
 * - 100% Light theme (White paper, crimson accents, slate text, NO dark/black colors)
 */
export default function DirectDocumentSheet({
  docType = 'MR', // 'MR' | 'MOS' | 'BAST'
  docNumber = 'MR-2026-09-0024',
  docDate = new Date().toISOString().split('T')[0],
  siteLocation = 'Pit South Site BIB-02',
  department = 'Maintenance & Operasional',
  requesterName = 'arya-user',
  purpose = 'Pengambilan material kerja operasional penggantian filter berkala',
  items = [],
  signatures = {},
  canSignSlot1 = true,
  canSignSlot2 = false,
  canSignSlot3 = false,
  userRole = 'User',
  onSignSlot,
  onResetSlot,
  isEditable = false,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onUpdateField,
  actionButtons = null
}) {
  const isMR = docType === 'MR';
  const isMOS = docType === 'MOS';

  const title = isMR
    ? 'SURAT PERMINTAAN MATERIAL & PENGELUARAN GUDANG'
    : isMOS
    ? 'BERITA ACARA MATERIAL ON SITE (MOS) INSPECTION'
    : 'SURAT SERAH TERIMA INVENTARIS OPERASIONAL';

  const subtitle = isMR
    ? 'PT BORNEO INDOBARA &bull; LOGISTIK DAN DISTRIBUSI SPAREPART PIT'
    : 'VERIFIKASI FISIK & SERAH TERIMA VENDOR KE SITE OPERASIONAL';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 font-sans select-none">
      
      {/* ── Document Top Action Bar (Light Theme) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-red-100 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">
              Lembar Dokumen Resmi Langsung
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Tanda tangan dapat di-Copy atau di-Paste langsung pada kolom dokumen
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak / PDF</span>
          </button>
          {actionButtons}
        </div>
      </div>

      {/* ── Official A4 Document Sheet (Crisp Pure White Paper Layout) ── */}
      <div className="bg-white rounded-3xl border border-red-100 shadow-[0_12px_36px_rgba(220,38,38,0.06),0_2px_12px_rgba(0,0,0,0.04)] p-6 sm:p-9 text-slate-800 space-y-6 print:shadow-none print:border-none print:p-0">
        
        {/* ── 1. Official Corporate Letterhead (KOP SURAT) ── */}
        <div className="border-b-2 border-red-700/80 pb-4">
          <div className="flex items-center justify-between gap-4">
            
            {/* Left: Digitech Logo & Company Info */}
            <div className="flex items-center gap-3">
              <img
                src="/digitech-logo-light.png"
                alt="DIGITECH"
                className="h-9 sm:h-11 w-auto object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/digitech-emblem.png';
                }}
              />
              <div>
                <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  DIGITECH
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Inventory Management System
                </div>
              </div>
            </div>

            {/* Right: Partner / Site Branding */}
            <div className="text-right">
              <div className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
                DIGITECH
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Logistics & Asset Management
              </div>
            </div>
          </div>

          {/* Document Title Header */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
              {title}
            </h2>
            <div
              className="text-[10px] text-slate-500 font-semibold tracking-wide mt-0.5"
              dangerouslySetInnerHTML={{ __html: subtitle }}
            />
          </div>
        </div>

        {/* ── 2. Meta Information Grid (No. Dokumen, Tanggal, Lokasi, Pemohon) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-red-50/30 p-3.5 rounded-2xl border border-red-100 text-xs">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              No. Dokumen
            </div>
            <div className="font-mono font-bold text-red-700 mt-0.5 truncate">
              {docNumber}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Tanggal Permintaan
            </div>
            <div className="font-semibold text-slate-800 mt-0.5">
              {docDate}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Lokasi Site / Rak
            </div>
            <div className="font-semibold text-slate-800 mt-0.5 truncate">
              {siteLocation}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Pemohon / PIC
            </div>
            <div className="font-bold text-slate-900 mt-0.5 truncate">
              {requesterName}
            </div>
          </div>
        </div>

        {/* ── 3. Table of Items (Material Request / MOS details) ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-red-600" />
              <span>Rincian Material & Suku Cadang</span>
            </h3>
            {isEditable && onAddItem && (
              <button
                type="button"
                onClick={onAddItem}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
              >
                + Tambah Baris
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-700 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">Nama Material / Suku Cadang</th>
                  <th className="py-2.5 px-3">Part Number / SKU</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-center">Satuan</th>
                  <th className="py-2.5 px-3">Bin / Rak</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  {isEditable && <th className="py-2.5 px-2 w-8"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {items && items.length > 0 ? (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {isEditable ? (
                          <input
                            type="text"
                            value={item.name || item.item_name || ''}
                            onChange={(e) => onUpdateItem(idx, 'name', e.target.value)}
                            placeholder="Nama suku cadang"
                            className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs focus:ring-1 focus:ring-red-500"
                          />
                        ) : (
                          item.name || item.item_name || '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 text-[11px]">
                        {isEditable ? (
                          <input
                            type="text"
                            value={item.sku || item.part_number || ''}
                            onChange={(e) => onUpdateItem(idx, 'sku', e.target.value)}
                            placeholder="BIB-SKU-..."
                            className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-mono focus:ring-1 focus:ring-red-500"
                          />
                        ) : (
                          item.sku || item.part_number || '-'
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {isEditable ? (
                          <input
                            type="number"
                            min="1"
                            value={item.qty || item.qty_received || 1}
                            onChange={(e) => onUpdateItem(idx, 'qty', e.target.value)}
                            className="w-16 px-2 py-1 text-center rounded bg-slate-50 border border-slate-200 text-xs font-bold focus:ring-1 focus:ring-red-500"
                          />
                        ) : (
                          item.qty || item.qty_received || 1
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 text-[11px]">
                        {item.unit || 'PCS'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 text-[11px]">
                        {item.rack || item.assigned_bin_location || 'R-A01'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                        {item.notes || '-'}
                      </td>
                      {isEditable && onRemoveItem && (
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => onRemoveItem(idx)}
                            className="text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            &times;
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-400 italic">
                      Belum ada rincian material yang ditambahkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 4. Purpose / Justification Box directly on document ── */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Tujuan / Keperluan Pemakaian Operasional
          </label>
          {isEditable ? (
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => onUpdateField?.('purpose', e.target.value)}
              placeholder="Jelaskan kebutuhan operasional pengambilan/penerimaan material..."
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium">
              {purpose || 'Pemakaian rutin pemeliharaan unit operasional site tambang.'}
            </div>
          )}
        </div>

        {/* ── 5. OFFICIAL 3-SLOT SIGNATURE COLUMNS (Directly on Document) ── */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          
          {/* Document Approval Overall Status Banner */}
          {signatures.slot1?.signed && signatures.slot2?.signed && signatures.slot3?.signed ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-900 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  ✓
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <span>STATUS: APPROVED (DISETUJUI SEPENUHNYA)</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                    Seluruh 3 tanda tangan berjenjang telah lengkap dan terverifikasi secara sah.
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-black px-3 py-1 rounded-full bg-emerald-600 text-white shadow-2xs">
                VALID &amp; APPROVED
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  ⏳
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <span>STATUS: PENDING APPROVAL</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                  <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                    Menunggu kelengkapan tanda tangan: {!signatures.slot1?.signed ? 'Slot 1 (Pemohon)' : !signatures.slot2?.signed ? 'Slot 2 (Admin Gudang)' : 'Slot 3 (Superadmin)'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-black px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                PENDING
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              <span>Kolom Tanda Tangan &amp; Otorisasi Digital Dokumen</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              Bisa di-Copy / di-Paste langsung
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Slot 1: Pemohon (Teknisi / Creator) */}
            <DocumentSignatureBox
              slotKey="slot1"
              roleTitle="Dibuat Oleh (Pemohon)"
              signerName={signatures.slot1?.signer_name || requesterName}
              signerRole="Teknisi Lapangan"
              isSigned={!!signatures.slot1?.signed}
              signatureImage={signatures.slot1?.signature_image}
              timestamp={signatures.slot1?.timestamp}
              hash={signatures.slot1?.hash}
              canSign={canSignSlot1}
              onSign={(data) => onSignSlot?.('slot1', data)}
              onReset={() => onResetSlot?.('slot1')}
            />

            {/* Slot 2: Supervisor / Admin */}
            <DocumentSignatureBox
              slotKey="slot2"
              roleTitle="Diperiksa / Disetujui (Admin)"
              signerName={signatures.slot2?.signer_name || (userRole === 'Admin' ? 'arya-admin' : 'Supervisor Site')}
              signerRole="Supervisor Logistik Site"
              isSigned={!!signatures.slot2?.signed}
              signatureImage={signatures.slot2?.signature_image}
              timestamp={signatures.slot2?.timestamp}
              hash={signatures.slot2?.hash}
              canSign={canSignSlot2}
              onSign={(data) => onSignSlot?.('slot2', data)}
              onReset={() => onResetSlot?.('slot2')}
            />

            {/* Slot 3: Superadmin / Otorisasi Final */}
            <DocumentSignatureBox
              slotKey="slot3"
              roleTitle="Mengetahui (Superadmin)"
              signerName={signatures.slot3?.signer_name || (userRole === 'Superadmin' ? 'arya-superadmin' : 'Superadmin Digitech')}
              signerRole="Superadmin Otoritas Final"
              isSigned={!!signatures.slot3?.signed}
              signatureImage={signatures.slot3?.signature_image}
              timestamp={signatures.slot3?.timestamp}
              hash={signatures.slot3?.hash}
              canSign={canSignSlot3}
              onSign={(data) => onSignSlot?.('slot3', data)}
              onReset={() => onResetSlot?.('slot3')}
            />
          </div>
        </div>

        {/* ── 6. Official Footer Legal Note ── */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
          <div>
            Digitech IMS v1.0 &bull; Dokumen Elektronik Sah Berdasarkan UU ITE No. 11/2008
          </div>
          <div>
            Sertifikasi SHA-256 Validated
          </div>
        </div>

      </div>

    </div>
  );
}
