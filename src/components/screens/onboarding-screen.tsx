'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, Chrome, Building2, Crown,
  Settings, Wallet, Truck, Mountain, Droplets, QrCode,
  MessageSquare, UserPlus, X, CheckCircle, ArrowRight,
  ArrowLeft, Shield, Sparkles, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useAppState } from '@/lib/app-state';

// ─── Step Indicator ─────────────────────────────────────────────
const STEP_LABELS = [
  'Sign In',
  'Workspace',
  'Role',
  'Industry',
  'Connect',
  'Team',
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  const progress = ((currentStep) / (STEP_LABELS.length - 1)) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center justify-between mb-2">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < currentStep
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : i === currentStep
                  ? 'bg-primary/20 text-primary border border-primary/50 glow-cyan'
                  : 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              {i < currentStep ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-[10px] hidden sm:block ${
                i <= currentStep ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      <Progress value={progress} className="h-1.5 mt-3" />
    </div>
  );
}

// ─── Step 0: Login ──────────────────────────────────────────────
function LoginStep({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setIsAuthenticated, setUserEmail } = useAppState();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setIsAuthenticated(true);
      if (email) setUserEmail(email);
      setLoading(false);
      onNext();
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 glow-cyan">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Welcome to CapsuleFlow</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="login-email">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              placeholder="thabiso@aep-energy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="login-password">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <ArrowRight className="w-4 h-4 mr-2" />
          )}
          Sign In
        </Button>
      </form>

      <div className="relative my-6">
        <Separator />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
          or continue with
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="w-full" type="button" onClick={() => { setIsAuthenticated(true); onNext(); }}>
          <Chrome className="w-4 h-4 mr-2" />
          Google
        </Button>
        <Button variant="outline" className="w-full" type="button" onClick={() => { setIsAuthenticated(true); onNext(); }}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24H0V12.6L11.4 0H24v11.4L11.4 24zM1.6 22.4h9.2L22.4 11V1.6H13.2L1.6 13.2v9.2z" />
          </svg>
          Microsoft
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-6">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </motion.div>
  );
}

