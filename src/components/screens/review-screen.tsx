'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, AlertTriangle, AlertCircle, Shield,
  CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp,
  Brain, TrendingUp, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
}> = {
  critical: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    label: 'CRITICAL',
  },
  high: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    label: 'HIGH',
  },
  medium: {
    icon: <Shield className="w-5 h-5" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    label: 'MEDIUM',
  },
  low: {
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    label: 'LOW',
  },
};

// ─── Agent Icons ─────────────────────────────────────────────────
const AGENT_ICONS: Record<string, string> = {
  triage_clerk: '📋',
  data_extractor: '🔍',
  auditor: '🛡️',
  risk_analyst: '📊',
  dispatcher: '📨',
};

// ─── Estimate Financial Impact ───────────────────────────────────
function estimateFinancialImpact(alert: Alert): string {
  const riskLevel = alert.shipment.riskLevel;
  if (riskLevel === 'critical') return 'R50,000 – R200,000+';
  if (riskLevel === 'high') return 'R15,000 – R50,000';
  return 'R5,000 – R15,000';
}

// ─── Review Item Card ────────────────────────────────────────────
function ReviewItemCard({
  alert,
  onApprove,
  onHold,
}: {
  alert: Alert;
  onApprove: (id: string, shipmentId: string) => void;
  onHold: (id: string, shipmentId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [approving, setApproving] = useState(false);
  const [holding, setHolding] = useState(false);

  const severity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;

  const handleApprove = async () => {
    setApproving(true);
    await onApprove(alert.id, alert.shipment.id);
    setApproving(false);
  };

  const handleHold = async () => {
    setHolding(true);
    await onHold(alert.id, alert.shipment.id);
    setHolding(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`glass-card ${severity.borderColor} overflow-hidden`}>
        {/* Severity Strip */}
        <div className={`h-1 ${severity.bgColor}`} style={{ background: alert.severity === 'critical' ? 'linear-gradient(90deg, #ef4444, #f97316)' : alert.severity === 'high' ? 'linear-gradient(90deg, #f97316, #f59e0b)' : undefined }} />

        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Severity indicator */}
            <div className={`p-2 rounded-lg ${severity.bgColor} ${severity.color} flex-shrink-0`}>
              {severity.icon}
            </div>

            <div className="flex-1 min-w-0">
              {/* Severity badge */}
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`text-[10px] font-bold ${severity.bgColor} ${severity.color} ${severity.borderColor}`}>
                  {severity.label}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {alert.type.replace(/_/g, ' ')}
                </Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {new Date(alert.createdAt).toLocaleString('en-ZA', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Shipment reference and title */}
              <h3 className="text-sm font-semibold">{alert.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-primary/70">{alert.shipment.reference}</span>
                <span className="text-xs text-muted-foreground">· {alert.shipment.title}</span>
              </div>

              {/* AI Finding */}
              <div className="mt-3 p-3 rounded-lg bg-muted/20 border border-border/20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Brain className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">AI Finding</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
              </div>

              {/* Financial Impact */}
              <div className="flex items-center gap-1.5 mt-3">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-muted-foreground">Estimated Financial Impact:</span>
                <span className="text-xs font-semibold text-amber-400">{estimateFinancialImpact(alert)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/20">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={handleApprove}
              disabled={approving || holding}
            >
              {approving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve &amp; Forward to Finance
            </Button>
            <Button
              variant="destructive"
              className="flex-1 font-semibold"
              onClick={handleHold}
              disabled={approving || holding}
            >
              {holding ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Hold Shipment
            </Button>
          </div>

          {/* View Details Toggle */}
          <button
            className="flex items-center gap-1.5 mt-3 text-xs text-primary/70 hover:text-primary transition-colors"
            onClick={() => setExpanded(!expanded)}
          >
            <Eye className="w-3.5 h-3.5" />
            {expanded ? 'Hide' : 'View'} Details
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Expanded Details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 pt-3 border-t border-border/20">
                  {/* Shipment Details */}
                  <div>
                    <h5 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Shipment Details</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Industry:</span>{' '}
                        <span className="font-medium capitalize">{alert.shipment.industry}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>{' '}
                        <span className="font-medium capitalize">{alert.shipment.status}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Risk Level:</span>{' '}
                        <span className={`font-medium capitalize ${severity.color}`}>{alert.shipment.riskLevel}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Commodity:</span>{' '}
                        <span className="font-medium">{alert.shipment.commodity || '—'}</span>
                      </div>
                      {alert.shipment.totalAmount && (
                        <div>
                          <span className="text-muted-foreground">Total Amount:</span>{' '}
                          <span className="font-medium">R{alert.shipment.totalAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Alert Channel:</span>{' '}
                        <span className="font-medium capitalize">{alert.channel}</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-border/20" />

                  {/* Agent Outputs */}
                  <div>
                    <h5 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Agent Processing Pipeline</h5>
                    <div className="space-y-2">
                      {Object.entries(AGENT_ICONS).map(([key, icon]) => (
                        <div key={key} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/15">
                          <span>{icon}</span>
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                          <Badge variant="outline" className="text-[9px] ml-auto border-emerald-500/30 text-emerald-400">
                            Completed
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-border/20" />

                  {/* Alert Details */}
                  <div>
                    <h5 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Full Alert Data</h5>
                    <pre className="text-[10px] font-mono text-muted-foreground bg-background/50 rounded-lg p-3 overflow-x-auto max-h-40 overflow-y-auto">
                      {JSON.stringify(alert, null, 2)}
                    </pre>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Review Screen ─────────────────────────────────────────
export default function ReviewScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Loading review queue...</span>
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
            <ClipboardCheck className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold">Review Queue</h1>
              <p className="text-xs text-muted-foreground">Items requiring your attention</p>
            </div>
            <Badge variant="outline" className="border-red-500/30 bg-red-500/5 text-red-400 text-[10px] ml-2">
              {alerts.length} pending
            </Badge>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-4">
          {alerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 text-center"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                No high-risk or critical items require your review right now. The AI swarm is handling everything autonomously.
              </p>
            </motion.div>
          ) : (
            alerts.map((alert) => (
              <ReviewItemCard
                key={alert.id}
                alert={alert}
                onApprove={handleApprove}
                onHold={handleHold}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
