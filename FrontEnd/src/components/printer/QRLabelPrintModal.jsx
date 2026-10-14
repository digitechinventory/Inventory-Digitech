import React, { useState, useEffect } from 'react';
import {
  Printer,
  QrCode,
  Download,
  Settings,
  X,
  CheckCircle2,
  Layers,
  Sparkles,
  MapPin,
  Tag,
  Hash
} from 'lucide-react';
import {
  getPrinterConfig,
  generateQRCodeDataUrl,
  executePrintSticker
} from '../../services/printerService';
import { useToast } from '../../context/ToastContext';

export default function QRLabelPrintModal({ item, isOpen, onClose, onOpenPrinterSetup }) {
  const { addToast } = useToast();
  const [qrUrl, setQrUrl] = useState('');
  const [printCount, setPrintCount] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);
  const [config, setConfig] = useState(() => getPrinterConfig());

  useEffect(() => {
    if (isOpen && item) {
      const cfg = getPrinterConfig();
      setConfig(cfg);
      const sku = item.sku || item.SKU || 'SKU-001';
      const qrPayload = `IMS:ITEM:SKU:${sku}:LOK:${item.rack || 'R-A01'}`;
      generateQRCodeDataUrl(qrPayload).then((url) => {
        setQrUrl(url);
      });
      setPrintCount(1);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const sku = item.sku || item.SKU || 'SKU-001';
  const name = item.name || 'MATERIAL SITE';
  const category = item.category || 'Sparepart';
  const rack = item.rack || 'R-A01';
  const stock = item.current_stock ?? item.currentStock ?? 1;
  const unit = item.unit || 'PCS';
  const dateStr = new Date().toLocaleDateString('id-ID');

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const labelData = {
        sku,
        name,
        category,
        rack,
        qty: `${stock} ${unit}`,
        date: dateStr,
        qrCode: `IMS:ITEM:SKU:${sku}`,
        qrCodeDataUrl: qrUrl
      };

      const res = await executePrintSticker(labelData, { count: printCount });
      addToast(res.message || `Berhasil memproses cetak ${printCount} stiker untuk ${sku}.`, 'success');
      onClose();
    } catch (err) {
      addToast(`Gagal mencetak: ${err.message}`, 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadImage = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QR_LABEL_${sku}.png`;
    a.click();
    addToast('File QR Code berhasil diunduh.', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 font-sans">
        
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 text-white flex items-center justify-between border-b border-red-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-red-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-wide uppercase">Cetak Stiker Label QR</h3>
              <p className="text-xs text-slate-300">Format stiker thermal roll (50 × 30 mm)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">

          {/* Active Printer Mode Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full ${config.simulationMode ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div>
                <span className="font-bold text-slate-800">Tujuan Cetak: </span>
                <span className="text-slate-600 font-mono">
                  {config.simulationMode
                    ? `Mode Simulasi (${config.mode.toUpperCase()})`
                    : config.mode === 'network'
                    ? `Wi-Fi (${config.network.ip}:${config.network.port})`
                    : 'USB / Browser Spooler'}
                </span>
              </div>
            </div>

            {onOpenPrinterSetup && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrinterSetup();
                }}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                Ubah Printer
              </button>
            )}
          </div>

          {/* Real Thermal Label Preview (50x30 mm scaled) */}
          <div className="flex flex-col items-center">
            <div className="w-[300px] bg-white rounded-xl shadow-xl border-2 border-slate-900 p-3 flex flex-col justify-between font-mono aspect-[5/3] text-black select-none">
              <div className="flex items-center justify-between border-b border-black pb-1">
                <span className="text-[9.5px] font-black uppercase tracking-wider">DIGITECH INVENTORY</span>
                <span className="text-[7.5px] font-bold border border-black px-1 rounded uppercase">{category}</span>
              </div>

              <div className="text-[10px] font-black uppercase truncate mt-0.5">
                {name}
              </div>

              <div className="flex items-center gap-2.5 my-auto">
                <div className="w-16 h-16 shrink-0 bg-white border border-slate-300 p-0.5 rounded flex items-center justify-center">
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-[8px] text-slate-400">Loading...</div>
                  )}
                </div>

                <div className="text-[8.5px] leading-tight space-y-0.5 font-bold">
                  <div>SKU : <span className="font-mono">{sku}</span></div>
                  <div>RAK : <span className="font-mono">{rack}</span></div>
                  <div>QTY : <span className="font-mono">{stock} {unit}</span></div>
                  <div>TGL : <span className="font-mono">{dateStr}</span></div>
                </div>
              </div>

              <div className="border-t border-black pt-0.5 flex items-center justify-between text-[7px] font-bold">
                <span>*DIMS-ASSET-TRACKING*</span>
                <span>ORIGINAL</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 font-mono">
              Ukuran cetak aktual: {config.label.widthMm} x {config.label.heightMm} mm
            </span>
          </div>

          {/* Quantity of stickers */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Jumlah Lembar Stiker</span>
              <span className="text-[11px] text-slate-500">Berapa copy stiker yang ingin dicetak</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPrintCount(Math.max(1, printCount - 1))}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="500"
                value={printCount}
                onChange={(e) => setPrintCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 text-center font-bold text-sm py-1 border border-slate-200 rounded-xl bg-white font-mono"
              />
              <button
                type="button"
                onClick={() => setPrintCount(printCount + 1)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 font-black text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDownloadImage}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Unduh QR Image
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Printer className={`w-4 h-4 ${isPrinting ? 'animate-bounce' : ''}`} />
              <span>{isPrinting ? 'Mencetak...' : `Cetak (${printCount} Stiker)`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
