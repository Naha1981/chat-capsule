'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, AlertCircle, Shield, CheckCircle, XCircle,
  Loader2, Brain, TrendingUp, Bell, Search, FileText,
  FlaskConical, Eye, ClipboardCheck, ShieldCheck, Lock,
  ArrowRight, Clock, Activity, Ship, Building2, Star,
  FileCheck2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppSidebar from '@/components/shared/app-sidebar';
import { useAppState } from '@/lib/app-state';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────
interface Alert {
  id: string;
  shipmentId: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  shipment: {
    id: string;
    reference: string;
    title: string;
    industry: string;
    riskLevel: string;
    status: string;
    commodity?: string;
    totalAmount?: number;
  };
}

// ─── Severity Config ─────────────────────────────────────────────
const SEVERITY_CONFIG: Record<string, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  gradient: string;
}> = {
  critical: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-risk-critical',
    bgColor: 'bg-risk-critical/10',
    borderColor: 'border-risk-critical/30',
    label: 'CRITICAL',
    gradient: 'linear-gradient(180deg, #ef4444, #b91c1c)',
  },
  high: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-risk-high',
    bgColor: 'bg-risk-high/10',
    borderColor: 'border-risk-high/30',
    label: 'HIGH',
    gradient: 'linear-gradient(180deg, #f97316, #c2410c)',
  },
  medium: {
    icon: <Shield className="w-5 h-5" />,
    color: 'text-risk-medium',
    bgColor: 'bg-risk-medium/10',
    borderColor: 'border-risk-medium/30',
    label: 'MEDIUM',
    gradient: 'linear-gradient(180deg, #f59e0b, #b45309)',
  },
  low: {
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-risk-low',
    bgColor: 'bg-risk-low/10',
    borderColor: 'border-risk-low/30',
    label: 'LOW',
    gradient: 'linear-gradient(180deg, #10b981, #047857)',
  },
};

// ─── Estimate Financial Impact ───────────────────────────────────
function estimateFinancialImpact(alert: Alert): string {
  const riskLevel = alert.shipment.riskLevel;
  if (riskLevel === 'critical') return 'R50,000 – R200,000+';
  if (riskLevel === 'high') return 'R15,000 – R50,000';
  return 'R5,000 – R15,000';
}

