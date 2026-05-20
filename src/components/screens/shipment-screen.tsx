'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, CheckCircle, AlertTriangle, AlertCircle,
  ChevronDown, ChevronUp, Clock, Shield, Upload, Loader2,
  Check, X, ArrowRight, Zap, Send, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import AppSidebar from '@/components/shared/app-sidebar';
import { useAppState } from '@/lib/app-state';
import { toast } from 'sonner';

// ─── Mock Data ────────────────────────────────────────────────────
type TrafficLightStatus = 'cleared' | 'processing' | 'flagged' | 'held';
type FieldConfidence = 'high' | 'medium' | 'low';

interface ExtractedField {
  label: string;
  value: string;
  confidence: FieldConfidence;
  expected?: string;
  aiNote?: string;
}

interface TrafficAlert {
  level: 'green' | 'orange' | 'red';
  title: string;
  description: string;
  financialImpact?: string;
  actions?: { label: string; variant: 'default' | 'destructive' }[];
}

interface TimelineEntry {
  icon: string;
  label: string;
  timeAgo: string;
}

const SHIPMENT_REF = 'CFP-2025-A7K3';
const SHIPMENT_STATUS: TrafficLightStatus = 'flagged';

const EXTRACTED_FIELDS: ExtractedField[] = [
  { label: 'Supplier', value: 'Global Trade (Pty) Ltd', confidence: 'high' },
  { label: 'Reference', value: 'JHB-4421', confidence: 'high' },
  { label: 'Weight', value: '28,500 KG', confidence: 'high' },
  { label: 'HS Code', value: '2601.11.00', confidence: 'medium', aiNote: 'Is this correct?' },
  { label: 'Amount', value: 'R245,000', confidence: 'high' },
  { label: 'Commodity', value: 'Manganese Ore', confidence: 'high' },
  { label: 'Port', value: 'Durban Port Terminal', confidence: 'high' },
  { label: 'BoL Weight', value: '28,000 KG', confidence: 'low', expected: '27,500 KG', aiNote: 'Mismatch with Invoice weight' },
];

const TRAFFIC_ALERTS: TrafficAlert[] = [
  {
    level: 'green',
    title: 'Shipment Verified',
    description: 'R12,000 Landed Cost calculated.',
    financialImpact: 'R12,000',
  },
  {
    level: 'orange',
    title: 'Missing Document',
    description: 'We still need the Packing List.',
  },
  {
    level: 'red',
    title: 'Weight Mismatch!',
    description: 'BoL says 28T, Invoice says 27.5T. Loss Prevented: R8,500.',
    financialImpact: 'R8,500',
    actions: [
      { label: 'See Error', variant: 'default' },
      { label: 'Approve Anyway', variant: 'destructive' },
    ],
  },
];

const TIMELINE: TimelineEntry[] = [
  { icon: '📥', label: 'Document received', timeAgo: '2 min ago' },
  { icon: '📋', label: 'Triage complete', timeAgo: '1 min ago' },
  { icon: '🔍', label: 'Data extracted', timeAgo: '45s ago' },
  { icon: '🛡️', label: 'Audit passed', timeAgo: '30s ago' },
  { icon: '📊', label: 'Risk assessed: Low', timeAgo: '15s ago' },
  { icon: '📨', label: 'Forwarded to Finance', timeAgo: 'just now' },
];

// ─── Status Badge Config ──────────────────────────────────────────
const STATUS_CONFIG: Record<TrafficLightStatus, {
  emoji: string;
  label: string;
  dotClass: string;
  bgClass: string;
  textClass: string;
}> = {
  cleared: { emoji: '🟢', label: 'Cleared', dotClass: 'bg-risk-low', bgClass: 'bg-risk-low/15', textClass: 'text-risk-low' },
  processing: { emoji: '🟡', label: 'Processing', dotClass: 'bg-risk-medium', bgClass: 'bg-risk-medium/15', textClass: 'text-risk-medium' },
  flagged: { emoji: '🟠', label: 'Flagged', dotClass: 'bg-risk-high', bgClass: 'bg-risk-high/15', textClass: 'text-risk-high' },
  held: { emoji: '🔴', label: 'Held', dotClass: 'bg-risk-critical', bgClass: 'bg-risk-critical/15', textClass: 'text-risk-critical' },
};

// ─── Confidence Indicator ─────────────────────────────────────────
function ConfidenceIndicator({ confidence }: { confidence: FieldConfidence }) {
  const config = {
    high: { dotClass: 'bg-risk-low', textClass: 'text-risk-low', label: '✅' },
    medium: { dotClass: 'bg-risk-high', textClass: 'text-risk-high', label: '🟡' },
    low: { dotClass: 'bg-risk-critical', textClass: 'text-risk-critical', label: '🔴' },
  };
  const c = config[confidence];
  return <span className={`text-sm ${c.textClass}`}>{c.label}</span>;
}

