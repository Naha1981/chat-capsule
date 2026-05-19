'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io as socketIO, Socket } from 'socket.io-client';
import {
  ArrowUpRight, ArrowDownRight, Shield, AlertTriangle, FileText,
  Package, TrendingUp, Clock, Bell, Activity, Zap, Brain, Eye,
  Send, CheckCircle, XCircle, Loader2, ChevronRight, Search,
  Filter, Plus, RefreshCw, ExternalLink, MessageSquare, Mail,
  BarChart3, Users, Globe, Radio, Cpu, Layers, Sparkles,
  AlertCircle, Info, ThumbsUp, X, Upload, FileUp, CircleDot
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Types
interface Metric {
  id: string;
  key: string;
  value: number;
  label: string;
  unit: string | null;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  shipment: {
    reference: string;
    title: string;
    industry: string;
    riskLevel: string;
  };
}

interface Shipment {
  id: string;
  reference: string;
  title: string;
  industry: string;
  status: string;
  origin: string | null;
  destination: string | null;
  supplier: string | null;
  buyer: string | null;
  totalAmount: number | null;
  currency: string;
  grossWeightKg: number | null;
  commodity: string | null;
  hsCode: string | null;
  riskLevel: string;
  riskNotes: string | null;
  estimatedValue: number | null;
  createdAt: string;
  updatedAt: string;
  documents: { id: string; fileType: string; status: string }[];
  _count: { alerts: number; agentLogs: number };
}

interface AgentLog {
  id: string;
  shipmentId: string;
  agentName: string;
  agentRole: string;
  status: string;
  input: string | null;
  output: string | null;
  duration: number | null;
  createdAt: string;
}

interface AgentStat {
  agentName: string;
  _count: { agentName: number };
  _avg: { duration: number | null };
}

interface DashboardData {
  metrics: Metric[];
  shipmentsByStatus: { status: string; _count: { status: number } }[];
  shipmentsByIndustry: { industry: string; _count: { industry: number } }[];
  riskDistribution: { riskLevel: string; _count: { riskLevel: number } }[];
  unreadAlerts: number;
  recentAlerts: Alert[];
  recentShipments: Shipment[];
  agentLogs: AgentLog[];
  agentStats: AgentStat[];
  totalRiskValue: number;
  savingsTrend: { month: string; value: number }[];
}

// Agent configuration
const AGENT_CONFIG = {
  triage_clerk: { name: 'Triage Clerk', role: 'Router', icon: '📋', color: '#10b981', description: 'Identifies document type & routes to correct industry capsule' },
  data_extractor: { name: 'Data Extractor', role: 'OCR Specialist', icon: '🔍', color: '#3b82f6', description: 'Converts messy text into perfect JSON data' },
  auditor: { name: 'Auditor', role: 'Validator', icon: '🛡️', color: '#f59e0b', description: 'Cross-checks new data against Master Records' },
  risk_analyst: { name: 'Risk Analyst', role: 'Decision Maker', icon: '📊', color: '#ef4444', description: 'Calculates Rand-value impact of errors' },
  dispatcher: { name: 'Dispatcher', role: 'Communicator', icon: '📨', color: '#8b5cf6', description: 'Formats output for WhatsApp & Email' },
};

// Color maps
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  cleared: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  flagged: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  held: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const RISK_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600',
  medium: 'bg-yellow-500/10 text-yellow-600',
  high: 'bg-orange-500/10 text-orange-600',
  critical: 'bg-red-500/10 text-red-600',
};

const INDUSTRY_ICONS: Record<string, React.ReactNode> = {
  logistics: <Package className="w-4 h-4" />,
  mining: <Layers className="w-4 h-4" />,
  oil: <Globe className="w-4 h-4" />,
};

