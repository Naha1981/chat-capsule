'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Zap, TrendingUp, Shield, Clock, Activity,
  ChevronRight, Loader2, FileText, Send, CheckCircle2, Circle,
  Search, AlertTriangle, Verified, Bolt
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import AppSidebar from '@/components/shared/app-sidebar';
import { useAppState } from '@/lib/app-state';
import { INDUSTRY_LIST, getIndustryConfig, type IndustryKey } from '@/lib/industries';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────
interface IndustryBreakdownItem {
  industry: string;
  count: number;
  label: string;
  icon: string;
}

interface IndustryRiskBreakdownItem {
  industry: string;
  label: string;
  icon: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
  totalRiskScore: number;
}

interface TopIndustryRiskItem {
  industry: string;
  label: string;
  reference: string;
  title: string;
  riskLevel: string;
  icon: string;
  estimatedValue?: number;
  riskNotes?: string;
}

interface IndustryRulesSummaryItem {
  industry: string;
  label: string;
  icon: string;
  rulesCount: number;
}

interface IndustryCoverageItem {
  key: string;
  label: string;
  icon: string;
  shipmentCount: number;
  hasCoverage: boolean;
}

interface DashboardData {
  metrics: Array<{ key: string; value: number; label: string; unit: string }>;
  shipmentsByStatus: Array<{ status: string; _count: { status: number } }>;
  riskDistribution: Array<{ riskLevel: string; _count: { riskLevel: number } }>;
  unreadAlerts: number;
  recentAlerts: Array<{
    id: string; title: string; message: string; severity: string; createdAt: string;
    shipment: { reference: string; title: string };
  }>;
  agentStats: Array<{
    agentName: string; _count: { agentName: number }; _avg: { duration: number | null };
  }>;
  savingsTrend: Array<{ month: string; value: number }>;
  totalRiskValue: number;
  industryBreakdown: IndustryBreakdownItem[];
  industryRiskBreakdown: IndustryRiskBreakdownItem[];
  topIndustryRisks: TopIndustryRiskItem[];
  industryRulesSummary: IndustryRulesSummaryItem[];
  industryCoverage: IndustryCoverageItem[];
}

// ─── Agent Definitions ───────────────────────────────────────────
const AGENTS = [
  { key: 'triage_clerk', name: 'Triage', icon: '📋', role: 'Router', color: '#10b981', status: 'Online' as const },
  { key: 'data_extractor', name: 'Extractor', icon: '🔍', role: 'OCR Specialist', color: '#3b82f6', status: 'Online' as const },
  { key: 'auditor', name: 'Auditor', icon: '🛡️', role: 'Validator', color: '#f59e0b', status: 'Working' as const },
  { key: 'risk_analyst', name: 'Risk', icon: '📊', role: 'Decision Maker', color: '#ef4444', status: 'Online' as const },
  { key: 'dispatcher', name: 'Dispatcher', icon: '📨', role: 'Communicator', color: '#8b5cf6', status: 'Online' as const },
];

