import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSdk } from 'z-ai-web-dev-sdk';
import {
  buildTriagePrompt,
  buildExtractorPrompt,
  buildAuditorPrompt,
  buildRiskPrompt,
  buildDispatcherPrompt,
  getIndustryConfig,
  type IndustryKey,
} from '@/lib/industries';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip markdown code fences (```json ... ``` or ``` ... ```) from LLM output */
function stripCodeFences(text: string): string {
  // Remove opening fence with optional language tag
  let cleaned = text.replace(/^```(?:json|JSON)?\s*\n?/m, '');
  // Remove closing fence
  cleaned = cleaned.replace(/\n?```\s*$/m, '');
  return cleaned.trim();
}

/** Safely parse JSON from an LLM response, tolerating code fences */
function parseAgentJSON(raw: string): Record<string, unknown> {
  try {
    const stripped = stripCodeFences(raw);
    // Try direct parse first
    try {
      return JSON.parse(stripped) as Record<string, unknown>;
    } catch {
      // Fall back to extracting the first {…} block
      const match = stripped.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]) as Record<string, unknown>;
      }
    }
  } catch {
    // Last resort – return raw text wrapper
  }
  return { raw };
}

/** Call a single agent and return its raw text output */
async function callAgent(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const sdk = createSdk({ apiKey: process.env.ZAI_API_KEY || '' });

  const response = await sdk.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content ?? '';
}

