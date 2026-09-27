import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scan,
  X,
  Camera,
  Flashlight,
  FlashlightOff,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import api from '../../api/client';

export default function InventoryScannerModal({ isOpen, onClose, onSelectSku }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [hasCamera, setHasCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [inventoryList, setInventoryList] = useState([]);
  const [stream, setStream] = useState(null);

  // Sample quick barcodes for warehouse testing
  const sampleBarcodes = [
    { sku: 'BIB-CAT-777D-FLTR', name: 'Cat 777D Oil Filter', rack: 'R-A01', stock: 4, status: 'Kritis' },
    { sku: 'BIB-KOM-PC2000-HYD', name: 'Komatsu Seal Kit', rack: 'R-A02', stock: 2, status: 'Kritis' },
    { sku: 'BIB-LUB-SHL-T68', name: 'Shell Tellus Oil 68', rack: 'R-C01', stock: 6, status: 'Menipis' },
    { sku: 'BIB-VOL-FMX-BRK', name: 'Volvo Brake Lining', rack: 'R-B01', stock: 3, status: 'Menipis' },
    { sku: 'BIB-ELE-ALT-24V', name: 'Alternator 24V 150A', rack: 'R-D01', stock: 9, status: 'Menipis' },
    { sku: 'BIB-GET-CAT-TIP', name: 'Bucket Tooth Tip 777D', rack: 'R-B03', stock: 65, status: 'Optimal' },
  ];

  // Fetch full inventory to resolve barcodes
  useEffect(() => {
    if (!isOpen) return;
    const fetchInv = async () => {
      try {
        const res = await api.get('/inventory');
        if (res.data?.data) {
          setInventoryList(res.data.data);
        }
      } catch {
        // Fallback to sample items if backend is offline
        setInventoryList(sampleBarcodes);
      }
    };
    fetchInv();
  }, [isOpen]);

  // Handle camera start/stop
  useEffect(() => {
    if (!isOpen) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setCameraActive(false);
      setScannedResult(null);
      setManualInput('');
      return;
    }

    let currentStream = null;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCamera(false);
          return;
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        currentStream = mediaStream;
        setStream(mediaStream);
        setHasCamera(true);
        setCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.warn('Camera access not available or permission denied:', err);
        setHasCamera(false);
        setCameraActive(false);
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // Toggle Torch if supported
  const toggleTorch = async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      try {
        const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          await videoTrack.applyConstraints({
            advanced: [{ torch: !torchOn }]
          });
          setTorchOn(!torchOn);
        } else {
          setTorchOn(!torchOn);
        }
      } catch {
        setTorchOn(!torchOn);
      }
    }
  };

  const handleResolveSku = (skuToFind) => {
    const clean = skuToFind.trim();
    if (!clean) return;

    // Look up in loaded inventory
    let found = inventoryList.find(
      (item) =>
        (item.part_number && item.part_number.toLowerCase() === clean.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase() === clean.toLowerCase())
    );

    if (!found) {
      found = sampleBarcodes.find(
        (item) => item.sku.toLowerCase() === clean.toLowerCase()
      );
    }

    if (found) {
      setScannedResult({
        sku: found.part_number || found.sku || clean,
        name: found.name || 'Suku Cadang Tambang BIB',
        stock: found.stock_count ?? found.stock ?? 10,
        rack: found.bin_location || found.rack || 'R-A01',
        warehouse: found.warehouse_name || 'Warehouse 1 (Main Pit)',
        status: found.status || 'Tersedia'
      });
    } else {
      // Create a virtual match for unlisted barcode
      setScannedResult({
        sku: clean.toUpperCase(),
        name: `Item Barcode: ${clean.toUpperCase()}`,
        stock: 0,
        rack: 'Lokasi Belum Ditentukan',
        warehouse: 'Warehouse 1 (Main Pit)',
        status: 'Belum Terdaftar'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* ─── Modal Header ─── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-2xs">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Scan QR & Barcode Inventory
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Pindai label kardus, barcode rak, atau stiker suku cadang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── Scrollable Modal Body ─── */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* 1. Camera / Viewfinder Box */}
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-inner flex items-center justify-center">
            
            {/* Real Video Element if camera active */}
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              /* Simulated High-Tech Viewfinder when camera is unavailable (desktop / test mode) */
              <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="text-xs font-bold text-white tracking-wide">
                  Viewfinder Scanner Siap
                </div>
                <div className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  {hasCamera
                    ? 'Menghubungkan sensor kamera perangkat...'
                    : 'Pilih sampel barcode di bawah atau ketik SKU untuk simulasi scan instan'}
                </div>
              </div>
            )}

            {/* Viewfinder Target Crosshairs & Frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="relative w-56 h-40 sm:w-64 sm:h-48 rounded-xl border border-white/20">
                {/* 4 Red Target Corner Brackets */}
                <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
                <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg" />

                {/* Sweeping Laser Scanner Line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,1)] animate-bounce" />

                {/* Center Aiming Dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,1)]" />
                </div>
              </div>
            </div>

            {/* Viewfinder Overlays / Controls */}
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <button
                onClick={toggleTorch}
                title="Nyalakan Lampu Kilat / Flash"
                className={`p-2 rounded-xl backdrop-blur-md transition cursor-pointer ${
                  torchOn
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                    : 'bg-black/50 text-white/80 hover:bg-black/70'
                }`}
              >
                {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
              </button>
            </div>

            {/* Viewfinder Status Pill Bottom */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono font-bold text-white/90 border border-white/10 z-10 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>SISTEM OPTIK AKTIF</span>
            </div>
          </div>

          {/* 2. Manual SKU Input Bar */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600">
              Atau Ketik / Tempel Part Number Manual:
            </label>
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Contoh: BIB-CAT-777D-FLTR..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleResolveSku(manualInput);
                  }
                }}
                className="w-full h-10 pl-9 pr-20 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-400"
              />
              <button
                onClick={() => handleResolveSku(manualInput)}
                className="absolute right-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-[11px] font-bold rounded-lg transition-all shadow-xs cursor-pointer"
              >
                Cari Part
              </button>
            </div>
          </div>

          {/* 3. Sample Barcodes to Tap (Instant Demo Test) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                Sampel Barcode Gudang (Klik untuk Tes):
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {sampleBarcodes.length} Presets
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {sampleBarcodes.map((item) => (
                <button
                  key={item.sku}
                  onClick={() => handleResolveSku(item.sku)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 bg-white transition-all text-left group active:scale-98 cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] font-mono font-bold text-red-700 truncate">
                      {item.sku}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        item.status === 'Optimal'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 truncate mt-1">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{item.rack}</span>
                    <span className="text-slate-300">•</span>
                    <span>Stok: {item.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Scanned Result Card */}
          {scannedResult && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-red-50 via-white to-slate-50 border-2 border-red-200 shadow-md animate-in slide-in-from-bottom-2 duration-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                      Suku Cadang Ditemukan
                    </span>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                      {scannedResult.name}
                    </h4>
                    <span className="text-[11px] font-mono font-bold text-slate-600">
                      SKU: {scannedResult.sku}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-900 text-white">
                  {scannedResult.stock} Unit
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 bg-white/80 p-2 rounded-xl border border-red-100">
                <MapPin className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-semibold text-slate-800">
                  {scannedResult.rack}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 truncate">
                  {scannedResult.warehouse}
                </span>
              </div>

              {/* Action Buttons for Scanned Item */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/inventory?search=${encodeURIComponent(scannedResult.sku)}`);
                  }}
                  className="py-2 px-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-[11px] font-bold transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-2xs"
                >
                  <Package className="w-3.5 h-3.5 text-slate-600" />
                  <span>Katalog</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    navigate(`/mr?sku=${encodeURIComponent(scannedResult.sku)}`);
                  }}
                  className="py-2 px-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-[11px] font-bold transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-2xs"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ambil (MR)</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    navigate(`/mos?sku=${encodeURIComponent(scannedResult.sku)}`);
                  }}
                  className="py-2 px-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer shadow-2xs"
                >
                  <span>Draf MOS</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ─── Modal Footer ─── */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Digitech Mobile Barcode Scanner Engine</span>
          <button
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-red-600 cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