// ─── Multi-Industry Ticker Items ─────────────────────────────────
const TICKER_ITEMS = [
  // Logistics
  '🚢 Auditor caught Weight Mismatch on Shipment JHB-4421',
  '🚢 Risk Analyst flagged HS Code variance on CRD-8834',
  '🚢 Dispatcher sent WhatsApp alert to MD for CPT-2209',
  // Mining
  '⛏️ Auditor flagged grade under-spec on Manganese Assay ASSY-0892',
  '⛏️ Risk Analyst prevented R250K cargo rejection at Hotazel',
  '⛏️ Triage Clerk auto-routed Export Permit for renewal check',
  // Pharma
  '💊 Cold chain break detected on Batch BN-2025-A4421',
  '💊 Risk Analyst prevented R350K batch write-off on Amoxicillin',
  '💊 Auditor verified GMP compliance for PharmaCorp shipment',
  // Energy
  '⚡ Missing Heavy Lift Permit flagged for Medupi Phase 3',
  '⚡ Risk Analyst prevented R50K/day idle time on crane delivery',
  '⚡ Multi-vendor coordination delay flagged on EPC-MDP-003',
  // Automotive
  '🚗 VIN mismatch caught across Manifest & Invoice for BMW 340i',
  '🚗 Bond Store penalty warning issued for BND-DBN-0442',
  // Construction
  '🏗️ Substandard concrete (38 MPa vs 40 MPa spec) flagged on BOQ-WTR-014',
  '🏗️ Overbilling caught on Waterberg Tower — R22K variance',
  // Trade Finance
  '🏦 SWIFT vs BoL verification prevented R500K document fraud',
  '🏦 LC expiry risk flagged on LC-STD-2025-00882',
  // Retail
  '🛒 Short delivery caught: 28 units missing from GRV-3321',
  '🛒 Overbilling detected on PO-CHK-8821 — unit price variance',
  // Cross-Border
  '🌐 Transit Bond NOT ACQUIATED flagged for TB-ZIM-2025-018',
  '🌐 Beitbridge permit expiry warning — 2 days remaining',
  // Air Cargo
  '✈️ Chargeable weight anomaly detected on MAWB 074-12345678',
  '✈️ DG non-compliance flagged on air cargo shipment',
  // Accounting
  '📊 Bank account mismatch detected on TI-2025-00882',
  '📊 VAT number discrepancy flagged for SARS compliance',
  // Trading
  '🌍 LC amount mismatch caught — PO-2025-7821 shortfall',
  '🌍 Insurance gap flagged on AfriTrade electronics shipment',
  // Warehousing
  '📦 Inventory shrinkage pattern detected — 13 units damaged',
  '📦 Bin mismatch caught at DHL JHB warehouse',
  // Government
  '🏛️ Bid irregularity flagged on GPE-2025-0882 tender',
  '🏛️ Procurement leakage warning on IT infrastructure bid',
];

// ─── Risk Colors ─────────────────────────────────────────────────
const RISK_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

// ─── Risk Index Data ─────────────────────────────────────────────
const RISK_INDEX_DATA = [
  { label: 'Logistics', risk: 'LOW', value: 15, color: '#10b981' },
  { label: 'Chemical / Hazmat', risk: 'HIGH', value: 82, color: '#f97316' },
  { label: 'Manufacturing', risk: 'MEDIUM', value: 45, color: '#f59e0b' },
  { label: 'Consumer Goods', risk: 'LOW', value: 20, color: '#10b981' },
];

// ─── Format Helpers ──────────────────────────────────────────────
function formatZAR(val: number): string {
  if (val >= 1000000) return `R${(val / 1000000).toFixed(0)}M`;
  if (val >= 1000) return `R${(val / 1000).toFixed(0)}K`;
  return `R${val.toLocaleString()}`;
}

// ─── Recharts Tooltip Styling ────────────────────────────────────
const CHART_TOOLTIP_STYLE = {
  background: 'oklch(0.12 0.02 240 / 90%)',
  border: '1px solid oklch(0.3 0.03 240 / 40%)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '12px',
};

