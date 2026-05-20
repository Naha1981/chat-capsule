import ZAI from 'z-ai-web-dev-sdk';

// Agent definitions with their specialized system prompts
export const AGENTS = {
  triage_clerk: {
    name: 'Triage Clerk',
    role: 'Router',
    icon: '📋',
    color: '#10b981',
    systemPrompt: `You are the Triage Clerk for CapsuleFlow AI. Your job is to analyze incoming raw text or files from WhatsApp and Email.
Classify the document: Is it a Commercial Invoice, Bill of Lading (BoL), Packing List, Air Waybill, or Mining/Environmental Permit?
Identify the Industry: Logistics, Crude Oil, or Mine Development.
Extract the 'Shipment Reference' or 'Unique ID' immediately to maintain the thread.
Output a routing instruction for the Data Extractor Agent.
Tone: Efficient, administrative, and precise. If the document is not operational, flag as 'Noise'.
You MUST respond in valid JSON format with fields: documentType, industry, shipmentReference, routingInstruction, isNoise`
  },
  data_extractor: {
    name: 'Data Extractor',
    role: 'OCR Specialist',
    icon: '🔍',
    color: '#3b82f6',
    systemPrompt: `You are the Data Extractor Agent. You receive documents identified by the Triage Clerk. Your sole mission is high-accuracy data capture.
Extract: Supplier Name, Buyer Name, Total Amount, Currency, Total Gross Weight (in KG), and all HS CODES.
For Oil docs: Extract API Gravity, Sulfur content, and Barrel count.
For Mining docs: Extract Expiry Dates and Permit Numbers.
Rules: Never guess a number. If a value is blurry or missing, return 'null'.
Output Format: Structured JSON only. You are the 'Typewriter' of the swarm.
You MUST respond in valid JSON format with fields: supplierName, buyerName, totalAmount, currency, grossWeightKg, hsCodes (array), industrySpecific (object with relevant fields)`
  },
  auditor: {
    name: 'Auditor',
    role: 'Validator',
    icon: '🛡️',
    color: '#f59e0b',
    systemPrompt: `You are the Auditor Agent. You are the 'Digital Firewall' for AEP Energy.
You will receive extracted data from the Specialist and historical records.
Compare the Weight on the BoL vs the Packing List.
Compare the Bank Account on the Invoice vs the Verified Supplier List.
Verify the HS CODE: Does it match the commodity description (e.g., Manganese vs Chrome)?
Flag any variance over 1% as a 'CRITICAL MISMATCH'.
Goal: Find the error before SARS or the Port finds it.
You MUST respond in valid JSON format with fields: mismatches (array of {field, expected, actual, variance, severity}), isCompliant (boolean), riskFlags (array of strings), recommendation`
  },
  risk_analyst: {
    name: 'Risk Analyst',
    role: 'Decision Maker',
    icon: '📊',
    color: '#ef4444',
    systemPrompt: `You are the Risk Analyst. You translate operational errors into financial consequences for the CEO.
If the Auditor finds a 'Missing Document', calculate the cost: R15,000 per day in port storage.
If the Auditor finds an 'HS Code Mismatch', calculate the risk: Potential SARS fine of R20,000 + cargo seizure.
If a Weight Mismatch is found, calculate the loss: (Difference in KG * Commodity Market Price).
Assign a Severity Level: LOW (Administrative), MEDIUM (Delayed), HIGH (Financial Loss), or CRITICAL (Legal/Fraud).
Your output justifies the R7,500/mo subscription fee.
You MUST respond in valid JSON format with fields: severityLevel, estimatedCostZAR, riskCategory, financialImpact (object with breakdown), recommendation, urgencyScore (1-10)`
  },
  dispatcher: {
    name: 'Dispatcher',
    role: 'Communicator',
    icon: '📨',
    color: '#8b5cf6',
    systemPrompt: `You are the Dispatcher. You are the only agent the human staff 'talks' to.
For WhatsApp: Create a 3-line 'Executive Summary'. Use emojis for status (🚨 for High Risk, ✅ for Success). Include a 'Quick Action' link.
For Email: Format a professional 'Payment Pack' for the Finance Department. Attach the structured data and the original PDF.
If a 'CRITICAL' risk is found, format a high-priority alert for the Managing Director.
Tone: Professional, South African business English, and urgent when necessary.
You MUST respond in valid JSON format with fields: whatsappSummary, emailBody, alertLevel, quickActions (array), isUrgent (boolean)`
  }
} as const;

export type AgentKey = keyof typeof AGENTS;

// Run a single agent
export async function runAgent(agentKey: AgentKey, input: string): Promise<{
  agentName: string;
  output: string;
  duration: number;
  parsedOutput: Record<string, unknown>;
}> {
  const agent = AGENTS[agentKey];
  const startTime = Date.now();

  const zai = await ZAI.create();

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'assistant',
        content: agent.systemPrompt
      },
      {
        role: 'user',
        content: input
      }
    ],
    thinking: { type: 'disabled' }
  });

  const rawOutput = completion.choices[0]?.message?.content || '';
  const duration = Date.now() - startTime;

  let parsedOutput: Record<string, unknown> = {};
  try {
    // Try to extract JSON from the response
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedOutput = JSON.parse(jsonMatch[0]);
    }
  } catch {
    parsedOutput = { raw: rawOutput };
  }

  return {
    agentName: agent.name,
    output: rawOutput,
    duration,
    parsedOutput
  };
}

// Run the full swarm pipeline
export async function runSwarmPipeline(documentText: string, shipmentContext?: string): Promise<{
  triage: Awaited<ReturnType<typeof runAgent>>;
  extraction: Awaited<ReturnType<typeof runAgent>>;
  audit: Awaited<ReturnType<typeof runAgent>>;
  risk: Awaited<ReturnType<typeof runAgent>>;
  dispatch: Awaited<ReturnType<typeof runAgent>>;
  totalDuration: number;
}> {
  const pipelineStart = Date.now();

  // Step 1: Triage
  const triage = await runAgent('triage_clerk', documentText);

  // Step 2: Extraction (receives triage output)
  const extractionInput = JSON.stringify({
    documentText,
    triageOutput: triage.parsedOutput,
    shipmentContext
  });
  const extraction = await runAgent('data_extractor', extractionInput);

  // Step 3: Audit (receives extraction output)
  const auditInput = JSON.stringify({
    extractedData: extraction.parsedOutput,
    documentText,
    shipmentContext
  });
  const audit = await runAgent('auditor', auditInput);

  // Step 4: Risk Analysis (receives audit output)
  const riskInput = JSON.stringify({
    extractedData: extraction.parsedOutput,
    auditFindings: audit.parsedOutput,
    shipmentContext
  });
  const risk = await runAgent('risk_analyst', riskInput);

  // Step 5: Dispatch (receives all outputs)
  const dispatchInput = JSON.stringify({
    triageOutput: triage.parsedOutput,
    extractedData: extraction.parsedOutput,
    auditFindings: audit.parsedOutput,
    riskAssessment: risk.parsedOutput
  });
  const dispatch = await runAgent('dispatcher', dispatchInput);

  return {
    triage,
    extraction,
    audit,
    risk,
    dispatch,
    totalDuration: Date.now() - pipelineStart
  };
}
