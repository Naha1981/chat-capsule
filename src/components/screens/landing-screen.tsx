'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Zap, Shield, MessageSquare, Lock, ArrowRight, Bot,
  TrendingUp, FileCheck, Clock, CheckCircle, AlertTriangle,
  Sparkles, ChevronRight, Activity, Mail, Menu, X,
  Network, Cloud, CircleDollarSign
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
        <div className="w-2 h-2 rounded-full bg-risk-low animate-subtle-pulse" />
        <span className="text-xs uppercase tracking-wider text-on-surface-variant font-medium"
          style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
        >
          Live
        </span>
      </div>
      <p className="text-3xl sm:text-4xl font-bold text-glow-cyan text-primary-fixed-dim">
        {formatFn(count)}
      </p>
      <p className="text-sm text-on-surface-variant mt-1">{label}</p>
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
            background: 'linear-gradient(to top, transparent, #00dce5, transparent)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Pulse Lines (5 vertical animated lines) ───────────────────
function PulseLines() {
  const positions = ['10%', '30%', '50%', '70%', '90%'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {positions.map((left, i) => (
        <div
          key={i}
          className="absolute top-0 w-px h-full opacity-20"
          style={{ left }}
        >
          <div
            className="w-full h-1/3 pulse-line"
            style={{
              background: 'linear-gradient(to bottom, transparent, #00dce5, transparent)',
              animationDelay: `${i * 0.6}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Comparison Table Data ──────────────────────────────────────
interface ComparisonRow {
  label: string;
  manual: string;
  capsuleflow: string;
  icon: React.ReactNode;
}

const COMPARISON_DATA: ComparisonRow[] = [
  {
    label: 'SARS Document Prep',
    manual: '4-6 hours per shipment',
    capsuleflow: '< 30 seconds autonomous',
    icon: <FileCheck className="w-4 h-4" />,
  },
  {
    label: 'Risk Identification',
    manual: 'Manual spot-checks, reactive',
    capsuleflow: 'Real-time 5-agent analysis',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  {
    label: 'Clearing Status Updates',
    manual: 'Email chains, 24-48hr lag',
    capsuleflow: 'WhatsApp instant push',
    icon: <Activity className="w-4 h-4" />,
  },
  {
    label: 'Compliance Overhead',
    manual: 'R15,000/day demurrage risk',
    capsuleflow: 'Zero demurrage guaranteed',
    icon: <Shield className="w-4 h-4" />,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'SOLUTIONS', href: '#comparison' },
    { label: 'INFRASTRUCTURE', href: '#features' },
    { label: 'COMPLIANCE', href: '#cta' },
  ];

  return (
    <div className="min-h-screen flex flex-col relative bg-background">
      {/* ─── Fixed Top Navigation ──────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-fixed-dim" />
              </div>
              <span
                className="text-lg font-semibold text-on-surface"
                style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
              >
                CapsuleFlow AI
              </span>
            </div>

            {/* Center Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary-fixed-dim transition-colors duration-200"
                  style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTA Button - Desktop */}
            <div className="hidden md:block">
              <Button
                className="bg-secondary-container text-on-secondary hover:bg-secondary-container/80 glow-cyan font-semibold text-sm px-5 py-2"
                style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                onClick={() => setCurrentScreen('onboarding')}
              >
                Process Document
              </Button>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden pb-4 border-t border-glass-border mt-2 pt-4"
            >
              <div className="flex flex-col gap-3">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary-fixed-dim transition-colors py-2"
                    style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                <Button
                  className="bg-secondary-container text-on-secondary hover:bg-secondary-container/80 glow-cyan font-semibold text-sm w-full mt-2"
                  style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                  onClick={() => { setMobileMenuOpen(false); setCurrentScreen('onboarding'); }}
                >
                  Process Document
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* ─── Hero Section ──────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden data-stream-bg bg-grid-pattern noise-overlay pt-16">
        {/* Data stream background */}
        <DataStreamBackground />

        {/* Pulse Lines */}
        <PulseLines />

        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(ellipse_at_center,rgba(0,220,229,0.08)_0%,transparent_70%)] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="outline"
              className="mb-8 px-4 py-1.5 text-sm border-glass-border glass-surface text-secondary-fixed"
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-low" />
              </span>
              Autonomous Operations Layer
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-[40px] sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
          >
            <span className="text-on-surface">Stop the</span>{' '}
            <span className="text-gradient-cyan">Paperwork Tax.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The first AI swarm designed for the African supply chain. Automate SARS compliance,
            eliminate demurrage, and clear cargo in seconds—not days.
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
              className="px-8 py-6 text-base font-semibold glow-cyan bg-primary-container text-on-primary-fixed hover:bg-primary-container/90"
              onClick={() => setCurrentScreen('onboarding')}
            >
              <Zap className="w-5 h-5 mr-2" />
              Start 7-Day Shadow Pilot
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-base font-semibold border-glass-border glass-surface text-on-surface hover:bg-glass-surface/80"
              onClick={() => setCurrentScreen('onboarding')}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              View Network Architecture
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
          <span
            className="text-xs text-on-surface-variant uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
          >
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border border-glass-border flex items-start justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-primary-fixed-dim/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Comparison Table Section ─────────────────────────── */}
      <section id="comparison" className="py-20 sm:py-28 relative">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4 text-on-surface"
              style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
            >
              Operational <span className="text-gradient-cyan">Alpha</span>
            </h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">
              Every manual process is a liability. See the delta.
            </p>
          </motion.div>

          {/* Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Header */}
            <div
              className="grid grid-cols-3 gap-4 px-4 sm:px-6 py-4 border-b border-glass-border bg-surface-container-high/50"
            >
              <p
                className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest"
                style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                Logistics Vector
              </p>
              <p
                className="text-xs font-semibold text-risk-critical uppercase tracking-widest flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Manual Legacy
              </p>
              <p
                className="text-xs font-semibold text-secondary-fixed uppercase tracking-widest flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                CapsuleFlow AI
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
                className={`grid grid-cols-3 gap-4 px-4 sm:px-6 py-4 items-center transition-colors duration-200 hover:bg-surface-container-high/30 ${
                  i < COMPARISON_DATA.length - 1 ? 'border-b border-glass-border' : ''
                }`}
              >
                <div
                  className="flex items-center gap-2 text-sm font-medium text-on-surface"
                  style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  <span className="text-primary-fixed-dim">{row.icon}</span>
                  {row.label}
                </div>
                <p
                  className="text-sm text-risk-critical/70 line-through decoration-risk-critical/30"
                  style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {row.manual}
                </p>
                <p
                  className="text-sm text-secondary-fixed font-medium"
                  style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  {row.capsuleflow}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bento Grid Features Section ──────────────────────── */}
      <section id="features" className="py-20 sm:py-28 relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4 text-on-surface"
              style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
            >
              Engineered for{' '}
              <span className="text-gradient-cyan">af-south-1</span>
            </h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">
              Purpose-built infrastructure for African trade logistics.
            </p>
          </motion.div>

          {/* Bento Grid - 12 column layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Large main card - 7 cols */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-7 glass-card rounded-2xl overflow-hidden group hover:border-primary-fixed-dim/30 transition-all duration-300"
            >
              <div className="relative h-full p-6 sm:p-8 flex flex-col">
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-container to-secondary-container rounded-l-2xl" />
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-primary-container/10 text-primary-fixed-dim group-hover:glow-cyan transition-all duration-300">
                    <Network className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className="text-xl font-bold text-on-surface mb-1"
                      style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
                    >
                      5-Agent Swarm Intelligence
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      Triage, Extract, Audit, Risk-Assess, Dispatch — all autonomous, all instant.
                    </p>
                  </div>
                </div>
                {/* Neural network image placeholder */}
                <div className="flex-1 min-h-[160px] rounded-xl bg-surface-container-high/50 border border-glass-border flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,245,255,0.08)_0%,transparent_50%),radial-gradient(circle_at_70%_60%,rgba(3,198,178,0.06)_0%,transparent_50%)]" />
                  {/* Animated node visualization */}
                  <div className="relative w-full h-full flex items-center justify-center p-6">
                    <svg viewBox="0 0 200 100" className="w-full max-w-[280px] opacity-60">
                      {/* Hub node */}
                      <circle cx="100" cy="50" r="8" fill="#00f5ff" opacity="0.8">
                        <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
                      </circle>
                      {/* Agent nodes */}
                      <circle cx="40" cy="20" r="5" fill="#62fae3" opacity="0.6" />
                      <circle cx="160" cy="20" r="5" fill="#62fae3" opacity="0.6" />
                      <circle cx="40" cy="80" r="5" fill="#62fae3" opacity="0.6" />
                      <circle cx="160" cy="80" r="5" fill="#62fae3" opacity="0.6" />
                      <circle cx="100" cy="10" r="5" fill="#62fae3" opacity="0.6" />
                      {/* Connections */}
                      <line x1="100" y1="50" x2="40" y2="20" stroke="#00dce5" strokeWidth="0.5" opacity="0.4" />
                      <line x1="100" y1="50" x2="160" y2="20" stroke="#00dce5" strokeWidth="0.5" opacity="0.4" />
                      <line x1="100" y1="50" x2="40" y2="80" stroke="#00dce5" strokeWidth="0.5" opacity="0.4" />
                      <line x1="100" y1="50" x2="160" y2="80" stroke="#00dce5" strokeWidth="0.5" opacity="0.4" />
                      <line x1="100" y1="50" x2="100" y2="10" stroke="#00dce5" strokeWidth="0.5" opacity="0.4" />
                      {/* Cross connections */}
                      <line x1="40" y1="20" x2="160" y2="20" stroke="#03c6b2" strokeWidth="0.3" opacity="0.2" />
                      <line x1="40" y1="80" x2="160" y2="80" stroke="#03c6b2" strokeWidth="0.3" opacity="0.2" />
                      <line x1="40" y1="20" x2="40" y2="80" stroke="#03c6b2" strokeWidth="0.3" opacity="0.2" />
                      <line x1="160" y1="20" x2="160" y2="80" stroke="#03c6b2" strokeWidth="0.3" opacity="0.2" />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right side cards - 5 cols, stacked */}
            <div className="md:col-span-5 flex flex-col gap-4">
              {/* WhatsApp Native */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="glass-card rounded-2xl p-6 group hover:border-primary-fixed-dim/30 transition-all duration-300 flex-1"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-fixed rounded-l-2xl" style={{ position: 'relative' }}>
                  <div className="w-1 h-full bg-secondary-fixed rounded-l-2xl absolute left-0 top-0" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-secondary-container/10 text-secondary-fixed group-hover:glow-cyan transition-all duration-300">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-bold text-on-surface mb-1"
                      style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
                    >
                      WhatsApp Native
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      Receive alerts, approve shipments, and track status — right from WhatsApp.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* SARS Firewall */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-card rounded-2xl p-6 group hover:border-primary-fixed-dim/30 transition-all duration-300 flex-1"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary-container/10 text-primary-fixed-dim group-hover:glow-cyan transition-all duration-300">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3
                      className="text-lg font-bold text-on-surface mb-1"
                      style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
                    >
                      SARS Firewall
                    </h3>
                    <p className="text-sm text-on-surface-variant">
                      HS code validation, tariff checks, and compliance — before SARS finds the error.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Three small cards - 4 cols each */}
            {/* POPIA Compliant */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="md:col-span-4 glass-card rounded-2xl p-6 group hover:border-primary-fixed-dim/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-risk-low rounded-l-2xl" />
              <div className="pl-3">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="w-5 h-5 text-risk-low" />
                  <h3
                    className="text-base font-bold text-on-surface"
                    style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
                  >
                    POPIA Compliant
                  </h3>
                </div>
                <p className="text-sm text-on-surface-variant">
                  Data stays in af-south-1. Zero cross-border transfers. Full audit trail.
                </p>
              </div>
            </motion.div>

            {/* Cloud Resilient */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="md:col-span-4 glass-card rounded-2xl p-6 group hover:border-primary-fixed-dim/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-fixed-dim rounded-l-2xl" />
              <div className="pl-3">
                <div className="flex items-center gap-3 mb-3">
                  <Cloud className="w-5 h-5 text-primary-fixed-dim" />
                  <h3
                    className="text-base font-bold text-on-surface"
                    style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
                  >
                    Cloud Resilient
                  </h3>
                </div>
                <p className="text-sm text-on-surface-variant">
                  Multi-zone redundancy with 99.95% uptime SLA. Built on AWS af-south-1.
                </p>
              </div>
            </motion.div>

            {/* Zero Demurrage */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="md:col-span-4 glass-card rounded-2xl p-6 group hover:border-primary-fixed-dim/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-fixed rounded-l-2xl" />
              <div className="pl-3">
                <div className="flex items-center gap-3 mb-3">
                  <CircleDollarSign className="w-5 h-5 text-secondary-fixed" />
                  <h3
                    className="text-base font-bold text-on-surface"
                    style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
                  >
                    Zero Demurrage
                  </h3>
                </div>
                <p className="text-sm text-on-surface-variant">
                  Errors caught before port. No R15K/day penalties. Guaranteed.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────────── */}
      <section id="cta" className="py-20 sm:py-28 relative">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="glass-card rounded-2xl p-8 sm:p-12 relative overflow-hidden glow-cyan"
          >
            {/* Gradient blurs */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <h2
                className="text-2xl sm:text-4xl font-bold mb-4 text-on-surface"
                style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
              >
                Ready to Eliminate{' '}
                <span className="text-gradient-cyan">Demurrage</span>?
              </h2>
              <p className="text-on-surface-variant mb-8 max-w-lg mx-auto">
                Start your 7-day Shadow Pilot today. No credit card. No risk. Just results.
              </p>
              <Button
                size="lg"
                className="px-8 py-6 text-base font-semibold glow-cyan bg-primary-container text-on-primary-fixed hover:bg-primary-container/90 mb-6"
                onClick={() => setCurrentScreen('onboarding')}
              >
                <Zap className="w-5 h-5 mr-2" />
                Deploy Shadow Pilot
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="px-3 py-1 text-xs border-glass-border glass-surface text-on-surface-variant"
                  style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
                >
                  <Lock className="w-3 h-3 mr-1.5" />
                  LOCKED_FOR_AF-SOUTH-1
                </Badge>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-glass-border py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold text-on-surface"
              style={{ fontFamily: 'var(--font-hanken-grotesk)' }}
            >
              CapsuleFlow AI
            </span>
            <span className="text-xs text-on-surface-variant">
              &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">Privacy</a>
            <a href="#" className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">Legal</a>
            <a href="#" className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">Infrastructure</a>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="text-[10px] border-risk-low/30 bg-risk-low/5 text-risk-low"
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              <span className="relative flex h-1.5 w-1.5 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-risk-low" />
              </span>
              af-south-1
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] border-risk-low/30 bg-risk-low/5 text-risk-low"
              style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
            >
              <span className="relative flex h-1.5 w-1.5 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-risk-low" />
              </span>
              POPIA
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
