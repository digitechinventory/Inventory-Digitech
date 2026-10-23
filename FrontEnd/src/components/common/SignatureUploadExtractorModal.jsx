import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  Sliders,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  RefreshCw,
  Crop,
  Layers,
  ZoomIn,
  ShieldCheck,
  Palette
} from 'lucide-react';
import api from '../../api/client.js';

/**
 * SignatureUploadExtractorModal
 * 
 * Allows users to upload a signature from a local image (.png, .jpg, .jpeg, .webp)
 * or PDF file (.pdf). Automatically removes the paper background, turning it into
 * a clean, transparent PNG preserving ink strokes with anti-aliasing.
 */
export default function SignatureUploadExtractorModal({
  isOpen,
  onClose,
  onSave,
  currentUser
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState(''); // 'image' | 'pdf'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Source image loaded in memory
  const [sourceImg, setSourceImg] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);

  // Background removal sensitivity parameters
  const [threshold, setThreshold] = useState(205); // 140 to 240
  const [inkColor, setInkColor] = useState('navy'); // 'navy' | 'blue' | 'black' | 'original'
  const [contrastBoost, setContrastBoost] = useState(1.2);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle file selection (Image or PDF)
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSelectedFile(file);
    setFileName(file.name);
    setLoading(true);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setFileType(isPdf ? 'pdf' : 'image');

    try {
      if (isPdf) {
        // Convert PDF to image via backend service
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Pdf = reader.result;
            const res = await api.post('/mos/convert-pdf', {
              pdf: base64Pdf,
              max_pages: 1
            });

            if (res.data?.data?.pages?.[0]?.image_data) {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                setSourceImg(img);
                processExtraction(img, threshold, inkColor, contrastBoost);
                setLoading(false);
              };
              img.src = res.data.data.pages[0].image_data;
            } else {
              throw new Error('Gagal merender halaman pertama file PDF.');
            }
          } catch (err) {
            setErrorMsg(err.response?.data?.error?.message || err.message || 'Gagal memproses file PDF.');
            setLoading(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Native image file
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            setSourceImg(img);
            processExtraction(img, threshold, inkColor, contrastBoost);
            setLoading(false);
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setErrorMsg('Gagal membaca file: ' + err.message);
      setLoading(false);
    }
  };

  // Computer Vision: Background removal & ink extraction with smooth alpha
  const processExtraction = (img, threshVal, colorOption, contrast) => {
    if (!img) return;

    const canvas = document.createElement('canvas');
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    // Max processing dimension to keep UI fast while preserving ultra clarity
    const maxDim = 1200;
    let targetW = width;
    let targetH = height;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        targetW = maxDim;
        targetH = Math.round((height / width) * maxDim);
      } else {
        targetH = maxDim;
        targetW = Math.round((width / height) * maxDim);
      }
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;

    let minX = targetW;
    let minY = targetH;
    let maxX = 0;
    let maxY = 0;
    let inkPixelCount = 0;

    // RGB targets for color re-inking
    const rgbColors = {
      navy: [15, 23, 42],     // #0F172A Dark Navy Slate
      blue: [30, 64, 175],    // #1E40AF Corporate Royal Blue
      black: [17, 24, 39]     // #111827 Pure Charcoal Black
    };

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Perceived luminance
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

      const pixelIdx = i / 4;
      const px = pixelIdx % targetW;
      const py = Math.floor(pixelIdx / targetW);

      if (luminance < threshVal) {
        // Dark ink detected
        const darkness = (threshVal - luminance) / threshVal;
        const alpha = Math.min(255, Math.floor(darkness * 280 * contrast + 40));

        if (colorOption !== 'original' && rgbColors[colorOption]) {
          const [nr, ng, nb] = rgbColors[colorOption];
          data[i] = nr;
          data[i + 1] = ng;
          data[i + 2] = nb;
        }
        data[i + 3] = alpha;

        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
        inkPixelCount++;
      } else {
        // Background paper: Make 100% transparent
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Auto-crop to ink bounding box with a 14px cushion padding
    if (inkPixelCount > 20 && maxX > minX && maxY > minY) {
      const pad = 14;
      const cropX = Math.max(0, minX - pad);
      const cropY = Math.max(0, minY - pad);
      const cropW = Math.min(targetW - cropX, (maxX - minX) + pad * 2);
      const cropH = Math.min(targetH - cropY, (maxY - minY) + pad * 2);

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropW;
      croppedCanvas.height = cropH;
      const cropCtx = croppedCanvas.getContext('2d');
      cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const finalUrl = croppedCanvas.toDataURL('image/png');
      setPreviewResult(finalUrl);
    } else {
      setPreviewResult(canvas.toDataURL('image/png'));
    }
  };

  // Re-run filter on parameter changes
  const handleParamChange = (newThresh, newColor, newContrast) => {
    setThreshold(newThresh);
    setInkColor(newColor);
    setContrastBoost(newContrast);
    if (sourceImg) {
      processExtraction(sourceImg, newThresh, newColor, newContrast);
    }
  };

  // Save the extracted signature
  const handleConfirmSave = async () => {
    if (!previewResult) {
      setErrorMsg('Belum ada tanda tangan yang berhasil diekstrak.');
      return;
    }

    setLoading(true);
    try {
      // 1. Save in local storage for instant offline access
      const userKey = currentUser?.id || 'current_user';
      localStorage.setItem(`digitech_signature_${userKey}`, previewResult);

      // 2. Persist to backend user profile
      try {
        await api.post('/users/signature', {
          signature: previewResult
        });
      } catch (e) {
        console.warn('Backend signature persist warning:', e.message);
      }

      onSave?.(previewResult);
      onClose();
    } catch (err) {
      setErrorMsg('Gagal menyimpan tanda tangan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/30 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Upload &amp; Ekstrak Tanda Tangan</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Auto Hapus Background
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Unggah file PDF atau foto tanda tangan, sistem otomatis menjadikannya transparan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-red-500 bg-slate-50/50 hover:bg-red-50/20 rounded-3xl p-6 text-center cursor-pointer transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-600 group-hover:text-red-600 group-hover:border-red-200 flex items-center justify-center mx-auto mb-3 transition-colors">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              {fileName ? fileName : 'Pilih File Tanda Tangan (PDF / Foto)'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Mendukung dokumen PDF, PNG, JPG, atau WEBP. Ukuran maks 10MB.
            </p>
            {fileType && (
              <span className="inline-block mt-2 text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Format: {fileType.toUpperCase()}
              </span>
            )}
          </div>

          {/* 2. Loading Indicator */}
          {loading && (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto" />
              <div className="text-sm font-semibold text-slate-700">
                Memproses dan menghapus latar belakang kertas...
              </div>
            </div>
          )}

          {/* 3. Live Preview & AI Tuning Controls */}
          {previewResult && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Hasil Ekstraksi (Latar Transparan)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Siap di-drag &amp; drop ke dokumen
                </span>
              </div>

              {/* Transparent Checkerboard Canvas View */}
              <div
                className="relative w-full h-44 rounded-2xl border-2 border-slate-200 overflow-hidden flex items-center justify-center p-4"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                }}
              >
                <img
                  src={previewResult}
                  alt="Extracted Signature"
                  className="max-h-36 max-w-full object-contain filter drop-shadow-sm transition-all"
                />
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200 text-[10px] font-mono text-slate-600 font-medium">
                  PNG 32-bit Transparent
                </div>
              </div>

              {/* Parameter Adjustments (Threshold & Contrast & Color) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sensitivitas Hapus Background:</span>
                  </span>
                  <span className="font-mono font-bold text-red-600">{threshold}</span>
                </div>
                <input
                  type="range"
                  min="130"
                  max="245"
                  step="1"
                  value={threshold}
                  onChange={(e) => handleParamChange(Number(e.target.value), inkColor, contrastBoost)}
                  className="w-full accent-red-600 cursor-pointer"
                />

                {/* Color and Contrast */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                      Warna Tinta Digital:
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[
                        { key: 'navy', label: 'Dark Navy', bg: 'bg-[#0F172A]' },
                        { key: 'blue', label: 'Royal Blue', bg: 'bg-[#1E40AF]' },
                        { key: 'black', label: 'Hitam Pekat', bg: 'bg-[#111827]' },
                        { key: 'original', label: 'Asli', bg: 'bg-gradient-to-r from-blue-700 to-slate-900' }
                      ].map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => handleParamChange(threshold, c.key, contrastBoost)}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1 border transition-all ${
                            inkColor === c.key
                              ? 'border-red-600 bg-white text-red-700 shadow-sm'
                              : 'border-slate-200 bg-white/60 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${c.bg} shrink-0`} />
                          <span className="truncate">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                      <span>Ketajaman Garis Tinta:</span>
                      <span className="font-mono text-red-600">{contrastBoost}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="2.0"
                      step="0.1"
                      value={contrastBoost}
                      onChange={(e) => handleParamChange(threshold, inkColor, Number(e.target.value))}
                      className="w-full accent-red-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={!previewResult || loading}
            onClick={handleConfirmSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Simpan Tanda Tangan Saya</span>
          </button>
        </div>

      </div>
    </div>
  );
}
