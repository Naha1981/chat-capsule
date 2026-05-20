# Task 4-a: Redesign Onboarding Screen + Nerve Center Screen

## Agent: full-stack-developer

## Work Completed

### Onboarding Screen (`/home/z/my-project/src/components/screens/onboarding-screen.tsx`)
- Complete redesign from 6 steps to 3 steps ("Zero-Friction" onboarding)
- Step 1: "What do you move?" — emoji grid with search, no ROI panel
- Step 2: "Connect your channels" — WhatsApp (3 states) + Email (OAuth + Manual Forwarding) + Skip
- Step 3: "See it in action" — upload zone + animated processing + success message
- Simple 3-dot progress indicator (Industry → Channels → Try It)
- Removed: Login, Workspace, Role, Team invite steps, ROI panel, SARS box, keyboard hints

### Nerve Center Screen (`/home/z/my-project/src/components/screens/nerve-center-screen.tsx`)
- Complete redesign with "One-Click Channel Linking"
- Section A: Channels — WhatsApp (3 states) + Email (Google/Microsoft OAuth + collapsible Manual Forwarding)
- Section B: AI Gateway — 3 provider cards (ZAI/Groq/OpenRouter) with auto-failover badge
- Section C: Team Members — simple list + invite form
- Removed: IMAP forms, API key inputs, routing logic diagrams, activity log

### Quality
- ESLint: 0 errors
- Dev server: compiling successfully
- Uses existing design system (glass-card, glow-cyan, primary-fixed-dim, etc.)
- Uses useAppState for whatsappConnected, emailConnected states
- Uses toast/sonner for notifications
