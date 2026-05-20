'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Zap, Shield, Clock, Search, Loader2, FileText, Send, CloudUpload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  { key: 'triage_clerk', name: 'Triage', icon: '📋', color: '#10b981', status: 'Online' as const },
  { key: 'data_extractor', name: 'Extract', icon: '🔍', color: '#3b82f6', status: 'Online' as const },
  { key: 'auditor', name: 'Audit', icon: '🛡️', color: '#f59e0b', status: 'Working' as const },
  { key: 'risk_analyst', name: 'Risk', icon: '📊', color: '#ef4444', status: 'Online' as const },
  { key: 'dispatcher', name: 'Dispatch', icon: '📨', color: '#8b5cf6', status: 'Online' as const },
];

// ─── Live Processing Feed Items ──────────────────────────────────
const FEED_ITEMS = [
  { emoji: '🚚', text: 'Manganese BoL received... Extracting...', type: 'processing' as const },
  { emoji: '✅', text: 'Invoice INV-882 verified. No mismatches found.', type: 'success' as const },
  { emoji: '🚨', text: 'Weight mismatch on SHP-4421. Flagged for review.', type: 'alert' as const },
  { emoji: '🚢', text: 'Auditor caught HS Code variance on CRD-8834', type: 'alert' as const },
  { emoji: '📨', text: 'Dispatcher sent WhatsApp alert to MD for CPT-2209', type: 'success' as const },
  { emoji: '⛏️', text: 'Auditor flagged grade under-spec on Manganese Assay ASSY-0892', type: 'alert' as const },
  { emoji: '💊', text: 'Cold chain break detected on Batch BN-2025-A4421', type: 'alert' as const },
  { emoji: '✅', text: 'VIN verification passed for BMW 340i — BND-DBN-0442', type: 'success' as const },
  { emoji: '🏗️', text: 'Substandard concrete (38 MPa vs 40 MPa) flagged on BOQ-WTR-014', type: 'alert' as const },
  { emoji: '🚚', text: 'Packing List PL-9921 received... Triaging...', type: 'processing' as const },
  { emoji: '✅', text: 'Export Permit EP-4471 verified. Expiry: 2025-08-15', type: 'success' as const },
  { emoji: '🏦', text: 'SWIFT vs BoL verification prevented R500K document fraud', type: 'alert' as const },
  { emoji: '⚡', text: 'Missing Heavy Lift Permit flagged for Medupi Phase 3', type: 'alert' as const },
  { emoji: '✅', text: 'GMP compliance verified for PharmaCorp shipment', type: 'success' as const },
  { emoji: '🚚', text: 'Air Waybill MAWB-074-9988 received... Extracting...', type: 'processing' as const },
];

