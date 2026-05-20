---
Task ID: 1
Agent: Main
Task: Fix app preview - dev server not running / sandbox inactive

Work Log:
- Diagnosed dev server was crashing after initial compilation
- Root cause: All 7 screen components (230KB+ total) compiled at once, causing server to hang and die
- Fixed by implementing React.lazy() code splitting in page.tsx
- Fixed cross-origin request blocking for preview panel (added specific origin to allowedDevOrigins)
- Used double-fork process management to keep dev server alive as background daemon
- Verified server returns HTTP 200 with 52KB+ of rendered HTML content

Stage Summary:
- Dev server is now running and stable on port 3000
- Page renders CapsuleFlow AI landing screen with all CSS/design tokens
- Lazy loading prevents compilation bottleneck
- Lint passes cleanly
