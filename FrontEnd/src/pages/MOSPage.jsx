import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileCheck2,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  ShieldCheck,
  Package,
  Layers,
  MapPin,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  Eye,
  RotateCcw,
  Check,
  Download,
  Share2,
  Upload,
  UserCheck,
  ChevronLeft
} from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import DocumentWaitingList from '../components/common/DocumentWaitingList.jsx';
import InteractiveDocumentSheet from '../components/common/InteractiveDocumentSheet.jsx';
import SignatureUploadExtractorModal from '../components/common/SignatureUploadExtractorModal.jsx';
import DocumentUploadModal from '../components/common/DocumentUploadModal.jsx';

export default function MOSPage() {
  const { user, role } = useAuth();

  // Active view: 'waiting_list' | 'sheet'
  const [activeView, setActiveView] = useState('waiting_list');
  const [selectedDocument, setSelectedDocument] = useState(null);

  // User's transparent signature in memory
  const [userSignature, setUserSignature] = useState(() => {
    return localStorage.getItem(`digitech_signature_${user?.id || 'current_user'}`) || null;
  });

  // Modal controls
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadModalDefaultTab, setUploadModalDefaultTab] = useState('local'); // 'local' | 'template'
  const [documentToEdit, setDocumentToEdit] = useState(null); // When editing existing document

  // Fetch document list for Waiting List & Archive
  const { data: documentsData, refetch, isLoading } = useQuery({
    queryKey: ['approval-documents'],
    queryFn: async () => {
      try {
        const res = await api.get('/mos');
        return res.data?.data || [];
      } catch (err) {
        console.warn('Failed to fetch approval documents:', err.message);
        return [];
      }
    }
  });

  const documents = documentsData || [];

  // Sync signature from backend on mount
  useEffect(() => {
    const fetchSignature = async () => {
      try {
        const res = await api.get('/users/signature');
        if (res.data?.data?.signature) {
          setUserSignature(res.data.data.signature);
          localStorage.setItem(`digitech_signature_${user?.id || 'current_user'}`, res.data.data.signature);
        }
      } catch {}
    };
    if (user?.id) {
      fetchSignature();
    }
  }, [user?.id]);

  // Handle signature save from modal
  const handleSignatureSaved = (newSigDataUrl) => {
    setUserSignature(newSigDataUrl);
  };

  // Auto-select first document if available so sheet view is always ready
  useEffect(() => {
    if (!selectedDocument && documents.length > 0) {
      setSelectedDocument(documents[0]);
    }
  }, [documents, selectedDocument]);

  // Open Document Sheet
  const handleOpenDocument = (doc) => {
    setSelectedDocument(doc);
    setActiveView('sheet');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle document updated (e.g. after approval stamp)
  // Handle document updated (e.g. after approval stamp or editing)
  const handleDocumentUpdated = (updatedDoc) => {
    setSelectedDocument(updatedDoc);
    refetch();
  };

  // Handle document uploaded or edited
  const handleDocumentUploaded = (newDoc) => {
    refetch();
    setDocumentToEdit(null);
    if (newDoc) {
      setSelectedDocument(newDoc);
      setActiveView('sheet');
    }
  };

  // Open edit modal for a document
  const handleEditDocument = (doc) => {
    setDocumentToEdit(doc);
    setUploadModalDefaultTab('template');
    setIsUploadModalOpen(true);
  };

  // Count pending items for waiting list badge
  const pendingCount = documents.filter(d => d.status !== 'completed').length;

  return (
    <div className="space-y-4 pt-1 sm:pt-1.5 pb-8">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex-1 min-w-0 pr-0 lg:pr-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              SISTEM APPROVAL &amp; OTORISASI DOKUMEN
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              Portrait / Landscape Dinamis
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            Waiting List &amp; Approval Dokumen
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Unggah dokumen approval dari PC atau pilih template resmi (MOS, MDT, MRP). Bubuhkan tanda tangan transparan dengan drag &amp; drop.
          </p>
        </div>

        {/* View Switcher Tabs & Actions — Pushed all the way to right edge */}
        <div className="flex items-center justify-end gap-2.5 ml-auto shrink-0 flex-wrap sm:flex-nowrap">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveView('waiting_list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'waiting_list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-red-600" />
              <span>Waiting List Dokumen</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-600 text-white">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (!selectedDocument && documents.length > 0) {
                  setSelectedDocument(documents[0]);
                }
                setActiveView('sheet');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'sheet'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>Lembar Dokumen (Sheet)</span>
            </button>
          </div>

          {/* Quick Action: Upload Modal */}
          <button
            onClick={() => {
              setDocumentToEdit(null);
              setUploadModalDefaultTab('local');
              setIsUploadModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-red-600/20 transition-all cursor-pointer shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Dokumen PC</span>
          </button>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      {activeView === 'waiting_list' && (
        <DocumentWaitingList
          documents={documents}
          loading={isLoading}
          currentUser={user}
          userSignature={userSignature}
          onSelectDocument={handleOpenDocument}
          onOpenUploadModal={(tab) => {
            setDocumentToEdit(null);
            setUploadModalDefaultTab(tab);
            setIsUploadModalOpen(true);
          }}
          onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
          onEditDocument={handleEditDocument}
        />
      )}

      {activeView === 'sheet' && (
        <InteractiveDocumentSheet
          documentData={selectedDocument || documents[0]}
          currentUser={user}
          userSignature={userSignature}
          onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
          onDocumentUpdated={handleDocumentUpdated}
          onBackToList={() => setActiveView('waiting_list')}
          onEditDocument={handleEditDocument}
        />
      )}

      {/* ── Modal 1: User Signature Upload & Auto Background Removal ── */}
      <SignatureUploadExtractorModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSignatureSaved}
        currentUser={user}
      />

      {/* ── Modal 2: Document Upload & Template Creator / Editor ── */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setDocumentToEdit(null);
        }}
        onSuccess={handleDocumentUploaded}
        currentUser={user}
        defaultTab={uploadModalDefaultTab}
        editDocument={documentToEdit}
      />

    </div>
  );
}
