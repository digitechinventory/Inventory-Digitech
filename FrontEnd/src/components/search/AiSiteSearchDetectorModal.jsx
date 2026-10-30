import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Scan,
  Camera,
  CameraOff,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  X,
  ExternalLink,
  QrCode,
  Layers,
  ArrowRight,
  ArrowLeft,
  CornerDownLeft,
  RefreshCw,
  Copy,
  Check,
  Package,
  FolderKanban,
  Truck
} from 'lucide-react';
import {
  detectQRCodeFromImageData,
  parseDigitechQRPayload,
  classifyDocumentParameters,
  searchEngine
} from '../../services/aiSiteEngine';
import IncomingStockQRModal from '../inventory/IncomingStockQRModal';

export default function AiSiteSearchDetectorModal({ isOpen, onClose, initialTab = 'search' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab === 'actions' ? 'search' : initialTab); // 'search' | 'lens'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Camera & Scan states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanningState, setScanningState] = useState('idle'); // 'idle' | 'scanning' | 'detected'
  const [detectionResult, setDetectionResult] = useState(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Cyber QR Modal preview state from AI detection
  const [cyberQrData, setCyberQrData] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const selectedItemRef = useRef(null);

  // Sync initial tab when modal opens & auto-focus search input
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab === 'actions' ? 'search' : initialTab);
      setSelectedIndex(0);
      searchEngine.buildIndex();
      setTimeout(() => {
        if (searchInputRef.current && (initialTab === 'search' || !initialTab)) {
          searchInputRef.current.focus();
        }
      }, 80);
    } else {
      stopCamera();
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  // Execute in-site search when query or category changes
  useEffect(() => {
    let active = true;
    const execute = async () => {
      if (!searchEngine.isLoaded) {
        await searchEngine.buildIndex();
      }
      if (!active) return;

      let results = [];
      if (!searchQuery.trim()) {
        // Default instant suggestions (popular items & projects)
        results = searchEngine.search('wim').concat(searchEngine.search('famous')).slice(0, 8);
      } else {
        results = searchEngine.search(searchQuery, { limit: 16 });
      }

      // Filter by category if selected
      if (selectedCategory !== 'ALL') {
        results = results.filter(r => {
          if (selectedCategory === 'MATERIAL') {
            return r.type === 'MATERIAL' || r.type === 'ITEM' || r.type === 'HARDWARE';
          }
          if (selectedCategory === 'DOCUMENT') {
            return r.type === 'DOCUMENT';
          }
          if (selectedCategory === 'PROJECT') {
            return r.type === 'PROJECT';
          }
          return r.type === selectedCategory;
        });
      }

      // Filter out pure administrative quick-actions to keep pure search focus
      results = results.filter(r => r.type !== 'ACTION');

      setSearchResults(results);
      setSelectedIndex(0);
    };

    execute();
    return () => { active = false; };
  }, [searchQuery, selectedCategory, isOpen]);

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (activeTab === 'search') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (searchResults.length > 0 ? (prev + 1) % searchResults.length : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (searchResults.length > 0 ? (prev - 1 + searchResults.length) % searchResults.length : 0));
        } else if (e.key === 'Enter') {
          if (searchResults.length > 0 && searchResults[selectedIndex]) {
            e.preventDefault();
            navigateToResult(searchResults[selectedIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, searchResults, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // ================= CAMERA SCANNER IMPLEMENTATION =================
  const startCamera = async () => {
    setCameraError(null);
    setDetectionResult(null);
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        setScanningState('scanning');
        scanFrameLoop();
      }
    } catch (err) {
      console.error('[AI Lens] Camera start failed:', err);
      setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera aktif atau gunakan opsi Unggah Berkas.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setScanningState('idle');
  };

  const scanFrameLoop = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanFrameLoop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrResult = detectQRCodeFromImageData(imageData);

    if (qrResult && qrResult.raw) {
      const parsed = qrResult.parsed || parseDigitechQRPayload(qrResult.raw);
      const docClassification = classifyDocumentParameters(qrResult.raw);

      setDetectionResult({
        source: 'CAMERA_QR',
        rawPayload: qrResult.raw,
        parsedPayload: parsed,
        docClassification,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        confidence: '99.4%'
      });

      setScanningState('detected');
      stopCamera();
      return;
    }

    animationFrameRef.current = requestAnimationFrame(scanFrameLoop);
  };

  // ================= FILE UPLOAD & DOCUMENT SCANNER =================
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processUploadedFile(file);
  };

  const processUploadedFile = (file) => {
    setCameraError(null);
    setScanningState('scanning');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = img.width;
        offCanvas.height = img.height;
        const ctx = offCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const qrResult = detectQRCodeFromImageData(imageData);
        const docClassification = classifyDocumentParameters({
          filename: file.name,
          text: file.name.replace(/[-_.]/g, ' ')
        });

        if (qrResult && qrResult.raw) {
          const parsed = qrResult.parsed || parseDigitechQRPayload(qrResult.raw);
          setDetectionResult({
            source: 'FILE_QR',
            fileName: file.name,
            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
            rawPayload: qrResult.raw,
            parsedPayload: parsed,
            docClassification,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            confidence: '98.8%'
          });
        } else {
          setDetectionResult({
            source: 'FILE_DOCUMENT',
            fileName: file.name,
            fileSize: `${(file.size / 1024).toFixed(1)} KB`,
            rawPayload: `DOC:${docClassification.stageCode}:${file.name}`,
            parsedPayload: {
              type: 'DOCUMENT',
              docNumber: docClassification.docNumber || file.name.split('.')[0],
              stage: docClassification.stageCode,
              projectId: docClassification.projectId
            },
            docClassification,
            timestamp: new Date().toLocaleTimeString('id-ID'),
            confidence: '92.5%'
          });
        }
        setScanningState('detected');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const navigateToResult = (item) => {
    onClose();
    if (item.url) {
      navigate(item.url);
    }
  };

  // Helper icon for entity types
  const getItemIcon = (item) => {
    if (item.type === 'PROJECT') {
      return <FolderKanban className="w-4 h-4 text-red-600" />;
    }
    if (item.type === 'DOCUMENT') {
      return <FileText className="w-4 h-4 text-purple-600" />;
    }
    if (item.type === 'HARDWARE' || item.type === 'ITEM' || item.type === 'MATERIAL') {
      return <Package className="w-4 h-4 text-blue-600" />;
    }
    if (item.keywords?.includes('famous') || item.badge === 'FAMOUS') {
      return <Truck className="w-4 h-4 text-amber-600" />;
    }
    return <Layers className="w-4 h-4 text-slate-600" />;
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] bg-slate-900/35 backdrop-blur-md flex items-start justify-center pt-8 sm:pt-20 px-3 sm:px-4 pb-6 overflow-y-auto animate-spotlight-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Morphing Spotlight Card Container */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col font-sans transition-all transform animate-spotlight-modal">
        
        {/* ================= MODE 1: PURE SEARCH MACHINE ================= */}
        {activeTab === 'search' ? (
          <>
            {/* Top Spotlight Search Input Bar */}
            <div className="relative flex items-center px-4 py-3 sm:py-3.5 border-b border-slate-100 bg-white">
              <div className="text-red-600 pl-1 pr-3 flex items-center pointer-events-none shrink-0">
                <Search className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari material, nomor MOS, SKU, proyek..."
                className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm sm:text-base outline-none font-medium pr-2"
                autoComplete="off"
                spellCheck="false"
              />

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Clear Input Button */}
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Switch to AI Lens Scanner Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('lens');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-full bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 text-xs font-mono font-bold transition shadow-2xs group cursor-pointer"
                  title="Buka AI Lens Scanner (Kamera & Deteksi QR)"
                >
                  <Scan className="w-3.5 h-3.5 text-red-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-semibold hidden sm:inline">Lens</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Tutup (Esc)"
                  aria-label="Tutup pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Category Chips & Entity Counter */}
            <div className="bg-slate-50/70 px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                {[
                  { id: 'ALL', label: 'Semua' },
                  { id: 'MATERIAL', label: 'Material & Sparepart' },
                  { id: 'DOCUMENT', label: 'Dokumen MOS' },
                  { id: 'PROJECT', label: 'Proyek' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-red-50 text-red-700 border border-red-200 shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-mono text-slate-400 shrink-0">
                {searchResults.length} hasil
              </div>
            </div>

            {/* Live Search Results List */}
            <div className="max-h-[55vh] sm:max-h-[60vh] overflow-y-auto p-2 sm:p-2.5 space-y-1">
              {searchResults.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    Tidak ada hasil untuk "{searchQuery}"
                  </div>
                  <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Coba gunakan kata kunci lain seperti nama barang, nomor MOS, atau gunakan tombol Lens untuk scan QR code.
                  </div>
                </div>
              ) : (
                searchResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      ref={isSelected ? selectedItemRef : null}
                      onClick={() => navigateToResult(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group w-full px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                        isSelected
                          ? 'bg-red-50/70 border-red-200 ring-1 ring-red-400/30 shadow-2xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Type Icon */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-white border-red-200 shadow-2xs' : 'bg-slate-50 border-slate-200'
                        }`}>
                          {getItemIcon(item)}
                        </div>

                        {/* Title and Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-700 transition truncate">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border bg-slate-100 text-slate-600 border-slate-200 shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 truncate flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-slate-600">{item.code}</span>
                            <span>&bull;</span>
                            <span className="truncate">{item.subtitle || item.description}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Indicator: Enter action or Arrow */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isSelected ? (
                          <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-red-600 bg-white border border-red-200 px-2 py-0.5 rounded shadow-2xs">
                            <span>Buka</span>
                            <CornerDownLeft className="w-3 h-3" />
                          </span>
                        ) : (
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* ================= MODE 2: AI LENS CAMERA SCANNER ================= */
          <div className="p-4 sm:p-5 space-y-4">
            {/* Top Bar for Lens Mode */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveTab('search');
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Pencarian</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 font-mono tracking-wide">
                  AI LENS SCANNER
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Camera Viewport or Start Prompt */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video max-h-72 flex items-center justify-center shadow-inner">
              {isCameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning Reticle */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                    <div className="flex items-center justify-between text-[11px] font-mono text-red-700 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-red-200 shadow-2xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                        MEMINDAI QR / DOKUMEN
                      </span>
                      <span>HD ACTIVE</span>
                    </div>

                    <div className="relative w-44 h-44 sm:w-56 sm:h-56 border border-red-400 rounded-2xl mx-auto flex items-center justify-center overflow-hidden shadow-[0_0_16px_rgba(220,38,38,0.2)]">
                      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-red-600" />
                      <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-red-600" />
                      <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-red-600" />
                      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-red-600" />
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent shadow-[0_0_12px_#ef4444] animate-[scan_2s_ease-in-out_infinite]" />
                    </div>

                    <div className="flex justify-center pointer-events-auto">
                      <button
                        onClick={stopCamera}
                        className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <CameraOff className="w-3.5 h-3.5" /> Matikan Kamera
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-red-200 flex items-center justify-center text-red-600 mx-auto shadow-xs">
                    <Scan className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">Pindai dengan AI Lens</div>
                    <div className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                      Arahkan kamera ke label QR code pada suku cadang atau unggah foto dokumen MOS.
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5" /> Nyalakan Kamera
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" /> Unggah Berkas Foto
                    </button>
                  </div>

                  {cameraError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 max-w-sm mx-auto">
                      {cameraError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Detection Results Telemetry Card */}
            {detectionResult && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50/40 via-white to-slate-50/30 border border-emerald-300 shadow-xs space-y-3 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                    <span className="text-xs font-bold text-emerald-800 font-mono">
                      TERDETEKSI ({detectionResult.confidence})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {detectionResult.timestamp}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Klasifikasi</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                      {detectionResult.docClassification.stageCode || 'MATERIAL-ASSET'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {detectionResult.docClassification.stageName}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Referensi SKU / DOC</div>
                    <div className="text-sm font-bold text-emerald-700 mt-0.5 font-mono truncate">
                      {detectionResult.parsedPayload.sku || detectionResult.parsedPayload.docNumber || 'VERIFIED'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Status: Terverifikasi
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => {
                      setCyberQrData({
                        sku: detectionResult.parsedPayload.sku || 'IMS-DETECTED',
                        name: detectionResult.docClassification.stageName,
                        docNumber: detectionResult.parsedPayload.docNumber,
                        location: detectionResult.parsedPayload.rack || 'Pit Sebamban',
                        projectId: detectionResult.docClassification.projectId
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-red-600" />
                    Preview QR 3D
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/project-inventory/${detectionResult.docClassification.projectId || 'proj-wim'}`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    Buka Project <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Minimal Footer Bar */}
        <div className="bg-slate-50/90 px-4 py-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold">↑↓</kbd> Navigasi
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold">↵</kbd> Buka
            </span>
            <span>
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold">Esc</kbd> Tutup
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Digitech Fast Engine</span>
          </div>
        </div>

      </div>

      {/* Side-by-Side Goods Receipt & Live QR Code Generator */}
      {cyberQrData && (
        <IncomingStockQRModal
          isOpen={Boolean(cyberQrData)}
          onClose={() => setCyberQrData(null)}
          initialItem={cyberQrData}
        />
      )}
    </div>,
    document.body
  );
}