// ─── Step 1: Workspace Creation ─────────────────────────────────
function WorkspaceStep({ onNext }: { onNext: () => void }) {
  const [name, setName] = useState('AEP Energy - Logistics Division');
  const { setWorkspaceName } = useAppState();

  const handleCreate = () => {
    setWorkspaceName(name);
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Create Your Workspace</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This is your team&apos;s home base in CapsuleFlow
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="workspace-name">
            Workspace Name
          </label>
          <Input
            id="workspace-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your company name..."
          />
        </div>

        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground">
            Your workspace will be provisioned in <Badge variant="outline" className="text-[10px] ml-1 border-cyan-500/30 text-cyan-400">af-south-1</Badge>
            {' '}ensuring POPIA compliance.
          </p>
        </div>

        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          onClick={handleCreate}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Create Workspace
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step 2: Role Selection ─────────────────────────────────────
const ROLES = [
  {
    id: 'ceo' as const,
    title: 'CEO',
    subtitle: 'Views ROI & Risk',
    icon: <Crown className="w-6 h-6" />,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    description: 'High-level dashboards, cost savings, risk overview.',
  },
  {
    id: 'operations' as const,
    title: 'Operations',
    subtitle: 'Manages Shipments',
    icon: <Settings className="w-6 h-6" />,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    description: 'Shipment tracking, document status, agent pipeline.',
  },
  {
    id: 'finance' as const,
    title: 'Finance',
    subtitle: 'Approves Payments',
    icon: <Wallet className="w-6 h-6" />,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    description: 'Payment approval, cost analysis, demurrage tracking.',
  },
];

function RoleStep({ onNext }: { onNext: () => void }) {
  const { setUserRole } = useAppState();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold">What&apos;s Your Role?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We&apos;ll customize your dashboard based on your role
        </p>
      </div>

      <div className="space-y-3">
        {ROLES.map((role) => (
          <Card
            key={role.id}
            className="cursor-pointer group hover:border-primary/50 transition-all duration-300 glass-card border-border/30"
            onClick={() => {
              setUserRole(role.id);
              onNext();
            }}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${role.bg} ${role.color} group-hover:scale-110 transition-transform duration-200`}>
                {role.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{role.title}</h3>
                <p className="text-sm text-muted-foreground">{role.subtitle}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Step 3: Industry Selection ─────────────────────────────────
const INDUSTRIES = [
  {
    id: 'logistics',
    title: 'Logistics',
    icon: <Truck className="w-8 h-8" />,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    description: 'Import/export, freight forwarding, customs clearance. Built for South African trade corridors.',
  },
  {
    id: 'mining',
    title: 'Mining',
    icon: <Mountain className="w-8 h-8" />,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    description: 'Mine development, mineral exports, environmental compliance. From pit to port.',
  },
  {
    id: 'oil',
    title: 'Oil & Gas',
    icon: <Droplets className="w-8 h-8" />,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    description: 'Crude oil imports, refinery logistics, petroleum product distribution across Southern Africa.',
  },
];

function IndustryStep({ onNext }: { onNext: () => void }) {
  const { setWorkspaceIndustry } = useAppState();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <Truck className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Select Your Industry</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We&apos;ll activate the right AI capsule for your operations
        </p>
      </div>

      <div className="space-y-3">
        {INDUSTRIES.map((industry) => (
          <Card
            key={industry.id}
            className="cursor-pointer group hover:border-primary/50 transition-all duration-300 glass-card border-border/30"
            onClick={() => {
              setWorkspaceIndustry(industry.id);
              onNext();
            }}
          >
            <CardContent className="p-5 flex items-start gap-4">
              <div className={`p-3 rounded-xl ${industry.bg} ${industry.color} group-hover:scale-110 transition-transform duration-200`}>
                {industry.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{industry.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {industry.description}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Step 4: Connectivity ───────────────────────────────────────
function ConnectivityStep({ onNext }: { onNext: () => void }) {
  const whatsappConnected = useAppState((s) => s.whatsappConnected);
  const setWhatsappConnected = useAppState((s) => s.setWhatsappConnected);
  const emailConnected = useAppState((s) => s.emailConnected);
  const setEmailConnected = useAppState((s) => s.setEmailConnected);
  const [imapHost, setImapHost] = useState('');
  const [imapUser, setImapUser] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [whatsappConnecting, setWhatsappConnecting] = useState(false);
  const [emailConnecting, setEmailConnecting] = useState(false);

  const handleConnectWhatsApp = () => {
    setWhatsappConnecting(true);
    setTimeout(() => {
      setWhatsappConnected(true);
      setWhatsappConnecting(false);
    }, 1200);
  };

  const handleConnectEmail = () => {
    setEmailConnecting(true);
    setTimeout(() => {
      setEmailConnected(true);
      setEmailConnecting(false);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <MessageSquare className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Connect Your Nerve Center</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Link your communication channels for real-time AI alerts
        </p>
      </div>

      <div className="space-y-4">
        {/* WhatsApp Card */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">WhatsApp Business</h3>
                <p className="text-xs text-muted-foreground">Receive alerts & approve actions</p>
              </div>
              {whatsappConnected && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" /> Connected
                </Badge>
              )}
            </div>

            {!whatsappConnected ? (
              <>
                <div className="bg-muted/30 rounded-xl p-8 mb-4 flex flex-col items-center gap-3 border border-border/30">
                  <div className="w-32 h-32 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs text-muted-foreground">Scan to link your WhatsApp</p>
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  onClick={handleConnectWhatsApp}
                  disabled={whatsappConnecting}
                >
                  {whatsappConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <MessageSquare className="w-4 h-4 mr-2" />
                  )}
                  Connect WhatsApp
                </Button>
              </>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                WhatsApp linked successfully
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Card */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Email Integration</h3>
                <p className="text-xs text-muted-foreground">Auto-process incoming documents</p>
              </div>
              {emailConnected && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" /> Connected
                </Badge>
              )}
            </div>

            {!emailConnected && (
              <>
                {!showEmailForm ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">Quick Setup — Bcc Address</p>
                      <p className="text-sm font-mono text-primary">
                        aep-investigate@capsuleflow.ai
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add this as a Bcc on all shipment emails
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 text-sm"
                        onClick={() => setShowEmailForm(true)}
                      >
                        IMAP Setup
                      </Button>
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                        onClick={handleConnectEmail}
                        disabled={emailConnecting}
                      >
                        {emailConnecting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        Use Bcc Address
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium" htmlFor="imap-host">IMAP Host</label>
                      <Input
                        id="imap-host"
                        placeholder="imap.gmail.com"
                        value={imapHost}
                        onChange={(e) => setImapHost(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium" htmlFor="imap-user">Username</label>
                      <Input
                        id="imap-user"
                        placeholder="user@company.com"
                        value={imapUser}
                        onChange={(e) => setImapUser(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium" htmlFor="imap-pass">Password</label>
                      <Input
                        id="imap-pass"
                        type="password"
                        placeholder="••••••••"
                        value={imapPassword}
                        onChange={(e) => setImapPassword(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="text-sm"
                        onClick={() => setShowEmailForm(false)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back
                      </Button>
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                        onClick={handleConnectEmail}
                        disabled={emailConnecting}
                      >
                        {emailConnecting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Mail className="w-4 h-4 mr-1" />
                        )}
                        Connect Email
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {emailConnected && (
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Email integration configured
              </div>
            )}
          </CardContent>
        </Card>

        <Button className="w-full font-semibold" variant="outline" onClick={onNext}>
          Continue
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step 5: Team Invite ────────────────────────────────────────
function TeamInviteStep({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);

  const handleAddMember = () => {
    if (email.trim() && !members.includes(email.trim())) {
      setInviting(true);
      setTimeout(() => {
        setMembers((prev) => [...prev, email.trim()]);
        setEmail('');
        setInviting(false);
      }, 600);
    }
  };

  const handleRemoveMember = (member: string) => {
    setMembers((prev) => prev.filter((m) => m !== member));
  };

  const handleComplete = () => {
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <UserPlus className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Invite Your Team</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add colleagues to your workspace
        </p>
      </div>

      <div className="space-y-4">
        {/* Email input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMember();
                }
              }}
            />
          </div>
          <Button
            onClick={handleAddMember}
            disabled={!email.trim() || inviting}
            variant="outline"
          >
            {inviting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Member list */}
        {members.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {members.map((member) => (
              <motion.div
                key={member}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/30"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {member.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm flex-1 truncate">{member}</span>
                <button
                  onClick={() => handleRemoveMember(member)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {members.length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-4">
            No team members added yet. You can skip this step.
          </p>
        )}

        <Separator />

        {/* Complete button */}
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold glow-cyan"
          onClick={handleComplete}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Complete Setup
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>

        <Button
          variant="ghost"
          className="w-full text-sm text-muted-foreground"
          onClick={handleComplete}
        >
          Skip for now
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Onboarding Screen ─────────────────────────────────────
export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const { setOnboardingStep, setOnboardingComplete, setCurrentScreen } = useAppState();

  const handleNext = () => {
    const nextStep = step + 1;
    if (nextStep <= 5) {
      setStep(nextStep);
      setOnboardingStep(nextStep);
    }
    if (nextStep > 5) {
      setOnboardingComplete(true);
      setCurrentScreen('dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-grid-pattern noise-overlay">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="glass-card-strong rounded-2xl p-6 sm:p-8">
          {/* Logo */}
          <div className="text-center mb-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-4">
              <Shield className="w-3 h-3 mr-1" />
              CapsuleFlow AI
            </Badge>
          </div>

          {/* Step indicator */}
          <StepIndicator currentStep={step} />

          {/* Step content */}
          <div className="min-h-[400px] flex items-start justify-center">
            <AnimatePresence mode="wait">
              {step === 0 && <LoginStep key="login" onNext={handleNext} />}
              {step === 1 && <WorkspaceStep key="workspace" onNext={handleNext} />}
              {step === 2 && <RoleStep key="role" onNext={handleNext} />}
              {step === 3 && <IndustryStep key="industry" onNext={handleNext} />}
              {step === 4 && <ConnectivityStep key="connectivity" onNext={handleNext} />}
              {step === 5 && <TeamInviteStep key="team" onNext={handleNext} />}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
