'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Zap, Shield, MessageSquare, Lock, ArrowRight,
  TrendingUp, FileCheck, CheckCircle, AlertTriangle,
  ChevronRight, Network, Cloud, CircleDollarSign, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/lib/app-state';

const hanken = 'var(--font-hanken-grotesk), system-ui, sans-serif';
const mono = 'var(--font-jetbrains-mono), ui-monospace, monospace';

// ─── Animated Counter (CSS-only, no framer-motion) ───────────────
function AnimatedCounter({ target, duration = 2000, formatFn, label }: {
  target: number; duration?: number; formatFn: (val: number) => string; label: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let startTime: number | null = null;
        const step = (ts: number) => {
          if (!startTime) startTime = ts;
          const progress = Math.min((ts - startTime) / duration, 1);
          setCount(Math.floor((1 - Math.pow(1 - progress, 3)) * target));
          if (progress < 1) requestAnimationFrame(step);
          else setCount(target);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref} className="glass-card rounded-xl p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-risk-low animate-subtle-pulse" />
        <span className="text-xs uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: mono }}>Live</span>
      </div>
      <p className="text-3xl sm:text-4xl font-bold text-glow-cyan text-primary-fixed-dim">{formatFn(count)}</p>
      <p className="text-sm text-on-surface-variant mt-1">{label}</p>
    </div>
  );
}

// ─── Comparison Data ─────────────────────────────────────────────
const COMPARISON = [
  { label: 'SARS Document Prep', manual: '4-6 hours per shipment', ai: '< 30 seconds autonomous', icon: <FileCheck className="w-4 h-4" /> },
  { label: 'Risk Identification', manual: 'Manual spot-checks, reactive', ai: 'Real-time 5-agent analysis', icon: <AlertTriangle className="w-4 h-4" /> },
  { label: 'Clearing Status Updates', manual: 'Email chains, 24-48hr lag', ai: 'WhatsApp instant push', icon: <Zap className="w-4 h-4" /> },
  { label: 'Compliance Overhead', manual: 'R15,000/day demurrage risk', ai: 'Zero demurrage guaranteed', icon: <Shield className="w-4 h-4" /> },
];

// ─── Bento Features ─────────────────────────────────────────────
const FEATURES = [
  { icon: <Network className="w-6 h-6" />, title: '5-Agent Swarm Intelligence', desc: 'Triage, Extract, Audit, Risk-Assess, Dispatch — all autonomous, all instant.', span: 'md:col-span-7', accent: 'bg-primary-container' },
  { icon: <MessageSquare className="w-6 h-6" />, title: 'WhatsApp Native', desc: 'Receive alerts, approve shipments, and track status — right from WhatsApp.', span: 'md:col-span-5', accent: 'bg-secondary-container' },
  { icon: <Shield className="w-6 h-6" />, title: 'SARS Firewall', desc: 'HS code validation, tariff checks, and compliance — before SARS finds the error.', span: 'md:col-span-5', accent: 'bg-primary-container' },
  { icon: <Lock className="w-5 h-5" />, title: 'POPIA Compliant', desc: 'Data stays in af-south-1. Zero cross-border transfers. Full audit trail.', span: 'md:col-span-4', accent: 'bg-risk-low' },
  { icon: <Cloud className="w-5 h-5" />, title: 'Cloud Resilient', desc: 'Multi-zone redundancy with 99.95% uptime SLA. Built on AWS af-south-1.', span: 'md:col-span-4', accent: 'bg-primary-fixed-dim' },
  { icon: <CircleDollarSign className="w-5 h-5" />, title: 'Zero Demurrage', desc: 'Errors caught before port. No R15K/day penalties. Guaranteed.', span: 'md:col-span-4', accent: 'bg-secondary-fixed' },
];

