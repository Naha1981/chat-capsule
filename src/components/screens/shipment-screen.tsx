'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Loader2, ChevronDown, ChevronRight, MapPin,
  Package, FileText, Shield, Clock, CheckCircle, AlertTriangle,
  AlertCircle, Circle, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

// ─── Status Color Mapping ────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  processing: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  cleared: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  flagged: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  held: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const RISK_DOT_COLORS: Record<string, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

// ─── Timeline Event Icon/Color ──────────────────────────────────
function getTimelineEventStyle(event: string, description: string): {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
} {
  const isFlag = description.toLowerCase().includes('flag') || description.toLowerCase().includes('mismatch');
  const isCritical = description.toLowerCase().includes('critical') || description.toLowerCase().includes('failed');

  if (isCritical) {
    return {
      icon: <AlertCircle className="w-4 h-4" />,
      color: 'text-red-400',
      bgColor: 'bg-red-500/15',
    };
  }
  if (isFlag) {
    return {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/15',
    };
  }
  return {
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
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

// ─── Shipment Card ───────────────────────────────────────────────
function ShipmentCard({
  shipment,
  isExpanded,
  onToggle,
}: {
  shipment: Shipment;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`glass-card border-border/30 cursor-pointer transition-all duration-300 ${
          isExpanded ? 'border-primary/30 glow-cyan' : 'hover:border-border/50'
        }`}
        onClick={onToggle}
      >
        <CardContent className="p-4 sm:p-5">
          {/* Main Row */}
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              {/* Risk Dot */}
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${RISK_DOT_COLORS[shipment.riskLevel]} ${
                shipment.riskLevel === 'critical' || shipment.riskLevel === 'high' ? 'animate-subtle-pulse' : ''
              }`} />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-primary/70">{shipment.reference}</span>
                  <Badge className={`text-[10px] ${STATUS_COLORS[shipment.status] || 'bg-muted text-muted-foreground border-border'}`}>
                    {shipment.status}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold mt-1 truncate">{shipment.title}</h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                  {shipment.commodity && (
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" /> {shipment.commodity}
                    </span>
                  )}
                  {shipment.origin && shipment.destination && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {shipment.origin} → {shipment.destination}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-semibold text-foreground/80">
                    {formatZAR(shipment.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" /> {shipment._count.documents}
                <Shield className="w-3 h-3 ml-1" /> {shipment._count.alerts}
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Expanded Timeline ──────────────────────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pl-6 pr-4 py-4 ml-4 border-l-2 border-primary/20">
              {/* Timeline Events */}
              {shipment.timeline.length > 0 ? (
                <div className="space-y-0">
                  {shipment.timeline.map((event, idx) => {
                    const style = getTimelineEventStyle(event.event, event.description);
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="flex gap-3 pb-4 relative"
                      >
                        {/* Vertical connector line */}
                        {idx < shipment.timeline.length - 1 && (
                          <div className="absolute left-[9px] top-6 w-px h-[calc(100%-16px)] bg-border/30" />
                        )}

                        {/* Icon circle */}
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${style.bgColor} ${style.color} z-10`}>
                          {style.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {EVENT_LABELS[event.event] || event.event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            {event.agentName && (
                              <span className="text-sm" title={event.agentName}>
                                {AGENT_ICONS[event.agentName] || '🤖'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {new Date(event.timestamp).toLocaleString('en-ZA', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                // Fallback: use audit trails if no timeline events
                shipment.auditTrails.length > 0 ? (
                  <div className="space-y-0">
                    {shipment.auditTrails.map((trail, idx) => {
                      const style = getTimelineEventStyle(trail.action, trail.details || '');
                      return (
                        <motion.div
                          key={trail.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          className="flex gap-3 pb-4 relative"
                        >
                          {idx < shipment.auditTrails.length - 1 && (
                            <div className="absolute left-[9px] top-6 w-px h-[calc(100%-16px)] bg-border/30" />
                          )}
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${style.bgColor} ${style.color} z-10`}>
                            {style.icon}
                          </div>
                          <div className="flex-1 min-w-0 pb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">
                                {EVENT_LABELS[trail.action] || trail.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              {trail.agentName && (
                                <span className="text-sm">{AGENT_ICONS[trail.agentName] || '🤖'}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{trail.details || 'No details'}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                              {new Date(trail.createdAt).toLocaleString('en-ZA', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-4">No timeline events available.</div>
                )
              )}

              {/* Risk Notes */}
              {shipment.riskNotes && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">Risk Notes</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{shipment.riskNotes}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Shipment Screen ───────────────────────────────────────
export default function ShipmentScreen() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchShipments() {
      try {
        const res = await fetch('/api/shipments?include=documents,agentLogs,auditTrails,timeline,alerts');
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

  const handleToggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // Group shipments - just show them as a flat list sorted by risk
  const sortedShipments = useMemo(() => {
    const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...shipments].sort((a, b) =>
      (riskOrder[a.riskLevel] ?? 4) - (riskOrder[b.riskLevel] ?? 4)
    );
  }, [shipments]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Loading shipments...</span>
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
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Shipment Timeline</h1>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[10px]">
              {shipments.length} shipments
            </Badge>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-4">
          {sortedShipments.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No shipments found.</p>
            </div>
          ) : (
            sortedShipments.map((shipment) => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                isExpanded={expandedId === shipment.id}
                onToggle={() => handleToggle(shipment.id)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
