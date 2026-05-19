import { db } from './db';
import { INDUSTRY_LIST } from './industries';
import type { IndustryKey } from './industries';

// ─── Multi-Industry Sample Shipments ────────────────────────────────
// At least 8 industries with realistic South African data

interface ShipmentSeed {
  reference: string;
  title: string;
  industry: IndustryKey;
  status: string;
  origin: string | null;
  destination: string | null;
  supplier: string | null;
  buyer: string | null;
  totalAmount: number | null;
  currency: string;
  grossWeightKg: number | null;
  commodity: string | null;
  hsCode: string | null;
  riskLevel: string;
  riskNotes: string | null;
  estimatedValue: number | null;
}

const SAMPLE_SHIPMENTS: ShipmentSeed[] = [
  // ── LOGISTICS ──────────────────────────────────────────────────
  {
    reference: 'SHP-2025-0042',
    title: 'Manganese Ore Export - Durban Port',
    industry: 'logistics',
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
    riskNotes: null,
    estimatedValue: 0,
  },

  // ── MINING ─────────────────────────────────────────────────────
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
    riskNotes: null,
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
    riskNotes: null,
    estimatedValue: 0,
  },

  // ── PHARMA ─────────────────────────────────────────────────────
  {
    reference: 'SHP-2025-0101',
    title: 'Amoxicillin Batch Import - OR Tambo Cold Chain',
    industry: 'pharma',
    status: 'flagged',
    origin: 'Mumbai, India',
    destination: 'Johannesburg, Gauteng',
    supplier: 'PharmaCorp SA (Pty) Ltd',
    buyer: 'Dis-Chem Pharmacies',
    totalAmount: 350000,
    currency: 'ZAR',
    grossWeightKg: 1200,
    commodity: 'Amoxicillin 500mg Capsules',
    hsCode: '3004.10',
    riskLevel: 'critical',
    riskNotes: 'Cold chain break detected — temperature log shows 12°C vs required 2-8°C. Entire batch at risk.',
    estimatedValue: 350000,
  },
  {
    reference: 'SHP-2025-0102',
    title: 'Vaccine Shipment - Cape Town Cold Storage',
    industry: 'pharma',
    status: 'cleared',
    origin: 'Brussels, Belgium',
    destination: 'Cape Town, Western Cape',
    supplier: 'GSK Pharmaceuticals',
    buyer: 'National Department of Health',
    totalAmount: 1200000,
    currency: 'ZAR',
    grossWeightKg: 450,
    commodity: 'Pfizer-BioNTech COVID-19 Vaccine',
    hsCode: '3002.20',
    riskLevel: 'low',
    riskNotes: null,
    estimatedValue: 0,
  },

  // ── AUTOMOTIVE ─────────────────────────────────────────────────
  {
    reference: 'SHP-2025-0201',
    title: 'BMW 340i M Sport Import - Durban Port',
    industry: 'automotive',
    status: 'processing',
    origin: 'Munich, Germany',
    destination: 'Durban Port, KZN',
    supplier: 'BMW AG',
    buyer: 'BMW Sandton',
    totalAmount: 875000,
    currency: 'ZAR',
    grossWeightKg: 1650,
    commodity: 'BMW 340i M Sport Vehicle',
    hsCode: '8703.23',
    riskLevel: 'medium',
    riskNotes: 'VIN verification pending — Bond Store entry period expiring in 3 days',
    estimatedValue: 15000,
  },
  {
    reference: 'SHP-2025-0202',
    title: 'Toyota Hilux Fleet Import - East London',
    industry: 'automotive',
    status: 'cleared',
    origin: 'Toyota City, Japan',
    destination: 'East London, Eastern Cape',
    supplier: 'Toyota Motor Corporation',
    buyer: 'Toyota SA Motors',
    totalAmount: 5600000,
    currency: 'ZAR',
    grossWeightKg: 12400,
    commodity: 'Toyota Hilux Double Cab Fleet',
    hsCode: '8703.24',
    riskLevel: 'low',
    riskNotes: null,
    estimatedValue: 0,
  },

  // ── CONSTRUCTION ───────────────────────────────────────────────
  {
    reference: 'SHP-2025-0301',
    title: 'Ready-Mix Concrete Delivery - Waterberg Tower',
    industry: 'construction',
    status: 'held',
    origin: 'Pretoria, Gauteng',
    destination: 'Waterberg Tower Site, Limpopo',
    supplier: 'Afrisam (Pty) Ltd',
    buyer: 'Murray & Roberts Construction',
    totalAmount: 222000,
    currency: 'ZAR',
    grossWeightKg: 288000,
    commodity: 'Ready-Mix Concrete C40',
    hsCode: '2523.29',
    riskLevel: 'critical',
    riskNotes: 'Material strength rating 38 MPa vs BOQ spec of 40 MPa — substandard material detected',
    estimatedValue: 200000,
  },
  {
    reference: 'SHP-2025-0302',
    title: 'Steel Reinforcement Bar Delivery - KZN',
    industry: 'construction',
    status: 'processing',
    origin: 'Vanderbijlpark, Gauteng',
    destination: 'Ballito, KZN',
    supplier: 'ArcelorMittal SA',
    buyer: 'Group Five Construction',
    totalAmount: 1450000,
    currency: 'ZAR',
    grossWeightKg: 48000,
    commodity: 'Y25 Steel Rebar',
    hsCode: '7214.20',
    riskLevel: 'medium',
    riskNotes: 'Quantity delivered 12% short of BOQ — partial delivery flagged',
    estimatedValue: 75000,
  },

  // ── ENERGY ─────────────────────────────────────────────────────
  {
    reference: 'SHP-2025-0401',
    title: '450T Crawler Crane - Medupi Power Station',
    industry: 'energy',
    status: 'flagged',
    origin: 'Linz, Austria',
    destination: 'Medupi Power Station, Limpopo',
    supplier: 'Liebherr SA',
    buyer: 'Eskom Holdings SOC Ltd',
    totalAmount: 2800000,
    currency: 'ZAR',
    grossWeightKg: 32000,
    commodity: '450T Crawler Crane',
    hsCode: '8426.41',
    riskLevel: 'high',
    riskNotes: 'Heavy Lift Permit status: PENDING — idle specialized crane and crew risk at R50K/day',
    estimatedValue: 50000,
  },
  {
    reference: 'SHP-2025-0402',
    title: 'Transformer Unit Import - Kusile',
    industry: 'energy',
    status: 'pending',
    origin: 'Shenyang, China',
    destination: 'Kusile Power Station, Mpumalanga',
    supplier: 'Shenyang Transformer Group',
    buyer: 'Eskom Holdings SOC Ltd',
    totalAmount: 15000000,
    currency: 'ZAR',
    grossWeightKg: 85000,
    commodity: '800MVA Power Transformer',
    hsCode: '8504.23',
    riskLevel: 'medium',
    riskNotes: 'Multi-vendor delivery schedule misalignment — route survey still pending',
    estimatedValue: 50000,
  },

  // ── TRADE FINANCE ──────────────────────────────────────────────
  {
    reference: 'SHP-2025-0501',
    title: 'LC Verification - Manganese Export LC-STD-2025-00882',
    industry: 'trade_finance',
    status: 'held',
    origin: 'Standard Bank SA, Johannesburg',
    destination: 'ICBC Beijing, China',
    supplier: 'AEP Energy (Pty) Ltd',
    buyer: 'Sinosteel Corporation',
    totalAmount: 15750000,
    currency: 'USD',
    grossWeightKg: null,
    commodity: 'Letter of Credit - Manganese Ore',
    hsCode: null,
    riskLevel: 'critical',
    riskNotes: 'SWIFT MT700 confirmation does not match shipping documents — document fraud suspected',
    estimatedValue: 500000,
  },
  {
    reference: 'SHP-2025-0502',
    title: 'SBLC Guarantee - Coal Export Contract',
    industry: 'trade_finance',
    status: 'processing',
    origin: 'FNB Johannesburg',
    destination: 'HSBC London',
    supplier: 'Exxaro Resources',
    buyer: 'Glencore International',
    totalAmount: 8200000,
    currency: 'ZAR',
    grossWeightKg: null,
    commodity: 'Standby Letter of Credit - Thermal Coal',
    hsCode: null,
    riskLevel: 'medium',
    riskNotes: 'LC expiry date close to shipment ETA — 7-day gap, non-payment risk',
    estimatedValue: 150000,
  },

  // ── CROSS-BORDER ───────────────────────────────────────────────
  {
    reference: 'SHP-2025-0601',
    title: 'Cement Transit - Beitbridge Border Post',
    industry: 'cross_border',
    status: 'held',
    origin: 'Johannesburg, Gauteng',
    destination: 'Harare, Zimbabwe',
    supplier: 'PPC Cement SA',
    buyer: 'Lafarge Zimbabwe',
    totalAmount: 920000,
    currency: 'ZAR',
    grossWeightKg: 28000,
    commodity: 'Portland Cement',
    hsCode: '2523.29',
    riskLevel: 'high',
    riskNotes: 'Transit Bond NOT acquitted — R100K bond forfeiture risk',
    estimatedValue: 100000,
  },
  {
    reference: 'SHP-2025-0602',
    title: 'Agricultural Equipment Transit - Lebombo',
    industry: 'cross_border',
    status: 'cleared',
    origin: 'Pretoria, Gauteng',
    destination: 'Maputo, Mozambique',
    supplier: 'AGCO Corporation SA',
    buyer: 'Agrifocus Mozambique',
    totalAmount: 3400000,
    currency: 'ZAR',
    grossWeightKg: 6200,
    commodity: 'Agricultural Tractors',
    hsCode: '8701.90',
    riskLevel: 'low',
    riskNotes: null,
    estimatedValue: 0,
  },

  // ── TRADING ────────────────────────────────────────────────────
  {
    reference: 'SHP-2025-0701',
    title: 'Industrial Electronics Import - Shenzhen',
    industry: 'trading',
    status: 'processing',
    origin: 'Shenzhen, China',
    destination: 'Johannesburg, Gauteng',
    supplier: 'Shenzhen Global Tech',
    buyer: 'AfriTrade Imports (Pty) Ltd',
    totalAmount: 2250000,
    currency: 'USD',
    grossWeightKg: 3400,
    commodity: 'Industrial Electronics Components',
    hsCode: '8542.31',
    riskLevel: 'high',
    riskNotes: 'LC amount USD 125,000 does not match Proforma Invoice total USD 125,000 × 18 units — LC shortfall detected',
    estimatedValue: 50000,
  },

  // ── RETAIL ─────────────────────────────────────────────────────
  {
    reference: 'SHP-2025-0801',
    title: 'Unilever Delivery - Checkers Sandton',
    industry: 'retail',
    status: 'flagged',
    origin: 'Unilever Warehouse, Boksburg',
    destination: 'Checkers Sandton City, Gauteng',
    supplier: 'Unilever SA',
    buyer: 'Shoprite Checkers (Pty) Ltd',
    totalAmount: 22500,
    currency: 'ZAR',
    grossWeightKg: 1200,
    commodity: 'FMCG Household Products',
    hsCode: '3304.99',
    riskLevel: 'high',
    riskNotes: 'GRV shows 472 units received vs 500 ordered — 28 units short supply. Potential shrinkage.',
    estimatedValue: 25000,
  },
];

