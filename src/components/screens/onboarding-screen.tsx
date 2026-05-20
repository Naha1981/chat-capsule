'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Mail, Upload, CloudUpload, Search,
  ArrowRight, CheckCircle, Loader2, Copy, Check,
  QrCode, FileText, Sparkles, X, Shield
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppState } from '@/lib/app-state';
import { INDUSTRY_LIST, INDUSTRIES, type IndustryKey } from '@/lib/industries';

// ─── Font helpers ────────────────────────────────────────────────
const hanken = 'var(--font-hanken-grotesk), system-ui, sans-serif';
const mono = 'var(--font-jetbrains-mono), ui-monospace, monospace';

// ─── Step Labels ─────────────────────────────────────────────────
const STEPS = [
  { label: 'Industry', index: 0 },
  { label: 'Channels', index: 1 },
  { label: 'Try It', index: 2 },
];

// ─── Progress Dots ───────────────────────────────────────────────
function StepProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.label}>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full transition-all duration-500 ${
                i === currentStep
                  ? 'bg-primary-fixed-dim shadow-[0_0_10px_rgba(0,220,229,0.6)] scale-125'
                  : i < currentStep
                  ? 'bg-primary-fixed-dim/60'
                  : 'bg-on-surface-variant/20'
              }`}
            />
            <span
              className={`text-xs font-medium transition-colors duration-300 ${
                i === currentStep
                  ? 'text-primary-fixed-dim'
                  : 'text-on-surface-variant/50'
              }`}
              style={{ fontFamily: hanken }}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-8 h-px transition-colors duration-500 ${
                i < currentStep ? 'bg-primary-fixed-dim/60' : 'bg-on-surface-variant/15'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── QR Code Simulator ───────────────────────────────────────────
function SimulatedQRCode() {
  const pattern = useMemo(() => {
    const size = 21;
    const cells: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < size; c++) {
        const inTL = r < 7 && c < 7;
        const inTR = r < 7 && c >= size - 7;
        const inBL = r >= size - 7 && c < 7;
        if (inTL || inTR || inBL) {
          const lr = inTL ? r : inTR ? r : r - (size - 7);
          const lc = inTL ? c : inTR ? c - (size - 7) : c;
          if (lr === 0 || lr === 6 || lc === 0 || lc === 6) row.push(true);
          else if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) row.push(true);
          else row.push(false);
        } else {
          const seed = r * 31 + c * 17 + 42;
          row.push((seed * 2654435761) % 4 !== 0);
        }
      }
      cells.push(row);
    }
    return cells;
  }, []);

  return (
    <div className="p-3 rounded-xl border-2 border-glass-border bg-surface-container/50">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(21, 1fr)' }}>
        {pattern.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-[5px] h-[5px] rounded-[1px] ${
                cell ? 'bg-foreground/70' : 'bg-transparent'
              }`}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 1: Industry Selection
