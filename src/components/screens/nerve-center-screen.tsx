'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Mail, Users, Copy, Check, Loader2,
  QrCode, Phone, UserPlus, Activity, Wifi, WifiOff,
  Search, Bell, FileText, MoreVertical, Zap, ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import AppSidebar from '@/components/shared/app-sidebar';
import { useAppState } from '@/lib/app-state';
import { toast } from 'sonner';

// ─── QR Code Simulator ────────────────────────────────────────────
function SimulatedQRCode({ connected }: { connected: boolean }) {
  const pattern = useMemo(() => {
    const size = 21;
    const cells: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < size; c++) {
        const inTL = r < 7 && c < 7;
        const inTR = r < 7 && c >= size - 7;
        const inBL = r >= size - 7 && c < 7;

        if (inTL || inTR || inBL) {
          const lr = inTL ? r : inTR ? r : r - (size - 7);
          const lc = inTL ? c : inTR ? c - (size - 7) : c;
          if (lr === 0 || lr === 6 || lc === 0 || lc === 6) row.push(true);
          else if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) row.push(true);
          else row.push(false);
        } else {
          const seed = r * 31 + c * 17 + 42;
          row.push((seed * 2654435761) % 4 !== 0);
        }
      }
      cells.push(row);
    }
    return cells;
  }, []);

  return (
    <div className={`relative p-3 rounded-xl border-2 transition-all duration-500 ${
      connected
        ? 'border-emerald-500/40 bg-emerald-500/5'
        : 'border-glass-border bg-surface-container/50'
    }`}>
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(21, 1fr)` }}>
        {pattern.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-[6px] h-[6px] sm:w-[7px] sm:h-[7px] rounded-[1px] transition-colors duration-300 ${
                connected
                  ? cell ? 'bg-emerald-500/80' : 'bg-emerald-500/10'
                  : cell ? 'bg-foreground/70' : 'bg-transparent'
              }`}
            />
          ))
        )}
      </div>
      {connected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 rounded-xl backdrop-blur-[2px]"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <Check className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-400">Connected</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Team Member Type ──────────────────────────────────────────────
interface TeamMember {
  name: string;
  role: string;
  initials: string;
  color: string;
}

const INITIAL_TEAM: TeamMember[] = [
  { name: 'Nomsa D.', role: 'Finance', initials: 'ND', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { name: 'Sipho K.', role: 'Operations', initials: 'SK', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
];

// ─── Activity Log Data ─────────────────────────────────────────────
const ACTIVITY_LOG = [
  { icon: '📩', text: 'Investigation Started: Commercial Invoice detected from GlobalTrade Ltd.', time: '2 min ago' },
  { icon: '📤', text: 'Auto-forwarded Payment Pack to Finance for SHP-2025-0039', time: '8 min ago' },
  { icon: '🚨', text: 'WhatsApp Alert sent to Manager for SHP-2025-0042', time: '15 min ago' },
  { icon: '✅', text: 'Email Bcc received from shipments@aep-energy.com', time: '23 min ago' },
  { icon: '📩', text: 'Investigation Started: Bill of Lading detected from Sinosteel Corp.', time: '31 min ago' },
  { icon: '📤', text: 'Auto-forwarded Payment Pack to Finance for SHP-2025-0036', time: '45 min ago' },
  { icon: '🚨', text: 'WhatsApp Alert sent to CEO for SHP-2025-0033 - Critical Risk', time: '1 hr ago' },
  { icon: '✅', text: 'Email Bcc received from logistics@globaltrade.com', time: '1.5 hr ago' },
];

// ─── AI Provider Data ──────────────────────────────────────────────
const AI_PROVIDERS = [
  {
    name: 'OpenAI GPT-4o',
    shortName: 'GPT-4o',
    status: '99.9% UP',
    statusColor: 'text-risk-low',
    latency: '240ms',
    riskLevel: 'risk-low' as const,
    isPrimary: true,
  },
  {
    name: 'Groq',
    shortName: 'Groq',
    status: '99.8% UP',
    statusColor: 'text-risk-low',
    latency: '315ms',
    riskLevel: 'risk-low' as const,
    isPrimary: false,
  },
  {
    name: 'OpenRouter',
    shortName: 'OpenRouter',
    status: 'DEGRADED',
    statusColor: 'text-risk-medium',
    latency: '1.2s',
    riskLevel: 'risk-medium' as const,
    isPrimary: false,
  },
];

// ─── Stagger Animation Variants ────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// ─── Main Component ───────────────────────────────────────────────
export default function NerveCenterScreen() {
  const { whatsappConnected, setWhatsappConnected, emailConnected, setEmailConnected, workspaceName } = useAppState();

  // WhatsApp state
  const [whatsappConnecting, setWhatsappConnecting] = useState(false);

  // Email IMAP state
  const [imapHost, setImapHost] = useState('imap.gmail.com');
  const [imapPort, setImapPort] = useState('993');
  const [imapEmail, setImapEmail] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [emailConnecting, setEmailConnecting] = useState(false);

  // BCC copy state
  const [bccCopied, setBccCopied] = useState(false);

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  // ─── Handlers ──────────────────────────────────────────────────
  const handleConnectWhatsApp = () => {
    if (whatsappConnected) return;
    setWhatsappConnecting(true);
    setTimeout(() => {
      setWhatsappConnected(true);
      setWhatsappConnecting(false);
      toast.success('WhatsApp connected!', { description: '+27 83 XXX XXXX is now your document ingestion line.' });
    }, 2000);
  };

  const handleWatchInbox = () => {
    if (!imapEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setEmailConnecting(true);
    setTimeout(() => {
      setEmailConnected(true);
      setEmailConnecting(false);
      toast.success('Email inbox connected!', { description: `Watching ${imapEmail}` });
    }, 1500);
  };

  const handleCopyBcc = async () => {
    try {
      await navigator.clipboard.writeText('aep-investigate@capsuleflow.ai');
      setBccCopied(true);
      toast.success('BCC address copied!');
      setTimeout(() => setBccCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleAddMember = () => {
    if (!newMemberEmail.trim() || !newMemberRole) {
      toast.error('Please enter email and select a role');
      return;
    }

    const name = newMemberEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const roleColors: Record<string, string> = {
      CEO: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      Operations: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      Finance: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };

    setTeamMembers(prev => [
      ...prev,
      { name, role: newMemberRole, initials, color: roleColors[newMemberRole] || 'bg-muted text-muted-foreground border-border' },
    ]);
    setNewMemberEmail('');
    setNewMemberRole('');
    toast.success('Team member added!', { description: `${name} (${newMemberRole})` });
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen overflow-y-auto relative">
        {/* Mobile spacer */}
        <div className="h-14 md:hidden" />

        {/* ═══════════════════════════════════════════════════════════
            TOP BAR - Sticky header
        ═══════════════════════════════════════════════════════════ */}
        <header className="sticky top-0 z-30 glass-card-strong border-b border-glass-border px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold text-primary-fixed-dim tracking-tight whitespace-nowrap" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
                Nerve Center
              </h1>
              <div className="hidden sm:flex items-center gap-2 flex-1 max-w-xs">
                <Search className="w-4 h-4 text-on-surface-variant shrink-0" />
                <input
                  type="text"
                  placeholder="Search channels..."
                  className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button className="relative p-2 rounded-lg hover:bg-surface-container-high transition-colors">
                <Bell className="w-5 h-5 text-on-surface-variant" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-risk-critical rounded-full" />
              </button>
              <Button className="bg-primary-fixed-dim text-on-primary font-semibold text-sm hover:bg-primary-fixed-dim/90">
                <FileText className="w-4 h-4 mr-2" />
                Process Document
              </Button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6 pb-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* ═══════════════════════════════════════════════════════════
                SECTION A: AI Gateway Control
            ═══════════════════════════════════════════════════════════ */}
            <motion.div variants={cardVariants}>
              <div className="glass-card rounded-xl overflow-hidden">
                {/* Section Header */}
                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-extrabold text-primary-fixed-dim tracking-tight" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
                    AI Gateway Control
                  </h2>
                  <Badge className="bg-risk-low/15 text-risk-low border-risk-low/30 gap-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-low" />
                    </span>
                    Gateway System: NOMINAL
                  </Badge>
                </div>

                {/* Gateway Grid */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                  {/* Left: Routing Logic (4 cols) */}
                  <div className="lg:col-span-4 glass-card rounded-xl p-4 sm:p-5">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-4">
                      Routing Logic
                    </p>
                    <div className="space-y-0">
                      {/* PRIMARY PATH */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-fixed-dim/20 border border-primary-fixed-dim/30 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-primary-fixed-dim" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-mono text-primary-fixed-dim/60 uppercase tracking-wider">PRIMARY PATH</p>
                          <p className="text-sm font-semibold text-primary-fixed-dim">OpenAI GPT-4o</p>
                        </div>
                      </div>
                      {/* Connector line */}
                      <div className="ml-4 w-px h-6 bg-primary-fixed-dim/20 vertical-line-pulse" />
                      {/* FAILOVER 01 */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-glass-border flex items-center justify-center">
                          <Zap className="w-4 h-4 text-on-surface-variant" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-mono text-on-surface-variant/50 uppercase tracking-wider">FAILOVER 01</p>
                          <p className="text-sm font-medium text-on-surface">Groq</p>
                        </div>
                      </div>
                      {/* Connector line */}
                      <div className="ml-4 w-px h-6 bg-glass-border vertical-line-pulse" />
                      {/* FAILOVER 02 */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-glass-border flex items-center justify-center">
                          <Zap className="w-4 h-4 text-on-surface-variant" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-mono text-on-surface-variant/50 uppercase tracking-wider">FAILOVER 02</p>
                          <p className="text-sm font-medium text-on-surface">OpenRouter</p>
                        </div>
                      </div>
                    </div>
                    <button className="mt-4 flex items-center gap-1.5 text-xs font-mono text-primary-fixed-dim/70 hover:text-primary-fixed-dim uppercase tracking-wider transition-colors">
                      <ChevronRight className="w-3 h-3" />
                      Reconfigure Routing
                    </button>
                  </div>

                  {/* Right: Provider Grid (8 cols) */}
                  <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {AI_PROVIDERS.map((provider) => (
                      <div
                        key={provider.shortName}
                        className={`glass-card rounded-xl p-4 border-l-2 transition-all duration-300 hover:shadow-[0_0_24px_rgba(0,220,229,0.15)] cursor-default ${
                          provider.riskLevel === 'risk-low'
                            ? 'border-l-risk-low'
                            : provider.riskLevel === 'risk-medium'
                            ? 'border-l-risk-medium'
                            : 'border-l-risk-critical'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-bold text-on-surface">{provider.shortName}</p>
                          <Badge className={`text-[10px] font-mono ${
                            provider.riskLevel === 'risk-low'
                              ? 'bg-risk-low/10 text-risk-low border-risk-low/20'
                              : 'bg-risk-medium/10 text-risk-medium border-risk-medium/20'
                          }`}>
                            {provider.status}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/50">Avg Latency</p>
                          <p className={`text-lg font-bold font-mono ${
                            provider.riskLevel === 'risk-low' ? 'text-on-surface' : 'text-risk-medium'
                          }`}>
                            {provider.latency}
                          </p>
                        </div>
                        {provider.isPrimary && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed-dim animate-subtle-pulse" />
                            <span className="text-[10px] font-mono text-primary-fixed-dim uppercase tracking-wider">Active Route</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════
                SECTION B+C: WhatsApp & Team (Grid 12-col)
            ═══════════════════════════════════════════════════════════ */}
            <motion.div variants={cardVariants}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                {/* Left 5 cols: WhatsApp Channel */}
                <div className="lg:col-span-5 glass-card rounded-xl p-5 sm:p-6 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <MessageSquare className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-base font-bold text-on-surface" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
                      WhatsApp Channel
                    </h3>
                  </div>

                  {/* QR Code Area */}
                  <div className="flex flex-col items-center gap-4 mb-5">
                    <SimulatedQRCode connected={whatsappConnected} />
                    <p className="text-[10px] text-on-surface-variant text-center max-w-[180px]">
                      {whatsappConnected ? 'Scan complete — channel active' : 'Scan with WhatsApp Business to connect'}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {whatsappConnected ? (
                        <>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-risk-low" />
                          </span>
                          <span className="text-sm font-semibold text-risk-low">CONNECTED</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full bg-on-surface-variant/40" />
                          <span className="text-sm text-on-surface-variant">NOT CONNECTED</span>
                        </>
                      )}
                    </div>

                    {whatsappConnected && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-on-surface-variant" />
                          <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/50">Linked Number</span>
                        </div>
                        <p className="font-mono text-sm text-primary-fixed-dim pl-5.5">+27 82 455 0092</p>
                      </motion.div>
                    )}

                    <Button
                      className="w-full bg-primary-fixed-dim text-on-primary font-semibold hover:bg-primary-fixed-dim/90 mt-2"
                      onClick={handleConnectWhatsApp}
                      disabled={whatsappConnecting || whatsappConnected}
                    >
                      {whatsappConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Scanning...
                        </>
                      ) : whatsappConnected ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Connected
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4 mr-2" />
                          Connect WhatsApp
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Decorative pulse line at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent pulse-line" />
                  </div>
                </div>

                {/* Right 7 cols: Team & Permissions */}
                <div className="lg:col-span-7 glass-card rounded-xl p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary-fixed-dim/10 border border-secondary-fixed-dim/20">
                        <Users className="w-5 h-5 text-secondary-fixed-dim" />
                      </div>
                      <h3 className="text-base font-bold text-on-surface" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
                        Team & Permissions
                      </h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-secondary-fixed-dim/30 bg-secondary-fixed-dim/10 text-secondary-fixed-dim hover:bg-secondary-fixed-dim/20 font-mono text-[11px] uppercase tracking-wider"
                      onClick={() => {
                        const emailInput = document.getElementById('team-email-input');
                        emailInput?.focus();
                      }}
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                      Invite
                    </Button>
                  </div>

                  {/* Team Table */}
                  <div className="overflow-x-auto -mx-5 sm:-mx-6">
                    <table className="w-full text-left zebra-table">
                      <thead>
                        <tr className="border-b border-glass-border">
                          <th className="px-5 sm:px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/50">Member</th>
                          <th className="px-3 py-2.5 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/50">Role</th>
                          <th className="px-3 py-2.5 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/50 hidden sm:table-cell">Last Active</th>
                          <th className="px-3 py-2.5 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/50 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamMembers.map((member, i) => (
                          <motion.tr
                            key={member.name}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="border-b border-glass-border/50 hover:bg-surface-container/30 transition-colors"
                          >
                            <td className="px-5 sm:px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${member.color}`}>
                                  {member.initials}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-on-surface truncate">{member.name}</p>
                                  <p className="text-[11px] text-on-surface-variant truncate">{member.name.toLowerCase().replace(' ', '.')}@aep-energy.com</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <Badge className={`text-[10px] font-mono ${
                                member.role === 'Finance'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : member.role === 'Operations'
                                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {member.role}
                              </Badge>
                            </td>
                            <td className="px-3 py-3 hidden sm:table-cell">
                              <span className="font-mono text-xs text-on-surface-variant">
                                {i === 0 ? '3 min ago' : '22 min ago'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <button className="p-1 rounded hover:bg-surface-container-high transition-colors">
                                <MoreVertical className="w-4 h-4 text-on-surface-variant" />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Member Form */}
                  <div className="mt-4 pt-4 border-t border-glass-border">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Input
                          id="team-email-input"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="colleague@company.com"
                          type="email"
                          className="bg-surface-container/50 text-sm border-glass-border"
                        />
                      </div>
                      <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                        <SelectTrigger className="w-full sm:w-[140px] bg-surface-container/50 text-sm border-glass-border">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CEO">CEO</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        className="bg-primary-fixed-dim text-on-primary font-semibold hover:bg-primary-fixed-dim/90"
                        onClick={handleAddMember}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════
                SECTION D: Email Connection (IMAP / BCC)
            ═══════════════════════════════════════════════════════════ */}
            <motion.div variants={cardVariants}>
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <Mail className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-on-surface" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
                        Email Ingestion
                      </h3>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">IMAP / Bcc Channel</p>
                    </div>
                  </div>
                  {emailConnected ? (
                    <Badge className="bg-risk-low/10 text-risk-low border-risk-low/20 gap-1.5 text-xs font-mono">
                      <Wifi className="w-3 h-3" />
                      CONNECTED
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-on-surface-variant/20 text-on-surface-variant gap-1.5 text-xs">
                      <WifiOff className="w-3 h-3" />
                      OFFLINE
                    </Badge>
                  )}
                </div>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                  <Tabs defaultValue="imap" className="w-full">
                    <TabsList className="bg-surface-container/50 border border-glass-border">
                      <TabsTrigger value="imap" className="gap-1.5 text-xs data-[state=active]:bg-primary-fixed-dim/10 data-[state=active]:text-primary-fixed-dim">
                        <Mail className="w-3.5 h-3.5" />
                        Direct IMAP
                      </TabsTrigger>
                      <TabsTrigger value="bcc" className="gap-1.5 text-xs data-[state=active]:bg-primary-fixed-dim/10 data-[state=active]:text-primary-fixed-dim">
                        <Copy className="w-3.5 h-3.5" />
                        The Bcc Address
                      </TabsTrigger>
                    </TabsList>

                    {/* IMAP Tab */}
                    <TabsContent value="imap" className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="imap-host" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/60">Host</Label>
                          <Input
                            id="imap-host"
                            value={imapHost}
                            onChange={(e) => setImapHost(e.target.value)}
                            placeholder="imap.gmail.com"
                            className="bg-surface-container/50 text-sm border-glass-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imap-port" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/60">Port</Label>
                          <Input
                            id="imap-port"
                            value={imapPort}
                            onChange={(e) => setImapPort(e.target.value)}
                            placeholder="993"
                            className="bg-surface-container/50 text-sm border-glass-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imap-email" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/60">Email</Label>
                          <Input
                            id="imap-email"
                            value={imapEmail}
                            onChange={(e) => setImapEmail(e.target.value)}
                            placeholder="your@email.com"
                            type="email"
                            className="bg-surface-container/50 text-sm border-glass-border"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imap-password" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/60">Password</Label>
                          <Input
                            id="imap-password"
                            value={imapPassword}
                            onChange={(e) => setImapPassword(e.target.value)}
                            placeholder="••••••••"
                            type="password"
                            className="bg-surface-container/50 text-sm border-glass-border"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <Button
                          className="bg-primary-fixed-dim text-on-primary font-semibold hover:bg-primary-fixed-dim/90"
                          onClick={handleWatchInbox}
                          disabled={emailConnecting || emailConnected}
                        >
                          {emailConnecting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Connecting...
                            </>
                          ) : emailConnected ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Watching Inbox
                            </>
                          ) : (
                            <>
                              <Wifi className="w-4 h-4 mr-2" />
                              Watch Inbox
                            </>
                          )}
                        </Button>
                        {emailConnected && (
                          <span className="text-xs text-risk-low flex items-center gap-1 font-mono">
                            <Check className="w-3 h-3" />
                            {imapEmail}
                          </span>
                        )}
                      </div>
                    </TabsContent>

                    {/* BCC Tab */}
                    <TabsContent value="bcc" className="mt-4">
                      <div className="space-y-4">
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          Simply bcc this address on any supplier email you want the AI to investigate. The Shadow Pilot strategy &mdash; no setup required.
                        </p>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-fixed-dim/5 border border-primary-fixed-dim/20 relative">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider text-primary-fixed-dim/40 mb-1 font-mono font-medium">Bcc Address</p>
                            <p className="text-sm sm:text-base font-mono font-semibold text-primary-fixed-dim truncate">
                              aep-investigate@capsuleflow.ai
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyBcc}
                            className={`shrink-0 transition-all duration-200 ${
                              bccCopied
                                ? 'border-risk-low/40 bg-risk-low/10 text-risk-low'
                                : 'border-primary-fixed-dim/30 bg-primary-fixed-dim/5 text-primary-fixed-dim hover:bg-primary-fixed-dim/10'
                            }`}
                          >
                            {bccCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 mr-1.5" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════
                SECTION E: Communication Activity Log
            ═══════════════════════════════════════════════════════════ */}
            <motion.div variants={cardVariants}>
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-fixed-dim/10 border border-primary-fixed-dim/20">
                      <Activity className="w-5 h-5 text-primary-fixed-dim" />
                    </div>
                    <h3 className="text-base font-bold text-on-surface" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
                      Activity Log
                    </h3>
                  </div>
                  <Badge className="bg-risk-low/10 text-risk-low border-risk-low/20 text-[10px] gap-1.5 font-mono">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-risk-low" />
                    </span>
                    LIVE
                  </Badge>
                </div>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                  <div className="max-h-72 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
                    {ACTIVITY_LOG.map((entry, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.06 }}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-surface-container/30 transition-colors group"
                      >
                        <span className="text-base shrink-0 mt-0.5">{entry.icon}</span>
                        <p className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors flex-1 min-w-0 leading-relaxed">
                          {entry.text}
                        </p>
                        <span className="text-[10px] text-on-surface-variant/40 shrink-0 mt-1 font-mono">{entry.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            COMPLIANCE BADGE - Fixed bottom-right
        ═══════════════════════════════════════════════════════════ */}
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2 glass-card-strong rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-low" />
          </span>
          <span className="text-[10px] font-mono text-risk-low/80 uppercase tracking-widest">
            AF-SOUTH-1 &bull; SARS COMPLIANT &bull; POPIA SECURE
          </span>
        </div>
      </main>
    </div>
  );
}