// ─── Dashboard Metrics ──────────────────────────────────────────────
const SAMPLE_METRICS = [
  { key: 'total_savings_zar', value: 1847000, label: 'Total Savings', unit: 'ZAR' },
  { key: 'documents_processed', value: 2347, label: 'Documents Processed', unit: 'count' },
  { key: 'risks_caught', value: 142, label: 'Risks Caught', unit: 'count' },
  { key: 'active_shipments', value: 18, label: 'Active Shipments', unit: 'count' },
  { key: 'avg_processing_time', value: 2.8, label: 'Avg Processing Time', unit: 'seconds' },
  { key: 'compliance_rate', value: 96.2, label: 'Compliance Rate', unit: '%' },
  { key: 'port_delays_prevented', value: 37, label: 'Port Delays Prevented', unit: 'count' },
  { key: 'sars_audits_passed', value: 289, label: 'SARS Audits Passed', unit: 'count' },
  { key: 'industries_covered', value: 14, label: 'Industries Covered', unit: 'count' },
  { key: 'fraud_prevented_zar', value: 700000, label: 'Fraud Prevented', unit: 'ZAR' },
];

// ─── Industry-Specific Document Types ───────────────────────────────
const INDUSTRY_DOC_TYPES: Record<string, string[]> = {
  logistics: ['invoice', 'bol', 'packing_list', 'sad500', 'delivery_note'],
  mining: ['invoice', 'assay_cert', 'weighbridge_ticket', 'export_permit', 'sgs_report'],
  pharma: ['invoice', 'batch_cert', 'coa', 'gmp_certificate', 'temperature_log', 'import_permit'],
  automotive: ['invoice', 'vin_verification', 'import_permit', 'customs_clearance', 'dealer_transfer'],
  construction: ['invoice', 'boq', 'site_pod', 'engineer_certificate', 'contractor_agreement'],
  energy: ['invoice', 'epc_contract', 'heavy_lift_permit', 'route_survey', 'engineering_certificate'],
  trade_finance: ['lc_document', 'swift_confirmation', 'bank_guarantee', 'beneficiary_certificate', 'sblc'],
  cross_border: ['transit_permit', 'sadc_certificate', 'road_manifest', 'clearance_certificate', 'driver_passport'],
  trading: ['proforma_invoice', 'purchase_order', 'sales_contract', 'insurance_certificate', 'lc_document'],
  retail: ['supplier_invoice', 'grv', 'delivery_note', 'pallet_manifest', 'credit_note'],
  air_cargo: ['mawb', 'hawb', 'flight_schedule', 'dangerous_goods_form', 'airway_bill'],
  warehousing: ['warehouse_receipt', 'bin_allocation', 'inventory_adjustment', 'pick_slip', 'stock_transfer'],
  government: ['procurement_request', 'tender_document', 'bid_evaluation', 'compliance_certificate', 'border_permit'],
  accounting: ['tax_invoice', 'vat_report', 'bank_statement', 'trial_balance', 'creditors_reconciliation'],
};

