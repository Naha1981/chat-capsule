'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Inbox, Truck, ClipboardCheck, Brain,
  Moon, Sun, Shield, Menu, X
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppState, type AppScreen } from '@/lib/app-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  screen: AppScreen;
}

const NAV_ITEMS: NavItem[] = [
  { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', screen: 'dashboard' },
  { icon: <Inbox className="w-5 h-5" />, label: 'Document Inbox', screen: 'inbox' },
  { icon: <Truck className="w-5 h-5" />, label: 'Shipments', screen: 'shipment' },
  { icon: <ClipboardCheck className="w-5 h-5" />, label: 'Review Queue', screen: 'review' },
  { icon: <Brain className="w-5 h-5" />, label: 'Nerve Center', screen: 'nerve-center' },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { currentScreen, setCurrentScreen, workspaceName, userRole } = useAppState();
  const { theme, setTheme } = useTheme();

  const roleLabel = userRole === 'ceo' ? 'CEO' : userRole === 'finance' ? 'Finance' : 'Operations';
  const roleColor = userRole === 'ceo'
    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
    : userRole === 'finance'
    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400';

  const handleNavClick = (screen: AppScreen) => {
    setCurrentScreen(screen);
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center glow-cyan">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gradient-cyan">CapsuleFlow</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Platform</span>
        </div>
      </div>

      <Separator className="bg-border/30" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <motion.button
              key={item.screen}
              onClick={() => handleNavClick(item.screen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary glow-cyan'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={isActive ? 'text-primary' : ''}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      <Separator className="bg-border/30" />

      {/* Footer */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-foreground truncate">{workspaceName}</span>
          <Badge variant="outline" className={`w-fit text-[10px] ${roleColor}`}>
            {roleLabel}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="text-xs">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </Button>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 glass-card-strong border-b border-border/30 px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="text-foreground">
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-gradient-cyan">CapsuleFlow</span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
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
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </motion.div>
        </motion.div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col glass-card-strong border-r border-border/30 min-h-screen">
        <SidebarContent />
      </aside>
    </>
  );
}
