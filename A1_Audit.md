# A1 Level Page Audit

**Audit date:** 2026-08-21
**Page audited:** `a1/index.html` and its directly used CSS/JavaScript modules
**Audit type:** Source, structure, behavior, accessibility, content, performance, SEO, and maintainability

## Executive summary

The A1 page has a strong amount of learning content, clear sectioning, responsive breakpoints, progressive disclosure, authentication hooks, progress summaries, and generally sensible semantic elements. Automated source checks found no duplicate IDs, missing local `href`/`src` targets, replacement characters, or obvious JavaScript syntax problems.

The most important verified defect is that the exercise filter cannot select the **Communication** exercise even though a Communication card exists. The largest accessibility concerns are the absence of a skip link in the markup, missing keyboard semantics on the clickable logo, incomplete focus styling, and weak modal/side-panel focus management. The largest performance concern is the page's unusually large CSS and eager JavaScript footprint.

No P0/blocker was found. The recommended order is:

1. Fix the Communication filter and keyboard/focus issues.
2. Add skip navigation and correct interactive semantics.
3. Improve authentication/modal and panel accessibility.
4. Reduce CSS/JavaScript payload and defer non-critical work.
5. Align content claims and strengthen metadata/analytics.

## Scope and limitations

Reviewed files include:

- `a1/index.html`
- `js/a1.js`
- `js/level-interactions.js`
- `js/level-page.js`
- `js/auth-gate.js`
- A1 progress, library, and practice modules imported by `js/a1.js`
- `css/a1.css`, `css/style.css`, and `css/dark.css`

Automated checks covered duplicate IDs, local asset/link existence, encoding markers, file sizes, source-level interaction logic, responsive rules, and accessibility attributes. The in-app browser controller could not initialize because of a runtime module-import failure, so viewport rendering, computed color contrast, layout shifts, keyboard tab order, screen-reader output, and live Firebase authentication were not visually verified. Those checks are listed in the final QA plan.

## Priority overview

| ID | Priority | Area | Finding |
|---|---|---|---|
| A1-01 | High | Functionality | Communication exercise has no matching filter button |
| A1-02 | High | Accessibility | No skip link is present, despite skip-link CSS existing |
| A1-03 | High | Accessibility | Clickable logo is not keyboard accessible or semantically interactive |
| A1-04 | High | Accessibility | Exercise filters explicitly remove the focus outline without a replacement |
| A1-05 | High | Accessibility | Auth/profile modals do not implement robust focus management |
| A1-06 | Medium | Navigation | Side panels lack complete state, focus, and landmark handling |
| A1-07 | Medium | Authentication | Protected-route coverage is inconsistent across A1 learning destinations |
| A1-08 | Medium | Performance | CSS payload is very large and highly page-specific rules are fragmented |
| A1-09 | Medium | Performance | A1 startup eagerly imports and executes many feature modules |
| A1-10 | Medium | Performance | Images have no intrinsic dimensions or explicit loading/decoding strategy |
| A1-11 | Medium | Content | Course duration differs from the enrollment page |
| A1-12 | Medium | Content | Mobile FAQ uses future tense for an already-launched platform |
| A1-13 | Medium | Accessibility | Reduced-motion coverage is incomplete |
| A1-14 | Low | SEO/sharing | Metadata is minimal; canonical and social metadata are absent |
| A1-15 | Low | Semantics | Numeric statistics are marked up as headings |
| A1-16 | Low | Maintainability | A1 page is duplicated in a legacy `pages/a1.html` file |
| A1-17 | Low | UX | Desktop course-section menu cannot be toggled closed with its own button |
| A1-18 | Low | UX/content | CTA language does not clearly separate the live paid course from free/self-study material |

## Detailed findings

### A1-01 — Communication exercise has no matching filter button

**Priority:** High
**Evidence:** `a1/index.html` provides filter buttons for All, Grammar, Vocabulary, Listening, Reading, Writing, and Speaking around lines 972–985. The final exercise card is categorized as `Communication` around line 1158. `initExerciseFilters()` matches the lower-cased button text to `.exercise-type` exactly.

**Impact:** Users can see Real-Life Dialogues under All but cannot filter directly to it. This is a definite functional inconsistency and makes the filter taxonomy incomplete.

**Recommendation:** Add a `Communication` filter button, or deliberately map Communication into Speaking. Prefer stable `data-filter` values over deriving behavior from visible button text. Add a small test asserting that every distinct `.exercise-type` has a selectable filter.

### A1-02 — No skip link in the page markup

**Priority:** High
**Evidence:** `.skip-link` styles exist in `css/style.css`, but `a1/index.html` contains no skip-link element.

**Impact:** Keyboard and screen-reader users must traverse the entire header/navigation controls before reaching the main course content on every visit.

