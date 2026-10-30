import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  PackagePlus,
  QrCode,
  Printer,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  MapPin,
  Tag,
  RefreshCw,
  Boxes,
  FileText,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Copy
} from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { getPrinterConfig, executePrintSticker } from '../../services/printerService';

/**
 * IncomingStockQRModal
 * Side-by-side Goods Receipt & Real-time QR Code Generator Modal
 * - Left column: Menu / Formulir Penerimaan Barang Masuk (Nama, SKU, Kategori, Qty Masuk, Rak Bin, PO, Supplier).
 * - Right column: Live QR Code Generator & Label Print (Menunya ada di sampingnya, QR update real-time,
 *   stepper per-unit ‹ Unit 01 dari N ›, animasi scanline halus, tombol cetak langsung).
 */
export default function IncomingStockQRModal({
  isOpen,
  onClose,
  initialItem = null,
  onSaved = null,
  onOpenPrinterSetup = null
}) {
  const { addToast } = useToast();

  // Mode: 'new' (Barang Masuk Baru) vs 'existing' (Penerimaan / Tagging Suku Cadang Terdaftar)
  const isExisting = Boolean(initialItem);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Sparepart Umum',
    current_stock: 10,
    min_threshold: 5,
    unit: 'PCS',
    rack: 'R-A01',
    po_reference: '',
    supplier: '',
    notes: ''
  });

  // Per-Unit Stepper State
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [copiedSku, setCopiedSku] = useState(false);
  const [isQrAnimating, setIsQrAnimating] = useState(false);

  // Canvas ref for progressive laser scanline drawing
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Synchronize form when modal opens or initialItem changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialItem) {
      setFormData({
        name: initialItem.name || initialItem.item_name || '',
        sku: initialItem.sku || initialItem.SKU || initialItem.item_code || '',
        category: initialItem.category || 'Sparepart Umum',
        current_stock: Number(initialItem.current_stock ?? initialItem.currentStock ?? 10),
        min_threshold: Number(initialItem.min_threshold ?? initialItem.minThreshold ?? 5),
        unit: initialItem.unit || 'PCS',
        rack: initialItem.rack || initialItem.bin_location || 'R-A01',
        po_reference: initialItem.po_reference || 'PO-2026-INB-' + String(Date.now()).slice(-4),
        supplier: initialItem.supplier || 'Vendor Resmi Site',
        notes: initialItem.notes || ''
      });
    } else {
      // Default clean template for incoming goods
      const autoSkuSeed = 'BIB-INB-' + Math.floor(100 + Math.random() * 900);
      setFormData({
        name: '',
        sku: autoSkuSeed,
        category: 'Hydraulics',
        current_stock: 5,
        min_threshold: 2,
        unit: 'PCS',
        rack: 'R-A01',
        po_reference: `PO-2026-BIB-${Math.floor(1000 + Math.random() * 9000)}`,
        supplier: 'United Tractors / Trakindo',
        notes: 'Penerimaan stok berkala site'
      });
    }
    setSelectedUnitIndex(0);
  }, [isOpen, initialItem]);

  // Total quantity entered in form
  const totalQty = Math.max(1, parseInt(formData.current_stock || 1, 10));

  // Ensure selected unit index is within bounds when Qty changes
  useEffect(() => {
    if (selectedUnitIndex >= totalQty) {
      setSelectedUnitIndex(Math.max(0, totalQty - 1));
    }
  }, [totalQty, selectedUnitIndex]);

  // Derived current unit details
  const activeSku = formData.sku?.trim() || 'BIB-SKU-PENDING';
  const activeName = formData.name?.trim() || 'Nama Suku Cadang';
  const activeRack = formData.rack?.trim() || 'R-A01';
  const unitNumber = String(selectedUnitIndex + 1).padStart(2, '0');
  const unitAssetId = `${activeSku}-U${unitNumber}`;
  const cleanSkuAlpha = activeSku.replace(/[^A-Z0-9]/gi, '').slice(0, 6);
  const unitSerial = `SN-2026-${cleanSkuAlpha || 'GEN'}-${unitNumber}`;

  // Unique QR Payload for current unit
  const resolvedPayload = `IMS:ITEM:SKU:${activeSku}:UNIT:${unitNumber}:SN:${unitSerial}:LOK:${activeRack}:QTY:${totalQty}:VERIFIED:2026`;

  // Draw smooth progressive scanline QR onto canvas
  const drawProgressiveQR = useCallback(() => {
    if (!canvasRef.current) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    setIsQrAnimating(true);

    let qrModules;
    try {
      const qrObj = QRCode.create(resolvedPayload, { errorCorrectionLevel: 'H' });
      qrModules = qrObj.modules;
    } catch (err) {
      console.error('QR creation error:', err);
      setIsQrAnimating(false);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const size = qrModules.size;
    const margin = 2;
    const totalCells = size + margin * 2;
    const cellSize = width / totalCells;

    const duration = 750; // 0.75s clean, responsive reveal
    const startTime = performance.now();

    const render = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3);

      // Clean pure white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      const currentScanRow = ease * (size + 1);

      // Render QR modules progressively row-by-row
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (qrModules.get(r, c)) {
            const x = Math.round((c + margin) * cellSize);
            const y = Math.round((r + margin) * cellSize);
            const w = Math.ceil(cellSize);
            const h = Math.ceil(cellSize);

            if (r <= currentScanRow) {
              const rowDiff = currentScanRow - r;
              if (rowDiff < 1 && progress < 1) {
                // Frontline transition: vibrant Digitech red glow
                ctx.fillStyle = '#DC2626';
              } else {
                // Final solid dark slate/charcoal
                ctx.fillStyle = '#0F172A';
              }
              ctx.fillRect(x, y, w, h);
            }
          }
        }
      }

      // Sleek top-down laser scanline indicator while animating
      if (progress < 1) {
        const scanY = (margin + currentScanRow) * cellSize;
        const lineGrad = ctx.createLinearGradient(0, scanY - 3, 0, scanY + 3);
        lineGrad.addColorStop(0, 'rgba(220, 38, 38, 0)');
        lineGrad.addColorStop(0.5, 'rgba(220, 38, 38, 0.85)');
        lineGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.fillStyle = lineGrad;
        ctx.fillRect(0, Math.max(0, scanY - 3), width, 6);

        animFrameRef.current = requestAnimationFrame(render);
      } else {
        setIsQrAnimating(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);
  }, [resolvedPayload]);

  // Redraw when payload or active unit changes
  useEffect(() => {
    if (isOpen) {
      drawProgressiveQR();
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, drawProgressiveQR]);

  // Helper to generate auto SKU code
  const handleGenerateSku = () => {
    const cleanName = formData.name
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 4);
    const catPrefix = formData.category.slice(0, 3).toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    const generated = `BIB-${catPrefix || 'GEN'}-${cleanName || 'PART'}-${rand}`;
    setFormData(prev => ({ ...prev, sku: generated }));
    addToast(`SKU terbuat: ${generated}`, 'info');
  };

  // Helper to copy SKU
  const handleCopySku = () => {
    if (!formData.sku) return;
    navigator.clipboard.writeText(formData.sku);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 2000);
    addToast('SKU berhasil disalin', 'success');
  };

  // Record printed SKUs to localStorage for status tracking
  const markSkuAsPrinted = (sku) => {
    try {
      const stored = JSON.parse(localStorage.getItem('digitech_printed_qr_skus') || '[]');
      if (!stored.includes(sku)) {
        const updated = [...stored, sku];
        localStorage.setItem('digitech_printed_qr_skus', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('qr-label-printed', { detail: { sku } }));
      }
    } catch (e) {
      console.warn('Failed to save printed SKU:', e);
    }
  };

  // Download Current Unit Label as PNG
  const handleDownloadLabelPng = () => {
    if (!canvasRef.current) return;
    try {
      const link = document.createElement('a');
      link.download = `QR_LABEL_${unitAssetId}_2026.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
      addToast(`Label ${unitAssetId} berhasil diunduh.`, 'success');
    } catch {
      addToast('Gagal mengunduh label QR.', 'error');
    }
  };

  // Direct Print Single Unit
  const handlePrintCurrentUnit = async () => {
    if (!canvasRef.current) return;
    setIsPrinting(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const itemToPrint = {
        name: activeName,
        sku: activeSku,
        category: formData.category,
        rack: activeRack,
        unit: formData.unit,
        unitAssetId,
        unitSerial,
        unitNumber: `${selectedUnitIndex + 1} dari ${totalQty}`
      };

      const result = await executePrintSticker(itemToPrint, dataUrl, 1);
      markSkuAsPrinted(activeSku);

      if (result.success) {
        addToast(result.message || `Label ${unitAssetId} berhasil dicetak!`, 'success');
      } else {
        addToast(result.message || 'Pencetakan simulasi selesai.', 'info');
      }
    } catch (err) {
      addToast(err.message || 'Gagal mengirim instruksi cetak ke printer.', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  // Direct Batch Print All Units
  const handlePrintAllUnits = async () => {
    setIsPrinting(true);
    try {
      let printedCount = 0;
      for (let i = 0; i < totalQty; i++) {
        const uNum = String(i + 1).padStart(2, '0');
        const uId = `${activeSku}-U${uNum}`;
        const uSerial = `SN-2026-${cleanSkuAlpha || 'GEN'}-${uNum}`;
        const pPayload = `IMS:ITEM:SKU:${activeSku}:UNIT:${uNum}:SN:${uSerial}:LOK:${activeRack}:QTY:${totalQty}:VERIFIED:2026`;
        const qrUrl = await QRCode.toDataURL(pPayload, { errorCorrectionLevel: 'H', width: 400 });

        const itemToPrint = {
          name: activeName,
          sku: activeSku,
          category: formData.category,
          rack: activeRack,
          unit: formData.unit,
          unitAssetId: uId,
          unitSerial: uSerial,
          unitNumber: `${i + 1} dari ${totalQty}`
        };

        await executePrintSticker(itemToPrint, qrUrl, 1);
        printedCount++;
      }

      markSkuAsPrinted(activeSku);
      addToast(`Batch cetak selesai! ${printedCount} label QR berhasil diproses.`, 'success');
    } catch (err) {
      addToast(err.message || 'Terjadi kendala saat batch printing.', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  // Submit Handler: Simpan data (dan opsi langsung cetak)
  const handleSubmitForm = async (printAfterSave = false) => {
    if (!formData.name?.trim()) {
      addToast('Nama material / suku cadang wajib diisi.', 'error');
      return;
    }
    if (!formData.sku?.trim()) {
      addToast('Part number / SKU wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        category: formData.category,
        current_stock: Number(formData.current_stock || 1),
        min_threshold: Number(formData.min_threshold || 1),
        unit: formData.unit || 'PCS',
        rack: formData.rack?.trim() || 'R-A01',
        po_reference: formData.po_reference,
        supplier: formData.supplier,
        notes: formData.notes
      };

      if (isExisting && initialItem?.id) {
        // Update existing item
        await api.put(`/inventory/${initialItem.id}`, payload);
        addToast(`Data suku cadang ${payload.sku} berhasil diperbarui!`, 'success');
      } else {
        // Create new inventory receipt
        await api.post('/inventory', payload);
        addToast(`Material baru [${payload.sku}] berhasil dicatat dalam stok gudang!`, 'success');
      }

      markSkuAsPrinted(payload.sku);

      if (printAfterSave) {
        await handlePrintCurrentUnit();
      }

      if (onSaved) {
        onSaved(payload, printAfterSave);
      }

      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message || 'Gagal menyimpan data barang masuk.';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-5xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-700 shrink-0" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  {isExisting ? 'Tagging QR & Penerimaan Suku Cadang' : 'Penerimaan Barang Masuk & Live QR Code'}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                  Side-by-Side Tagging
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Input formulir barang masuk di sebelah kiri — QR Code label otomatis ter-generate secara live di sampingnya.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 2-Column Side-by-Side Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* ── LEFT COLUMN (col-span-7): MENU / FORMULIR BARANG MASUK ── */}
          <div className="lg:col-span-7 p-6 space-y-4 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  1. Formulir Data Barang Masuk
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                * Kolom bertanda wajib diisi
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitForm(false);
              }}
              className="space-y-3.5 text-xs"
            >
              {/* Field: Nama Material */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Suku Cadang / Material <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="cth: Komatsu PC2000 Hydraulic Filter Hose"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                />
              </div>

              {/* Field: Part Number / SKU with Auto Helper */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Part Number / SKU <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Auto-Gen SKU</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="cth: BIB-HYD-KOM-2000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-red-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition uppercase"
                  />
                  {formData.sku && (
                    <button
                      type="button"
                      onClick={handleCopySku}
                      title="Salin SKU"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      {copiedSku ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Grid 2-col: Kategori & Satuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kategori Sparepart
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                  >
                    <option value="Hydraulics">Hydraulics &amp; Hoses</option>
                    <option value="Engine Parts">Engine &amp; Powertrain</option>
                    <option value="Filtration">Filtration (Oil / Air / Fuel)</option>
                    <option value="Electrical">Electrical &amp; Wiring</option>
                    <option value="Chassis">Underbelly &amp; Chassis</option>
                    <option value="Lubricants">Oli &amp; Pelumas</option>
                    <option value="Sparepart Umum">Sparepart Umum Site</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Satuan Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                  >
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="SET">SET (Assembly / Kit)</option>
                    <option value="DRUM">DRUM (200 Liter)</option>
                    <option value="BOX">BOX (Kemasan Kotak)</option>
                    <option value="METER">METER (Roll Selang)</option>
                    <option value="UNIT">UNIT</option>
                  </select>
                </div>
              </div>

              {/* Grid 3-col: Stok Masuk, Safety Stock, Rak Bin */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Jumlah Masuk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: Math.max(1, parseInt(e.target.value || 1, 10)) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Menghasilkan {formData.current_stock} unit label
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Batas Safety Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_threshold}
                    onChange={(e) => setFormData({ ...formData, min_threshold: parseInt(e.target.value || 0, 10) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bin / Lokasi Rak <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rack}
                    onChange={(e) => setFormData({ ...formData, rack: e.target.value.toUpperCase() })}
                    placeholder="R-A01"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition uppercase"
                  />
                </div>
              </div>

              {/* Grid 2-col: PO Reference & Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    No. Surat Jalan / PO Masuk
                  </label>
                  <div className="relative">
                    <FileText className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.po_reference}
                      onChange={(e) => setFormData({ ...formData, po_reference: e.target.value })}
                      placeholder="PO-2026-BIB-8821"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Supplier / Vendor
                  </label>
                  <div className="relative">
                    <Truck className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="United Tractors / Trakindo"
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons at Bottom of Left Menu */}
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitForm(true)}
                  className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memproses...' : 'Simpan & Cetak Label QR'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  Simpan Masuk Saja
                </button>
              </div>
            </form>
          </div>

          {/* ── RIGHT COLUMN (col-span-5): LIVE QR CODE GENERATOR & LABEL PREVIEW ── */}
          <div className="lg:col-span-5 p-6 bg-slate-50/50 flex flex-col justify-between space-y-4">
            <div>
              {/* Header Right Column: Live Sync Badge */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    2. Live QR Code Tagging
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Synced
                </span>
              </div>

              {/* Unit Stepper: ‹ Unit 01 dari N › */}
              <div className="mt-3 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Nomor Fisik Unit
                  </div>
                  <div className="text-xs font-black text-slate-900 mt-0.5 font-mono">
                    Unit {unitNumber} <span className="text-slate-400 font-normal">dari {String(totalQty).padStart(2, '0')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={selectedUnitIndex === 0}
                    onClick={() => setSelectedUnitIndex(prev => Math.max(0, prev - 1))}
                    className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="Unit Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-100">
                    #{unitNumber}
                  </span>

                  <button
                    type="button"
                    disabled={selectedUnitIndex >= totalQty - 1}
                    onClick={() => setSelectedUnitIndex(prev => Math.min(totalQty - 1, prev + 1))}
                    className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="Unit Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Physical Thermal Sticker Label Preview */}
              <div className="mt-4 p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md relative overflow-hidden flex flex-col items-center">
                {/* Digitech Header Strip */}
                <div className="w-full py-1 px-3 bg-red-600 text-white rounded-lg flex items-center justify-between text-[10px] font-black tracking-wider uppercase mb-3">
                  <span>DIGITECH SITE INVENTORY</span>
                  <span className="font-mono">{formData.rack || 'R-A01'}</span>
                </div>

                {/* Progressive QR Code Canvas */}
                <div className="relative w-44 h-44 bg-white p-2 rounded-xl border border-slate-200 shadow-inner flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={320}
                    className="w-full h-full object-contain"
                  />
                  {isQrAnimating && (
                    <div className="absolute inset-x-2 bottom-2 text-center pointer-events-none">
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                        Laser Scanning...
                      </span>
                    </div>
                  )}
                </div>

                {/* Thermal Sticker Metadata Details */}
                <div className="w-full mt-3 text-center space-y-1">
                  <div className="text-xs font-black text-slate-900 line-clamp-1 leading-snug">
                    {activeName}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      {unitAssetId}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {unitSerial}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium pt-0.5">
                    <span>Rak: <strong className="text-slate-700">{activeRack}</strong></span>
                    <span>•</span>
                    <span>Qty: <strong className="text-slate-700">{totalQty} {formData.unit}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons for Label Print & Download */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isPrinting}
                onClick={handlePrintCurrentUnit}
                className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>{isPrinting ? 'Mencetak Label...' : `Cetak Stiker Unit #${unitNumber}`}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isPrinting || totalQty <= 1}
                  onClick={handlePrintAllUnits}
                  className="py-2 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title={`Cetak semua ${totalQty} stiker unit`}
                >
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cetak Semua ({totalQty})</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadLabelPng}
                  className="py-2 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Unduh file gambar PNG"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Unduh PNG</span>
                </button>
              </div>

              {onOpenPrinterSetup && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={onOpenPrinterSetup}
                    className="text-[10px] text-slate-400 hover:text-slate-600 underline font-medium cursor-pointer"
                  >
                    Atur Koneksi Printer Thermal (TSPL/ZPL)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