// ─── Industry-Specific Agent Log Details ────────────────────────────
const INDUSTRY_AUDIT_DETAILS: Record<string, Record<string, string>> = {
  logistics: {
    triage_clerk: 'Classified as logistics freight — BOL and Packing List detected',
    data_extractor: 'Extracted BOL number, HS codes, container numbers from shipping docs',
    auditor: 'Weight variance check: BoL vs Packing List comparison',
    risk_analyst: 'Port demurrage risk calculated based on missing docs',
    dispatcher: 'Dashboard notification created for operations team',
  },
  mining: {
    triage_clerk: 'Classified as mining export — Assay Certificate and Weighbridge Ticket detected',
    data_extractor: 'Extracted assay ID, grade percentages, moisture content from cert',
    auditor: 'Grade specification check against SPA Contract minimum requirements',
    risk_analyst: 'Cargo rejection or price penalty risk calculated',
    dispatcher: 'Compliance alert sent to Mining Operations Manager',
  },
  pharma: {
    triage_clerk: 'Classified as pharma import — Batch Certificate and Temperature Log detected',
    data_extractor: 'Extracted batch number, expiry dates, storage temperature from cert',
    auditor: 'Cold chain verification: Temperature log vs required storage conditions',
    risk_analyst: 'Batch write-off risk calculated — full invoice value at stake',
    dispatcher: 'WhatsApp URGENT alert sent to QC Manager',
  },
  automotive: {
    triage_clerk: 'Classified as automotive import — VIN Verification and Import Permit detected',
    data_extractor: 'Extracted VIN number, engine number, model year from verification report',
    auditor: 'VIN cross-reference: Manifest vs Invoice vs Verification Report',
    risk_analyst: 'Bond Store penalty risk calculated per day of delay',
    dispatcher: 'Alert sent to Dealer Principal and Compliance Officer',
  },
  construction: {
    triage_clerk: 'Classified as construction delivery — BOQ and Site POD detected',
    data_extractor: 'Extracted BOQ item ref, quantities, unit prices from invoice',
    auditor: 'Material strength rating check against BOQ specifications',
    risk_analyst: 'Structural failure and rebuild cost risk calculated',
    dispatcher: 'WhatsApp alert sent to Site Engineer and Project Manager',
  },
  energy: {
    triage_clerk: 'Classified as energy project cargo — EPC Contract and Heavy Lift Permit detected',
    data_extractor: 'Extracted equipment serial, crane capacity, permit status from docs',
    auditor: 'Heavy Lift Permit status verification for project cargo',
    risk_analyst: 'Idle specialized crane and crew cost calculated per day',
    dispatcher: 'Urgent alert sent to Project Director',
  },
  trade_finance: {
    triage_clerk: 'Classified as trade finance — SWIFT Confirmation and LC detected',
    data_extractor: 'Extracted SWIFT code, IBAN, LC reference, beneficiary bank from docs',
    auditor: 'Semantic verification of SWIFT vs shipping documents',
    risk_analyst: 'Document fraud risk — full prevented loss calculated',
    dispatcher: 'WhatsApp URGENT alert sent to CFO and Trade Finance Manager',
  },
  cross_border: {
    triage_clerk: 'Classified as cross-border transit — Transit Permit and SADC Certificate detected',
    data_extractor: 'Extracted transit bond ref, truck registration, border post from permit',
    auditor: 'Transit Bond acquittal status verification',
    risk_analyst: 'Bond forfeiture risk calculated',
    dispatcher: 'Border Control Bot alert sent to Logistics Coordinator',
  },
  trading: {
    triage_clerk: 'Classified as import/export trade — Proforma Invoice and LC detected',
    data_extractor: 'Extracted PO number, LC reference, exchange rate from docs',
    auditor: 'LC amount vs Proforma Invoice comparison',
    risk_analyst: 'Bank refusal and delayed shipment cost calculated',
    dispatcher: 'Trade Compliance alert sent to Finance Department',
  },
  retail: {
    triage_clerk: 'Classified as retail supply chain — GRV and Delivery Note detected',
    data_extractor: 'Extracted GRV number, PO number, quantities from voucher',
    auditor: 'GRV quantity vs Supplier Invoice quantity comparison',
    risk_analyst: 'Shrinkage and stock-out cost calculated',
    dispatcher: 'Dashboard notification sent to Store Manager',
  },
};

