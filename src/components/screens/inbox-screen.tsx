'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Plus, Download, CheckCircle2,
  Loader2, FileText, X, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppSidebar from '@/components/shared/app-sidebar';

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

interface AgentLog {
  id: string;
  shipmentId: string;
  agentName: string;
  agentRole: string;
  status: string;
  duration?: number | null;
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
  agentLogs: AgentLog[];
  _count: { alerts: number; agentLogs: number; documents: number };
}

type FilterType = 'all' | 'processed' | 'exception' | 'critical';

// ─── Agent Icons ─────────────────────────────────────────────────
const AGENT_ICONS: Record<string, string> = {
  triage_clerk: '📋',
  data_extractor: '🔍',
  auditor: '🛡️',
  risk_analyst: '📊',
  dispatcher: '📨',
};

const AGENT_COLORS: Record<string, string> = {
  triage_clerk: '#00dce5',
  data_extractor: '#44e2cd',
  auditor: '#e7c427',
  risk_analyst: '#f97316',
  dispatcher: '#a78bfa',
};

// ─── Status Dot ──────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  switch (status) {
    case 'processed':
      return (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Verified</span>
        </div>
      );
    case 'exception':
      return (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-pulse-medium absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-40" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Disputed</span>
        </div>
      );
    case 'critical':
      return (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-50" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400">Critical</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-full h-2.5 w-2.5 bg-on-surface-variant/50" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Pending</span>
        </div>
      );
  }
}

// ─── Source Label ────────────────────────────────────────────────
function SourceLabel({ source }: { source: string }) {
  switch (source) {
    case 'email':
      return <span className="text-sm text-on-surface-variant">Email</span>;
    case 'whatsapp':
      return <span className="text-sm text-on-surface-variant">WhatsApp</span>;
    case 'upload':
      return <span className="text-sm text-on-surface-variant">Upload</span>;
    default:
      return <span className="text-sm text-on-surface-variant capitalize">{source}</span>;
  }
}

