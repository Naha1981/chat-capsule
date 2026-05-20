'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Mail, Users, Copy, Check, Loader2,
  QrCode, UserPlus, Activity, Zap, ChevronDown, ChevronUp,
  Shield, CheckCircle, X, Unplug
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import AppSidebar from '@/components/shared/app-sidebar';
import { useAppState } from '@/lib/app-state';
import { INDUSTRIES, type IndustryKey } from '@/lib/industries';
import { toast } from 'sonner';

// ─── Font helpers ────────────────────────────────────────────────
const hanken = 'var(--font-hanken-grotesk), system-ui, sans-serif';
const mono = 'var(--font-jetbrains-mono), ui-monospace, monospace';

// ─── QR Code Simulator ───────────────────────────────────────────
function SimulatedQRCode() {
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
    <div className="p-2.5 rounded-xl border-2 border-glass-border bg-surface-container/50 inline-block">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(21, 1fr)' }}>
        {pattern.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-[5px] h-[5px] rounded-[1px] ${
                cell ? 'bg-foreground/70' : 'bg-transparent'
              }`}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Team Member Type ────────────────────────────────────────────
interface TeamMember {
  name: string;
  role: string;
  initials: string;
  color: string;
}

const INITIAL_TEAM: TeamMember[] = [
  { name: 'Thabiso M.', role: 'Operations', initials: 'TM', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { name: 'Nomsa D.', role: 'Finance', initials: 'ND', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { name: 'Sipho K.', role: 'Operations', initials: 'SK', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
];

// ─── AI Provider Data ────────────────────────────────────────────
const AI_PROVIDERS = [
  {
    name: 'ZAI',
    fullName: 'Z-AI Inferencing',
    model: 'GLM-4 Plus',
    status: 'active' as const,
    statusLabel: 'Primary',
    responseTime: '180ms',
    dotColor: 'bg-risk-low',
    textColor: 'text-risk-low',
    bgColor: 'bg-risk-low/10',
    borderColor: 'border-risk-low/20',
  },
  {
    name: 'Groq',
    fullName: 'Groq Cloud',
    model: 'Llama 3.3 70B',
    status: 'backup' as const,
    statusLabel: 'Backup',
    responseTime: '95ms',
    dotColor: 'bg-risk-medium',
    textColor: 'text-risk-medium',
    bgColor: 'bg-risk-medium/10',
    borderColor: 'border-risk-medium/20',
  },
  {
    name: 'OpenRouter',
    fullName: 'OpenRouter',
    model: 'Claude 3.5 Sonnet',
    status: 'fallback' as const,
    statusLabel: 'Fallback',
    responseTime: '340ms',
    dotColor: 'bg-on-surface-variant/40',
    textColor: 'text-on-surface-variant',
    bgColor: 'bg-on-surface-variant/10',
    borderColor: 'border-on-surface-variant/20',
  },
];

// ─── Stagger Animation Variants ──────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════
export default function NerveCenterScreen() {
  const {
    whatsappConnected, setWhatsappConnected,
    emailConnected, setEmailConnected,
    workspaceIndustry,
  } = useAppState();

  // WhatsApp state
  const [whatsappLinking, setWhatsappLinking] = useState(false);
  const [whatsappQR, setWhatsappQR] = useState(false);

  // Email state
  const [bccCopied, setBccCopied] = useState(false);
  const [manualForwardOpen, setManualForwardOpen] = useState(false);

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Operations');

  const ingestEmail = 'aep-logistics@capsuleflow.ai';

  // ─── WhatsApp Handlers ─────────────────────────────────────────
  const handleLinkWhatsApp = () => {
    if (whatsappConnected) return;
    setWhatsappLinking(true);
    setTimeout(() => {
      setWhatsappLinking(false);
      setWhatsappQR(true);
    }, 2000);
  };

  const handleSimulateScan = () => {
    setWhatsappConnected(true);
    setWhatsappQR(false);
    toast.success('WhatsApp connected!', {
      description: '+27 83 XXX XXXX is now your document ingestion line.',
    });
  };

  const handleDisconnectWhatsApp = () => {
    setWhatsappConnected(false);
    setWhatsappQR(false);
    toast('WhatsApp disconnected');
  };

  // ─── Email Handlers ────────────────────────────────────────────
  const handleGoogleSignIn = () => {
    setEmailConnected(true);
    toast.success('Google account connected!', {
      description: 'Your Gmail inbox is now being watched.',
    });
  };

  const handleMicrosoftSignIn = () => {
    setEmailConnected(true);
    toast.success('Microsoft account connected!', {
      description: 'Your Outlook inbox is now being watched.',
    });
  };

  const handleCopyBcc = async () => {
    try {
      await navigator.clipboard.writeText(ingestEmail);
      setBccCopied(true);
      toast.success('Email address copied!');
      setTimeout(() => setBccCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // ─── Team Handlers ─────────────────────────────────────────────
  const handleAddMember = () => {
    if (!newMemberEmail.trim()) {
      toast.error('Please enter an email address');
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
    toast.success('Team member invited!', { description: `${name} (${newMemberRole})` });
  };

  const handleRemoveMember = (memberName: string) => {
    setTeamMembers(prev => prev.filter(m => m.name !== memberName));
    toast('Member removed');
  };

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen overflow-y-auto relative">
        {/* Mobile spacer */}
        <div className="h-14 md:hidden" />

        <div className="p-4 sm:p-6 space-y-6 pb-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* ═══════════════════════════════════════════════════════
                SECTION A: Communication Channels
            ═══════════════════════════════════════════════════════ */}
            <motion.div variants={cardVariants}>
              <div className="mb-4">
                <h2
                  className="text-xl sm:text-2xl font-extrabold text-on-surface"
                  style={{ fontFamily: hanken }}
                >
                  Channels
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Connect your tools in one click
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ─── WhatsApp Card ─────────────────────────────── */}
                <Card className="glass-card border-glass-border overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10">
                        <MessageSquare className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-on-surface" style={{ fontFamily: hanken }}>
                          WhatsApp
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          Send and receive document alerts on WhatsApp
                        </p>
                      </div>
                    </div>

                    {/* State 1: Disconnected */}
                    {!whatsappConnected && !whatsappLinking && !whatsappQR && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3"
                      >
                        <p className="text-sm text-on-surface-variant">
                          Link your WhatsApp to receive instant document alerts and approve actions directly from your phone.
                        </p>
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                          onClick={handleLinkWhatsApp}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Link WhatsApp
                        </Button>
                      </motion.div>
                    )}

                    {/* State 2: Linking / QR */}
                    {whatsappLinking && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center py-6 gap-3"
                      >
                        <Loader2 className="w-8 h-8 text-primary-fixed-dim animate-spin" />
                        <p className="text-sm text-on-surface-variant" style={{ fontFamily: mono }}>
                          Generating QR code...
                        </p>
                      </motion.div>
                    )}

                    {whatsappQR && !whatsappConnected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <SimulatedQRCode />
                        <p className="text-sm text-on-surface-variant text-center">
                          Scan this with WhatsApp Linked Devices
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary-fixed-dim"
                          onClick={handleSimulateScan}
                        >
                          Simulate scan (demo)
                        </Button>
                      </motion.div>
                    )}

                    {/* State 3: Connected */}
                    {whatsappConnected && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-risk-low/5 border border-risk-low/20">
                          <CheckCircle className="w-5 h-5 text-risk-low shrink-0" />
                          <div>
                            <span className="text-sm text-risk-low font-medium block">
                              Connected as +27 83 XXX XXXX
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={handleDisconnectWhatsApp}
                          className="text-xs text-on-surface-variant hover:text-risk-critical transition-colors flex items-center gap-1"
                          style={{ fontFamily: mono }}
                        >
                          <Unplug className="w-3 h-3" />
                          Disconnect
                        </button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>

                {/* ─── Email Card ──────────────────────────────── */}
                <Card className="glass-card border-glass-border overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-primary-fixed-dim/10">
                        <Mail className="w-6 h-6 text-primary-fixed-dim" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-on-surface" style={{ fontFamily: hanken }}>
                          Email
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          Auto-process incoming documents via email
                        </p>
                      </div>
                      {emailConnected && (
                        <Badge className="bg-risk-low/20 text-risk-low border-risk-low/30 text-[10px]">
                          <CheckCircle className="w-3 h-3 mr-1" /> Connected
                        </Badge>
                      )}
                    </div>

                    {!emailConnected ? (
                      <div className="space-y-3">
                        {/* Option A: Branded OAuth Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            className="border-glass-border bg-surface-container/30 text-on-surface hover:bg-surface-container-high/50 text-xs font-semibold h-10"
                            onClick={handleGoogleSignIn}
                          >
                            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                          </Button>
                          <Button
                            variant="outline"
                            className="border-glass-border bg-surface-container/30 text-on-surface hover:bg-surface-container-high/50 text-xs font-semibold h-10"
                            onClick={handleMicrosoftSignIn}
                          >
                            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                              <path fill="#F25022" d="M1 1h10v10H1z" />
                              <path fill="#7FBA00" d="M13 1h10v10H13z" />
                              <path fill="#00A4EF" d="M1 13h10v10H1z" />
                              <path fill="#FFB900" d="M13 13h10v10H13z" />
                            </svg>
                            Sign in with Microsoft
                          </Button>
                        </div>

                        {/* Option B: Manual Forwarding */}
                        <Collapsible open={manualForwardOpen} onOpenChange={setManualForwardOpen}>
                          <CollapsibleTrigger asChild>
                            <button className="w-full flex items-center justify-center gap-1 text-xs text-on-surface-variant hover:text-primary-fixed-dim transition-colors py-1">
                              {manualForwardOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              Manual Forwarding
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 p-3 rounded-lg bg-surface-container/30 border border-glass-border">
                              <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/60 mb-2">
                                Your Private Ingest Email
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-primary-fixed-dim font-mono truncate flex-1">
                                  {ingestEmail}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 shrink-0"
                                  onClick={handleCopyBcc}
                                >
                                  {bccCopied ? (
                                    <Check className="w-3.5 h-3.5 text-risk-low" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-on-surface-variant" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-[10px] text-on-surface-variant/50">
                                Just bcc this address on any email with a document.
                              </p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-risk-low/5 border border-risk-low/20">
                          <CheckCircle className="w-5 h-5 text-risk-low shrink-0" />
                          <span className="text-sm text-risk-low font-medium">Email connected</span>
                        </div>
                        <button
                          onClick={() => { setEmailConnected(false); toast('Email disconnected'); }}
                          className="text-xs text-on-surface-variant hover:text-risk-critical transition-colors flex items-center gap-1"
                          style={{ fontFamily: mono }}
                        >
                          <Unplug className="w-3 h-3" />
                          Disconnect
                        </button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════
                SECTION B: AI Gateway (simplified)
            ═══════════════════════════════════════════════════════ */}
            <motion.div variants={cardVariants}>
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 flex items-center justify-between">
                  <div>
                    <h2
                      className="text-base sm:text-lg font-extrabold text-on-surface"
                      style={{ fontFamily: hanken }}
                    >
                      AI Gateway
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Auto-failover between providers
                    </p>
                  </div>
                  <Badge className="bg-risk-low/15 text-risk-low border-risk-low/30 gap-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-low" />
                    </span>
                    Auto-failover active
                  </Badge>
                </div>

                {/* Provider Cards */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {AI_PROVIDERS.map((provider) => (
                    <div
                      key={provider.name}
                      className="glass-card rounded-xl p-4 border-l-2 transition-all duration-300 hover:shadow-[0_0_24px_rgba(0,220,229,0.1)] cursor-default"
                      style={{ borderLeftColor: provider.status === 'active' ? '#10b981' : provider.status === 'backup' ? '#f59e0b' : '#64748b' }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-bold text-on-surface">{provider.name}</p>
                        <Badge className={`text-[10px] font-mono ${provider.bgColor} ${provider.textColor} ${provider.borderColor} border`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${provider.dotColor} mr-1`} />
                          {provider.statusLabel}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/50">Model</p>
                        <p className="text-xs font-medium text-on-surface" style={{ fontFamily: mono }}>
                          {provider.model}
                        </p>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/50">Response Time</p>
                        <p className={`text-lg font-bold ${provider.textColor}`} style={{ fontFamily: mono }}>
                          {provider.responseTime}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════
                SECTION C: Team Members
            ═══════════════════════════════════════════════════════ */}
            <motion.div variants={cardVariants}>
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary-fixed-dim/10 border border-secondary-fixed-dim/20">
                      <Users className="w-5 h-5 text-secondary-fixed-dim" />
                    </div>
                    <div>
                      <h3
                        className="text-base sm:text-lg font-extrabold text-on-surface"
                        style={{ fontFamily: hanken }}
                      >
                        Team Members
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Team List */}
                <div className="px-5 sm:px-6 pb-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {teamMembers.map((member, i) => (
                      <motion.div
                        key={member.name}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-container/20 border border-glass-border/50 hover:bg-surface-container/30 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${member.color}`}>
                          {member.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">{member.name}</p>
                          <p className="text-[11px] text-on-surface-variant truncate">{member.name.toLowerCase().replace(' ', '.')}@aep-energy.com</p>
                        </div>
                        <Badge className={`text-[10px] font-mono ${
                          member.role === 'Finance'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : member.role === 'Operations'
                            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {member.role}
                        </Badge>
                        <button
                          onClick={() => handleRemoveMember(member.name)}
                          className="p-1 rounded hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-risk-critical"
                          title="Remove member"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Add Member */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-glass-border">
                  <p className="text-xs font-mono uppercase tracking-wider text-on-surface-variant/50 mb-3">
                    Invite Member
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                      <Input
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        type="email"
                        className="pl-10 bg-surface-container/50 border-glass-border text-sm"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMember(); } }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <select
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                          className="h-10 rounded-md border border-glass-border bg-surface-container/50 text-sm text-on-surface px-3 pr-8 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-fixed-dim"
                          style={{ fontFamily: mono }}
                        >
                          <option value="CEO">CEO</option>
                          <option value="Operations">Operations</option>
                          <option value="Finance">Finance</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                      </div>
                      <Button
                        className="bg-primary-fixed-dim text-on-primary font-semibold hover:bg-primary-fixed-dim/90 shrink-0"
                        onClick={handleAddMember}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
