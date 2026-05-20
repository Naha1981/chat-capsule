# Task 4: Update API Routes for 14-Industry Multi-Industry System

## Agent: API Routes Update Agent

## Summary
Updated all 4 API routes + seed library + fixed INDUSTRIES export bug to support the 14-industry multi-industry system.

## Files Modified

### 1. `src/lib/industries/index.ts` (Bug Fix)
- Fixed `INDUSTRIES` Record export: Changed shorthand property names (`logistics`, `mining`, ...) to explicit key-value pairs (`logistics: LOGISTICS`, `mining: MINING`, ...) since the constant variables are UPPERCASE.

### 2. `src/lib/seed.ts` (Complete Rewrite)
- **Delete-all-first approach**: Now deletes all existing data before seeding (workspace, users, shipments, documents, agent logs, alerts, audit trails, timeline events, industry rules, metrics, channels)
- **19 sample shipments** across 10 industries: logistics(2), mining(3), pharma(2), automotive(2), construction(2), energy(2), trade_finance(2), cross_border(2), trading(1), retail(1)
- **31 industry rules** created from `INDUSTRY_LIST.auditRules` for all 14 industries
- **Industry-specific document types**: Each shipment gets docs matching its industry (e.g., pharma gets `batch_cert`, `coa`, `gmp_certificate`, `temperature_log`, `import_permit`; automotive gets `vin_verification`, `import_permit`, etc.)
- **Industry-aware agent logs**: Each agent's output message is tailored to the industry (e.g., pharma triage clerk says "Cold chain verification" vs construction says "BOQ and Site POD detected")
- **Industry-specific alert configs**: Alert titles, types, and channels vary by industry (e.g., trade_finance gets `fraud`/`whatsapp` alerts, retail gets `mismatch`/`dashboard`)
- **Timeline events** created for each shipment with industry-aware descriptions
- **Workspace, user, and ingestion channels** also created
- **10 dashboard metrics** including new `industries_covered` and `fraud_prevented_zar`

### 3. `src/app/api/seed/route.ts` (Unchanged)
- Already correctly calls `seedDatabase()` — no changes needed since seed logic moved to `src/lib/seed.ts`

### 4. `src/app/api/dashboard/route.ts` (Enhanced)
- **`industryBreakdown`**: Shipment counts per industry with label and emoji
- **`industryRiskBreakdown`**: Risk levels (low/medium/high/critical) per industry with totalRiskScore
- **`topIndustryRisks`**: Top risk shipment per industry, sorted by risk severity then estimatedValue (SQLite-compatible — sorts in code instead of relying on alphabetical `riskLevel` ordering)
- **`industryRulesSummary`**: Rule counts per industry from `IndustryRule` table
- **`industryCoverage`**: Full 14-industry list with shipment counts and `hasCoverage` flag
- Imports `getIndustryLabel`, `getIndustryEmoji`, `INDUSTRY_LIST` from industries config

### 5. `src/app/api/shipments/route.ts` (Enhanced)
- Added optional `industry` query parameter for filtering shipments by industry
- When `industry` is provided, adds `where: { industry }` to the `findMany` query

### 6. `src/app/api/alerts/route.ts` (Enhanced)
- Added optional `industry` query parameter for filtering alerts by shipment industry
- Uses `where.shipment = { industry }` relation filter to find alerts belonging to shipments of a specific industry

## API Testing Results
- `POST /api/seed` → `{"seeded":true,"shipmentsCreated":19,"industryRulesCreated":31,"industriesCovered":10,"workspaceId":"..."}`
- `GET /api/dashboard` → Returns all new fields: `industryBreakdown`, `industryRiskBreakdown`, `topIndustryRisks`, `industryRulesSummary`, `industryCoverage`
- `GET /api/shipments?industry=pharma` → Returns 2 pharma shipments
- `GET /api/alerts?industry=trade_finance` → Returns 1 trade_finance alert (critical fraud)

## Lint Status
All modified files pass ESLint with zero errors.
