'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Zap, TrendingUp, Shield, Clock, Activity,
  ChevronRight, Loader2, FileText, Send, CheckCircle2, Circle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, Legend
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
  { key: 'triage_clerk', name: 'Triage Clerk', icon: '📋', role: 'Router', color: '#10b981' },
  { key: 'data_extractor', name: 'Data Extractor', icon: '🔍', role: 'OCR Specialist', color: '#3b82f6' },
  { key: 'auditor', name: 'Auditor', icon: '🛡️', role: 'Validator', color: '#f59e0b' },
  { key: 'risk_analyst', name: 'Risk Analyst', icon: '📊', role: 'Decision Maker', color: '#ef4444' },
  { key: 'dispatcher', name: 'Dispatcher', icon: '📨', role: 'Communicator', color: '#8b5cf6' },
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
  const totalSavings = data?.metrics?.find(m => m.key === 'total_savings_zar')?.value ?? 847000;
  const risksCaught = data?.metrics?.find(m => m.key === 'risks_caught')?.value ?? 89;
  const hoursReclaimed = data?.metrics?.find(m => m.key === 'documents_processed')?.value
    ? Math.round((data.metrics.find(m => m.key === 'documents_processed')!.value / 1247) * 120)
    : 120;
  const unreadAlerts = data?.unreadAlerts ?? 0;

  // Risk distribution for pie chart (fallback)
  const riskData = data?.riskDistribution?.map(r => ({
    name: r.riskLevel.charAt(0).toUpperCase() + r.riskLevel.slice(1),
    value: r._count.riskLevel,
    color: RISK_COLORS[r.riskLevel] || '#6b7280',
  })) ?? [
    { name: 'Low', value: 4, color: '#10b981' },
    { name: 'Medium', value: 2, color: '#f59e0b' },
    { name: 'High', value: 1, color: '#f97316' },
    { name: 'Critical', value: 1, color: '#ef4444' },
  ];

  // Industry risk breakdown for stacked bar chart
  const industryRiskData = data?.industryRiskBreakdown ?? [];

  // Industry coverage
  const industryCoverage = data?.industryCoverage ?? INDUSTRY_LIST.map(config => ({
    key: config.key,
    label: config.label,
    icon: config.icon,
    shipmentCount: 0,
    hasCoverage: false,
  }));

  // Top industry risks
  const topIndustryRisks = data?.topIndustryRisks ?? [];

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

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        {/* Mobile spacer */}
        <div className="h-14 md:hidden" />

        {/* Top Bar */}
        <header className="sticky top-0 z-30 glass-card-strong border-b border-border/30 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold hidden sm:block">{workspaceName}</h1>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px]">
              <Activity className="w-3 h-3 mr-1 animate-subtle-pulse" />
              Live
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold">
                  {unreadAlerts}
                </span>
              )}
            </Button>
            <Button
              className="glow-cyan bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={() => setProcessDialogOpen(true)}
            >
              <Zap className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Process Document</span>
              <span className="sm:hidden">Process</span>
            </Button>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {/* ─── 3 Metric Cards ────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="glass-card border-border/30 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Total Value Captured</span>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-glow-cyan text-primary">
                    R{totalSavings.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-500 font-medium">+23% this month</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="glass-card border-border/30 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Critical Risks Prevented</span>
                    <div className="p-1.5 rounded-lg bg-amber-500/10">
                      <Shield className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-glow-cyan text-primary">{risksCaught}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Shield className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-amber-500 font-medium">12 critical this week</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="glass-card border-border/30 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Human Hours Reclaimed</span>
                    <div className="p-1.5 rounded-lg bg-cyan-500/10">
                      <Clock className="w-4 h-4 text-cyan-500" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-glow-cyan text-primary">{hoursReclaimed}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-3 h-3 text-cyan-500" />
                    <span className="text-xs text-cyan-500 font-medium">~15 min per document saved</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* ─── Industry Coverage Card ────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="glass-card border-border/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Industry Coverage</span>
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                      {industryCoverage.filter(i => i.hasCoverage).length}/{industryCoverage.length} active
                    </Badge>
                  </div>
                </div>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-3 pb-2">
                    {industryCoverage.map((item) => (
                      <div
                        key={item.key}
                        className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          item.hasCoverage
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-border/20 bg-muted/5'
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {item.shipmentCount} shipment{item.shipmentCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {item.hasCoverage ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Live Ticker Feed ───────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card border-border/30 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-subtle-pulse" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Live AI Catches — Multi-Industry</span>
                </div>
                <div className="h-16 overflow-hidden relative">
                  <div className="ticker-scroll">
                    {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                      <div key={i} className="h-8 flex items-center px-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Activity className="w-3 h-3 mr-2 text-primary/50" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── 5-Agent Swarm Status ───────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">5-Agent Swarm Status</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-subtle-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {AGENTS.map((agent, i) => {
                const stats = agentStatsMap[agent.key];
                return (
                  <motion.div
                    key={agent.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                  >
                    <Card className="glass-card border-border/30 hover:border-primary/20 transition-colors">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{agent.icon}</div>
                        <h4 className="text-sm font-semibold">{agent.name}</h4>
                        <p className="text-[10px] text-muted-foreground mb-2">{agent.role}</p>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            ~{stats?.avgDuration ? Math.round(stats.avgDuration) : ['340','1200','890','560','230'][i]}ms
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-subtle-pulse" />
                          <span className="text-[10px] text-emerald-500 font-medium">Online</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ─── Charts Row ─────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Savings Trend */}
              <Card className="glass-card border-border/30">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-4">Savings Trend (ZAR)</h3>
                  {savingsTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={savingsTrend}>
                        <defs>
                          <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 240 / 30%)" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'oklch(0.6 0.01 240)' }} />
                        <YAxis tick={{ fontSize: 12, fill: 'oklch(0.6 0.01 240)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                        <Tooltip
                          contentStyle={CHART_TOOLTIP_STYLE}
                          formatter={(value: number) => [`R${value.toLocaleString()}`, 'Savings']}
                        />
                        <Area type="monotone" dataKey="value" stroke="#00e5ff" fill="url(#cyanGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                      No trend data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Industry Risk Breakdown - Stacked Bar Chart */}
              <Card className="glass-card border-border/30">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-4">Risk Breakdown by Industry</h3>
                  {industryRiskData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={industryRiskData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.02 240 / 30%)" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: 'oklch(0.6 0.01 240)' }} allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="label"
                          tick={{ fontSize: 10, fill: 'oklch(0.6 0.01 240)' }}
                          width={110}
                        />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="critical" stackId="risk" fill="#ef4444" name="Critical" />
                        <Bar dataKey="high" stackId="risk" fill="#f97316" name="High" />
                        <Bar dataKey="medium" stackId="risk" fill="#f59e0b" name="Medium" />
                        <Bar dataKey="low" stackId="risk" fill="#10b981" name="Low" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                      No industry risk data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          {/* ─── Top Industry Risks ────────────────────────────────────── */}
          {topIndustryRisks.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
              <Card className="glass-card border-border/30">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-4">Top Risks by Industry</h3>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                    {topIndustryRisks.map((risk, i) => (
                      <div
                        key={`${risk.industry}-${i}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-background/30 border border-border/10 hover:border-border/30 transition-colors"
                      >
                        <span className="text-lg flex-shrink-0">{risk.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{risk.reference}</span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 ${
                                risk.riskLevel === 'critical'
                                  ? 'border-red-500/30 text-red-400 bg-red-500/5'
                                  : risk.riskLevel === 'high'
                                    ? 'border-orange-500/30 text-orange-400 bg-orange-500/5'
                                    : 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                              }`}
                            >
                              {risk.riskLevel.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {risk.title} — {risk.label}
                          </p>
                        </div>
                        {risk.estimatedValue ? (
                          <span className="text-xs font-medium text-destructive flex-shrink-0">
                            {formatZAR(risk.estimatedValue)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      {/* ─── Process Document Dialog ──────────────────────────────── */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="glass-card-strong border-border/30 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Process Document
            </DialogTitle>
            <DialogDescription>
              Select an industry and paste document text or choose a sample template to process through the AI swarm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Industry Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Industry</label>
              <Select value={selectedIndustry} onValueChange={handleIndustryChange}>
                <SelectTrigger>
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
              <label className="text-sm font-medium mb-2 block">Sample Document</label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
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
              <label className="text-sm font-medium mb-2 block">Document Text</label>
              <Textarea
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="Paste document text here..."
                className="min-h-[200px] font-mono text-xs bg-background/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setProcessDialogOpen(false); setDocText(''); setSelectedTemplate(''); }}>
              Cancel
            </Button>
            <Button
              className="glow-cyan bg-primary hover:bg-primary/90 text-primary-foreground"
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