function formatZAR(val: number): string {
  if (val >= 1000000) return `R${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `R${(val / 1000).toFixed(0)}K`;
  return `R${val.toLocaleString()}`;
}
function formatInt(val: number): string { return val.toLocaleString(); }

// ─── Main Landing Screen (No framer-motion - CSS only) ──────────
export default function LandingScreen() {
  const setCurrentScreen = useAppState((s) => s.setCurrentScreen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative bg-background">
      {/* ─── Fixed Top Navigation ──────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-fixed-dim" />
              </div>
              <span className="text-lg font-semibold text-on-surface" style={{ fontFamily: hanken }}>CapsuleFlow AI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {['SOLUTIONS', 'INFRASTRUCTURE', 'COMPLIANCE'].map((label) => (
                <a key={label} href={`#${label.toLowerCase()}`} className="text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary-fixed-dim transition-colors" style={{ fontFamily: mono }}>{label}</a>
              ))}
            </div>
            <div className="hidden md:block">
              <Button className="bg-secondary-container text-on-secondary hover:bg-secondary-container/80 glow-cyan font-semibold text-sm px-5 py-2" style={{ fontFamily: mono }} onClick={() => setCurrentScreen('onboarding')}>Process Document</Button>
            </div>
            <button className="md:hidden text-on-surface-variant" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-glass-border mt-2 pt-4 flex flex-col gap-3">
              <Button className="bg-secondary-container text-on-secondary hover:bg-secondary-container/80 glow-cyan font-semibold text-sm w-full" style={{ fontFamily: mono }} onClick={() => { setMobileMenuOpen(false); setCurrentScreen('onboarding'); }}>Process Document</Button>
            </div>
          )}
        </div>
      </nav>

      {/* ─── Hero Section ──────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden data-stream-bg bg-grid-pattern noise-overlay pt-16">
        {/* Pulse Lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {['10%', '30%', '50%', '70%', '90%'].map((left, i) => (
            <div key={i} className="absolute top-0 w-px h-full opacity-20" style={{ left }}>
              <div className="w-full h-1/3 pulse-line" style={{ background: 'linear-gradient(to bottom, transparent, #00dce5, transparent)', animationDelay: `${i * 0.6}s` }} />
            </div>
          ))}
        </div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(ellipse_at_center,rgba(0,220,229,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center animate-[fadeInUp_0.6s_ease-out]">
          <Badge variant="outline" className="mb-8 px-4 py-1.5 text-sm border-glass-border glass-surface text-secondary-fixed" style={{ fontFamily: mono }}>
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-risk-low" />
            </span>
            Autonomous Operations Layer
          </Badge>

          <h1 className="text-[40px] sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6" style={{ fontFamily: hanken }}>
            <span className="text-on-surface">Stop the</span>{' '}
            <span className="text-gradient-cyan">Paperwork Tax.</span>
          </h1>

          <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            The first AI swarm designed for the African supply chain. Automate SARS compliance,
            eliminate demurrage, and clear cargo in seconds—not days.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" className="px-8 py-6 text-base font-semibold glow-cyan bg-primary-container text-on-primary-fixed hover:bg-primary-container/90" onClick={() => setCurrentScreen('onboarding')}>
              <Zap className="w-5 h-5 mr-2" />Start 7-Day Shadow Pilot<ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-base font-semibold border-glass-border glass-surface text-on-surface hover:bg-glass-surface/80" onClick={() => setCurrentScreen('onboarding')}>
              <TrendingUp className="w-5 h-5 mr-2" />View Network Architecture
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <AnimatedCounter target={847} duration={2500} formatFn={formatInt} label="Total Mismatches Caught Today" />
            <AnimatedCounter target={1247000} duration={3000} formatFn={formatZAR} label="Rand Value Saved for Clients" />
          </div>
        </div>
      </section>

      {/* ─── Comparison Table ──────────────────────────────────── */}
      <section id="solutions" className="py-20 sm:py-28 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-on-surface" style={{ fontFamily: hanken }}>Operational <span className="text-gradient-cyan">Alpha</span></h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Every manual process is a liability. See the delta.</p>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 gap-4 px-4 sm:px-6 py-4 border-b border-glass-border bg-surface-container-high/50">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: mono }}>Logistics Vector</p>
              <p className="text-xs font-semibold text-risk-critical uppercase tracking-widest flex items-center gap-1.5" style={{ fontFamily: mono }}><AlertTriangle className="w-3.5 h-3.5" />Manual Legacy</p>
              <p className="text-xs font-semibold text-secondary-fixed uppercase tracking-widest flex items-center gap-1.5" style={{ fontFamily: mono }}><CheckCircle className="w-3.5 h-3.5" />CapsuleFlow AI</p>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.label} className={`grid grid-cols-3 gap-4 px-4 sm:px-6 py-4 items-center hover:bg-surface-container-high/30 transition-colors ${i < COMPARISON.length - 1 ? 'border-b border-glass-border' : ''}`}>
                <div className="flex items-center gap-2 text-sm font-medium text-on-surface" style={{ fontFamily: mono }}><span className="text-primary-fixed-dim">{row.icon}</span>{row.label}</div>
                <p className="text-sm text-risk-critical/70 line-through decoration-risk-critical/30" style={{ fontFamily: mono }}>{row.manual}</p>
                <p className="text-sm text-secondary-fixed font-medium" style={{ fontFamily: mono }}>{row.ai}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bento Grid Features ──────────────────────────────── */}
      <section id="infrastructure" className="py-20 sm:py-28 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-on-surface" style={{ fontFamily: hanken }}>Engineered for <span className="text-gradient-cyan">af-south-1</span></h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Purpose-built infrastructure for African trade logistics.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {FEATURES.map((feat) => (
              <div key={feat.title} className={`${feat.span} glass-card rounded-2xl p-6 group hover:border-primary-fixed-dim/30 transition-all duration-300 relative overflow-hidden`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${feat.accent} rounded-l-2xl`} />
                <div className="pl-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary-container/10 text-primary-fixed-dim">{feat.icon}</div>
                    <h3 className="text-lg font-bold text-on-surface" style={{ fontFamily: hanken }}>{feat.title}</h3>
                  </div>
                  <p className="text-sm text-on-surface-variant">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────────── */}
      <section id="compliance" className="py-20 sm:py-28 relative">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="glass-card rounded-2xl p-8 sm:p-12 relative overflow-hidden glow-cyan">
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-on-surface" style={{ fontFamily: hanken }}>Ready to Eliminate <span className="text-gradient-cyan">Demurrage</span>?</h2>
              <p className="text-on-surface-variant mb-8 max-w-lg mx-auto">Start your 7-day Shadow Pilot today. No credit card. No risk. Just results.</p>
              <Button size="lg" className="px-8 py-6 text-base font-semibold glow-cyan bg-primary-container text-on-primary-fixed hover:bg-primary-container/90 mb-6" onClick={() => setCurrentScreen('onboarding')}>
                <Zap className="w-5 h-5 mr-2" />Deploy Shadow Pilot<ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <div className="flex justify-center">
                <Badge variant="outline" className="px-3 py-1 text-xs border-glass-border glass-surface text-on-surface-variant" style={{ fontFamily: mono }}>
                  <Lock className="w-3 h-3 mr-1.5" />LOCKED_FOR_AF-SOUTH-1
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-glass-border py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-on-surface" style={{ fontFamily: hanken }}>CapsuleFlow AI</span>
            <span className="text-xs text-on-surface-variant">&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">Privacy</a>
            <a href="#" className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">Legal</a>
            <a href="#" className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">Infrastructure</a>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] border-risk-low/30 bg-risk-low/5 text-risk-low" style={{ fontFamily: mono }}>
              <span className="relative flex h-1.5 w-1.5 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-risk-low" /></span>af-south-1
            </Badge>
            <Badge variant="outline" className="text-[10px] border-risk-low/30 bg-risk-low/5 text-risk-low" style={{ fontFamily: mono }}>
              <span className="relative flex h-1.5 w-1.5 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-risk-low opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-risk-low" /></span>POPIA
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