// ─── Traffic Alert Card ───────────────────────────────────────────
function TrafficAlertCard({ alert, index }: { alert: TrafficAlert; index: number }) {
  const borderColors = {
    green: 'border-l-risk-low',
    orange: 'border-l-risk-high',
    red: 'border-l-risk-critical',
  };
  const bgColors = {
    green: 'bg-risk-low/5',
    orange: 'bg-risk-high/5',
    red: 'bg-risk-critical/5',
  };
  const iconComponents = {
    green: <CheckCircle className="w-5 h-5 text-risk-low" />,
    orange: <AlertTriangle className="w-5 h-5 text-risk-high" />,
    red: <AlertCircle className="w-5 h-5 text-risk-critical animate-pulse-critical" />,
  };
  const titleColors = {
    green: 'text-risk-low',
    orange: 'text-risk-high',
    red: 'text-risk-critical',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.25 }}
      className={`glass-card rounded-lg border-l-4 ${borderColors[alert.level]} ${bgColors[alert.level]} overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{iconComponents[alert.level]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`text-sm font-bold ${titleColors[alert.level]}`}>
                {alert.title}
              </h4>
              {alert.financialImpact && (
                <Badge className={`text-[10px] font-bold px-2 py-0 h-5 ${alert.level === 'green' ? 'bg-risk-low/15 text-risk-low border-risk-low/30' : alert.level === 'red' ? 'bg-risk-critical/15 text-risk-critical border-risk-critical/30' : 'bg-risk-high/15 text-risk-high border-risk-high/30'}`}>
                  {alert.financialImpact}
                </Badge>
              )}
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">{alert.description}</p>
            {alert.actions && alert.actions.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                {alert.actions.map((action, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={action.variant === 'destructive' ? 'outline' : 'default'}
                    className={`text-xs h-7 ${
                      action.variant === 'destructive'
                        ? 'border-risk-critical/40 text-risk-critical hover:bg-risk-critical/10 hover:text-risk-critical'
                        : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border-glass-border'
                    }`}
                    onClick={() => {
                      if (action.label === 'Approve Anyway') {
                        toast.success('Weight variance approved', { description: 'Flagged for audit trail.' });
                      } else {
                        toast.info('Viewing error details');
                      }
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Shipment Screen ─────────────────────────────────────────
export default function ShipmentScreen() {
  const { setCurrentScreen } = useAppState();
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [fieldStates, setFieldStates] = useState<Record<string, 'pending' | 'confirmed' | 'rejected'>>({});
  const [confirming, setConfirming] = useState(false);

  const statusCfg = STATUS_CONFIG[SHIPMENT_STATUS];

  // Check if all fields are verified or approved
  const allFieldsResolved = EXTRACTED_FIELDS.every((f) => {
    if (f.confidence === 'high') return true;
    const state = fieldStates[f.label];
    return state === 'confirmed' || state === 'rejected';
  });

  const handleFieldAction = useCallback((label: string, action: 'confirmed' | 'rejected') => {
    setFieldStates((prev) => ({ ...prev, [label]: action }));
    if (action === 'confirmed') {
      toast.success('Field verified', { description: `${label} confirmed as correct.` });
    } else {
      toast.warning('Field flagged', { description: `${label} marked for review.` });
    }
  }, []);

  const handleConfirmForward = useCallback(async () => {
    setConfirming(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setConfirming(false);
    toast.success('Shipment Confirmed & Forwarded', {
      description: 'CFP-2025-A7K3 has been forwarded to Finance.',
    });
  }, []);

  const handleSendBack = useCallback(() => {
    toast.info('Sent back for review', {
      description: 'The shipment has been returned to the operations team.',
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile spacer */}
        <div className="h-14 md:hidden" />

        {/* ─── Top Bar ──────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 glass-card-strong border-b border-glass-border px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Back button */}
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="hidden sm:block h-6 w-px bg-glass-border" />

            {/* Shipment reference */}
            <h1
              className="text-lg sm:text-xl font-extrabold text-on-surface tracking-tight"
              style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}
            >
              {SHIPMENT_REF}
            </h1>

            {/* Status badge */}
            <Badge className={`text-[10px] font-bold px-2.5 py-0.5 h-6 ${statusCfg.bgClass} ${statusCfg.textClass} border ${statusCfg.textClass.replace('text-', 'border-').replace('/15', '/30')}`}>
              {statusCfg.emoji} {statusCfg.label}
            </Badge>

            {/* Risk amount */}
            <div className="flex items-center gap-1.5 ml-auto">
              <Shield className="w-4 h-4 text-risk-critical" />
              <span className="text-sm font-bold font-mono text-risk-critical">
                Loss Prevented: R8,500
              </span>
            </div>
          </div>
        </header>

        {/* ─── Side-by-Side Content ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-6">
            {/* Desktop: 2 columns, Mobile: stacked */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              {/* ── Left Column: Document Preview ─────────────── */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="glass-card rounded-xl h-full">
                  {/* Document header */}
                  <div className="p-4 border-b border-glass-border">
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className="text-sm font-bold text-on-surface-variant uppercase tracking-wider"
                        style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}
                      >
                        Document Preview
                      </h3>
                      <Badge className="text-[9px] font-mono bg-surface-container-high text-on-surface-variant border-glass-border">
                        PDF
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-on-surface">
                        Commercial Invoice — INV-2025-0042
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Source: Email Upload
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Uploaded 3 min ago
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document preview area */}
                  <div className="p-4">
                    <div className="bg-surface-container rounded-lg h-64 sm:h-80 flex items-center justify-center border border-glass-border relative overflow-hidden">
                      {/* Grid pattern */}
                      <div className="absolute inset-0 bg-grid-pattern opacity-50" />

                      <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-surface-container-highest flex items-center justify-center">
                          <FileText className="w-8 h-8 text-on-surface-variant/40" />
                        </div>
                        <p className="text-sm text-on-surface-variant font-medium">Commercial Invoice</p>
                        <p className="text-[10px] font-mono text-on-surface-variant/60">INV-2025-0042.pdf</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs border-glass-border text-on-surface-variant hover:text-primary-fixed-dim hover:border-primary-fixed-dim/40"
                        >
                          <Upload className="w-3 h-3 mr-1.5" />
                          Open Full Preview
                        </Button>
                      </div>

                      {/* Simulated document lines */}
                      <div className="absolute top-6 left-6 right-6 space-y-2 opacity-20">
                        <div className="h-2 bg-on-surface-variant/30 rounded w-3/4" />
                        <div className="h-2 bg-on-surface-variant/30 rounded w-1/2" />
                        <div className="h-2 bg-on-surface-variant/30 rounded w-2/3" />
                        <div className="h-px bg-on-surface-variant/20 my-3" />
                        <div className="h-2 bg-on-surface-variant/30 rounded w-5/6" />
                        <div className="h-2 bg-on-surface-variant/30 rounded w-2/5" />
                        <div className="h-2 bg-on-surface-variant/30 rounded w-3/5" />
                        <div className="h-px bg-on-surface-variant/20 my-3" />
                        <div className="h-2 bg-on-surface-variant/30 rounded w-4/5" />
                        <div className="h-2 bg-on-surface-variant/30 rounded w-1/3" />
                      </div>
                    </div>

                    {/* Additional docs row */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                        Docs:
                      </span>
                      {['Bill of Lading', 'SAD500', 'Packing List'].map((doc, i) => (
                        <span
                          key={doc}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            i === 2
                              ? 'border-risk-high/40 text-risk-high bg-risk-high/10'
                              : 'border-glass-border text-on-surface-variant bg-surface-container'
                          }`}
                        >
                          {i === 2 && '⚠ '}{doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Right Column: AI Finds ─────────────────────── */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="glass-card rounded-xl h-full">
                  <div className="p-4 border-b border-glass-border">
                    <div className="flex items-center justify-between">
                      <h3
                        className="text-sm font-bold text-on-surface-variant uppercase tracking-wider"
                        style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}
                      >
                        AI Finds
                      </h3>
                      <Badge className="text-[9px] font-mono bg-primary-fixed-dim/15 text-primary-fixed-dim border-primary-fixed-dim/30">
                        94.7% Confidence
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 space-y-0 max-h-[440px] overflow-y-auto custom-scrollbar">
                    {EXTRACTED_FIELDS.map((field, idx) => (
                      <ExtractedFieldRow
                        key={field.label}
                        field={field}
                        index={idx}
                        state={fieldStates[field.label] || 'pending'}
                        onAction={handleFieldAction}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ─── Traffic Light Alert Section ─────────────────── */}
            <div className="mb-6">
              <h3
                className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3"
                style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}
              >
                Alerts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TRAFFIC_ALERTS.map((alert, i) => (
                  <TrafficAlertCard key={i} alert={alert} index={i} />
                ))}
              </div>
            </div>

            {/* ─── Action Buttons ──────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Primary: Confirm & Forward */}
                <Button
                  size="lg"
                  disabled={!allFieldsResolved || confirming}
                  onClick={handleConfirmForward}
                  className={`flex-1 h-14 text-base font-bold rounded-xl transition-all ${
                    allFieldsResolved
                      ? 'bg-risk-low hover:bg-risk-low/90 text-white glow-cyan-strong shadow-lg shadow-risk-low/20'
                      : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
                  }`}
                  style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}
                >
                  {confirming ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5 mr-2" />
                  )}
                  {confirming ? 'Processing...' : 'Confirm & Forward'}
                </Button>

                {/* Secondary: Send Back */}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleSendBack}
                  className="h-14 text-sm font-semibold rounded-xl border-glass-border text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Send Back for Review
                </Button>
              </div>
              {!allFieldsResolved && (
                <p className="text-[11px] text-on-surface-variant mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-risk-high" />
                  Verify all flagged fields before confirming
                </p>
              )}
            </motion.div>

            {/* ─── Collapsible Timeline ────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <div className="glass-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setTimelineOpen(!timelineOpen)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-container/30 transition-colors"
                >
                  <h3
                    className="text-sm font-bold text-on-surface-variant uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}
                  >
                    Processing Timeline
                  </h3>
                  {timelineOpen ? (
                    <ChevronUp className="w-4 h-4 text-on-surface-variant" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                  )}
                </button>

                <AnimatePresence>
                  {timelineOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <div className="relative pl-2">
                          {TIMELINE.map((entry, idx) => {
                            const isLast = idx === TIMELINE.length - 1;
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05, duration: 0.2 }}
                                className="flex items-center gap-3 pb-4 relative"
                              >
                                {/* Connector line */}
                                {!isLast && (
                                  <div className="absolute left-[11px] top-7 w-px h-[calc(100%-8px)] bg-glass-border" />
                                )}

                                {/* Dot */}
                                <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-sm flex-shrink-0 z-10 border border-glass-border">
                                  {entry.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 flex items-center justify-between">
                                  <span className="text-sm text-on-surface">{entry.label}</span>
                                  <span className="text-[11px] font-mono text-on-surface-variant">{entry.timeAgo}</span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── Compliance Badges ────────────────────────────────── */}
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
          <span className="glass-card rounded-full px-3 py-1 text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest">
            AWS: AF-SOUTH-1
          </span>
          <span className="glass-card rounded-full px-3 py-1 text-[9px] font-mono font-bold text-primary-fixed-dim uppercase tracking-widest">
            SARS-V2-ENCRYPTED
          </span>
        </div>
      </main>
    </div>
  );
}

