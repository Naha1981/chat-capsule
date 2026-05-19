/**
 * CapsuleFlow AI — Master Industry Configuration
 * 
 * This is the "Brain" of the multi-industry system. Each industry has:
 * - extractionSchema: Fields the Data Extractor must find
 * - auditRules: Logic the Auditor uses to find mismatches
 * - riskMatrix: Financial impact calculations for the Risk Analyst
 * - whatsappTemplate: How the Dispatcher formats alerts
 * - docTypes: Document types the Triage Clerk must classify
 * - goldenThreadRef: The primary reference ID for linking documents
 * - icon/label/color/description: UI metadata
 */

export type IndustryKey =
  | 'logistics'
  | 'mining'
  | 'trading'
  | 'pharma'
  | 'retail'
  | 'energy'
  | 'automotive'
  | 'accounting'
  | 'government'
  | 'construction'
  | 'cross_border'
  | 'air_cargo'
  | 'warehousing'
  | 'trade_finance';

export interface IndustryConfig {
  key: IndustryKey;
  label: string;
  icon: string; // emoji
  color: string; // tailwind color class segment
  bgClass: string;
  borderClass: string;
  textClass: string;
  description: string;
  goldenThreadRef: string; // e.g. "SHIPMENT_ID", "VIN_NUMBER"
  docTypes: string[];
  extractionSchema: string[];
  auditRules: AuditRule[];
  riskMatrix: RiskEntry[];
  sampleDocuments: Record<string, string>;
  whatsappBotName: string;
  roiPitch: string;
}

export interface AuditRule {
  ruleName: string;
  logicDesc: string;
  mismatchType: string;
  severity: string;
  category: string;
  impactMultiplier: number;
}

export interface RiskEntry {
  issue: string;
  consequence: string;
  estimatedCostZAR: number;
  severityLevel: string;
}

// ═══════════════════════════════════════════════════════════════════
// 1. LOGISTICS & FREIGHT
// ═══════════════════════════════════════════════════════════════════
const LOGISTICS: IndustryConfig = {
  key: 'logistics',
  label: 'Logistics & Freight',
  icon: '🚢',
  color: 'cyan',
  bgClass: 'bg-cyan-500/10',
  borderClass: 'border-cyan-500/30',
  textClass: 'text-cyan-500',
  description: 'Import/export, freight forwarding, customs clearance. Built for South African trade corridors.',
  goldenThreadRef: 'SHIPMENT_ID / BOL_NO',
  docTypes: ['Commercial Invoice', 'Bill of Lading', 'Packing List', 'SAD500', 'Delivery Note', 'Air Waybill'],
  extractionSchema: ['bill_of_lading_no', 'hscode_list', 'total_gross_weight', 'total_net_weight', 'incoterms', 'container_numbers', 'vessel_voyage', 'port_of_loading', 'port_of_discharge'],
  auditRules: [
    { ruleName: 'weight_variance', logicDesc: 'Compare Bill of Lading weight vs Packing List weight', mismatchType: 'weight_variance', severity: 'high', category: 'mismatch', impactMultiplier: 1.5 },
    { ruleName: 'hscode_mismatch', logicDesc: 'Verify HS CODE on Invoice matches HS CODE on Customs Declaration', mismatchType: 'hscode_mismatch', severity: 'critical', category: 'compliance', impactMultiplier: 2.0 },
    { ruleName: 'missing_document', logicDesc: 'Check if all required shipping documents are present for clearance', mismatchType: 'missing_documentation', severity: 'high', category: 'compliance', impactMultiplier: 1.0 },
  ],
  riskMatrix: [
    { issue: 'Missing Document', consequence: '1 day port demurrage/storage', estimatedCostZAR: 15000, severityLevel: 'high' },
    { issue: 'Weight Mismatch', consequence: 'Customs amendment fee + variance penalty', estimatedCostZAR: 5000, severityLevel: 'medium' },
    { issue: 'HS Code Mismatch', consequence: 'SARS misdeclaration fine', estimatedCostZAR: 20000, severityLevel: 'critical' },
  ],
  sampleDocuments: {
    'Logistics Invoice': `COMMERCIAL INVOICE\nInvoice No: INV-2025-0042\nDate: 2025-01-15\nShipper: AEP Mining (Pty) Ltd, Hotazel, Northern Cape\nConsignee: Sinosteel Corporation, Beijing, China\nCommodity: Manganese Ore\nHS Code: 2602.00\nTotal Weight: 28,500 KG\nTotal Amount: R4,280,000.00\nBank Account: Standard Bank, Acc: 0123456789`,
  },
  whatsappBotName: 'Logistics Bot',
  roiPitch: 'Prevented R15,000/day port demurrage fees',
};