// ─── Agent Pipeline Node ─────────────────────────────────────────
function PipelineNode({
  label,
  icon,
  status,
  isLast,
}: {
  label: string;
  icon: React.ReactNode;
  status: 'complete' | 'active' | 'pending';
  isLast: boolean;
}) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center gap-1.5">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
            status === 'complete'
              ? 'bg-risk-low/20 border-risk-low text-risk-low'
              : status === 'active'
                ? 'bg-risk-critical/20 border-risk-critical text-risk-critical animate-pulse-critical'
                : 'bg-surface-container-high border-outline-variant text-outline-variant'
          }`}
        >
          {status === 'complete' ? (
            <CheckCircle className="w-4 h-4" />
          ) : status === 'active' ? (
            icon
          ) : (
            icon
          )}
        </div>
        <span
          className={`text-[10px] font-mono uppercase tracking-wider whitespace-nowrap ${
            status === 'complete'
              ? 'text-risk-low'
              : status === 'active'
                ? 'text-risk-critical font-bold'
                : 'text-outline-variant'
          }`}
        >
          {label}
        </span>
      </div>
      {!isLast && (
        <div className="flex items-center mx-1 mb-5">
          <div
            className={`w-8 h-0.5 ${
              status === 'complete' ? 'bg-risk-low/50' : 'bg-outline-variant/30'
            }`}
          />
          <ArrowRight
            className={`w-3 h-3 ${
              status === 'complete' ? 'text-risk-low/50' : 'text-outline-variant/30'
            }`}
          />
        </div>
      )}
    </div>
  );
}

// ─── Alert Card (Right Column) ──────────────────────────────────
function AlertStreamCard({ alert }: { alert: Alert }) {
  const severity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
  const isCritical = alert.severity === 'critical';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass-card rounded-lg overflow-hidden ${isCritical ? '' : 'opacity-85'}`}
    >
      {/* Left gradient border */}
      <div className="flex">
        <div
          className="w-1 flex-shrink-0"
          style={{ background: severity.gradient }}
        />
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-on-surface-variant">
                {alert.shipment.reference}
              </span>
            </div>
            <Badge
              className={`text-[9px] font-bold px-1.5 py-0 h-5 ${severity.bgColor} ${severity.color} ${severity.borderColor}`}
            >
              {severity.label}
            </Badge>
          </div>
          <h4 className="text-sm font-semibold text-on-surface leading-snug mb-1">
            {alert.title}
          </h4>
          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
            <Clock className="w-3 h-3" />
            {new Date(alert.createdAt).toLocaleString('en-ZA', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Review Screen ─────────────────────────────────────────
export default function ReviewScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts?isResolved=false&severity=high,critical');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleApprove = async (alertId: string, shipmentId: string) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action: 'resolve',
          shipmentId,
          shipmentStatus: 'cleared',
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Approved & Forwarded to Finance', {
          description: 'The shipment has been cleared and forwarded to the finance team.',
        });
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch {
      toast.error('Failed to approve shipment');
    }
  };

  const handleHold = async (alertId: string, shipmentId: string) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action: 'resolve',
          shipmentId,
          shipmentStatus: 'held',
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.warning('Shipment Held', {
          description: 'The shipment has been placed on hold pending further review.',
        });
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch {
      toast.error('Failed to hold shipment');
    }
  };

  // Primary alert for the main view
  const primaryAlert = alerts[0];
  const primarySeverity = primaryAlert
    ? SEVERITY_CONFIG[primaryAlert.severity] || SEVERITY_CONFIG.medium
    : null;

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-on-surface-variant">Loading review queue...</span>
          </div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 md:ml-64 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-risk-low/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-risk-low" />
            </div>
            <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
              No high-risk or critical items require your review right now. The AI swarm is handling everything autonomously.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-dim">
      <AppSidebar />

      <main className="flex-1 md:ml-64 min-h-screen flex flex-col relative">
        {/* Mobile spacer */}
        <div className="h-14 md:hidden" />

        {/* ─── Top Bar ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 glass-card-strong border-b border-glass-border px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            {/* Left: Headline */}
            <h1
              className="text-lg font-extrabold text-primary-fixed-dim tracking-tight hidden sm:block"
              style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}
            >
              Supply Chain Alpha
            </h1>
            <div className="hidden sm:block h-6 w-px bg-glass-border" />

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <Input
                placeholder="Search shipments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs bg-surface-container-high border-glass-border placeholder:text-on-surface-variant/50"
              />
            </div>

            {/* Right: Bell + Process Document Button */}
            <div className="flex items-center gap-3 ml-auto">
              <button className="relative p-2 rounded-lg hover:bg-surface-container-high transition-colors">
                <Bell className="w-4 h-4 text-on-surface-variant" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-risk-critical" />
              </button>
              <Button
                className="bg-primary-fixed-dim text-on-primary hover:bg-primary-fixed font-semibold text-xs glow-cyan"
                size="sm"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Process Document
              </Button>
            </div>
          </div>
        </header>

        {/* ─── Section Header ──────────────────────────────────── */}
        <div className="px-4 sm:px-6 pt-5 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight"
              style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}
            >
              Attention Focus:{' '}
              <span className="text-risk-critical">CRITICAL</span>
            </h2>
            <div className="flex items-center gap-3">
              <Badge className="bg-risk-critical/15 text-risk-critical border-risk-critical/30 text-[10px] font-bold px-2.5 py-0.5 h-6">
                <span className="w-2 h-2 rounded-full bg-risk-critical mr-1.5 animate-pulse" />
                {alerts.length} UNRESOLVED RISK{alerts.length !== 1 ? 'S' : ''}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Reviewing flag generated by AI Risk Agent{' '}
            {primaryAlert && (
              <span className="font-mono text-secondary-fixed-dim text-xs">
                {primaryAlert.shipment.reference}
              </span>
            )}
          </p>
        </div>

        {/* ─── Main Grid (8/4 split) ──────────────────────────── */}
        <div className="flex-1 px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ─── Left Column (8 cols) ──────────────────────────── */}
          <div className="lg:col-span-8 space-y-5">
            {primaryAlert && primarySeverity && (
              <>
                {/* ── AI Finding Box ───────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="glass-card rounded-lg overflow-hidden">
                    {/* Primary-fixed-dim left bar */}
                    <div className="flex">
                      <div className="w-1.5 flex-shrink-0 bg-primary-fixed-dim" />
                      <div className="flex-1 p-5">
                        {/* Header row */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-primary-fixed-dim/15 flex items-center justify-center flex-shrink-0">
                            <Brain className="w-5 h-5 text-primary-fixed-dim" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-base font-bold text-on-surface"
                              style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}
                            >
                              AI Finding: {primaryAlert.title}
                            </h3>
                            <p className="text-sm text-on-surface-variant leading-relaxed mt-1.5">
                              {primaryAlert.message}
                            </p>
                          </div>
                        </div>

                        {/* Financial Impact + Confidence */}
                        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-glass-border">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-risk-medium" />
                            <span className="text-xs text-on-surface-variant">Financial Impact:</span>
                            <span className="text-sm font-bold text-risk-medium">
                              {estimateFinancialImpact(primaryAlert)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-secondary-fixed-dim" />
                            <span className="text-xs text-on-surface-variant">Confidence Score:</span>
                            <span className="text-sm font-bold text-secondary-fixed-dim">94.7%</span>
                          </div>
                        </div>

                        {/* Model badge */}
                        <div className="mt-3">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono border-outline-variant/50 text-on-surface-variant"
                          >
                            <FlaskConical className="w-3 h-3 mr-1" />
                            Model: TradeSentry v4.2
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ── Agent Pipeline Visual ────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="glass-card rounded-lg p-5">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-4">
                      Agent Pipeline
                    </h4>
                    <div className="flex items-start justify-between overflow-x-auto pb-2 custom-scrollbar">
                      <PipelineNode
                        label="Ingestion"
                        icon={<ClipboardCheck className="w-4 h-4" />}
                        status="complete"
                        isLast={false}
                      />
                      <PipelineNode
                        label="Auditor"
                        icon={<Eye className="w-4 h-4" />}
                        status="complete"
                        isLast={false}
                      />
                      <PipelineNode
                        label="Risk Analyst"
                        icon={<AlertTriangle className="w-4 h-4" />}
                        status="active"
                        isLast={false}
                      />
                      <PipelineNode
                        label="Compliance"
                        icon={<ShieldCheck className="w-4 h-4" />}
                        status="pending"
                        isLast={false}
                      />
                      <PipelineNode
                        label="Release"
                        icon={<CheckCircle className="w-4 h-4" />}
                        status="pending"
                        isLast={true}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* ── Action Zone ──────────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Approve & Forward */}
                    <ApproveButton
                      alertId={primaryAlert.id}
                      shipmentId={primaryAlert.shipment.id}
                      onApprove={handleApprove}
                    />

                    {/* Hold Shipment */}
                    <HoldButton
                      alertId={primaryAlert.id}
                      shipmentId={primaryAlert.shipment.id}
                      onHold={handleHold}
                    />
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* ─── Right Column (4 cols) ─────────────────────────── */}
          <div className="lg:col-span-4 space-y-5">
            {/* Active Risk Stream Header */}
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-risk-critical" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-bold">
                Active Risk Stream
              </span>
            </div>

            {/* Alert Cards */}
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {alerts.map((alert) => (
                <AlertStreamCard key={alert.id} alert={alert} />
              ))}
            </div>

            {/* Historical Context */}
            <div className="bg-surface-container-high rounded-lg p-4 space-y-3">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant font-bold">
                Historical Context
              </h4>
              {primaryAlert && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-highest flex items-center justify-center">
                      <Ship className="w-4 h-4 text-on-surface-variant" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface">
                        Carrier: {primaryAlert.shipment.title}
                      </p>
                      <p className="text-[10px] text-on-surface-variant font-mono">
                        {primaryAlert.shipment.industry} • {primaryAlert.shipment.commodity || 'General Cargo'}
                      </p>
                    </div>
                  </div>

                  {/* Port image placeholder */}
                  <div className="h-20 rounded-lg bg-surface-container-highest overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high to-transparent z-10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-outline-variant/30" />
                    </div>
                    <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1">
                      <span className="text-[9px] font-mono text-on-surface-variant bg-surface-container/80 px-1.5 py-0.5 rounded">
                        Port of Durban
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface-container rounded-lg p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="w-3 h-3 text-risk-medium" />
                        <span className="text-[10px] text-on-surface-variant">Authority Rating</span>
                      </div>
                      <span className="text-sm font-bold text-risk-medium">B+</span>
                    </div>
                    <div className="bg-surface-container rounded-lg p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <FileCheck2 className="w-3 h-3 text-secondary-fixed-dim" />
                        <span className="text-[10px] text-on-surface-variant">Doc Match</span>
                      </div>
                      <span className="text-sm font-bold text-secondary-fixed-dim">67%</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Audit Chain Notice */}
            <div className="border-2 border-dashed border-outline-variant/40 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-on-surface-variant" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-on-surface mb-0.5">
                    Immutable Audit Chain
                  </h4>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    All decisions are logged to the SARS immutable audit chain
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Compliance Badge (Fixed bottom-right) ──────────── */}
        <div className="fixed bottom-4 right-4 z-40">
          <div className="glass-card rounded-full px-3 py-1.5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-risk-low" />
            <span className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider">
              AWS af-south-1 • POPIA COMPLIANT
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Approve Button Component ────────────────────────────────────
function ApproveButton({
  alertId,
  shipmentId,
  onApprove,
}: {
  alertId: string;
  shipmentId: string;
  onApprove: (alertId: string, shipmentId: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await onApprove(alertId, shipmentId);
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="glass-card rounded-lg p-4 border-2 border-risk-low/40 hover:border-risk-low/80 transition-all group text-left"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-risk-low/15 flex items-center justify-center group-hover:bg-risk-low/25 transition-colors">
          {loading ? (
            <Loader2 className="w-5 h-5 text-risk-low animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5 text-risk-low" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-bold text-risk-low">Approve & Forward</h4>
          <p className="text-[11px] text-on-surface-variant">Clear to SARS Compliance</p>
        </div>
      </div>
    </button>
  );
}

// ─── Hold Button Component ───────────────────────────────────────
function HoldButton({
  alertId,
  shipmentId,
  onHold,
}: {
  alertId: string;
  shipmentId: string;
  onHold: (alertId: string, shipmentId: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await onHold(alertId, shipmentId);
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="glass-card rounded-lg p-4 border-2 border-risk-critical/40 hover:border-risk-critical/80 transition-all group text-left"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-risk-critical/15 flex items-center justify-center group-hover:bg-risk-critical/25 transition-colors">
          {loading ? (
            <Loader2 className="w-5 h-5 text-risk-critical animate-spin" />
          ) : (
            <XCircle className="w-5 h-5 text-risk-critical" />
          )}
        </div>
        <div>
          <h4 className="text-sm font-bold text-risk-critical">Hold Shipment</h4>
          <p className="text-[11px] text-on-surface-variant">Internal Investigation Required</p>
        </div>
      </div>
    </button>
  );
}
