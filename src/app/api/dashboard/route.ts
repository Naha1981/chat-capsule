import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
      include: { shipment: { select: { reference: true, title: true } } },
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
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