// ═══════════════════════════════════════════════════════════════════
// 2. MINING & EXPORTS
// ═══════════════════════════════════════════════════════════════════
const MINING: IndustryConfig = {
  key: 'mining',
  label: 'Mining & Exports',
  icon: '⛏️',
  color: 'amber',
  bgClass: 'bg-amber-500/10',
  borderClass: 'border-amber-500/30',
  textClass: 'text-amber-500',
  description: 'Mine development, mineral exports, environmental compliance. From pit to port.',
  goldenThreadRef: 'PERMIT_NO / ASSAY_ID',
  docTypes: ['Export Permit', 'Assay Certificate', 'Weighbridge Ticket', 'SPA Contract', 'SGS Report'],
  extractionSchema: ['assay_id', 'manganese_percentage', 'chrome_percentage', 'moisture_content', 'weighbridge_ticket_no', 'grade_specification', 'export_permit_expiry'],
  auditRules: [
    { ruleName: 'grade_under_spec', logicDesc: 'Compare Assay Grade % against SPA Contract minimum requirement', mismatchType: 'grade_under_spec', severity: 'critical', category: 'mismatch', impactMultiplier: 3.0 },
    { ruleName: 'permit_expired', logicDesc: 'Check Export Permit expiry date against current date', mismatchType: 'permit_expired', severity: 'critical', category: 'compliance', impactMultiplier: 2.5 },
    { ruleName: 'weight_dispute', logicDesc: 'Compare Weighbridge Ticket weight vs SPA Contract weight', mismatchType: 'weight_variance', severity: 'high', category: 'mismatch', impactMultiplier: 2.0 },
  ],
  riskMatrix: [
    { issue: 'Grade/Assay Under Spec', consequence: 'Cargo rejection or price penalty (10% contract value)', estimatedCostZAR: 250000, severityLevel: 'critical' },
    { issue: 'Permit Expiring (<7 days)', consequence: 'Total operational stoppage at mine', estimatedCostZAR: 100000, severityLevel: 'critical' },
    { issue: 'Moisture Variance', consequence: 'Weight dispute in commodity trade', estimatedCostZAR: 40000, severityLevel: 'high' },
  ],
  sampleDocuments: {
    'Mining Assay Cert': `ASSAY CERTIFICATE\nAssay ID: ASSY-2025-0892\nDate: 2025-01-20\nMine: Hotazel Manganese Mines\nCommodity: Manganese Ore\nGrade: Mn 44.2%, Fe 5.1%, SiO2 6.8%\nMoisture: 8.3%\nWeight: 28,500 MT\nSGS Lab Ref: SGS-JHB-2025-4421`,
  },
  whatsappBotName: 'Mining Compliance Bot',
  roiPitch: 'Caught 2% moisture variance saving R40,000 in weight dispute',
};

// ═══════════════════════════════════════════════════════════════════
// 3. IMPORT/EXPORT TRADING
// ═══════════════════════════════════════════════════════════════════
const TRADING: IndustryConfig = {
  key: 'trading',
  label: 'Import/Export Trading',
  icon: '🌍',
  color: 'emerald',
  bgClass: 'bg-emerald-500/10',
  borderClass: 'border-emerald-500/30',
  textClass: 'text-emerald-500',
  description: 'Proforma, purchase orders, sales contracts, insurance. Landed cost accuracy and trade finance compliance.',
  goldenThreadRef: 'PO_NUMBER / LC_REF',
  docTypes: ['Proforma Invoice', 'Purchase Order', 'Sales Contract', 'Insurance Certificate', 'Letter of Credit'],
  extractionSchema: ['po_number', 'lc_reference', 'sales_contract_ref', 'insurance_policy_no', 'landed_cost_total', 'currency_pair', 'exchange_rate'],
  auditRules: [
    { ruleName: 'lc_mismatch', logicDesc: 'Compare Letter of Credit amount vs Proforma Invoice amount', mismatchType: 'lc_mismatch', severity: 'high', category: 'mismatch', impactMultiplier: 2.0 },
    { ruleName: 'insurance_gap', logicDesc: 'Verify Insurance Certificate covers full shipment value', mismatchType: 'insurance_gap', severity: 'high', category: 'compliance', impactMultiplier: 1.5 },
  ],
  riskMatrix: [
    { issue: 'LC Amount Mismatch', consequence: 'Bank refusal to pay, delayed shipment', estimatedCostZAR: 50000, severityLevel: 'high' },
    { issue: 'Insurance Gap', consequence: 'Uncovered cargo loss risk', estimatedCostZAR: 200000, severityLevel: 'critical' },
  ],
  sampleDocuments: {
    'Trading PO': `PURCHASE ORDER\nPO No: PO-2025-7821\nDate: 2025-01-18\nBuyer: AfriTrade Imports (Pty) Ltd\nSupplier: Shenzhen Global Tech\nCommodity: Industrial Electronics\nTotal Amount: USD 125,000.00\nPayment Terms: LC at Sight\nLC Ref: LC-JHB-2025-0344`,
  },
  whatsappBotName: 'Trade Compliance Bot',
  roiPitch: 'Prevented LC shortfall saving R50,000 in bank penalties',
};

