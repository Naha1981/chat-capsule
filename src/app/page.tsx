'use client';

import React from 'react';
import { useAppState } from '@/lib/app-state';

const hanken = 'var(--font-hanken-grotesk), system-ui, sans-serif';
const mono = 'var(--font-jetbrains-mono), ui-monospace, monospace';

export default function Home() {
  const { currentScreen, setCurrentScreen } = useAppState();

  if (currentScreen !== 'landing') {
    // For non-landing screens, show a simple redirect
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-primary" style={{ fontFamily: hanken }}>
            {currentScreen === 'dashboard' ? 'Dashboard' :
             currentScreen === 'inbox' ? 'Document Inbox' :
             currentScreen === 'shipment' ? 'Shipment Timeline' :
             currentScreen === 'review' ? 'Review Queue' :
             currentScreen === 'nerve-center' ? 'Nerve Center' :
             currentScreen === 'onboarding' ? 'Setup' : 'CapsuleFlow AI'}
          </h1>
          <p className="text-on-surface-variant">Loading screen...</p>
          <button
            onClick={() => setCurrentScreen('landing')}
            className="text-sm text-primary-fixed-dim underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-fixed-dim font-bold">CF</div>
            <span className="text-lg font-semibold text-on-surface" style={{ fontFamily: hanken }}>CapsuleFlow AI</span>
          </div>
          <button
            onClick={() => setCurrentScreen('onboarding')}
            className="bg-secondary-container text-on-secondary hover:bg-secondary-container/80 glow-cyan font-semibold text-sm px-5 py-2 rounded-lg"
            style={{ fontFamily: mono }}
          >
            Process Document
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden data-stream-bg bg-grid-pattern pt-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {['10%', '30%', '50%', '70%', '90%'].map((left, i) => (
            <div key={i} className="absolute top-0 w-px h-full opacity-20" style={{ left }}>
              <div className="w-full h-1/3 pulse-line" style={{ background: 'linear-gradient(to bottom, transparent, #00dce5, transparent)', animationDelay: `${i * 0.6}s` }} />
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 text-sm border border-glass-border glass-surface text-secondary-fixed rounded-full" style={{ fontFamily: mono }}>
            <span className="w-2 h-2 rounded-full bg-risk-low animate-subtle-pulse" />
            Autonomous Operations Layer
          </div>

          <h1 className="text-[40px] sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight mb-6" style={{ fontFamily: hanken }}>
            <span className="text-on-surface">Stop the</span>{' '}
            <span className="text-gradient-cyan">Paperwork Tax.</span>
          </h1>

          <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            The first AI swarm designed for the African supply chain. Automate SARS compliance,
            eliminate demurrage, and clear cargo in seconds—not days.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => setCurrentScreen('onboarding')}
              className="px-8 py-6 text-base font-semibold glow-cyan bg-primary-container text-on-primary-fixed hover:bg-primary-container/90 rounded-lg flex items-center gap-2"
            >
              ▶ Start 7-Day Shadow Pilot
            </button>
            <button
              onClick={() => setCurrentScreen('dashboard')}
              className="px-8 py-6 text-base font-semibold border border-glass-border glass-surface text-on-surface hover:bg-glass-surface/80 rounded-lg flex items-center gap-2"
            >
              ↗ View Dashboard
            </button>
          </div>

          {/* Live counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-risk-low animate-subtle-pulse" />
                <span className="text-xs uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: mono }}>Live</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-glow-cyan text-primary-fixed-dim">847</p>
              <p className="text-sm text-on-surface-variant mt-1">Total Mismatches Caught Today</p>
            </div>
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-risk-low animate-subtle-pulse" />
                <span className="text-xs uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: mono }}>Live</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold text-glow-cyan text-primary-fixed-dim">R1.2M</p>
              <p className="text-sm text-on-surface-variant mt-1">Rand Value Saved for Clients</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-on-surface" style={{ fontFamily: hanken }}>
              Operational <span className="text-gradient-cyan">Alpha</span>
            </h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Every manual process is a liability. See the delta.</p>
          </div>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 gap-4 px-4 sm:px-6 py-4 border-b border-glass-border bg-surface-container-high/50">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: mono }}>Logistics Vector</p>
              <p className="text-xs font-semibold text-risk-critical uppercase tracking-widest" style={{ fontFamily: mono }}>⚠ Manual Legacy</p>
              <p className="text-xs font-semibold text-secondary-fixed uppercase tracking-widest" style={{ fontFamily: mono }}>✓ CapsuleFlow AI</p>
            </div>
            {[
              ['SARS Document Prep', '4-6 hours per shipment', '< 30 seconds autonomous'],
              ['Risk Identification', 'Manual spot-checks, reactive', 'Real-time 5-agent analysis'],
              ['Clearing Status', 'Email chains, 24-48hr lag', 'WhatsApp instant push'],
              ['Compliance Overhead', 'R15,000/day demurrage risk', 'Zero demurrage guaranteed'],
            ].map(([label, manual, ai], i) => (
              <div key={label} className={`grid grid-cols-3 gap-4 px-4 sm:px-6 py-4 items-center hover:bg-surface-container-high/30 ${i < 3 ? 'border-b border-glass-border' : ''}`}>
                <p className="text-sm font-medium text-on-surface" style={{ fontFamily: mono }}>{label}</p>
                <p className="text-sm text-risk-critical/70 line-through" style={{ fontFamily: mono }}>{manual}</p>
                <p className="text-sm text-secondary-fixed font-medium" style={{ fontFamily: mono }}>{ai}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-on-surface" style={{ fontFamily: hanken }}>
              Engineered for <span className="text-gradient-cyan">af-south-1</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: '5-Agent Swarm', desc: 'Triage, Extract, Audit, Risk-Assess, Dispatch — all autonomous.' },
              { title: 'WhatsApp Native', desc: 'Receive alerts, approve shipments, track status from WhatsApp.' },
              { title: 'SARS Firewall', desc: 'HS code validation, tariff checks, and compliance — before SARS.' },
              { title: 'POPIA Compliant', desc: 'Data stays in af-south-1. Zero cross-border transfers.' },
              { title: 'Cloud Resilient', desc: 'Multi-zone redundancy with 99.95% uptime SLA.' },
              { title: 'Zero Demurrage', desc: 'Errors caught before port. No R15K/day penalties.' },
            ].map((feat) => (
              <div key={feat.title} className="glass-card rounded-2xl p-6 hover:border-primary-fixed-dim/30 transition-all">
                <h3 className="text-lg font-bold text-on-surface mb-2" style={{ fontFamily: hanken }}>{feat.title}</h3>
                <p className="text-sm text-on-surface-variant">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 relative">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="glass-card rounded-2xl p-8 sm:p-12 relative overflow-hidden glow-cyan">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4 text-on-surface" style={{ fontFamily: hanken }}>
              Ready to Eliminate <span className="text-gradient-cyan">Demurrage</span>?
            </h2>
            <p className="text-on-surface-variant mb-8 max-w-lg mx-auto">Start your 7-day Shadow Pilot today. No credit card. No risk.</p>
            <button
              onClick={() => setCurrentScreen('onboarding')}
              className="px-8 py-6 text-base font-semibold glow-cyan bg-primary-container text-on-primary-fixed hover:bg-primary-container/90 rounded-lg"
            >
              ▶ Deploy Shadow Pilot
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-glass-border py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-on-surface" style={{ fontFamily: hanken }}>CapsuleFlow AI</span>
            <span className="text-xs text-on-surface-variant">&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-risk-low px-2 py-1 border border-risk-low/30 rounded bg-risk-low/5">
              ● af-south-1
            </span>
            <span className="text-[10px] font-mono text-risk-low px-2 py-1 border border-risk-low/30 rounded bg-risk-low/5">
              ● POPIA
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
