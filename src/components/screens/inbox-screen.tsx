'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox, Search, Mail, MessageSquare, Upload, CheckCircle,
  AlertTriangle, AlertCircle, Loader2, FileText, X, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

// ─── Status Badge ────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'processed':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
          <CheckCircle className="w-3 h-3 mr-1" /> Processed
        </Badge>
      );
    case 'exception':
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
          <AlertTriangle className="w-3 h-3 mr-1" /> Exception
        </Badge>
      );
    case 'critical':
      return (
        <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
          <AlertCircle className="w-3 h-3 mr-1" /> Critical Mismatch
        </Badge>
      );
    default:
      return (
        <Badge className="bg-muted/50 text-muted-foreground border-border/30 text-[10px]">
          Pending
        </Badge>
      );
  }
}

// ─── Source Icon ─────────────────────────────────────────────────
function SourceIcon({ source }: { source: string }) {
  switch (source) {
    case 'email':
      return <Mail className="w-3.5 h-3.5 text-blue-400" />;
    case 'whatsapp':
      return <MessageSquare className="w-3.5 h-3.5 text-green-400" />;
    case 'upload':
      return <Upload className="w-3.5 h-3.5 text-muted-foreground" />;
    default:
      return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

// ─── Agent Indicator ─────────────────────────────────────────────
const AGENT_ICONS: Record<string, string> = {
  triage_clerk: '📋',
  data_extractor: '🔍',
  auditor: '🛡️',
  risk_analyst: '📊',
  dispatcher: '📨',
};

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

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Loading documents...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <main className="flex-1 min-h-screen overflow-y-auto">
        {/* Mobile spacer */}
        <div className="h-14 md:hidden" />

        {/* Header */}
        <header className="sticky top-0 z-30 glass-card-strong border-b border-border/30 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Inbox className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold">Document Inbox</h1>
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[10px]">
                {filteredDocs.length} docs
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter buttons */}
              <div className="flex items-center gap-1">
                {(['all', 'processed', 'exception', 'critical'] as FilterType[]).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'ghost'}
                    size="sm"
                    className={`text-xs h-8 ${
                      filter === f
                        ? 'bg-primary/15 text-primary hover:bg-primary/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background/50"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6">
          {/* Document List */}
          <Card className="glass-card border-border/30 overflow-hidden">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-[40px_1fr_140px_60px_100px_80px_60px] gap-2 px-4 py-3 border-b border-border/20 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span></span>
              <span>Document</span>
              <span>Shipment Ref</span>
              <span>Source</span>
              <span>Date</span>
              <span>Confidence</span>
              <span>Agents</span>
            </div>

            {/* Rows */}
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {filteredDocs.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No documents found matching your filters.
                </div>
              ) : (
                filteredDocs.map((doc, i) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-1 sm:grid-cols-[40px_1fr_140px_60px_100px_80px_60px] gap-2 px-4 py-3 border-b border-border/10 hover:bg-muted/20 cursor-pointer transition-colors items-center"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    {/* Status Icon */}
                    <div className="hidden sm:flex items-center">
                      <StatusBadge status={doc.status} />
                    </div>

                    {/* Document Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{doc.fileName}</p>
                        <p className="text-[10px] text-muted-foreground sm:hidden">{doc.shipmentRef} · {doc.status}</p>
                      </div>
                    </div>

                    {/* Shipment Ref */}
                    <span className="text-xs text-muted-foreground hidden sm:block">{doc.shipmentRef}</span>

                    {/* Source */}
                    <div className="hidden sm:flex items-center">
                      <SourceIcon source={doc.source} />
                    </div>

                    {/* Date */}
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(doc.createdAt).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                    </span>

                    {/* Confidence */}
                    <span className="text-xs hidden sm:block">
                      {doc.ocrConfidence ? (
                        <span className={doc.ocrConfidence > 90 ? 'text-emerald-400' : doc.ocrConfidence > 70 ? 'text-amber-400' : 'text-red-400'}>
                          {doc.ocrConfidence.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>

                    {/* Agent Indicators */}
                    <div className="hidden sm:flex items-center">
                      <AgentIndicators agentLogs={getAgentLogsForShipment(doc.shipmentId)} />
                    </div>

                    {/* Mobile chevron */}
                    <ChevronRight className="w-4 h-4 text-muted-foreground sm:hidden ml-auto" />
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </div>
      </main>

      {/* ─── Side-by-Side Document View ────────────────────────────── */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 md:relative md:inset-auto md:w-[480px] lg:w-[560px] glass-card-strong border-l border-border/30 overflow-y-auto"
          >
            {/* Panel header */}
            <div className="sticky top-0 z-10 glass-card-strong border-b border-border/30 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold truncate">{selectedDoc.fileName}</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDoc(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Document metadata */}
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={selectedDoc.status} />
                <Badge variant="outline" className="text-[10px]">
                  <SourceIcon source={selectedDoc.source} />
                  <span className="ml-1 capitalize">{selectedDoc.source}</span>
                </Badge>
                <Badge variant="outline" className="text-[10px]">{selectedDoc.fileType}</Badge>
                {selectedDoc.ocrConfidence && (
                  <Badge variant="outline" className="text-[10px]">
                    {selectedDoc.ocrConfidence.toFixed(1)}% confidence
                  </Badge>
                )}
              </div>

              <Separator className="bg-border/30" />

              {/* Original Document */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Original Document
                </h4>
                <Card className="glass-card border-border/30">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-sm">Document Preview</p>
                      <p className="text-xs mt-1">{selectedDoc.fileName}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {selectedDoc.content || 'Original document content would be displayed here'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Extracted Data */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  AI Extracted Data
                </h4>
                <Card className="glass-card border-border/30">
                  <CardContent className="p-4">
                    {selectedDoc.extractedData ? (
                      <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto bg-background/50 rounded-lg p-3">
                        {JSON.stringify(JSON.parse(selectedDoc.extractedData), null, 2)}
                      </pre>
                    ) : (
                      <div className="text-xs font-mono text-muted-foreground bg-background/50 rounded-lg p-3">
                        {'{\n  "documentType": "' + selectedDoc.fileType + '",\n  "shipmentRef": "' + (shipments.find(s => s.id === selectedDoc.shipmentId)?.reference || 'N/A') + '",\n  "status": "' + selectedDoc.status + '",\n  "confidence": ' + (selectedDoc.ocrConfidence || 'null') + ',\n  "extractedAt": "' + new Date().toISOString() + '"\n}'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Agent Processing Log */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                  Agents Processed
                </h4>
                <div className="space-y-2">
                  {getAgentLogsForShipment(selectedDoc.shipmentId).map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/20">
                      <span>{AGENT_ICONS[log.agentName] || '🤖'}</span>
                      <span className="font-medium">{log.agentName.replace(/_/g, ' ')}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ml-auto ${
                          log.status === 'completed'
                            ? 'border-emerald-500/30 text-emerald-400'
                            : 'border-red-500/30 text-red-400'
                        }`}
                      >
                        {log.status}
                      </Badge>
                      {log.duration && (
                        <span className="text-muted-foreground">{log.duration}ms</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