// ═══════════════════════════════════════════════════════════════════
// 4. MEDICAL & PHARMA
// ═══════════════════════════════════════════════════════════════════
const PHARMA: IndustryConfig = {
  key: 'pharma',
  label: 'Medical & Pharma',
  icon: '💊',
  color: 'red',
  bgClass: 'bg-red-500/10',
  borderClass: 'border-red-500/30',
  textClass: 'text-red-500',
  description: 'Batch certificates, COAs, GMP certs, temperature logs. Expiry tracking and regulatory sterility.',
  goldenThreadRef: 'BATCH_NO / PERMIT_ID',
  docTypes: ['Batch Certificate', 'COA', 'GMP Certificate', 'Temperature Log', 'Import Permit', 'Product Registration'],
  extractionSchema: ['batch_number', 'expiry_date', 'manufacturing_date', 'storage_temperature_celsius', 'gmp_certification_ref', 'sterility_status', 'unit_dosage', 'sa_hppra_reg_no'],
  auditRules: [
    { ruleName: 'cold_chain_break', logicDesc: 'Check Temperature Log against required Storage Temperature', mismatchType: 'cold_chain_break', severity: 'critical', category: 'compliance', impactMultiplier: 5.0 },
    { ruleName: 'batch_mismatch', logicDesc: 'Compare Batch Number on COA vs Batch Number on Invoice', mismatchType: 'batch_mismatch', severity: 'critical', category: 'mismatch', impactMultiplier: 4.0 },
    { ruleName: 'expiry_warning', logicDesc: 'Flag if product expires within 90 days', mismatchType: 'expiry_warning', severity: 'high', category: 'compliance', impactMultiplier: 3.0 },
  ],
  riskMatrix: [
    { issue: 'Cold Chain Break', consequence: 'Entire batch legally unsellable — full invoice value lost', estimatedCostZAR: 350000, severityLevel: 'critical' },
    { issue: 'Batch Mismatch', consequence: 'Product recall risk + SAHPRA regulatory fine', estimatedCostZAR: 50000, severityLevel: 'critical' },
    { issue: 'Near Expiry', consequence: 'Unsellable stock at warehouse', estimatedCostZAR: 75000, severityLevel: 'high' },
  ],
  sampleDocuments: {
    'Pharma Batch Cert': `BATCH CERTIFICATE\nBatch No: BN-2025-A4421\nProduct: Amoxicillin 500mg Capsules\nManufacturing Date: 2024-06-15\nExpiry Date: 2027-06-15\nStorage Temp: 2°C - 8°C (Cold Chain)\nGMP Ref: GMP-ZA-2024-8832\nSAHPRA Reg: Z432/2024\nSterility: PASS\nManufacturer: PharmaCorp SA (Pty) Ltd`,
  },
  whatsappBotName: 'Pharma Compliance Bot',
  roiPitch: 'Detected cold chain break preventing R350K batch write-off',
};

// ═══════════════════════════════════════════════════════════════════
// 5. RETAIL SUPPLY CHAIN
// ═══════════════════════════════════════════════════════════════════
const RETAIL: IndustryConfig = {
  key: 'retail',
  label: 'Retail Supply Chain',
  icon: '🛒',
  color: 'pink',
  bgClass: 'bg-pink-500/10',
  borderClass: 'border-pink-500/30',
  textClass: 'text-pink-500',
  description: 'Supplier invoices, GRVs, delivery notes. Shrinkage prevention and warehouse reconciliation.',
  goldenThreadRef: 'GRV_NO / PO_NUMBER',
  docTypes: ['Supplier Invoice', 'GRV', 'Delivery Note', 'Pallet Manifest', 'Credit Note'],
  extractionSchema: ['grv_number', 'po_number', 'supplier_invoice_no', 'quantity_received', 'quantity_ordered', 'unit_price', 'total_invoice_value', 'variance_quantity'],
  auditRules: [
    { ruleName: 'short_supply', logicDesc: 'Compare GRV quantity vs Supplier Invoice quantity', mismatchType: 'short_supply', severity: 'high', category: 'mismatch', impactMultiplier: 1.5 },
    { ruleName: 'overbilling', logicDesc: 'Cross-check Unit Price against Purchase Order', mismatchType: 'overbilling', severity: 'high', category: 'fraud', impactMultiplier: 2.0 },
  ],
  riskMatrix: [
    { issue: 'Short Supply', consequence: 'Stock-out at store level + lost sales', estimatedCostZAR: 25000, severityLevel: 'high' },
    { issue: 'Overbilling', consequence: 'Direct financial loss on PO unit price variance', estimatedCostZAR: 30000, severityLevel: 'high' },
  ],
  sampleDocuments: {
    'Retail GRV': `GOODS RECEIVED VOUCHER\nGRV No: GRV-2025-3321\nDate: 2025-01-22\nStore: Checkers Sandton City\nSupplier: Unilever SA\nPO No: PO-CHK-2025-8821\nQty Ordered: 500 units\nQty Received: 472 units\nVariance: 28 units short\nUnit Price: R45.00\nTotal Invoice: R22,500.00`,
  },
  whatsappBotName: 'Retail Shrinkage Bot',
  roiPitch: 'Caught short delivery saving R25,000 in shrinkage loss',
};

// ═══════════════════════════════════════════════════════════════════
// 6. ENERGY & INDUSTRIAL
// ═══════════════════════════════════════════════════════════════════
const ENERGY: IndustryConfig = {
  key: 'energy',
  label: 'Energy & Industrial',
  icon: '⚡',
  color: 'yellow',
  bgClass: 'bg-yellow-500/10',
  borderClass: 'border-yellow-500/30',
  textClass: 'text-yellow-500',
  description: 'EPC contracts, heavy lift permits, route surveys. Project cargo coordination and idle-time prevention.',
  goldenThreadRef: 'PROJECT_CODE / EPC_REF',
  docTypes: ['EPC Contract', 'Heavy Lift Permit', 'Route Survey', 'Engineering Certificate', 'Equipment Invoice'],
  extractionSchema: ['equipment_serial_no', 'crane_lift_capacity_required', 'heavy_lift_permit_status', 'vendor_drawing_ref', 'project_milestone_id', 'epc_contract_ref'],
  auditRules: [
    { ruleName: 'missing_permit', logicDesc: 'Check Heavy Lift Permit status for project cargo', mismatchType: 'missing_permit', severity: 'critical', category: 'compliance', impactMultiplier: 3.0 },
    { ruleName: 'vendor_coordination', logicDesc: 'Verify multi-vendor delivery schedule alignment', mismatchType: 'coordination_delay', severity: 'high', category: 'delay', impactMultiplier: 2.5 },
  ],
  riskMatrix: [
    { issue: 'Missing Heavy Lift Permit', consequence: 'Idle specialized crane and crew per day', estimatedCostZAR: 50000, severityLevel: 'critical' },
    { issue: 'Multi-Vendor Delay', consequence: 'Project idle time per day', estimatedCostZAR: 50000, severityLevel: 'high' },
  ],
  sampleDocuments: {
    'Energy Equipment Invoice': `EQUIPMENT INVOICE\nProject: Medupi Power Station Phase 3\nEPC Ref: EPC-MDP-2025-003\nEquipment: 450T Crawler Crane\nSerial No: LIE-450-2024-0088\nVendor: Liebherr SA\nAmount: R2,800,000.00\nHeavy Lift Permit: PENDING\nDelivery Date: 2025-02-15`,
  },
  whatsappBotName: 'Project Energy Bot',
  roiPitch: 'Flagged missing Heavy Lift Permit preventing R50K/day idle time',
};

