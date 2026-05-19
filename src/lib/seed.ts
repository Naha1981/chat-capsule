import { db } from './db';

const SAMPLE_SHIPMENTS = [
  {
    reference: 'SHP-2025-0042',
    title: 'Manganese Ore Export - Durban Port',
    industry: 'mining',
    status: 'flagged',
    origin: 'Hotazel, Northern Cape',
    destination: 'Durban Port, KZN',
    supplier: 'AEP Mining (Pty) Ltd',
    buyer: 'Sinosteel Corporation',
    totalAmount: 4280000,
    currency: 'ZAR',
    grossWeightKg: 28500,
    commodity: 'Manganese Ore',
    hsCode: '2602.00',
    riskLevel: 'high',
    riskNotes: '0.5-ton weight discrepancy detected between BoL and Packing List',
    estimatedValue: 12000,
  },
  {
    reference: 'SHP-2025-0039',
    title: 'Chrome Concentrate Shipment - Richards Bay',
    industry: 'mining',
    status: 'cleared',
    origin: 'Rustenburg, North West',
    destination: 'Richards Bay, KZN',
    supplier: 'Tharisa Minerals',
    buyer: 'Yildirim Group',
    totalAmount: 3150000,
    currency: 'ZAR',
    grossWeightKg: 22000,
    commodity: 'Chrome Concentrate',
    hsCode: '2610.00',
    riskLevel: 'low',
    estimatedValue: 0,
  },
  {
    reference: 'SHP-2025-0041',
    title: 'Crude Oil Import - Cape Town',
    industry: 'oil',
    status: 'processing',
    origin: 'Lagos, Nigeria',
    destination: 'Cape Town, Western Cape',
    supplier: 'NNPC Limited',
    buyer: 'AEP Energy (Pty) Ltd',
    totalAmount: 18700000,
    currency: 'ZAR',
    grossWeightKg: 45000,
    commodity: 'Bonny Light Crude',
    hsCode: '2709.00',
    riskLevel: 'medium',
    riskNotes: 'API Gravity variance detected - needs verification',
    estimatedValue: 45000,
  },
  {
    reference: 'SHP-2025-0038',
    title: 'Mining Equipment Import - OR Tambo',
    industry: 'logistics',
    status: 'cleared',
    origin: 'Shanghai, China',
    destination: 'OR Tambo, Gauteng',
    supplier: 'Caterpillar Inc.',
    buyer: 'Sibanye-Stillwater',
    totalAmount: 8900000,
    currency: 'ZAR',
    grossWeightKg: 15600,
    commodity: 'Mining Excavator Parts',
    hsCode: '8429.52',
    riskLevel: 'low',
    estimatedValue: 0,
  },
  {
    reference: 'SHP-2025-0043',
    title: 'Sulphuric Acid Transport - Port Elizabeth',
    industry: 'mining',
    status: 'held',
    origin: 'Johannesburg, Gauteng',
    destination: 'Port Elizabeth, Eastern Cape',
    supplier: 'Sasol Chemical Industries',
    buyer: 'Mossel Bay Mining Co',
    totalAmount: 950000,
    currency: 'ZAR',
    grossWeightKg: 8200,
    commodity: 'Sulphuric Acid',
    hsCode: '2807.00',
    riskLevel: 'critical',
    riskNotes: 'HS Code mismatch: Description suggests industrial acid but HS Code points to different classification. SARS compliance risk.',
    estimatedValue: 20000,
  },
  {
    reference: 'SHP-2025-0037',
    title: 'Coal Export - Richards Bay Terminal',
    industry: 'mining',
    status: 'cleared',
    origin: 'Witbank, Mpumalanga',
    destination: 'Richards Bay, KZN',
    supplier: 'Exxaro Resources',
    buyer: 'Eskom Holdings',
    totalAmount: 2100000,
    currency: 'ZAR',
    grossWeightKg: 35000,
    commodity: 'Thermal Coal',
    hsCode: '2701.12',
    riskLevel: 'low',
    estimatedValue: 0,
  },
  {
    reference: 'SHP-2025-0044',
    title: 'Diesel Fuel Import - Durban',
    industry: 'oil',
    status: 'pending',
    origin: 'Dubai, UAE',
    destination: 'Durban, KZN',
    supplier: 'ENOC Trading',
    buyer: 'AEP Energy (Pty) Ltd',
    totalAmount: 12500000,
    currency: 'ZAR',
    grossWeightKg: 38000,
    commodity: 'Ultra Low Sulphur Diesel',
    hsCode: '2710.19',
    riskLevel: 'medium',
    riskNotes: 'Awaiting SARS customs pre-clearance',
    estimatedValue: 15000,
  },
  {
    reference: 'SHP-2025-0040',
    title: 'Environmental Permit Renewal - Limpopo',
    industry: 'mining',
    status: 'processing',
    origin: 'Polokwane, Limpopo',
    destination: 'DMR Office, Pretoria',
    supplier: 'Mokopane Platinum Mine',
    buyer: 'Department of Mineral Resources',
    totalAmount: 0,
    currency: 'ZAR',
    grossWeightKg: 0,
    commodity: 'Environmental Compliance Permit',
    hsCode: 'N/A',
    riskLevel: 'medium',
    riskNotes: 'Permit expires in 14 days - renewal in progress',
    estimatedValue: 50000,
  },
];