/** Generate a short reference like CFP-2025-A7K3 */
function generateShipmentRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `CFP-${new Date().getFullYear()}-${suffix}`;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentText, industry: rawIndustry } = body as {
      documentText?: string;
      industry?: string;
    };

    if (!documentText) {
      return NextResponse.json(
        { error: 'documentText is required' },
        { status: 400 },
      );
    }

    const industry: IndustryKey = (rawIndustry || 'logistics') as IndustryKey;
    const industryConfig = getIndustryConfig(industry);

    // ── 1. Create Shipment & Document ──────────────────────────────────
    const shipmentRef = generateShipmentRef();

    const shipment = await db.shipment.create({
      data: {
        reference: shipmentRef,
        title: `${industryConfig.label} Document Processing`,
        industry,
        status: 'processing',
      },
    });

    const document = await db.document.create({
      data: {
        shipmentId: shipment.id,
        fileName: `${shipmentRef}-document.txt`,
        fileType: 'raw_text',
        source: 'upload',
        content: documentText.substring(0, 5000),
        status: 'pending',
      },
    });

    // ── 2. Run 5-Agent Pipeline ────────────────────────────────────────

    // Results accumulators
    let triageOutput: Record<string, unknown> = {};
    let extractionOutput: Record<string, unknown> = {};
    let auditOutput: Record<string, unknown> = {};
    let riskOutput: Record<string, unknown> = {};
    let dispatchOutput: Record<string, unknown> = {};

    let triageRaw = '';
    let extractionRaw = '';
    let auditRaw = '';
    let riskRaw = '';
    let dispatchRaw = '';

    let triageDuration = 0;
    let extractionDuration = 0;
    let auditDuration = 0;
    let riskDuration = 0;
    let dispatchDuration = 0;

    let triageStatus = 'completed';
    let extractionStatus = 'completed';
    let auditStatus = 'completed';
    let riskStatus = 'completed';
    let dispatchStatus = 'completed';

    // Agent 1 – Triage Clerk
    try {
      const start = Date.now();
      triageRaw = await callAgent(
        buildTriagePrompt(industry),
        documentText,
      );
      triageDuration = Date.now() - start;
      triageOutput = parseAgentJSON(triageRaw);
    } catch (err) {
      triageStatus = 'failed';
      triageOutput = { error: String(err) };
    }

    // Agent 2 – Data Extractor
    try {
      const start = Date.now();
      extractionRaw = await callAgent(
        buildExtractorPrompt(industry),
        JSON.stringify({
          documentText,
          triageOutput,
          industry,
        }),
      );
      extractionDuration = Date.now() - start;
      extractionOutput = parseAgentJSON(extractionRaw);
    } catch (err) {
      extractionStatus = 'failed';
      extractionOutput = { error: String(err) };
    }

    // Agent 3 – Auditor
    try {
      const start = Date.now();
      const auditRulesContext = industryConfig.auditRules
        .map(
          (r) =>
            `- ${r.ruleName}: ${r.logicDesc} (Severity: ${r.severity}, Category: ${r.category})`,
        )
        .join('\n');

      auditRaw = await callAgent(
        buildAuditorPrompt(industry),
        JSON.stringify({
          extractionOutput,
          industryRules: auditRulesContext,
          industry,
        }),
      );
      auditDuration = Date.now() - start;
      auditOutput = parseAgentJSON(auditRaw);
    } catch (err) {
      auditStatus = 'failed';
      auditOutput = { error: String(err) };
    }

    // Agent 4 – Risk Analyst
    try {
      const start = Date.now();
      riskRaw = await callAgent(
        buildRiskPrompt(industry),
        JSON.stringify({
          auditOutput,
          industry,
        }),
      );
      riskDuration = Date.now() - start;
      riskOutput = parseAgentJSON(riskRaw);
    } catch (err) {
      riskStatus = 'failed';
      riskOutput = { error: String(err) };
    }

    // Agent 5 – Dispatcher
    try {
      const start = Date.now();
      dispatchRaw = await callAgent(
        buildDispatcherPrompt(industry),
        JSON.stringify({
          triageOutput,
          extractionOutput,
          auditOutput,
          riskOutput,
          industry,
        }),
      );
      dispatchDuration = Date.now() - start;
      dispatchOutput = parseAgentJSON(dispatchRaw);
    } catch (err) {
      dispatchStatus = 'failed';
      dispatchOutput = { error: String(err) };
    }

    // ── 3. Determine risk level & shipment status ──────────────────────

    // Try to read severity from risk analyst output
    const financialSummary = riskOutput.financial_summary as
      | Record<string, unknown>
      | undefined;
    const riskBreakdown = riskOutput.risk_breakdown as
      | Array<Record<string, unknown>>
      | undefined;

    // Determine highest severity from risk breakdown
    let riskLevel = 'low';
    if (riskBreakdown && Array.isArray(riskBreakdown)) {
      const severities = riskBreakdown
        .map((r) => String(r.severity_level ?? r.severityLevel ?? '').toLowerCase())
        .filter(Boolean);
      if (severities.includes('critical')) riskLevel = 'critical';
      else if (severities.includes('high')) riskLevel = 'high';
      else if (severities.includes('medium')) riskLevel = 'medium';
    }

    // Also check financial summary status
    const auditSummary = auditOutput.audit_summary as
      | Record<string, unknown>
      | undefined;
    if (auditSummary?.status === 'CRITICAL') {
      riskLevel = 'critical';
    } else if (auditSummary?.status === 'WARNING' && riskLevel === 'low') {
      riskLevel = 'medium';
    }

    let finalStatus = 'cleared';
    if (riskLevel === 'critical') finalStatus = 'held';
    else if (riskLevel === 'high') finalStatus = 'flagged';
    else if (riskLevel === 'medium') finalStatus = 'processing';

    // ── 4. Update Shipment ─────────────────────────────────────────────

    await db.shipment.update({
      where: { id: shipment.id },
      data: {
        status: finalStatus,
        riskLevel,
        riskNotes: JSON.stringify(riskOutput),
        estimatedValue:
          (financialSummary?.total_value_at_risk_rand as number) ?? 0,
      },
    });

    // Update document with extracted data
    await db.document.update({
      where: { id: document.id },
      data: {
        extractedData: JSON.stringify(extractionOutput),
        status: finalStatus === 'held' ? 'critical' : 'processed',
      },
    });

    // ── 5. Agent Logs ──────────────────────────────────────────────────

    const agentEntries = [
      {
        agentName: 'triage_clerk',
        agentRole: 'Router',
        status: triageStatus,
        output: triageRaw.substring(0, 500),
        duration: triageDuration,
      },
      {
        agentName: 'data_extractor',
        agentRole: 'OCR Specialist',
        status: extractionStatus,
        output: extractionRaw.substring(0, 500),
        duration: extractionDuration,
      },
      {
        agentName: 'auditor',
        agentRole: 'Validator',
        status: auditStatus,
        output: auditRaw.substring(0, 500),
        duration: auditDuration,
      },
      {
        agentName: 'risk_analyst',
        agentRole: 'Decision Maker',
        status: riskStatus,
        output: riskRaw.substring(0, 500),
        duration: riskDuration,
      },
      {
        agentName: 'dispatcher',
        agentRole: 'Communicator',
        status: dispatchStatus,
        output: dispatchRaw.substring(0, 500),
        duration: dispatchDuration,
      },
    ];

    for (const entry of agentEntries) {
      await db.agentLog.create({
        data: {
          shipmentId: shipment.id,
          agentName: entry.agentName,
          agentRole: entry.agentRole,
          status: entry.status,
          input: 'Processing document',
          output: entry.output,
          duration: entry.duration,
        },
      });
    }

    // ── 6. Audit Trail ─────────────────────────────────────────────────

    await db.auditTrail.createMany({
      data: [
        {
          shipmentId: shipment.id,
          action: 'triage_complete',
          agentName: 'triage_clerk',
          details: `Document classified for ${industryConfig.label}`,
        },
        {
          shipmentId: shipment.id,
          action: 'extraction_complete',
          agentName: 'data_extractor',
          details: 'Data extracted from document',
        },
        {
          shipmentId: shipment.id,
          action: 'audit_flag',
          agentName: 'auditor',
          details: `Audit ${riskLevel === 'low' ? 'passed' : 'flagged'} for ${industryConfig.label}`,
        },
        {
          shipmentId: shipment.id,
          action: 'risk_assessed',
          agentName: 'risk_analyst',
          details: `Risk level: ${riskLevel}`,
        },
        {
          shipmentId: shipment.id,
          action: 'dispatched',
          agentName: 'dispatcher',
          details: 'Notifications dispatched',
        },
      ],
    });

    // ── 7. Alert (if critical / high) ──────────────────────────────────

    if (riskLevel === 'critical' || riskLevel === 'high') {
      const comms = dispatchOutput.comms as
        | Record<string, unknown>
        | undefined;
      const whatsapp = comms?.whatsapp as Record<string, unknown> | undefined;
      const alertMessage =
        (whatsapp?.message_body as string) ||
        (riskOutput.summary as string) ||
        `${riskLevel.toUpperCase()} risk detected in ${industryConfig.label} shipment ${shipmentRef}`;

      await db.alert.create({
        data: {
          shipmentId: shipment.id,
          type: riskLevel === 'critical' ? 'compliance' : 'mismatch',
          severity: riskLevel,
          title:
            riskLevel === 'critical'
              ? `CRITICAL: ${industryConfig.label} Compliance Risk`
              : `HIGH: ${industryConfig.label} Document Mismatch`,
          message: alertMessage,
          channel: riskLevel === 'critical' ? 'whatsapp' : 'dashboard',
          isRead: false,
        },
      });
    }

    // ── 8. Timeline Events ─────────────────────────────────────────────

    await db.timelineEvent.createMany({
      data: [
        {
          shipmentId: shipment.id,
          event: 'document_received',
          description: `Document uploaded for ${industryConfig.label} processing`,
          agentName: 'triage_clerk',
          icon: '📥',
        },
        {
          shipmentId: shipment.id,
          event: 'triage_complete',
          description: 'Document classified and routed',
          agentName: 'triage_clerk',
          icon: '📋',
        },
        {
          shipmentId: shipment.id,
          event: 'extraction_complete',
          description: 'Key data fields extracted',
          agentName: 'data_extractor',
          icon: '🔍',
        },
        {
          shipmentId: shipment.id,
          event: 'audit_complete',
          description: `Audit ${riskLevel === 'low' ? 'passed' : 'flagged issues'}`,
          agentName: 'auditor',
          icon: '🛡️',
        },
        {
          shipmentId: shipment.id,
          event: 'risk_assessed',
          description: `Risk assessed as ${riskLevel}`,
          agentName: 'risk_analyst',
          icon: '📊',
        },
        {
          shipmentId: shipment.id,
          event: 'dispatched',
          description: 'Notifications sent to stakeholders',
          agentName: 'dispatcher',
          icon: '📨',
        },
      ],
    });

    // ── 9. Dashboard Metrics ───────────────────────────────────────────

    const docsMetric = await db.dashboardMetric.findUnique({
      where: { key: 'documents_processed' },
    });
    if (docsMetric) {
      await db.dashboardMetric.update({
        where: { key: 'documents_processed' },
        data: { value: docsMetric.value + 1 },
      });
    }

    if (riskLevel !== 'low') {
      const risksMetric = await db.dashboardMetric.findUnique({
        where: { key: 'risks_caught' },
      });
      if (risksMetric) {
        await db.dashboardMetric.update({
          where: { key: 'risks_caught' },
          data: { value: risksMetric.value + 1 },
        });
      }
    }

    // Savings metric – use prevented loss from risk analyst
    const preventedLoss =
      (financialSummary?.prevented_loss_rand as number) ?? 0;
    if (preventedLoss > 0) {
      const savingsMetric = await db.dashboardMetric.findUnique({
        where: { key: 'total_savings' },
      });
      if (savingsMetric) {
        await db.dashboardMetric.update({
          where: { key: 'total_savings' },
          data: { value: savingsMetric.value + preventedLoss },
        });
      }
    }

    // ── 10. Return result ──────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      result: {
        triage: triageOutput,
        extraction: extractionOutput,
        audit: auditOutput,
        risk: riskOutput,
        dispatch: dispatchOutput,
        riskLevel,
        finalStatus,
        shipmentRef,
      },
    });
  } catch (error) {
    console.error('Process API error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 },
    );
  }
}
