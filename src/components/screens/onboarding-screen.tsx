'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, Chrome, Building2, Crown,
  Settings, Wallet, QrCode,
  MessageSquare, UserPlus, X, CheckCircle, ArrowRight,
  ArrowLeft, Shield, Sparkles, Loader2, Search,
  Verified, Activity, Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAppState } from '@/lib/app-state';
import { INDUSTRY_LIST, INDUSTRIES, type IndustryKey } from '@/lib/industries';

// ─── Font helpers ────────────────────────────────────────────────
const hanken = 'var(--font-hanken-grotesk), system-ui, sans-serif';
const mono = 'var(--font-jetbrains-mono), ui-monospace, monospace';

// ─── Step Labels ─────────────────────────────────────────────────
const STEP_LABELS = [
  'SIGN IN',
  'WORKSPACE',
  'ROLE',
  'INDUSTRY',
  'CONNECT',
  'TEAM',
];

// ─── Segment Progress Bar ────────────────────────────────────────
function SegmentProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full flex items-center gap-1.5 mb-6">
      {STEP_LABELS.map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
            i < currentStep
              ? 'bg-primary-fixed-dim'
              : i === currentStep
              ? 'bg-primary-fixed-dim animate-subtle-pulse'
              : 'bg-surface-variant'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Stage Header ────────────────────────────────────────────────
function StageHeader({
  label,
  stepIndex,
  total = 6,
}: {
  label: string;
  stepIndex: number;
  total?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span
        className="uppercase tracking-[0.2em] text-[10px] font-semibold text-on-surface-variant"
        style={{ fontFamily: mono }}
      >
        STAGE: {label}
      </span>
      <span
        className="text-[11px] text-on-surface-variant tabular-nums"
        style={{ fontFamily: mono }}
      >
        {String(stepIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
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
      <StageHeader label="SIGN IN" stepIndex={0} />
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary-fixed-dim/10 flex items-center justify-center mb-3 glow-cyan">
          <Lock className="w-6 h-6 text-primary-fixed-dim" />
        </div>
        <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: hanken }}>
          Welcome to CapsuleFlow
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="login-email" style={{ fontFamily: mono }}>
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <Input
              id="login-email"
              type="email"
              placeholder="thabiso@aep-energy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-surface-container/50 border-glass-border text-on-surface placeholder:text-on-surface-variant/50"
              style={{ fontFamily: mono }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant" htmlFor="login-password" style={{ fontFamily: mono }}>
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 bg-surface-container/50 border-glass-border text-on-surface placeholder:text-on-surface-variant/50"
              style={{ fontFamily: mono }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <Button
          type="submit"
          className="w-full bg-primary-fixed-dim hover:bg-primary-fixed-dim/90 text-on-primary font-semibold glow-cyan"
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
          Sign In
        </Button>
      </form>

      <div className="relative my-6">
        <Separator className="bg-glass-border" />
        <span
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-glass-surface px-3 text-[10px] text-on-surface-variant"
          style={{ fontFamily: mono }}
        >
          OR CONTINUE WITH
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="w-full border-glass-border bg-surface-container/30 text-on-surface hover:bg-surface-variant/30"
          type="button"
          onClick={() => { setIsAuthenticated(true); onNext(); }}
        >
          <Chrome className="w-4 h-4 mr-2" /> Google
        </Button>
        <Button
          variant="outline"
          className="w-full border-glass-border bg-surface-container/30 text-on-surface hover:bg-surface-variant/30"
          type="button"
          onClick={() => { setIsAuthenticated(true); onNext(); }}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24H0V12.6L11.4 0H24v11.4L11.4 24zM1.6 22.4h9.2L22.4 11V1.6H13.2L1.6 13.2v9.2z" />
          </svg>
          Microsoft
        </Button>
      </div>
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
      <StageHeader label="WORKSPACE" stepIndex={1} />
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary-fixed-dim/10 flex items-center justify-center mb-3">
          <Building2 className="w-6 h-6 text-primary-fixed-dim" />
        </div>
        <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: hanken }}>
          Create Your Workspace
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          This is your team&apos;s home base in CapsuleFlow
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            htmlFor="workspace-name"
            style={{ fontFamily: mono }}
          >
            Workspace Name
          </label>
          <Input
            id="workspace-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your company name..."
            className="bg-surface-container/50 border-glass-border text-on-surface placeholder:text-on-surface-variant/50"
            style={{ fontFamily: mono }}
          />
        </div>
        <div className="p-3 rounded-lg bg-surface-container/50 border border-glass-border">
          <p className="text-xs text-on-surface-variant" style={{ fontFamily: mono }}>
            Your workspace will be provisioned in{' '}
            <Badge
              variant="outline"
              className="text-[10px] ml-1 border-primary-fixed-dim/30 text-primary-fixed-dim"
              style={{ fontFamily: mono }}
            >
              af-south-1
            </Badge>{' '}
            ensuring POPIA compliance.
          </p>
        </div>
        <Button
          className="w-full bg-primary-fixed-dim hover:bg-primary-fixed-dim/90 text-on-primary font-semibold glow-cyan"
          onClick={handleCreate}
        >
          <Sparkles className="w-4 h-4 mr-2" /> Create Workspace
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step 2: Role Selection ─────────────────────────────────────
const ROLES = [
  { id: 'ceo' as const, title: 'CEO', subtitle: 'Views ROI & Risk', icon: <Crown className="w-6 h-6" />, color: 'text-tertiary-fixed-dim', bg: 'bg-tertiary-fixed-dim/10', border: 'border-tertiary-fixed-dim/30', description: 'High-level dashboards, cost savings, risk overview.' },
  { id: 'operations' as const, title: 'Operations', subtitle: 'Manages Shipments', icon: <Settings className="w-6 h-6" />, color: 'text-primary-fixed-dim', bg: 'bg-primary-fixed-dim/10', border: 'border-primary-fixed-dim/30', description: 'Shipment tracking, document status, agent pipeline.' },
  { id: 'finance' as const, title: 'Finance', subtitle: 'Approves Payments', icon: <Wallet className="w-6 h-6" />, color: 'text-risk-low', bg: 'bg-risk-low/10', border: 'border-risk-low/30', description: 'Payment approval, cost analysis, demurrage tracking.' },
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
      <StageHeader label="ROLE" stepIndex={2} />
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary-fixed-dim/10 flex items-center justify-center mb-3">
          <Crown className="w-6 h-6 text-primary-fixed-dim" />
        </div>
        <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: hanken }}>
          What&apos;s Your Role?
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          We&apos;ll customize your dashboard based on your role
        </p>
      </div>
      <div className="space-y-3">
        {ROLES.map((role) => (
          <Card
            key={role.id}
            className="cursor-pointer group hover:border-primary-fixed-dim/50 transition-all duration-300 glass-card border-glass-border"
            onClick={() => { setUserRole(role.id); onNext(); }}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${role.bg} ${role.color} group-hover:scale-110 transition-transform duration-200`}>
                {role.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-on-surface" style={{ fontFamily: hanken }}>{role.title}</h3>
                <p className="text-sm text-on-surface-variant">{role.subtitle}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary-fixed-dim group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Step 3: Industry Selection (Google Stitch Design) ───────────
function IndustryStep({ onNext }: { onNext: () => void }) {
  const { setWorkspaceIndustry } = useAppState();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<IndustryKey | null>(null);

  const filtered = search.trim()
    ? INDUSTRY_LIST.filter(i =>
        i.label.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase())
      )
    : INDUSTRY_LIST;

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selected) {
        setWorkspaceIndustry(selected);
        onNext();
      }
    },
    [selected, setWorkspaceIndustry, onNext]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectedIndustry = selected ? INDUSTRY_LIST.find(i => i.key === selected) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full mx-auto"
    >
      <StageHeader label="INDUSTRY SELECTION" stepIndex={3} />

      {/* Title block */}
      <div className="mb-5">
        <h2
          className="text-2xl sm:text-3xl font-extrabold text-on-surface leading-tight"
          style={{ fontFamily: hanken }}
        >
          Choose Your Operational{' '}
          <span className="text-gradient-cyan">Nerve Center</span>
        </h2>
        <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
          Select the primary sector to tailor your autonomous trade workflows and compliance engine.
        </p>
      </div>

      {/* Main content: Grid + ROI Panel */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: Search + Grid */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <Input
              placeholder="Filter industries (e.g. Mining, Retail)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-surface-container/50 border-glass-border text-on-surface placeholder:text-on-surface-variant/50"
              style={{ fontFamily: mono }}
            />
          </div>

          {/* Industry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
            {filtered.map((industry, i) => {
              const isActive = selected === industry.key;
              return (
                <motion.div
                  key={industry.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div
                    className={`relative p-5 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden ${
                      isActive
                        ? 'bg-surface-container-high border border-primary-fixed-dim border-l-4 border-l-primary-fixed-dim'
                        : 'glass-card border-glass-border hover:bg-surface-variant/30 border-l-4 border-l-transparent'
                    }`}
                    onClick={() => setSelected(industry.key)}
                  >
                    {/* Pulse line on left when active */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-b from-transparent via-primary-fixed-dim to-transparent pulse-line" />
                      </div>
                    )}

                    {/* Top row: emoji + doc count badge */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`p-2 rounded-lg ${industry.bgClass} ${industry.textClass} text-xl`}>
                        {industry.icon}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[9px] h-5 ${
                          isActive
                            ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim border-primary-fixed-dim/30'
                            : 'bg-surface-container/50 text-on-surface-variant border-glass-border'
                        }`}
                        style={{ fontFamily: mono }}
                      >
                        {industry.docTypes.length} DOCS
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3
                      className="text-[18px] font-bold text-on-surface leading-snug"
                      style={{ fontFamily: hanken }}
                    >
                      {industry.label}
                    </h3>

                    {/* Description */}
                    <p className="text-[14px] text-on-surface-variant mt-1 leading-relaxed line-clamp-2">
                      {industry.description}
                    </p>

                    {/* Bottom badge */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] h-5 ${
                          isActive
                            ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim border-primary-fixed-dim/30'
                            : 'bg-surface-container/50 text-on-surface-variant border-glass-border'
                        }`}
                        style={{ fontFamily: mono }}
                      >
                        {industry.goldenThreadRef}
                      </Badge>
                    </div>

                    {/* Check indicator */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3"
                      >
                        <CheckCircle className="w-5 h-5 text-primary-fixed-dim" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Hint text */}
          <div className="mt-3 flex items-center gap-2">
            <span
              className="text-[10px] text-on-surface-variant/60 tracking-wider"
              style={{ fontFamily: mono }}
            >
              ESC TO CANCEL • ENTER TO CONFIRM
            </span>
          </div>
        </div>

        {/* Right: ROI Side Panel (lg+) */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-0 space-y-4">
            {/* Predicted ROI Card */}
            <div className="glass-card rounded-xl p-5 bg-surface-container-highest/40 border-glass-border">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary-fixed-dim" />
                <span
                  className="uppercase tracking-[0.15em] text-[10px] font-semibold text-primary-fixed-dim"
                  style={{ fontFamily: mono }}
                >
                  PREDICTED ROI
                </span>
              </div>

              {/* ROI Bars */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-on-surface-variant" style={{ fontFamily: mono }}>
                      Time Saved
                    </span>
                    <span className="text-xs text-primary-fixed-dim font-semibold" style={{ fontFamily: mono }}>
                      82%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-variant">
                    <motion.div
                      className="h-full rounded-full bg-primary-fixed-dim"
                      initial={{ width: 0 }}
                      animate={{ width: '82%' }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-on-surface-variant" style={{ fontFamily: mono }}>
                      Cost Reduction
                    </span>
                    <span className="text-xs text-risk-low font-semibold" style={{ fontFamily: mono }}>
                      $14.2k/mo
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-variant">
                    <motion.div
                      className="h-full rounded-full bg-risk-low"
                      initial={{ width: 0 }}
                      animate={{ width: '68%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* Selected Industry ROI */}
              {selectedIndustry && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-lg bg-primary-fixed-dim/5 border border-primary-fixed-dim/20"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-primary-fixed-dim" />
                    <span className="text-[10px] font-semibold text-primary-fixed-dim" style={{ fontFamily: mono }}>
                      {selectedIndustry.label}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {selectedIndustry.roiPitch}
                  </p>
                </motion.div>
              )}
            </div>

            {/* SARS Ready Box */}
            <div className="glass-card rounded-xl p-4 bg-surface-container-highest/40 border-glass-border">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-risk-low/10">
                  <Verified className="w-4 h-4 text-risk-low" />
                </div>
                <div>
                  <span
                    className="uppercase tracking-[0.15em] text-[10px] font-semibold text-risk-low"
                    style={{ fontFamily: mono }}
                  >
                    SARS READY
                  </span>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                    Automated compliance verification active
                  </p>
                </div>
              </div>
            </div>

            {/* Activate Capsule Button */}
            <Button
              className="w-full bg-primary-fixed-dim hover:bg-primary-fixed-dim/90 text-on-primary font-bold text-sm glow-cyan py-3"
              style={{ fontFamily: hanken }}
              onClick={() => {
                if (selected) {
                  setWorkspaceIndustry(selected);
                  onNext();
                }
              }}
              disabled={!selected}
            >
              <Zap className="w-4 h-4 mr-2" />
              Activate {selectedIndustry ? selectedIndustry.label : 'Industry'} Capsule
            </Button>

            {/* Keyboard hint */}
            <div className="text-center">
              <span
                className="text-[9px] text-on-surface-variant/50 tracking-wider"
                style={{ fontFamily: mono }}
              >
                ESC TO CANCEL • ENTER TO CONFIRM
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only Activate button */}
      <div className="mt-4 lg:hidden">
        <Button
          className="w-full bg-primary-fixed-dim hover:bg-primary-fixed-dim/90 text-on-primary font-bold glow-cyan"
          style={{ fontFamily: hanken }}
          onClick={() => {
            if (selected) {
              setWorkspaceIndustry(selected);
              onNext();
            }
          }}
          disabled={!selected}
        >
          <Zap className="w-4 h-4 mr-2" />
          Activate {selectedIndustry ? selectedIndustry.label : 'Industry'} Capsule
        </Button>
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
  const workspaceIndustry = useAppState((s) => s.workspaceIndustry);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [whatsappConnecting, setWhatsappConnecting] = useState(false);
  const [emailConnecting, setEmailConnecting] = useState(false);

  const handleConnectWhatsApp = () => {
    setWhatsappConnecting(true);
    setTimeout(() => { setWhatsappConnected(true); setWhatsappConnecting(false); }, 1200);
  };
  const handleConnectEmail = () => {
    setEmailConnecting(true);
    setTimeout(() => { setEmailConnected(true); setEmailConnecting(false); }, 1000);
  };

  const industryConfig = INDUSTRIES[workspaceIndustry as IndustryKey] || INDUSTRIES.logistics;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-lg mx-auto"
    >
      <StageHeader label="CONNECT" stepIndex={4} />
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary-fixed-dim/10 flex items-center justify-center mb-3">
          <MessageSquare className="w-6 h-6 text-primary-fixed-dim" />
        </div>
        <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: hanken }}>
          Connect Your Nerve Center
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Link your communication channels for real-time AI alerts
        </p>
      </div>
      <div className="space-y-4">
        {/* WhatsApp Card */}
        <Card className="glass-card border-glass-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-risk-low/10 text-risk-low">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-on-surface" style={{ fontFamily: hanken }}>
                  WhatsApp Business
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {industryConfig.whatsappBotName} — Receive alerts & approve actions
                </p>
              </div>
              {whatsappConnected && (
                <Badge className="bg-risk-low/20 text-risk-low border-risk-low/30">
                  <CheckCircle className="w-3 h-3 mr-1" /> Connected
                </Badge>
              )}
            </div>
            {!whatsappConnected ? (
              <>
                <div className="bg-surface-container/30 rounded-xl p-8 mb-4 flex flex-col items-center gap-3 border border-glass-border">
                  <div className="w-32 h-32 rounded-xl bg-surface-container/50 border border-glass-border flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-on-surface-variant/40" />
                  </div>
                  <p className="text-xs text-on-surface-variant" style={{ fontFamily: mono }}>
                    Scan to link your WhatsApp
                  </p>
                </div>
                <Button
                  className="w-full bg-risk-low hover:bg-risk-low/90 text-white font-semibold"
                  onClick={handleConnectWhatsApp}
                  disabled={whatsappConnecting}
                >
                  {whatsappConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                  Connect WhatsApp
                </Button>
              </>
            ) : (
              <div className="p-3 rounded-lg bg-risk-low/5 border border-risk-low/20 text-sm text-risk-low flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> WhatsApp linked successfully
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Card */}
        <Card className="glass-card border-glass-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary-fixed-dim/10 text-primary-fixed-dim">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-on-surface" style={{ fontFamily: hanken }}>
                  Email Integration
                </h3>
                <p className="text-xs text-on-surface-variant">Auto-process incoming documents</p>
              </div>
              {emailConnected && (
                <Badge className="bg-risk-low/20 text-risk-low border-risk-low/30">
                  <CheckCircle className="w-3 h-3 mr-1" /> Connected
                </Badge>
              )}
            </div>
            {!emailConnected && (
              <>
                {!showEmailForm ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-surface-container/30 border border-glass-border">
                      <p className="text-xs text-on-surface-variant mb-1" style={{ fontFamily: mono }}>
                        Quick Setup — Bcc Address
                      </p>
                      <p className="text-sm text-primary-fixed-dim" style={{ fontFamily: mono }}>
                        aep-investigate@capsuleflow.ai
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Add this as a Bcc on all shipment emails
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 text-sm border-glass-border bg-surface-container/30 text-on-surface hover:bg-surface-variant/30"
                        onClick={() => setShowEmailForm(true)}
                      >
                        IMAP Setup
                      </Button>
                      <Button
                        className="flex-1 bg-primary-fixed-dim hover:bg-primary-fixed-dim/90 text-on-primary text-sm"
                        onClick={handleConnectEmail}
                        disabled={emailConnecting}
                      >
                        {emailConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}{' '}
                        Use Bcc Address
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      variant="ghost"
                      className="text-sm text-on-surface-variant"
                      onClick={() => setShowEmailForm(false)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      className="w-full bg-primary-fixed-dim hover:bg-primary-fixed-dim/90 text-on-primary text-sm"
                      onClick={handleConnectEmail}
                      disabled={emailConnecting}
                    >
                      {emailConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Mail className="w-4 h-4 mr-1" />}{' '}
                      Connect Email
                    </Button>
                  </div>
                )}
              </>
            )}
            {emailConnected && (
              <div className="p-3 rounded-lg bg-risk-low/5 border border-risk-low/20 text-sm text-risk-low flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Email integration configured
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          className="w-full font-semibold border-glass-border bg-surface-container/30 text-on-surface hover:bg-surface-variant/30"
          variant="outline"
          onClick={onNext}
        >
          Continue <ArrowRight className="w-4 h-4 ml-1" />
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
  const handleComplete = () => { onNext(); };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-sm mx-auto"
    >
      <StageHeader label="TEAM" stepIndex={5} />
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary-fixed-dim/10 flex items-center justify-center mb-3">
          <UserPlus className="w-6 h-6 text-primary-fixed-dim" />
        </div>
        <h2 className="text-xl font-bold text-on-surface" style={{ fontFamily: hanken }}>
          Invite Your Team
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">Add colleagues to your workspace</p>
      </div>
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <Input
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-surface-container/50 border-glass-border text-on-surface placeholder:text-on-surface-variant/50"
              style={{ fontFamily: mono }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMember(); } }}
            />
          </div>
          <Button
            onClick={handleAddMember}
            disabled={!email.trim() || inviting}
            variant="outline"
            className="border-glass-border bg-surface-container/30 text-on-surface hover:bg-surface-variant/30"
          >
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          </Button>
        </div>
        {members.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {members.map((member) => (
              <motion.div
                key={member}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container/30 border border-glass-border"
              >
                <div className="w-7 h-7 rounded-full bg-primary-fixed-dim/10 text-primary-fixed-dim flex items-center justify-center text-xs font-bold">
                  {member.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm flex-1 truncate text-on-surface" style={{ fontFamily: mono }}>{member}</span>
                <button
                  onClick={() => handleRemoveMember(member)}
                  className="text-on-surface-variant hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
        {members.length === 0 && (
          <p className="text-xs text-center text-on-surface-variant py-4">
            No team members added yet. You can skip this step.
          </p>
        )}
        <Separator className="bg-glass-border" />
        <Button
          className="w-full bg-primary-fixed-dim hover:bg-primary-fixed-dim/90 text-on-primary font-semibold glow-cyan"
          style={{ fontFamily: hanken }}
          onClick={handleComplete}
        >
          <Sparkles className="w-4 h-4 mr-2" /> Complete Setup{' '}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
        <Button
          variant="ghost"
          className="w-full text-sm text-on-surface-variant"
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative data-stream-bg radial-bg">
      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(0,220,229,0.06)_0%,transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-5xl"
      >
        <div className="glass-card-strong rounded-2xl p-6 sm:p-8 overflow-hidden">
          {/* Logo + Title */}
          <div className="text-center mb-2">
            <Badge
              variant="outline"
              className="border-primary-fixed-dim/30 bg-primary-fixed-dim/5 text-primary-fixed-dim mb-4"
              style={{ fontFamily: mono }}
            >
              <Shield className="w-3 h-3 mr-1" /> CapsuleFlow AI
            </Badge>
          </div>

          {/* Segment Progress */}
          <SegmentProgress currentStep={step} />

          {/* Step Content */}
          <div className="min-h-[460px] flex items-start justify-center">
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

        {/* Footer Compliance Badges */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-low" />
              </span>
              <span className="text-[10px] text-on-surface-variant" style={{ fontFamily: mono }}>
                AF-SOUTH-1 LATENCY: 12ms
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-primary-fixed-dim" />
              <span className="text-[10px] text-on-surface-variant" style={{ fontFamily: mono }}>
                POPIA & SARS COMPLIANT
              </span>
            </div>
          </div>
          <span className="text-[10px] text-on-surface-variant/60" style={{ fontFamily: mono }}>
            © 2024 CapsuleFlow AI • Autonomous Logistics Engine
          </span>
        </div>
      </motion.div>
    </div>
  );
}
