'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Zap, Shield, MessageSquare, Lock, ArrowRight, Bot,
  TrendingUp, FileCheck, Clock, CheckCircle, AlertTriangle,
  Sparkles, ChevronRight, Activity, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/lib/app-state';

// ─── Animated Counter Component ─────────────────────────────────
function AnimatedCounter({
  target,
  duration = 2000,
  formatFn,
  label,
}: {
  target: number;
  duration?: number;
  formatFn: (val: number) => string;
  label: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isInView) return;
    if (hasStarted.current) return;
    hasStarted.current = true;

    let startTime: number | null = null;
    let rafId: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration, isInView]);

  return (
    <div ref={ref} className="glass-card rounded-xl p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-subtle-pulse" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Live
        </span>
      </div>
      <p className="text-3xl sm:text-4xl font-bold text-glow-cyan text-primary">
        {formatFn(count)}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

// ─── Data Stream Background ─────────────────────────────────────
function DataStreamBackground() {
  const lines = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${8 + i * 8}%`,
    delay: `${i * 0.25}s`,
    duration: `${2.5 + Math.random() * 2}s`,
    opacity: 0.06 + Math.random() * 0.08,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {lines.map((line) => (
        <div
          key={line.id}
          className="absolute w-px h-full data-stream-line"
          style={{
            left: line.left,
            animationDelay: line.delay,
            animationDuration: line.duration,
            opacity: line.opacity,
            background: 'linear-gradient(to top, transparent, #00e5ff, transparent)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Comparison Table Row ───────────────────────────────────────
interface ComparisonRow {
  label: string;
  manual: string;
  capsuleflow: string;
  icon: React.ReactNode;
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    label: 'Document Intake',
    manual: 'Opens 150 emails/day',
    capsuleflow: '0 Minutes. System investigates 24/7',
    icon: <Mail className="w-4 h-4" />,
  },
  {
    label: 'Data Entry',
    manual: 'Manually types into Excel',
    capsuleflow: '99% Accuracy. <1 second extraction',
    icon: <FileCheck className="w-4 h-4" />,
  },
  {
    label: 'Validation',
    manual: 'Cross-checks on two screens',
    capsuleflow: 'Autonomous. Auditor Agent finds mismatches instantly',
    icon: <Shield className="w-4 h-4" />,
  },
  {
    label: 'Compliance',
    manual: 'Hopes HS codes are correct',
    capsuleflow: 'Digital Firewall. Checks against SARS tariffs',
    icon: <Lock className="w-4 h-4" />,
  },
  {
    label: 'Forwarding',
    manual: 'Forwards Payment Pack manually',
    capsuleflow: 'Auto-Routed. System emails Finance instantly',
    icon: <ArrowRight className="w-4 h-4" />,
  },
  {
    label: 'Cost of Error',
    manual: 'R15,000/day port fees',
    capsuleflow: 'Zero Demurrage. Errors caught before port',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
];

// ─── Feature Cards Data ─────────────────────────────────────────
const FEATURES = [
  {
    title: '5-Agent Swarm',
    description: 'Triage, Extract, Audit, Risk-Assess, Dispatch — all autonomous, all instant.',
    icon: <Bot className="w-6 h-6" />,
    gradient: 'from-cyan-500/20 to-teal-500/20',
  },
  {
    title: 'WhatsApp Native',
    description: 'Receive alerts, approve shipments, and track status — right from WhatsApp.',
    icon: <MessageSquare className="w-6 h-6" />,
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    title: 'SARS Firewall',
    description: 'HS code validation, tariff checks, and compliance — before SARS finds the error.',
    icon: <Shield className="w-6 h-6" />,
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
  {
    title: 'POPIA Compliant',
    description: 'Data stays in af-south-1. Zero cross-border transfers. Full audit trail.',
    icon: <Lock className="w-6 h-6" />,
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
];

// ─── Format Helpers ─────────────────────────────────────────────
function formatZAR(val: number): string {
  if (val >= 1000000) return `R${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `R${(val / 1000).toFixed(0)}K`;
  return `R${val.toLocaleString()}`;
}

function formatInt(val: number): string {
  return val.toLocaleString();
}

// ─── Main Landing Screen ────────────────────────────────────────
export default function LandingScreen() {
  const setCurrentScreen = useAppState((s) => s.setCurrentScreen);

  return (
    <div className="min-h-screen flex flex-col relative bg-background">
      {/* ─── Hero Section ──────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-grid-pattern noise-overlay">
        {/* Data stream background */}
        <DataStreamBackground />

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(0,229,255,0.08)_0%,transparent_70%)] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="outline"
              className="mb-8 px-4 py-1.5 text-sm border-cyan-500/30 bg-cyan-500/5 text-cyan-400"
            >
              <Activity className="w-3.5 h-3.5 mr-1.5 animate-subtle-pulse" />
              Autonomous Operations Layer for Trade &amp; Logistics
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6"
          >
            Stop the{' '}
            <span className="text-gradient-cyan-violet">Paperwork Tax</span>.
            <br />
            Deploy your{' '}
            <span className="text-gradient-cyan-violet">Autonomous Operations Swarm</span>{' '}
            Today.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Purpose-built autonomous AI for South African import logistics, mine development, and
            crude oil operations. Your 5-agent swarm investigates, extracts, audits, and dispatches
            — so you never pay demurrage again.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button
              size="lg"
              className="px-8 py-6 text-base font-semibold glow-cyan bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setCurrentScreen('onboarding')}
            >
              <Zap className="w-5 h-5 mr-2" />
              Start 7-Day Shadow Pilot
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-base font-semibold border-cyan-500/30 hover:bg-cyan-500/5 text-cyan-400"
              onClick={() => setCurrentScreen('onboarding')}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Calculate Your Demurrage Risk
            </Button>
          </motion.div>

          {/* Live Counters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto"
          >
            <AnimatedCounter
              target={847}
              duration={2500}
              formatFn={formatInt}
              label="Total Mismatches Caught Today"
            />
            <AnimatedCounter
              target={1247000}
              duration={3000}
              formatFn={formatZAR}
              label="Rand Value Saved for Clients"
            />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border border-muted-foreground/30 flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-primary/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Comparison Table Section ─────────────────────────── */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4 border-violet-500/30 bg-violet-500/5 text-violet-400">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Time is Money
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Manual vs{' '}
              <span className="text-gradient-cyan">CapsuleFlow</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Every minute your team spends on manual data entry is a minute closer to demurrage fees.
            </p>
          </motion.div>

          {/* Table */}
          <div className="glass-card-strong rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-4 px-4 sm:px-6 py-4 border-b border-border/50 bg-muted/20">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Process
              </p>
              <p className="text-sm font-semibold text-red-400/80 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Manual
              </p>
              <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                CapsuleFlow
              </p>
            </div>

            {/* Rows */}
            {COMPARISON_DATA.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={`grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[180px_1fr_1fr] gap-4 px-4 sm:px-6 py-4 items-center ${
                  i < COMPARISON_DATA.length - 1 ? 'border-b border-border/30' : ''
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-primary/70">{row.icon}</span>
                  {row.label}
                </div>
                <p className="text-sm text-red-400/70 line-through decoration-red-500/30">
                  {row.manual}
                </p>
                <p className="text-sm text-emerald-400 font-medium">{row.capsuleflow}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Cards Section ────────────────────────────── */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4 border-cyan-500/30 bg-cyan-500/5 text-cyan-400">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Built Different
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why CapsuleFlow{' '}
              <span className="text-gradient-cyan-violet">Stands Apart</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Not another dashboard. An autonomous operations layer that works while you sleep.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <Card className="group relative overflow-hidden hover:border-primary/30 transition-all duration-300 h-full glass-card border-border/30">
                  {/* Gradient background on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />
                  <CardContent className="relative z-10 p-6">
                    <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 text-primary group-hover:glow-cyan transition-all duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────────── */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="glass-card-strong rounded-2xl p-8 sm:p-12 gradient-border"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to{' '}
              <span className="text-gradient-cyan-violet">Eliminate Demurrage</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Start your 7-day Shadow Pilot today. No credit card. No risk. Just results.
            </p>
            <Button
              size="lg"
              className="px-8 py-6 text-base font-semibold glow-cyan bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setCurrentScreen('onboarding')}
            >
              <Zap className="w-5 h-5 mr-2" />
              Start 7-Day Shadow Pilot
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border/30 py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            CapsuleFlow AI v1.0 | af-south-1 | POPIA Compliant
          </p>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/5 text-emerald-400">
              <Lock className="w-2.5 h-2.5 mr-1" />
              POPIA Compliant
            </Badge>
            <Badge variant="outline" className="text-[10px] border-cyan-500/30 bg-cyan-500/5 text-cyan-400">
              af-south-1
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