// ─── Confidence Bar ──────────────────────────────────────────────
function ConfidenceBar({ confidence }: { confidence: number | null | undefined }) {
  if (!confidence) {
    return <span className="text-xs text-on-surface-variant">—</span>;
  }
  const color =
    confidence > 90 ? 'bg-emerald-400' : confidence > 70 ? 'bg-amber-400' : 'bg-red-400';
  const textColor =
    confidence > 90 ? 'text-emerald-400' : confidence > 70 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-surface-variant/40 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(confidence, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-mono ${textColor} min-w-[36px] text-right`}>
        {confidence.toFixed(1)}%
      </span>
    </div>
  );
}

// ─── Agent Indicators ────────────────────────────────────────────
function AgentIndicators({ agentLogs }: { agentLogs: AgentLog[] }) {
  const uniqueAgents = Array.from(new Set(agentLogs.map(l => l.agentName)));
  return (
    <div className="flex items-center gap-0.5">
      {uniqueAgents.map(agent => (
        <span key={agent} className="text-sm" title={agent}>
          {AGENT_ICONS[agent] || '🤖'}
        </span>
      ))}
    </div>
  );
}

// ─── Main Inbox Screen ──────────────────────────────────────────
export default function InboxScreen() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShipments() {
      try {
        const res = await fetch('/api/shipments?include=documents,agentLogs');
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

  // Flatten documents from all shipments
  const allDocuments = useMemo(() => {
    const docs: Array<Document & { shipmentRef: string; shipmentTitle: string; agentLogs: AgentLog[] }> = [];
    shipments.forEach(s => {
      s.documents.forEach(d => {
        docs.push({
          ...d,
          shipmentRef: s.reference,
          shipmentTitle: s.title,
          agentLogs: s.agentLogs || [],
        });
      });
    });
    return docs;
  }, [shipments]);

  // Filter and search
  const filteredDocs = useMemo(() => {
    let result = allDocuments;
    if (filter !== 'all') {
      result = result.filter(d => d.status === filter);
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
  }, [allDocuments, filter, search]);

  // Find agent logs for a specific document's shipment
  const getAgentLogsForShipment = (shipmentId: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    return shipment?.agentLogs || [];
  };

  // Count stats
  const counts = useMemo(() => ({
    all: allDocuments.length,
    processed: allDocuments.filter(d => d.status === 'processed').length,
    exception: allDocuments.filter(d => d.status === 'exception').length,
    critical: allDocuments.filter(d => d.status === 'critical').length,
  }), [allDocuments]);

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
        <header className="sticky top-0 z-30 glass-card-strong border-b border-glass-border px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title + Search */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <h1 className="text-lg font-bold text-on-surface whitespace-nowrap" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
                Supply Chain Alpha
              </h1>
              <div className="relative max-w-xs flex-1 hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm bg-surface-variant/30 border-glass-border text-on-surface placeholder:text-on-surface-variant/50 rounded-lg"
                />
              </div>
            </div>

            {/* Right: Notification + Process Button */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-fixed-dim rounded-full" />
              </Button>
              <Button className="h-9 px-4 text-sm font-semibold bg-secondary-container text-on-secondary hover:bg-secondary-fixed-dim/80 rounded-lg">
                <Plus className="w-4 h-4 mr-1.5" />
                Process Document
              </Button>
            </div>
          </div>
        </header>

        {/* ─── Section Header ──────────────────────────────────── */}
        <div className="px-4 sm:px-8 pt-6 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary-fixed-dim mb-1">
                Queue Status
              </p>
              <h2 className="text-3xl font-extrabold text-on-surface tracking-tight" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
                Document Inbox
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="glass-card rounded-xl p-1 flex items-center gap-0.5">
              {(['all', 'processed', 'exception', 'critical'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-150 ${
                    filter === f
                      ? 'bg-primary-fixed-dim text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30'
                  }`}
                >
                  {f}
                  <span className={`ml-1.5 text-[10px] ${filter === f ? 'text-on-primary/70' : 'text-on-surface-variant/50'}`}>
                    {counts[f]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile search */}
          <div className="sm:hidden mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm bg-surface-variant/30 border-glass-border text-on-surface placeholder:text-on-surface-variant/50 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* ─── Document Table ──────────────────────────────────── */}
        <div className="px-4 sm:px-8 pt-4 pb-24">
          <div className="glass-card rounded-xl overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="text-left px-5 py-3.5 text-[11px] font-mono uppercase tracking-[0.15em] text-on-surface-variant/70 font-semibold">Status</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-mono uppercase tracking-[0.15em] text-on-surface-variant/70 font-semibold">Document</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-mono uppercase tracking-[0.15em] text-on-surface-variant/70 font-semibold hidden md:table-cell">Shipment Ref</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-mono uppercase tracking-[0.15em] text-on-surface-variant/70 font-semibold hidden lg:table-cell">Source</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-mono uppercase tracking-[0.15em] text-on-surface-variant/70 font-semibold hidden md:table-cell">Date</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-mono uppercase tracking-[0.15em] text-on-surface-variant/70 font-semibold hidden lg:table-cell">Confidence</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-mono uppercase tracking-[0.15em] text-on-surface-variant/70 font-semibold hidden md:table-cell">Agents</th>
                    <th className="w-10 px-3 py-3.5"></th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-sm text-on-surface-variant">
                        No documents found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc, i) => (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02, duration: 0.3 }}
                        className={`border-b border-glass-border/50 cursor-pointer transition-colors duration-150 group ${
                          selectedDoc?.id === doc.id
                            ? 'bg-primary-fixed-dim/10'
                            : 'hover:bg-surface-variant/20'
                        }`}
                        onClick={() => setSelectedDoc(doc)}
                        onMouseEnter={() => setHoveredRow(doc.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusDot status={doc.status} />
                        </td>

                        {/* Document */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-surface-variant/40 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-on-surface-variant" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-on-surface truncate">{doc.fileName}</p>
                              <p className="text-[11px] text-on-surface-variant md:hidden">{doc.shipmentRef} · {doc.status}</p>
                            </div>
                          </div>
                        </td>

                        {/* Shipment Ref */}
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="text-sm font-mono text-on-surface-variant">{doc.shipmentRef}</span>
                        </td>

                        {/* Source */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <SourceLabel source={doc.source} />
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="text-xs text-on-surface-variant">
                            {new Date(doc.createdAt).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: '2-digit' })}
                          </span>
                        </td>

                        {/* Confidence */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <ConfidenceBar confidence={doc.ocrConfidence} />
                        </td>

                        {/* Agents */}
                        <td className="px-5 py-4 hidden md:table-cell">
                          <AgentIndicators agentLogs={getAgentLogsForShipment(doc.shipmentId)} />
                        </td>

                        {/* Chevron */}
                        <td className="px-3 py-4">
                          <ChevronRight
                            className={`w-4 h-4 text-on-surface-variant transition-all duration-150 ${
                              hoveredRow === doc.id || selectedDoc?.id === doc.id
                                ? 'opacity-100 translate-x-0'
                                : 'opacity-0 -translate-x-1'
                            }`}
                          />
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── Floating Action Button ──────────────────────────── */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
          {/* FAB */}
          <div className="relative group">
            <div className="absolute inset-0 rounded-full bg-primary-fixed-dim/30 blur-xl group-hover:bg-primary-fixed-dim/50 transition-all duration-300" />
            <button className="relative w-14 h-14 rounded-full bg-primary-fixed-dim text-on-primary flex items-center justify-center shadow-lg glow-cyan hover:scale-105 active:scale-95 transition-transform duration-150">
              <Plus className="w-6 h-6" />
            </button>
            {/* Tooltip */}
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-surface-container-high text-xs font-semibold text-on-surface whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none border border-glass-border">
              New Ingestion
            </div>
          </div>

          {/* Region Badge */}
          <div className="px-3 py-1.5 rounded-lg glass-card text-[10px] font-mono uppercase tracking-[0.15em] text-on-surface-variant">
            AWS: AF-SOUTH-1 | SARS-POPIA COMPLIANT
          </div>
        </div>
      </main>

      {/* ─── Detail Slide-in Panel ────────────────────────────────── */}
      <AnimatePresence>
        {selectedDoc && (
          <>
            {/* Backdrop on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setSelectedDoc(null)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[600px] glass-card-strong border-l border-glass-border overflow-y-auto custom-scrollbar"
            >
              {/* Panel Header */}
              <div className="sticky top-0 z-10 glass-card-strong border-b border-glass-border px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedDoc(null)}
                      className="h-8 w-8 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <h3 className="text-lg font-bold text-on-surface" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
                      Document Analysis
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs border-glass-border text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download Original
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs bg-secondary-container text-on-secondary hover:bg-secondary-fixed-dim/80"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Approve JSON
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Document metadata badges */}
                <div className="flex flex-wrap gap-2">
                  <StatusDot status={selectedDoc.status} />
                  <span className="px-2 py-0.5 rounded-md bg-surface-variant/30 text-[11px] font-mono text-on-surface-variant capitalize">
                    {selectedDoc.source}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface-variant/30 text-[11px] font-mono text-on-surface-variant uppercase">
                    {selectedDoc.fileType}
                  </span>
                  {selectedDoc.ocrConfidence && (
                    <span className="px-2 py-0.5 rounded-md bg-surface-variant/30 text-[11px] font-mono text-on-surface-variant">
                      {selectedDoc.ocrConfidence.toFixed(1)}% conf.
                    </span>
                  )}
                </div>

                {/* ─── Original Document Preview ───────────────────── */}
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary-fixed-dim mb-3">
                    Original Document
                  </h4>
                  <div className="aspect-[1/1.4] rounded-xl bg-surface-container-lowest border border-glass-border flex flex-col items-center justify-center p-6 overflow-hidden">
                    <div className="w-12 h-12 rounded-xl bg-surface-variant/30 flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-on-surface-variant/60" />
                    </div>
                    <p className="text-sm font-semibold text-on-surface mb-1 text-center">{selectedDoc.fileName}</p>
                    <p className="text-xs text-on-surface-variant/60 text-center">
                      {selectedDoc.content
                        ? selectedDoc.content.substring(0, 200) + (selectedDoc.content.length > 200 ? '...' : '')
                        : 'Original document content would be displayed here'}
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center w-full max-w-xs">
                      <div>
                        <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider">Type</p>
                        <p className="text-xs font-mono text-on-surface-variant mt-0.5">{selectedDoc.fileType.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider">Source</p>
                        <p className="text-xs font-mono text-on-surface-variant mt-0.5 capitalize">{selectedDoc.source}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-wider">Date</p>
                        <p className="text-xs font-mono text-on-surface-variant mt-0.5">
                          {new Date(selectedDoc.createdAt).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── AI Extracted JSON ────────────────────────────── */}
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary-fixed-dim mb-3">
                    AI Extracted JSON
                  </h4>
                  <div className="rounded-xl bg-surface-container-lowest border border-glass-border p-4 overflow-x-auto">
                    {selectedDoc.extractedData ? (
                      <pre className="text-xs font-mono text-secondary-fixed-dim whitespace-pre-wrap">
                        {JSON.stringify(JSON.parse(selectedDoc.extractedData), null, 2)}
                      </pre>
                    ) : (
                      <pre className="text-xs font-mono text-secondary-fixed-dim whitespace-pre-wrap">
{JSON.stringify({
  documentType: selectedDoc.fileType,
  shipmentRef: shipments.find(s => s.id === selectedDoc.shipmentId)?.reference || 'N/A',
  status: selectedDoc.status,
  confidence: selectedDoc.ocrConfidence || null,
  extractedAt: new Date().toISOString()
}, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>

                {/* ─── Agents Processed Log ─────────────────────────── */}
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary-fixed-dim mb-3">
                    Agents Processed
                  </h4>
                  <div className="relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[11px] top-3 bottom-3 w-px bg-glass-border" />

                    <div className="space-y-0">
                      {getAgentLogsForShipment(selectedDoc.shipmentId).map((log, idx) => {
                        const agentColor = AGENT_COLORS[log.agentName] || '#a78bfa';
                        return (
                          <div key={log.id} className="relative flex gap-4 py-3">
                            {/* Timeline dot */}
                            <div className="relative z-10 flex-shrink-0 mt-0.5">
                              <div
                                className="w-[23px] h-[23px] rounded-full flex items-center justify-center border-2"
                                style={{
                                  borderColor: agentColor,
                                  backgroundColor: `${agentColor}15`,
                                }}
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: agentColor }}
                                />
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm">{AGENT_ICONS[log.agentName] || '🤖'}</span>
                                <span className="text-sm font-semibold text-on-surface">
                                  {log.agentName.replace(/_/g, ' ')}
                                </span>
                                {log.status === 'completed' ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                    completed
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/20">
                                    {log.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-on-surface-variant">
                                {log.agentRole || `${log.agentName.replace(/_/g, ' ')} processing`}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-mono text-on-surface-variant/50">
                                  {new Date(log.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {log.duration && (
                                  <span className="text-[10px] font-mono text-on-surface-variant/50">
                                    {log.duration}ms
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {getAgentLogsForShipment(selectedDoc.shipmentId).length === 0 && (
                        <div className="py-6 text-center text-sm text-on-surface-variant">
                          No agent logs available for this document.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
