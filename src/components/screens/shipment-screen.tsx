'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Loader2, Search, Bell, FileText, Shield, Clock,
  CheckCircle, AlertTriangle, AlertCircle, ArrowRight,
  Download, Zap, Ship, Anchor, MapPin, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppSidebar from '@/components/shared/app-sidebar';
import { useAppState } from '@/lib/app-state';

// ─── Types ───────────────────────────────────────────────────────
interface TimelineEvent {
  id: string;
  event: string;
  description: string;
  agentName?: string | null;
  icon?: string | null;
  timestamp: string;
}

interface AuditTrail {
  id: string;
  action: string;
  agentName?: string | null;
  details?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
}

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  source: string;
}

interface AgentLog {
  id: string;
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
  origin?: string | null;
  destination?: string | null;
  supplier?: string | null;
  buyer?: string | null;
  totalAmount?: number | null;
  currency: string;
  grossWeightKg?: number | null;
  commodity?: string | null;
  hsCode?: string | null;
  riskLevel: string;
  riskNotes?: string | null;
  estimatedValue?: number | null;
  createdAt: string;
  updatedAt: string;
  documents: Document[];
  agentLogs: AgentLog[];
  auditTrails: AuditTrail[];
  timeline: TimelineEvent[];
  alerts: Array<{ id: string; severity: string; title: string; isResolved: boolean }>;
  _count: { alerts: number; agentLogs: number; documents: number };
}

// ─── Risk Config ─────────────────────────────────────────────────
const RISK_CONFIG: Record<string, {
  dotClass: string;
  pulseClass: string;
  borderClass: string;
  badgeLabel: string;
  badgeClass: string;
  cardOpacity: string;
}> = {
  critical: {
    dotClass: 'bg-risk-critical',
    pulseClass: 'animate-pulse-critical',
    borderClass: 'border-l-risk-critical',
    badgeLabel: 'Flagged',
    badgeClass: 'bg-risk-critical/15 text-risk-critical border-risk-critical/30',
    cardOpacity: '',
  },
  high: {
    dotClass: 'bg-risk-high',
    pulseClass: 'animate-pulse-medium',
    borderClass: 'border-l-risk-high',
    badgeLabel: 'Held',
    badgeClass: 'bg-risk-high/15 text-risk-high border-risk-high/30',
    cardOpacity: '',
  },
  medium: {
    dotClass: 'bg-risk-medium',
    pulseClass: 'animate-subtle-pulse',
    borderClass: 'border-l-risk-medium',
    badgeLabel: 'Review',
    badgeClass: 'bg-risk-medium/15 text-risk-medium border-risk-medium/30',
    cardOpacity: '',
  },
  low: {
    dotClass: 'bg-risk-low',
    pulseClass: '',
    borderClass: 'border-l-risk-low',
    badgeLabel: 'Cleared',
    badgeClass: 'bg-risk-low/15 text-risk-low border-risk-low/30',
    cardOpacity: 'opacity-80',
  },
};

// ─── Timeline Event Style ───────────────────────────────────────
function getTimelineEventStyle(event: string, description: string): {
  color: string;
  bgColor: string;
  borderColor: string;
} {
  const isFlag = description.toLowerCase().includes('flag') || description.toLowerCase().includes('mismatch');
  const isCritical = description.toLowerCase().includes('critical') || description.toLowerCase().includes('failed');

  if (isCritical) {
    return {
      color: 'text-risk-critical',
      bgColor: 'bg-risk-critical',
      borderColor: 'border-l-risk-critical',
    };
  }
  if (isFlag) {
    return {
      color: 'text-risk-high',
      bgColor: 'bg-risk-high',
      borderColor: 'border-l-risk-high',
    };
  }
  if (event.includes('risk_assessed') || event.includes('audit')) {
    return {
      color: 'text-risk-medium',
      bgColor: 'bg-risk-medium',
      borderColor: 'border-l-risk-medium',
    };
  }
  return {
    color: 'text-primary-fixed-dim',
    bgColor: 'bg-primary-fixed-dim',
    borderColor: 'border-l-primary-fixed-dim',
  };
}

