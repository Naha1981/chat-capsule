import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const alerts = await db.alert.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        shipment: {
          select: { reference: true, title: true, industry: true, riskLevel: true }
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
    const { alertId, action } = body;

    if (!alertId || !action) {
      return NextResponse.json({ error: 'alertId and action are required' }, { status: 400 });
    }

    if (action === 'read') {
      await db.alert.update({
        where: { id: alertId },
        data: { isRead: true },
      });
    } else if (action === 'resolve') {
      await db.alert.update({
        where: { id: alertId },
        data: { isResolved: true, isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
