import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getIndustryLabel, getIndustryEmoji, INDUSTRY_LIST } from '@/lib/industries';

export async function GET() {
  try {
    // Get metrics
    const metrics = await db.dashboardMetric.findMany();

    // Get shipment counts by status
    const shipmentsByStatus = await db.shipment.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Get shipments by industry
    const shipmentsByIndustry = await db.shipment.groupBy({
      by: ['industry'],
      _count: { industry: true },
    });

    // Get risk level distribution
    const riskDistribution = await db.shipment.groupBy({
      by: ['riskLevel'],
      _count: { riskLevel: true },
    });

    // Get unread alerts count
    const unreadAlerts = await db.alert.count({
      where: { isRead: false },
    });

    // Get recent alerts
    const recentAlerts = await db.alert.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { shipment: { select: { reference: true, title: true, industry: true } } },
    });

    // Get recent shipments
    const recentShipments = await db.shipment.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      include: {
        documents: { select: { id: true, fileType: true, status: true } },
        _count: { select: { alerts: true, agentLogs: true } },
      },
    });

    // Get agent log stats
    const agentLogs = await db.agentLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const agentStats = await db.agentLog.groupBy({
      by: ['agentName'],
      _count: { agentName: true },
      _avg: { duration: true },
    });

    // Get total estimated risk value
    const totalRiskValue = await db.shipment.aggregate({
      _sum: { estimatedValue: true },
    });

    // ── Industry Breakdown ──────────────────────────────────────
    const industryBreakdown = shipmentsByIndustry.map(item => ({
      industry: item.industry,
      label: getIndustryLabel(item.industry),
      icon: getIndustryEmoji(item.industry),
      count: item._count.industry,
    }));

    // ── Industry Risk Breakdown ─────────────────────────────────
    // Get risk level per industry by querying shipments grouped by industry + riskLevel
    const industryRiskData = await db.shipment.groupBy({
      by: ['industry', 'riskLevel'],
      _count: { riskLevel: true },
    });

    // Build a map: industry -> { low, medium, high, critical }
    const industryRiskMap: Record<string, Record<string, number>> = {};
    for (const item of industryRiskData) {
      if (!industryRiskMap[item.industry]) {
        industryRiskMap[item.industry] = { low: 0, medium: 0, high: 0, critical: 0 };
      }
      industryRiskMap[item.industry][item.riskLevel] = item._count.riskLevel;
    }

    const industryRiskBreakdown = Object.entries(industryRiskMap).map(([industry, risks]) => ({
      industry,
      label: getIndustryLabel(industry),
      icon: getIndustryEmoji(industry),
      low: risks.low || 0,
      medium: risks.medium || 0,
      high: risks.high || 0,
      critical: risks.critical || 0,
      totalRiskScore: (risks.critical || 0) * 4 + (risks.high || 0) * 3 + (risks.medium || 0) * 2 + (risks.low || 0),
    }));

    // ── Top Industry Risks ──────────────────────────────────────
    // Get the highest risk shipments per industry
    // Note: SQLite sorts alphabetically, so we sort in code using risk severity order
    const riskOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const allIndustries = [...new Set((await db.shipment.findMany({ select: { industry: true } })).map(s => s.industry))];

    const topIndustryRisks = [];
    for (const industry of allIndustries) {
      const riskyShipments = await db.shipment.findMany({
        where: {
          industry,
          riskLevel: { in: ['critical', 'high'] },
        },
        orderBy: { estimatedValue: 'desc' },
        select: {
          industry: true,
          reference: true,
          title: true,
          riskLevel: true,
          riskNotes: true,
          estimatedValue: true,
        },
      });

      if (riskyShipments.length > 0) {
        // Sort by risk severity (critical first), then by estimated value
        riskyShipments.sort((a, b) => {
          const riskDiff = (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);
          if (riskDiff !== 0) return riskDiff;
          return (b.estimatedValue || 0) - (a.estimatedValue || 0);
        });

        topIndustryRisks.push({
          ...riskyShipments[0],
          label: getIndustryLabel(industry),
          icon: getIndustryEmoji(industry),
        });
      }
    }

    // Sort by estimatedValue descending
    topIndustryRisks.sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0));

    // Monthly savings trend (mock data based on current metrics)
    const savingsTrend = [
      { month: 'Jan', value: 45000 },
      { month: 'Feb', value: 62000 },
      { month: 'Mar', value: 78000 },
      { month: 'Apr', value: 91000 },
      { month: 'May', value: 105000 },
      { month: 'Jun', value: 124000 },
      { month: 'Jul', value: 138000 },
      { month: 'Aug', value: 156000 },
    ];

    // ── Industry Rules Summary ─────────────────────────────────
    const industryRulesCount = await db.industryRule.groupBy({
      by: ['industry'],
      _count: { industry: true },
    });

    const industryRulesSummary = industryRulesCount.map(item => ({
      industry: item.industry,
      label: getIndustryLabel(item.industry),
      icon: getIndustryEmoji(item.industry),
      rulesCount: item._count.industry,
    }));

    // ── Full Industry List with coverage ────────────────────────
    const industryCoverage = INDUSTRY_LIST.map(config => {
      const found = shipmentsByIndustry.find(s => s.industry === config.key);
      return {
        key: config.key,
        label: config.label,
        icon: config.icon,
        shipmentCount: found ? found._count.industry : 0,
        hasCoverage: !!found,
      };
    });

    return NextResponse.json({
      metrics,
      shipmentsByStatus,
      shipmentsByIndustry,
      riskDistribution,
      unreadAlerts,
      recentAlerts,
      recentShipments,
      agentLogs,
      agentStats,
      totalRiskValue: totalRiskValue._sum.estimatedValue || 0,
      savingsTrend,
      industryBreakdown,
      industryRiskBreakdown,
      topIndustryRisks,
      industryRulesSummary,
      industryCoverage,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