// ─── Extracted Field Row ──────────────────────────────────────────
function ExtractedFieldRow({
  field,
  index,
  state,
  onAction,
}: {
  field: ExtractedField;
  index: number;
  state: 'pending' | 'confirmed' | 'rejected';
  onAction: (label: string, action: 'confirmed' | 'rejected') => void;
}) {
  const isResolved = state !== 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className={`flex items-center gap-3 py-3 border-b border-glass-border last:border-b-0 ${
        isResolved ? 'opacity-60' : ''
      }`}
    >
      {/* Confidence indicator */}
      <ConfidenceIndicator confidence={field.confidence} />

      {/* Field label + value */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            {field.label}:
          </span>
          <span className="text-sm font-mono text-on-surface truncate">{field.value}</span>
        </div>

        {/* Mismatch info */}
        {field.confidence === 'low' && field.expected && !isResolved && (
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            <span className="text-risk-critical">Expected: {field.expected}</span>
            <ArrowRight className="w-3 h-3 text-risk-critical" />
            <span className="text-risk-high">Actual: {field.value}</span>
          </div>
        )}

        {/* AI Note */}
        {field.aiNote && !isResolved && (
          <p className="text-[11px] text-on-surface-variant mt-1 italic">{field.aiNote}</p>
        )}

        {/* Resolution state */}
        {isResolved && (
          <span className={`text-[10px] font-bold mt-1 inline-block ${
            state === 'confirmed' ? 'text-risk-low' : 'text-risk-critical'
          }`}>
            {state === 'confirmed' ? '✓ Verified' : '✗ Flagged for review'}
          </span>
        )}
      </div>

      {/* Action buttons for medium/low confidence */}
      {field.confidence !== 'high' && !isResolved && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onAction(field.label, 'confirmed')}
            className="w-7 h-7 rounded-md bg-risk-low/15 hover:bg-risk-low/30 flex items-center justify-center transition-colors"
            title="Yes, this is correct"
          >
            <Check className="w-3.5 h-3.5 text-risk-low" />
          </button>
          <button
            onClick={() => onAction(field.label, 'rejected')}
            className="w-7 h-7 rounded-md bg-risk-critical/15 hover:bg-risk-critical/30 flex items-center justify-center transition-colors"
            title="No, this is wrong"
          >
            <X className="w-3.5 h-3.5 text-risk-critical" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
