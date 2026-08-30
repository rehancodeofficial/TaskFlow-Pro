# Design Guidelines

TaskFlow Pro targets a **Premium B2B SaaS** aesthetic.

## Principles
- **High Density, Low Clutter:** Professional users need to see lots of data (tables, kanban) without the UI feeling overwhelming.
- **Consistent Hierarchy:** Use typography (Inter/Geist) to clearly delineate titles, metadata, and body text.
- **Responsive:** Fluid layouts using Tailwind CSS. Modals and drawers for complex forms instead of separate pages.

## Color Palette
- **Primary:** Deep brand color (e.g., Indigo or Slate) for primary actions.
- **Backgrounds:** Subtle off-whites/grays for light mode (`bg-slate-50`), deep grays for dark mode (`bg-slate-950`).
- **Status Colors:** 
  - Success (Green)
  - Warning (Amber/Yellow)
  - Danger (Red)
  - Info (Blue)

## Components (Radix + Tailwind)
- **Kanban Board:** Uses `@dnd-kit`. Smooth dragging, drop indicators, shadow elevation when dragging.
- **Forms:** Clear labeling, inline validation errors, disabled states during submission.
- **Navigation:** Collapsible left sidebar for Workspace/Project navigation. Top bar for global search, notifications, and user profile.

## State Handling
- **Empty States:** Beautiful illustrations or clear "Create your first X" calls to action. Never just a blank screen.
- **Loading States:** Skeleton loaders matching the dimensions of the final content to prevent Cumulative Layout Shift (CLS).
- **Error States:** Graceful fallbacks using React Error Boundaries. Toast notifications for transient API failures.
