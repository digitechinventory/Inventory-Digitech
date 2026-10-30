import React, { useState, useEffect, useMemo } from 'react';
import {
  HardHat,
  Plus,
  Search,
  Filter,
  Warehouse,
  Wrench,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRightLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  QrCode,
  Tag,
  Boxes,
  FileSpreadsheet,
  Trash2,
  Edit,
  Edit3,
  RefreshCw,
  RotateCcw,
  FolderGit2,
  Gauge,
  X,
  MapPin,
  Building2,
  Cpu,
  History,
  Info,
  Send,
  FileText,
  Lock,
  Eye,
  FileCheck2,
  UserCheck,
  ArrowRight,
  Printer
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getProjects,
  createProject,
  updateProject,
  getProjectWarehouses,
  createProjectWarehouse,
  deleteProjectWarehouse,
  getProjectItems,
  createProjectItem,
  updateProjectItem,
  deleteProjectItem,
  installProjectItem,
  transferProjectItem,
  reportDamageProjectItem,
  replaceProjectItem,
  requestProjectItem,
  getProjectLogs,
  getProjectDocuments,
  createProjectDocument
} from '../api/projectInventoryApi';
import FamousInteractiveDashboard from '../components/inventory/FamousInteractiveDashboard';
import WimInteractiveDashboard from '../components/inventory/WimInteractiveDashboard';
import ProjectWorkflowGuide from '../components/inventory/ProjectWorkflowGuide';
import FullDocumentPreviewModal from '../components/common/FullDocumentPreviewModal';
import IncomingStockQRModal from '../components/inventory/IncomingStockQRModal';
import QRLabelPrintModal from '../components/printer/QRLabelPrintModal';
import PrinterSetupModal from '../components/printer/PrinterSetupModal';

/**
 * Authentic Mega Mendung Batik SVG Corner Ornament (Nuansa Merah Putih Khas Digitech)
 */