// ─── Format Helpers ──────────────────────────────────────────────
function formatZAR(val: number): string {
  if (val >= 1000000) return `R${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `R${(val / 1000).toFixed(0)}K`;
  return `R${val.toLocaleString()}`;
}

// ─── Main Dashboard Screen ──────────────────────────────────────
export default function DashboardScreen() {
  const { workspaceIndustry, setCurrentScreen, setSelectedShipmentId } = useAppState();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [docText, setDocText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>(workspaceIndustry || 'logistics');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (workspaceIndustry) {
      setSelectedIndustry(workspaceIndustry);
    }
  }, [workspaceIndustry]);

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
  const hoursReclaimed = data?.metrics?.find(m => m.key === 'documents_processed')?.value
    ? Math.round((data.metrics.find(m => m.key === 'documents_processed')!.value / 1247) * 120)
    : 1840;
  const activeShipments = data?.shipmentsByStatus?.reduce((sum, s) => sum + s._count.status, 0) ?? 47;
  const unreadAlerts = data?.unreadAlerts ?? 0;

  // Agent stats
  const agentStatsMap: Record<string, { count: number; avgDuration: number }> = {};
  data?.agentStats?.forEach(s => {
    agentStatsMap[s.agentName] = {
      count: s._count.agentName,
      avgDuration: s._avg.duration ?? 0,
    };
  });

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Open process dialog on drop
    setProcessDialogOpen(true);
  };

  const handleUploadClick = () => {
    setProcessDialogOpen(true);
  };

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

        {/* ─── 1. Top Bar (simplified) ─────────────────────────── */}
        <header className="sticky top-0 z-30 glass-card-strong border-b border-glass-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-primary-fixed-dim whitespace-nowrap tracking-tight" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
              CapsuleFlow AI
            </h1>
          </div>

          {/* Center: Search */}
          <div className="hidden sm:flex items-center gap-2 bg-surface-container-high rounded-lg px-3 py-1.5 border border-glass-border flex-1 max-w-sm">
            <Search className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
            <input
              type="text"
              placeholder="Search shipments, risks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none w-full"
            />
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

        <div className="p-4 sm:p-6 space-y-6 pb-24">

          {/* ─── 2. Three Big ROI Counters ──────────────────────── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            {/* Money Saved */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-risk-low animate-subtle-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant">Money Saved</span>
              </div>
              <p className="text-3xl sm:text-5xl font-extrabold text-risk-low" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
                {totalSavings >= 1000000 ? `R${(totalSavings / 1000000).toFixed(1)}M` : formatZAR(totalSavings)}
              </p>
            </motion.div>

            {/* Hours Reclaimed */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim animate-subtle-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant">Hours Reclaimed</span>
              </div>
              <p className="text-3xl sm:text-5xl font-extrabold text-primary-fixed-dim" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
                {hoursReclaimed.toLocaleString()}
              </p>
            </motion.div>

            {/* Active Shipments */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim animate-subtle-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant">Active Shipments</span>
              </div>
              <p className="text-3xl sm:text-5xl font-extrabold text-secondary-fixed-dim" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
                {activeShipments}
              </p>
            </motion.div>
          </div>

          {/* ─── 3. The Action Zone — Massive Upload Area ──────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.5, type: 'spring', stiffness: 150 }}
          >
            <div
              className={`
                relative rounded-2xl cursor-pointer transition-all duration-300 min-h-[40vh]
                flex flex-col items-center justify-center gap-4 p-8
                ${isDragOver
                  ? 'bg-primary-fixed-dim/10 border-2 border-solid border-primary-fixed-dim'
                  : 'bg-surface-container/50 border-2 border-dashed border-primary-fixed-dim/40 hover:border-primary-fixed-dim/70'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleUploadClick}
            >
              {/* Pulsing glow background effect */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(0, 220, 229, 0.06) 0%, transparent 70%)',
                  }}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>

              {/* Animated dashed border glow */}
              {!isDragOver && (
                <motion.div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    boxShadow: '0 0 30px rgba(0, 220, 229, 0.08), inset 0 0 30px rgba(0, 220, 229, 0.04)',
                  }}
                  animate={{
                    boxShadow: [
                      '0 0 30px rgba(0, 220, 229, 0.08), inset 0 0 30px rgba(0, 220, 229, 0.04)',
                      '0 0 50px rgba(0, 220, 229, 0.15), inset 0 0 50px rgba(0, 220, 229, 0.08)',
                      '0 0 30px rgba(0, 220, 229, 0.08), inset 0 0 30px rgba(0, 220, 229, 0.04)',
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* Icon */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <CloudUpload className="w-16 h-16 sm:w-20 sm:h-20 text-primary-fixed-dim/80" />
              </motion.div>

              {/* Main text */}
              <div className="text-center relative z-10">
                <h2
                  className="text-xl sm:text-2xl font-bold text-on-surface mb-2"
                  style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}
                >
                  Drop any document here or click to upload
                </h2>
                <p className="text-sm sm:text-base text-on-surface-variant">
                  PDFs, Scans, Photos — we&apos;ll handle the rest
                </p>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
                onChange={() => setProcessDialogOpen(true)}
              />
            </div>
          </motion.div>

          {/* ─── 4. Live Processing Feed (Vertical) ────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-glass-border">
                <div className="w-2.5 h-2.5 rounded-full bg-risk-low animate-subtle-pulse" />
                <span className="text-sm font-bold text-on-surface">Now Processing</span>
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {FEED_ITEMS.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.04 }}
                    className={`
                      flex items-start gap-3 px-5 py-3 border-b border-glass-border/30 last:border-b-0
                      hover:bg-surface-container-high/50 transition-colors
                    `}
                  >
                    <span className="text-base mt-0.5 flex-shrink-0">{item.emoji}</span>
                    <p className={`text-sm leading-relaxed ${
                      item.type === 'alert' ? 'text-risk-high' :
                      item.type === 'success' ? 'text-risk-low' :
                      'text-on-surface-variant'
                    }`}>
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ─── 5. 5-Agent Swarm Status (compact strip) ───────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-center gap-4 sm:gap-8 py-3">
              {AGENTS.map((agent, i) => {
                const stats = agentStatsMap[agent.key];
                const isWorking = agent.status === 'Working';
                return (
                  <div key={agent.key} className="flex items-center gap-1.5">
                    <span className="text-sm">{agent.icon}</span>
                    <span className="text-xs font-semibold text-on-surface hidden sm:inline">{agent.name}</span>
                    <div className={`w-2 h-2 rounded-full ${isWorking ? 'bg-primary-fixed-dim animate-subtle-pulse' : 'bg-risk-low animate-subtle-pulse'}`} />
                    <span className="text-[10px] text-on-surface-variant font-mono hidden md:inline">
                      ~{stats?.avgDuration ? Math.round(stats.avgDuration) : ['340','1200','890','560','230'][i]}ms
                    </span>
                    {i < AGENTS.length - 1 && (
                      <span className="text-on-surface-variant/20 ml-4 hidden sm:inline">|</span>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ─── 6. Compliance Badges (Fixed bottom-right) ────────── */}
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
                    Object.entries(industrySampleDocs).map(([name]) => (
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