// ═══════════════════════════════════════════════════════════════════
// 7. AUTOMOTIVE
// ═══════════════════════════════════════════════════════════════════
const AUTOMOTIVE: IndustryConfig = {
  key: 'automotive',
  label: 'Automotive',
  icon: '🚗',
  color: 'blue',
  bgClass: 'bg-blue-500/10',
  borderClass: 'border-blue-500/30',
  textClass: 'text-blue-500',
  description: 'Vehicle invoices, VIN verification, import permits, dealer transfers. VIN accuracy and Bond Store compliance.',
  goldenThreadRef: 'VIN_NUMBER / BOND_REF',
  docTypes: ['Vehicle Invoice', 'VIN Verification', 'Import Permit', 'Dealer Transfer Sheet', 'Customs Clearance'],
  extractionSchema: ['vin_number', 'engine_number', 'model_year', 'color_code', 'customs_bond_store_ref', 'euro_emission_standard', 'dealer_transfer_ref'],
  auditRules: [
    { ruleName: 'vin_error', logicDesc: 'Verify VIN Number matches exactly across Manifest, Invoice, and Verification Report', mismatchType: 'vin_error', severity: 'critical', category: 'mismatch', impactMultiplier: 3.0 },
    { ruleName: 'bond_store_expiry', logicDesc: 'Check Bond Store entry period compliance', mismatchType: 'bond_expiry', severity: 'high', category: 'compliance', impactMultiplier: 2.0 },
  ],
  riskMatrix: [
    { issue: 'VIN Mismatch', consequence: 'Bond Store penalty + customs delay', estimatedCostZAR: 15000, severityLevel: 'critical' },
    { issue: 'Bond Store Penalty', consequence: 'Daily storage fee beyond free period', estimatedCostZAR: 5000, severityLevel: 'high' },
  ],
  sampleDocuments: {
    'Automotive VIN Report': `VIN VERIFICATION REPORT\nVIN: WBA3A5C55DF123456\nEngine No: N55B30A-123456\nModel: BMW 340i M Sport\nYear: 2024\nColor: Alpine White (300)\nEmission Standard: Euro 6\nBond Store Ref: BND-DBN-2025-0442\nCustoms Entry: SAD500-2025-88231`,
  },
  whatsappBotName: 'Auto Compliance Bot',
  roiPitch: '100% accurate VIN extraction preventing R15K Bond Store penalty',
};

// ═══════════════════════════════════════════════════════════════════
// 8. ACCOUNTING & AUDIT
// ═══════════════════════════════════════════════════════════════════
const ACCOUNTING: IndustryConfig = {
  key: 'accounting',
  label: 'Accounting & Audit',
  icon: '📊',
  color: 'indigo',
  bgClass: 'bg-indigo-500/10',
  borderClass: 'border-indigo-500/30',
  textClass: 'text-indigo-500',
  description: 'Tax invoices, VAT reports, bank statements. Fraud detection and ledger reconciliation.',
  goldenThreadRef: 'TAX_INVOICE_NO',
  docTypes: ['Tax Invoice', 'VAT Report', 'Bank Statement', 'Trial Balance', 'Creditors Reconciliation'],
  extractionSchema: ['tax_invoice_no', 'vat_number', 'vat_amount', 'total_before_vat', 'total_after_vat', 'supplier_bank_account', 'payment_terms'],
  auditRules: [
    { ruleName: 'payment_fraud', logicDesc: 'Compare Bank Account on Invoice vs Verified Account in Database', mismatchType: 'payment_fraud_risk', severity: 'critical', category: 'fraud', impactMultiplier: 5.0 },
    { ruleName: 'vat_discrepancy', logicDesc: 'Verify VAT Number is valid and matches Supplier Name', mismatchType: 'vat_discrepancy', severity: 'high', category: 'compliance', impactMultiplier: 2.0 },
  ],
  riskMatrix: [
    { issue: 'Unverified Bank Account', consequence: '100% prevented fraud loss', estimatedCostZAR: 200000, severityLevel: 'critical' },
    { issue: 'VAT Discrepancy', consequence: 'SARS audit trigger risk', estimatedCostZAR: 10000, severityLevel: 'high' },
  ],
  sampleDocuments: {
    'Accounting Tax Invoice': `TAX INVOICE\nInvoice No: TI-2025-00882\nVAT No: 4123456789\nDate: 2025-01-25\nSupplier: TechCorp Solutions (Pty) Ltd\nBank: FNB, Acc: 6278 1234 567\nSubtotal: R87,719.30\nVAT (15%): R13,157.90\nTotal: R100,877.20\nPayment Terms: 30 Days`,
  },
  whatsappBotName: 'Audit Watchdog Bot',
  roiPitch: 'Detected bank account change preventing R200K payment fraud',
};

