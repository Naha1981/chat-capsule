'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Mail, Users, Copy, Check, Loader2,
  QrCode, Phone, UserPlus, Activity, Wifi, WifiOff,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import AppSidebar from '@/components/shared/app-sidebar';
import { useAppState } from '@/lib/app-state';
import { toast } from 'sonner';

// ─── QR Code Simulator ────────────────────────────────────────────
function SimulatedQRCode({ connected }: { connected: boolean }) {
  // Generate a deterministic pseudo-random QR pattern
  const pattern = useMemo(() => {
    const size = 21;
    const cells: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < size; c++) {
        // Finder patterns (top-left, top-right, bottom-left)
        const inTL = r < 7 && c < 7;
        const inTR = r < 7 && c >= size - 7;
        const inBL = r >= size - 7 && c < 7;

        if (inTL || inTR || inBL) {
          const lr = inTL ? r : inTR ? r : r - (size - 7);
          const lc = inTL ? c : inTR ? c - (size - 7) : c;
          // Outer border
          if (lr === 0 || lr === 6 || lc === 0 || lc === 6) row.push(true);
          // Inner square
          else if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) row.push(true);
          else row.push(false);
        } else {
          // Pseudo-random data area using a simple hash
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
        : 'border-border/50 bg-background/50'
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
      <main className="flex-1 min-h-screen overflow-y-auto">
        {/* Mobile spacer */}
        <div className="h-14 md:hidden" />

        {/* Header */}
        <header className="sticky top-0 z-30 glass-card-strong border-b border-border/30 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 glow-cyan">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate">
                Nerve Center
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                Connect Your Communication Channels
              </p>
            </div>
            <Badge variant="outline" className="hidden sm:flex border-primary/30 bg-primary/5 text-primary text-[10px] gap-1">
              <Activity className="w-3 h-3 animate-subtle-pulse" />
              Settings
            </Badge>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* ═══════════════════════════════════════════════════════════
                SECTION A: WhatsApp Connection
            ═══════════════════════════════════════════════════════════ */}
            <motion.div variants={cardVariants}>
              <Card className="glass-card border-border/30 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <MessageSquare className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">WhatsApp Connection</CardTitle>
                        <CardDescription className="text-xs mt-0.5">Evolution API</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {whatsappConnected ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1.5 text-xs">
                          <span className="text-sm">🟢</span> Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500/30 bg-red-500/5 text-red-400 gap-1.5 text-xs">
                          <span className="text-sm">🔴</span> Not Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* QR Code Area */}
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <SimulatedQRCode connected={whatsappConnected} />
                      <p className="text-[10px] text-muted-foreground text-center max-w-[160px]">
                        {whatsappConnected ? 'Scan complete' : 'Scan with WhatsApp Business'}
                      </p>
                    </div>

                    {/* Info & Button */}
                    <div className="flex-1 space-y-4 min-w-0">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Scan this QR code with your WhatsApp Business account. This number becomes your official document ingestion line.
                      </p>

                      {whatsappConnected && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                        >
                          <Phone className="w-4 h-4 text-emerald-400" />
                          <div>
                            <p className="text-xs text-muted-foreground">Connected Number</p>
                            <p className="text-sm font-semibold text-emerald-400">+27 83 XXX XXXX</p>
                          </div>
                        </motion.div>
                      )}

                      <Button
                        className="glow-cyan bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full sm:w-auto"
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
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════
                SECTION B: Email Connection
            ═══════════════════════════════════════════════════════════ */}
            <motion.div variants={cardVariants}>
              <Card className="glass-card border-border/30 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <Mail className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Email Connection</CardTitle>
                        <CardDescription className="text-xs mt-0.5">IMAP / Bcc</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {emailConnected ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1.5 text-xs">
                          <Wifi className="w-3 h-3" />
                          Inbox Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground gap-1.5 text-xs">
                          <WifiOff className="w-3 h-3" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="imap" className="w-full">
                    <TabsList className="w-full sm:w-auto">
                      <TabsTrigger value="imap" className="gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Direct IMAP
                      </TabsTrigger>
                      <TabsTrigger value="bcc" className="gap-1.5">
                        <Copy className="w-3.5 h-3.5" />
                        The Bcc Address
                      </TabsTrigger>
                    </TabsList>

                    {/* IMAP Tab */}
                    <TabsContent value="imap" className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="imap-host" className="text-xs">Host</Label>
                          <Input
                            id="imap-host"
                            value={imapHost}
                            onChange={(e) => setImapHost(e.target.value)}
                            placeholder="imap.gmail.com"
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imap-port" className="text-xs">Port</Label>
                          <Input
                            id="imap-port"
                            value={imapPort}
                            onChange={(e) => setImapPort(e.target.value)}
                            placeholder="993"
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imap-email" className="text-xs">Email</Label>
                          <Input
                            id="imap-email"
                            value={imapEmail}
                            onChange={(e) => setImapEmail(e.target.value)}
                            placeholder="your@email.com"
                            type="email"
                            className="bg-background/50 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imap-password" className="text-xs">Password</Label>
                          <Input
                            id="imap-password"
                            value={imapPassword}
                            onChange={(e) => setImapPassword(e.target.value)}
                            placeholder="••••••••"
                            type="password"
                            className="bg-background/50 text-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <Button
                          className="glow-cyan bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
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
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {imapEmail}
                          </span>
                        )}
                      </div>
                    </TabsContent>

                    {/* BCC Tab */}
                    <TabsContent value="bcc" className="mt-4">
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Simply bcc this address on any supplier email you want the AI to investigate. The Shadow Pilot strategy &mdash; no setup required.
                        </p>
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20 gradient-border relative">
                          <div className="flex-1 min-w-0 relative z-10">
                            <p className="text-[10px] uppercase tracking-wider text-primary/60 mb-1 font-medium">Bcc Address</p>
                            <p className="text-sm sm:text-base font-mono font-semibold text-primary truncate">
                              aep-investigate@capsuleflow.ai
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyBcc}
                            className={`shrink-0 transition-all duration-200 ${
                              bccCopied
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                                : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
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
                </CardContent>
              </Card>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════
                SECTION C: Team Invites
            ═══════════════════════════════════════════════════════════ */}
            <motion.div variants={cardVariants}>
              <Card className="glass-card border-border/30 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Users className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Team Invites</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Add team members who will receive auto-forwarded Payment Packs and critical alerts.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Current Team */}
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Current Team</p>
                    <div className="space-y-2">
                      {teamMembers.map((member, i) => (
                        <motion.div
                          key={member.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-background/30 border border-border/20"
                        >
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold ${member.color}`}>
                            {member.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{member.name}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {member.role}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-border/30" />

                  {/* Add Member Form */}
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                      <UserPlus className="w-3 h-3" />
                      Add Member
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Input
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="colleague@company.com"
                          type="email"
                          className="bg-background/50 text-sm"
                        />
                      </div>
                      <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                        <SelectTrigger className="w-full sm:w-[160px] bg-background/50 text-sm">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CEO">CEO</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        className="glow-cyan bg-primary hover:bg-primary/90 text-primary-foreground font-semibold w-full sm:w-auto"
                        onClick={handleAddMember}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════
                BOTTOM: Communication Activity Log
            ═══════════════════════════════════════════════════════════ */}
            <motion.div variants={cardVariants}>
              <Card className="glass-card border-border/30 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Communication Activity Log</CardTitle>
                      <CardDescription className="text-xs mt-0.5">Recent channel activity</CardDescription>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px] gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-subtle-pulse" />
                        Live
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                    {ACTIVITY_LOG.map((entry, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.06 }}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-background/30 transition-colors group"
                      >
                        <span className="text-base shrink-0 mt-0.5">{entry.icon}</span>
                        <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-1 min-w-0 leading-relaxed">
                          {entry.text}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-1">{entry.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
