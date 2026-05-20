'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Bell, CloudUpload, Loader2, FileText,
  MessageCircle, Mail, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppSidebar from '@/components/shared/app-sidebar';
import { useAppState } from '@/lib/app-state';

// ─── Types ───────────────────────────────────────────────────────
interface Document {
  id: string;
  shipmentId: string;
  fileName: string;
  fileType: string;
  source: string;
  content?: string | null;
  extractedData?: string | null;
  status: string;
  ocrConfidence?: number | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

interface Shipment {
  id: string;
  reference: string;
  title: string;
  industry: string;
  status: string;
  riskLevel: string;
  documents: Document[];
  _count: { alerts: number; agentLogs: number; documents: number };
}

type StatusFilter = 'all' | 'pending' | 'flagged' | 'cleared';
type SourceFilter = 'all' | 'whatsapp' | 'email' | 'upload';

// ─── Time Ago Helper ─────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
}

// ─── Source Icon ──────────────────────────────────────────────────
function SourceIcon({ source }: { source: string }) {
  switch (source) {
    case 'whatsapp':
      return <MessageCircle className="w-3.5 h-3.5 text-risk-low" />;
    case 'email':
      return <Mail className="w-3.5 h-3.5 text-primary-fixed-dim" />;
    case 'upload':
      return <Upload className="w-3.5 h-3.5 text-on-surface-variant" />;
    default:
      return <FileText className="w-3.5 h-3.5 text-on-surface-variant" />;
  }
}

// ─── Risk Dot ────────────────────────────────────────────────────
function RiskDot({ level }: { level: string }) {
  const colorMap: Record<string, string> = {
    low: 'bg-risk-low',
    medium: 'bg-risk-medium',
    high: 'bg-risk-high',
    critical: 'bg-risk-critical',
  };
  return (
    <div
      className={`w-2.5 h-2.5 rounded-full ${colorMap[level] || 'bg-on-surface-variant/40'} ${
        level === 'critical' || level === 'high' ? 'animate-subtle-pulse' : ''
      }`}
      title={`Risk: ${level}`}
    />
  );
}

// ─── Status Emoji ────────────────────────────────────────────────
function StatusEmoji({ status }: { status: string }) {
  switch (status) {
    case 'processed':
    case 'cleared':
      return <span className="text-sm">✅</span>;
    case 'pending':
    case 'processing':
      return <span className="text-sm">🟡</span>;
    case 'exception':
    case 'flagged':
    case 'critical':
    case 'held':
      return <span className="text-sm">🚨</span>;
    default:
      return <span className="text-sm">🟡</span>;
  }
}