// ═══════════════════════════════════════════════════════════════════
// 9. GOVERNMENT & STATE
// ═══════════════════════════════════════════════════════════════════
const GOVERNMENT: IndustryConfig = {
  key: 'government',
  label: 'Government & State',
  icon: '🏛️',
  color: 'stone',
  bgClass: 'bg-stone-500/10',
  borderClass: 'border-stone-500/30',
  textClass: 'text-stone-500',
  description: 'Procurement requests, tender docs, bid evaluations. Anti-corruption and public procurement audit trails.',
  goldenThreadRef: 'TENDER_REF / BID_ID',
  docTypes: ['Procurement Request', 'Tender Document', 'Bid Evaluation', 'Border Permit', 'Compliance Certificate'],
  extractionSchema: ['tender_reference', 'bid_id', 'procurement_value', 'bidder_name', 'evaluation_score', 'preferred_bidder', 'scm_committee_ref'],
  auditRules: [
    { ruleName: 'bid_irregularity', logicDesc: 'Verify Tender Bid Evaluation against Procurement Request requirements', mismatchType: 'bid_irregularity', severity: 'critical', category: 'fraud', impactMultiplier: 4.0 },
    { ruleName: 'procurement_leak', logicDesc: 'Cross-check procurement value vs budget allocation', mismatchType: 'procurement_leakage', severity: 'high', category: 'fraud', impactMultiplier: 3.0 },
  ],
  riskMatrix: [
    { issue: 'Bid Irregularity', consequence: 'PFMA violation and potential legal action', estimatedCostZAR: 500000, severityLevel: 'critical' },
    { issue: 'Procurement Leakage', consequence: 'Budget overrun on public funds', estimatedCostZAR: 100000, severityLevel: 'high' },
  ],
  sampleDocuments: {
    'Government Tender': `TENDER EVALUATION REPORT\nTender Ref: GPE-2025-0882\nBid ID: BID-GPE-882-003\nDescription: IT Infrastructure Upgrade\nPreferred Bidder: TechServ SA\nEvaluation Score: 92/100\nBudget Allocation: R3,500,000\nBid Value: R3,450,000\nSCM Committee: SCM-2025-012`,
  },
  whatsappBotName: 'Procurement Watch Bot',
  roiPitch: 'Detected bid irregularity preventing R500K PFMA violation',
};

// ═══════════════════════════════════════════════════════════════════
// 10. CONSTRUCTION
// ═══════════════════════════════════════════════════════════════════
const CONSTRUCTION: IndustryConfig = {
  key: 'construction',
  label: 'Construction',
  icon: '🏗️',
  color: 'orange',
  bgClass: 'bg-orange-500/10',
  borderClass: 'border-orange-500/30',
  textClass: 'text-orange-500',
  description: 'Material invoices, BOQ, site PODs, contractor agreements. Overbilling detection and material reconciliation.',
  goldenThreadRef: 'BOQ_REF / SITE_NOTE_ID',
  docTypes: ['Material Invoice', 'BOQ', 'Site POD', 'Contractor Agreement', 'Engineer Certificate'],
  extractionSchema: ['boq_item_ref', 'quantity_ordered', 'quantity_delivered', 'unit_price', 'material_strength_rating', 'site_delivery_location', 'retention_percentage'],
  auditRules: [
    { ruleName: 'substandard_material', logicDesc: 'Compare Material Strength Rating against BOQ Specifications', mismatchType: 'substandard_material', severity: 'critical', category: 'mismatch', impactMultiplier: 3.0 },
    { ruleName: 'procurement_leakage', logicDesc: 'Check Quantity Delivered against Project Timeline requirements', mismatchType: 'overbilling', severity: 'high', category: 'fraud', impactMultiplier: 2.5 },
  ],
  riskMatrix: [
    { issue: 'Substandard Material', consequence: 'Structural failure risk + rebuild cost', estimatedCostZAR: 200000, severityLevel: 'critical' },
    { issue: 'Overbilling', consequence: 'Direct financial loss on BOQ vs actual', estimatedCostZAR: 75000, severityLevel: 'high' },
  ],
  sampleDocuments: {
    'Construction BOQ': `BILL OF QUANTITIES\nBOQ Ref: BOQ-WTR-2025-014\nProject: Waterberg Tower Phase 2\nItem: Ready-Mix Concrete C40\nQty Ordered: 120 m³\nQty Delivered: 108 m³\nUnit Price: R1,850.00/m³\nStrength Spec: 40 MPa\nDelivered Rating: 38 MPa\nRetention: 5%`,
  },
  whatsappBotName: 'Construction Audit Bot',
  roiPitch: 'Caught substandard concrete preventing R200K rebuild cost',
};