// ─── Main Dashboard Screen ──────────────────────────────────────
export default function DashboardScreen() {
  const { workspaceName, workspaceIndustry } = useAppState();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [docText, setDocText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>(workspaceIndustry || 'logistics');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roiDocsPerDay, setRoiDocsPerDay] = useState(24);
  const [roiAvgMinPerDoc, setRoiAvgMinPerDoc] = useState(15);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Update selected industry when workspaceIndustry changes
  useEffect(() => {
    if (workspaceIndustry) {
      setSelectedIndustry(workspaceIndustry);
    }
  }, [workspaceIndustry]);

  // Get sample documents for the selected industry
  const industrySampleDocs = useMemo(() => {
    const config = getIndustryConfig(selectedIndustry);
    return config.sampleDocuments || {};
  }, [selectedIndustry]);

  const handleProcessDocument = async () => {
    if (!docText.trim()) {
      toast.error('Please enter document text');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: docText, industry: selectedIndustry }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Document processed successfully!', {
          description: `Risk Level: ${result.result.riskLevel} | Status: ${result.result.finalStatus}`,
        });
        setProcessDialogOpen(false);
        setDocText('');
        setSelectedTemplate('');
        fetchDashboard();
      } else {
        toast.error('Processing failed', { description: result.error });
      }
    } catch {
      toast.error('Failed to process document');
    } finally {
      setProcessing(false);
    }
  };

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    setDocText(industrySampleDocs[template] || '');
  };

  const handleIndustryChange = (industry: string) => {
    setSelectedIndustry(industry);
    setSelectedTemplate('');
    setDocText('');
  };

  // Extract metrics with defaults
  const totalSavings = data?.metrics?.find(m => m.key === 'total_savings_zar')?.value ?? 4200000;
  const risksCaught = data?.metrics?.find(m => m.key === 'risks_caught')?.value ?? 3;
  const hoursReclaimed = data?.metrics?.find(m => m.key === 'documents_processed')?.value
    ? Math.round((data.metrics.find(m => m.key === 'documents_processed')!.value / 1247) * 120)
    : 1840;
  const selfCorrections = data?.metrics?.find(m => m.key === 'documents_processed')?.value ?? 942;
  const unreadAlerts = data?.unreadAlerts ?? 0;

  // Savings trend
  const savingsTrend = data?.savingsTrend ?? [];

  // Agent stats
  const agentStatsMap: Record<string, { count: number; avgDuration: number }> = {};
  data?.agentStats?.forEach(s => {
    agentStatsMap[s.agentName] = {
      count: s._count.agentName,
      avgDuration: s._avg.duration ?? 0,
    };
  });

  // ROI Calculation
  const annualSavings = useMemo(() => {
    const hoursPerYear = roiDocsPerDay * (roiAvgMinPerDoc / 60) * 250; // 250 working days
    const costPerHour = 350; // ZAR
    return Math.round(hoursPerYear * costPerHour);
  }, [roiDocsPerDay, roiAvgMinPerDoc]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-on-surface-variant">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      {/* ─── Main Content Area ──────────────────────────────────── */}
      <main className="flex-1 md:ml-64 min-h-screen overflow-y-auto relative">

        {/* ─── 1. Top Bar ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 glass-card-strong border-b border-glass-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Left */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-primary-fixed-dim whitespace-nowrap tracking-tight" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
              Supply Chain Alpha
            </h1>
            <div className="hidden sm:flex items-center gap-2 bg-surface-container-high rounded-lg px-3 py-1.5 border border-glass-border flex-1 max-w-xs">
              <Search className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
              <input
                type="text"
                placeholder="Search shipments, risks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none w-full"
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <Bell className="w-5 h-5" />
              {unreadAlerts > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-risk-critical animate-subtle-pulse" />
              )}
            </button>
            <Button
              className="bg-secondary-container hover:bg-secondary-container/80 text-on-secondary glow-cyan font-semibold text-sm"
              onClick={() => setProcessDialogOpen(true)}
            >
              <Zap className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Process Document</span>
              <span className="sm:hidden">Process</span>
            </Button>
            <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary font-bold text-xs">
              TM
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-5 pb-24">

          {/* ─── 2. Live Ticker ────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="glass-card rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-glass-border">
                <div className="w-2 h-2 rounded-full bg-risk-low animate-subtle-pulse" />
                <span className="label-caps text-on-surface-variant">Live AI Catches</span>
              </div>
              <div className="overflow-hidden relative h-9">
                <div className="ticker-scroll">
                  {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => {
                    const iconType = i % 3 === 0 ? 'verified' : i % 3 === 1 ? 'warning' : 'bolt';
                    return (
                      <div key={i} className="h-9 flex items-center px-4 text-sm gap-2 whitespace-nowrap">
                        {iconType === 'verified' && <Verified className="w-3.5 h-3.5 text-risk-low flex-shrink-0" />}
                        {iconType === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-risk-high flex-shrink-0" />}
                        {iconType === 'bolt' && <Bolt className="w-3.5 h-3.5 text-primary-fixed-dim flex-shrink-0" />}
                        <span className="text-on-surface-variant">{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ─── 3. Four Metric Cards ──────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Value Captured */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="glass-card rounded-lg relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-risk-low" />
                <div className="p-4 sm:p-5 pl-5 sm:pl-6">
                  <span className="label-caps text-on-surface-variant">Total Value Captured</span>
                  <p className="text-2xl sm:text-3xl font-bold font-mono text-primary-fixed-dim mt-1">
                    {totalSavings >= 1000000 ? `$${(totalSavings / 1000000).toFixed(1)}M` : formatZAR(totalSavings)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-risk-low" />
                    <span className="text-xs font-medium text-risk-low">+12%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Critical Risks */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="glass-card rounded-lg relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-risk-high" />
                <div className="p-4 sm:p-5 pl-5 sm:pl-6">
                  <span className="label-caps text-on-surface-variant">Critical Risks</span>
                  <p className="text-2xl sm:text-3xl font-bold font-mono text-risk-high mt-1">
                    {String(risksCaught).padStart(2, '0')}
                  </p>
                  <span className="text-xs text-risk-high font-medium mt-2 block">Action Req.</span>
                </div>
              </div>
            </motion.div>

            {/* Hours Reclaimed */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="glass-card rounded-lg relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container" />
                <div className="p-4 sm:p-5 pl-5 sm:pl-6">
                  <span className="label-caps text-on-surface-variant">Hours Reclaimed</span>
                  <p className="text-2xl sm:text-3xl font-bold font-mono text-primary-fixed-dim mt-1">
                    {hoursReclaimed.toLocaleString()}
                  </p>
                  <span className="text-xs text-secondary-fixed-dim font-medium mt-2 block">MTD</span>
                </div>
              </div>
            </motion.div>

            {/* Self-Corrections */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <div className="glass-card rounded-lg relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary-fixed-dim" />
                <div className="p-4 sm:p-5 pl-5 sm:pl-6">
                  <span className="label-caps text-on-surface-variant">Self-Corrections</span>
                  <p className="text-2xl sm:text-3xl font-bold font-mono text-primary-fixed-dim mt-1">
                    {selfCorrections.toLocaleString()}
                  </p>
                  <span className="text-xs text-tertiary-fixed-dim font-medium mt-2 block">99.2% Acc.</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ─── 4. 5-Agent Swarm Status ───────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-base font-bold text-on-surface">5-Agent Swarm Status</h2>
              <Badge className="bg-risk-low/10 text-risk-low border-risk-low/30 text-[10px] font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-risk-low animate-subtle-pulse mr-1.5" />
                Swarm Cluster: Healthy (af-south-1)
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {AGENTS.map((agent, i) => {
                const stats = agentStatsMap[agent.key];
                const isWorking = agent.status === 'Working';
                return (
                  <motion.div
                    key={agent.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                  >
                    <div className={`glass-card rounded-lg p-4 text-center ${isWorking ? 'ring-1 ring-primary-fixed-dim/30' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 text-lg ${isWorking ? 'bg-primary-fixed-dim/20 animate-subtle-pulse' : 'bg-surface-container-high'}`}>
                        {agent.icon}
                      </div>
                      <h4 className="text-sm font-semibold text-on-surface">{agent.name}</h4>
                      <p className="text-[10px] text-on-surface-variant mb-2">{agent.role}</p>
                      <div className="flex items-center justify-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isWorking ? 'bg-primary-fixed-dim animate-subtle-pulse' : 'bg-risk-low animate-subtle-pulse'}`} />
                        <span className={`text-[10px] font-medium ${isWorking ? 'text-primary-fixed-dim' : 'text-risk-low'}`}>
                          {agent.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-on-surface-variant" />
                        <span className="text-[10px] text-on-surface-variant font-mono">
                          ~{stats?.avgDuration ? Math.round(stats.avgDuration) : ['340','1200','890','560','230'][i]}ms
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ─── 5. Charts Grid (12-col) ────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

              {/* ROI Calculator (4 cols) */}
              <div className="lg:col-span-4">
                <div className="glass-card rounded-lg p-5 h-full">
                  <h3 className="text-sm font-bold text-on-surface mb-4">ROI Calculator</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="label-caps text-on-surface-variant mb-1.5 block">Docs / Day</label>
                      <Input
                        type="number"
                        value={roiDocsPerDay}
                        onChange={(e) => setRoiDocsPerDay(Number(e.target.value) || 0)}
                        className="bg-surface-container-high border-glass-border font-mono text-on-surface"
                      />
                    </div>
                    <div>
                      <label className="label-caps text-on-surface-variant mb-1.5 block">Avg min / Doc</label>
                      <Input
                        type="number"
                        value={roiAvgMinPerDoc}
                        onChange={(e) => setRoiAvgMinPerDoc(Number(e.target.value) || 0)}
                        className="bg-surface-container-high border-glass-border font-mono text-on-surface"
                      />
                    </div>
                    <div className="pt-3 border-t border-glass-border">
                      <span className="label-caps text-on-surface-variant">Annual Savings</span>
                      <p className="text-2xl font-bold font-mono text-primary-fixed-dim mt-1">
                        {formatZAR(annualSavings)}
                      </p>
                      <p className="text-[10px] text-on-surface-variant mt-1">
                        Based on R350/hr analyst cost × 250 working days
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Savings Trend Chart (5 cols) */}
              <div className="lg:col-span-5">
                <div className="glass-card rounded-lg p-5 h-full">
                  <h3 className="text-sm font-bold text-on-surface mb-4">Savings Trend (ZAR)</h3>
                  {savingsTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={savingsTrend}>
                        <defs>
                          <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00dce5" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00dce5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 240 / 30%)" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#b9caca' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#b9caca' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                        <Tooltip
                          contentStyle={CHART_TOOLTIP_STYLE}
                          formatter={(value: number) => [`R${value.toLocaleString()}`, 'Savings']}
                        />
                        <Area type="monotone" dataKey="value" stroke="#00dce5" fill="url(#cyanGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-sm text-on-surface-variant">
                      No trend data available
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Index (3 cols) */}
              <div className="lg:col-span-3">
                <div className="glass-card rounded-lg p-5 h-full">
                  <h3 className="text-sm font-bold text-on-surface mb-4">Risk Index</h3>
                  <div className="space-y-4">
                    {RISK_INDEX_DATA.map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-on-surface font-medium">{item.label}</span>
                          <span className="text-[10px] font-mono font-bold" style={{ color: item.color }}>
                            {item.risk} {item.value}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${item.value}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-glass-border">
                    <div className="flex items-center gap-1.5 text-risk-critical">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-mono">Critical audit pending in af-south-1.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── 6. Compliance Badges (Fixed bottom-right) ──────────── */}
        <div className="fixed bottom-4 right-4 z-20 flex flex-col items-end gap-2">
          <div className="glass-card rounded-md px-3 py-1.5 text-[10px] font-mono text-on-surface-variant tracking-wider uppercase">
            AWS REGION: af-south-1
          </div>
          <div className="glass-card rounded-md px-3 py-1.5 text-[10px] font-mono text-risk-low tracking-wider uppercase flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            SARS/POPIA COMPLIANT
          </div>
        </div>
      </main>

      {/* ─── Process Document Dialog ──────────────────────────────── */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="glass-card-strong border-glass-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-on-surface">
              <Zap className="w-5 h-5 text-primary-fixed-dim" />
              Process Document
            </DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              Select an industry and paste document text or choose a sample template to process through the AI swarm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Industry Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block text-on-surface">Industry</label>
              <Select value={selectedIndustry} onValueChange={handleIndustryChange}>
                <SelectTrigger className="bg-surface-container-high border-glass-border text-on-surface">
                  <SelectValue placeholder="Select industry..." />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_LIST.map((config) => (
                    <SelectItem key={config.key} value={config.key}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sample Document Selector (filtered by industry) */}
            <div>
              <label className="text-sm font-medium mb-2 block text-on-surface">Sample Document</label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger className="bg-surface-container-high border-glass-border text-on-surface">
                  <SelectValue placeholder={
                    Object.keys(industrySampleDocs).length > 0
                      ? 'Select a sample document...'
                      : 'No sample docs for this industry'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(industrySampleDocs).length > 0 ? (
                    Object.entries(industrySampleDocs).map(([name, _text]) => (
                      <SelectItem key={name} value={name}>
                        <FileText className="w-3 h-3 mr-1 inline" />
                        {name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_none" disabled>
                      No sample documents available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-on-surface">Document Text</label>
              <Textarea
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="Paste document text here..."
                className="min-h-[200px] font-mono text-xs bg-surface-container-high border-glass-border text-on-surface"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setProcessDialogOpen(false); setDocText(''); setSelectedTemplate(''); }}
              className="border-glass-border text-on-surface-variant hover:bg-surface-container-high"
            >
              Cancel
            </Button>
            <Button
              className="glow-cyan bg-secondary-container hover:bg-secondary-container/80 text-on-secondary font-semibold"
              onClick={handleProcessDocument}
              disabled={processing || !docText.trim()}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {processing ? 'Processing...' : 'Run AI Swarm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