// ─── Main Inbox Screen ──────────────────────────────────────────
export default function InboxScreen() {
  const { setCurrentScreen, setSelectedShipmentId } = useAppState();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchShipments() {
      try {
        const res = await fetch('/api/shipments?include=documents');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setShipments(data);
      } catch (err) {
        console.error('Shipments fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchShipments();
  }, []);

  // Flatten documents from all shipments with shipment context
  const allDocuments = useMemo(() => {
    const docs: Array<Document & {
      shipmentRef: string;
      shipmentTitle: string;
      shipmentIndustry: string;
      shipmentRiskLevel: string;
      shipmentStatus: string;
      shipmentId: string;
    }> = [];
    shipments.forEach(s => {
      s.documents.forEach(d => {
        docs.push({
          ...d,
          shipmentRef: s.reference,
          shipmentTitle: s.title,
          shipmentIndustry: s.industry,
          shipmentRiskLevel: s.riskLevel,
          shipmentStatus: s.status,
          shipmentId: s.id,
        });
      });
    });
    // Sort by newest first
    return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [shipments]);

  // Map document status to inbox status categories
  const mapDocStatus = (doc: typeof allDocuments[0]): 'pending' | 'flagged' | 'cleared' => {
    const status = doc.status || doc.shipmentStatus;
    if (status === 'processed' || status === 'cleared') return 'cleared';
    if (status === 'exception' || status === 'critical' || status === 'flagged' || status === 'held') return 'flagged';
    return 'pending';
  };

  // Filter and search
  const filteredDocs = useMemo(() => {
    let result = allDocuments;
    if (statusFilter !== 'all') {
      result = result.filter(d => mapDocStatus(d) === statusFilter);
    }
    if (sourceFilter !== 'all') {
      result = result.filter(d => d.source === sourceFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.fileName.toLowerCase().includes(q) ||
        d.shipmentRef.toLowerCase().includes(q) ||
        d.fileType.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allDocuments, statusFilter, sourceFilter, search]);

  // Count stats
  const counts = useMemo(() => {
    const pending = allDocuments.filter(d => mapDocStatus(d) === 'pending').length;
    const cleared = allDocuments.filter(d => mapDocStatus(d) === 'cleared').length;
    const flagged = allDocuments.filter(d => mapDocStatus(d) === 'flagged').length;
    return { pending, cleared, flagged, total: allDocuments.length };
  }, [allDocuments]);

  // Handle document click → navigate to shipment detail
  const handleDocClick = (doc: typeof allDocuments[0]) => {
    setSelectedShipmentId(doc.shipmentId);
    setCurrentScreen('shipment');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-fixed-dim animate-spin" />
            <span className="text-sm text-on-surface-variant font-mono">Loading documents...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 md:ml-64 min-h-screen overflow-y-auto">
        {/* Mobile spacer */}
        <div className="h-14 md:hidden" />

        {/* ─── Top Bar ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 glass-card-strong border-b border-glass-border px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title */}
            <h1 className="text-lg font-extrabold text-on-surface whitespace-nowrap tracking-tight" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
              Document Inbox
            </h1>

            {/* Right: Notification */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high">
                <Bell className="w-4 h-4" />
                {counts.flagged > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-risk-critical rounded-full" />
                )}
              </Button>
            </div>
          </div>
        </header>

        <div className="px-4 sm:px-6 py-4 space-y-4 pb-24">

          {/* ─── Quick Stats ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 flex-wrap"
          >
            <div className="glass-card rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface-variant flex items-center gap-2">
              <span>📋</span> {counts.pending} Pending
            </div>
            <div className="glass-card rounded-lg px-3 py-1.5 text-sm font-medium text-on-surface-variant flex items-center gap-2">
              <span>✅</span> {counts.cleared} Processed
            </div>
            <div className="glass-card rounded-lg px-3 py-1.5 text-sm font-medium text-risk-high flex items-center gap-2">
              <span>🚨</span> {counts.flagged} Flagged
            </div>
          </motion.div>

          {/* ─── Search + Filters ──────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-3"
          >
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-sm bg-surface-container-high border-glass-border text-on-surface placeholder:text-on-surface-variant/50 rounded-lg"
              />
            </div>

            {/* Status filter buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant mr-1">Status:</span>
              {(['all', 'pending', 'flagged', 'cleared'] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
                    statusFilter === f
                      ? 'bg-primary-fixed-dim text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  {f}
                  <span className={`ml-1.5 text-[10px] ${statusFilter === f ? 'text-on-primary/70' : 'text-on-surface-variant/50'}`}>
                    {f === 'all' ? counts.total : counts[f]}
                  </span>
                </button>
              ))}

              {/* Divider */}
              <span className="text-on-surface-variant/20 mx-1">|</span>

              {/* Source filter buttons */}
              <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant mr-1">Source:</span>
              {(['all', 'whatsapp', 'email', 'upload'] as SourceFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setSourceFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-150 ${
                    sourceFilter === f
                      ? 'bg-secondary-container text-on-secondary'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  {f === 'whatsapp' ? 'WhatsApp' : f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ─── Document List ─────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {filteredDocs.length === 0 ? (
              /* ─── Empty State ──────────────────────────────────── */
              <div className="glass-card rounded-xl py-16 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center">
                  <FileText className="w-8 h-8 text-on-surface-variant/40" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-on-surface mb-1">No documents yet</p>
                  <p className="text-sm text-on-surface-variant">Upload your first document to get started.</p>
                </div>
                <Button
                  className="bg-secondary-container hover:bg-secondary-container/80 text-on-secondary font-semibold mt-2"
                  onClick={() => setCurrentScreen('dashboard')}
                >
                  <CloudUpload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            ) : (
              /* ─── Document Items ────────────────────────────────── */
              <div className="space-y-1">
                {filteredDocs.map((doc, i) => (
                  <motion.button
                    key={doc.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.025, duration: 0.25 }}
                    onClick={() => handleDocClick(doc)}
                    className="w-full text-left glass-card rounded-lg px-4 py-3 flex items-center gap-3 hover:bg-surface-container-high/60 transition-colors group"
                  >
                    {/* Status emoji */}
                    <div className="flex-shrink-0 w-6 flex items-center justify-center">
                      <StatusEmoji status={doc.status || doc.shipmentStatus} />
                    </div>

                    {/* Document info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-on-surface truncate">
                          {doc.fileName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-on-surface-variant">
                          {doc.shipmentRef}
                        </span>
                        <span className="text-on-surface-variant/20">·</span>
                        <SourceIcon source={doc.source} />
                        <span className="text-[11px] text-on-surface-variant capitalize">{doc.source}</span>
                      </div>
                    </div>

                    {/* Right side: time + risk dot */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px] text-on-surface-variant/60">
                        {timeAgo(doc.createdAt)}
                      </span>
                      <RiskDot level={doc.shipmentRiskLevel} />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ─── Compliance Badges (bottom-right) ──────────────────── */}
        <div className="fixed bottom-4 right-4 z-20 flex flex-col items-end gap-2">
          <div className="glass-card rounded-md px-3 py-1.5 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase">
            AWS: AF-SOUTH-1 | SARS-POPIA COMPLIANT
          </div>
        </div>
      </main>
    </div>
  );
}