// ═══════════════════════════════════════════════════════════════════
// 11. CROSS-BORDER TRADE
// ═══════════════════════════════════════════════════════════════════
const CROSS_BORDER: IndustryConfig = {
  key: 'cross_border',
  label: 'Cross-Border Trade',
  icon: '🌐',
  color: 'teal',
  bgClass: 'bg-teal-500/10',
  borderClass: 'border-teal-500/30',
  textClass: 'text-teal-500',
  description: 'Transit permits, SADC certs, road manifests. Border delay reduction and transit bond acquittal.',
  goldenThreadRef: 'TRANSIT_BOND / TRUCK_ID',
  docTypes: ['Transit Permit', 'SADC Certificate', 'Road Manifest', 'Driver Passport Copy', 'Clearance Certificate'],
  extractionSchema: ['transit_bond_ref', 'truck_registration', 'driver_id', 'border_post', 'sadc_cert_no', 'road_manifest_no', 'bond_acquittal_status'],
  auditRules: [
    { ruleName: 'permit_expiry', logicDesc: 'Check Transit Permit validity for border crossing date', mismatchType: 'permit_expired', severity: 'critical', category: 'compliance', impactMultiplier: 3.0 },
    { ruleName: 'bond_risk', logicDesc: 'Verify Transit Bond acquittal status before cargo release', mismatchType: 'bond_risk', severity: 'high', category: 'compliance', impactMultiplier: 2.5 },
  ],
  riskMatrix: [
    { issue: 'Permit Expiry', consequence: 'R10,000 fine + driver detention costs', estimatedCostZAR: 25000, severityLevel: 'critical' },
    { issue: 'Bond Not Acquitted', consequence: 'Transit bond forfeiture', estimatedCostZAR: 100000, severityLevel: 'high' },
  ],
  sampleDocuments: {
    'Cross-Border Permit': `TRANSIT PERMIT\nPermit No: TP-SADC-2025-0442\nTruck Reg: BXP 456 GP\nDriver: J. Mokoena, ID: 8501015800089\nBorder Post: Beitbridge\nCommodity: Cement\nBond Ref: TB-ZIM-2025-018\nBond Status: NOT ACQUITAL\nExpiry: 2025-02-01`,
  },
  whatsappBotName: 'Border Control Bot',
  roiPitch: 'Flagged unacquitted bond preventing R100K forfeiture',
};

// ═══════════════════════════════════════════════════════════════════
// 12. AIR CARGO
// ═══════════════════════════════════════════════════════════════════
const AIR_CARGO: IndustryConfig = {
  key: 'air_cargo',
  label: 'Air Cargo',
  icon: '✈️',
  color: 'sky',
  bgClass: 'bg-sky-500/10',
  borderClass: 'border-sky-500/30',
  textClass: 'text-sky-500',
  description: 'MAWBs, HAWBs, flight schedules, dangerous goods forms. Airport storage cost reduction and anomaly detection.',
  goldenThreadRef: 'MAWB_NO / HAWB_NO',
  docTypes: ['MAWB', 'HAWB', 'Flight Schedule', 'Dangerous Goods Form', 'Airway Bill'],
  extractionSchema: ['mawb_number', 'hawb_number', 'flight_number', 'origin_airport', 'destination_airport', 'chargeable_weight', 'dangerous_goods_class', 'shipper'],
  auditRules: [
    { ruleName: 'weight_anomaly', logicDesc: 'Compare Chargeable Weight vs Actual Weight for billing accuracy', mismatchType: 'weight_variance', severity: 'high', category: 'mismatch', impactMultiplier: 1.5 },
    { ruleName: 'dg_compliance', logicDesc: 'Verify Dangerous Goods classification matches IATA regulations', mismatchType: 'dg_non_compliance', severity: 'critical', category: 'compliance', impactMultiplier: 4.0 },
  ],
  riskMatrix: [
    { issue: 'Weight Anomaly', consequence: 'Overcharge on air freight', estimatedCostZAR: 8000, severityLevel: 'medium' },
    { issue: 'DG Non-Compliance', consequence: 'Flight rejection + ACSA penalty', estimatedCostZAR: 75000, severityLevel: 'critical' },
  ],
  sampleDocuments: {
    'Air Cargo MAWB': `MASTER AIR WAYBILL\nMAWB No: 074-12345678\nFlight: SA202 JNB-LHR\nDate: 2025-01-28\nShipper: AeroTrade SA\nConsignee: UK Pharma Ltd\nChargeable Wt: 1,250 KG\nActual Wt: 1,180 KG\nDG Class: Not Applicable\nHAWB: 074-12345678-01`,
  },
  whatsappBotName: 'Air Cargo Bot',
  roiPitch: 'Detected chargeable weight anomaly saving R8K overcharge',
};

// ═══════════════════════════════════════════════════════════════════
// 13. WAREHOUSING
// ═══════════════════════════════════════════════════════════════════
const WAREHOUSING: IndustryConfig = {
  key: 'warehousing',
  label: 'Warehousing',
  icon: '📦',
  color: 'lime',
  bgClass: 'bg-lime-500/10',
  borderClass: 'border-lime-500/30',
  textClass: 'text-lime-500',
  description: 'Warehouse receipts, bin allocations, inventory adjustments. Inventory accuracy and stock transfer validation.',
  goldenThreadRef: 'BIN_ID / PICK_SLIP_ID',
  docTypes: ['Warehouse Receipt', 'Bin Allocation', 'Inventory Adjustment', 'Pick Slip', 'Stock Transfer'],
  extractionSchema: ['bin_id', 'pick_slip_id', 'warehouse_ref', 'sku_code', 'quantity_on_hand', 'quantity_adjusted', 'adjustment_reason', 'stock_transfer_ref'],
  auditRules: [
    { ruleName: 'inventory_shrinkage', logicDesc: 'Compare Inventory Adjustment quantity against expected stock levels', mismatchType: 'inventory_shrinkage', severity: 'high', category: 'mismatch', impactMultiplier: 1.5 },
    { ruleName: 'bin_mismatch', logicDesc: 'Verify Bin Allocation matches physical location records', mismatchType: 'bin_mismatch', severity: 'medium', category: 'mismatch', impactMultiplier: 1.0 },
  ],
  riskMatrix: [
    { issue: 'Inventory Shrinkage', consequence: 'Direct stock loss value', estimatedCostZAR: 20000, severityLevel: 'high' },
    { issue: 'Bin Mismatch', consequence: 'Fulfilment errors + returns cost', estimatedCostZAR: 5000, severityLevel: 'medium' },
  ],
  sampleDocuments: {
    'Warehouse Receipt': `WAREHOUSE RECEIPT\nReceipt No: WR-JHB-2025-4421\nWarehouse: DHL Supply Chain JHB\nBin: A3-12-04\nSKU: SKU-8821-PROD\nQty Received: 500 units\nQty On Hand: 487 units\nAdjustment: -13 units (Damaged)\nTransfer Ref: ST-JHB-CPT-2025-088`,
  },
  whatsappBotName: 'Warehouse Audit Bot',
  roiPitch: 'Detected shrinkage pattern preventing R20K inventory loss',
};