**Recommendation:** Insert `<a class="skip-link" href="#main-content">Skip to main content</a>` as the first focusable element and give `<main>` the matching ID. Consider a second skip link to the course navigation only if testing shows it is useful.

### A1-03 — Clickable logo is not keyboard accessible

**Priority:** High
**Evidence:** The header logo is a `<div id="logoHome">`; `initLevelPage()` attaches only a `click` handler. It has no link role, `tabindex`, keyboard handler, or native anchor semantics.

**Impact:** Pointer users can navigate home through the logo, while keyboard and assistive-technology users cannot discover or activate the same behavior.

**Recommendation:** Replace the wrapper with an `<a href="../" aria-label="Rafi's Wörterbuch home">`. Native anchor semantics are preferable to adding `role`, `tabindex`, and key handlers to the div.

### A1-04 — Exercise filters suppress visible keyboard focus

**Priority:** High
**Evidence:** `css/a1.css` sets `.exercise-filter button { outline: none; }` around line 1418. No corresponding `.exercise-filter button:focus-visible` rule was found.

**Impact:** Keyboard users can lose track of focus while moving among filter buttons. Hover and active styling do not reliably replace a focus indicator.

**Recommendation:** Remove `outline: none`, or add a high-contrast `:focus-visible` outline with sufficient offset. Audit every interactive selector that removes outlines, including reveal controls and custom navigation.

### A1-05 — Modal focus management is incomplete

**Priority:** High
**Evidence:** The auth gate focuses the email field when opened, but does not save/restore the triggering element, trap focus inside the modal, or mark the background inert. The dynamically created profile modal has no `role="dialog"`, no `aria-modal`, no labelled relationship, no initial focus, and no Escape handler.

**Impact:** Keyboard focus can move behind an open modal, closing may leave focus in an unexpected place, and screen readers may not receive a reliable modal context.

**Recommendation:** Build a shared accessible modal utility that:

- records and restores the opener;
- provides `role="dialog"`, `aria-modal="true"`, and an accessible title;
- moves initial focus inside;
- traps Tab/Shift+Tab;
- makes background content inert while open;
- supports Escape unless the modal is intentionally non-dismissible.

### A1-06 — Side panels need stronger accessibility state handling

**Priority:** Medium
**Evidence:** Menu buttons update `aria-expanded`, but the panels are plain `<div>` elements. Their visibility state is not mirrored with `aria-hidden`/`inert`; focus is not moved into an opened panel or restored on close; Escape handling is absent in `initLevelPage()`; and the duplicated menu button groups are not navigation landmarks.

**Impact:** Keyboard and screen-reader navigation may include hidden panel controls or provide no clear announcement that a navigation panel opened.

**Recommendation:** Use `<nav aria-label="Primary">`, synchronize `hidden`/`inert` with visual state, support Escape, move focus deliberately, restore it on close, and close when focus leaves where appropriate. Consider one responsive navigation component instead of duplicated desktop/mobile markup.

### A1-07 — Protected-route coverage is inconsistent

**Priority:** Medium
**Evidence:** `auth-gate.js` protects enrollment, most course modules, most library topics, most practices, download resources, and PDF paths. It does not list `progress` or `mixed-mastery`. The A1 page links directly to both.

**Impact:** If the product rule is “login is required for learner-specific course content,” users may bypass that rule through the progress or mixed-review routes. Progress may also expose a confusing empty/persisted-local state while logged out.

**Recommendation:** Write an explicit route-access matrix (public preview vs authenticated content) and encode it in one central policy. Confirm whether `/progress/` and `/mixed-mastery/` should be protected. Add route-level tests for logged-in and logged-out behavior rather than relying only on link interception.

### A1-08 — CSS payload is oversized and difficult to maintain

**Priority:** Medium
**Evidence:** Approximate source sizes are `css/style.css` 124.5 KB, `css/a1.css` 93 KB, and `css/dark.css` 28 KB—about 245 KB before transfer compression. `a1.css` contains many repeated breakpoint blocks and repeated font-size/card overrides.

**Impact:** More CSS must be downloaded, parsed, and recalculated. Repeated overrides increase regression risk and make it difficult to determine which rule wins.

**Recommendation:** Consolidate tokens and repeated component styles; merge adjacent media queries; remove dead/duplicate declarations; separate shared level-page components from A1-only additions; and run a coverage audit before deletion. Add minification and hashed production assets.

### A1-09 — Startup eagerly loads many feature modules

**Priority:** Medium
**Evidence:** `js/a1.js` statically imports and immediately runs library session, grammar, flashcards, matching, listening, reading, builder, speaking, dialogue, progress, navigation, auth, and interaction modules. Several imported modules/data files are 10–30 KB each before compression.

