---
Task ID: 1
Agent: Main Agent
Task: Fix broken app preview

Work Log:
- Diagnosed that page.tsx only had inline landing page and basic text redirects, not using actual screen components
- Fixed page.tsx to properly route to all screen components (LandingScreen, OnboardingScreen, DashboardScreen, InboxScreen, ShipmentScreen, ReviewScreen, NerveCenterScreen)
- Fixed next.config.ts to add allowedDevOrigins for .space-z.ai preview
- Seeded database with 19 shipments across 10 industries, 31 industry rules
- Verified app compiles and serves (GET / 200 in 3.0s)
- Dev server running on port 3000

Stage Summary:
- App preview is now working - all 7 screens properly routed
- Database seeded with realistic South African logistics data
- Cross-origin preview warning fixed
