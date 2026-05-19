import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isResolved = searchParams.get('isResolved');
    const severity = searchParams.get('severity');

    const where: Record<string, unknown> = {};

    if (isResolved !== null && isResolved !== undefined) {
      where.isResolved = isResolved === 'true';
    }

    if (severity) {
      const severities = severity.split(',');
      where.severity = { in: severities };
    }

    const alerts = await db.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        shipment: {
          select: { reference: true, title: true, industry: true, riskLevel: true, id: true, status: true, commodity: true, totalAmount: true }
        }
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Alerts API error:', error);
    return NextResponse.json({ error: 'Failed to load alerts' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { alertId, action, shipmentId, shipmentStatus } = body;

    if (action === 'resolve' && alertId) {
      await db.alert.update({
        where: { id: alertId },
        data: { isResolved: true, isRead: true },
      });

      // Optionally update shipment status
      if (shipmentId && shipmentStatus) {
        await db.shipment.update({
          where: { id: shipmentId },
          data: { status: shipmentStatus },
        });
      }

      // Create audit trail
      if (shipmentId) {
        await db.auditTrail.create({
          data: {
            shipmentId,
            action: shipmentStatus === 'held' ? 'shipment_held' : 'approved_forwarded',
            agentName: 'human_reviewer',
            details: shipmentStatus === 'held' ? 'Shipment held by human reviewer' : 'Approved and forwarded to finance by human reviewer',
          },
        });
      }
    } else if (action === 'read' && alertId) {
      await db.alert.update({
        where: { id: alertId },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