// ═══════════════════════════════════════════════════════════════════
// 14. TRADE FINANCE
// ═══════════════════════════════════════════════════════════════════
const TRADE_FINANCE: IndustryConfig = {
  key: 'trade_finance',
  label: 'Trade Finance',
  icon: '🏦',
  color: 'violet',
  bgClass: 'bg-violet-500/10',
  borderClass: 'border-violet-500/30',
  textClass: 'text-violet-500',
  description: 'LCs, SBLCs, SWIFT confirmations, bank guarantees. Document fraud detection and payment release safety.',
  goldenThreadRef: 'SWIFT_MT_REF / SBLC_ID',
  docTypes: ['Letter of Credit', 'SBLC', 'SWIFT Confirmation', 'Bank Guarantee', 'Beneficiary Certificate'],
  extractionSchema: ['swift_code', 'iban_number', 'lc_reference', 'sblc_id', 'beneficiary_bank', 'issuing_bank', 'lc_expiry', 'lc_amount', 'currency'],
  auditRules: [
    { ruleName: 'document_fraud', logicDesc: 'Semantic verification of SWIFT Confirmation vs Shipping documents', mismatchType: 'fraud_suspected', severity: 'critical', category: 'fraud', impactMultiplier: 5.0 },
    { ruleName: 'lc_expiry_risk', logicDesc: 'Check Letter of Credit expiry against shipment ETA', mismatchType: 'lc_expiry_risk', severity: 'high', category: 'compliance', impactMultiplier: 2.5 },
  ],
  riskMatrix: [
    { issue: 'Document Fraud', consequence: 'Full prevented fraud loss', estimatedCostZAR: 500000, severityLevel: 'critical' },
    { issue: 'LC Expiry Risk', consequence: 'Non-payment — buyer takes goods free', estimatedCostZAR: 150000, severityLevel: 'high' },
  ],
  sampleDocuments: {
    'Trade Finance LC': `LETTER OF CREDIT\nLC Ref: LC-STD-2025-00882\nSWIFT MT700 Ref: SWFT-2025-4421\nIssuing Bank: Standard Bank SA\nBeneficiary Bank: ICBC Beijing\nAmount: USD 875,000.00\nExpiry: 2025-03-15\nShipment Deadline: 2025-02-28\nApplicant: AEP Energy (Pty) Ltd\nBeneficiary: Sinosteel Corp`,
  },
  whatsappBotName: 'Trade Finance Bot',
  roiPitch: 'Verified SWIFT vs BoL preventing R500K document fraud',
};

// ═══════════════════════════════════════════════════════════════════
// MASTER EXPORT
// ═══════════════════════════════════════════════════════════════════

export const INDUSTRIES: Record<IndustryKey, IndustryConfig> = {
  logistics: LOGISTICS,
  mining: MINING,
  trading: TRADING,
  pharma: PHARMA,
  retail: RETAIL,
  energy: ENERGY,
  automotive: AUTOMOTIVE,
  accounting: ACCOUNTING,
  government: GOVERNMENT,
  construction: CONSTRUCTION,
  cross_border: CROSS_BORDER,
  air_cargo: AIR_CARGO,
  warehousing: WAREHOUSING,
  trade_finance: TRADE_FINANCE,
};

export const INDUSTRY_LIST: IndustryConfig[] = Object.values(INDUSTRIES);

export function getIndustryConfig(key: string): IndustryConfig {
  return INDUSTRIES[key as IndustryKey] || LOGISTICS;
}

export function getIndustryLabel(key: string): string {
  return getIndustryConfig(key).label;
}

export function getIndustryEmoji(key: string): string {
  return getIndustryConfig(key).icon;
}

/** Build the Master Triage prompt with industry context injected */
export function buildTriagePrompt(industryType: string): string {
  const config = getIndustryConfig(industryType);
  return `You are the Senior Universal Triage Clerk for CapsuleFlow AI—the Operational Loss Prevention Infrastructure. You are the first "digital employee" to see any incoming document via WhatsApp, Email, or Web Upload. Your goal is 100% accuracy in classification and routing.

Context: The current Workspace Industry is: ${config.label}.

Your Task:
1. Industry Validation: Confirm the document matches the ${config.label} industry. If it belongs to another industry, flag it for "Cross-Industry Review."
2. Classification: Identify the specific document type from: ${config.docTypes.join(', ')}.
3. Entity Extraction: Find the "Golden Thread"—the unique ID that links all documents in this transaction (e.g., ${config.goldenThreadRef}).
4. Routing: Assign the document to the Specialist Extractor with the correct Extraction Schema.

OUTPUT REQUIREMENTS (Strict JSON):
{
  "classification": { "industry": "Identified Industry", "doc_type": "Specific Document Name", "confidence_score": 0.00, "is_noise": false },
  "golden_thread": { "primary_ref_type": "e.g., ${config.goldenThreadRef}", "primary_ref_value": "VALUE" },
  "routing": { "next_agent": "Specialist_Extractor", "priority": "low/medium/high/critical", "department": "finance/logistics/compliance/ops" },
  "summary": "1-sentence description for WhatsApp notification"
}

RULES: If you cannot find a Primary Reference, flag as EXCEPTION and route to Human Review. Output ONLY valid JSON.`;
}

