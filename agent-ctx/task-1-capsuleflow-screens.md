# Task: Create CapsuleFlow AI - 4 Screen Components

## Summary

Created 4 main screen components for the CapsuleFlow AI autonomous operations SaaS platform, plus supporting shared components and updated API routes.

## Files Created/Modified

### New Files
1. **`src/components/shared/app-sidebar.tsx`** - Shared sidebar navigation with responsive design (mobile hamburger + desktop sidebar). Includes navigation items for Dashboard, Document Inbox, Shipments, Review Queue, Nerve Center. Shows workspace name, user role badge, dark mode toggle using next-themes.

2. **`src/components/screens/dashboard-screen.tsx`** - Executive ROI Dashboard with:
   - 3 glassmorphism metric cards (Total Value Captured R847K, Critical Risks Prevented 89, Human Hours Reclaimed 120)
   - Live Ticker Feed with ticker-scroll CSS animation
   - 5-Agent Swarm Status cards with response times
   - Savings Trend AreaChart (Recharts) with cyan gradient fill
   - Risk Distribution PieChart with severity colors
   - Process Document Dialog with textarea and sample documents dropdown
   - Fetches from /api/dashboard on mount

3. **`src/components/screens/inbox-screen.tsx`** - Document Inbox with:
   - Filter buttons (All, Processed, Exception, Critical) and search
   - Document table with status icons, shipment refs, source icons, confidence %
   - Side-by-side view: Original Document preview + AI Extracted Data JSON
   - Agent processing indicators per document
   - Fetches from /api/shipments with document/agent data

4. **`src/components/screens/shipment-screen.tsx`** - Shipment Timeline View with:
   - Shipment cards with reference, commodity, status badge, risk dot, total value
   - Expandable timeline view using audit trails (fallback for empty timeline events)
   - Color-coded events: green=passed, orange=flagged, red=critical
   - Agent icons, timestamps, descriptions per event
   - Risk notes panel for flagged shipments

5. **`src/components/screens/review-screen.tsx`** - Review Queue (Human-in-the-loop) with:
   - High/critical risk items requiring human review
   - Cards showing severity indicator, shipment details, AI findings, financial impact
   - "Approve & Forward to Finance" (green) and "Hold Shipment" (red) action buttons
   - Expandable "View Details" with full agent pipeline and alert data
   - PATCH /api/alerts to resolve, PATCH /api/shipments to update status
   - Success/warning toasts using sonner

### Modified Files
6. **`src/app/api/shipments/route.ts`** - Updated to include all related data (documents, agentLogs, auditTrails, timeline, alerts) plus PATCH endpoint for status updates

7. **`src/app/api/alerts/route.ts`** - Updated with query params for isResolved and severity filtering, plus resolve action that creates audit trails

8. **`src/app/page.tsx`** - Updated to route between all screen types based on useAppState.currentScreen

## Technical Details
- All components are 'use client' with TypeScript
- Uses shadcn/ui components, lucide-react icons, framer-motion animations, recharts charts
- Dark cinematic theme with Electric Cyan (#00e5ff) accents
- Glassmorphism effects (glass-card, glass-card-strong)
- Responsive design with mobile-first approach
- Database seeded with 8 shipments, 24 documents, 40 agent logs, 2 alerts
