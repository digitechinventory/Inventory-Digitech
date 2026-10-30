import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  Tag
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

/**
 * Clean & Minimalist Animated QR Code Generator
 * - Smooth progressive emergence animation (gentle top-to-bottom laser reveal).
 * - Per-unit unique QR code with unified grouping.
 * - Clean, clutter-free UI without excessive buttons.
 */
export default function CyberQRCodeModal({
  isOpen,
  onClose,
  data,
  item = null,
  customPayload = null,
  title = null,
  onOpenPrinter = null
}) {
  const activeData = data || item;
  const { addToast } = useToast();

  const totalUnits = Math.max(1, parseInt(activeData?.current_stock ?? activeData?.currentStock ?? activeData?.quantity ?? 8, 10));
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Parent Grouping Info (Tetap sama untuk semua unit)
  const parentSku = activeData?.item_code || activeData?.sku || activeData?.SKU || activeData?.code || 'SKU-001';
  const itemTitle = title || activeData?.name || activeData?.title || 'Material Site Digitech';
  const itemCategory = activeData?.category || 'Sparepart';
  const itemLocation = activeData?.rack || activeData?.bin_location || activeData?.site_location || 'Gudang Central';
  const itemProject = activeData?.project_id || activeData?.project_code || 'WIM';

  // Individual Unit Properties (Unik per unit fisik)
  const unitNumber = String(selectedUnitIndex + 1).padStart(2, '0');
  const unitAssetId = `${parentSku}-U${unitNumber}`;
  const unitSerialNumber = activeData?.serial_number
    ? `${activeData.serial_number}-${unitNumber}`
    : `SN-2026-${parentSku.replace(/[^A-Z0-9]/gi, '').slice(0, 5)}-${unitNumber}`;

  // Unique QR Payload per Unit
  const resolvedPayload = (() => {
    if (customPayload) return customPayload;
    if (!activeData) return `IMS:ITEM:SKU:${parentSku}:UNIT:${unitNumber}:SN:${unitSerialNumber}:VERIFIED:2026`;

    const docNo = activeData.doc_number || activeData.document_number;
    if (docNo) {
      return `IMS:DOC:${docNo}:PROJ:${itemProject}:STAGE:${activeData.stage_code || 'MOS'}:VERIFIED:2026`;
    }

    return `IMS:ITEM:SKU:${parentSku}:UNIT:${unitNumber}:SN:${unitSerialNumber}:LOK:${itemLocation}:PROJ:${itemProject}:TAG:${selectedUnitIndex + 1}/${totalUnits}`;
  })();

  // Reset to first unit when modal opens with a new item
  useEffect(() => {
    if (isOpen) {
      setSelectedUnitIndex(0);
    }
  }, [isOpen, activeData]);

  // ================= SMOOTH PROGRESSIVE QR DRAWING =================
  const drawProgressiveQR = useCallback(() => {
    if (!canvasRef.current) return;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    setIsAnimating(true);

    let qrModules;
    try {
      const qrObj = QRCode.create(resolvedPayload, { errorCorrectionLevel: 'H' });
      qrModules = qrObj.modules;
    } catch (err) {
      console.error('QR creation error:', err);
      setIsAnimating(false);
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

    const duration = 900; // 0.9s smooth, natural reveal
    const startTime = performance.now();

    const render = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3);

      // Clean white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      const currentScanRow = ease * (size + 1);

      // Draw modules
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (qrModules.get(r, c)) {
            const x = (c + margin) * cellSize;
            const y = (r + margin) * cellSize;
            const pad = 0.3;

            if (r < Math.floor(currentScanRow)) {
              ctx.fillStyle = '#0F172A';
              ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
            } else if (r === Math.floor(currentScanRow)) {
              const rowProgress = currentScanRow - r;
              ctx.fillStyle = '#DC2626';
              const scale = 0.4 + 0.6 * rowProgress;
              const curSize = cellSize * scale;
              const ox = x + (cellSize - curSize) / 2;
              const oy = y + (cellSize - curSize) / 2;
              ctx.fillRect(ox, oy, curSize, curSize);
            }
          }
        }
      }

      // Smooth hairline beam while drawing
      if (progress < 1) {
        const beamY = (currentScanRow + margin) * cellSize;
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, 'rgba(220, 38, 38, 0)');
        grad.addColorStop(0.5, 'rgba(220, 38, 38, 0.85)');
        grad.addColorStop(1, 'rgba(220, 38, 38, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(margin * cellSize, beamY);
        ctx.lineTo(width - margin * cellSize, beamY);
        ctx.stroke();

        animFrameRef.current = requestAnimationFrame(render);
      } else {
        // Complete frame: crisp black dots
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (qrModules.get(r, c)) {
              const x = (c + margin) * cellSize;
              const y = (r + margin) * cellSize;
              const pad = 0.3;
              ctx.fillStyle = '#0F172A';
              ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
            }
          }
        }

        setQrDataUrl(canvas.toDataURL('image/png'));
        setIsAnimating(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);
  }, [resolvedPayload]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      drawProgressiveQR();
    }, 60);

    return () => {
      clearTimeout(timer);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, selectedUnitIndex, resolvedPayload, drawProgressiveQR]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${unitAssetId}.png`;
    a.click();
    addToast(`QR Unit ${unitNumber} berhasil diunduh.`, 'success');
  };

  const handlePrint = () => {
    if (onOpenPrinter) {
      onClose();
      onOpenPrinter({
        ...activeData,
        sku: unitAssetId,
        serial_number: unitSerialNumber,
        unit_tag: `Unit ${unitNumber} dari ${totalUnits}`
      });
    } else {
      addToast(`Label thermal siap dicetak untuk Unit #${unitNumber}`, 'info');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100050] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-spotlight-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Clean, Floating Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-modal-pop text-slate-800 font-sans">
        
        {/* Top Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                QR Code Aset Fisik
              </h3>
              <p className="text-[11px] text-slate-500">
                {parentSku} &bull; {itemCategory}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex flex-col items-center">
          
          {/* Minimalist Unit Stepper (Ganti Unit Barang) */}
          <div className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 mb-5">
            <button
              type="button"
              onClick={() => setSelectedUnitIndex((prev) => (prev > 0 ? prev - 1 : totalUnits - 1))}
              className="p-1 rounded-lg text-slate-500 hover:text-red-600 hover:bg-white transition cursor-pointer"
              title="Unit Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="text-xs font-bold text-slate-900">
                Unit {unitNumber} <span className="font-normal text-slate-500">dari {String(totalUnits).padStart(2, '0')}</span>
              </div>
              <div className="text-[10px] font-mono text-red-600 font-semibold">
                {unitAssetId}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedUnitIndex((prev) => (prev < totalUnits - 1 ? prev + 1 : 0))}
              className="p-1 rounded-lg text-slate-500 hover:text-red-600 hover:bg-white transition cursor-pointer"
              title="Unit Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* QR Code Canvas Box (Clean & Subtle Shadow) */}
          <div className="relative w-64 h-64 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              width={340}
              height={340}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Item Identification Specs (Clean Text) */}
          <div className="mt-4 text-center max-w-xs">
            <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
              {itemTitle}
            </h4>
            <div className="text-xs text-slate-500 flex items-center justify-center gap-2 mt-1">
              <span className="font-mono text-slate-600">{unitSerialNumber}</span>
              <span>&bull;</span>
              <span>Rak: {itemLocation}</span>
            </div>
          </div>
        </div>

        {/* Minimal Bottom Action Buttons (Hanya 2 Tombol Bersih) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Unduh Gambar</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Label QR</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
