import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runSwarmPipeline } from '@/lib/agents';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentText, shipmentId } = body;

    if (!documentText) {
      return NextResponse.json({ error: 'documentText is required' }, { status: 400 });
    }

    // Get shipment context if available
    let shipmentContext = '';
    if (shipmentId) {
      const shipment = await db.shipment.findUnique({
        where: { id: shipmentId },
        include: { documents: true },
      });
      if (shipment) {
        shipmentContext = JSON.stringify({
          reference: shipment.reference,
          industry: shipment.industry,
          commodity: shipment.commodity,
          supplier: shipment.supplier,
          hsCode: shipment.hsCode,
        });
      }
    }

    // Update shipment status to processing
    if (shipmentId) {
      await db.shipment.update({
        where: { id: shipmentId },
        data: { status: 'processing' },
      });
    }

    // Run the swarm pipeline
    const result = await runSwarmPipeline(documentText, shipmentContext);

    // Determine final risk level and status from the risk analyst
    const riskData = result.risk.parsedOutput as { severityLevel?: string; estimatedCostZAR?: number };
    const riskLevel = (riskData?.severityLevel || 'low').toLowerCase();
    const estimatedCost = riskData?.estimatedCostZAR || 0;

    let finalStatus = 'cleared';
    if (riskLevel === 'critical') finalStatus = 'held';
    else if (riskLevel === 'high') finalStatus = 'flagged';
    else if (riskLevel === 'medium') finalStatus = 'processing';

    // Update shipment with results
    if (shipmentId) {
      await db.shipment.update({
        where: { id: shipmentId },
        data: {
          status: finalStatus,
          riskLevel,
          riskNotes: JSON.stringify(result.risk.parsedOutput),
          estimatedValue: estimatedCost,
        },
      });

      // Create agent logs
      const agentEntries = [
        { agentName: 'triage_clerk', agentRole: 'Router', ...result.triage },
        { agentName: 'data_extractor', agentRole: 'OCR', ...result.extraction },
        { agentName: 'auditor', agentRole: 'Validator', ...result.audit },
        { agentName: 'risk_analyst', agentRole: 'Decision Maker', ...result.risk },
        { agentName: 'dispatcher', agentRole: 'Communicator', ...result.dispatch },
      ];

      for (const entry of agentEntries) {
        await db.agentLog.create({
          data: {
            shipmentId,
            agentName: entry.agentName,
            agentRole: entry.agentRole,
            status: 'completed',
            input: 'Processing document',
            output: entry.output?.substring(0, 500),
            duration: entry.duration,
          },
        });
      }

      // Create audit trail entries
      await db.auditTrail.createMany({
        data: [
          { shipmentId, action: 'triage_complete', agentName: 'triage_clerk', details: 'Document classified' },
          { shipmentId, action: 'extraction_complete', agentName: 'data_extractor', details: 'Data extracted' },
          { shipmentId, action: 'audit_flag', agentName: 'auditor', details: `Audit ${riskLevel === 'low' ? 'passed' : 'flagged'}` },
          { shipmentId, action: 'risk_assessed', agentName: 'risk_analyst', details: `Risk: ${riskLevel}` },
          { shipmentId, action: 'dispatched', agentName: 'dispatcher', details: 'Notification sent' },
        ],
      });

      // Create alert if risk is high or critical
      if (riskLevel === 'high' || riskLevel === 'critical') {
        const dispatchData = result.dispatch.parsedOutput as { whatsappSummary?: string; alertLevel?: string };
        await db.alert.create({
          data: {
            shipmentId,
            type: riskLevel === 'critical' ? 'compliance' : 'mismatch',
            severity: riskLevel,
            title: riskLevel === 'critical' ? 'CRITICAL: Compliance Risk' : 'HIGH: Document Mismatch',
            message: dispatchData?.whatsappSummary || 'Review required',
            channel: riskLevel === 'critical' ? 'whatsapp' : 'dashboard',
            isRead: false,
          },
        });
      }

      // Update dashboard metrics
      const docsMetric = await db.dashboardMetric.findUnique({ where: { key: 'documents_processed' } });
      if (docsMetric) {
        await db.dashboardMetric.update({
          where: { key: 'documents_processed' },
          data: { value: docsMetric.value + 1 },
        });
      }

      if (riskLevel !== 'low') {
        const risksMetric = await db.dashboardMetric.findUnique({ where: { key: 'risks_caught' } });
        if (risksMetric) {
          await db.dashboardMetric.update({
            where: { key: 'risks_caught' },
            data: { value: risksMetric.value + 1 },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        riskLevel,
        finalStatus,
        totalDuration: result.totalDuration,
        triage: result.triage.parsedOutput,
        extraction: result.extraction.parsedOutput,
        audit: result.audit.parsedOutput,
        risk: result.risk.parsedOutput,
        dispatch: result.dispatch.parsedOutput,
      },
    });
  } catch (error) {
    console.error('Process API error:', error);
    return NextResponse.json({ error: 'Failed to process document' }, { status: 500 });
  }
}