**Impact:** Users pay parse/evaluation cost for below-the-fold sections they may never view. Lower-end mobile devices are most affected.

**Recommendation:** Keep header/auth/navigation and above-the-fold behavior in the entry bundle. Lazy-load library/practice enrichments with `IntersectionObserver` or dynamic `import()` when their sections approach the viewport. Measure with a production Lighthouse trace before and after.

### A1-10 — Images lack intrinsic dimensions and loading hints

**Priority:** Medium
**Evidence:** The logo and hero illustration have no `width` or `height` attributes. Neither specifies `decoding`; the page has no explicit loading strategy.

**Impact:** Missing intrinsic aspect ratios can contribute to layout shift. Browser decoding/loading priorities are left entirely implicit.

**Recommendation:** Add correct intrinsic dimensions to both images. Keep the above-the-fold hero eager and consider `fetchpriority="high"` only if measurement proves it is the LCP element; use `decoding="async"` where appropriate. Lazy-load only genuinely below-the-fold images.

### A1-11 — Course duration is inconsistent

**Priority:** Medium
**Evidence:** The A1 page states `8–12 Weeks` and repeats that range in the FAQ. `js/course-enrollment.js` defines the paid A1 course duration as `10-12 weeks`.

**Impact:** A learner moving from the marketing page to enrollment receives conflicting expectations about completion time.

**Recommendation:** Decide whether one value describes self-paced completion and the other describes the live cohort. If both are correct, label them explicitly (for example, “Self-study estimate: 8–12 weeks” and “Live course: 10–12 weeks”). Otherwise use one source of truth.

### A1-12 — Mobile FAQ copy is stale/future-oriented

**Priority:** Medium
**Evidence:** The answer says, “The entire learning platform will be fully responsive,” although the platform is already live and the page includes responsive CSS.

**Impact:** Future tense undermines confidence and can imply that mobile support is unfinished.

**Recommendation:** Change to a present, testable claim such as “Yes. The learning platform is designed for desktop, tablet, and mobile.” Only state “fully responsive” after completing device QA.

### A1-13 — Reduced-motion handling is incomplete

**Priority:** Medium
**Evidence:** `css/a1.css` defines several infinite and entrance animations. A reduced-motion rule exists in shared CSS, and one JavaScript reveal checks `prefers-reduced-motion`, but no comprehensive A1-specific override was found for all decorative and card animations. Smooth scrolling is also invoked from JavaScript without checking the preference.

**Impact:** Users who request reduced motion may still receive floating shapes, card entrances, transitions, and smooth scrolling.

**Recommendation:** Add a page-wide `@media (prefers-reduced-motion: reduce)` policy that stops non-essential animations/transitions and switches scripted scrolling to `behavior: "auto"`. Test the full page with the OS preference enabled.

### A1-14 — SEO and sharing metadata are minimal

**Priority:** Low
**Evidence:** The head contains a title and short description, but no canonical URL, Open Graph metadata, Twitter card metadata, or structured course/breadcrumb data.

**Impact:** Shared links may have weak previews, and search engines receive little structured context about the A1 course.

**Recommendation:** Add a unique, benefit-led description, canonical URL, `og:title`, `og:description`, `og:image`, `og:url`, Twitter card tags, and suitable JSON-LD after validating claims. Ensure the canonical matches the clean `/a1/` route rather than the legacy HTML path.

### A1-15 — Statistics are incorrectly expressed as headings

**Priority:** Low
**Evidence:** Values such as `119`, `361`, `8`, and `A1` are inside `<h3>` elements even though they are metrics, not section headings.

**Impact:** Screen-reader heading navigation contains entries that do not describe document sections.

**Recommendation:** Use a definition list (`<dl><dt>…</dt><dd>…</dd></dl>`) or plain styled elements. Reserve heading elements for meaningful content hierarchy.

### A1-16 — Legacy A1 markup is duplicated

**Priority:** Low
**Evidence:** Both `a1/index.html` and `pages/a1.html` exist. JavaScript redirects the legacy route, but maintaining two full documents risks drift.

**Impact:** Content, links, accessibility fixes, and metadata can become inconsistent depending on which file is edited or cached.

**Recommendation:** Generate both routes from one template, or replace the legacy document with a minimal server/static redirect if hosting permits. Treat `/a1/` as canonical.

### A1-17 — Desktop section-menu button does not toggle closed

**Priority:** Low
**Evidence:** On hover-capable devices, the click handler calls `setOpen(supportsHover || !menu.classList.contains("is-open"))`. Because `supportsHover` is true, clicking the open toggle always requests the open state.

**Impact:** The control behaves like a toggle visually and exposes `aria-expanded`, but cannot be closed with the same click on desktop. Users must click elsewhere or press Escape.

