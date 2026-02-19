# Phase 2: UI Refinements & Enhancements Plan

## Objectives
Based on user feedback, the following refinements are planned to enhance the application's visual consistency, alignment, and responsiveness.

### 1. Global Scrollbar Styling
**Goal:** Create a cleaner, distraction-free scrolling experience.
- **Approach:** 
  - Hide default browser scrollbars using `scrollbar-width: none` (Firefox) and `::-webkit-scrollbar { display: none; }` (Chrome/Safari).
  - Implement a custom, thin overlay scrollbar only when hovering, or rely on mobile-style touch scrolling.
  - Apply `overflow-y: auto` to main content containers (e.g., `Layout` main wrapper) to keep navigation fixed and content scrollable.

### 2. Chat Persistence & Logic
**Goal:** Restrict chat interaction to mutual connections.
- **Current State:** Chat button appears for any user on map.
- **Fix:** 
  - Update `ChatOverlay` / `UserDetailPanel` to check if `selectedUser._id` exists in `currentUser.friends`.
  - Only render "Message" button if `isFriend === true`.
  - Ensure chat history persists by verifying MongoDB message storage (already implemented, needs verification on frontend retrieval).

### 3. Navigation Pill (Social/Map Toggle)
**Goal:** Align the "Map View / Connect" toggle and remove the background container.
- **Current State:** Toggle is inside a distinct background div.
- **Fix:** 
  - In `Social.jsx`, remove the parent `div` background/border styling.
  - Style the `M3SegmentedButton` to float freely.
  - Ensure exact center alignment with the "KON-NECT" header logos/text.
  - Add transparent backdrop blur to the toggle itself if needed for contrast against map.

### 4. Glassmorphism & Visual Polish
**Goal:** Enhance depth and "expressive" feel, especially in Light Mode.
- **Current State:** Cards are solid colors, looking flat in light mode.
- **Fix:** 
  - Update `M3Card` base styles:
    - Add `backdrop-blur-xl`.
    - Use `bg-white/80` (light) and `bg-[#141218]/80` (dark) instead of solid opacity.
  - Apply similar glass effects to:
    - User Detail Panel.
    - Navigation Bars.
    - Floating Action Buttons (FABs).

### 5. Alignment & Layout Fixes
- **Welcome Page:** (Completed in Phase 1) Fixed empty space and added theme toggle.
- **Navbar Alignment:** Ensure the logo, search bar (if any), and action buttons are vertically centered using `items-center` flex utilities.

## Execution Strategy
1.  **Refine CSS:** detailed pass on `index.css` for scrollbars.
2.  **Component Updates:** Iterative updates to `Social.jsx`, `M3Card.jsx`, and `Layout.jsx`.
3.  **Logic Update:** Add friend check to `Chat.jsx` entry points.