// ═══════════════════════════════════════════════════════════════════
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

  const selectedIndustry = selected ? INDUSTRY_LIST.find(i => i.key === selected) : null;

  const handleContinue = () => {
    if (selected) {
      setWorkspaceIndustry(selected);
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Heading */}
      <div className="text-center mb-6">
        <h2
          className="text-3xl sm:text-4xl font-extrabold text-on-surface leading-tight"
          style={{ fontFamily: hanken }}
        >
          What do you{' '}
          <span className="text-primary-fixed-dim">move</span>?
        </h2>
        <p className="text-base text-on-surface-variant mt-2">
          Tell us what you ship and we&apos;ll configure everything automatically.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <Input
          placeholder="Search industries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-surface-container/50 border-glass-border text-on-surface placeholder:text-on-surface-variant/50 h-11"
          style={{ fontFamily: mono }}
        />
      </div>

      {/* Industry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1 mb-6">
        {filtered.map((industry, i) => {
          const isActive = selected === industry.key;
          return (
            <motion.div
              key={industry.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
            >
              <div
                className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden h-full ${
                  isActive
                    ? 'bg-primary-fixed-dim/10 border-2 border-primary-fixed-dim'
                    : 'glass-card border-glass-border border hover:bg-surface-container-high/50 hover:border-on-surface-variant/20'
                }`}
                onClick={() => setSelected(industry.key)}
              >
                {/* Check indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2"
                  >
                    <CheckCircle className="w-5 h-5 text-primary-fixed-dim" />
                  </motion.div>
                )}

                {/* Emoji */}
                <div className={`p-2 rounded-lg ${industry.bgClass} text-2xl inline-block mb-2`}>
                  {industry.icon}
                </div>

                {/* Title */}
                <h3
                  className="text-sm font-bold text-on-surface leading-snug"
                  style={{ fontFamily: hanken }}
                >
                  {industry.label}
                </h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="flex justify-center">
        <Button
          className="px-10 py-3 bg-primary-fixed-dim hover:bg-primary-fixed-dim/90 text-on-primary font-bold text-base glow-cyan"
          style={{ fontFamily: hanken }}
          onClick={handleContinue}
          disabled={!selected}
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 2: Connect Channels
// ═══════════════════════════════════════════════════════════════════
function ChannelsStep({ onNext }: { onNext: () => void }) {
  const whatsappConnected = useAppState((s) => s.whatsappConnected);
  const setWhatsappConnected = useAppState((s) => s.setWhatsappConnected);
  const emailConnected = useAppState((s) => s.emailConnected);
  const setEmailConnected = useAppState((s) => s.setEmailConnected);
  const workspaceIndustry = useAppState((s) => s.workspaceIndustry);

  const [whatsappLinking, setWhatsappLinking] = useState(false);
  const [whatsappQR, setWhatsappQR] = useState(false);
  const [bccCopied, setBccCopied] = useState(false);

  const industryConfig = INDUSTRIES[workspaceIndustry as IndustryKey] || INDUSTRIES.logistics;
  const ingestEmail = `aep-logistics@capsuleflow.ai`;

  const handleLinkWhatsApp = () => {
    if (whatsappConnected) return;
    setWhatsappLinking(true);
    setTimeout(() => {
      setWhatsappLinking(false);
      setWhatsappQR(true);
    }, 2000);
  };

  const handleSimulateScan = () => {
    setWhatsappConnected(true);
    setWhatsappQR(false);
  };

  const handleCopyBcc = async () => {
    try {
      await navigator.clipboard.writeText(ingestEmail);
      setBccCopied(true);
      setTimeout(() => setBccCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleGoogleSignIn = () => {
    setEmailConnected(true);
  };

  const handleMicrosoftSignIn = () => {
    setEmailConnected(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Heading */}
      <div className="text-center mb-6">
        <h2
          className="text-3xl sm:text-4xl font-extrabold text-on-surface leading-tight"
          style={{ fontFamily: hanken }}
        >
          Connect your{' '}
          <span className="text-primary-fixed-dim">channels</span>
        </h2>
        <p className="text-base text-on-surface-variant mt-2">
          Get alerts where you already work. Skip if you want to set this up later.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* WhatsApp Card */}
        <Card className="glass-card border-glass-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <MessageSquare className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-on-surface" style={{ fontFamily: hanken }}>
                  WhatsApp
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {industryConfig.whatsappBotName}
                </p>
              </div>
              {whatsappConnected && (
                <Badge className="bg-risk-low/20 text-risk-low border-risk-low/30 text-[10px]">
                  <CheckCircle className="w-3 h-3 mr-1" /> Linked
                </Badge>
              )}
            </div>

            {/* States */}
            {!whatsappConnected && !whatsappLinking && !whatsappQR && (
              <div>
                <p className="text-sm text-on-surface-variant mb-4">
                  Send and receive document alerts on WhatsApp
                </p>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={handleLinkWhatsApp}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Link WhatsApp
                </Button>
              </div>
            )}

            {whatsappLinking && (
              <div className="flex flex-col items-center py-6 gap-3">
                <Loader2 className="w-8 h-8 text-primary-fixed-dim animate-spin" />
                <p className="text-sm text-on-surface-variant" style={{ fontFamily: mono }}>
                  Generating QR code...
                </p>
              </div>
            )}

            {whatsappQR && !whatsappConnected && (
              <div className="flex flex-col items-center gap-3">
                <SimulatedQRCode />
                <p className="text-xs text-on-surface-variant text-center">
                  Scan with WhatsApp Linked Devices
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary-fixed-dim"
                  onClick={handleSimulateScan}
                >
                  Simulate scan (demo)
                </Button>
              </div>
            )}

            {whatsappConnected && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-risk-low/5 border border-risk-low/20"
              >
                <CheckCircle className="w-4 h-4 text-risk-low shrink-0" />
                <span className="text-sm text-risk-low font-medium">Connected as +27 83 XXX XXXX</span>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Email Card */}
        <Card className="glass-card border-glass-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary-fixed-dim/10">
                <Mail className="w-6 h-6 text-primary-fixed-dim" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-on-surface" style={{ fontFamily: hanken }}>
                  Email
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Auto-process incoming documents
                </p>
              </div>
              {emailConnected && (
                <Badge className="bg-risk-low/20 text-risk-low border-risk-low/30 text-[10px]">
                  <CheckCircle className="w-3 h-3 mr-1" /> Linked
                </Badge>
              )}
            </div>

            {!emailConnected ? (
              <div className="space-y-3">
                {/* Google + Microsoft buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="border-glass-border bg-surface-container/30 text-on-surface hover:bg-surface-container-high/50 text-xs font-semibold h-10"
                    onClick={handleGoogleSignIn}
                  >
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    className="border-glass-border bg-surface-container/30 text-on-surface hover:bg-surface-container-high/50 text-xs font-semibold h-10"
                    onClick={handleMicrosoftSignIn}
                  >
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24">
                      <path fill="#F25022" d="M1 1h10v10H1z" />
                      <path fill="#7FBA00" d="M13 1h10v10H13z" />
                      <path fill="#00A4EF" d="M1 13h10v10H1z" />
                      <path fill="#FFB900" d="M13 13h10v10H13z" />
                    </svg>
                    Microsoft
                  </Button>
                </div>

                {/* Manual Forwarding */}
                <div className="p-3 rounded-lg bg-surface-container/30 border border-glass-border">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant/60 mb-2">
                    Manual Forwarding
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary-fixed-dim font-mono truncate flex-1">
                      {ingestEmail}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 shrink-0"
                      onClick={handleCopyBcc}
                    >
                      {bccCopied ? (
                        <Check className="w-3.5 h-3.5 text-risk-low" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-on-surface-variant" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/50 mt-1">
                    Just bcc this address on any email with a document.
                  </p>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-risk-low/5 border border-risk-low/20"
              >
                <CheckCircle className="w-4 h-4 text-risk-low shrink-0" />
                <span className="text-sm text-risk-low font-medium">Email connected</span>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Skip + Continue */}
      <div className="flex flex-col items-center gap-3">
        <Button
          className="px-10 py-3 bg-primary-fixed-dim hover:bg-primary-fixed-dim/90 text-on-primary font-bold text-base glow-cyan"
          style={{ fontFamily: hanken }}
          onClick={onNext}
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <button
          onClick={onNext}
          className="text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors underline underline-offset-4"
          style={{ fontFamily: hanken }}
        >
          Skip for now — I&apos;ll do this later
        </button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 3: "Magic Moment" Upload
// ═══════════════════════════════════════════════════════════════════
function UploadStep({ onNext }: { onNext: () => void }) {
  const { workspaceIndustry } = useAppState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const industryConfig = INDUSTRIES[workspaceIndustry as IndustryKey] || INDUSTRIES.logistics;
  const sampleDocs = Object.entries(industryConfig.sampleDocuments);

  const handleUpload = () => {
    if (isProcessed) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsProcessed(true);
    }, 3000);
  };

  const handleSelectSample = (docName: string) => {
    setSelectedFile(docName);
    setIsProcessed(false);
    setIsProcessing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Heading */}
      <div className="text-center mb-6">
        <h2
          className="text-3xl sm:text-4xl font-extrabold text-on-surface leading-tight"
          style={{ fontFamily: hanken }}
        >
          See it in{' '}
          <span className="text-primary-fixed-dim">action</span>
        </h2>
        <p className="text-base text-on-surface-variant mt-2">
          Upload one document now to see the AI in action. We&apos;ll process it in seconds.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 mb-5 cursor-pointer ${
          isDragging
            ? 'border-primary-fixed-dim bg-primary-fixed-dim/5'
            : isProcessed
            ? 'border-risk-low/40 bg-risk-low/5'
            : 'border-on-surface-variant/20 bg-surface-container/20 hover:border-primary-fixed-dim/40 hover:bg-surface-container/30'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); setSelectedFile('Uploaded document'); }}
        onClick={() => { if (!isProcessing && !isProcessed) setSelectedFile('Uploaded document'); }}
      >
        {!isProcessing && !isProcessed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="p-4 rounded-2xl bg-primary-fixed-dim/10">
              <CloudUpload className="w-10 h-10 text-primary-fixed-dim" />
            </div>
            <div>
              <p className="text-lg font-bold text-on-surface" style={{ fontFamily: hanken }}>
                Drop any document here or click to upload
              </p>
              <p className="text-sm text-on-surface-variant mt-1">
                PDFs, Scans, Photos — we&apos;ll handle the rest
              </p>
            </div>
            {selectedFile && (
              <Badge className="bg-primary-fixed-dim/10 text-primary-fixed-dim border-primary-fixed-dim/20 mt-2">
                <FileText className="w-3 h-3 mr-1" /> {selectedFile}
              </Badge>
            )}
          </motion.div>
        )}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <Loader2 className="w-12 h-12 text-primary-fixed-dim animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-fixed-dim" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-on-surface" style={{ fontFamily: hanken }}>
                Processing
              </span>
              <span className="flex gap-0.5">
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                  className="text-primary-fixed-dim text-lg font-bold"
                >.</motion.span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                  className="text-primary-fixed-dim text-lg font-bold"
                >.</motion.span>
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                  className="text-primary-fixed-dim text-lg font-bold"
                >.</motion.span>
              </span>
            </div>
            <p className="text-sm text-on-surface-variant">
              AI agents are extracting and auditing your document
            </p>
          </motion.div>
        )}

        {isProcessed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="p-3 rounded-full bg-risk-low/10">
              <CheckCircle className="w-10 h-10 text-risk-low" />
            </div>
            <p className="text-lg font-bold text-on-surface" style={{ fontFamily: hanken }}>
              Document processed!
            </p>
            <p className="text-sm text-risk-low font-medium">
              3 fields extracted. 0 mismatches found.
            </p>
          </motion.div>
        )}
      </div>

      {/* Sample Documents */}
      {!isProcessed && !isProcessing && (
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-wider text-on-surface-variant/50 mb-2 text-center">
            Or try a sample document
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {sampleDocs.map(([docName]) => (
              <button
                key={docName}
                onClick={() => handleSelectSample(docName)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  selectedFile === docName
                    ? 'bg-primary-fixed-dim/10 border-primary-fixed-dim/30 text-primary-fixed-dim'
                    : 'bg-surface-container/30 border-glass-border text-on-surface-variant hover:bg-surface-container-high/50'
                }`}
                style={{ fontFamily: mono }}
              >
                <FileText className="w-3 h-3 inline mr-1" />
                {docName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-3">
        {!isProcessed ? (
          <Button
            className="px-10 py-3 bg-primary-fixed-dim hover:bg-primary-fixed-dim/90 text-on-primary font-bold text-base glow-cyan glow-cyan-strong"
            style={{ fontFamily: hanken }}
            onClick={handleUpload}
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Process Document
              </>
            )}
          </Button>
        ) : (
          <Button
            className="px-10 py-3 bg-primary-fixed-dim hover:bg-primary-fixed-dim/90 text-on-primary font-bold text-base glow-cyan"
            style={{ fontFamily: hanken }}
            onClick={onNext}
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Onboarding Screen
// ═══════════════════════════════════════════════════════════════════
export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const { setOnboardingStep, setOnboardingComplete, setCurrentScreen } = useAppState();

  const handleNext = () => {
    const nextStep = step + 1;
    if (nextStep <= 2) {
      setStep(nextStep);
      setOnboardingStep(nextStep);
    } else {
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
        className="w-full max-w-4xl relative z-10"
      >
        {/* Step Progress */}
        <StepProgress currentStep={step} />

        {/* Screen Content */}
        <AnimatePresence mode="wait">
          {step === 0 && <IndustryStep key="industry" onNext={handleNext} />}
          {step === 1 && <ChannelsStep key="channels" onNext={handleNext} />}
          {step === 2 && <UploadStep key="upload" onNext={handleNext} />}
        </AnimatePresence>
      </motion.div>

      {/* Bottom branding */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-30">
        <Shield className="w-4 h-4 text-primary-fixed-dim" />
        <span className="text-[10px] font-mono text-on-surface-variant tracking-widest uppercase">
          CapsuleFlow AI — Protected by Autonomous Trade Infrastructure
        </span>
      </div>
    </div>
  );
}