const SAMPLE_METRICS = [
  { key: 'total_savings_zar', value: 847000, label: 'Total Savings', unit: 'ZAR' },
  { key: 'documents_processed', value: 1247, label: 'Documents Processed', unit: 'count' },
  { key: 'risks_caught', value: 89, label: 'Risks Caught', unit: 'count' },
  { key: 'active_shipments', value: 8, label: 'Active Shipments', unit: 'count' },
  { key: 'avg_processing_time', value: 3.2, label: 'Avg Processing Time', unit: 'seconds' },
  { key: 'compliance_rate', value: 97.4, label: 'Compliance Rate', unit: '%' },
  { key: 'port_delays_prevented', value: 23, label: 'Port Delays Prevented', unit: 'count' },
  { key: 'sars_audits_passed', value: 156, label: 'SARS Audits Passed', unit: 'count' },
];

export async function seedDatabase() {
  // Check if already seeded
  const existingShipments = await db.shipment.count();
  if (existingShipments > 0) {
    return { seeded: false, message: 'Database already seeded' };
  }

  // Create shipments
  for (const shipment of SAMPLE_SHIPMENTS) {
    const createdShipment = await db.shipment.create({
      data: shipment
    });

    // Create documents for each shipment
    const docTypes = ['invoice', 'bol', 'packing_list'];
    for (const docType of docTypes) {
      await db.document.create({
        data: {
          shipmentId: createdShipment.id,
          fileName: `${shipment.reference}_${docType}.pdf`,
          fileType: docType,
          source: ['upload', 'email', 'whatsapp'][Math.floor(Math.random() * 3)],
          status: 'processed',
        }
      });
    }

    // Create agent logs for each shipment
    const agentEntries = [
      { agentName: 'triage_clerk', agentRole: 'Router', status: 'completed', duration: 340 },
      { agentName: 'data_extractor', agentRole: 'OCR', status: 'completed', duration: 1200 },
      { agentName: 'auditor', agentRole: 'Validator', status: shipment.riskLevel === 'critical' ? 'failed' : 'completed', duration: 890 },
      { agentName: 'risk_analyst', agentRole: 'Decision Maker', status: 'completed', duration: 560 },
      { agentName: 'dispatcher', agentRole: 'Communicator', status: 'completed', duration: 230 },
    ];

    for (const entry of agentEntries) {
      await db.agentLog.create({
        data: {
          shipmentId: createdShipment.id,
          ...entry,
          input: `Processing ${shipment.reference}`,
          output: entry.status === 'completed' ? 'Analysis complete' : 'Mismatch detected',
        }
      });
    }

    // Create alerts for flagged/critical shipments
    if (shipment.riskLevel === 'high' || shipment.riskLevel === 'critical') {
      await db.alert.create({
        data: {
          shipmentId: createdShipment.id,
          type: shipment.riskLevel === 'critical' ? 'compliance' : 'mismatch',
          severity: shipment.riskLevel,
          title: shipment.riskLevel === 'critical' ? 'SARS Compliance Risk Detected' : 'Weight Discrepancy Found',
          message: shipment.riskNotes || 'Review required',
          channel: shipment.riskLevel === 'critical' ? 'whatsapp' : 'dashboard',
          isRead: false,
        }
      });
    }

    // Create audit trail
    await db.auditTrail.createMany({
      data: [
        { shipmentId: createdShipment.id, action: 'document_received', agentName: 'system', details: 'Documents ingested via upload' },
        { shipmentId: createdShipment.id, action: 'triage_complete', agentName: 'triage_clerk', details: `Classified as ${shipment.industry} - ${shipment.commodity}` },
        { shipmentId: createdShipment.id, action: 'extraction_complete', agentName: 'data_extractor', details: 'Data extracted successfully' },
        { shipmentId: createdShipment.id, action: 'audit_flag', agentName: 'auditor', details: shipment.riskLevel !== 'low' ? 'Flags raised during audit' : 'No issues found' },
        { shipmentId: createdShipment.id, action: 'risk_assessed', agentName: 'risk_analyst', details: `Risk level: ${shipment.riskLevel}` },
        { shipmentId: createdShipment.id, action: 'dispatched', agentName: 'dispatcher', details: shipment.riskLevel === 'critical' ? 'WhatsApp alert sent to MD' : 'Dashboard notification created' },
      ]
    });
  }

  // Create dashboard metrics
  for (const metric of SAMPLE_METRICS) {
    await db.dashboardMetric.create({
      data: metric
    });
  }

  return { seeded: true, shipmentsCreated: SAMPLE_SHIPMENTS.length };
}