// Formatting helpers
function formatZAR(value: number | null): string {
  if (value === null || value === 0) return 'R0';
  if (value >= 1000000) return `R${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R${(value / 1000).toFixed(0)}K`;
  return `R${value.toLocaleString()}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ===== SUB-COMPONENTS =====

function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  const iconMap: Record<string, React.ReactNode> = {
    total_savings_zar: <TrendingUp className="w-5 h-5" />,
    documents_processed: <FileText className="w-5 h-5" />,
    risks_caught: <Shield className="w-5 h-5" />,
    active_shipments: <Package className="w-5 h-5" />,
    avg_processing_time: <Clock className="w-5 h-5" />,
    compliance_rate: <CheckCircle className="w-5 h-5" />,
    port_delays_prevented: <Zap className="w-5 h-5" />,
    sars_audits_passed: <BarChart3 className="w-5 h-5" />,
  };

  const colorMap: Record<string, string> = {
    total_savings_zar: 'text-emerald-600 bg-emerald-500/10',
    documents_processed: 'text-blue-600 bg-blue-500/10',
    risks_caught: 'text-orange-600 bg-orange-500/10',
    active_shipments: 'text-violet-600 bg-violet-500/10',
    avg_processing_time: 'text-cyan-600 bg-cyan-500/10',
    compliance_rate: 'text-green-600 bg-green-500/10',
    port_delays_prevented: 'text-amber-600 bg-amber-500/10',
    sars_audits_passed: 'text-teal-600 bg-teal-500/10',
  };

  const trendMap: Record<string, { direction: 'up' | 'down'; value: string }> = {
    total_savings_zar: { direction: 'up', value: '+18.2%' },
    documents_processed: { direction: 'up', value: '+12.5%' },
    risks_caught: { direction: 'up', value: '+8.3%' },
    active_shipments: { direction: 'up', value: '+3' },
    avg_processing_time: { direction: 'down', value: '-0.8s' },
    compliance_rate: { direction: 'up', value: '+2.1%' },
    port_delays_prevented: { direction: 'up', value: '+5' },
    sars_audits_passed: { direction: 'up', value: '+12' },
  };

  const trend = trendMap[metric.key];
  const displayValue = metric.unit === 'ZAR'
    ? formatZAR(metric.value)
    : metric.unit === '%'
    ? `${metric.value}%`
    : metric.unit === 'seconds'
    ? `${metric.value}s`
    : formatNumber(metric.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-lg ${colorMap[metric.key] || 'text-gray-600 bg-gray-500/10'}`}>
              {iconMap[metric.key] || <Activity className="w-5 h-5" />}
            </div>
            {trend && (
              <div className={`flex items-center gap-1 text-xs font-medium ${trend.direction === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                {trend.direction === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend.value}
              </div>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight">{displayValue}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SwarmVisualization({ agentLogs, agentStats, isProcessing, processingStep }: {
  agentLogs: AgentLog[];
  agentStats: AgentStat[];
  isProcessing: boolean;
  processingStep: number;
}) {
  const agentKeys = Object.keys(AGENT_CONFIG) as (keyof typeof AGENT_CONFIG)[];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-500" />
              AI Agent Swarm
            </CardTitle>
            <CardDescription className="text-xs mt-1">5 specialized agents working in sequence</CardDescription>
          </div>
          {isProcessing && (
            <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Processing
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {agentKeys.map((key, index) => {
            const agent = AGENT_CONFIG[key];
            const stat = agentStats.find(s => s.agentName === key);
            const isActive = isProcessing && processingStep === index;
            const isComplete = isProcessing && processingStep > index;
            const latestLog = agentLogs.find(l => l.agentName === key);
            const avgDuration = stat?._avg.duration || 0;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                  isActive
                    ? 'border-violet-500/50 bg-violet-500/5 shadow-sm shadow-violet-500/10'
                    : isComplete
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-border bg-card'
                }`}
              >
                {/* Connection line */}
                {index < agentKeys.length - 1 && (
                  <div className="absolute left-6 -bottom-2 w-0.5 h-4 bg-border" />
                )}

                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                  isActive ? 'animate-pulse' : ''
                }`} style={{ backgroundColor: `${agent.color}15` }}>
                  {isActive ? (
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: agent.color }} />
                  ) : isComplete ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <span>{agent.icon}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{agent.name}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5" style={{ color: agent.color, borderColor: `${agent.color}40` }}>
                      {agent.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                  {stat && (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3 inline mr-0.5" />
                        {Math.round(avgDuration)}ms avg
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        <Activity className="w-3 h-3 inline mr-0.5" />
                        {stat._count.agentName} runs
                      </span>
                    </div>
                  )}
                </div>

                {isActive && (
                  <motion.div
                    className="absolute right-3"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Radio className="w-4 h-4 text-violet-500" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ShipmentTable({ shipments, onSelectShipment }: { shipments: Shipment[]; onSelectShipment: (s: Shipment) => void }) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all'
    ? shipments
    : shipments.filter(s => s.status === filter);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              Active Shipments
            </CardTitle>
            <CardDescription className="text-xs mt-1">{shipments.length} total shipments tracked</CardDescription>
          </div>
          <div className="flex gap-1">
            {['all', 'pending', 'processing', 'cleared', 'flagged', 'held'].map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-2 capitalize"
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filtered.map((shipment, i) => (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => onSelectShipment(shipment)}
                className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-muted">
                      {INDUSTRY_ICONS[shipment.industry] || <Package className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {shipment.reference}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                        {shipment.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[shipment.status]}`}>
                      {shipment.status}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {INDUSTRY_ICONS[shipment.industry]}
                    {shipment.industry}
                  </span>
                  {shipment.commodity && (
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {shipment.commodity}
                    </span>
                  )}
                  {shipment.totalAmount && (
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      {formatZAR(shipment.totalAmount)}
                    </span>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    <div className={`w-2 h-2 rounded-full ${
                      shipment.riskLevel === 'low' ? 'bg-emerald-500' :
                      shipment.riskLevel === 'medium' ? 'bg-yellow-500' :
                      shipment.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-500'
                    }`} />
                    <span className={RISK_COLORS[shipment.riskLevel]?.split(' ')[1] || ''}>
                      {shipment.riskLevel}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {shipment.documents.length}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AlertFeed({ alerts, onMarkRead, onResolve }: {
  alerts: Alert[];
  onMarkRead: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const severityIcons: Record<string, React.ReactNode> = {
    low: <Info className="w-4 h-4 text-blue-500" />,
    medium: <AlertCircle className="w-4 h-4 text-yellow-500" />,
    high: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    critical: <XCircle className="w-4 h-4 text-red-500" />,
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4 text-orange-500" />
          Live Alerts
          {alerts.filter(a => !a.isRead).length > 0 && (
            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">
              {alerts.filter(a => !a.isRead).length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 overflow-hidden">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm">All clear! No active alerts.</p>
              </div>
            ) : (
              alerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3 rounded-lg border transition-all ${
                    !alert.isRead ? 'bg-muted/50 border-l-4' : 'bg-card'
                  } ${
                    alert.severity === 'critical' ? 'border-l-red-500' :
                    alert.severity === 'high' ? 'border-l-orange-500' :
                    alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {severityIcons[alert.severity]}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                          {timeAgo(alert.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px]">
                          {alert.shipment.reference}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {alert.channel === 'whatsapp' ? (
                            <><MessageSquare className="w-3 h-3 mr-0.5" /> WhatsApp</>
                          ) : alert.channel === 'email' ? (
                            <><Mail className="w-3 h-3 mr-0.5" /> Email</>
                          ) : (
                            <><Activity className="w-3 h-3 mr-0.5" /> Dashboard</>
                          )}
                        </Badge>
                        {!alert.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-[10px] px-1.5"
                            onClick={() => onMarkRead(alert.id)}
                          >
                            <Eye className="w-3 h-3 mr-0.5" /> Read
                          </Button>
                        )}
                        {!alert.isResolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-[10px] px-1.5"
                            onClick={() => onResolve(alert.id)}
                          >
                            <CheckCircle className="w-3 h-3 mr-0.5" /> Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ShipmentDetailDialog({ shipment, open, onOpenChange }: {
  shipment: Shipment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!shipment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{shipment.reference}</span>
            <Badge variant="outline" className={STATUS_COLORS[shipment.status]}>
              {shipment.status}
            </Badge>
            <Badge variant="outline" className={RISK_COLORS[shipment.riskLevel]}>
              {shipment.riskLevel} risk
            </Badge>
          </DialogTitle>
          <DialogDescription>{shipment.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Key Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Industry</p>
              <p className="text-sm font-medium capitalize flex items-center gap-1">
                {INDUSTRY_ICONS[shipment.industry]} {shipment.industry}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Commodity</p>
              <p className="text-sm font-medium">{shipment.commodity || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">HS Code</p>
              <p className="text-sm font-mono">{shipment.hsCode || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-sm font-medium">{shipment.totalAmount ? formatZAR(shipment.totalAmount) : 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Gross Weight</p>
              <p className="text-sm font-medium">{shipment.grossWeightKg ? `${shipment.grossWeightKg.toLocaleString()} kg` : 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Risk Value</p>
              <p className="text-sm font-medium text-red-600">{shipment.estimatedValue ? formatZAR(shipment.estimatedValue) : 'None'}</p>
            </div>
          </div>

          <Separator />

          {/* Route */}
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right flex-1">
              <p className="font-medium">{shipment.origin || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">Origin</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="font-medium">{shipment.destination || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">Destination</p>
            </div>
          </div>

          <Separator />

          {/* Parties */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Supplier</p>
              <p className="text-sm font-medium">{shipment.supplier || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Buyer</p>
              <p className="text-sm font-medium">{shipment.buyer || 'N/A'}</p>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Documents ({shipment.documents.length})</p>
            <div className="flex gap-2">
              {shipment.documents.map((doc) => (
                <Badge key={doc.id} variant="outline" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  {doc.fileType}
                  <CheckCircle className="w-3 h-3 ml-1 text-emerald-500" />
                </Badge>
              ))}
            </div>
          </div>

          {/* Risk Notes */}
          {shipment.riskNotes && (
            <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
              <p className="text-xs font-medium text-orange-600 flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3" /> Risk Assessment
              </p>
              <p className="text-xs text-muted-foreground">{shipment.riskNotes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentUploadDialog({ onProcess, isProcessing }: {
  onProcess: (text: string) => void;
  isProcessing: boolean;
}) {
  const [docText, setDocText] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('logistics');

  const sampleDocuments: Record<string, string> = {
    logistics: `COMMERCIAL INVOICE
Invoice No: INV-2025-0892
Date: 2025-03-01
Shipper: AEP Mining (Pty) Ltd, 42 Marshall Street, Johannesburg
Consignee: Sinosteel Corporation, Beijing, China
Shipment Reference: SHP-2025-0042
Commodity: Manganese Ore
HS Code: 2602.00
Total Gross Weight: 28,500 KG
Total Net Weight: 28,200 KG
Unit Price: USD 4.50/kg
Total Amount: USD 128,250.00
Payment Terms: Letter of Credit
Vessel: MV PACIFIC STAR
Port of Loading: Durban, South Africa
Port of Discharge: Tianjin, China
Bank Details: Standard Bank, Account: 0123456789`,

    mining: `ENVIRONMENTAL COMPLIANCE PERMIT
Permit Number: ECP-2025-0456
Issuing Authority: Department of Mineral Resources
Mine Name: Mokopane Platinum Mine
Location: Limpopo Province
Permit Type: Environmental Management Programme
Commodity: Platinum Group Metals
HS Code: 7110.11
Expiry Date: 2025-04-15
Status: RENEWAL PENDING
Conditions: Quarterly environmental audits required
Water Usage License: WUL-2024-789 (Active)
Rehabilitation Bond: R2,500,000.00`,

    oil: `CRUDE OIL BILL OF LADING
B/L Number: BOL-CO-2025-0112
Date of Issue: 2025-02-28
Shipper: NNPC Limited, Lagos, Nigeria
Consignee: AEP Energy (Pty) Ltd, Cape Town
Vessel: MT ATLANTIC CARRIER
Port of Loading: Lagos, Nigeria
Port of Discharge: Cape Town, South Africa
Commodity: Bonny Light Crude Oil
HS Code: 2709.00
API Gravity: 35.4
Sulfur Content: 0.14%
Barrel Count: 280,000 BBL
Total Gross Weight: 45,000 MT
Temperature: 55°F
Freight: USD 850,000.00`,
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Sparkles className="w-4 h-4" />
          Process Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-500" />
            AI Document Processor
          </DialogTitle>
          <DialogDescription>
            Submit a document for multi-agent swarm analysis. The 5-agent pipeline will triage, extract, audit, assess risk, and dispatch results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Industry selector */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Sample Document</p>
            <div className="flex gap-2">
              {['logistics', 'mining', 'oil'].map((ind) => (
                <Button
                  key={ind}
                  variant={selectedIndustry === ind ? 'default' : 'outline'}
                  size="sm"
                  className="capitalize"
                  onClick={() => {
                    setSelectedIndustry(ind);
                    setDocText(sampleDocuments[ind]);
                  }}
                >
                  {ind === 'logistics' && <Package className="w-3 h-3 mr-1" />}
                  {ind === 'mining' && <Layers className="w-3 h-3 mr-1" />}
                  {ind === 'oil' && <Globe className="w-3 h-3 mr-1" />}
                  {ind}
                </Button>
              ))}
            </div>
          </div>

          {/* Text area */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Document Content</p>
            <textarea
              className="w-full h-48 p-3 rounded-lg border bg-muted/50 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              placeholder="Paste document text here or select a sample above..."
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
            />
          </div>

          {/* Process button */}
          <Button
            className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
            disabled={!docText.trim() || isProcessing}
            onClick={() => onProcess(docText)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Swarm Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run 5-Agent Swarm Pipeline
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProcessingOverlay({ step, totalSteps, agentResults }: {
  step: number;
  totalSteps: number;
  agentResults: Record<string, unknown>;
}) {
  const agentKeys = Object.keys(AGENT_CONFIG) as (keyof typeof AGENT_CONFIG)[];
  const progress = (step / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card border rounded-xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-violet-500/10">
            <Brain className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <p className="font-semibold">Swarm Processing</p>
            <p className="text-xs text-muted-foreground">
              Step {step + 1} of {totalSteps}: {agentKeys[step] ? AGENT_CONFIG[agentKeys[step]].name : 'Complete'}
            </p>
          </div>
        </div>

        <Progress value={progress} className="h-2 mb-4" />

        <div className="space-y-2">
          {agentKeys.map((key, index) => {
            const agent = AGENT_CONFIG[key];
            const isCurrent = index === step;
            const isDone = index < step;

            return (
              <div
                key={key}
                className={`flex items-center gap-2 text-sm p-2 rounded-lg transition-all ${
                  isCurrent ? 'bg-violet-500/10 font-medium' : isDone ? 'text-emerald-600' : 'text-muted-foreground'
                }`}
              >
                {isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                ) : isDone ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                ) : (
                  <CircleDot className="w-4 h-4" />
                )}
                <span>{agent.icon} {agent.name}</span>
                {isDone && <span className="ml-auto text-xs">Done</span>}
                {isCurrent && <span className="ml-auto text-xs text-violet-500 animate-pulse">Analyzing...</span>}
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===== MAIN PAGE =====
export default function CapsuleFlowDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [shipmentDialogOpen, setShipmentDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(-1);
  const [agentResults, setAgentResults] = useState<Record<string, unknown>>({});
  const [seeded, setSeeded] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [liveAgentStates, setLiveAgentStates] = useState<Record<string, { status: string; shipmentRef?: string }>>({});

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Seed database on first load
  useEffect(() => {
    if (!seeded) {
      fetch('/api/seed', { method: 'POST' })
        .then(() => {
          setSeeded(true);
          fetchDashboard();
        })
        .catch(() => {
          setSeeded(true);
          fetchDashboard();
        });
    }
  }, [seeded, fetchDashboard]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    try {
      const socket = socketIO('/?XTransformPort=3003', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 3,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('WebSocket connected to swarm');
      });

      socket.on('agent:update', (update: { agentName: string; status: string; shipmentRef?: string }) => {
        setLiveAgentStates(prev => ({
          ...prev,
          [update.agentName]: { status: update.status, shipmentRef: update.shipmentRef },
        }));

        // Update processing step based on agent
        const agentOrder = ['triage_clerk', 'data_extractor', 'auditor', 'risk_analyst', 'dispatcher'];
        const idx = agentOrder.indexOf(update.agentName);
        if (update.status === 'running' && idx >= 0) {
          setProcessingStep(idx);
        }
      });

      socket.on('swarm:complete', () => {
        setIsProcessing(false);
        setProcessingStep(-1);
        setLiveAgentStates({});
        fetchDashboard();
      });

      socket.on('alert:broadcast', () => {
        fetchDashboard();
      });

      socket.on('shipment:broadcast', () => {
        fetchDashboard();
      });

      return () => {
        socket.disconnect();
      };
    } catch {
      // WebSocket is optional enhancement
    }
  }, [fetchDashboard]);

  const handleProcessDocument = async (text: string) => {
    setIsProcessing(true);
    setProcessingStep(0);
    setAgentResults({});

    // Trigger WebSocket swarm simulation
    if (socketRef.current?.connected) {
      socketRef.current.emit('swarm:start', {
        shipmentRef: 'NEW-SHIPMENT',
        documentType: 'auto',
      });
    }

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: text }),
      });

      if (res.ok) {
        // Animate through the steps
        for (let i = 0; i < 5; i++) {
          setProcessingStep(i);
          await new Promise(r => setTimeout(r, 800));
        }

        const result = await res.json();
        setAgentResults(result.result || {});
      }
    } catch (err) {
      console.error('Processing error:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStep(-1);
        fetchDashboard();
      }, 500);
    }
  };

  const handleMarkAlertRead = async (alertId: string) => {
    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId, action: 'read' }),
    });
    fetchDashboard();
  };

  const handleResolveAlert = async (alertId: string) => {
    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId, action: 'resolve' }),
    });
    fetchDashboard();
  };

  const handleSelectShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShipmentDialogOpen(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="mx-auto mb-4"
          >
            <img
              src="/capsuleflow-logo.png"
              alt="CapsuleFlow AI"
              className="w-16 h-16 rounded-2xl"
            />
          </motion.div>
          <h2 className="text-lg font-bold mb-1">CapsuleFlow AI</h2>
          <p className="text-sm text-muted-foreground">Initializing Swarm...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || [];
  const topMetrics = metrics.filter(m =>
    ['total_savings_zar', 'documents_processed', 'risks_caught', 'active_shipments'].includes(m.key)
  );
  const extraMetrics = metrics.filter(m =>
    !['total_savings_zar', 'documents_processed', 'risks_caught', 'active_shipments'].includes(m.key)
  );

  // Chart data
  const statusChartData = (data?.shipmentsByStatus || []).map(s => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s._count.status,
  }));

  const riskChartData = (data?.riskDistribution || []).map(r => ({
    name: r.riskLevel.charAt(0).toUpperCase() + r.riskLevel.slice(1),
    value: r._count.riskLevel,
    color: r.riskLevel === 'low' ? '#10b981' : r.riskLevel === 'medium' ? '#eab308' : r.riskLevel === 'high' ? '#f97316' : '#ef4444',
  }));

  const industryChartData = (data?.shipmentsByIndustry || []).map(i => ({
    name: i.industry.charAt(0).toUpperCase() + i.industry.slice(1),
    value: i._count.industry,
    color: i.industry === 'logistics' ? '#3b82f6' : i.industry === 'mining' ? '#f59e0b' : '#10b981',
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <ProcessingOverlay
            step={processingStep}
            totalSteps={5}
            agentResults={agentResults}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  src="/capsuleflow-logo.png"
                  alt="CapsuleFlow AI"
                  className="w-8 h-8 rounded-lg"
                />
                <div>
                  <h1 className="text-lg font-bold tracking-tight">CapsuleFlow</h1>
                  <p className="text-[10px] text-muted-foreground -mt-0.5">Autonomous Operations Layer</p>
                </div>
              </div>
              <Separator orientation="vertical" className="h-6 mx-2" />
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Live
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={fetchDashboard}
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </Button>

              <div className="relative">
                <Button variant="ghost" size="sm" className="gap-1">
                  <Bell className="w-4 h-4" />
                  {data?.unreadAlerts ? (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center">
                      {data.unreadAlerts}
                    </span>
                  ) : null}
                </Button>
              </div>

              <DocumentUploadDialog onProcess={handleProcessDocument} isProcessing={isProcessing} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 py-6">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {topMetrics.map((metric, i) => (
            <MetricCard key={metric.key} metric={metric} index={i} />
          ))}
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {extraMetrics.map((metric, i) => (
            <MetricCard key={metric.key} metric={metric} index={i + 4} />
          ))}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          {/* Left Column: Swarm + Charts */}
          <div className="lg:col-span-4 space-y-4">
            <SwarmVisualization
              agentLogs={data?.agentLogs || []}
              agentStats={data?.agentStats || []}
              isProcessing={isProcessing}
              processingStep={processingStep}
            />

            {/* Risk Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                        stroke="none"
                      >
                        {riskChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Column: Charts */}
          <div className="lg:col-span-4 space-y-4">
            {/* Savings Trend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Savings Trend
                </CardTitle>
                <CardDescription className="text-xs">Cumulative ZAR savings from prevented delays & fines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.savingsTrend || []}>
                      <defs>
                        <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R${v / 1000}K`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`R${value.toLocaleString()}`, 'Savings']}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#savingsGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Industry Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  Industry Split
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={industryChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {industryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-500" />
                  Shipment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={70} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Alerts + Quick Actions */}
          <div className="lg:col-span-4 space-y-4">
            <AlertFeed
              alerts={data?.recentAlerts || []}
              onMarkRead={handleMarkAlertRead}
              onResolve={handleResolveAlert}
            />

            {/* Quick Stats Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Swarm Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Risk Value Prevented</span>
                  <span className="text-sm font-bold text-emerald-600">{formatZAR(data?.totalRiskValue || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Agent Uptime</span>
                  <span className="text-sm font-bold text-emerald-600">99.8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Avg Pipeline Time</span>
                  <span className="text-sm font-bold">3.2s</span>
                </div>
                <Separator />
                <div className="grid grid-cols-5 gap-1">
                  {Object.entries(AGENT_CONFIG).map(([key, agent]) => {
                    const stat = data?.agentStats.find(s => s.agentName === key);
                    return (
                      <div key={key} className="text-center p-1.5 rounded-lg bg-muted/50">
                        <div className="text-lg">{agent.icon}</div>
                        <div className="text-[9px] text-muted-foreground truncate">{agent.name.split(' ')[0]}</div>
                        <div className="text-[10px] font-medium">{stat?._avg.duration ? `${Math.round(stat._avg.duration)}ms` : '-'}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom: Shipment Table */}
        <ShipmentTable
          shipments={data?.recentShipments || []}
          onSelectShipment={handleSelectShipment}
        />
      </main>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <img
                src="/capsuleflow-logo.png"
                alt="CapsuleFlow AI"
                className="w-5 h-5 rounded"
              />
              <span className="font-medium text-foreground">CapsuleFlow AI</span>
              <span>v1.0.0</span>
              <Separator orientation="vertical" className="h-3" />
              <span>POPIA Compliant</span>
              <Separator orientation="vertical" className="h-3" />
              <span>af-south-1 Region</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </span>
              <span>5 Agents Active</span>
              <span>ZAR Native</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Shipment Detail Dialog */}
      <ShipmentDetailDialog
        shipment={selectedShipment}
        open={shipmentDialogOpen}
        onOpenChange={setShipmentDialogOpen}
      />
    </div>
  );
}
