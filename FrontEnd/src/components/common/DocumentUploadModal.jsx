import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  FileCheck,
  X,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Building2,
  Calendar,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  User,
  Users,
  ShieldCheck,
  MapPin,
  Truck,
  Edit3,
  Phone,
  Hash,
  Tag,
  FileSpreadsheet,
  Info,
  Check,
  Clock,
  Wrench,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import api from '../../api/client.js';

/**
 * Standard Presets for quick autofill
 */
const PRESETS = {
  MOS_LOADCELL_8: [
    { id: 'm1', name: 'LOADCELL INTERCOMP', category: 'Sensor & Loadcell', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91913187', qty_received: 1, qty_do: 1, unit: 'PCS', condition: 'Baru', warranty: '550k weighing cycle', bin_location: 'RAK-LC-01', notes: 'Kondisi segel utuh pabrik' },
    { id: 'm2', name: 'LOADCELL INTERCOMP', category: 'Sensor & Loadcell', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '92309683', qty_received: 1, qty_do: 1, unit: 'PCS', condition: 'Baru', warranty: '550k weighing cycle', bin_location: 'RAK-LC-01', notes: 'Kondisi segel utuh pabrik' },
    { id: 'm3', name: 'LOADCELL INTERCOMP', category: 'Sensor & Loadcell', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '92285794', qty_received: 1, qty_do: 1, unit: 'PCS', condition: 'Baru', warranty: '550k weighing cycle', bin_location: 'RAK-LC-01', notes: 'Kondisi segel utuh pabrik' },
    { id: 'm4', name: 'LOADCELL INTERCOMP', category: 'Sensor & Loadcell', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91913138', qty_received: 1, qty_do: 1, unit: 'PCS', condition: 'Baru', warranty: '550k weighing cycle', bin_location: 'RAK-LC-01', notes: 'Kondisi segel utuh pabrik' },
    { id: 'm5', name: 'LOADCELL INTERCOMP', category: 'Sensor & Loadcell', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '92309753', qty_received: 1, qty_do: 1, unit: 'PCS', condition: 'Baru', warranty: '550k weighing cycle', bin_location: 'RAK-LC-01', notes: 'Kondisi segel utuh pabrik' },
    { id: 'm6', name: 'LOADCELL INTERCOMP', category: 'Sensor & Loadcell', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91913125', qty_received: 1, qty_do: 1, unit: 'PCS', condition: 'Baru', warranty: '550k weighing cycle', bin_location: 'RAK-LC-01', notes: 'Kondisi segel utuh pabrik' },
    { id: 'm7', name: 'LOADCELL INTERCOMP', category: 'Sensor & Loadcell', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '92309685', qty_received: 1, qty_do: 1, unit: 'PCS', condition: 'Baru', warranty: '550k weighing cycle', bin_location: 'RAK-LC-01', notes: 'Kondisi segel utuh pabrik' },
    { id: 'm8', name: 'LOADCELL INTERCOMP', category: 'Sensor & Loadcell', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '92285792', qty_received: 1, qty_do: 1, unit: 'PCS', condition: 'Baru', warranty: '550k weighing cycle', bin_location: 'RAK-LC-01', notes: 'Kondisi segel utuh pabrik' }
  ],
  AX920_PLATFORM_4: [
    { id: 'm9', name: 'AX920 PLATFORM MOUNT', category: 'Heavy Structure', spec: 'UC50-30 Heavy Duty Steel Mount', sn: 'VGT-MNTG-01', qty_received: 1, qty_do: 1, unit: 'SET', condition: 'Baru', warranty: '1 Tahun', bin_location: 'YARD-B1', notes: 'Mounting scale plate' },
    { id: 'm10', name: 'AX920 PLATFORM MOUNT', category: 'Heavy Structure', spec: 'UC50-30 Heavy Duty Steel Mount', sn: 'VGT-MNTG-02', qty_received: 1, qty_do: 1, unit: 'SET', condition: 'Baru', warranty: '1 Tahun', bin_location: 'YARD-B1', notes: 'Mounting scale plate' },
    { id: 'm11', name: 'AX920 PLATFORM MOUNT', category: 'Heavy Structure', spec: 'UC50-30 Heavy Duty Steel Mount', sn: 'VGT-MNTG-03', qty_received: 1, qty_do: 1, unit: 'SET', condition: 'Baru', warranty: '1 Tahun', bin_location: 'YARD-B1', notes: 'Mounting scale plate' },
    { id: 'm12', name: 'AX920 PLATFORM MOUNT', category: 'Heavy Structure', spec: 'UC50-30 Heavy Duty Steel Mount', sn: 'VGT-MNTG-04', qty_received: 1, qty_do: 1, unit: 'SET', condition: 'Baru', warranty: '1 Tahun', bin_location: 'YARD-B1', notes: 'Mounting scale plate' }
  ],
  MDT_DISMANTLING_4: [
    { id: 'd1', name: 'LOADCELL INTERCOMP', category: 'Sensor & Loadcell', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91066926', qty_received: 1, qty_do: 0, unit: 'PCS', condition: 'Dummy', warranty: '550k weighing cycle', bin_location: 'SCRAP-W1', notes: 'Diganti dengan Loadcell Bosche' },
    { id: 'd2', name: 'LOADCELL INTERCOMP', category: 'Sensor & Loadcell', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91066930', qty_received: 1, qty_do: 0, unit: 'PCS', condition: 'Rusak', warranty: '550k weighing cycle', bin_location: 'SCRAP-W1', notes: 'Kabel sensor putus / bodi patah' },
    { id: 'd3', name: 'LOADCELL INTERCOMP', category: 'Sensor & Loadcell', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91066923', qty_received: 1, qty_do: 0, unit: 'PCS', condition: 'Dummy', warranty: '550k weighing cycle', bin_location: 'SCRAP-W1', notes: 'Diganti dengan Loadcell Bosche' },
    { id: 'd4', name: 'LOADCELL INTERCOMP', category: 'Sensor & Loadcell', spec: 'INTERCOMP Loadcell double ended shear beam', sn: '91508649', qty_received: 1, qty_do: 0, unit: 'PCS', condition: 'Dummy', warranty: '550k weighing cycle', bin_location: 'SCRAP-W1', notes: 'Diganti dengan Loadcell Bosche' }
  ]
};

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  editDocument = null,
  defaultTab = 'template'
}) {
  const isEditMode = Boolean(editDocument);
  const [activeTab, setActiveTab] = useState(defaultTab); // 'template' | 'local'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Template Selection State ──
  const [selectedTemplate, setSelectedTemplate] = useState(editDocument?.template_type || 'MOS'); // 'MOS' | 'MDT' | 'MRP'

  // ── Section 1: Identitas & Penomoran Dokumen Lengkap ──
  const [docNumber, setDocNumber] = useState('');
  const [docDate, setDocDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [poDoNumber, setPoDoNumber] = useState('-');
  const [doSjNumber, setDoSjNumber] = useState('-');
  const [woSpkNumber, setWoSpkNumber] = useState('-');
  const [department, setDepartment] = useState('Workshop & Fleet Maintenance');
  const [urgency, setUrgency] = useState('Normal'); // 'Normal' | 'Urgent' | 'Emergency'
  const [packageCondition, setPackageCondition] = useState('Baik');
  const [docTitle, setDocTitle] = useState('MATERIAL ON SITE');
  const [docSubtitle, setDocSubtitle] = useState('BERITA ACARA VERIFIKASI & PENERIMAAN MATERIAL SITE');

  // ── Section 2: Rute Alur Pengiriman (Dari Siapa ➔ Akan Kemana) ──
  // Sisi Pengirim (Asal)
  const [originLocation, setOriginLocation] = useState('Office VGT');
  const [originSpecificArea, setOriginSpecificArea] = useState('Main Warehouse Bay 1');
  const [senderName, setSenderName] = useState(currentUser?.full_name || 'Rayhans Najib Al-Faruq');
  const [senderRole, setSenderRole] = useState(currentUser?.role === 'Admin' ? 'Supervisor Logistik' : 'Teknisi VGT');
  const [senderPhone, setSenderPhone] = useState('0812-3456-7890');

  // Sisi Penerima (Tujuan)
  const [destinationLocation, setDestinationLocation] = useState('BIB Pit Sebamban KM-14');
  const [destinationSpecificArea, setDestinationSpecificArea] = useState('Pitstop Area KM-14');
  const [destinationReceiver, setDestinationReceiver] = useState('Team Mekanik Pit');
  const [receiverRole, setReceiverRole] = useState('Field Mechanical Lead');
  const [receiverPhone, setReceiverPhone] = useState('0821-9876-5432');

  // Transportasi & Peruntukan
  const [transportMode, setTransportMode] = useState('Armada Internal VGT (Truck Pickup)');
  const [driverName, setDriverName] = useState('Bpk. Mulyadi (KT 8821 BB)');
  const [unitTargeted, setUnitTargeted] = useState('Unit Jembatan Timbang WIM KM 13 / Fleet HD-785');
  const [purpose, setPurpose] = useState('Verifikasi fisik dan penerimaan material/sparepart baru di area gudang site.');

  // ── Section 3: Catatan Teknis & Kronologi ──
  const [notesJustification, setNotesJustification] = useState('Barang diterima sesuai spesifikasi Purchase Order. Dilakukan pengecekan fisik menyeluruh dan serial number tercatat lengkap.');

  // ── Section 4: Alur Otorisasi 3 Slot (Approval untuk Siapa) ──
  const [approvalMakerName, setApprovalMakerName] = useState(currentUser?.full_name || 'Rayhans Najib Al-Faruq');
  const [approvalMakerRole, setApprovalMakerRole] = useState('Teknisi VGT');
  const [approvalMakerDept, setApprovalMakerDept] = useState('Teknisi Operasional');

  const [approvalCheckerName, setApprovalCheckerName] = useState('Zainal Fahriandy');
  const [approvalCheckerRole, setApprovalCheckerRole] = useState('Supervisor VGT');
  const [approvalCheckerDept, setApprovalCheckerDept] = useState('Gudang & Logistik');

  const [approvalApproverName, setApprovalApproverName] = useState('Harris');
  const [approvalApproverRole, setApprovalApproverRole] = useState('Digitech');
  const [approvalApproverDept, setApprovalApproverDept] = useState('Head of Operation');

  // ── Section 5: Daftar Barang / Material ──
  const [items, setItems] = useState([]);

  // ── Local Upload State ──
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [orientation, setOrientation] = useState('landscape');
  const [convertedPages, setConvertedPages] = useState([]);

  const fileInputRef = useRef(null);

  // Helper generate client fallback
  const generateClientDocNumber = (type) => {
    const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
    const year = new Date().getFullYear();
    const typeCode = type === 'MDT' ? 'MDT' : type === 'MRP' ? 'MRP' : type === 'CUSTOM' ? 'DOC' : 'MOS';
    const randSeq = Math.floor(Math.random() * 800) + 10;
    return `${String(randSeq).padStart(3, '0')}/VGT/${typeCode}/MNTOA/BIBOA/${monthRoman}/${year}`;
  };

  // Fetch unique number from backend
  const fetchUniqueNumber = async (type) => {
    try {
      const res = await api.get(`/mos/next-number?type=${type}`);
      if (res.data?.data?.doc_number) {
        setDocNumber(res.data.data.doc_number);
        return;
      }
    } catch {}
    setDocNumber(generateClientDocNumber(type));
  };

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (editDocument) {
      setActiveTab(editDocument.template_type === 'CUSTOM' ? 'local' : 'template');
      setSelectedTemplate(editDocument.template_type || 'MOS');
      setDocNumber(editDocument.doc_number || '');
      setDocDate(editDocument.received_date || new Date().toISOString().split('T')[0]);
      setRequiredDate(editDocument.required_date || editDocument.received_date || new Date().toISOString().split('T')[0]);
      setPoDoNumber(editDocument.po_do_number || '-');
      setDoSjNumber(editDocument.do_sj_number || '-');
      setWoSpkNumber(editDocument.wo_spk_number || '-');
      setDepartment(editDocument.department || 'Workshop & Fleet Maintenance');
      setUrgency(editDocument.urgency || 'Normal');
      setPackageCondition(editDocument.package_condition || 'Baik');
      setDocTitle(editDocument.title || '');
      setDocSubtitle(editDocument.subtitle || '');

      setOriginLocation(editDocument.origin_location || 'Office VGT');
      setOriginSpecificArea(editDocument.origin_specific_area || 'Main Warehouse Bay 1');
      setSenderName(editDocument.sender_name || currentUser?.full_name || 'Rayhans Najib Al-Faruq');
      setSenderRole(editDocument.sender_role || 'Teknisi VGT');
      setSenderPhone(editDocument.sender_phone || '0812-3456-7890');

      setDestinationLocation(editDocument.destination_location || editDocument.site_location || 'BIB Pit Sebamban KM-14');
      setDestinationSpecificArea(editDocument.destination_specific_area || 'Pitstop Area KM-14');
      setDestinationReceiver(editDocument.destination_receiver || editDocument.pic_receiver_name || 'Team Mekanik Pit');
      setReceiverRole(editDocument.receiver_role || 'Field Mechanical Lead');
      setReceiverPhone(editDocument.receiver_phone || '0821-9876-5432');

      setTransportMode(editDocument.transport_mode || 'Armada Internal VGT');
      setDriverName(editDocument.driver_name || '-');
      setUnitTargeted(editDocument.unit_targeted || '-');
      setPurpose(editDocument.purpose || 'Verifikasi dan serah terima material operasional di site');
      setNotesJustification(editDocument.notes_justification || '');

      setApprovalMakerName(editDocument.approval_maker_name || editDocument.sender_name || 'Rayhans Najib Al-Faruq');
      setApprovalMakerRole(editDocument.approval_maker_role || 'Teknisi VGT');
      setApprovalMakerDept(editDocument.approval_maker_dept || 'Teknisi Operasional');

      setApprovalCheckerName(editDocument.approval_checker_name || 'Zainal Fahriandy');
      setApprovalCheckerRole(editDocument.approval_checker_role || 'Supervisor VGT');
      setApprovalCheckerDept(editDocument.approval_checker_dept || 'Gudang & Logistik');

      setApprovalApproverName(editDocument.approval_approver_name || 'Harris');
      setApprovalApproverRole(editDocument.approval_approver_role || 'Digitech');
      setApprovalApproverDept(editDocument.approval_approver_dept || 'Head of Operation');

      setItems(Array.isArray(editDocument.items) ? [...editDocument.items] : []);
      setOrientation(editDocument.orientation || 'landscape');
      setConvertedPages(editDocument.pages || []);
    } else {
      setActiveTab(defaultTab || 'template');
      setSelectedTemplate('MOS');
      setDocDate(new Date().toISOString().split('T')[0]);
      const next3Days = new Date();
      next3Days.setDate(next3Days.getDate() + 3);
      setRequiredDate(next3Days.toISOString().split('T')[0]);
      setPoDoNumber('-');
      setDoSjNumber('-');
      setWoSpkNumber('SPK-2026/VGT-BIB/014');
      setDepartment('Workshop & Fleet Maintenance');
      setUrgency('Normal');
      setPackageCondition('Baik');
      setDocTitle('MATERIAL ON SITE');
      setDocSubtitle('BERITA ACARA VERIFIKASI & PENERIMAAN MATERIAL SITE');

      setOriginLocation('Office VGT');
      setOriginSpecificArea('Main Warehouse Bay 1');
      setSenderName(currentUser?.full_name || 'Rayhans Najib Al-Faruq');
      setSenderRole(currentUser?.role === 'Admin' ? 'Supervisor Logistik' : 'Teknisi VGT');
      setSenderPhone('0812-3456-7890');

      setDestinationLocation('BIB Pit Sebamban KM-14');
      setDestinationSpecificArea('Pitstop Area KM-14');
      setDestinationReceiver('Team Mekanik Pit');
      setReceiverRole('Field Mechanical Lead');
      setReceiverPhone('0821-9876-5432');

      setTransportMode('Armada Internal VGT (Truck Pickup)');
      setDriverName('Bpk. Mulyadi (KT 8821 BB)');
      setUnitTargeted('Unit Jembatan Timbang WIM KM 13 / Fleet HD-785');
      setPurpose('Verifikasi fisik dan penerimaan material/sparepart baru di area gudang site.');
      setNotesJustification('Barang diterima sesuai spesifikasi Purchase Order. Dilakukan pengecekan fisik menyeluruh dan serial number tercatat lengkap.');

      setApprovalMakerName(currentUser?.full_name || 'Rayhans Najib Al-Faruq');
      setApprovalMakerRole('Teknisi VGT');
      setApprovalMakerDept('Teknisi Operasional');

      setApprovalCheckerName('Zainal Fahriandy');
      setApprovalCheckerRole('Supervisor VGT');
      setApprovalCheckerDept('Gudang & Logistik');

      setApprovalApproverName('Harris');
      setApprovalApproverRole('Digitech');
      setApprovalApproverDept('Head of Operation');

      fetchUniqueNumber('MOS');
      loadTemplateDefaults('MOS');
    }
  }, [isOpen, editDocument, defaultTab]);

  // Load template defaults
  const loadTemplateDefaults = async (tplType) => {
    try {
      const res = await api.get('/mos/templates');
      const tplData = res.data?.data?.[tplType];
      if (tplData) {
        setDocTitle(tplData.title || '');
        setDocSubtitle(tplData.subtitle || '');
        if (tplType === 'MDT') {
          setOriginLocation('WIM KM 13');
          setOriginSpecificArea('Scale Pit 1');
          setDestinationLocation('Workshop Central VGT');
          setDestinationSpecificArea('Area Servis Kalibrasi');
          setDestinationReceiver('Zainal Fahriandy');
          setPurpose('Pelepasan & pembongkaran loadcell/material dummy atau rusak di site WIM.');
          setPackageCondition('Barang dummy');
          setNotesJustification('Pelepasan loadcell dummy lama yang mengalami keausan untuk digantikan dengan sparepart baru.');
        } else if (tplType === 'MRP') {
          setOriginLocation('Central Warehouse Batulicin');
          setOriginSpecificArea('Storage Room A');
          setDestinationLocation('WIM KM 13');
          setDestinationSpecificArea('Platform Timbang');
          setDestinationReceiver('Teknisi Lapangan WIM');
          setPurpose('Pemasangan dan penggantian material suku cadang baru pada unit site.');
          setPackageCondition('Barang baru');
          setNotesJustification('Penggantian komponen loadcell baru garansi 550k weighing cycle guna menunjang akurasi penimbangan hauling.');
        } else {
          setOriginLocation('Office VGT');
          setOriginSpecificArea('Main Warehouse Bay 1');
          setDestinationLocation('BIB Pit Sebamban KM-14');
          setDestinationSpecificArea('Pitstop Area KM-14');
          setDestinationReceiver('Team Mekanik Pit');
          setPurpose('Verifikasi fisik dan penerimaan material/sparepart baru di area gudang site.');
          setPackageCondition('Baik');
          setNotesJustification('Barang diterima sesuai spesifikasi Purchase Order. Dilakukan pengecekan fisik menyeluruh dan serial number tercatat lengkap.');
        }
        if (Array.isArray(tplData.defaultItems)) {
          setItems(tplData.defaultItems.map((item, idx) => ({
            ...item,
            id: item.id || `item-${idx + 1}`,
            category: item.category || 'Sparepart & Sensor',
            unit: item.unit || 'PCS',
            bin_location: item.bin_location || 'RAK-01'
          })));
        }
      }
    } catch {
      // Fallback preset
      if (tplType === 'MDT') {
        setItems(PRESETS.MDT_DISMANTLING_4);
      } else {
        setItems([...PRESETS.MOS_LOADCELL_8, ...PRESETS.AX920_PLATFORM_4]);
      }
    }
  };

  const handleTemplateChange = (tpl) => {
    setSelectedTemplate(tpl);
    fetchUniqueNumber(tpl);
    loadTemplateDefaults(tpl);
  };

  // Handle local file picking
  const handleLocalFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSelectedFile(file);
    setFileName(file.name);
    setLoading(true);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setFileType(isPdf ? 'pdf' : 'image');

    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
    if (!docTitle) setDocTitle(cleanTitle);

    fetchUniqueNumber('CUSTOM');

    try {
      if (isPdf) {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Pdf = reader.result;
            const res = await api.post('/mos/convert-pdf', {
              pdf: base64Pdf,
              max_pages: 8
            });

            const data = res.data?.data;
            if (data?.pages?.length > 0) {
              setConvertedPages(data.pages);
              setOrientation(data.orientation || 'landscape');
            } else {
              throw new Error('Tidak ada halaman PDF yang berhasil diekstrak.');
            }
          } catch (err) {
            setErrorMsg(err.response?.data?.error?.message || err.message || 'Gagal memproses PDF lokal.');
          } finally {
            setLoading(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const isLandscape = img.width >= img.height;
            setOrientation(isLandscape ? 'landscape' : 'portrait');
            setConvertedPages([
              {
                page_index: 0,
                width: img.width,
                height: img.height,
                is_landscape: isLandscape,
                image_data: reader.result
              }
            ]);
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

  // Add Item Row
  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        name: '',
        category: 'Sparepart',
        spec: '',
        sn: '',
        qty_received: 1,
        qty_do: 1,
        unit: 'PCS',
        condition: 'Baru',
        warranty: '1 Tahun',
        bin_location: 'RAK-01',
        notes: ''
      }
    ]);
  };

  // Add Preset Items
  const handleLoadPreset = (presetKey) => {
    const list = PRESETS[presetKey] || [];
    setItems(prev => [...prev, ...list.map((it, i) => ({ ...it, id: `item-preset-${Date.now()}-${i}` }))]);
  };

  // Clear all items
  const handleClearItems = () => {
    if (confirm('Yakin ingin mengosongkan semua baris barang?')) {
      setItems([]);
    }
  };

  // Remove Item Row
  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Update Item Field
  const handleItemFieldChange = (index, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docNumber) {
      setErrorMsg('Nomor dokumen wajib diisi.');
      return;
    }

    if (activeTab === 'local' && !isEditMode && convertedPages.length === 0) {
      setErrorMsg('Silakan pilih file PDF atau Gambar dokumen terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        doc_number: docNumber,
        template_type: activeTab === 'local' ? 'CUSTOM' : selectedTemplate,
        title: docTitle || (selectedTemplate === 'MDT' ? 'MATERIAL DISMANTLING' : selectedTemplate === 'MRP' ? 'MATERIAL REPLACEMENT' : 'MATERIAL ON SITE'),
        subtitle: docSubtitle || (activeTab === 'local' ? `Diupload dari PC oleh ${senderName}` : `BERITA ACARA RESMI ${selectedTemplate}`),
        purpose: purpose || 'Verifikasi dan otorisasi dokumen kerja site.',
        
        // Rute Pengiriman Lengkap
        site_location: destinationLocation,
        origin_location: originLocation,
        origin_specific_area: originSpecificArea,
        destination_location: destinationLocation,
        destination_specific_area: destinationSpecificArea,
        sender_name: senderName,
        sender_role: senderRole,
        sender_phone: senderPhone,
        destination_receiver: destinationReceiver,
        pic_receiver_name: destinationReceiver,
        receiver_role: receiverRole,
        receiver_phone: receiverPhone,
        transport_mode: transportMode,
        driver_name: driverName,
        unit_targeted: unitTargeted,

        // Identitas & Status
        received_date: docDate,
        required_date: requiredDate,
        po_do_number: poDoNumber || '-',
        do_sj_number: doSjNumber || '-',
        wo_spk_number: woSpkNumber || '-',
        department: department || 'Workshop & Fleet Maintenance',
        urgency: urgency || 'Normal',
        package_condition: packageCondition || 'Baik',
        notes_justification: notesJustification,

        // Alur Otorisasi 3 Slot
        approval_maker_name: approvalMakerName || senderName,
        approval_maker_role: approvalMakerRole || senderRole,
        approval_maker_dept: approvalMakerDept,
        approval_checker_name: approvalCheckerName,
        approval_checker_role: approvalCheckerRole,
        approval_checker_dept: approvalCheckerDept,
        approval_approver_name: approvalApproverName,
        approval_approver_role: approvalApproverRole,
        approval_approver_dept: approvalApproverDept,

        orientation,
        pages: convertedPages,
        items
      };

      let resultDoc = null;
      if (isEditMode) {
        const res = await api.put(`/mos/${editDocument.id}`, payload);
        resultDoc = res.data?.data;
      } else {
        const res = await api.post('/mos', payload);
        resultDoc = res.data?.data;
      }

      onSuccess?.(resultDoc);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Gagal menyimpan dokumen.');
    } finally {
      setLoading(false);
    }
  };

  // Computations for quick statistics
  const totalQtyTerima = items.reduce((acc, it) => acc + (Number(it.qty_received) || 0), 0);
  const totalQtyDo = items.reduce((acc, it) => acc + (Number(it.qty_do) || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-700/30 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      {/* ── EXPANDED WIDE MODAL CONTAINER (Up to 1540px / 98vw for desktop ERP experience) ── */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-[98vw] max-w-[1540px] overflow-hidden flex flex-col max-h-[96vh] my-auto">
        
        {/* ── Modal Header: Bold, Informative & Spacious ── */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200/80 shadow-xs">
              {isEditMode ? <Edit3 className="w-6 h-6" /> : <FolderOpen className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {isEditMode ? 'Edit & Sesuaikan Dokumen Approval Berita Acara' : 'Buat & Sesuaikan Dokumen Berita Acara (MOS / MDT / MRP)'}
                </h3>
                <span className="text-[10px] font-mono font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md">
                  {selectedTemplate} FORM
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" /> Form Komprehensif Lengkap
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi menyeluruh: No. SPK/PO, rute pengiriman detail, unit alat, 3 slot penanda tangan, serta tabel material multi-kolom.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ── Mode Tab Switcher (Only shown if creating new document) ── */}
        {!isEditMode && (
          <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/50 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('template')}
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'template'
                  ? 'border-red-600 text-red-600 bg-white rounded-t-xl shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Gunakan Template Resmi Perusahaan (MOS / MDT / MRP)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('local')}
              className={`flex items-center gap-2 px-6 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'local'
                  ? 'border-red-600 text-red-600 bg-white rounded-t-xl shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload dari Komputer (Scan PDF / Berkas Gambar)</span>
            </button>
          </div>
        )}

        {/* ── Scrollable Form Body: Expansive & Deeply Detailed ── */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ════════ SECTION 1: TEMPLATE SELECTOR (IF TEMPLATE TAB) ════════ */}
            {activeTab === 'template' && !isEditMode && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-red-600" />
                    <span>1. Pilih Format Berita Acara Resmi:</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Klik salah satu format untuk mengaplikasikan preset standar</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {[
                    {
                      id: 'MOS',
                      code: '001_VGT_MOS',
                      title: 'MATERIAL ON SITE',
                      badge: 'Penerimaan Site',
                      desc: 'Verifikasi & penerimaan fisik material/sparepart baru di gudang site.'
                    },
                    {
                      id: 'MDT',
                      code: '005_VGT_MDT',
                      title: 'MATERIAL DISMANTLING',
                      badge: 'Pembongkaran',
                      desc: 'Pelepasan & pembongkaran loadcell/part dummy atau rusak dari unit lapangan.'
                    },
                    {
                      id: 'MRP',
                      code: '006_VGT_MRP',
                      title: 'MATERIAL REPLACEMENT',
                      badge: 'Penggantian Baru',
                      desc: 'Pemasangan & penggantian material suku cadang baru pada unit operasional.'
                    }
                  ].map(tpl => (
                    <div
                      key={tpl.id}
                      onClick={() => handleTemplateChange(tpl.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedTemplate === tpl.id
                          ? 'border-red-600 bg-red-50/30 shadow-sm ring-2 ring-red-600/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {tpl.code}
                        </span>
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          {tpl.badge}
                        </span>
                      </div>
                      <div className="text-sm font-black text-slate-900">{tpl.title}</div>
                      <p className="text-[11.5px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{tpl.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════ LOCAL FILE PICKER (IF LOCAL TAB) ════════ */}
            {activeTab === 'local' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  Pilih File Dokumen Approval dari PC (PDF / Gambar Scan):
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-red-50/20"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={handleLocalFileSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2 border border-red-100">
                    <Upload className="w-6 h-6" />
                  </div>
                  {fileName ? (
                    <div>
                      <div className="text-xs font-bold text-slate-900">{fileName}</div>
                      <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
                        ✓ Berhasil memuat {convertedPages.length} halaman ({orientation})
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Klik untuk memilih file PDF atau Gambar dokumen dari komputer
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Mendukung PDF multi-halaman, PNG, JPG, dan WEBP (otomatis deteksi orientasi)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════ SECTION 2: IDENTITAS & PENOMORAN DOKUMEN ════════ */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span>2. Identitas, Penomoran &amp; Legalitas Dokumen:</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Unik &amp; Dapat Diedit Sesuai Kebutuhan
                </span>
              </div>

              {/* Grid 4 Kolom: Nomor Dokumen, Tanggal, PO, WO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                {/* No Dokumen Unik */}
                <div className="lg:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    No. Dokumen Resmi (Unik / Custom):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={docNumber}
                      onChange={(e) => setDocNumber(e.target.value)}
                      placeholder="007/VGT/MOS/MNTOA/BIBOA/X/2026"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:border-red-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => fetchUniqueNumber(activeTab === 'local' ? 'CUSTOM' : selectedTemplate)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs shrink-0"
                      title="Generate nomor urut acak baru"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-red-600" />
                      <span>Acak Baru</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Penomoran format resmi otomatis berubah setiap dokumen baru dibuat.
                  </span>
                </div>

                {/* Tanggal Dokumen */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Tanggal Dokumen:
                  </label>
                  <input
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:border-red-500 shadow-2xs"
                  />
                </div>

                {/* Target Tanggal Dibutuhkan */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Target Tanggal Dibutuhkan / Tiba:
                  </label>
                  <input
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-red-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Grid 4 Kolom: PO, DO/Surat Jalan, SPK/WO, Departemen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    No. PO / Purchase Order:
                  </label>
                  <input
                    type="text"
                    value={poDoNumber}
                    onChange={(e) => setPoDoNumber(e.target.value)}
                    placeholder="PO-2026/BIB/0892 atau -"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono focus:outline-none focus:border-red-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    No. DO / Surat Jalan Vendor:
                  </label>
                  <input
                    type="text"
                    value={doSjNumber}
                    onChange={(e) => setDoSjNumber(e.target.value)}
                    placeholder="DO-SJ/TRK/49102 atau -"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono focus:outline-none focus:border-red-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    No. SPK / Work Order / Kontrak:
                  </label>
                  <input
                    type="text"
                    value={woSpkNumber}
                    onChange={(e) => setWoSpkNumber(e.target.value)}
                    placeholder="SPK-2026/VGT-BIB/014"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-mono focus:outline-none focus:border-red-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Departemen / Divisi Pemohon:
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Contoh: Workshop & Fleet Maintenance"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:border-red-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Grid 4 Kolom: Urgensi, Kondisi Kemasan, Judul, Subjudul */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Tingkat Urgensi / Prioritas:
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:outline-none focus:border-red-500 shadow-2xs"
                  >
                    <option value="Normal">🟢 Normal (SOP Terjadwal)</option>
                    <option value="Urgent">🟡 Urgent (Prioritas Tinggi)</option>
                    <option value="Emergency">🔴 Emergency (Unit Breakdown / Kritis)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Kondisi Fisik / Kemasan:
                  </label>
                  <select
                    value={packageCondition}
                    onChange={(e) => setPackageCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-red-500 shadow-2xs"
                  >
                    <option value="Baik">Baik (Kondisi Fisik Prima &amp; Segel Utuh)</option>
                    <option value="Barang baru">Barang Baru (Dalam Box Pabrik)</option>
                    <option value="Barang dummy">Barang Dummy / Bekas Pembongkaran</option>
                    <option value="Perlu Inspeksi">Perlu Inspeksi Khusus</option>
                    <option value="Rusak / Patah">Rusak / Perlu Perbaikan Segera</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Judul Dokumen Berita Acara:
                  </label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="MATERIAL ON SITE"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:border-red-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Subjudul / Kategori Dokumen:
                  </label>
                  <input
                    type="text"
                    value={docSubtitle}
                    onChange={(e) => setDocSubtitle(e.target.value)}
                    placeholder="BERITA ACARA VERIFIKASI MATERIAL"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-red-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* ════════ SECTION 3: RUTE ALUR PENGIRIMAN DETAIL (DARI SIAPA ➔ AKAN KEMANA) ════════ */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-red-600" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  3. Rute Alur Pengiriman Lengkap: Dari Siapa &amp; Akan Kemana
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* ── SISI KIRI: DARI SIAPA (PENGIRIM / ASAL) ── */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-blue-700 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <span>Dari Siapa (Asal / Pengirim)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ORIGIN FACILITY</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Lokasi Site / Gudang Asal:
                    </label>
                    <input
                      type="text"
                      value={originLocation}
                      onChange={(e) => setOriginLocation(e.target.value)}
                      placeholder="Contoh: Office VGT / Central Warehouse Batulicin"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {['Office VGT', 'Central Warehouse Batulicin', 'Vendor Trakindo', 'Workshop Sentral', 'Gudang Utama Banjarmasin'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setOriginLocation(s)}
                          className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-semibold transition-colors"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Nama PIC Pengirim:</label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => {
                          setSenderName(e.target.value);
                          if (!approvalMakerName) setApprovalMakerName(e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Jabatan PIC:</label>
                      <input
                        type="text"
                        value={senderRole}
                        onChange={(e) => {
                          setSenderRole(e.target.value);
                          if (!approvalMakerRole) setApprovalMakerRole(e.target.value);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">No. Telp / HP:</label>
                      <input
                        type="text"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="0812-xxxx-xxxx"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* ── SISI KANAN: AKAN KEMANA (TUJUAN / PENERIMA) ── */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-red-700 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                      <span>Akan Kemana (Tujuan / Penerima)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">DESTINATION SITE</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Lokasi Site / Gudang Tujuan:
                    </label>
                    <input
                      type="text"
                      value={destinationLocation}
                      onChange={(e) => setDestinationLocation(e.target.value)}
                      placeholder="Contoh: BIB Pit Sebamban KM-14"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 font-bold focus:outline-none focus:border-red-500"
                    />
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {['BIB Pit Sebamban KM-14', 'WIM KM 13', 'Hauling Road KM-28', 'Port Batulicin Stockpile', 'Workshop Pitstop KM-09'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setDestinationLocation(s)}
                          className="text-[10px] px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 font-semibold transition-colors"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Ditujukan Kepada PIC:</label>
                      <input
                        type="text"
                        value={destinationReceiver}
                        onChange={(e) => setDestinationReceiver(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Jabatan Penerima:</label>
                      <input
                        type="text"
                        value={receiverRole}
                        onChange={(e) => setReceiverRole(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">No. Telp / HP:</label>
                      <input
                        type="text"
                        value={receiverPhone}
                        onChange={(e) => setReceiverPhone(e.target.value)}
                        placeholder="0821-xxxx-xxxx"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Baris Tambahan: Transportasi, Driver & Unit Target */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Moda Pengiriman / Ekspedisi:</label>
                  <input
                    type="text"
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value)}
                    placeholder="Armada Internal VGT / JNE Cargo"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Driver / Plat Nomor Kendaraan:</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Bpk. Mulyadi (KT 8821 BB)"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Unit / Fleet / Alat Tertuju:</label>
                  <input
                    type="text"
                    value={unitTargeted}
                    onChange={(e) => setUnitTargeted(e.target.value)}
                    placeholder="Contoh: Unit WIM KM 13 / HD-785"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">Peruntukan / Keperluan Material:</label>
                  <input
                    type="text"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Verifikasi fisik & serah terima material"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* ════════ SECTION 4: ALUR OTORISASI 3 SLOT (APPROVAL UNTUK SIAPA) ════════ */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-600" />
                  <span>4. Alur Otorisasi: Approval Untuk Siapa (Hierarki 3 Slot Resmi Perusahaan)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Nama, jabatan &amp; departemen penanda tangan dapat disesuaikan bebas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Slot 1: Dibuat Oleh (Maker) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg text-center">
                    Slot 1: Dibuat Oleh (Maker / Pemohon)
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Nama PIC Pembuat:</label>
                    <input
                      type="text"
                      value={approvalMakerName}
                      onChange={(e) => setApprovalMakerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Jabatan / Role:</label>
                    <input
                      type="text"
                      value={approvalMakerRole}
                      onChange={(e) => setApprovalMakerRole(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Departemen:</label>
                    <input
                      type="text"
                      value={approvalMakerDept}
                      onChange={(e) => setApprovalMakerDept(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* Slot 2: Diperiksa Oleh (Checker) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div className="text-[11px] font-black text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg text-center">
                    Slot 2: Diperiksa Oleh (Checker / Gudang)
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Nama Supervisor:</label>
                    <input
                      type="text"
                      value={approvalCheckerName}
                      onChange={(e) => setApprovalCheckerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Jabatan / Role:</label>
                    <input
                      type="text"
                      value={approvalCheckerRole}
                      onChange={(e) => setApprovalCheckerRole(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Departemen:</label>
                    <input
                      type="text"
                      value={approvalCheckerDept}
                      onChange={(e) => setApprovalCheckerDept(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* Slot 3: Diketahui Oleh (Approver) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div className="text-[11px] font-black text-purple-700 bg-purple-50 border border-purple-200/80 px-2.5 py-1 rounded-lg text-center">
                    Slot 3: Diketahui / Otoritas Final (Approver)
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Nama Superintendent / Lead:</label>
                    <input
                      type="text"
                      value={approvalApproverName}
                      onChange={(e) => setApprovalApproverName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Jabatan / Role:</label>
                    <input
                      type="text"
                      value={approvalApproverRole}
                      onChange={(e) => setApprovalApproverRole(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Departemen:</label>
                    <input
                      type="text"
                      value={approvalApproverDept}
                      onChange={(e) => setApprovalApproverDept(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ════════ SECTION 5: TABEL DAFTAR BARANG / MATERIAL (LEBAR & KOMPREHENSIF) ════════ */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-red-600" />
                  <div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                      5. Rincian Daftar Barang / Material ({items.length} Baris)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Total Qty Diterima: <b className="text-slate-800">{totalQtyTerima}</b> | Total Qty DO: <b className="text-slate-800">{totalQtyDo}</b>
                    </span>
                  </div>
                </div>

                {/* Preset & Action Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('MOS_LOADCELL_8')}
                    className="text-[10.5px] px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    + Preset Loadcell (8 Baris)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('AX920_PLATFORM_4')}
                    className="text-[10.5px] px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    + Preset Platform Mount (4 Baris)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadPreset('MDT_DISMANTLING_4')}
                    className="text-[10.5px] px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    + Preset Dismantling (4 Baris)
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Baris Kosong</span>
                  </button>
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearItems}
                      className="text-[10.5px] px-2 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Kosongkan Tabel"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>
              </div>

              {items.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl text-center text-slate-400 text-xs border border-dashed border-slate-300">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  Belum ada item material yang ditambahkan. Klik tombol <b>"+ Baris Kosong"</b> atau pilih preset di atas.
                </div>
              ) : (
                /* Wide Responsive Table Container taking full width of 1540px modal */
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-xs text-left divide-y divide-slate-200 border-collapse">
                    <thead className="bg-[#1E3A5F] text-white">
                      <tr>
                        <th className="py-2.5 px-2 text-center w-10 text-[11px] font-bold">No</th>
                        <th className="py-2.5 px-3 min-w-[200px] text-[11px] font-bold">Nama Barang / Material</th>
                        <th className="py-2.5 px-2.5 min-w-[130px] text-[11px] font-bold">Kategori</th>
                        <th className="py-2.5 px-3 min-w-[180px] text-[11px] font-bold">Spesifikasi / Part No.</th>
                        <th className="py-2.5 px-2.5 min-w-[130px] text-[11px] font-bold">Serial Number</th>
                        <th className="py-2.5 px-2 text-center w-20 text-[11px] font-bold">Qty Terima</th>
                        <th className="py-2.5 px-2 text-center w-20 text-[11px] font-bold">Qty DO</th>
                        <th className="py-2.5 px-2 text-center w-20 text-[11px] font-bold">Satuan</th>
                        <th className="py-2.5 px-2.5 min-w-[100px] text-[11px] font-bold">Kondisi</th>
                        <th className="py-2.5 px-2.5 min-w-[110px] text-[11px] font-bold">Garansi</th>
                        <th className="py-2.5 px-2.5 min-w-[90px] text-[11px] font-bold">Rak / Bin</th>
                        <th className="py-2.5 px-3 min-w-[160px] text-[11px] font-bold">Keterangan</th>
                        <th className="py-2.5 px-2 text-center w-12 text-[11px] font-bold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => (
                        <tr key={it.id || idx} className="hover:bg-slate-50/90 transition-colors">
                          <td className="py-2 px-2 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                          
                          {/* Nama Barang */}
                          <td className="py-2 px-2.5">
                            <input
                              type="text"
                              value={it.name || it.item_name || ''}
                              onChange={(e) => handleItemFieldChange(idx, 'name', e.target.value)}
                              placeholder="Nama Barang / Material"
                              className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                            />
                          </td>

                          {/* Kategori */}
                          <td className="py-2 px-2">
                            <select
                              value={it.category || 'Sparepart'}
                              onChange={(e) => handleItemFieldChange(idx, 'category', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
                            >
                              <option value="Sensor & Loadcell">Sensor &amp; Loadcell</option>
                              <option value="Sparepart">Sparepart Mekanikal</option>
                              <option value="Heavy Structure">Heavy Structure</option>
                              <option value="Consumables">Consumables / Oli</option>
                              <option value="Fasteners & Baut">Fasteners &amp; Baut</option>
                              <option value="Tools / Alat Kerja">Tools / Alat Kerja</option>
                              <option value="Safety & APD">Safety &amp; APD</option>
                            </select>
                          </td>

                          {/* Spesifikasi / Part No */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={it.spec || it.part_number || ''}
                              onChange={(e) => handleItemFieldChange(idx, 'spec', e.target.value)}
                              placeholder="Part No / Spek OEM"
                              className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs text-slate-800"
                            />
                          </td>

                          {/* Serial Number */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={it.sn || it.serial_number || ''}
                              onChange={(e) => handleItemFieldChange(idx, 'sn', e.target.value)}
                              placeholder="SN / Batch"
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800"
                            />
                          </td>

                          {/* Qty Terima */}
                          <td className="py-2 px-1.5 text-center">
                            <input
                              type="number"
                              min="0"
                              value={it.qty_received ?? 1}
                              onChange={(e) => handleItemFieldChange(idx, 'qty_received', Number(e.target.value))}
                              className="w-16 px-1.5 py-1 rounded-lg border border-slate-200 text-xs text-center font-bold text-slate-900 focus:border-red-500"
                            />
                          </td>

                          {/* Qty DO */}
                          <td className="py-2 px-1.5 text-center">
                            <input
                              type="number"
                              min="0"
                              value={it.qty_do ?? 1}
                              onChange={(e) => handleItemFieldChange(idx, 'qty_do', Number(e.target.value))}
                              className="w-16 px-1.5 py-1 rounded-lg border border-slate-200 text-xs text-center text-slate-700"
                            />
                          </td>

                          {/* Satuan */}
                          <td className="py-2 px-1.5 text-center">
                            <select
                              value={it.unit || 'PCS'}
                              onChange={(e) => handleItemFieldChange(idx, 'unit', e.target.value)}
                              className="w-16 px-1 py-1 rounded-lg border border-slate-200 text-xs text-center bg-white"
                            >
                              <option value="PCS">PCS</option>
                              <option value="UNIT">UNIT</option>
                              <option value="SET">SET</option>
                              <option value="BOX">BOX</option>
                              <option value="DRUM">DRUM</option>
                              <option value="LTR">LTR</option>
                              <option value="MTR">MTR</option>
                              <option value="PACK">PACK</option>
                              <option value="ROLL">ROLL</option>
                            </select>
                          </td>

                          {/* Kondisi */}
                          <td className="py-2 px-2">
                            <select
                              value={it.condition || 'Baru'}
                              onChange={(e) => handleItemFieldChange(idx, 'condition', e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold"
                            >
                              <option value="Baru">Baru Segel</option>
                              <option value="Baik">Baik Siap Pakai</option>
                              <option value="Bekas Servis">Bekas Servis</option>
                              <option value="Dummy">Dummy Pengganti</option>
                              <option value="Rusak">Rusak / Scrap</option>
                            </select>
                          </td>

                          {/* Garansi */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={it.warranty || '-'}
                              onChange={(e) => handleItemFieldChange(idx, 'warranty', e.target.value)}
                              placeholder="1 Tahun / 550k"
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs"
                            />
                          </td>

                          {/* Rak / Bin */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={it.bin_location || '-'}
                              onChange={(e) => handleItemFieldChange(idx, 'bin_location', e.target.value)}
                              placeholder="RAK-A1"
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono"
                            />
                          </td>

                          {/* Keterangan */}
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={it.notes || ''}
                              onChange={(e) => handleItemFieldChange(idx, 'notes', e.target.value)}
                              placeholder="Keterangan..."
                              className="w-full px-2.5 py-1 rounded-lg border border-slate-200 text-xs"
                            />
                          </td>

                          {/* Aksi Hapus */}
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Hapus baris barang ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ════════ SECTION 6: CATATAN TEKNIS & KRONOLOGI ALASAN PEKERJAAN ════════ */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-red-600" />
                <span>6. Catatan Teknis, Alasan Pekerjaan &amp; Kronologi Lapangan:</span>
              </label>
              <textarea
                rows={3}
                value={notesJustification}
                onChange={(e) => setNotesJustification(e.target.value)}
                placeholder="Tuliskan catatan teknis operasional, instruksi pemasangan, kronologi kerusakan suku cadang, atau rekomendasi lead engineer..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed focus:outline-none focus:border-red-500 shadow-2xs"
              />
            </div>

            {/* ════════ SUBMIT ACTION BUTTONS ════════ */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-200">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => loadTemplateDefaults(selectedTemplate)}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Kembalikan nilai ke setelan default template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Formulir</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <div className="text-[11px] font-bold text-slate-800">
                    {items.length} Item Material Terdaftar
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Otorisasi 3 Level &amp; Stamping SHA-256 Siap
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-red-600/25 transition-all cursor-pointer"
                >
                  {isEditMode ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{isEditMode ? 'Simpan Perubahan Dokumen' : 'Buat Dokumen ke Waiting List'}</span>
                </button>
              </div>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
