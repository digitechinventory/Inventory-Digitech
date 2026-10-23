import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  Wifi,
  Usb,
  Bluetooth,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Play,
  Sliders,
  FileText,
  Clock,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import {
  getPrinterConfig,
  savePrinterConfig,
  testPrinterConnection,
  executePrintSticker,
  generateQRCodeDataUrl,
  getPrintHistory
} from '../../services/printerService';
import { useToast } from '../../context/ToastContext';

export default function PrinterSetupModal({ isOpen, onClose }) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('connection'); // 'connection' | 'calibration' | 'test' | 'history'
  const [config, setConfig] = useState(() => getPrinterConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testQrUrl, setTestQrUrl] = useState('');
  const [printHistory, setPrintHistory] = useState([]);
  const [isPrintingTest, setIsPrintingTest] = useState(false);

  // Load configuration and generate sample QR on open
  useEffect(() => {
    if (isOpen) {
      const current = getPrinterConfig();
      setConfig(current);
      setPrintHistory(getPrintHistory());
      // Generate sample test QR code
      generateQRCodeDataUrl(`IMS:TEST:V1:${Date.now()}`).then((url) => {
        setTestQrUrl(url);
      });
      // Initial diagnostic ping
      runDiagnosticPing(current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (updatedPartial) => {
    const updated = { ...config, ...updatedPartial };
    setConfig(updated);
    savePrinterConfig(updated);
    addToast('Pengaturan printer berhasil disimpan.', 'success');
  };

  const runDiagnosticPing = async (cfgToTest = config) => {
    setIsTesting(true);
    try {
      const res = await testPrinterConnection(cfgToTest);
      setTestResult(res);
      if (res.success) {
        if (res.isSimulation) {
          addToast('Mode Simulasi Siap: Anda dapat menguji integrasi cetak label kapan saja.', 'info');
        } else {
          addToast(`Printer terhubung: ${res.message}`, 'success');
        }
      } else {
        addToast(`Diagnosa printer: ${res.message}`, 'warning');
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Gagal melakukan tes koneksi printer'
      });
      addToast(err.message, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handlePrintTestSticker = async () => {
    setIsPrintingTest(true);
    try {
      const sampleLabel = {
        sku: 'TEST-ITM-001',
        name: 'SAMPLE DIGITECH ASSET',
        category: 'CALIBRATION TEST',
        rack: 'R-A01-01',
        qty: '1 PCS',
        date: new Date().toLocaleDateString('id-ID'),
        qrCode: `IMS:TEST:CALIBRATION:${Date.now()}`,
        qrCodeDataUrl: testQrUrl
      };

      const res = await executePrintSticker(sampleLabel, { count: 1 });
      setPrintHistory(getPrintHistory());
      addToast(res.message || 'Berhasil mencetak stiker uji coba!', 'success');
    } catch (err) {
      addToast(`Gagal mencetak stiker uji: ${err.message}`, 'error');
    } finally {
      setIsPrintingTest(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-slate-800/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-4xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 font-sans"
        style={{
          clipPath: 'polygon(0 16px, 100% 0, 100% calc(100% - 16px), 0 100%)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.15), 0 8px 30px rgba(220,38,38,0.12)',
        }}
      >
        
        {/* ─── Modal Header ────────────────────────────────────────── */}
        <div className="px-8 pt-7 pb-5 text-white flex items-center justify-between border-b border-red-800/40 relative" style={{ background: 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #EF4444 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-white shadow-inner">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-wide uppercase">
                  Setup &amp; Integrasi Printer Stiker QR
                </h2>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  config.simulationMode
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400/40'
                    : testResult?.success
                    ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40'
                    : 'bg-white/15 text-white/80 border-white/30'
                }`}>
                  {config.simulationMode ? 'SIMULASI AKTIF' : testResult?.success ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="text-xs text-red-100/80 mt-0.5">
                Konfigurasi koneksi wireless (Wi-Fi/LAN) &amp; USB untuk cetak barcode stiker gudang
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 text-white transition flex items-center justify-center cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── Navigation Tabs ─────────────────────────────────────── */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'connection', label: 'Mode Koneksi', icon: Wifi },
            { id: 'calibration', label: 'Ukuran & Format Label', icon: Sliders },
            { id: 'test', label: 'Uji Integrasi & Preview', icon: Play },
            { id: 'history', label: 'Riwayat Cetak', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-red-600 text-red-600 bg-white rounded-t-xl shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-t-xl'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Tab Contents ────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">

          {/* TAB 1: CONNECTION MODE */}
          {activeTab === 'connection' && (
            <div className="space-y-6">
              {/* Simulation Mode Banner Switch */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                      Mode Simulasi & Integrasi Virtual (Siap Digunakan)
                    </h4>
                    <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                      Jika printer fisik belum tersedia, aktifkan mode ini agar aplikasi dapat di-testing secara menyeluruh 
                      (preview stiker, print dialog browser, dan tracking mutasi stok di database).
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.simulationMode}
                    onChange={(e) => handleSave({ simulationMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  <span className="ml-3 text-xs font-bold text-slate-700">
                    {config.simulationMode ? 'Aktif' : 'Non-aktif'}
                  </span>
                </label>
              </div>

              {/* Mode Selection Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Pilih Antarmuka / Jalur Koneksi Printer:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Card 1: Wireless Wi-Fi / LAN */}
                  <div
                    onClick={() => handleSave({ mode: 'network' })}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      config.mode === 'network'
                        ? 'border-red-600 bg-red-50/30 shadow-md ring-2 ring-red-100'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        config.mode === 'network' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Wifi className="w-4 h-4" />
                      </div>
                      {config.mode === 'network' && (
                        <CheckCircle2 className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="font-bold text-sm text-slate-900">Wireless Wi-Fi / LAN</div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Mencetak via IP Address jaringan gudang. Kompatibel penuh untuk HP/Mobile & Desktop.
                    </p>
                  </div>

                  {/* Card 2: USB Cable Direct */}
                  <div
                    onClick={() => handleSave({ mode: 'usb' })}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      config.mode === 'usb'
                        ? 'border-red-600 bg-red-50/30 shadow-md ring-2 ring-red-100'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        config.mode === 'usb' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Usb className="w-4 h-4" />
                      </div>
                      {config.mode === 'usb' && (
                        <CheckCircle2 className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="font-bold text-sm text-slate-900">Direct USB Cable</div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Koneksi kabel USB ke laptop/PC kasir atau terminal gudang via WebUSB atau Windows Spooler.
                    </p>
                  </div>

                  {/* Card 3: Bluetooth Mobile */}
                  <div
                    onClick={() => handleSave({ mode: 'bluetooth' })}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      config.mode === 'bluetooth'
                        ? 'border-red-600 bg-red-50/30 shadow-md ring-2 ring-red-100'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        config.mode === 'bluetooth' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Bluetooth className="w-4 h-4" />
                      </div>
                      {config.mode === 'bluetooth' && (
                        <CheckCircle2 className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="font-bold text-sm text-slate-900">Bluetooth Mobile</div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Printer stiker portabel bluetooth (MTP-II / Panda Mobile) langsung dari smartphone teknisi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Detail Setting Form Based on Selected Mode */}
              {config.mode === 'network' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-red-600" /> Parameter Printer Jaringan (TCP/IP)
                    </span>
                    <button
                      type="button"
                      onClick={() => runDiagnosticPing()}
                      disabled={isTesting}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      Tes Ping Socket
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        IP Address Printer Gudang
                      </label>
                      <input
                        type="text"
                        value={config.network.ip}
                        onChange={(e) =>
                          handleSave({
                            network: { ...config.network, ip: e.target.value }
                          })
                        }
                        placeholder="Contoh: 192.168.1.200"
                        className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        IP statis printer stiker di jaringan Wi-Fi lokal.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Port RAW Cetak
                      </label>
                      <input
                        type="number"
                        value={config.network.port}
                        onChange={(e) =>
                          handleSave({
                            network: { ...config.network, port: Number(e.target.value) }
                          })
                        }
                        placeholder="9100"
                        className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Standar port printer thermal: 9100 (RAW).
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Protokol Perintah Label
                      </label>
                      <select
                        value={config.network.protocol}
                        onChange={(e) =>
                          handleSave({
                            network: { ...config.network, protocol: e.target.value }
                          })
                        }
                        className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value="TSPL">TSPL (TSC, Xprinter, Kassen, Panda)</option>
                        <option value="ZPL">ZPL (Zebra GK420 / ZD Series)</option>
                        <option value="ESC_POS">ESC/POS (Thermal Struk/Stiker Mini)</option>
                      </select>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Bahasa perintah mesin thermal.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {config.mode === 'usb' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Usb className="w-3.5 h-3.5 text-red-600" /> Konfigurasi USB & Browser Driver
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Label Perangkat
                      </label>
                      <input
                        type="text"
                        value={config.usb.deviceName}
                        onChange={(e) =>
                          handleSave({
                            usb: { ...config.usb, deviceName: e.target.value }
                          })
                        }
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-red-500 font-medium"
                      />
                    </div>

                    <div className="flex flex-col justify-center">
                      <label className="text-xs font-semibold text-slate-700 mb-1">
                        Kiosk Silent Print (Otomatis tanpa dialog)
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Didukung jika browser Chrome dibuka dengan flag <code>--kiosk-printing</code>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {config.mode === 'bluetooth' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Bluetooth className="w-3.5 h-3.5 text-red-600" /> Pairing Bluetooth Mobile Thermal
                  </span>
                  <p className="text-xs text-slate-600">
                    Pastikan printer thermal bluetooth portabel Anda sudah menyala dan terlihat di pencarian Bluetooth smartphone / laptop.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      if (typeof navigator !== 'undefined' && navigator.bluetooth) {
                        try {
                          const device = await navigator.bluetooth.requestDevice({
                            acceptAllDevices: true
                          });
                          addToast(`Perangkat Bluetooth terpilih: ${device.name}`, 'success');
                          handleSave({
                            bluetooth: { ...config.bluetooth, deviceName: device.name || 'Bluetooth Printer' }
                          });
                        } catch (err) {
                          addToast(`Pairing dibatalkan / gagal: ${err.message}`, 'warning');
                        }
                      } else {
                        addToast('Browser Anda belum mengizinkan Web Bluetooth API. Gunakan Google Chrome Mobile pada Android.', 'warning');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Bluetooth className="w-4 h-4 text-white" />
                    Pindai & Hubungkan Perangkat Bluetooth
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CALIBRATION & LABEL SIZE */}
          {activeTab === 'calibration' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Pilih Ukuran Kertas Stiker Gulung (Roll):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: '50 × 30 mm (Standar Gudang)', width: 50, height: 30, desc: 'Paling umum untuk label barcode & QR barang site' },
                    { label: '40 × 30 mm (Compact)', width: 40, height: 30, desc: 'Untuk stiker sparepart & komponen kecil' },
                    { label: '70 × 50 mm (Besar / Pengiriman)', width: 70, height: 50, desc: 'Label dus besar atau palet pengiriman MOS' },
                  ].map((preset) => {
                    const isSelected = config.label.widthMm === preset.width && config.label.heightMm === preset.height;
                    return (
                      <div
                        key={preset.label}
                        onClick={() =>
                          handleSave({
                            label: {
                              ...config.label,
                              widthMm: preset.width,
                              heightMm: preset.height
                            }
                          })
                        }
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-red-600 bg-red-50/30 shadow-md ring-2 ring-red-100'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-slate-900">{preset.label}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-red-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{preset.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fine Tuning Inputs */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lebar (mm)</label>
                  <input
                    type="number"
                    value={config.label.widthMm}
                    onChange={(e) =>
                      handleSave({
                        label: { ...config.label, widthMm: Number(e.target.value) }
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tinggi (mm)</label>
                  <input
                    type="number"
                    value={config.label.heightMm}
                    onChange={(e) =>
                      handleSave({
                        label: { ...config.label, heightMm: Number(e.target.value) }
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jarak Gap (mm)</label>
                  <input
                    type="number"
                    value={config.label.gapMm}
                    onChange={(e) =>
                      handleSave({
                        label: { ...config.label, gapMm: Number(e.target.value) }
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kepekatan (Density)</label>
                  <select
                    value={config.label.density}
                    onChange={(e) =>
                      handleSave({
                        label: { ...config.label, density: Number(e.target.value) }
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={6}>6 (Terang)</option>
                    <option value={8}>8 (Standar Tajam)</option>
                    <option value={10}>10 (Pekat)</option>
                    <option value={12}>12 (Maksimal)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTEGRATION TEST & LIVE PREVIEW */}
          {activeTab === 'test' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Diagnostics & Action */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Status Diagnosa Integrasi
                    </span>
                    <button
                      type="button"
                      onClick={() => runDiagnosticPing()}
                      disabled={isTesting}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      Refresh Status
                    </button>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      config.simulationMode
                        ? 'bg-amber-500 animate-pulse'
                        : testResult?.success
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900">
                        {config.simulationMode
                          ? 'Virtual Engine (Mode Simulasi Siap)'
                          : testResult?.success
                          ? 'Perangkat Printer Terhubung'
                          : 'Perangkat Belum Terdeteksi'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        Mode: {config.mode.toUpperCase()} | {config.mode === 'network' ? `${config.network.ip}:${config.network.port}` : config.usb.deviceName}
                      </div>
                    </div>
                  </div>

                  {testResult && (
                    <div className="text-[11px] text-slate-600 bg-slate-100 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed font-mono">
                      {testResult.message}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-red-950 uppercase tracking-wide">
                    Aksi Pengujian Cetak
                  </h4>
                  <p className="text-xs text-red-900/80 leading-relaxed">
                    Klik tombol di bawah untuk mencetak satu lembar stiker uji coba kalibrasi dengan QR Code asli.
                  </p>

                  <button
                    type="button"
                    onClick={handlePrintTestSticker}
                    disabled={isPrintingTest}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Printer className={`w-4 h-4 ${isPrintingTest ? 'animate-bounce' : ''}`} />
                    <span>{isPrintingTest ? 'Memproses Cetak...' : 'Cetak Stiker Uji Coba (Test Print)'}</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Realistic 50x30mm Thermal Label Preview */}
              <div className="lg:col-span-6 flex flex-col items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Preview Stiker Fisik ({config.label.widthMm} × {config.label.heightMm} mm)
                </span>

                <div className="w-[320px] bg-white rounded-xl shadow-2xl border-2 border-slate-900 p-3 flex flex-col justify-between font-mono relative overflow-hidden select-none aspect-[5/3] text-black">
                  {/* Top Bar Brand */}
                  <div className="flex items-center justify-between border-b border-black pb-1">
                    <span className="text-[10px] font-black tracking-wider uppercase">DIGITECH</span>
                    <span className="text-[8px] font-bold border border-black px-1 rounded">CALIBRATION</span>
                  </div>

                  {/* Title */}
                  <div className="text-[10px] font-black uppercase truncate mt-0.5">
                    SAMPLE DIGITECH ASSET
                  </div>

                  {/* Body: QR & Metadata */}
                  <div className="flex items-center gap-2.5 my-auto">
                    <div className="w-16 h-16 shrink-0 bg-white border border-slate-300 p-0.5 rounded flex items-center justify-center">
                      {testQrUrl ? (
                        <img src={testQrUrl} alt="QR Code" className="w-full h-full object-contain" />
                      ) : (
                        <div className="text-[8px] text-slate-400">Loading QR...</div>
                      )}
                    </div>

                    <div className="text-[8.5px] leading-tight space-y-0.5 font-bold">
                      <div>SKU : <span className="font-mono">TEST-ITM-001</span></div>
                      <div>RAK : <span className="font-mono">R-A01-01</span></div>
                      <div>QTY : <span className="font-mono">1 PCS</span></div>
                      <div>TGL : <span className="font-mono">{new Date().toLocaleDateString('id-ID')}</span></div>
                    </div>
                  </div>

                  {/* Footer Barcode Line */}
                  <div className="border-t border-black pt-0.5 flex items-center justify-between text-[7px] font-bold">
                    <span>*DIGITECH-IMS-TRACKING*</span>
                    <span>OK</span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 mt-2 text-center">
                  Format label ini otomatis disesuaikan dengan printer thermal 203 DPI saat dicetak.
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: PRINT LOGS / HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Riwayat Pekerjaan Cetak Terakhir
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Total: {printHistory.length} catatan
                </span>
              </div>

              {printHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Printer className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">Belum ada riwayat cetak label</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Label yang dicetak dari modul katalog atau barang masuk akan dicatat di sini.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {printHistory.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                          {item.count || 1}x
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{item.name || 'Material Item'}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            SKU: {item.sku} | Jalur: {item.mode}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="text-[10px] font-bold text-emerald-600">Berhasil</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Modal Footer ────────────────────────────────────────── */}
        <div className="px-8 pt-4 pb-8 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Konfigurasi tersimpan otomatis di perangkat Anda.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 text-white font-bold text-xs rounded-xl shadow-md shadow-red-600/20 transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
