# Design Review Results: Bigkas Web Application (Comprehensive Audit)

**Review Date**: 2026-03-13
**Route**: All major routes (/, /login, /register, /dashboard, /scripts, /practice, /training-setup, /progress, /history, /frameworks)
**Focus Areas**: Visual Design, UX/Usability, Responsive/Mobile, Accessibility, Micro-interactions/Motion, Consistency, Performance

## Summary
The Bigkas web application features a modern, clean, and high-contrast "Split-panel" design system that effectively mirrors its mobile counterpart. While the overall aesthetics and theme support are strong, there are several opportunities to improve accessibility (especially color contrast), consistency in component usage, and mobile responsiveness for complex cards. Performance is generally good due to lazy loading patterns, but the landing page bundle size and initial LCP could be optimized.

## Issues

| # | Issue | Criticality | Category | Location |
|---|-------|-------------|----------|----------|
| 1 | Low color contrast on Primary Gold (#FCBA04) against White background. Fails WCAG AA for normal text. | 🔴 Critical | Accessibility | `src/styles/globals.css` / Multiple Pages |
| 2 | Footer copy on Login page: "DON'T HAVE AN ACCOUNT?" is correct, but the register link is just "CREATE AN ACCOUNT". Register page footer has "ALREADY HAVE AN ACCOUNT?". | ⚪ Low | UX/Usability | `src/pages/auth/LoginPage.jsx:365` |
| 3 | Floating Theme Toggle button overlaps fixed "Cancel" link and Pagination in Practice Setup on mobile. | 🟠 High | Responsive | `src/pages/main/PracticePage.css:278-318` |
| 4 | Universal `*` transition in `globals.css` causes "layout jank" on initial load and during theme switch. | 🟠 High | Performance | `src/styles/globals.css` |
| 5 | Hardcoded brand colors in multiple CSS files (e.g., Dashboard, Frameworks) instead of using global CSS variables. | 🟡 Medium | Consistency | `src/pages/main/DashboardPage.css:7` |
| 6 | "Download for Android" button on landing page is visually active but likely does nothing or is a placeholder. | 🟡 Medium | UX/Usability | `src/pages/landing/LandingPage.jsx` |
| 7 | Mobile Landing Page: "Speaking Confidence Score" card is too large, forcing important "Start Practicing" CTA below the fold. | 🟠 High | UX/Usability | `src/pages/landing/LandingPage.jsx` |
| 8 | Progress Chart SVG has fixed internal widths (1000px) which might cause scaling issues on very small screens. | 🟡 Medium | Responsive | `src/pages/main/ProgressPage.jsx:11` |
| 9 | Inconsistent button styles: `btn-primary` vs `dash-btn-training` vs `fh-card-btn`. | 🟡 Medium | Consistency | Multiple Pages |
| 10 | Password toggle "Eye" icon in Auth pages uses brittle `bottom: 10px` positioning instead of vertical centering. | 🟡 Medium | Visual Design | `src/pages/auth/AuthPages.css:381` |
| 11 | "Scroll to explore" text on landing page is too small (likely 10-11px) and has low visibility. | ⚪ Low | Visual Design | `src/pages/landing/LandingPage.jsx` |
| 12 | Dashboard Greeting text is italicized, which feels slightly dated compared to the bold Inter headings. | ⚪ Low | Visual Design | `src/pages/main/DashboardPage.css:99` |
| 13 | Practice Setup Modal actions stack vertically on mobile but have no gap between "Close" and "Copy & Edit". | 🟡 Medium | Responsive | `src/pages/main/PracticePage.css:580` |
| 14 | Training Setup dropdown for scripts has no "Loading" or "Empty" icons, just plain text. | ⚪ Low | UX/Usability | `src/pages/main/TrainingSetupPage.jsx:136` |
| 15 | History Page: Search input lacks a "Clear" button while Frameworks search has one. | 🟡 Medium | Consistency | `src/pages/main/HistoryPage.jsx:91` |
| 16 | Universal transition affects `svg` icons, causing them to "fade in" slightly delayed compared to other elements. | ⚪ Low | Micro-interactions | `src/styles/globals.css` |
| 17 | `ProtectedRoute` loading screen uses "Bigkas" text but no official logo asset. | ⚪ Low | Consistency | `src/routes/AppRouter.jsx:62` |
| 18 | Google Sign-in button padding is inconsistent between Desktop (20px) and Mobile. | ⚪ Low | Responsive | `src/pages/auth/AuthPages.css:523` |
| 19 | "Lesson of the Day" card on Dashboard has a `::before` border that might be too thin (3px) for high-density displays. | ⚪ Low | Visual Design | `src/pages/main/DashboardPage.css:317` |
| 20 | Bottom Navigation bar labels have very small font size (9-10px) which might be hard to read. | 🟠 High | Accessibility | `src/components/common/BottomNav.css` |
| 21 | No "Skeleton" screens during data fetching; users see "Loading scripts..." text which causes layout shift. | 🟡 Medium | UX/Usability | Multiple Pages |
| 22 | Form inputs in Auth pages have `border-bottom` only; mobile users might find it harder to tap accurately compared to boxed inputs. | 🟡 Medium | UX/Usability | `src/pages/auth/AuthPages.css:333` |
| 23 | Dashboard "Ready to speak?" Hero card uses `radial-gradient` for decoration which might not render smoothly on older browsers. | ⚪ Low | Performance | `src/pages/main/DashboardPage.css:139` |
| 24 | Universal `outline: none` on inputs without a clear `:focus-visible` state in some pages. | 🔴 Critical | Accessibility | Multiple Pages |

## Criticality Legend
- 🔴 **Critical**: Breaks functionality or violates accessibility standards
- 🟠 **High**: Significantly impacts user experience or design quality
- 🟡 **Medium**: Noticeable issue that should be addressed
- ⚪ **Low**: Nice-to-have improvement

## Next Steps
1. **Fix Accessibility**: Address color contrast for `#FCBA04` by slightly darkening it for text or using it only for background elements with dark text. Implement clear `:focus-visible` states.
2. **Refine Mobile UX**: Adjust the Bottom Navigation and fixed action buttons in Practice Setup to prevent overlap.
3. **Consolidate Design Tokens**: Move all hardcoded brand colors to `globals.css` variables and reuse them across all components.
4. **Improve Loading States**: Replace text-based "Loading..." indicators with Skeleton components to reduce layout shifts.
5. **Optimize Landing Page**: Reduce LCP by optimizing the "Speaking Confidence Score" card image/SVG and minimizing universal transitions.
