'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Zap, TrendingUp, Shield, Clock, Activity,
  ChevronRight, Loader2, FileText, Send
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
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
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────
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
}

// ─── Agent Definitions ───────────────────────────────────────────
const AGENTS = [
  { key: 'triage_clerk', name: 'Triage Clerk', icon: '📋', role: 'Router', color: '#10b981' },
  { key: 'data_extractor', name: 'Data Extractor', icon: '🔍', role: 'OCR Specialist', color: '#3b82f6' },
  { key: 'auditor', name: 'Auditor', icon: '🛡️', role: 'Validator', color: '#f59e0b' },
  { key: 'risk_analyst', name: 'Risk Analyst', icon: '📊', role: 'Decision Maker', color: '#ef4444' },
  { key: 'dispatcher', name: 'Dispatcher', icon: '📨', role: 'Communicator', color: '#8b5cf6' },
];

// ─── Ticker Items ────────────────────────────────────────────────
const TICKER_ITEMS = [
  'Auditor Agent caught Weight Mismatch on Shipment JHB-4421',
  'Risk Analyst flagged HS Code variance on CRD-8834',
  'Triage Clerk processed 12 invoices in 3.2 seconds',
  'Data Extractor achieved 99.4% OCR accuracy on Mining Permits',
  'Dispatcher sent WhatsApp alert to MD for CPT-2209',
  'Auditor Agent detected bank account mismatch on INV-7732',
  'Risk Analyst prevented R45,000 demurrage on DBN-5567',
  'Triage Clerk auto-routed 8 Bol documents to extraction',
  'Data Extractor flagged missing API Gravity on Oil BoL-9012',
  'Auditor Agent verified SARS tariff codes for Manganese export',
];

// ─── Sample Document Templates ───────────────────────────────────
const SAMPLE_DOCUMENTS: Record<string, string> = {
  '': '',
  'Logistics Invoice': `COMMERCIAL INVOICE
Invoice No: INV-2025-0042
Date: 2025-01-15
Shipper: AEP Mining (Pty) Ltd, Hotazel, Northern Cape
Consignee: Sinosteel Corporation, Beijing, China
Commodity: Manganese Ore
HS Code: 2602.00
Total Weight: 28,500 KG
Total Amount: R4,280,000.00
Bank Account: Standard Bank, Acc: 0123456789`,

  'Mining Permit': `ENVIRONMENTAL COMPLIANCE PERMIT
Permit No: DMR-2025-LIM-0312
Issued By: Department of Mineral Resources
Holder: Mokopane Platinum Mine
Location: Limpopo Province
Commodity: Platinum Group Metals
Expiry Date: 2025-02-28
Status: RENEWAL REQUIRED - 14 days remaining
Conditions: Annual environmental audit compliance required`,

  'Crude Oil BoL': `BILL OF LADING - CRUDE OIL
BoL No: OIL-BOL-2025-0891
Vessel: MT AFRICAN SPIRIT
Port of Loading: Lagos, Nigeria
Port of Discharge: Cape Town, Western Cape
Cargo: Bonny Light Crude Oil
API Gravity: 35.2
Sulfur Content: 0.15%
Quantity: 45,000 MT
Shipper: NNPC Limited
Consignee: AEP Energy (Pty) Ltd`,
};

// ─── Risk Pie Colors ─────────────────────────────────────────────
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

// ─── Main Dashboard Screen ──────────────────────────────────────
export default function DashboardScreen() {
  const { workspaceName } = useAppState();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [docText, setDocText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
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
        body: JSON.stringify({ documentText: docText }),
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
    setDocText(SAMPLE_DOCUMENTS[template] || '');
  };

  // Extract metrics with defaults
  const totalSavings = data?.metrics?.find(m => m.key === 'total_savings_zar')?.value ?? 847000;
  const risksCaught = data?.metrics?.find(m => m.key === 'risks_caught')?.value ?? 89;
  const hoursReclaimed = data?.metrics?.find(m => m.key === 'documents_processed')?.value
    ? Math.round((data.metrics.find(m => m.key === 'documents_processed')!.value / 1247) * 120)
    : 120;
  const unreadAlerts = data?.unreadAlerts ?? 0;

  // Risk distribution for pie chart
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

          {/* ─── Live Ticker Feed ───────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="glass-card border-border/30 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-subtle-pulse" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Live AI Catches</span>
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
                          contentStyle={{
                            background: 'oklch(0.12 0.02 240 / 90%)',
                            border: '1px solid oklch(0.3 0.03 240 / 40%)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
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

              {/* Risk Distribution */}
              <Card className="glass-card border-border/30">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-4">Risk Distribution</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'oklch(0.12 0.02 240 / 90%)',
                          border: '1px solid oklch(0.3 0.03 240 / 40%)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex items-center justify-center gap-4 mt-2">
                    {riskData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[11px] text-muted-foreground">{entry.name} ({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
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
              Paste document text or select a sample template to process through the AI swarm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Sample Document</label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sample document..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="logistics">Logistics Invoice</SelectItem>
                  <SelectItem value="mining">Mining Permit</SelectItem>
                  <SelectItem value="oil">Crude Oil BoL</SelectItem>
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