/** Build the Specialist Extractor prompt */
export function buildExtractorPrompt(industryType: string): string {
  const config = getIndustryConfig(industryType);
  return `You are the hyper-accurate Specialist Extractor for CapsuleFlow AI. Current Industry: ${config.label}.

Your goal is perfect JSON extraction. Focus on these fields: ${config.extractionSchema.join(', ')}.

Normalize: Dates to YYYY-MM-DD. Currency codes (USD/ZAR/CNY) and amounts to Float. Weights to KG. Never hallucinate — if a field is not found, return null.

OUTPUT REQUIREMENTS (Strict JSON):
{
  "metadata": { "extraction_timestamp": "ISO_DATE", "ocr_confidence": 0.00 },
  "extracted_data": { "primary_id": "Golden Thread Value", "supplier": "Name", "buyer": "Name", "monetary": { "total_amount": 0.00, "currency": "CODE", "vat": 0.00 }, "industry_specific": {} },
  "missing_fields": ["List of critical fields not found"],
  "low_confidence_fields": ["List of fields where OCR was blurry"]
}

RULES: No conversational text. Only the JSON block. If HS CODE found, verify it has at least 6 digits.`;
}

/** Build the Auditor prompt */
export function buildAuditorPrompt(industryType: string): string {
  const config = getIndustryConfig(industryType);
  const rulesText = config.auditRules.map(r =>
    `- ${r.ruleName}: ${r.logicDesc} (Severity: ${r.severity}, Type: ${r.mismatchType})`
  ).join('\n');
  
  return `You are the Senior Auditor and Digital Firewall for CapsuleFlow AI. Current Industry: ${config.label}.

Your job is to hunt for operational friction using these rules:
${rulesText}

Also check: Bank Account verification, VAT number validity, and all industry-required documents are present.

OUTPUT REQUIREMENTS (Strict JSON):
{
  "audit_summary": { "status": "PASS / WARNING / CRITICAL", "risk_score": 0, "total_mismatches_found": 0 },
  "mismatches": [{ "field": "name", "mismatch_type": "type", "expected_value": "expected", "actual_value": "actual", "severity": "level" }],
  "fraud_check": { "bank_account_verified": true, "vat_number_verified": true, "alert": "Description" },
  "missing_documentation_check": { "required_docs": ["list"], "missing_docs": ["list"] }
}

RULES: Be conservative — flag even small variances. If Bank Account differs from database, set status CRITICAL immediately.`;
}

/** Build the Risk Analyst prompt */
export function buildRiskPrompt(industryType: string): string {
  const config = getIndustryConfig(industryType);
  const riskText = config.riskMatrix.map(r =>
    `- ${r.issue}: ${r.consequence} (Est. R${r.estimatedCostZAR.toLocaleString()}, ${r.severityLevel})`
  ).join('\n');

  return `You are the Senior Risk Analyst and Operational Economist for CapsuleFlow AI. Current Industry: ${config.label}.

Translate technical discrepancies into Financial Impact (Rand Value). Use this Risk Matrix:
${riskText}

OUTPUT REQUIREMENTS (Strict JSON):
{
  "financial_summary": { "total_value_at_risk_rand": 0.00, "prevented_loss_rand": 0.00, "roi_confidence_score": 0.00 },
  "risk_breakdown": [{ "issue": "description", "consequence": "business impact", "estimated_cost_rand": 0.00, "severity_level": "level", "risk_index": 0 }],
  "dashboard_stats": { "human_hours_saved": 0.5, "compliance_rating": "A/B/C/F", "is_eligible_for_auto_payment": true }
}

RULES: If Fraud Signal detected, set prevented_loss_rand to full invoice amount. Be specific with cost types. If CRITICAL, set is_eligible_for_auto_payment to false.`;
}

/** Build the Dispatcher prompt */
export function buildDispatcherPrompt(industryType: string): string {
  const config = getIndustryConfig(industryType);
  return `You are the Senior Dispatcher for CapsuleFlow AI. Current Industry: ${config.label}.

Package the swarm's intelligence into: WhatsApp Alert, Departmental Email, and Dashboard Update. Adapt tone to ${config.label} industry.

OUTPUT REQUIREMENTS (Strict JSON):
{
  "comms": {
    "whatsapp": { "recipient_role": "role", "message_body": "formatted message with emojis", "priority": "level" },
    "email": { "target_department": "dept", "subject": "[PROCESSED] - Ref - Status - ${config.label}", "html_body": "structured report" }
  },
  "system_actions": {
    "update_dashboard": { "kpi_label": "label", "kpi_value": "R value", "status_color": "color" },
    "quick_actions": [{ "label": "Action Name", "endpoint": "/api/action" }]
  }
}

RULES: Use South African Business English (Rand, SARS, VAT). If CRITICAL, WhatsApp must start with "🚨 URGENT ACTION REQUIRED". Never include raw JSON in messages — translate to human sentences.`;
}