function MegaMendungCorner({ position = 'top-left', size = 56, className = '' }) {
  const isBottomRight = position === 'bottom-right';

  return (
    <svg
      viewBox="-5 -5 160 160"
      width={size}
      height={size}
      className={`absolute pointer-events-none z-0 ${
        isBottomRight ? 'bottom-0 right-0 rotate-180 opacity-25 group-hover:opacity-40' : 'top-0 left-0 opacity-25 group-hover:opacity-40'
      } transition-opacity duration-300 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="projMmCrimson" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7F1D1D" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#991B1B" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="projMmRedMid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B91C1C" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#DC2626" stopOpacity="0.88" />
        </linearGradient>
        <linearGradient id="projMmRedVibrant" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DC2626" stopOpacity="0.98" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id="projMmRoseLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#FCA5A5" stopOpacity="0.82" />
        </linearGradient>
      </defs>

      <g>
        <path d="M-5,-5 L155,-5 C146,18 150,38 128,48 C108,56 112,74 84,84 C62,92 66,116 36,128 C16,136 -4,142 -5,142 Z" fill="url(#projMmCrimson)" />
        <path d="M-5,-5 L124,-5 C116,14 120,30 102,38 C84,44 88,60 64,68 C45,75 50,96 24,106 C8,112 -4,116 -5,116 Z" fill="url(#projMmRedMid)" />
        <path d="M-5,-5 L92,-5 C85,10 90,22 74,28 C60,33 64,46 45,52 C30,58 34,74 14,82 C1,87 -4,90 -5,90 Z" fill="url(#projMmRedVibrant)" />
        <path d="M-5,-5 L60,-5 C54,6 58,15 46,20 C36,24 38,34 26,38 C16,42 18,54 4,60 C-3,64 -5,66 -5,66 Z" fill="url(#projMmRoseLight)" />
        <path d="M-5,-5 L30,-5 C26,2 28,8 20,11 C14,14 16,21 9,24 C4,27 -2,32 -5,35 Z" fill="#FFFFFF" fillOpacity="0.95" />
        <path d="M-5,-5 L155,-5 C146,18 150,38 128,48 C108,56 112,74 84,84 C62,92 66,116 36,128 C16,136 -4,142 -5,142" fill="none" stroke="#991B1B" strokeWidth="1.2" opacity="0.8" />
        <path d="M-5,-5 L124,-5 C116,14 120,30 102,38 C84,44 88,60 64,68 C45,75 50,96 24,106 C8,112 -4,116 -5,116" fill="none" stroke="#DC2626" strokeWidth="1.2" opacity="0.85" />
        <path d="M-5,-5 L92,-5 C85,10 90,22 74,28 C60,33 64,46 45,52 C30,58 34,74 14,82 C1,87 -4,90 -5,90" fill="none" stroke="#F87171" strokeWidth="1" opacity="0.9" />
      </g>
    </svg>
  );
}

// Slant for Parallelogram Styling (Right side higher)
const SLANT = '10px';
const CLIP_PARALLELOGRAM = `polygon(0 ${SLANT}, 100% 0, 100% calc(100% - ${SLANT}), 0 100%)`;

export default function ProjectInventoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role, user, hasProjectAccess } = useAuth();
  const isAdminOrSuperadmin = role === 'Admin' || role === 'Superadmin';
  const isUserReadOnly = !isAdminOrSuperadmin;

  // Data States
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('project') || 'proj-famous');
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const isCurrentProjectLocked = role !== 'Superadmin' && (hasProjectAccess ? !hasProjectAccess(selectedProjectId) : false);

  // Auto-switch to first authorized project if active project is unauthorized and no explicit URL parameter was provided
  useEffect(() => {
    if (role === 'Superadmin') return;
    const projParam = searchParams.get('project');
    if (!projParam && hasProjectAccess && !hasProjectAccess(selectedProjectId)) {
      const firstAllowed = ['proj-famous', 'proj-wim', 'proj-ccm'].find(pid => hasProjectAccess(pid));
      if (firstAllowed) {
        setSelectedProjectId(firstAllowed);
      }
    }
  }, [hasProjectAccess, role, searchParams, selectedProjectId]);

  // 8-Stage Documents State (Per-Project Documents & MOS)
  const [projectDocs, setProjectDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedStageFilter, setSelectedStageFilter] = useState(searchParams.get('stage') || 'ALL');
  const [selectedDocDetail, setSelectedDocDetail] = useState(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [docForm, setDocForm] = useState({
    stage_code: 'MOS',
    stage_name: 'Material On Site (MOS)',
    stage_number: 5,
    doc_number: '',
    title: '',
    summary: '',
    priority: 'Medium',
    file_attachment: ''
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all'); // all | installed | warranty | transfers | damaged | documents | warehouses | logs
  const [famousViewMode, setFamousViewMode] = useState(searchParams.get('tab') === 'documents' ? 'standard' : 'command_center'); // 'command_center' | 'standard'
  const [wimViewMode, setWimViewMode] = useState(searchParams.get('tab') === 'documents' ? 'standard' : 'command_center'); // 'command_center' | 'standard'

  // Synchronize state when URL Search Params change
  useEffect(() => {
    const projParam = searchParams.get('project');
    const tabParam = searchParams.get('tab');
    const stageParam = searchParams.get('stage');

    if (projParam) {
      setSelectedProjectId(projParam);
    }
    if (tabParam) {
      setActiveTab(tabParam);
      if (tabParam === 'documents') {
        setFamousViewMode('standard');
        setWimViewMode('standard');
      }
    }
    if (stageParam) {
      setSelectedStageFilter(stageParam);
    }
  }, [searchParams]);

  // Navigate directly from 6-Stage Workflow Stepper to corresponding tab/filter
  const handleWorkflowStepNavigate = (targetTab, stageId) => {
    setActiveTab(targetTab);
    if (stageId === 'mos') {
      setSelectedStageFilter('MOS');
    } else if (stageId === 'bastm') {
      setSelectedStageFilter('BASTM');
    }
    // Switch to standard view mode if needed so the target tab/table is directly visible
    if (famousViewMode === 'command_center') {
      setFamousViewMode('standard');
    }
    if (wimViewMode === 'command_center') {
      setWimViewMode('standard');
    }
  };

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');

  // Modals
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [cyberQrItem, setCyberQrItem] = useState(null);
  const [qrPrintItem, setQrPrintItem] = useState(null);
  const [showPrinterSetup, setShowPrinterSetup] = useState(false);
  const [qrFilter, setQrFilter] = useState('all'); // 'all' | 'without_qr' | 'with_qr'

  // Sync printed QR status from localStorage
  const [printedItemCodes, setPrintedItemCodes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('digitech_printed_qr_skus') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleQrPrinted = () => {
      try {
        setPrintedItemCodes(JSON.parse(localStorage.getItem('digitech_printed_qr_skus') || '[]'));
      } catch {}
    };
    window.addEventListener('qr-label-printed', handleQrPrinted);
    return () => window.removeEventListener('qr-label-printed', handleQrPrinted);
  }, []);

  const isItemQrReady = (item) => {
    const code = item?.item_code || item?.serial_number || item?.sku;
    if (!code) return false;
    return printedItemCodes.includes(code) || Boolean(item?.qr_printed || item?.has_qr);
  };

  // Active Item for modal actions
  const [activeItem, setActiveItem] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Form states
  const [projectForm, setProjectForm] = useState({ code: '', name: '', description: '', site_location: '', color_theme: 'emerald' });
  const [editProjectForm, setEditProjectForm] = useState({ id: '', code: '', name: '', description: '', site_location: '', color_theme: 'emerald' });
  const [warehouseForm, setWarehouseForm] = useState({ name: '', code: '', location: '', pic_name: '', pic_contact: '', capacity_shelves: 100, description: '' });
  const [itemForm, setItemForm] = useState({
    item_code: '',
    serial_number: '',
    name: '',
    category: 'Sensor Timbangan',
    brand: '',
    quantity: 1,
    unit: 'PCS',
    condition: 'Baru',
    price: '',
    warehouse_id: '',
    notes: '',
    document_number: '',
    direct_install: false,
    installed_unit: '',
    installation_location_detail: '',
    unit_hm_at_install: '',
    warranty_duration_months: 12,
    warranty_provider: '',
    expected_lifetime_hours: ''
  });

  const [installForm, setInstallForm] = useState({
    installed_unit: '',
    installation_location_detail: '',
    installed_date: new Date().toISOString().split('T')[0],
    installed_by: user?.full_name || 'Teknisi Lapangan',
    unit_hm_at_install: '',
    warranty_duration_months: 12,
    warranty_provider: '',
    notes: '',
    document_number: ''
  });

  const [transferForm, setTransferForm] = useState({
    origin_unit: '',
    target_unit: '',
    target_location_detail: '',
    transfer_date: new Date().toISOString().split('T')[0],
    technician_name: user?.full_name || 'Teknisi Fleet',
    transfer_reason: 'Pindahan resmi antar-unit (relokasi komponen)',
    document_number: ''
  });

  const [damageForm, setDamageForm] = useState({
    damage_type: 'Wear & Tear (Keausan Material)',
    damage_date: new Date().toISOString().split('T')[0],
    damage_notes: '',
    replacement_due_date: '',
    replacement_due_hm: '',
    technician_name: user?.full_name || 'Teknisi Lapangan',
    set_status_repair: true,
    document_number: ''
  });

  const [replaceForm, setReplaceForm] = useState({
    disposition: 'scrapped',
    new_serial_number: '',
    technician_name: user?.full_name || 'Teknisi Lapangan',
    document_number: '',
    notes: ''
  });

  // Request Material Form (Full Official Material Request Document State)
  const getInitialMRDocNumber = () => {
    const monthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
    const year = new Date().getFullYear();
    const randomSeq = String(Math.floor(Math.random() * 800) + 100).padStart(3, '0');
    return `${randomSeq}/VGT/MR/MNTOA/BIBOA/${monthRoman}/${year}`;
  };

  const getInitialRequestForm = () => ({
    document_number: getInitialMRDocNumber(),
    doc_date: new Date().toISOString().split('T')[0],
    required_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    work_order_number: `WO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
    source_location: 'Gudang Project WIM',
    destination_location: 'BIB Pit Sebamban KM-14',
    requested_unit: 'CAT 777D #HT-08 / KM-14',
    department: 'Maintenance & Instrumentation Pit',
    requester_name: user?.full_name || 'Teknisi Lapangan',
    requester_role: user?.role || 'Teknisi Lapangan',
    destination_receiver: 'Admin Logistik Site',
    urgency: 'Normal Maintenance',
    material_condition: 'Baru & Segel Original',
    justification: '',
    approval_maker_name: user?.full_name || 'Teknisi Lapangan',
    approval_maker_role: user?.role || 'Teknisi Lapangan',
    approval_checker_name: 'Zainal Fahriandy',
    approval_checker_role: 'Supervisor Logistik VGT',
    approval_approver_name: 'Harris',
    approval_approver_role: 'Head of Digitech',
    publish_to_mos: true,
    items: [
      {
        id: `item-${Date.now()}-1`,
        item_name: '',
        part_number: '',
        serial_number: '',
        quantity: 1,
        unit: 'PCS',
        rack_location: '',
        condition: 'Baru',
        notes: ''
      }
    ]
  });

  const [requestForm, setRequestForm] = useState(getInitialRequestForm);

  const resetRequestForm = () => {
    const init = getInitialRequestForm();
    if (activeProject?.name) {
      init.source_location = `Gudang Project ${activeProject.name.replace(/^Project\s+/i, '')}`;
    }
    if (activeProject?.site_location) {
      init.destination_location = activeProject.site_location;
    }
    setRequestForm(init);
  };

  const handleAddRequestItemRow = () => {
    setRequestForm(prev => {
      const currentItems = prev?.items || [];
      return {
        ...prev,
        items: [
          ...currentItems,
          {
            id: `item-${Date.now()}-${currentItems.length + 1}`,
            item_name: '',
            part_number: '',
            serial_number: '',
            quantity: 1,
            unit: 'PCS',
            rack_location: '',
            condition: 'Baru',
            notes: ''
          }
        ]
      };
    });
  };

  const handleRemoveRequestItemRow = (index) => {
    if ((requestForm.items?.length || 0) <= 1) {
      showToast('Minimal harus ada 1 baris material pada permohonan', 'warning');
      return;
    }
    setRequestForm(prev => ({
      ...prev,
      items: (prev?.items || []).filter((_, i) => i !== index)
    }));
  };

  const handleUpdateRequestItemRow = (index, field, value) => {
    setRequestForm(prev => {
      const updated = [...(prev?.items || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleRefreshMRNumber = async () => {
    try {
      const res = await api.get('/mos/next-number?type=MR');
      if (res.data?.data?.next_number) {
        setRequestForm(prev => ({ ...prev, document_number: res.data.data.next_number }));
        showToast('Nomor dokumen resmi MR diperbarui!');
        return;
      }
    } catch {}
    setRequestForm(prev => ({ ...prev, document_number: getInitialMRDocNumber() }));
    showToast('Nomor dokumen baru dibuat!');
  };

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const projList = await getProjects();
      setProjects(projList);

      const isAllowed = role === 'Superadmin' || (hasProjectAccess ? hasProjectAccess(selectedProjectId) : true);
      if (!isAllowed) {
        setWarehouses([]);
        setItems([]);
        setLogs([]);
        setProjectDocs([]);
        setLoading(false);
        return;
      }

      const [whList, itList, lgList, docList] = await Promise.all([
        getProjectWarehouses(selectedProjectId),
        getProjectItems({ project_id: selectedProjectId }),
        getProjectLogs({ project_id: selectedProjectId }),
        getProjectDocuments({ project_id: selectedProjectId }).then(r => r?.documents || []).catch(() => [])
      ]);

      setWarehouses(whList);
      setItems(itList);
      setLogs(lgList);
      setProjectDocs(docList);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      showToast('Gagal memuat data inventaris project', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocSubmit = async (e) => {
    e.preventDefault();
    if (!docForm.doc_number || !docForm.title) {
      showToast('Nomor dokumen dan judul dokumen wajib diisi', 'error');
      return;
    }
    try {
      await createProjectDocument({
        ...docForm,
        project_id: selectedProjectId,
        project_code: activeProject.code,
        creator_name: user?.full_name || 'Admin Site',
        creator_role: role || 'Admin'
      });
      showToast(`Dokumen tahap ${docForm.stage_code} berhasil diterbitkan!`);
      setShowAddDocModal(false);
      setDocForm({
        stage_code: 'MOS',
        stage_name: 'Material On Site (MOS)',
        stage_number: 5,
        doc_number: '',
        title: '',
        summary: '',
        priority: 'Medium',
        file_attachment: ''
      });
      const docsRes = await getProjectDocuments({ project_id: selectedProjectId });
      setProjectDocs(docsRes.documents || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal membuat dokumen project', 'error');
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProjectId]);

  // Selected project object
  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || {
      id: selectedProjectId,
      code: 'WIM',
      name: 'WIM (Weigh-In-Motion Scale System)',
      site_location: 'BIB Pit Sebamban KM-14 & KM-28'
    };
  }, [projects, selectedProjectId]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (activeTab === 'installed' && item.status !== 'installed') return false;
      if (activeTab === 'warranty' && (!item.warranty_expiry_date || item.warranty_status === 'void')) return false;
      if (activeTab === 'transfers' && !item.origin_unit) return false;
      if (activeTab === 'damaged' && !item.is_damaged && item.status !== 'under_repair') return false;

      if (warehouseFilter !== 'all' && item.warehouse_id !== warehouseFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (conditionFilter !== 'all' && item.condition !== conditionFilter) return false;
      if (qrFilter === 'without_qr' && isItemQrReady(item)) return false;
      if (qrFilter === 'with_qr' && !isItemQrReady(item)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesSku = item.item_code?.toLowerCase().includes(q);
        const matchesSn = item.serial_number?.toLowerCase().includes(q);
        const matchesUnit = item.installed_unit?.toLowerCase().includes(q);
        const matchesBrand = item.brand?.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesSn && !matchesUnit && !matchesBrand) return false;
      }

      return true;
    });
  }, [items, activeTab, warehouseFilter, statusFilter, conditionFilter, searchQuery, qrFilter, printedItemCodes]);

  // Overall statistics for active project
  const stats = useMemo(() => {
    const total = items.length;
    const installed = items.filter(i => i.status === 'installed').length;
    const inWarehouse = items.filter(i => i.status === 'in_warehouse').length;
    const damaged = items.filter(i => i.is_damaged || i.status === 'under_repair').length;
    const activeWarranty = items.filter(i => i.warranty_status === 'active').length;
    const expiringWarranty = items.filter(i => i.warranty_status === 'expiring_soon').length;
    const transferred = items.filter(i => !!i.origin_unit).length;

    return {
      total,
      installed,
      inWarehouse,
      damaged,
      activeWarranty,
      expiringWarranty,
      transferred
    };
  }, [items]);

  // User Material Request Handler (Comprehensive Document Submittal)
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.items || requestForm.items.length === 0) {
      showToast('Minimal cantumkan 1 baris material yang diminta', 'error');
      return;
    }
    const emptyItem = requestForm.items.find(i => !i.item_name?.trim());
    if (emptyItem) {
      showToast('Nama komponen/material pada setiap baris wajib diisi', 'error');
      return;
    }

    try {
      await requestProjectItem({
        ...requestForm,
        project_id: selectedProjectId,
        requester_name: requestForm.requester_name || user?.full_name || 'Teknisi Lapangan'
      });
      showToast(`Dokumen Permohonan "${requestForm.document_number}" berhasil diterbitkan & diajukan ke antrean approval!`);
      setShowRequestModal(false);
      resetRequestForm();
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengirim permohonan material', 'error');
    }
  };

  // Open Request Modal with preselected item
  const openRequestForSpecificItem = (item) => {
    const init = getInitialRequestForm();
    setRequestForm({
      ...init,
      source_location: warehouses.find(w => w.id === item.warehouse_id)?.name || init.source_location,
      destination_location: item.installed_unit ? `Site Lapangan (${item.installed_unit})` : init.destination_location,
      requested_unit: item.installed_unit || 'Unit Operasional',
      justification: `Permohonan pengambilan/penggantian part untuk ${item.installed_unit || 'Unit Operasional'}`,
      items: [
        {
          id: `item-${item.id}`,
          item_name: item.name,
          part_number: item.item_code || '',
          serial_number: item.serial_number || '',
          quantity: 1,
          unit: item.unit || 'PCS',
          rack_location: item.bin_location || '',
          condition: item.condition || 'Baru',
          notes: `Kebutuhan unit ${item.installed_unit || 'lapangan'}`
        }
      ]
    });
    setShowRequestModal(true);
  };

  // Admin Create Project Handler
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectForm.code || !projectForm.name) {
      showToast('Kode dan nama workspace wajib diisi', 'error');
      return;
    }
    try {
      const res = await createProject(projectForm);
      showToast(`Workspace ${projectForm.code} berhasil ditambahkan!`);
      setShowAddProjectModal(false);
      setProjectForm({ code: '', name: '', description: '', site_location: '', color_theme: 'emerald' });
      await fetchData();
      if (res?.id) setSelectedProjectId(res.id);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menambahkan workspace', 'error');
    }
  };

  // Open Edit Workspace Modal
  const openEditProjectModal = (proj) => {
    if (!proj) return;
    setEditProjectForm({
      id: proj.id,
      code: proj.code || '',
      name: proj.name?.replace(/^Project\s+/i, '') || '',
      description: proj.description || '',
      site_location: proj.site_location || '',
      color_theme: proj.color_theme || 'emerald'
    });
    setShowEditProjectModal(true);
  };

  // Admin Update Workspace Handler
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!editProjectForm.id || !editProjectForm.code || !editProjectForm.name) {
      showToast('Kode dan nama workspace wajib diisi', 'error');
      return;
    }
    try {
      await updateProject(editProjectForm.id, {
        code: editProjectForm.code,
        name: editProjectForm.name,
        description: editProjectForm.description,
        site_location: editProjectForm.site_location,
        color_theme: editProjectForm.color_theme
      });
      showToast(`Workspace ${editProjectForm.code} dan lokasi berhasil diperbarui!`);
      setShowEditProjectModal(false);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal memperbarui workspace', 'error');
    }
  };

  // Admin Create Warehouse Handler
  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    if (!warehouseForm.name || !warehouseForm.code) {
      showToast('Nama dan kode gudang wajib diisi', 'error');
      return;
    }
    try {
      await createProjectWarehouse({
        ...warehouseForm,
        project_id: selectedProjectId
      });
      showToast(`Gudang ${warehouseForm.name} berhasil dibuat!`);
      setShowAddWarehouseModal(false);
      setWarehouseForm({ name: '', code: '', location: '', pic_name: '', pic_contact: '', capacity_shelves: 100, description: '' });
      const whList = await getProjectWarehouses(selectedProjectId);
      setWarehouses(whList);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal membuat gudang', 'error');
    }
  };

  // Admin Create Item Handler (Barang Masuk)
  const handleCreateItem = async (e, printAfterSave = false) => {
    if (e?.preventDefault) e.preventDefault();
    if (!itemForm.name || !itemForm.item_code) {
      showToast('Nama barang dan part number / kode wajib diisi', 'error');
      return;
    }
    try {
      const res = await createProjectItem({
        ...itemForm,
        project_id: selectedProjectId,
        installed_unit: itemForm.direct_install ? itemForm.installed_unit : null,
        installation_location_detail: itemForm.direct_install ? itemForm.installation_location_detail : null,
        unit_hm_at_install: itemForm.direct_install ? itemForm.unit_hm_at_install : null,
        technician_name: user?.full_name || 'Staff Logistik'
      });
      const savedItem = {
        ...itemForm,
        id: res?.id || Date.now(),
        sku: itemForm.item_code
      };
      setShowAddItemModal(false);
      setItemForm({
        item_code: '',
        serial_number: '',
        name: '',
        category: 'Sensor Timbangan',
        brand: '',
        quantity: 1,
        unit: 'PCS',
        condition: 'Baru',
        price: '',
        warehouse_id: '',
        notes: '',
        document_number: '',
        direct_install: false,
        installed_unit: '',
        installation_location_detail: '',
        unit_hm_at_install: '',
        warranty_duration_months: 12,
        warranty_provider: '',
        expected_lifetime_hours: ''
      });
      await fetchData();

      if (printAfterSave) {
        showToast(`Material ${savedItem.name} berhasil dicatat! Menyiapkan stiker label QR...`);
        setQrPrintItem(savedItem);
      } else {
        showToast(`Material ${savedItem.name} berhasil dicatat ke sistem!`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menambahkan barang', 'error');
    }
  };

  // Lifecycle Handlers
  const handleInstallSubmit = async (e) => {
    e.preventDefault();
    const itemId = activeItem?.id || installForm.item_id;
    if (!itemId) {
      showToast('Pilih komponen/material yang akan dipasang terlebih dahulu', 'error');
      return;
    }
    if (!installForm.installed_unit) {
      showToast('Nomor unit/lokasi pemasangan wajib diisi', 'error');
      return;
    }
    try {
      await installProjectItem(itemId, installForm);
      showToast(`Asset berhasil dipasang pada unit ${installForm.installed_unit}!`);
      setShowInstallModal(false);
      setActiveItem(null);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal memasang asset', 'error');
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    const itemId = activeItem?.id || transferForm.item_id;
    if (!itemId) {
      showToast('Pilih komponen yang akan dipindah/dikanibal terlebih dahulu', 'error');
      return;
    }
    if (!transferForm.target_unit) {
      showToast('Unit tujuan transfer wajib diisi', 'error');
      return;
    }
    try {
      await transferProjectItem(itemId, {
        ...transferForm,
        origin_unit: activeItem?.installed_unit || transferForm.origin_unit || 'Unit Awal'
      });
      showToast(`Kanibalisasi/Perpindahan ke ${transferForm.target_unit} berhasil dicatat!`);
      setShowTransferModal(false);
      setActiveItem(null);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal melakukan mutasi unit', 'error');
    }
  };

  const handleDamageSubmit = async (e) => {
    e.preventDefault();
    const itemId = activeItem?.id || damageForm.item_id;
    if (!itemId) {
      showToast('Pilih komponen yang mengalami kerusakan terlebih dahulu', 'error');
      return;
    }
    try {
      await reportDamageProjectItem(itemId, damageForm);
      showToast(`Laporan kerusakan tercatat! Jadwal pergantian telah diagendakan.`);
      setShowDamageModal(false);
      setActiveItem(null);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mencatat kerusakan', 'error');
    }
  };

  const handleReplaceSubmit = async (e) => {
    e.preventDefault();
    if (!activeItem) return;
    try {
      await replaceProjectItem(activeItem.id, replaceForm);
      showToast(`Pergantian part selesai! Komponen lama dialokasikan.`);
      setShowReplaceModal(false);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengeksekusi pergantian', 'error');
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus asset "${name}" dari inventaris project?`)) return;
    try {
      await deleteProjectItem(id);
      showToast(`Asset "${name}" berhasil dihapus.`);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus asset', 'error');
    }
  };

  const handleDeleteWarehouse = async (id, name) => {
    if (!window.confirm(`Hapus gudang project "${name}"?`)) return;
    try {
      await deleteProjectWarehouse(id);
      showToast(`Gudang project "${name}" dihapus.`);
      const whList = await getProjectWarehouses(selectedProjectId);
      setWarehouses(whList);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menghapus gudang', 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (items.length === 0) {
      showToast('Tidak ada data untuk diexport', 'error');
      return;
    }
    const headers = ['Kode Barang', 'Serial Number', 'Nama Barang', 'Kategori', 'Brand', 'Status', 'Kondisi', 'Unit Terpasang', 'HM Pasang', 'Garansi Expiry', 'Status Garansi', 'Vendor Garansi', 'Jadwal Ganti', 'Kanibal Dari'];
    const rows = items.map(i => [
      `"${i.item_code || ''}"`,
      `"${i.serial_number || ''}"`,
      `"${i.name || ''}"`,
      `"${i.category || ''}"`,
      `"${i.brand || ''}"`,
      `"${i.status || ''}"`,
      `"${i.condition || ''}"`,
      `"${i.installed_unit || 'GUDANG'}"`,
      `"${i.unit_hm_at_install || ''}"`,
      `"${i.warranty_expiry_date || ''}"`,
      `"${i.warranty_status || ''}"`,
      `"${i.warranty_provider || ''}"`,
      `"${i.replacement_due_date || ''}"`,
      `"${i.origin_unit || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SUMMARY_INVENTORY_${activeProject.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Data inventaris ${activeProject.code} berhasil diekspor!`);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[9999] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white border-red-700 shadow-xl' : 'bg-emerald-600 text-white border-emerald-700 shadow-xl'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Compact Top Bar — Clean & Modern, No Redundant Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="text-xs font-mono font-black text-slate-800 tracking-wider uppercase">
              WORKSPACE &bull; {activeProject.code}
            </span>
          </div>
          <span className="h-4 w-px bg-slate-200 hidden sm:block" />
          <span className="text-xs text-slate-500 font-medium hidden sm:inline flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-red-600 inline" />
            {activeProject.site_location || 'Site BIB'}
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {user?.full_name || 'Personel Operasional'} ({role || 'User'})
          </span>
        </div>

        {/* Top Quick Actions — Pushed to right edge */}
        <div className="flex flex-wrap items-center justify-end gap-2 ml-auto shrink-0">
          {isAdminOrSuperadmin && (
            <>
              <button
                onClick={() => openEditProjectModal(activeProject)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer"
                title="Edit workspace & lokasi"
              >
                <Edit className="w-3.5 h-3.5 text-blue-600" />
                <span>Edit Workspace</span>
              </button>

              <button
                onClick={() => setShowAddProjectModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-bold transition shadow-xs hover:shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Tambah Workspace</span>
              </button>

              <button
                onClick={() => setShowAddWarehouseModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer"
              >
                <Warehouse className="w-3.5 h-3.5 text-red-600" />
                <span>+ Tambah Gudang</span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              resetRequestForm();
              setShowRequestModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-amber-700" />
            <span>+ Request Material</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Download CSV Laporan"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          </button>

          <button
            onClick={fetchData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Segarkan Data"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── SUMMARY CARDS PROJECT WORKSPACE ─── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
              <FolderGit2 className="w-4 h-4 text-red-600" />
              Pilih Project Workspace
            </span>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              (Klik kartu untuk beralih atau kelola asset)
            </span>
          </div>

          {isAdminOrSuperadmin && (
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              Tambah Workspace Baru
            </button>
          )}
        </div>

        {/* Project Summary Cards Grid (Parallelogram / Merah Putih Design) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 py-2">
          {projects.map((proj) => {
            const isSelected = proj.id === selectedProjectId;
            const isProjLocked = role !== 'Superadmin' && (hasProjectAccess ? !hasProjectAccess(proj.id) : false);
            const projStats = proj.stats || {
              total_items: 0,
              installed_count: 0,
              warehouse_stock: 0,
              damaged_count: 0,
              active_warranty: 0,
              warehouses_count: 0
            };

            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                style={{
                  filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.06)) drop-shadow(0 2px 6px rgba(192,17,27,0.08))',
                  willChange: 'transform, filter',
                }}
                className="group relative transition-all duration-300 ease-out cursor-pointer hover:-translate-y-2 hover:scale-[1.015] active:scale-[0.99]"
              >
                {/* 3D Accent Shadow Parallelogram */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    clipPath: CLIP_PARALLELOGRAM,
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                  className="transition-all duration-300 ease-out translate-x-[4px] translate-y-[4px] group-hover:translate-x-[7px] group-hover:translate-y-[7px] bg-gradient-to-br from-red-600/30 via-red-500/15 to-transparent group-hover:from-red-600/60 group-hover:via-red-500/35"
                />

                {/* Main Parallelogram Body — Pure White with Crimson Red Stripe */}
                <div
                  style={{
                    clipPath: CLIP_PARALLELOGRAM,
                  }}
                  className="relative z-10 w-full h-full min-h-[175px] p-5 pt-6 pb-6 flex flex-col justify-between overflow-hidden transition-all duration-300 ease-out bg-white group-hover:bg-gradient-to-b group-hover:from-white group-hover:to-red-50/30 border-l-[5px] border-r border-l-red-600 border-r-slate-200 group-hover:border-r-red-400"
                >
                  {/* Top Slanted Edge Border */}
                  <svg aria-hidden="true" className="absolute top-0 left-0 w-full pointer-events-none overflow-visible" style={{ height: '10px', zIndex: 30 }}>
                    <line
                      x1="0"
                      y1="10"
                      x2="100%"
                      y2="0"
                      strokeWidth="2.5"
                      className="stroke-slate-200 group-hover:stroke-red-400 transition-colors duration-300"
                    />
                  </svg>
                  {/* Bottom Slanted Edge Border */}
                  <svg aria-hidden="true" className="absolute bottom-0 left-0 w-full pointer-events-none overflow-visible" style={{ height: '10px', zIndex: 30 }}>
                    <line
                      x1="0"
                      y1="10"
                      x2="100%"
                      y2="0"
                      strokeWidth="2.5"
                      className="stroke-slate-200 group-hover:stroke-red-400 transition-colors duration-300"
                    />
                  </svg>

                  {/* Mega Mendung Corner Ornaments */}
                  <MegaMendungCorner position="top-left" size={54} />
                  <MegaMendungCorner position="bottom-right" size={46} />

                  {/* Upright Card Content */}
                  <div className="relative z-10 flex flex-col justify-between h-full pl-5 pr-1">
                    {/* Header Row: Project Code & Location */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 pl-8">
                        <span className={`text-xs font-black tracking-wider font-mono px-2.5 py-0.5 rounded-md transition-colors ${
                          isSelected
                            ? 'text-white bg-red-600 border border-red-600 shadow-2xs'
                            : 'text-red-600 bg-red-50 border border-red-200 group-hover:bg-red-600 group-hover:text-white'
                        }`}>
                          {proj.code}
                        </span>
                        {isProjLocked && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 shadow-2xs">
                            <Lock className="w-2.5 h-2.5 text-rose-600" />
                            Terkunci
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-500 font-medium truncate max-w-[100px] flex items-center gap-1" title={proj.site_location || 'Lokasi Workspace'}>
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          {proj.site_location?.split(' ')[0] || 'Site BIB'}
                        </span>
                        {isAdminOrSuperadmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditProjectModal(proj);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Workspace & Lokasi"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Title */}
                    <div className="my-1">
                      <h3 className="text-base font-black text-slate-900 leading-snug group-hover:text-red-700 transition-colors">
                        {proj.name?.replace(/^Project\s+/i, '')}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {proj.description || 'Pusat operasional dan inventaris project'}
                      </p>
                    </div>

                    {/* Bottom Row: Key Metrics Grid (Nuansa Merah Putih dengan Hover Responsif) */}
                    <div className="grid grid-cols-4 gap-2 pt-3 mt-2 border-t border-slate-100 text-center">
                      <div className="bg-slate-50/80 hover:bg-white hover:scale-105 hover:shadow-xs transition-all duration-200 rounded-lg p-1.5 border border-slate-200/70 hover:border-slate-300 cursor-pointer">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block font-mono">Total</span>
                        <span className="text-sm font-black text-slate-900">{projStats.total_items}</span>
                      </div>

                      <div className="bg-slate-50/80 hover:bg-white hover:scale-105 hover:shadow-xs transition-all duration-200 rounded-lg p-1.5 border border-slate-200/70 hover:border-blue-300 cursor-pointer">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-blue-700 block font-mono">Pasang</span>
                        <span className="text-sm font-black text-blue-600">{projStats.installed_count}</span>
                      </div>

                      <div className="bg-slate-50/80 hover:bg-white hover:scale-105 hover:shadow-xs transition-all duration-200 rounded-lg p-1.5 border border-slate-200/70 hover:border-emerald-300 cursor-pointer">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-700 block font-mono">Garansi</span>
                        <span className="text-sm font-black text-emerald-600">{projStats.active_warranty}</span>
                      </div>

                      <div className="bg-slate-50/80 hover:bg-white hover:scale-105 hover:shadow-xs transition-all duration-200 rounded-lg p-1.5 border border-slate-200/70 hover:border-red-300 cursor-pointer">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-red-700 block font-mono">Ganti</span>
                        <span className="text-sm font-black text-red-600">{projStats.damaged_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 4th Card: + Tambah Workspace Baru (Admin/Superadmin only) */}
          {isAdminOrSuperadmin && (
            <div
              onClick={() => setShowAddProjectModal(true)}
              style={{
                filter: 'drop-shadow(0 6px 16px rgba(192,17,27,0.08)) drop-shadow(0 2px 4px rgba(0,0,0,0.04))',
                willChange: 'transform, filter',
              }}
              className="group relative transition-all duration-300 ease-out cursor-pointer hover:-translate-y-2 hover:scale-[1.015] active:scale-[0.99]"
              title="Tambah Workspace Baru"
            >
              {/* 3D Accent Shadow Parallelogram */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  clipPath: CLIP_PARALLELOGRAM,
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
                className="transition-all duration-300 ease-out translate-x-[4px] translate-y-[4px] group-hover:translate-x-[8px] group-hover:translate-y-[8px] bg-gradient-to-br from-red-600/20 via-red-500/10 to-transparent group-hover:from-red-600/40 group-hover:via-red-500/25"
              />

              {/* Main Parallelogram Body — Pure White with Dashed Crimson Red Border */}
              <div
                style={{
                  clipPath: CLIP_PARALLELOGRAM,
                }}
                className="relative z-10 w-full h-full min-h-[175px] p-5 pt-6 pb-6 flex flex-col justify-between overflow-hidden bg-white group-hover:bg-gradient-to-b group-hover:from-white group-hover:to-red-50/40 border-l-[5px] border-r-[1px] border-l-dashed border-r-dashed border-l-red-600 border-r-slate-300 group-hover:border-l-red-700 group-hover:border-r-red-400 transition-all duration-300 ease-out"
              >
                <svg aria-hidden="true" className="absolute top-0 left-0 w-full pointer-events-none overflow-visible" style={{ height: '10px', zIndex: 30 }}>
                  <line x1="0" y1="10" x2="100%" y2="0" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="group-hover:stroke-red-400 transition-colors" />
                </svg>
                <svg aria-hidden="true" className="absolute bottom-0 left-0 w-full pointer-events-none overflow-visible" style={{ height: '10px', zIndex: 30 }}>
                  <line x1="0" y1="10" x2="100%" y2="0" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="group-hover:stroke-red-400 transition-colors" />
                </svg>

                <div className="relative z-10 flex flex-col items-center justify-center text-center h-full px-2 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 group-hover:bg-red-600 border border-red-200 group-hover:border-red-600 flex items-center justify-center text-red-600 group-hover:text-white transition-all shadow-xs group-hover:shadow-md mb-2 group-hover:scale-110">
                    <Plus className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 group-hover:text-red-600 transition-colors">
                    + Tambah Workspace
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[190px] leading-tight">
                    Daftarkan workspace baru
                  </p>
                  <span className="mt-2 text-[10px] font-extrabold uppercase tracking-wider text-red-600 bg-red-50 group-hover:bg-red-600 group-hover:text-white px-2 py-0.5 rounded-full border border-red-200 transition-all">
                    Klik untuk Tambah
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: If unauthorized, render Locked Workspace Screen */}
      {isCurrentProjectLocked ? (
        <div className="relative overflow-hidden bg-white rounded-3xl border border-red-200/90 shadow-xl p-8 md:p-14 text-center max-w-3xl mx-auto my-6">
          <MegaMendungCorner position="top-left" size={130} />
          <MegaMendungCorner position="bottom-right" size={110} />

          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-xl shadow-red-600/30 text-white animate-bounce-subtle">
              <Lock className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" /> Akses Otoritas Terbatas
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Akses Project {activeProject?.code || selectedProjectId} Terkunci
              </h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                Akun Anda (<strong className="text-slate-800">{user?.full_name || 'User'}</strong> &bull; <span className="font-bold text-red-600">{role}</span>) belum diberikan izin otoritas oleh <strong>Superadmin</strong> untuk membuka dan mengelola inventaris proyek <strong>{activeProject?.name || selectedProjectId}</strong>.
              </p>
            </div>

            {/* Information Card */}
            <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-4 max-w-lg mx-auto text-left flex items-start gap-3">
              <Info className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-red-900">Perlindungan Hak Otoritas Proyek</p>
                <p className="text-slate-600">
                  Setiap workspace project memiliki hak otoritas terisolasi untuk menjaga keamanan data logistik, mutasi barang fisik, dan dokumen MOS 8-tahap.
                </p>
                <p className="text-slate-500 font-mono text-[11px] pt-1">
                  Hubungi Superadmin untuk mengaktifkan otoritas akses proyek ini melalui menu <strong>Hak Otoritas Project</strong>.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {projects
                .filter(p => (hasProjectAccess ? hasProjectAccess(p.id) : false) && p.id !== selectedProjectId)
                .map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-xs shadow-md shadow-red-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Beralih ke Project {p.code}</span>
                  </button>
                ))}

              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Peta Alur Siklus Hidup Aset Proyek (Lifecycle Pipeline Stepper) ── */}
          <ProjectWorkflowGuide
            activeProject={activeProject}
            activeTab={activeTab}
            famousViewMode={famousViewMode}
            wimViewMode={wimViewMode}
            onNavigateStep={handleWorkflowStepNavigate}
            stats={stats}
          />

          {/* Main Content Card: Inventory Details for Active Workspace */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Workspace Context Sub-Header */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold text-slate-700">Workspace Terpilih:</span>
                <span className="text-xs font-mono font-extrabold bg-red-600 text-white px-2.5 py-0.5 rounded-md">
                  {activeProject.code}
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {activeProject.name?.replace(/^Project\s+/i, '')}
                </span>

                {/* FAMOUS View Mode Switcher */}
                {activeProject.code === 'FAMOUS' && (
                  <div className="flex items-center gap-1 ml-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setFamousViewMode('command_center')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        famousViewMode === 'command_center'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                      title="Mode visual: Matriks Armada Truk & Radar Sensor"
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      <span>Mode 1: Command Center Real (825 Unit)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFamousViewMode('standard')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        famousViewMode === 'standard'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                      title="Mode formulir: Tabel suku cadang, mutasi & dokumen BASTM"
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Mode 2: Tabel &amp; Formulir Standar</span>
                    </button>
                  </div>
                )}

                {/* WIM View Mode Switcher */}
                {activeProject.code === 'WIM' && (
                  <div className="flex items-center gap-1 ml-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setWimViewMode('command_center')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        wimViewMode === 'command_center'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                      title="Mode visual: Dashboard komponen gardu timbang WIM"
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      <span>Mode 1: Dashboard WIM (189 Komponen)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWimViewMode('standard')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        wimViewMode === 'standard'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                      }`}
                      title="Mode formulir: Tabel komponen & berkas dokumen 8 tahap"
                    >
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Mode 2: Tabel &amp; Formulir Standar</span>
                    </button>
                  </div>
                )}
              </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              {activeProject.site_location || 'Site BIB'}
            </span>
            {isAdminOrSuperadmin && (
              <button
                onClick={() => openEditProjectModal(activeProject)}
                className="text-slate-400 hover:text-blue-600 p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                title="Edit Lokasi & Workspace"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
            <span>•</span>
            <span>PIC: <strong>{user?.full_name || 'arya-admin'}</strong></span>
          </div>
        </div>

        {activeProject.code === 'FAMOUS' && famousViewMode === 'command_center' ? (
          <div className="p-4 sm:p-6 bg-slate-50/30">
            <FamousInteractiveDashboard
              onOpenDocuments={() => {
                setFamousViewMode('standard');
                setActiveTab('documents');
              }}
              onOpenMos={() => navigate('/mos')}
            />
          </div>
        ) : activeProject.code === 'WIM' && wimViewMode === 'command_center' ? (
          <div className="p-4 sm:p-6 bg-slate-50/30">
            <WimInteractiveDashboard
              onOpenDocuments={() => {
                setWimViewMode('standard');
                setActiveTab('documents');
              }}
              onOpenMos={() => navigate('/mos')}
            />
          </div>
        ) : (
          <>
            {/* Prominent Operational Menu Bar (Menu-Menu Operasional Lengkap) */}
            <div className="px-5 py-4 bg-gradient-to-b from-white to-slate-50/60 border-b border-slate-200/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono">
                Menu Operasional Asset ({activeProject.code})
              </h4>
              <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
                &bull; Akses langsung alur mutasi barang: masuk, pasang, pindahan, rusak, dokumen &amp; request
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* 1. Barang Masuk (Admin/Superadmin Only) */}
            {isAdminOrSuperadmin && (
              <button
                onClick={() => setShowAddItemModal(true)}
                className="group p-3 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-300 rounded-xl flex flex-col items-start text-left transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-colors mb-2">
                  <Boxes className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-red-700">Barang Masuk</span>
                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Input stok &amp; cetak label QR</span>
              </button>
            )}

            {/* 2. Pasang ke Unit (Admin/Superadmin Only) */}
            {isAdminOrSuperadmin && (
              <button
                onClick={() => {
                  setActiveItem(null);
                  setInstallForm({
                    item_id: '',
                    installed_unit: '',
                    installation_location_detail: '',
                    installed_date: new Date().toISOString().split('T')[0],
                    installed_by: user?.full_name || 'Teknisi Lapangan',
                    unit_hm_at_install: '',
                    warranty_duration_months: 12,
                    warranty_provider: '',
                    notes: '',
                    document_number: ''
                  });
                  setShowInstallModal(true);
                }}
                className="group p-3 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl flex flex-col items-start text-left transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors mb-2">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Pasang ke Unit</span>
                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Alokasi ke unit &amp; HM</span>
              </button>
            )}

            {/* 3. Pindahan Unit (Admin/Superadmin Only) */}
            {isAdminOrSuperadmin && (
              <button
                onClick={() => {
                  setActiveItem(null);
                  setTransferForm({
                    item_id: '',
                    origin_unit: '',
                    target_unit: '',
                    target_location_detail: '',
                    transfer_date: new Date().toISOString().split('T')[0],
                    technician_name: user?.full_name || 'Teknisi Fleet',
                    transfer_reason: 'Pindahan resmi antar-unit (relokasi komponen)',
                    document_number: ''
                  });
                  setShowTransferModal(true);
                }}
                className="group p-3 bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 rounded-xl flex flex-col items-start text-left transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors mb-2">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700">Pindahan Unit</span>
                <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Relokasi resmi antar unit</span>
              </button>
            )}

            {/* 4. Lapor Rusak & Target Ganti */}
            <button
              onClick={() => {
                setActiveItem(null);
                setDamageForm({
                  item_id: '',
                  damage_type: 'Wear & Tear (Keausan Material)',
                  damage_date: new Date().toISOString().split('T')[0],
                  damage_notes: '',
                  replacement_due_date: '',
                  replacement_due_hm: '',
                  technician_name: user?.full_name || 'Teknisi Lapangan',
                  set_status_repair: true,
                  document_number: ''
                });
                setShowDamageModal(true);
              }}
              className="group p-3 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-xl flex flex-col items-start text-left transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors mb-2">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Lapor Rusak</span>
              <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Diagnosa &amp; target ganti</span>
            </button>

            {/* 5. Gudang Project */}
            <button
              onClick={() => setActiveTab('warehouses')}
              className={`group p-3 border rounded-xl flex flex-col items-start text-left transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer ${
                activeTab === 'warehouses'
                  ? 'bg-red-50/60 border-red-400 ring-2 ring-red-500/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-colors mb-2">
                <Warehouse className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">Gudang Project</span>
              <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Rak &amp; kapasitas ({warehouses.length})</span>
            </button>

            {/* 6. Ajukan Permohonan / Request Material */}
            <button
              onClick={() => {
                resetRequestForm();
                setShowRequestModal(true);
              }}
              className="group p-3 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl flex flex-col items-start text-left transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-white/20 group-hover:bg-white/30 text-white flex items-center justify-center transition-colors mb-2">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white">Ajukan Request</span>
              <span className="text-[10px] text-red-100 line-clamp-1 mt-0.5">Suku cadang material</span>
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="border-b border-slate-200 px-4 sm:px-6 pt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar">
            {[
              { id: 'all', label: 'Semua Asset', count: items.length },
              { id: 'installed', label: 'Terpasang di Unit', count: stats.installed },
              { id: 'warranty', label: 'Status Garansi', count: stats.activeWarranty + stats.expiringWarranty },
              { id: 'transfers', label: 'Pindahan Unit', count: stats.transferred },
              { id: 'damaged', label: 'Rusak & Target Ganti', count: stats.damaged, badgeColor: stats.damaged > 0 ? 'bg-red-600 text-white' : '' },
              { id: 'documents', label: 'Dokumen 8 Tahap & MOS', count: projectDocs.length, badgeColor: 'bg-emerald-600 text-white' },
              { id: 'warehouses', label: 'Gudang Project', count: warehouses.length },
              { id: 'logs', label: 'Audit & Mutasi', count: logs.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  tab.badgeColor || (activeTab === tab.id ? 'bg-red-50 text-red-700 font-bold' : 'bg-slate-100 text-slate-600')
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Request Button for Users inside tabs bar */}
          {isUserReadOnly && (
            <button
              onClick={() => {
                resetRequestForm();
                setShowRequestModal(true);
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 pb-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Ajukan Permohonan Part
            </button>
          )}
        </div>

        {/* Filter Bar (for Asset Tabs) */}
        {activeTab !== 'warehouses' && activeTab !== 'logs' && activeTab !== 'documents' && (
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari part number, serial number, unit..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={warehouseFilter}
                onChange={e => setWarehouseFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Semua Gudang</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Semua Status</option>
                <option value="in_warehouse">Di Gudang (Ready)</option>
                <option value="installed">Terpasang di Unit</option>
                <option value="under_repair">Sedang Diperbaiki</option>
                <option value="scrapped">Afkir / Scrap</option>
              </select>

              <select
                value={conditionFilter}
                onChange={e => setConditionFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Semua Kondisi</option>
                <option value="Baru">Baru</option>
                <option value="Bekas Baik">Bekas Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
                <option value="Afkir / Scrap">Afkir / Scrap</option>
              </select>

              <select
                value={qrFilter}
                onChange={e => setQrFilter(e.target.value)}
                className={`px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${
                  qrFilter === 'without_qr'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : qrFilter === 'with_qr'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-white border-slate-300 text-slate-700'
                }`}
              >
                <option value="all">Semua Status QR Tracking</option>
                <option value="without_qr">Belum Terpasang QR</option>
                <option value="with_qr">Sudah Terpasang QR</option>
              </select>
            </div>
          </div>
        )}

        {/* ASSET DATA TABLE */}
        {activeTab !== 'warehouses' && activeTab !== 'logs' && activeTab !== 'documents' && (
          <div className="overflow-x-auto">
            {filteredItems.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Boxes className="w-12 h-12 mx-auto stroke-1 text-slate-300 mb-3" />
                <p className="text-base font-semibold text-slate-700">Tidak ada material yang sesuai kriteria</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {isUserReadOnly
                    ? 'Belum ada part di workspace ini. Anda dapat mengajukan permohonan material baru.'
                    : 'Belum ada item untuk filter ini. Silakan input penerimaan barang baru.'}
                </p>
                {isUserReadOnly ? (
                  <button
                    onClick={() => {
                      resetRequestForm();
                      setShowRequestModal(true);
                    }}
                    className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-red-700 cursor-pointer"
                  >
                    + Ajukan Request Material
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAddItemModal(true)}
                    className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-red-700 cursor-pointer"
                  >
                    + Input Penerimaan Barang Masuk
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Komponen & Identitas</th>
                    <th className="py-3 px-4">Dipasang Dimana?</th>
                    <th className="py-3 px-4">Gudang / Qty</th>
                    <th className="py-3 px-4">Masa Garansi</th>
                    <th className="py-3 px-4">Kondisi & Status</th>
                    <th className="py-3 px-4">Jadwal Ganti / Kanibal</th>
                    <th className="py-3 px-4">Tracking QR</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {filteredItems.map(item => {
                    const isInstalled = item.status === 'installed';
                    const hasWarranty = !!item.warranty_expiry_date;
                    const isWarrantyExpiring = item.warranty_status === 'expiring_soon';
                    const isWarrantyExpired = item.warranty_status === 'expired';
                    const isDamaged = item.is_damaged || item.status === 'under_repair';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Komponen & S/N */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                            {item.name}
                            {item.serial_number && (
                              <button
                                onClick={() => {
                                  setActiveItem(item);
                                  setShowDetailModal(true);
                                }}
                                className="text-slate-400 hover:text-slate-700"
                                title="Lihat Barcode & Kartu Aset"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700">{item.item_code}</span>
                            {item.serial_number && (
                              <span className="text-blue-600">S/N: {item.serial_number}</span>
                            )}
                            {item.brand && <span className="text-slate-400">• {item.brand}</span>}
                          </div>
                        </td>

                        {/* Dipasang Dimana? */}
                        <td className="py-3 px-4">
                          {isInstalled && item.installed_unit ? (
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                                <Truck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                {item.installed_unit}
                              </div>
                              {item.installation_location_detail && (
                                <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={item.installation_location_detail}>
                                  {item.installation_location_detail}
                                </div>
                              )}
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>Pasang: {item.installed_date || '-'}</span>
                                {item.unit_hm_at_install && (
                                  <span className="font-mono bg-blue-50 text-blue-700 px-1 rounded">HM: {item.unit_hm_at_install}h</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                              <Warehouse className="w-3 h-3 text-slate-400" />
                              Di Gudang
                            </span>
                          )}
                        </td>

                        {/* Gudang / Qty */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 text-xs">
                            {warehouses.find(w => w.id === item.warehouse_id)?.name || 'Gudang Central'}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            <span className="font-bold text-slate-900">{item.quantity || 1}</span> {item.unit || 'PCS'}
                            {item.price > 0 && (
                              <span className="text-slate-400 ml-1.5">• Rp {Number(item.price).toLocaleString('id-ID')}</span>
                            )}
                          </div>
                        </td>

                        {/* Masa Garansi */}
                        <td className="py-3 px-4">
                          {hasWarranty ? (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  isWarrantyExpired
                                    ? 'bg-slate-100 text-slate-600 border border-slate-300'
                                    : isWarrantyExpiring
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}>
                                  {isWarrantyExpired ? (
                                    <>Kadaluarsa</>
                                  ) : isWarrantyExpiring ? (
                                    <>Segera Habis (&lt;30h)</>
                                  ) : (
                                    <>Garansi Aktif</>
                                  )}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-1">
                                Exp: {item.warranty_expiry_date}
                              </div>
                              {item.warranty_provider && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[160px]" title={item.warranty_provider}>
                                  {item.warranty_provider}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Tanpa Garansi</span>
                          )}
                        </td>

                        {/* Kondisi & Status */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.condition === 'Baru' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              item.condition === 'Bekas Baik' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              item.condition === 'Rusak Ringan' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {item.condition}
                            </span>
                            <span className={`text-[11px] font-semibold ${
                              item.status === 'installed' ? 'text-blue-600' :
                              item.status === 'in_warehouse' ? 'text-emerald-600' :
                              item.status === 'under_repair' ? 'text-red-600' : 'text-slate-500'
                            }`}>
                              ● {
                                item.status === 'installed' ? 'Terpasang' :
                                item.status === 'in_warehouse' ? 'Di Rak Gudang' :
                                item.status === 'under_repair' ? 'Dalam Perbaikan' : 'Scrap/Afkir'
                              }
                            </span>
                          </div>
                        </td>

                        {/* Jadwal Ganti / Kanibal */}
                        <td className="py-3 px-4">
                          {isDamaged && (
                            <div className="bg-red-50 p-1.5 rounded-lg border border-red-200/80 max-w-[200px]">
                              <div className="text-[11px] font-bold text-red-800 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-red-600 flex-shrink-0" />
                                {item.damage_type || 'Perlu Pergantian'}
                              </div>
                              {item.replacement_due_date && (
                                <div className="text-[10px] text-red-700 font-mono mt-0.5">
                                  Target Ganti: {item.replacement_due_date}
                                </div>
                              )}
                            </div>
                          )}

                          {item.origin_unit && !isDamaged && (
                            <div className="bg-purple-50 p-1.5 rounded-lg border border-purple-200 max-w-[200px]">
                              <div className="text-[11px] font-bold text-purple-800 flex items-center gap-1">
                                <ArrowRightLeft className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                Kanibal dari:
                              </div>
                              <div className="text-[11px] text-purple-900 font-semibold truncate" title={item.origin_unit}>
                                {item.origin_unit}
                              </div>
                              {item.transfer_date && (
                                <div className="text-[10px] text-purple-600 mt-0.5">Tgl: {item.transfer_date}</div>
                              )}
                            </div>
                          )}

                          {!isDamaged && !item.origin_unit && (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>

                        {/* Tracking QR */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isItemQrReady(item)
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {isItemQrReady(item) ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>QR Ready</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  <span>Belum Ber-QR</span>
                                </>
                              )}
                            </span>
                            <button
                              onClick={() => setQrPrintItem(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                              title="Cetak stiker label thermal QR untuk aset ini"
                            >
                              <Printer className="w-3 h-3" />
                              <span>{isItemQrReady(item) ? 'Cetak Ulang' : 'Cetak QR'}</span>
                            </button>
                          </div>
                        </td>

                        {/* Aksi Kolom (Operasional Lengkap: Pasang, Kanibal, Lapor Rusak, Request, Detail) */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isAdminOrSuperadmin && !isInstalled && (
                              <button
                                onClick={() => {
                                  setActiveItem(item);
                                  setInstallForm({
                                    item_id: item.id,
                                    installed_unit: '',
                                    installation_location_detail: '',
                                    installed_date: new Date().toISOString().split('T')[0],
                                    installed_by: user?.full_name || 'Teknisi Lapangan',
                                    unit_hm_at_install: '',
                                    warranty_duration_months: item.warranty_duration_months || 12,
                                    warranty_provider: item.warranty_provider || '',
                                    notes: '',
                                    document_number: ''
                                  });
                                  setShowInstallModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                                title="Pasang ke Unit / Alat Berat"
                              >
                                <Truck className="w-4 h-4" />
                              </button>
                            )}

                            {isAdminOrSuperadmin && isInstalled && (
                              <button
                                onClick={() => {
                                  setActiveItem(item);
                                  setTransferForm({
                                    item_id: item.id,
                                    origin_unit: item.installed_unit || '',
                                    target_unit: '',
                                    target_location_detail: '',
                                    transfer_date: new Date().toISOString().split('T')[0],
                                    technician_name: user?.full_name || 'Teknisi Fleet',
                                    transfer_reason: 'Kanibalisasi darurat antar-unit akibat breakdown',
                                    document_number: ''
                                  });
                                  setShowTransferModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all cursor-pointer"
                                title="Pindahkan / Kanibal ke Unit Lain"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                            )}

                            {!isDamaged && (
                              <button
                                onClick={() => {
                                  setActiveItem(item);
                                  setDamageForm({
                                    item_id: item.id,
                                    damage_type: 'Wear & Tear (Keausan Material)',
                                    damage_date: new Date().toISOString().split('T')[0],
                                    damage_notes: '',
                                    replacement_due_date: '',
                                    replacement_due_hm: '',
                                    technician_name: user?.full_name || 'Teknisi Lapangan',
                                    set_status_repair: true,
                                    document_number: ''
                                  });
                                  setShowDamageModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all cursor-pointer"
                                title="Lapor Rusak & Jadwalkan Pergantian"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            )}

                            {isAdminOrSuperadmin && isDamaged && (
                              <button
                                onClick={() => {
                                  setActiveItem(item);
                                  setReplaceForm({
                                    disposition: 'scrapped',
                                    new_serial_number: '',
                                    technician_name: user?.full_name || 'Teknisi Pergantian',
                                    document_number: '',
                                    notes: ''
                                  });
                                  setShowReplaceModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                                title="Eksekusi Pergantian Part"
                              >
                                <Wrench className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => openRequestForSpecificItem(item)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                              title="Ajukan Permohonan / Request Part Ini"
                            >
                              <Send className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setQrPrintItem(item)}
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                              title="Cetak Stiker Label Thermal QR Code"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setActiveItem(item);
                                setShowDetailModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                              title="Lihat Detail & QR Tag"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {isAdminOrSuperadmin && (
                              <button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                                title="Hapus Asset"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* DOKUMEN 8 TAHAP & MOS VIEW */}
        {activeTab === 'documents' && (
          <div className="p-6 space-y-6">
            {/* Header Dokumen 8 Tahap */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                    8 STAGE LIFECYCLE
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Workspace: <strong>{activeProject.code}</strong></span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-600" />
                  Siklus Hidup &amp; Arsip Dokumen 8 Tahap ({activeProject.name?.replace(/^Project\s+/i, '')})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap tahapan pengadaan, penerimaan site (MOS), uji commissioning, hingga purna tugas terintegrasi dengan tanda tangan digital.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate('/mos')}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                >
                  <FileText className="w-3.5 h-3.5 text-white" />
                  Form MOS Otorisasi Sah
                </button>
                {isAdminOrSuperadmin && (
                  <button
                    type="button"
                    onClick={() => setShowAddDocModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Terbitkan Dokumen Tahap
                  </button>
                )}
              </div>
            </div>

            {/* Visual 8-Stage Lifecycle Progress Tracker */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {[
                { code: 'RFI', num: 1, name: 'RFI (Info)', color: 'blue' },
                { code: 'PR', num: 2, name: 'PR (Requisition)', color: 'indigo' },
                { code: 'PO', num: 3, name: 'PO (Purchase)', color: 'violet' },
                { code: 'Delivery', num: 4, name: 'DO (Ekspedisi)', color: 'amber' },
                { code: 'MOS', num: 5, name: 'MOS (Site Intake)', color: 'emerald', highlight: true },
                { code: 'QC', num: 6, name: 'QC (Commissioning)', color: 'cyan' },
                { code: 'Operational', num: 7, name: 'BAST & Pindahan', color: 'teal' },
                { code: 'Decommissioning', num: 8, name: 'Afkir & Scrap', color: 'slate' }
              ].map(st => {
                const count = projectDocs.filter(d => d.stage_code === st.code).length;
                const isSelected = selectedStageFilter === st.code;

                return (
                  <div
                    key={st.code}
                    onClick={() => setSelectedStageFilter(isSelected ? 'ALL' : st.code)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-left select-none relative overflow-hidden ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : st.highlight
                        ? 'bg-emerald-50/50 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
                        : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-slate-500">#{st.num}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {count} doc
                      </span>
                    </div>
                    <div className="font-mono font-black text-xs text-slate-900">{st.code}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{st.name}</div>
                  </div>
                );
              })}
            </div>

            {/* Filter Pill Badges */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-slate-500 font-semibold shrink-0">Filter Tahap:</span>
              <button
                onClick={() => setSelectedStageFilter('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedStageFilter === 'ALL'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Tahap ({projectDocs.length})
              </button>
              {['RFI', 'PR', 'PO', 'Delivery', 'MOS', 'QC', 'Operational', 'Decommissioning'].map(s => {
                const count = projectDocs.filter(d => d.stage_code === s).length;
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedStageFilter(s)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
                      selectedStageFilter === s
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s} ({count})
                  </button>
                );
              })}
            </div>

            {/* Documents Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                    <th className="px-4 py-3">Tahapan (1-8)</th>
                    <th className="px-4 py-3">Nomor Dokumen</th>
                    <th className="px-4 py-3">Judul &amp; Ringkasan Pekerjaan</th>
                    <th className="px-4 py-3">Pembuat / Jabatan</th>
                    <th className="px-4 py-3">Tanggal &amp; Target</th>
                    <th className="px-4 py-3 text-center">Tanda Tangan Otorisasi</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectDocs.filter(d => selectedStageFilter === 'ALL' || d.stage_code === selectedStageFilter).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                        Belum ada dokumen yang terdaftar pada tahapan {selectedStageFilter} untuk workspace ini.
                      </td>
                    </tr>
                  ) : (
                    projectDocs
                      .filter(d => selectedStageFilter === 'ALL' || d.stage_code === selectedStageFilter)
                      .map((doc) => {
                        const isMos = doc.stage_code === 'MOS';
                        const isSigned = doc.signatures_count >= (doc.required_signatures || 1);

                        return (
                          <tr key={doc.id || doc.doc_number} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold text-[10px] border ${
                                isMos
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                <FileCheck2 className="w-3 h-3 text-emerald-600" />
                                {doc.stage_code} (#{doc.stage_number || 5})
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-mono font-bold text-slate-900 text-xs">{doc.doc_number}</div>
                              <div className="text-[10px] text-slate-400 font-mono">Workspace: {doc.project_code || activeProject.code}</div>
                            </td>

                            <td className="px-4 py-3 max-w-sm">
                              <div className="font-bold text-slate-900 text-xs leading-snug">{doc.title}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{doc.summary || '-'}</div>
                              {doc.file_attachment && (
                                <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-blue-600">
                                  <FileText className="w-3 h-3" /> {doc.file_attachment}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-800">{doc.creator_name || '-'}</div>
                              <div className="text-[10px] text-slate-400">{doc.creator_role || 'Staff Site'}</div>
                            </td>

                            <td className="px-4 py-3 font-mono text-[10px] text-slate-600">
                              <div>Dibuat: <span className="font-bold text-slate-800">{doc.created_date || '-'}</span></div>
                              {doc.due_date && <div>Tenggat: <span className="text-slate-500">{doc.due_date}</span></div>}
                            </td>

                            <td className="px-4 py-3 text-center">
                              {isSigned ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  {doc.signatures_count}/{doc.required_signatures || 2} Terotorisasi
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  {doc.signatures_count || 0}/{doc.required_signatures || 2} Pending
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                                {doc.status || 'Active'}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedDocDetail(doc)}
                                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition cursor-pointer shadow-2xs"
                                >
                                  Detail &amp; Sah
                                </button>
                                {isMos && (
                                  <button
                                    onClick={() => navigate('/mos')}
                                    className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                                    title="Buka Lembar MOS Resmi"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GUDANG PROJECT VIEW */}
        {activeTab === 'warehouses' && (
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Gudang &amp; Depot Penyimpanan {activeProject.name?.replace(/^Project\s+/i, '')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar fasilitas pergudangan penyimpanan komponen dan peralatan workspace ini.
                </p>
              </div>

              {isAdminOrSuperadmin && (
                <button
                  onClick={() => setShowAddWarehouseModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Gudang Baru
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warehouses.map(wh => {
                const whItems = items.filter(i => i.warehouse_id === wh.id);
                return (
                  <div key={wh.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all relative group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold">
                          <Warehouse className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">{wh.name}</h4>
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded font-semibold">{wh.code}</span>
                        </div>
                      </div>

                      {isAdminOrSuperadmin && (
                        <button
                          onClick={() => handleDeleteWarehouse(wh.id, wh.name)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="Hapus Gudang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Lokasi Site:</span>
                        <span className="font-semibold text-slate-800">{wh.location || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">PIC Penanggung Jawab:</span>
                        <span className="font-semibold text-slate-800">{wh.pic_name || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Kontak / Radio Ch:</span>
                        <span className="font-mono text-slate-700">{wh.pic_contact || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <span className="text-slate-400">Kapasitas Rak:</span>
                        <span className="font-bold text-slate-900">{wh.capacity_shelves || 100} Rak</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Material Tersimpan:</span>
                        <span className="font-bold text-red-600">{whItems.length} Jenis Part</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AUDIT & MUTATION LOGS */}
        {activeTab === 'logs' && (
          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Riwayat Mutasi &amp; Permohonan</h3>
            <p className="text-xs text-slate-500 mb-6">
              Catatan kronologis penerimaan, permohonan material user, pemasangan alat, kanibalisasi, dan pergantian komponen.
            </p>

            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Belum ada log mutasi pada workspace ini.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {logs.map((log) => {
                  const isRequest = log.action_type === 'REQUEST_USER';
                  const isInstall = log.action_type === 'PASANG';
                  const isTransfer = log.action_type === 'PINDAH_UNIT';
                  const isDamage = log.action_type === 'RUSAK';
                  const isReplace = log.action_type === 'GANTI';

                  return (
                    <div key={log.id} className="relative group">
                      <div className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                        isRequest ? 'bg-amber-600 ring-4 ring-amber-100' :
                        isInstall ? 'bg-blue-600 ring-4 ring-blue-100' :
                        isTransfer ? 'bg-purple-600 ring-4 ring-purple-100' :
                        isDamage ? 'bg-red-600 ring-4 ring-red-100' :
                        'bg-emerald-600 ring-4 ring-emerald-100'
                      }`} />

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-all">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isRequest ? 'bg-amber-100 text-amber-800' :
                              isInstall ? 'bg-blue-100 text-blue-800' :
                              isTransfer ? 'bg-purple-100 text-purple-800' :
                              isDamage ? 'bg-red-100 text-red-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {isRequest ? 'PERMOHONAN USER' : log.action_type}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-800">{log.document_number || 'DOC-REG'}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(log.created_at).toLocaleString('id-ID')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 mt-2 font-medium leading-relaxed">
                          {log.notes}
                        </p>

                        <div className="mt-3 pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                          <div className="flex items-center gap-3">
                            <span>Asal: <strong className="text-slate-700">{log.source_location || '-'}</strong></span>
                            <span className="text-slate-400">&rarr;</span>
                            <span>Tujuan: <strong className="text-slate-700">{log.destination_location || '-'}</strong></span>
                          </div>
                          <div>
                            Pengaju / Teknisi: <strong className="text-slate-700">{log.technician_name || '-'}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </>
    )}
  </div>
</div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: FORMULIR PERMOHONAN MATERIAL RESMI (MATERIAL REQUEST - FULL DOC) */}
      {/* ===================================================================== */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-700/30 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 my-auto flex flex-col max-h-[94vh]">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold shadow-xs">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      DOKUMEN RESMI MR (007_VGT_MR)
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      Workspace: {activeProject.name?.replace(/^Project\s+/i, '')}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                    Formulir Permohonan &amp; Otorisasi Material
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi seluruh parameter dokumen resmi agar lembar approval, rute, dan rincian material terisi penuh.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Datalist for autocomplete suggestion from inventory items */}
            <datalist id="inventory-item-suggestions">
              {items.map(it => (
                <option key={it.id} value={it.name}>
                  {it.item_code} | Rak: {it.bin_location || '-'} | Stok: {it.quantity || 0} {it.unit || 'PCS'}
                </option>
              ))}
            </datalist>

            {/* Scrollable Form Body */}
            <form onSubmit={handleRequestSubmit} className="mt-4 space-y-5 overflow-y-auto pr-1 text-xs flex-1">
              
              {/* ── SEKSI 1: NOMOR DOKUMEN & REFERENSI PEKERJAAN ── */}
              <div className="p-4 rounded-2xl border border-red-200/80 bg-red-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      1. Identitas Dokumen &amp; Penomoran Resmi
                    </h4>
                  </div>
                  <span className="text-[10px] text-red-600 font-mono font-semibold">Nomor Unik Otomatis &amp; Editable</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* No. Dokumen MR */}
                  <div className="lg:col-span-2 space-y-1">
                    <label className="block font-semibold text-slate-700">
                      No. Dokumen Permohonan (MR):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        required
                        value={requestForm.document_number}
                        onChange={e => setRequestForm({ ...requestForm, document_number: e.target.value })}
                        placeholder="Contoh: 007/VGT/MR/MNTOA/BIBOA/X/2026"
                        className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono font-bold text-red-700 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleRefreshMRNumber}
                        className="px-2.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-600 font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Acak / Generate Nomor Baru"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Acak</span>
                      </button>
                    </div>
                  </div>

                  {/* Tanggal Dokumen */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Tanggal Permohonan:
                    </label>
                    <input
                      type="date"
                      required
                      value={requestForm.doc_date}
                      onChange={e => setRequestForm({ ...requestForm, doc_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Tanggal Target Dibutuhkan */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Target Dibutuhkan (Deadline):
                    </label>
                    <input
                      type="date"
                      value={requestForm.required_date}
                      onChange={e => setRequestForm({ ...requestForm, required_date: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* No. Work Order (WO) */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      No. Work Order (WO) / SPK Lapangan:
                    </label>
                    <input
                      type="text"
                      value={requestForm.work_order_number}
                      onChange={e => setRequestForm({ ...requestForm, work_order_number: e.target.value })}
                      placeholder="Contoh: WO-2026-X-044 / SPK-BIB-091"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Departemen / Divisi */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Departemen / Divisi Pemohon:
                    </label>
                    <input
                      type="text"
                      value={requestForm.department}
                      onChange={e => setRequestForm({ ...requestForm, department: e.target.value })}
                      placeholder="Maintenance & Instrumentation Pit"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ── SEKSI 2: RUTE DISTRIBUSI & ALOKASI UNIT (DARI MANA KE MANA) ── */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                    2. Rute Distribusi &amp; Alokasi Pemasangan (Dari Asal ke Tujuan)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Lokasi Asal (Dari Mana) */}
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-700">
                      Lokasi / Gudang Asal Pengambilan:
                    </label>
                    <input
                      type="text"
                      required
                      value={requestForm.source_location}
                      onChange={e => setRequestForm({ ...requestForm, source_location: e.target.value })}
                      placeholder="Contoh: Gudang Project WIM / Warehouse Central Sebamban KM-24"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                    />
                    <div className="flex flex-wrap gap-1">
                      {['Gudang Project WIM', 'Warehouse Central KM-24', 'Workshop Hauling', 'Gudang Utama'].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setRequestForm({ ...requestForm, source_location: chip })}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-red-400 text-[10px] text-slate-600 cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lokasi Tujuan (Akan Kemana) */}
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-slate-700">
                      Lokasi Tujuan / Site Lapangan:
                    </label>
                    <input
                      type="text"
                      required
                      value={requestForm.destination_location}
                      onChange={e => setRequestForm({ ...requestForm, destination_location: e.target.value })}
                      placeholder="Contoh: BIB Pit Sebamban KM-14 / WIM Station KM-30"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none font-medium"
                    />
                    <div className="flex flex-wrap gap-1">
                      {['BIB Pit Sebamban KM-14', 'WIM Station KM-30', 'Pos Timbangan J1', 'Workshop Pit Sebamban'].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setRequestForm({ ...requestForm, destination_location: chip })}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-red-400 text-[10px] text-slate-600 cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Unit Alokasi / Titik Pasang */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Unit Alokasi / Fleet / Titik Pasang:
                    </label>
                    <input
                      type="text"
                      value={requestForm.requested_unit}
                      onChange={e => setRequestForm({ ...requestForm, requested_unit: e.target.value })}
                      placeholder="Contoh: CAT 777D #HT-08 / Jembatan Timbang WIM"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  {/* PIC Penerima di Lokasi */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      PIC Penerima / Pengawas Lapangan:
                    </label>
                    <input
                      type="text"
                      value={requestForm.destination_receiver}
                      onChange={e => setRequestForm({ ...requestForm, destination_receiver: e.target.value })}
                      placeholder="Contoh: Admin Logistik Site / SPV Lapangan"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ── SEKSI 3: PERSONEL PEMOHON, TINGKAT URGENSI & KONDISI ── */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                    3. Data Pemohon (Dari Siapa) &amp; Prioritas
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Nama Pemohon */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Nama Pemohon / PIC:
                    </label>
                    <input
                      type="text"
                      required
                      value={requestForm.requester_name}
                      onChange={e => setRequestForm({ ...requestForm, requester_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Jabatan Pemohon */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Jabatan / Peran Pemohon:
                    </label>
                    <input
                      type="text"
                      value={requestForm.requester_role}
                      onChange={e => setRequestForm({ ...requestForm, requester_role: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Tingkat Urgensi */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Tingkat Urgensi:
                    </label>
                    <select
                      value={requestForm.urgency}
                      onChange={e => setRequestForm({ ...requestForm, urgency: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                      <option value="Normal Maintenance">Normal Maintenance (Rutin)</option>
                      <option value="Urgent Breakdown">Mendesak / Unit Breakdown</option>
                      <option value="Pergantian Part Aus">Pergantian Part Aus Terjadwal</option>
                      <option value="Emergency Standstill">Emergency Standstill (Kritis)</option>
                    </select>
                  </div>

                  {/* Kondisi Material yang Diminta */}
                  <div className="space-y-1">
                    <label className="block font-semibold text-slate-700">
                      Kondisi Material Diminta:
                    </label>
                    <select
                      value={requestForm.material_condition}
                      onChange={e => setRequestForm({ ...requestForm, material_condition: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    >
                      <option value="Baru & Segel Original">Baru &amp; Segel Original</option>
                      <option value="Sparepart Cadangan Siap Pakai">Sparepart Cadangan Siap Pakai</option>
                      <option value="Boleh Rekondisi Layak Pakai">Boleh Rekondisi Layak Pakai</option>
                      <option value="Kanibalisasi Antar-Unit">Kanibalisasi Antar-Unit</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── SEKSI 4: TABEL RINCIAN MATERIAL MULTI-ITEM (INTERAKTIF) ── */}
              <div className="p-4 rounded-2xl border border-blue-200/90 bg-blue-50/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      4. Tabel Rincian Material yang Diminta ({(requestForm.items || []).length} Item)
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRequestItemRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Baris Material</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-8">#</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Nama Komponen / Material *</th>
                        <th className="py-2.5 px-3 min-w-[130px]">Part Number / SKU</th>
                        <th className="py-2.5 px-3 min-w-[110px]">Serial Number</th>
                        <th className="py-2.5 px-3 w-28">Jumlah &amp; Satuan</th>
                        <th className="py-2.5 px-3 min-w-[90px]">Rak / Bin</th>
                        <th className="py-2.5 px-3 min-w-[150px]">Keterangan</th>
                        <th className="py-2.5 px-3 w-10 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(requestForm.items || []).map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                          
                          {/* Nama Komponen with autocomplete datalist */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              list="inventory-item-suggestions"
                              value={row.item_name}
                              onChange={e => {
                                const val = e.target.value;
                                const matched = items.find(it => it.name.toLowerCase() === val.toLowerCase());
                                if (matched) {
                                  handleUpdateRequestItemRow(idx, 'item_name', matched.name);
                                  handleUpdateRequestItemRow(idx, 'part_number', matched.item_code || '');
                                  handleUpdateRequestItemRow(idx, 'rack_location', matched.bin_location || '');
                                  handleUpdateRequestItemRow(idx, 'unit', matched.unit || 'PCS');
                                } else {
                                  handleUpdateRequestItemRow(idx, 'item_name', val);
                                }
                              }}
                              placeholder="Contoh: Sensor Load Cell 50T"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-red-500"
                            />
                          </td>

                          {/* Part Number */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.part_number}
                              onChange={e => handleUpdateRequestItemRow(idx, 'part_number', e.target.value)}
                              placeholder="WIM-LC-50T"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-red-500"
                            />
                          </td>

                          {/* Serial Number */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.serial_number}
                              onChange={e => handleUpdateRequestItemRow(idx, 'serial_number', e.target.value)}
                              placeholder="SN-91913187"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:border-red-500"
                            />
                          </td>

                          {/* Qty & Unit */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                value={row.quantity}
                                onChange={e => handleUpdateRequestItemRow(idx, 'quantity', e.target.value)}
                                className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-center focus:outline-none focus:border-red-500"
                              />
                              <input
                                type="text"
                                value={row.unit}
                                onChange={e => handleUpdateRequestItemRow(idx, 'unit', e.target.value)}
                                placeholder="PCS"
                                className="w-14 px-1.5 py-1.5 rounded-lg border border-slate-200 text-xs text-center focus:outline-none focus:border-red-500"
                              />
                            </div>
                          </td>

                          {/* Rak / Bin */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.rack_location}
                              onChange={e => handleUpdateRequestItemRow(idx, 'rack_location', e.target.value)}
                              placeholder="R-A01"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-center focus:outline-none focus:border-red-500"
                            />
                          </td>

                          {/* Keterangan */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.notes}
                              onChange={e => handleUpdateRequestItemRow(idx, 'notes', e.target.value)}
                              placeholder="Catatan penggantian / unit"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-red-500"
                            />
                          </td>

                          {/* Aksi Delete */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRequestItemRow(idx)}
                              disabled={(requestForm.items || []).length <= 1}
                              className="p-1.5 text-slate-300 hover:text-red-600 disabled:opacity-20 transition-colors cursor-pointer"
                              title="Hapus Baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── SEKSI 5: ALUR OTORISASI 3 SLOT (APPROVAL UNTUK SIAPA) ── */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                      5. Alur Otorisasi Dokumen 3 Slot (Approval untuk Siapa)
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Tampil pada Kolom Lembar Dokumen Resmi</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Slot 1: Pembuat / Dibuat Oleh */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Slot 1: Dibuat Oleh (Pemohon)</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500">Nama Lengkap:</label>
                      <input
                        type="text"
                        value={requestForm.approval_maker_name}
                        onChange={e => setRequestForm({ ...requestForm, approval_maker_name: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500">Jabatan / Departemen:</label>
                      <input
                        type="text"
                        value={requestForm.approval_maker_role}
                        onChange={e => setRequestForm({ ...requestForm, approval_maker_role: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Slot 2: Pemeriksa / Diperiksa Oleh */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Slot 2: Diperiksa Oleh (Checker)</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500">Nama Lengkap:</label>
                      <input
                        type="text"
                        value={requestForm.approval_checker_name}
                        onChange={e => setRequestForm({ ...requestForm, approval_checker_name: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500">Jabatan / Departemen:</label>
                      <input
                        type="text"
                        value={requestForm.approval_checker_role}
                        onChange={e => setRequestForm({ ...requestForm, approval_checker_role: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Slot 3: Penyetuju / Diketahui Oleh */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Slot 3: Diketahui Oleh (Approver)</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500">Nama Lengkap:</label>
                      <input
                        type="text"
                        value={requestForm.approval_approver_name}
                        onChange={e => setRequestForm({ ...requestForm, approval_approver_name: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500">Jabatan / Departemen:</label>
                      <input
                        type="text"
                        value={requestForm.approval_approver_role}
                        onChange={e => setRequestForm({ ...requestForm, approval_approver_role: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SEKSI 6: CATATAN TEKNIS / ALASAN KEBUTUHAN ── */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-700">
                  Alasan Permohonan, Kronologi Kerusakan &amp; Catatan Teknis Lapangan:
                </label>
                <textarea
                  rows="3"
                  value={requestForm.justification}
                  onChange={e => setRequestForm({ ...requestForm, justification: e.target.value })}
                  placeholder="Jelaskan secara lengkap alasan kebutuhan penggantian komponen, kronologi kerusakan, kondisi fisik alat, atau nomor laporan wo..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* ── SEKSI 7: OPSI TERBITKAN KE WAITING LIST APPROVAL ── */}
              <div className="p-3 bg-red-50/50 border border-red-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="publish-to-mos-check"
                    checked={requestForm.publish_to_mos}
                    onChange={e => setRequestForm({ ...requestForm, publish_to_mos: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="publish-to-mos-check" className="text-xs text-slate-700 font-medium cursor-pointer">
                    <strong>Terbitkan langsung ke Lembar Dokumen Waiting List (Modul MOS / MR)</strong>
                    <div className="text-[10px] text-slate-500">
                      Dokumen resmi akan otomatis dibuat dan siap dibubuhi tanda tangan digital transparan pada lembar canvas.
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                    {requestForm.document_number}
                  </span>
                  <span>&bull; Total: <strong>{(requestForm.items || []).length} Baris Material</strong></span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>Terbitkan &amp; Kirim Permohonan Resmi</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DETAIL ASSET & QR PREVIEW */}
      {/* ===================================================================== */}
      {showDetailModal && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Kartu Aset Project</h3>
                  <p className="text-xs text-slate-500 font-mono">Digitech Project Identification</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="font-mono text-xl font-black tracking-widest text-slate-900">
                  ||| | ||||| || |||| ||| |||||
                </div>
                <div className="font-mono text-xs font-bold text-slate-700 mt-1">
                  {activeItem.serial_number || activeItem.item_code}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                  DIGITECH ASSET IDENTIFICATION TAG
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Nama Part:</span>
                  <span className="font-bold text-slate-800 text-right">{activeItem.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Part Number / SKU:</span>
                  <span className="font-mono font-bold text-slate-800">{activeItem.item_code}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Serial Number:</span>
                  <span className="font-mono font-bold text-blue-600">{activeItem.serial_number || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Lokasi / Unit Terpasang:</span>
                  <span className="font-bold text-slate-800">{activeItem.installed_unit || 'Di Gudang'}</span>
                </div>
                {activeItem.installation_location_detail && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Detail Posisi:</span>
                    <span className="text-slate-700 text-right">{activeItem.installation_location_detail}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Status Garansi:</span>
                  <span className="font-bold text-emerald-700">
                    {activeItem.warranty_status === 'active' ? 'Aktif' : activeItem.warranty_status} ({activeItem.warranty_expiry_date || '-'})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Vendor Garansi:</span>
                  <span className="text-slate-700">{activeItem.warranty_provider || '-'}</span>
                </div>
                {activeItem.origin_unit && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-purple-600 font-bold">Kanibal dari Unit:</span>
                    <span className="font-bold text-purple-800">{activeItem.origin_unit}</span>
                  </div>
                )}
                {activeItem.is_damaged && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-red-600 font-bold">Status Kerusakan:</span>
                    <span className="font-bold text-red-700">{activeItem.damage_type} (Target Ganti: {activeItem.replacement_due_date || '-'})</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                {isUserReadOnly && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openRequestForSpecificItem(activeItem);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Ajukan Permohonan Part Ini
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCyberQrItem({
                      sku: activeItem.item_code,
                      name: activeItem.name,
                      category: activeItem.category,
                      current_stock: activeItem.quantity || 1,
                      serialNumber: activeItem.serial_number,
                      location: activeItem.installed_unit || 'Gudang Utama',
                      rack: activeItem.installation_location_detail || 'R-01',
                      projectId: selectedProjectId
                    });
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Registrasi &amp; Cetak QR</span>
                </button>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer ml-auto transition"
                >
                  Tutup Kartu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PENERIMAAN BARANG MASUK */}
      {/* ===================================================================== */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Penerimaan Material Masuk (Stock In)</h3>
                  <p className="text-xs text-slate-500">Workspace: {activeProject.name?.replace(/^Project\s+/i, '')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrinterSetup(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  title="Pengaturan Kertas &amp; Printer Thermal"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Setup Printer</span>
                </button>
                <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Auto QR Label Generation Banner */}
            <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-xl flex items-center justify-between text-xs text-indigo-900">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span><strong>Auto QR Generator:</strong> Label tracking fisik akan dibuat otomatis saat material disimpan.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPrinterSetup(true)}
                className="text-[11px] font-bold text-indigo-700 underline hover:text-indigo-900 cursor-pointer ml-2 flex-shrink-0"
              >
                Ubah Ukuran Label
              </button>
            </div>

            <form onSubmit={(e) => handleCreateItem(e, true)} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Barang / Komponen *</label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="Contoh: Load Cell 50T / GPS RTK"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Part Number / SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={itemForm.item_code}
                    onChange={e => setItemForm({ ...itemForm, item_code: e.target.value })}
                    placeholder="Contoh: WIM-LC-50T / FAM-GPS-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number (S/N) Unik</label>
                  <input
                    type="text"
                    value={itemForm.serial_number}
                    onChange={e => setItemForm({ ...itemForm, serial_number: e.target.value })}
                    placeholder="Contoh: SN-2026-88192"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={itemForm.category}
                    onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                    placeholder="Sensor, Telematika, Mechanical..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand / Pabrikan</label>
                  <input
                    type="text"
                    value={itemForm.brand}
                    onChange={e => setItemForm({ ...itemForm, brand: e.target.value })}
                    placeholder="Mettler Toledo, Trimble, SKF..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gudang Tujuan</label>
                  <select
                    value={itemForm.warehouse_id}
                    onChange={e => setItemForm({ ...itemForm, warehouse_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Pilih Gudang</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah (Qty) & Satuan</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={itemForm.quantity}
                      onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })}
                      className="w-24 px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500"
                    />
                    <select
                      value={itemForm.unit}
                      onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                    >
                      <option value="PCS">PCS</option>
                      <option value="UNIT">UNIT</option>
                      <option value="SET">SET</option>
                      <option value="BOX">BOX</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi Awal</label>
                  <select
                    value={itemForm.condition}
                    onChange={e => setItemForm({ ...itemForm, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500"
                  >
                    <option value="Baru">Baru (Original)</option>
                    <option value="Bekas Baik">Bekas Baik (Ready)</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    value={itemForm.price}
                    onChange={e => setItemForm({ ...itemForm, price: e.target.value })}
                    placeholder="Contoh: 15000000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. DO / PO / Surat Jalan</label>
                  <input
                    type="text"
                    value={itemForm.document_number}
                    onChange={e => setItemForm({ ...itemForm, document_number: e.target.value })}
                    placeholder="Contoh: DO-VGT-2026-88"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Direct Installation Option */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.direct_install}
                    onChange={e => setItemForm({ ...itemForm, direct_install: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Langsung pasang ke unit/alat berat saat tiba (Direct Installation)
                  </span>
                </label>

                {itemForm.direct_install && (
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nomor Unit / Lokasi Pasang *</label>
                      <input
                        type="text"
                        required={itemForm.direct_install}
                        value={itemForm.installed_unit}
                        onChange={e => setItemForm({ ...itemForm, installed_unit: e.target.value })}
                        placeholder="CAT 777D #HT-08 / Jembatan Timbang KM-14"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Detail Titik Pasang</label>
                      <input
                        type="text"
                        value={itemForm.installation_location_detail}
                        onChange={e => setItemForm({ ...itemForm, installation_location_detail: e.target.value })}
                        placeholder="Front Axle Sensor / Kabin Dashboard"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Hour Meter (HM) Saat Pasang</label>
                      <input
                        type="number"
                        step="0.1"
                        value={itemForm.unit_hm_at_install}
                        onChange={e => setItemForm({ ...itemForm, unit_hm_at_install: e.target.value })}
                        placeholder="Contoh: 14200.5"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Masa Garansi (Bulan)</label>
                      <input
                        type="number"
                        value={itemForm.warranty_duration_months}
                        onChange={e => setItemForm({ ...itemForm, warranty_duration_months: e.target.value })}
                        placeholder="12"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPrinterSetup(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer self-start sm:self-auto"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Setting Printer Thermal</span>
                </button>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCreateItem(e, false)}
                    className="px-4 py-2 bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    Simpan Saja
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCreateItem(e, true)}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-red-700 hover:to-indigo-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Simpan &amp; Cetak Label QR</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: TAMBAH GUDANG PROJECT */}
      {/* ===================================================================== */}
      {showAddWarehouseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Tambah Gudang Baru</h3>
                  <p className="text-xs text-slate-500">Workspace: {activeProject.name?.replace(/^Project\s+/i, '')}</p>
                </div>
              </div>
              <button onClick={() => setShowAddWarehouseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Gudang *</label>
                <input
                  type="text"
                  required
                  value={warehouseForm.name}
                  onChange={e => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  placeholder="Contoh: Gudang WIM Pit 2 / Container Telematika"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Gudang *</label>
                  <input
                    type="text"
                    required
                    value={warehouseForm.code}
                    onChange={e => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
                    placeholder="WH-WIM-03"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kapasitas Rak</label>
                  <input
                    type="number"
                    value={warehouseForm.capacity_shelves}
                    onChange={e => setWarehouseForm({ ...warehouseForm, capacity_shelves: e.target.value })}
                    placeholder="100"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Fisik / Site</label>
                <input
                  type="text"
                  value={warehouseForm.location}
                  onChange={e => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
                  placeholder="Contoh: Sebamban KM-14 / Pit South KM 04"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PIC Penanggung Jawab</label>
                  <input
                    type="text"
                    value={warehouseForm.pic_name}
                    onChange={e => setWarehouseForm({ ...warehouseForm, pic_name: e.target.value })}
                    placeholder="Nama PIC Gudang"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kontak / Radio HT</label>
                  <input
                    type="text"
                    value={warehouseForm.pic_contact}
                    onChange={e => setWarehouseForm({ ...warehouseForm, pic_contact: e.target.value })}
                    placeholder="No HP / Radio Ch 12"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddWarehouseModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-700 cursor-pointer"
                >
                  Buat Gudang Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PASANG KE UNIT */}
      {/* ===================================================================== */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Pasang Material ke Unit</h3>
                  <p className="text-xs text-slate-500 font-mono">{activeItem ? activeItem.name : 'Pilih Komponen'}</p>
                </div>
              </div>
              <button onClick={() => setShowInstallModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInstallSubmit} className="mt-5 space-y-4">
              {/* Component Picker if activeItem is not yet selected */}
              {!activeItem ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Komponen / Asset yang Akan Dipasang *</label>
                  <select
                    required
                    value={installForm.item_id}
                    onChange={e => {
                      const found = items.find(it => it.id === e.target.value);
                      setInstallForm({ ...installForm, item_id: e.target.value });
                      if (found) setActiveItem(found);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Pilih Komponen dari Inventaris --</option>
                    {items.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.name} ({it.item_code} {it.serial_number ? `• SN: ${it.serial_number}` : ''}) — {it.installed_unit ? `Terpasang di ${it.installed_unit}` : 'Di Rak Gudang'}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500">Komponen Dipilih:</span>
                    <div className="font-bold text-slate-900 text-sm">{activeItem.name}</div>
                    <div className="font-mono text-slate-500 text-[11px]">{activeItem.item_code} {activeItem.serial_number ? `• SN: ${activeItem.serial_number}` : ''}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveItem(null);
                      setInstallForm(prev => ({ ...prev, item_id: '' }));
                    }}
                    className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    Ganti Komponen
                  </button>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit / Alat Berat / Lokasi Fisik Pasang *</label>
                <input
                  type="text"
                  required
                  value={installForm.installed_unit}
                  onChange={e => setInstallForm({ ...installForm, installed_unit: e.target.value })}
                  placeholder="Contoh: CAT 777D #HT-08 / Komatsu PC2000 #EX-02 / WIM KM-14"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detail Posisi / Titik Pasang</label>
                <input
                  type="text"
                  value={installForm.installation_location_detail}
                  onChange={e => setInstallForm({ ...installForm, installation_location_detail: e.target.value })}
                  placeholder="Contoh: Front Axle Bracket / Overhead Cabin Console"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Pasang</label>
                  <input
                    type="date"
                    required
                    value={installForm.installed_date}
                    onChange={e => setInstallForm({ ...installForm, installed_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hour Meter (HM) Unit Pasang</label>
                  <input
                    type="number"
                    step="0.1"
                    value={installForm.unit_hm_at_install}
                    onChange={e => setInstallForm({ ...installForm, unit_hm_at_install: e.target.value })}
                    placeholder="Contoh: 14250.0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Masa Garansi Setelah Pasang</label>
                  <select
                    value={installForm.warranty_duration_months}
                    onChange={e => setInstallForm({ ...installForm, warranty_duration_months: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
                  >
                    <option value={6}>6 Bulan Garansi</option>
                    <option value={12}>12 Bulan (1 Tahun)</option>
                    <option value={24}>24 Bulan (2 Tahun)</option>
                    <option value={36}>36 Bulan (3 Tahun)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor Penjamin Garansi</label>
                  <input
                    type="text"
                    value={installForm.warranty_provider}
                    onChange={e => setInstallForm({ ...installForm, warranty_provider: e.target.value })}
                    placeholder="PT Trakindo / Trimble Indo"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowInstallModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 cursor-pointer"
                >
                  Konfirmasi Pemasangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PINDAH / KANIBAL UNIT */}
      {/* ===================================================================== */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Kanibalisasi / Pindah Unit</h3>
                  <p className="text-xs text-slate-500 font-mono">{activeItem ? activeItem.name : 'Pilih Komponen Terpasang'}</p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="mt-5 space-y-4">
              {/* Component Picker if activeItem not selected */}
              {!activeItem ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Komponen yang Akan Dipindah / Dikanibal *</label>
                  <select
                    required
                    value={transferForm.item_id}
                    onChange={e => {
                      const found = items.find(it => it.id === e.target.value);
                      setTransferForm({ ...transferForm, item_id: e.target.value, origin_unit: found?.installed_unit || '' });
                      if (found) setActiveItem(found);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Pilih Komponen dari Unit --</option>
                    {items.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.name} (Unit: {it.installed_unit || 'Gudang'} • {it.item_code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500">Komponen Dipilih:</span>
                    <div className="font-bold text-slate-900 text-sm">{activeItem.name}</div>
                    <div className="font-semibold text-purple-800 text-[11px]">Unit Asal: {activeItem.installed_unit || 'Gudang'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveItem(null);
                      setTransferForm(prev => ({ ...prev, item_id: '' }));
                    }}
                    className="text-xs text-purple-600 hover:underline font-bold cursor-pointer"
                  >
                    Ganti Komponen
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit / Lokasi Tujuan Transfer *</label>
                <input
                  type="text"
                  required
                  value={transferForm.target_unit}
                  onChange={e => setTransferForm({ ...transferForm, target_unit: e.target.value })}
                  placeholder="Contoh: CAT 777D #HT-12 (Unit Breakdown Urgent)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Kanibalisasi / Perpindahan *</label>
                <select
                  value={transferForm.transfer_reason}
                  onChange={e => setTransferForm({ ...transferForm, transfer_reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value="Kanibalisasi darurat antar-unit akibat breakdown">Kanibalisasi darurat breakdown (Urgent Priority)</option>
                  <option value="Unit asal masuk jadwal Major Overhaul 1 bulan">Unit asal sedang Major Overhaul</option>
                  <option value="Relokasi ke lokasi lain">Relokasi ke lokasi/unit lain</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-purple-700 cursor-pointer"
                >
                  Simpan Kanibalisasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: LAPOR RUSAK */}
      {/* ===================================================================== */}
      {showDamageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Lapor Kerusakan & Jadwal Ganti</h3>
                  <p className="text-xs text-slate-500 font-mono">{activeItem ? activeItem.name : 'Pilih Komponen'}</p>
                </div>
              </div>
              <button onClick={() => setShowDamageModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDamageSubmit} className="mt-5 space-y-4">
              {/* Component Picker if activeItem not selected */}
              {!activeItem ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Komponen yang Mengalami Kerusakan *</label>
                  <select
                    required
                    value={damageForm.item_id}
                    onChange={e => {
                      const found = items.find(it => it.id === e.target.value);
                      setDamageForm({ ...damageForm, item_id: e.target.value });
                      if (found) setActiveItem(found);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">-- Pilih Komponen dari Inventaris --</option>
                    {items.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.name} ({it.item_code} • Lokasi: {it.installed_unit || 'Di Gudang'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500">Komponen Rusak:</span>
                    <div className="font-bold text-slate-900 text-sm">{activeItem.name}</div>
                    <div className="font-mono text-slate-500 text-[11px]">{activeItem.item_code} (Posisi: {activeItem.installed_unit || 'Di Gudang'})</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveItem(null);
                      setDamageForm(prev => ({ ...prev, item_id: '' }));
                    }}
                    className="text-xs text-red-600 hover:underline font-bold cursor-pointer"
                  >
                    Ganti Komponen
                  </button>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kerusakan / Diagnosa *</label>
                <select
                  value={damageForm.damage_type}
                  onChange={e => setDamageForm({ ...damageForm, damage_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold"
                >
                  <option value="Wear & Tear (Keausan Material > 80%)">Wear & Tear (Keausan Material &gt; 80%)</option>
                  <option value="Benturan Fisik / Retak Fatigue">Benturan Fisik / Retak Fatigue</option>
                  <option value="Korsleting Listrik / Kabel Putus">Korsleting Listrik / Kabel Putus</option>
                  <option value="Overheating & Kebocoran Seal">Overheating & Kebocoran Seal</option>
                </select>
              </div>

              <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-3">
                <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-red-600" />
                  Target Jadwal Pergantian Berkala
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tanggal Target Ganti</label>
                    <input
                      type="date"
                      value={damageForm.replacement_due_date}
                      onChange={e => setDamageForm({ ...damageForm, replacement_due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target HM Pergantian</label>
                    <input
                      type="number"
                      step="0.1"
                      value={damageForm.replacement_due_hm}
                      onChange={e => setDamageForm({ ...damageForm, replacement_due_hm: e.target.value })}
                      placeholder="HM Max"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDamageModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-700 cursor-pointer"
                >
                  Simpan Laporan Kerusakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: TAMBAH WORKSPACE BARU */}
      {/* ===================================================================== */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Daftarkan Workspace Baru</h3>
                  <p className="text-xs text-slate-500">Workspace inventaris project terisolasi</p>
                </div>
              </div>
              <button onClick={() => setShowAddProjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Workspace (Singkatan) *</label>
                <input
                  type="text"
                  required
                  value={projectForm.code}
                  onChange={e => setProjectForm({ ...projectForm, code: e.target.value.toUpperCase() })}
                  placeholder="Misal: WIM, FAMOUS, CCM, FUEL..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Workspace *</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={e => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="Contoh: WIM (Weigh-In-Motion Scale)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Site / Area</label>
                <input
                  type="text"
                  value={projectForm.site_location}
                  onChange={e => setProjectForm({ ...projectForm, site_location: e.target.value })}
                  placeholder="Contoh: Sebamban KM 14 & Pit North"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-red-700 cursor-pointer"
                >
                  Buat Project Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT WORKSPACE & UBAH LOKASI */}
      {/* ===================================================================== */}
      {showEditProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-700/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Workspace & Lokasi</h3>
                  <p className="text-xs text-slate-500">Ubah kode, nama, atau lokasi workspace</p>
                </div>
              </div>
              <button onClick={() => setShowEditProjectModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Workspace *</label>
                <input
                  type="text"
                  required
                  value={editProjectForm.code}
                  onChange={e => setEditProjectForm({ ...editProjectForm, code: e.target.value.toUpperCase() })}
                  placeholder="Misal: WIM, FAMOUS, CCM..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Workspace *</label>
                <input
                  type="text"
                  required
                  value={editProjectForm.name}
                  onChange={e => setEditProjectForm({ ...editProjectForm, name: e.target.value })}
                  placeholder="Contoh: Weigh-In-Motion Scale System"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Site / Area *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={editProjectForm.site_location}
                    onChange={e => setEditProjectForm({ ...editProjectForm, site_location: e.target.value })}
                    placeholder="Contoh: BIB, Pit, Port, Sebamban KM 14..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ubah teks ini untuk mengganti label lokasi pada kartu workspace (misal: BIB, Pit, Port).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={editProjectForm.description}
                  onChange={e => setEditProjectForm({ ...editProjectForm, description: e.target.value })}
                  placeholder="Deskripsi operasional atau peruntukan workspace..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditProjectModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PRATINJAU DOKUMEN PENUH (PDF / GAMBAR & LEMBAR RESMI KOP) */}
      {/* ===================================================================== */}
      <FullDocumentPreviewModal
        isOpen={Boolean(selectedDocDetail)}
        onClose={() => setSelectedDocDetail(null)}
        document={selectedDocDetail}
        onDocumentUpdated={(updated) => {
          setProjectDocs(prev => prev.map(d => d.id === updated.id ? updated : d));
          setSelectedDocDetail(updated);
        }}
        currentUser={user}
      />

      {/* ===================================================================== */}
      {/* MODAL: TERBITKAN DOKUMEN 8 TAHAP BARU */}
      {/* ===================================================================== */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-700/30 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-auto flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Terbitkan Dokumen Tahap ({activeProject.code})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daftarkan dokumen baru pada salah satu dari 8 siklus hidup proyek.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pilih Tahapan Proyek *</label>
                  <select
                    value={docForm.stage_code}
                    onChange={(e) => {
                      const stagesMap = {
                        'RFI': { name: 'Request For Information', num: 1 },
                        'PR': { name: 'Purchase Requisition', num: 2 },
                        'PO': { name: 'Purchase Order', num: 3 },
                        'Delivery': { name: 'Ekspedisi & Surat Jalan', num: 4 },
                        'MOS': { name: 'Material On Site (MOS)', num: 5 },
                        'QC': { name: 'Commissioning & QC', num: 6 },
                        'Operational': { name: 'Operasional & Pindahan', num: 7 },
                        'Decommissioning': { name: 'Afkir & Decommissioning', num: 8 }
                      };
                      const selected = stagesMap[e.target.value] || { name: e.target.value, num: 5 };
                      setDocForm({
                        ...docForm,
                        stage_code: e.target.value,
                        stage_name: selected.name,
                        stage_number: selected.num
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="RFI">1. RFI (Request For Information)</option>
                    <option value="PR">2. PR (Purchase Requisition)</option>
                    <option value="PO">3. PO (Purchase Order)</option>
                    <option value="Delivery">4. Ekspedisi &amp; Surat Jalan (DO)</option>
                    <option value="MOS">5. Material On Site (MOS Otorisasi)</option>
                    <option value="QC">6. Commissioning &amp; QC</option>
                    <option value="Operational">7. Operasional &amp; Pindahan Unit</option>
                    <option value="Decommissioning">8. Afkir &amp; Decommissioning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tingkat Prioritas</label>
                  <select
                    value={docForm.priority}
                    onChange={(e) => setDocForm({ ...docForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nomor Dokumen Resmi *</label>
                <input
                  type="text"
                  required
                  value={docForm.doc_number}
                  onChange={(e) => setDocForm({ ...docForm, doc_number: e.target.value })}
                  placeholder={`Contoh: ${activeProject.code}/DOC/${new Date().getFullYear()}/001`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Judul Dokumen *</label>
                <input
                  type="text"
                  required
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="Contoh: Berita Acara Penerimaan & Pengecekan Fisik Komponen"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ringkasan / Catatan Ruang Lingkup</label>
                <textarea
                  rows={3}
                  value={docForm.summary}
                  onChange={(e) => setDocForm({ ...docForm, summary: e.target.value })}
                  placeholder="Penjelasan teknis atau dasar penerbitan dokumen..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nama Berkas Lampiran (Opsional)</label>
                <input
                  type="text"
                  value={docForm.file_attachment}
                  onChange={(e) => setDocForm({ ...docForm, file_attachment: e.target.value })}
                  placeholder="Contoh: BASTM_Penerimaan_Fisik_Signed.pdf"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Terbitkan Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Side-by-Side Goods Receipt & Live QR Code Generator */}
      {cyberQrItem && (
        <IncomingStockQRModal
          isOpen={Boolean(cyberQrItem)}
          onClose={() => setCyberQrItem(null)}
          initialItem={cyberQrItem}
          onOpenPrinterSetup={() => setShowPrinterSetup(true)}
        />
      )}

      {/* Thermal QR Label Print Modal */}
      <QRLabelPrintModal
        isOpen={Boolean(qrPrintItem)}
        onClose={() => setQrPrintItem(null)}
        item={qrPrintItem}
        onOpenSetup={() => setShowPrinterSetup(true)}
      />

      {/* Thermal Printer Hardware Setup Modal */}
      <PrinterSetupModal
        isOpen={showPrinterSetup}
        onClose={() => setShowPrinterSetup(false)}
      />
    </div>
  );
}
