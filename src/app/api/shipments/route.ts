import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single shipment detail
    if (id) {
      const shipment = await db.shipment.findUnique({
        where: { id },
        include: {
          documents: true,
          agentLogs: { orderBy: { createdAt: 'asc' } },
          auditTrails: { orderBy: { createdAt: 'asc' } },
          timeline: { orderBy: { timestamp: 'asc' } },
          alerts: true,
        },
      });
      if (!shipment) {
        return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
      }
      return NextResponse.json(shipment);
    }

    // List all shipments with includes
    const shipments = await db.shipment.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        documents: true,
        agentLogs: { orderBy: { createdAt: 'asc' } },
        auditTrails: { orderBy: { createdAt: 'asc' } },
        timeline: { orderBy: { timestamp: 'asc' } },
        alerts: true,
        _count: { select: { alerts: true, agentLogs: true, documents: true } },
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { shipmentId, status, riskLevel } = body;

    if (!shipmentId) {
      return NextResponse.json({ error: 'shipmentId is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (riskLevel) updateData.riskLevel = riskLevel;

    const shipment = await db.shipment.update({
      where: { id: shipmentId },
      data: updateData,
    });

    return NextResponse.json(shipment);
  } catch (error) {
    console.error('Update shipment error:', error);
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 });
  }
}
