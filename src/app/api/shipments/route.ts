import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const shipments = await db.shipment.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        documents: { select: { id: true, fileType: true, status: true } },
        _count: { select: { alerts: true, agentLogs: true } },
      },
    });

    return NextResponse.json(shipments);
  } catch (error) {
    console.error('Shipments API error:', error);
    return NextResponse.json({ error: 'Failed to load shipments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const shipment = await db.shipment.create({
      data: {
        reference: body.reference || `SHP-2025-${String(Date.now()).slice(-4)}`,
        title: body.title,
        industry: body.industry || 'logistics',
        origin: body.origin,
        destination: body.destination,
        supplier: body.supplier,
        buyer: body.buyer,
        totalAmount: body.totalAmount,
        currency: body.currency || 'ZAR',
        grossWeightKg: body.grossWeightKg,
        commodity: body.commodity,
        hsCode: body.hsCode,
        status: 'pending',
        riskLevel: 'low',
      },
    });

    // Create initial audit trail
    await db.auditTrail.create({
      data: {
        shipmentId: shipment.id,
        action: 'document_received',
        agentName: 'system',
        details: 'Shipment created via API',
      },
    });

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    console.error('Create shipment error:', error);
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
  }
}