// ─── Seed Function ──────────────────────────────────────────────────
export async function seedDatabase() {
  // Delete all existing data (order matters for foreign keys)
  await db.timelineEvent.deleteMany();
  await db.auditTrail.deleteMany();
  await db.alert.deleteMany();
  await db.agentLog.deleteMany();
  await db.document.deleteMany();
  await db.shipment.deleteMany();
  await db.industryRule.deleteMany();
  await db.dashboardMetric.deleteMany();
  await db.ingestionChannel.deleteMany();
  await db.user.deleteMany();
  await db.workspace.deleteMany();

  // ── Create Workspace ──────────────────────────────────────────
  const workspace = await db.workspace.create({
    data: {
      name: 'CapsuleFlow Demo',
      slug: 'capsuleflow-demo',
      industry: 'logistics',
      plan: 'professional',
      whatsappConnected: true,
      emailConnected: true,
      onboardingComplete: true,
    },
  });

  // ── Create Industry Rules from INDUSTRY_LIST ───────────────────
  let rulesCreated = 0;
  for (const industryConfig of INDUSTRY_LIST) {
    for (const rule of industryConfig.auditRules) {
      await db.industryRule.create({
        data: {
          industry: industryConfig.key,
          ruleName: rule.ruleName,
          logicDesc: rule.logicDesc,
          impactMultiplier: rule.impactMultiplier,
          severity: rule.severity,
          category: rule.category,
          workspaceId: workspace.id,
        },
      });
      rulesCreated++;
    }
  }

  // ── Create Shipments with Industry-Specific Data ─────────────
  let shipmentsCreated = 0;
  for (const shipment of SAMPLE_SHIPMENTS) {
    const createdShipment = await db.shipment.create({
      data: {
        ...shipment,
        workspaceId: workspace.id,
      },
    });
    shipmentsCreated++;

    // ── Create Industry-Specific Documents ──────────────────────
    const docTypes = INDUSTRY_DOC_TYPES[shipment.industry] || ['invoice', 'bol', 'packing_list'];
    for (const docType of docTypes) {
      const sourceOptions: Array<'upload' | 'email' | 'whatsapp'> = ['upload', 'email', 'whatsapp'];
      const randomSource = sourceOptions[Math.floor(Math.random() * 3)];
      await db.document.create({
        data: {
          shipmentId: createdShipment.id,
          fileName: `${shipment.reference}_${docType}.pdf`,
          fileType: docType,
          source: randomSource,
          status: shipment.riskLevel === 'critical' && docType === docTypes[0] ? 'critical' : 'processed',
          ocrConfidence: shipment.riskLevel === 'low' ? 0.98 : 0.92 + Math.random() * 0.06,
        },
      });
    }

    // ── Create Agent Logs with Industry Context ─────────────────
    const agentEntries = [
      { agentName: 'triage_clerk', agentRole: 'Router', status: 'completed', duration: 280 + Math.floor(Math.random() * 200) },
      { agentName: 'data_extractor', agentRole: 'OCR Specialist', status: 'completed', duration: 900 + Math.floor(Math.random() * 600) },
      { agentName: 'auditor', agentRole: 'Validator', status: shipment.riskLevel === 'critical' ? 'failed' : 'completed', duration: 700 + Math.floor(Math.random() * 500) },
      { agentName: 'risk_analyst', agentRole: 'Decision Maker', status: 'completed', duration: 400 + Math.floor(Math.random() * 300) },
      { agentName: 'dispatcher', agentRole: 'Communicator', status: 'completed', duration: 150 + Math.floor(Math.random() * 200) },
    ];

    const auditDetails = INDUSTRY_AUDIT_DETAILS[shipment.industry] || INDUSTRY_AUDIT_DETAILS['logistics'];

    for (const entry of agentEntries) {
      await db.agentLog.create({
        data: {
          shipmentId: createdShipment.id,
          agentName: entry.agentName,
          agentRole: entry.agentRole,
          status: entry.status,
          duration: entry.duration,
          input: `Processing ${shipment.reference} (${shipment.industry})`,
          output: auditDetails[entry.agentName] || (entry.status === 'completed' ? 'Analysis complete' : 'Mismatch detected'),
        },
      });
    }

    // ── Create Industry-Aware Alerts ────────────────────────────
    if (shipment.riskLevel === 'high' || shipment.riskLevel === 'critical') {
      const alertConfigs: Record<string, { type: string; title: string; channel: string }> = {
        logistics: { type: 'mismatch', title: 'Weight Discrepancy Found', channel: 'dashboard' },
        mining: { type: 'compliance', title: 'Mining Compliance Risk', channel: 'whatsapp' },
        pharma: { type: 'compliance', title: 'Cold Chain Break Detected', channel: 'whatsapp' },
        automotive: { type: 'mismatch', title: 'VIN Verification Pending', channel: 'dashboard' },
        construction: { type: 'mismatch', title: 'Substandard Material Detected', channel: 'whatsapp' },
        energy: { type: 'compliance', title: 'Heavy Lift Permit Missing', channel: 'whatsapp' },
        trade_finance: { type: 'fraud', title: 'Document Fraud Suspected', channel: 'whatsapp' },
        cross_border: { type: 'compliance', title: 'Transit Bond Risk', channel: 'whatsapp' },
        trading: { type: 'mismatch', title: 'LC Shortfall Detected', channel: 'dashboard' },
        retail: { type: 'mismatch', title: 'Short Supply Detected', channel: 'dashboard' },
      };

      const alertConfig = alertConfigs[shipment.industry] || { type: 'risk', title: 'Risk Detected', channel: 'dashboard' };

      await db.alert.create({
        data: {
          shipmentId: createdShipment.id,
          type: shipment.riskLevel === 'critical' ? alertConfig.type : 'mismatch',
          severity: shipment.riskLevel,
          title: shipment.riskLevel === 'critical' ? `CRITICAL: ${alertConfig.title}` : alertConfig.title,
          message: shipment.riskNotes || 'Review required',
          channel: shipment.riskLevel === 'critical' ? alertConfig.channel : 'dashboard',
          isRead: shipment.riskLevel === 'low',
        },
      });
    }

    // ── Create Audit Trail with Industry Context ────────────────
    await db.auditTrail.createMany({
      data: [
        { shipmentId: createdShipment.id, action: 'document_received', agentName: 'system', details: `Documents ingested for ${shipment.industry} shipment` },
        { shipmentId: createdShipment.id, action: 'triage_complete', agentName: 'triage_clerk', details: `Classified as ${shipment.industry} — ${shipment.commodity}` },
        { shipmentId: createdShipment.id, action: 'extraction_complete', agentName: 'data_extractor', details: 'Data extracted successfully using industry schema' },
        { shipmentId: createdShipment.id, action: 'audit_flag', agentName: 'auditor', details: shipment.riskLevel !== 'low' ? 'Flags raised during audit' : 'No issues found' },
        { shipmentId: createdShipment.id, action: 'risk_assessed', agentName: 'risk_analyst', details: `Risk level: ${shipment.riskLevel} — Industry: ${shipment.industry}` },
        { shipmentId: createdShipment.id, action: 'dispatched', agentName: 'dispatcher', details: shipment.riskLevel === 'critical' ? 'WhatsApp URGENT alert sent' : 'Dashboard notification created' },
      ],
    });

    // ── Create Timeline Events ──────────────────────────────────
    await db.timelineEvent.createMany({
      data: [
        { shipmentId: createdShipment.id, event: 'Shipment Created', description: `New ${shipment.industry} shipment registered`, agentName: 'system', icon: '📦' },
        { shipmentId: createdShipment.id, event: 'Documents Ingested', description: `${docTypes.length} documents received and queued`, agentName: 'triage_clerk', icon: '📄' },
        { shipmentId: createdShipment.id, event: 'Data Extracted', description: 'OCR extraction completed with industry schema', agentName: 'data_extractor', icon: '🔍' },
        { shipmentId: createdShipment.id, event: shipment.riskLevel !== 'low' ? 'Audit Flagged' : 'Audit Passed', description: shipment.riskLevel !== 'low' ? 'Discrepancies found during audit' : 'All checks passed', agentName: 'auditor', icon: shipment.riskLevel !== 'low' ? '⚠️' : '✅' },
        { shipmentId: createdShipment.id, event: 'Risk Assessed', description: `Risk level: ${shipment.riskLevel}`, agentName: 'risk_analyst', icon: '📊' },
        { shipmentId: createdShipment.id, event: shipment.riskLevel === 'critical' ? 'Urgent Alert Sent' : 'Notification Sent', description: shipment.riskLevel === 'critical' ? 'WhatsApp urgent notification dispatched' : 'Dashboard notification created', agentName: 'dispatcher', icon: shipment.riskLevel === 'critical' ? '🚨' : '📢' },
      ],
    });
  }

  // ── Create Dashboard Metrics ─────────────────────────────────
  for (const metric of SAMPLE_METRICS) {
    await db.dashboardMetric.create({
      data: {
        ...metric,
        workspaceId: workspace.id,
      },
    });
  }

  // ── Create Ingestion Channels ────────────────────────────────
  await db.ingestionChannel.createMany({
    data: [
      { type: 'whatsapp', config: JSON.stringify({ phoneNumber: '+27800123456', businessName: 'CapsuleFlow Bot' }), isActive: true, lastSyncAt: new Date(), workspaceId: workspace.id },
      { type: 'email', config: JSON.stringify({ address: 'ops@capsuleflow.ai', imapServer: 'imap.gmail.com' }), isActive: true, lastSyncAt: new Date(), workspaceId: workspace.id },
      { type: 'api', config: JSON.stringify({ endpoint: '/api/process', apiKey: '***' }), isActive: true, workspaceId: workspace.id },
    ],
  });

  // ── Create Demo User ─────────────────────────────────────────
  await db.user.create({
    data: {
      email: 'demo@capsuleflow.ai',
      name: 'Operations Manager',
      role: 'operations',
      workspaceId: workspace.id,
    },
  });

  return {
    seeded: true,
    shipmentsCreated,
    industryRulesCreated: rulesCreated,
    industriesCovered: [...new Set(SAMPLE_SHIPMENTS.map(s => s.industry))].length,
    workspaceId: workspace.id,
  };
}