**Recommendation:** Always toggle on click: `setOpen(!menu.classList.contains("is-open"))`. Keep hover behavior as an additional pointer convenience, not as a change to click semantics.

### A1-18 — Enrollment CTA meaning is ambiguous

**Priority:** Low
**Evidence:** “Start Learning” links to the paid enrollment/packages page, while many free/self-study cards also use “Start Learning” or similar language. The hero does not immediately clarify that its primary CTA opens live-course packages.

**Impact:** Users may expect the hero CTA to start a lesson and instead encounter login plus enrollment pricing.

**Recommendation:** Rename the enrollment CTA to “View A1 Course Packages” or “Enroll in the Live A1 Course.” Use “Start Learning” only for immediate learning activities. This also makes the new login gate less surprising.

## Positive findings

- One clear `<h1>` is present.
- The document language is declared as English.
- Local links and asset references resolved during the source check.
- No duplicate IDs were detected.
- No Unicode replacement characters or common mojibake sequences were detected in the UTF-8 source.
- External social links opened in new tabs include `rel="noopener"`.
- FAQ JavaScript adds `type="button"`, `aria-controls`, `aria-expanded`, and answer visibility state.
- Exercise filter JavaScript maintains `aria-pressed` state.
- Menu triggers expose `aria-controls` and `aria-expanded`.
- Dynamic card-reveal controls use real buttons and reduced-motion-aware Web Animations.
- The mixed-review card clearly says it is not an official CEFR or Goethe examination.
- Progress, library, and practice status text is updated from application data rather than being purely decorative.

## Recommended implementation plan

### Phase 1 — Correctness and keyboard access

1. Add/fix the Communication filter taxonomy.
2. Add a skip link and main target.
3. Convert the home logo wrapper to an anchor.
4. restore visible focus on filter buttons and audit all `outline: none` rules.
5. Fix the desktop course-menu click toggle.

### Phase 2 — Accessible overlays and navigation

1. Create a shared modal controller with focus trapping/restoration and inert background handling.
2. Upgrade auth and profile dialogs to use it.
3. Give side panels navigation semantics, synchronized hidden state, Escape support, and deliberate focus movement.
4. Validate with keyboard-only and at least one screen reader.

### Phase 3 — Content and access policy

1. Define public-preview and authenticated-route rules.
2. Decide access for progress and mixed mastery; add tests.
3. Reconcile the 8–12 vs 10–12 week duration.
4. Update mobile-support copy and CTA labels.

### Phase 4 — Performance and maintainability

1. Record baseline LCP, CLS, INP, transferred bytes, and main-thread time.
2. Add image dimensions.
3. Lazy-load below-the-fold feature modules.
4. consolidate CSS/media queries and remove unused rules using coverage evidence.
5. Eliminate duplicated legacy page maintenance.

### Phase 5 — Discoverability

1. Add canonical/social metadata.
2. Add validated structured data.
3. Confirm titles/descriptions are unique across A1–B2.

## Browser and device QA checklist

These checks should be completed after the browser runtime is available:

- Desktop widths: 1280, 1440, and 1920 px.
- Tablet widths: 768 and 1024 px in both orientations.
- Mobile widths: 320, 360, 390, and 430 px.
- 200% and 400% browser zoom without clipped content or lost controls.
- Keyboard-only traversal from the first element through footer.
- Visible focus on every link, button, menu control, FAQ, and modal control.
- Escape, focus trap, and focus restoration for auth/profile overlays and panels.
- Screen-reader heading and landmark navigation.
- Light/dark/system themes, including contrast checks for text, badges, buttons, borders, and focus indicators.
- `prefers-reduced-motion: reduce` behavior.
- Logged-out and logged-in access for enrollment, every module, every library topic, all exercises, mixed mastery, progress, downloads, and PDFs.
- Filter behavior for every exercise category.
- No layout shift from logo/hero images.
- Slow network and offline/service-worker behavior.
- Firebase login, signup, verification, reset-password, and logout error states.
- Lighthouse and Web Vitals using a production build, not only the local development server.

## Suggested acceptance criteria

- Every exercise category is selectable and filtering never strands a card.
- All functionality is operable with keyboard alone.
- Every interactive element has a visible focus indicator.
- Opening an overlay moves focus inside; closing restores focus to its trigger.
- Hidden panels and dialogs are excluded from the accessibility tree and tab order.
- Access policy tests pass for every A1 destination.
- Course-duration and enrollment language is consistent and unambiguous.
- No horizontal scrolling at 320 CSS px or 400% zoom.
- No non-essential animation runs when reduced motion is requested.
- Images reserve their layout space before loading.
- Performance improvements are judged against recorded baseline metrics.
