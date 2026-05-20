'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Inbox, Truck, ClipboardCheck, Brain,
  Moon, Sun, Shield, Menu, X
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppState, type AppScreen } from '@/lib/app-state';
import { getIndustryConfig } from '@/lib/industries';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  screen: AppScreen;
}

const NAV_ITEMS: NavItem[] = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', screen: 'dashboard' },
  { icon: <Inbox className="w-5 h-5" />, label: 'Inbox', screen: 'inbox' },
  { icon: <Truck className="w-5 h-5" />, label: 'Shipments', screen: 'shipment' },
  { icon: <ClipboardCheck className="w-5 h-5" />, label: 'Review Queue', screen: 'review' },
  { icon: <Brain className="w-5 h-5" />, label: 'Nerve Center', screen: 'nerve-center' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentScreen, setCurrentScreen, workspaceName, userRole, workspaceIndustry } = useAppState();
  const { theme, setTheme } = useTheme();

  const roleLabel = userRole === 'ceo' ? 'CEO' : userRole === 'finance' ? 'Finance' : 'Operations';

  const handleNavClick = (screen: AppScreen) => {
    setCurrentScreen(screen);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="w-10 h-10 bg-primary-fixed-dim rounded flex items-center justify-center">
          <Shield className="w-5 h-5 text-on-primary" style={{ color: '#003739' }} />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-primary-fixed-dim leading-none tracking-tighter" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}>
            CapsuleFlow AI
          </h1>
          <p className="text-[10px] font-mono text-on-surface-variant tracking-widest mt-1 uppercase">
            Autonomous Trade
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.screen}
              onClick={() => handleNavClick(item.screen)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-primary font-bold border-r-2 border-primary-fixed-dim bg-surface-variant/30'
                  : 'text-on-surface-variant hover:bg-surface-variant/50 transition-colors'
              }`}
            >
              <span className={isActive ? 'text-primary' : ''}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-4 border-t border-glass-border">
        <button
          className="w-full py-2 px-4 rounded-lg border border-glass-border text-primary-fixed-dim font-mono text-[11px] uppercase tracking-wider hover:bg-surface-variant transition-colors flex items-center justify-center gap-2"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-on-surface-variant text-sm">
            <span className="text-base">👤</span>
            <span className="font-mono text-[11px] uppercase tracking-wider">{roleLabel}</span>
          </div>
          <div className="flex items-center gap-3 text-on-surface-variant text-sm">
            <span className="text-base">{getIndustryConfig(workspaceIndustry).icon}</span>
            <span className="font-mono text-[11px] uppercase tracking-wider">{getIndustryConfig(workspaceIndustry).label.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-3 text-primary-fixed-dim text-sm">
            <span className="text-base">📍</span>
            <span className="font-mono text-[11px] uppercase tracking-wider">South Africa (af-south-1)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass-card-strong border-b border-glass-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => setMobileOpen(true)} className="text-on-surface p-1">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary-fixed-dim" />
          <span className="text-sm font-bold text-primary-fixed-dim" style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui' }}>
            CapsuleFlow AI
          </span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-64 h-full glass-card-strong"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 pt-4">
                <span className="text-sm font-semibold">Navigation</span>
                <button onClick={() => setMobileOpen(false)} className="text-on-surface-variant hover:text-primary p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col glass-card-strong border-r border-glass-border min-h-screen fixed left-0 top-0 z-50">
        <SidebarContent />
      </aside>
    </>
  );
}
