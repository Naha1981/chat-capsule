'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, AlertTriangle, AlertCircle, ChevronDown,
  ChevronUp, Upload, Loader2, XCircle, Filter,
  Shield, FileText, Clock, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import AppSidebar from '@/components/shared/app-sidebar';
import { useAppState } from '@/lib/app-state';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────
type AlertLevel = 'green' | 'orange' | 'red';

interface ReviewItem {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
  financialImpact?: string;
  shipmentRef: string;
  category: string;
  timestamp: string;
  // Expandable detail
  expected?: string;
  actual?: string;
  aiRecommendation?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────
const REVIEW_ITEMS: ReviewItem[] = [
  {
    id: 'r1',
    level: 'red',
    title: 'Weight Mismatch! BoL: 28T vs Invoice: 27.5T',
    description: 'Bill of Lading declares 28,000 KG but the Commercial Invoice shows 27,500 KG — a 500KG variance.',
    financialImpact: 'R8,500',
    shipmentRef: 'SHP-2025-0042',
    category: 'Weight Variance',
    timestamp: '2 min ago',
    expected: '28,000 KG (BoL)',
    actual: '27,500 KG (Invoice)',
    aiRecommendation: 'Flag for audit. 500KG variance exceeds 1% threshold. Potential customs amendment fee + variance penalty.',
  },
  {
    id: 'r2',
    level: 'red',
    title: 'Bank Account mismatch — potential fraud',
    description: 'The bank account on Invoice INV-882 does not match the verified account in our database for Global Trade (Pty) Ltd.',
    financialImpact: 'R245,000',
    shipmentRef: 'SHP-2025-0039',
    category: 'Fraud Risk',
    timestamp: '5 min ago',
    expected: 'Standard Bank Acc: 0123456789',
    actual: 'FNB Acc: 62781234567',
    aiRecommendation: 'Do NOT approve payment. Bank account has changed since last verified. Contact supplier directly to confirm.',
  },
  {
    id: 'r3',
    level: 'orange',
    title: 'Missing Packing List for SHP-2025-0042',
    description: 'The Packing List is required for customs clearance but has not been uploaded yet.',
    shipmentRef: 'SHP-2025-0042',
    category: 'Missing Document',
    timestamp: '3 min ago',
    aiRecommendation: 'Request Packing List from supplier via WhatsApp. Estimated 1 day delay = R15,000 port demurrage risk.',
  },
  {
    id: 'r4',
    level: 'orange',
    title: 'HS Code 2601.11 may not match commodity description',
    description: 'HS Code 2601.11.00 (Manganese Ore) may not align with the commodity description on the SAD500.',
    shipmentRef: 'SHP-2025-0042',
    category: 'Compliance',
    timestamp: '4 min ago',
    expected: '2602.00 (Manganese Ore, HS Chapter 26)',
    actual: '2601.11.00 (Filed on Invoice)',
    aiRecommendation: 'Verify HS Code with customs broker. Incorrect classification could result in SARS misdeclaration fine of up to R20,000.',
  },
  {
    id: 'r5',
    level: 'green',
    title: 'Invoice INV-882 — All fields match',
    description: 'R45,000 verified. All extracted fields match across documents.',
    financialImpact: 'R45,000',
    shipmentRef: 'SHP-2025-0037',
    category: 'Verified',
    timestamp: '8 min ago',
  },
  {
    id: 'r6',
    level: 'green',
    title: 'Packing List PL-229 — Weight confirmed',
    description: 'No action needed. Weight matches BoL and Invoice.',
    shipmentRef: 'SHP-2025-0035',
    category: 'Verified',
    timestamp: '12 min ago',
  },
];

// ─── Filter Types ─────────────────────────────────────────────────
type FilterMode = 'all' | 'orange' | 'red';

// ─── Review Card ──────────────────────────────────────────────────
function ReviewCard({
  item,
  isSelected,
  onToggleSelect,
  isExpanded,
  onToggleExpand,
  onConfirm,
  onReject,
  onAction,
}: {
  item: ReviewItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onConfirm: () => void;
  onReject: () => void;
  onAction: (action: 'review' | 'skip' | 'review_now' | 'approve_anyway') => void;
}) {
  const levelConfig = {
    green: {
      borderClass: 'border-l-risk-low',
      bgClass: 'bg-risk-low/5',
      icon: <CheckCircle className="w-5 h-5 text-risk-low" />,
      titleColor: 'text-risk-low',
      opacity: 'opacity-70',
      pulseClass: '',
    },
    orange: {
      borderClass: 'border-l-risk-high',
      bgClass: 'bg-risk-high/5',
      icon: <AlertTriangle className="w-5 h-5 text-risk-high" />,
      titleColor: 'text-risk-high',
      opacity: '',
      pulseClass: '',
    },
    red: {
      borderClass: 'border-l-risk-critical',
      bgClass: 'bg-risk-critical/5',
      icon: <AlertCircle className="w-5 h-5 text-risk-critical animate-pulse-critical" />,
      titleColor: 'text-risk-critical',
      opacity: '',
      pulseClass: '',
    },
  };

  const cfg = levelConfig[item.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`glass-card rounded-lg border-l-4 ${cfg.borderClass} ${cfg.bgClass} ${cfg.opacity}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox (not for green) */}
          {item.level !== 'green' && (
            <div className="flex-shrink-0 pt-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelect}
                className="border-on-surface-variant/40 data-[state=checked]:bg-primary-fixed-dim data-[state=checked]:border-primary-fixed-dim"
              />
            </div>
          )}

          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className={`text-sm font-bold ${cfg.titleColor} leading-snug`}>
                {item.title}
              </h4>
              {item.financialImpact && (
                <Badge className={`text-[9px] font-bold px-2 py-0 h-5 ${
                  item.level === 'green'
                    ? 'bg-risk-low/15 text-risk-low border-risk-low/30'
                    : item.level === 'red'
                      ? 'bg-risk-critical/15 text-risk-critical border-risk-critical/30'
                      : 'bg-risk-high/15 text-risk-high border-risk-high/30'
                }`}>
                  {item.financialImpact}
                </Badge>
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed mb-2">
              {item.description}
            </p>

            <div className="flex items-center gap-3 text-[10px] text-on-surface-variant/70">
              <span className="font-mono">{item.shipmentRef}</span>
              <span>•</span>
              <span>{item.category}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.timestamp}
              </span>
            </div>

            {/* Action buttons based on level */}
            {item.level === 'green' ? (
              <div className="mt-2 text-[11px] text-risk-low font-medium">
                ✅ No action needed
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-3">
                {item.level === 'orange' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-risk-high/40 text-risk-high hover:bg-risk-high/10 hover:text-risk-high"
                      onClick={() => onAction('review')}
                    >
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 text-on-surface-variant hover:text-on-surface"
                      onClick={() => onAction('skip')}
                    >
                      Skip
                    </Button>
                  </>
                )}
                {item.level === 'red' && (
                  <>
                    <Button
                      size="sm"
                      className="text-xs h-7 bg-risk-critical/90 hover:bg-risk-critical text-white"
                      onClick={() => onAction('review_now')}
                    >
                      Review Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-glass-border text-on-surface-variant hover:text-on-surface"
                      onClick={() => onAction('approve_anyway')}
                    >
                      Approve Anyway
                    </Button>
                  </>
                )}

                {/* Expand toggle */}
                {(item.expected || item.aiRecommendation) && (
                  <button
                    onClick={onToggleExpand}
                    className="ml-auto text-[10px] text-on-surface-variant hover:text-primary-fixed-dim flex items-center gap-1 transition-colors"
                  >
                    Details
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expandable Detail */}
        <AnimatePresence>
          {isExpanded && (item.expected || item.aiRecommendation) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 ml-11 p-4 bg-surface-container rounded-lg border border-glass-border space-y-3">
                {/* Expected vs Actual */}
                {item.expected && item.actual && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      Mismatch Details
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-surface-container-high rounded-md p-2.5">
                        <span className="text-[10px] font-bold text-risk-low uppercase tracking-wider">Expected</span>
                        <p className="text-xs font-mono text-on-surface mt-1">{item.expected}</p>
                      </div>
                      <div className="bg-surface-container-high rounded-md p-2.5">
                        <span className="text-[10px] font-bold text-risk-critical uppercase tracking-wider">Actual</span>
                        <p className="text-xs font-mono text-on-surface mt-1">{item.actual}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Recommendation */}
                {item.aiRecommendation && (
                  <div>
                    <h5 className="text-[10px] font-bold text-primary-fixed-dim uppercase tracking-widest mb-1.5">
                      AI Recommendation
                    </h5>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {item.aiRecommendation}
                    </p>
                  </div>
                )}

                {/* Confirm / Reject */}
                <div className="flex items-center gap-2 pt-2 border-t border-glass-border">
                  <Button
                    size="sm"
                    className="text-xs h-8 bg-risk-low/90 hover:bg-risk-low text-white"
                    onClick={onConfirm}
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 border-risk-critical/40 text-risk-critical hover:bg-risk-critical/10 hover:text-risk-critical"
                    onClick={onReject}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    Reject
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main Review Screen ───────────────────────────────────────────
export default function ReviewScreen() {
  const { setCurrentScreen } = useAppState();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<ReviewItem[]>(REVIEW_ITEMS);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filter items
  const filteredItems = useMemo(() => {
    // Sort: red first, then orange, then green
    const levelOrder: Record<AlertLevel, number> = { red: 0, orange: 1, green: 2 };
    const sorted = [...items].sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

    if (filter === 'all') return sorted;
    if (filter === 'orange') return sorted.filter((i) => i.level === 'orange');
    if (filter === 'red') return sorted.filter((i) => i.level === 'red');
    return sorted;
  }, [items, filter]);

  // Count attention items
  const attentionCount = items.filter((i) => i.level !== 'green').length;

  // Select all
  const selectableIds = filteredItems.filter((i) => i.level !== 'green').map((i) => i.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  const handleToggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  }, [allSelected, selectableIds]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleConfirm = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.success('Item confirmed', { description: 'Added to audit trail.' });
  }, []);

  const handleReject = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.warning('Item rejected', { description: 'Flagged for investigation.' });
  }, []);

  const handleCardAction = useCallback((id: string, action: string) => {
    if (action === 'review' || action === 'review_now') {
      handleToggleExpand(id);
    } else if (action === 'skip') {
      toast.info('Item skipped', { description: 'Will appear again later.' });
    } else if (action === 'approve_anyway') {
      handleConfirm(id);
      toast.success('Approved with exception', { description: 'Flagged for audit trail.' });
    }
  }, [handleToggleExpand, handleConfirm]);

  const handleBulkApprove = useCallback(async () => {
    setBulkLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    const count = selectedIds.size;
    setSelectedIds(new Set());
    setBulkLoading(false);
    toast.success(`${count} item(s) approved`, { description: 'All forwarded to finance.' });
  }, [selectedIds]);

  const handleBulkReject = useCallback(async () => {
    setBulkLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)));
    const count = selectedIds.size;
    setSelectedIds(new Set());
    setBulkLoading(false);
    toast.warning(`${count} item(s) rejected`, { description: 'All flagged for investigation.' });
  }, [selectedIds]);

  // Empty state
  if (filteredItems.length === 0 && items.length === 0) {
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex-1 md:ml-64 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 px-6"
          >
            <div className="mx-auto w-20 h-20 rounded-2xl bg-risk-low/10 flex items-center justify-center mb-5">
              <span className="text-4xl">🎉</span>
            </div>
            <h3
              className="text-2xl font-extrabold text-on-surface mb-2"
              style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}
            >
              All clear!
            </h3>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6">
              No items need review right now. The AI swarm is handling everything autonomously.
            </p>
            <Button
              onClick={() => setCurrentScreen('inbox')}
              className="bg-primary-fixed-dim hover:bg-primary-fixed text-on-primary font-semibold glow-cyan"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      <main className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile spacer */}
        <div className="h-14 md:hidden" />

        {/* ─── Top Bar ──────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 glass-card-strong border-b border-glass-border px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Title */}
            <h1
              className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight"
              style={{ fontFamily: 'var(--font-hanken-grotesk), system-ui, sans-serif' }}
            >
              Review Queue
            </h1>

            {/* Count badge */}
            <Badge className="text-[10px] font-bold px-2.5 py-0.5 h-6 bg-risk-critical/15 text-risk-critical border-risk-critical/30">
              {attentionCount} item{attentionCount !== 1 ? 's' : ''} need your attention
            </Badge>

            <div className="ml-auto" />
          </div>
        </header>

        {/* ─── Bulk Actions Bar ─────────────────────────────────── */}
        {attentionCount > 0 && (
          <div className="sticky top-[57px] z-20 glass-card border-b border-glass-border px-4 sm:px-6 py-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Select All */}
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleToggleSelectAll}
                  className="border-on-surface-variant/40 data-[state=checked]:bg-primary-fixed-dim data-[state=checked]:border-primary-fixed-dim"
                />
                <span className="text-xs text-on-surface-variant font-medium">Select All</span>
              </div>

              <div className="h-4 w-px bg-glass-border" />

              {/* Filter tabs */}
              <div className="flex items-center gap-1">
                {([
                  { key: 'all', label: 'All' },
                  { key: 'orange', label: '🟡 Needs Review' },
                  { key: 'red', label: '🔴 Critical' },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors ${
                      filter === tab.key
                        ? 'bg-surface-container-high text-on-surface'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex items-center gap-2">
                {/* Selected count */}
                {selectedIds.size > 0 && (
                  <span className="text-[11px] font-mono text-primary-fixed-dim">
                    {selectedIds.size} selected
                  </span>
                )}

                {/* Bulk Approve */}
                <Button
                  size="sm"
                  disabled={selectedIds.size === 0 || bulkLoading}
                  onClick={handleBulkApprove}
                  className="text-xs h-8 bg-risk-low/90 hover:bg-risk-low text-white disabled:opacity-40"
                >
                  {bulkLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                  Approve Selected
                </Button>

                {/* Bulk Reject */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={selectedIds.size === 0 || bulkLoading}
                  onClick={handleBulkReject}
                  className="text-xs h-8 border-risk-critical/40 text-risk-critical hover:bg-risk-critical/10 hover:text-risk-critical disabled:opacity-40"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  Reject Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Review Cards ─────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-5">
          <div className="max-w-3xl mx-auto space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <ReviewCard
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.has(item.id)}
                  onToggleSelect={() => handleToggleSelect(item.id)}
                  isExpanded={expandedIds.has(item.id)}
                  onToggleExpand={() => handleToggleExpand(item.id)}
                  onConfirm={() => handleConfirm(item.id)}
                  onReject={() => handleReject(item.id)}
                  onAction={(action) => handleCardAction(item.id, action)}
                />
              ))}
            </AnimatePresence>

            {filteredItems.length === 0 && items.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <Filter className="w-10 h-10 mx-auto mb-3 text-on-surface-variant/30" />
                <p className="text-sm text-on-surface-variant">
                  No items match the current filter.
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* ─── Compliance Badge ──────────────────────────────────── */}
        <div className="fixed bottom-4 right-4 z-40">
          <div className="glass-card rounded-full px-3 py-1.5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-risk-low" />
            <span className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider">
              AWS af-south-1 • POPIA COMPLIANT
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
