import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Core metrics - lightweight queries only
    const metrics = await db.dashboardMetric.findMany();
    
    const shipmentsByStatus = await db.shipment.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const riskDistribution = await db.shipment.groupBy({
      by: ['riskLevel'],
      _count: { riskLevel: true },
    });

    const unreadAlerts = await db.alert.count({
      where: { isRead: false },
    });

    // Recent alerts - only 5, minimal includes
    const recentAlerts = await db.alert.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { shipment: { select: { reference: true, title: true, industry: true } } },
    });

    // Agent stats
    const agentStats = await db.agentLog.groupBy({
      by: ['agentName'],
      _count: { agentName: true },
      _avg: { duration: true },
    });

    // Savings trend (static data)
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
      riskDistribution,
      unreadAlerts,
      recentAlerts,
      agentStats,
      savingsTrend,
      totalRiskValue: 1597000,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