// ─── Agent Icons ─────────────────────────────────────────────────
const AGENT_ICONS: Record<string, string> = {
  triage_clerk: '📋',
  data_extractor: '🔍',
  auditor: '🛡️',
  risk_analyst: '📊',
  dispatcher: '📨',
  system: '⚙️',
  human_reviewer: '👤',
};

// ─── Format ZAR ─────────────────────────────────────────────────
function formatZAR(val: number | null | undefined): string {
  if (!val) return '—';
  if (val >= 1000000) return `R${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `R${(val / 1000).toFixed(0)}K`;
  return `R${val.toLocaleString()}`;
}

// ─── Event Label Map ─────────────────────────────────────────────
const EVENT_LABELS: Record<string, string> = {
  document_received: 'Document Received',
  triage_complete: 'Triage Complete',
  extraction_complete: 'Data Extracted',
  audit_flag: 'Audit Flag',
  risk_assessed: 'Risk Assessed',
  dispatched: 'Dispatched',
  mismatch_found: 'Mismatch Found',
  review_requested: 'Review Requested',
  approved: 'Approved',
  shipment_held: 'Shipment Held',
  approved_forwarded: 'Approved & Forwarded',
};

// ─── Shipment List Card ─────────────────────────────────────────
function ShipmentListCard({
  shipment,
  isSelected,
  onSelect,
}: {
  shipment: Shipment;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const riskCfg = RISK_CONFIG[shipment.riskLevel] || RISK_CONFIG.low;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onSelect}
      className={`glass-card rounded-lg cursor-pointer transition-all duration-200 border-l-4 ${riskCfg.borderClass} ${
        isSelected ? 'ring-1 ring-primary-fixed-dim/40 bg-surface-container-high/80' : 'hover:bg-surface-container/60'
      } ${riskCfg.cardOpacity}`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${riskCfg.dotClass} ${riskCfg.pulseClass}`} />
            <span className="font-mono text-xs text-on-surface-variant tracking-wider">{shipment.reference}</span>
          </div>
          <Badge className={`text-[9px] font-semibold uppercase tracking-wider ${riskCfg.badgeClass}`}>
            {riskCfg.badgeLabel}
          </Badge>
        </div>

        <h3 className="text-sm font-semibold text-on-surface truncate mb-1">
          {shipment.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-2">
          {shipment.origin && (
            <>
              <span>{shipment.origin}</span>
              {shipment.destination && (
                <>
                  <ArrowRight className="w-3 h-3" />
                  <span>{shipment.destination}</span>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold font-mono text-primary-fixed-dim">
            {formatZAR(shipment.totalAmount)}
          </span>
          <div className="flex items-center gap-1">
            {shipment._count.alerts > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-risk-critical">
                <AlertTriangle className="w-3 h-3" /> {shipment._count.alerts}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Detail View ────────────────────────────────────────────────
function ShipmentDetailView({ shipment }: { shipment: Shipment }) {
  const timelineEvents = shipment.timeline.length > 0 ? shipment.timeline : shipment.auditTrails.map(t => ({
    id: t.id,
    event: t.action,
    description: t.details || 'No details',
    agentName: t.agentName,
    timestamp: t.createdAt,
  }));

  // Parse risk notes into bullet points
  const riskFindings = shipment.riskNotes
    ? shipment.riskNotes.split(/[.;]\s*/).filter(s => s.trim().length > 0)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full flex flex-col"
    >
      {/* Detail Header */}
      <div className="px-6 pt-5 pb-4 border-b border-glass-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-on-surface tracking-tight">
            {shipment.reference} <span className="text-on-surface-variant font-normal">/ Detail View</span>
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-glass-border text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Report
            </Button>
            <Button
              size="sm"
              className="bg-risk-critical/90 hover:bg-risk-critical text-white text-xs"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Intervene
            </Button>
          </div>
        </div>
        <p className="font-mono text-xs text-on-surface-variant tracking-wide">
          Manifest Origin: {shipment.origin || 'N/A'} {shipment.destination ? `→ Destination: ${shipment.destination}` : ''}
        </p>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-12 gap-0">
          {/* Left 7 cols - Shipment Lifecycle Timeline */}
          <div className="col-span-12 lg:col-span-7 p-6 border-r border-glass-border">
            <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-5">
              Shipment Lifecycle
            </h3>

            {timelineEvents.length > 0 ? (
              <div className="relative pl-2">
                {timelineEvents.map((event, idx) => {
                  const style = getTimelineEventStyle(event.event, event.description);
                  const isLast = idx === timelineEvents.length - 1;
                  const agentIcon = event.agentName ? (AGENT_ICONS[event.agentName] || '🤖') : null;
                  const eventLabel = EVENT_LABELS[event.event] || event.event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.2 }}
                      className="flex gap-4 pb-5 relative"
                    >
                      {/* Vertical connector line */}
                      {!isLast && (
                        <div className="absolute left-[7px] top-6 w-px h-[calc(100%-12px)] bg-glass-border" />
                      )}

                      {/* Circle node */}
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 z-10 ${style.bgColor}`} />

                      {/* Event content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {agentIcon && <span className="text-sm">{agentIcon}</span>}
                          <span className={`text-sm font-semibold ${style.color}`}>
                            {eventLabel}
                          </span>
                          <span className="text-[10px] font-mono text-on-surface-variant ml-auto">
                            {new Date(event.timestamp).toLocaleString('en-ZA', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className={`glass-card rounded-md border-l-2 ${style.borderColor} p-2.5`}>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-on-surface-variant py-8 text-center">
                No timeline events available.
              </div>
            )}
          </div>

          {/* Right 5 cols - AI Findings + Live Port Status */}
          <div className="col-span-12 lg:col-span-5 p-6 space-y-5">
            {/* AI Findings */}
            <div className="rounded-lg border border-tertiary-fixed-dim/30 bg-tertiary-fixed-dim/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-tertiary-fixed-dim" />
                <span className="text-[10px] font-bold text-tertiary-fixed-dim uppercase tracking-widest">
                  AI Findings
                </span>
              </div>
              {riskFindings.length > 0 ? (
                <ul className="space-y-2 mb-3">
                  {riskFindings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-on-surface-variant">
                      <span className="text-tertiary-fixed-dim mt-0.5">•</span>
                      <span className="leading-relaxed">{finding.trim()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-on-surface-variant mb-3">No risk findings for this shipment.</p>
              )}
              <button className="text-[10px] font-bold text-tertiary-fixed-dim uppercase tracking-widest hover:text-tertiary-fixed transition-colors flex items-center gap-1">
                View Compliance Map
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Live Port Status */}
            <div className="glass-card rounded-lg p-4 space-y-4">
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                Live Port Status
              </h4>

              {/* Vessel Position */}
              <div>
                <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Ship className="w-3.5 h-3.5 text-primary-fixed-dim" />
                    Vessel Position
                  </span>
                  <span className="font-mono text-primary-fixed-dim">72%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '72%' }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full rounded-full bg-primary-fixed-dim"
                  />
                </div>
              </div>

              {/* ETA & Berth */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card rounded-md p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-primary-fixed-dim" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">ETA</span>
                  </div>
                  <p className="text-sm font-bold text-on-surface font-mono">
                    {shipment.destination || 'Durban'}
                  </p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">~3 days</p>
                </div>
                <div className="glass-card rounded-md p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Anchor className="w-3.5 h-3.5 text-secondary-fixed-dim" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Berth Slot</span>
                  </div>
                  <p className="text-sm font-bold text-on-surface font-mono">D4-N</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Confirmed</p>
                </div>
              </div>

              {/* Shipment Details */}
              <div className="pt-2 border-t border-glass-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <Package className="w-3 h-3" /> Commodity
                  </span>
                  <span className="font-mono text-on-surface">{shipment.commodity || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <Shield className="w-3 h-3" /> HS Code
                  </span>
                  <span className="font-mono text-on-surface">{shipment.hsCode || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Documents
                  </span>
                  <span className="font-mono text-on-surface">{shipment._count.documents}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant">Weight</span>
                  <span className="font-mono text-on-surface">{shipment.grossWeightKg ? `${shipment.grossWeightKg.toLocaleString()} kg` : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Shipment Screen ───────────────────────────────────────
export default function ShipmentScreen() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedShipmentId, setSelectedShipmentId } = useAppState();

  useEffect(() => {
    async function fetchShipments() {
      try {
        const res = await fetch('/api/shipments?include=documents,agentLogs,auditTrails,timeline,alerts');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setShipments(data);
        // Auto-select the first shipment (highest risk)
        if (data.length > 0 && !selectedShipmentId) {
          setSelectedId(data[0].id);
        } else if (selectedShipmentId) {
          setSelectedId(selectedShipmentId);
        }
      } catch (err) {
        console.error('Shipments fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchShipments();
  }, [selectedShipmentId]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSelectedShipmentId(id);
  };

  // Sort shipments by risk
  const sortedShipments = useMemo(() => {
    const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...shipments].sort((a, b) =>
      (riskOrder[a.riskLevel] ?? 4) - (riskOrder[b.riskLevel] ?? 4)
    );
  }, [shipments]);

  // Filter by search
  const filteredShipments = useMemo(() => {
    if (!searchQuery.trim()) return sortedShipments;
    const q = searchQuery.toLowerCase();
    return sortedShipments.filter(s =>
      s.reference.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      (s.origin || '').toLowerCase().includes(q) ||
      (s.destination || '').toLowerCase().includes(q) ||
      (s.commodity || '').toLowerCase().includes(q)
    );
  }, [sortedShipments, searchQuery]);

  const selectedShipment = shipments.find(s => s.id === selectedId) || null;

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 ml-0 md:ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-fixed-dim animate-spin" />
            <span className="text-sm text-on-surface-variant">Loading shipments...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile spacer */}
        <div className="h-14 md:hidden" />

        {/* ─── Top Bar ──────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 glass-card-strong border-b border-glass-border px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Search shipments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 border border-glass-border focus:outline-none focus:ring-1 focus:ring-primary-fixed-dim/40 transition-all"
              />
            </div>

            {/* Right: Title + Actions */}
            <div className="flex items-center gap-4">
              <h1 className="hidden lg:block text-sm font-bold text-on-surface tracking-tight">
                Supply Chain Alpha
              </h1>
              <div className="relative">
                <Bell className="w-5 h-5 text-on-surface-variant hover:text-on-surface cursor-pointer transition-colors" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-risk-critical rounded-full" />
              </div>
              <Button
                size="sm"
                className="bg-primary-fixed-dim hover:bg-primary-fixed text-on-primary font-semibold text-xs"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Process Document
              </Button>
            </div>
          </div>
        </header>

        {/* ─── Split Content Area ────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Shipment List (1/3) */}
          <div className="w-full md:w-1/3 lg:w-[380px] flex-shrink-0 border-r border-glass-border flex flex-col">
            {/* List Header */}
            <div className="px-5 py-4 border-b border-glass-border">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-on-surface">Active Shipments</h2>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  {filteredShipments.length} Total
                </span>
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {filteredShipments.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant">
                  <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No shipments found.</p>
                </div>
              ) : (
                filteredShipments.map((shipment) => (
                  <ShipmentListCard
                    key={shipment.id}
                    shipment={shipment}
                    isSelected={selectedId === shipment.id}
                    onSelect={() => handleSelect(shipment.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Detail View (2/3) */}
          <div className="hidden md:flex flex-1 flex-col overflow-hidden">
            {selectedShipment ? (
              <ShipmentDetailView shipment={selectedShipment} />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Truck className="w-12 h-12 mx-auto mb-3 text-on-surface-variant/30" />
                  <p className="text-sm text-on-surface-variant">Select a shipment to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Compliance Badges (Fixed Bottom-Right) ────────────────── */}
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
          <span className="glass-card rounded-full px-3 py-1 text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">
            AWS: AF-SOUTH-1
          </span>
          <span className="glass-card rounded-full px-3 py-1 text-[9px] font-mono font-bold text-primary-fixed-dim uppercase tracking-widest">
            SARS-V2-ENCRYPTED
          </span>
        </div>

        {/* ─── Mobile Detail Overlay ─────────────────────────────────── */}
        <AnimatePresence>
          {selectedShipment && (
            <div className="md:hidden fixed inset-0 z-50 bg-background">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-glass-border">
                <button
                  onClick={() => { setSelectedId(null); setSelectedShipmentId(null); }}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  ← Back
                </button>
                <span className="text-sm font-bold text-on-surface">{selectedShipment.reference}</span>
              </div>
              <div className="overflow-y-auto custom-scrollbar h-[calc(100vh-52px)]">
                <ShipmentDetailView shipment={selectedShipment} />
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
