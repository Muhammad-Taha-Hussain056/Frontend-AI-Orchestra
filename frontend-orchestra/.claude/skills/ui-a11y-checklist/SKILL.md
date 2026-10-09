---
name: ui-a11y-checklist
description: The manual WCAG 2.2 AA accessibility checklist used by developers and the a11y-reviewer agent - success criteria mapped to concrete checks, per-component patterns (dialog, menu, tabs, combobox, toast, table, form, navigation) and the manual test procedure. Use whenever you build or review any interactive UI, form, modal, menu, navigation, table, chart or animation, or when asked to check accessibility, keyboard support or screen reader behavior.
---

# Accessibility checklist (WCAG 2.2 AA, manual)

Radix primitives give correct behavior for many widgets; this checklist covers everything they do not. Accessibility is verified by **reading code and stories plus a manual pass**; there is no automated gate in this project (Storybook's a11y panel may be used as a hint, not as proof).

## Checklist by area

| Area | Check | WCAG |
|---|---|---|
| Text alternatives | Informative images have alt text; decorative `alt=""`/`aria-hidden`; icon-only buttons have `aria-label` | 1.1.1 |
| Structure | Landmarks (`header`, `nav`, `main`, `footer`); one `<h1>`; headings in order; lists are lists; tables use real table markup | 1.3.1, 2.4.6 |
| Input purpose | Personal-data fields have `autoComplete` tokens | 1.3.5 |
| Contrast | Text 4.5:1 (3:1 large); UI components, focus rings, chart marks 3:1; verified for **both themes** | 1.4.3, 1.4.11 |
| Resize and reflow | Usable at 200% zoom; no two-dimensional scroll at 320px width; text spacing overrides do not clip | 1.4.4, 1.4.10, 1.4.12 |
| Hover/focus content | Tooltips/popovers dismissible (Esc), hoverable, persistent | 1.4.13 |
| Keyboard | Every action reachable and operable by keyboard; no traps; logical tab order; no positive `tabindex` | 2.1.1, 2.1.2, 2.4.3 |
| Skip link | "Skip to content" is the first focusable element in the root layout | 2.4.1 |
| Focus | Visible focus indicator (`focus-visible` ring from tokens); focus never hidden under sticky headers | 2.4.7, 2.4.11 |
| Pointer | Targets at least 24x24 px; drag interactions have a non-drag alternative; label in name matches visible text | 2.5.8, 2.5.7, 2.5.3 |
| Language | `<html lang>` set (and `lang` on foreign-language passages) | 3.1.1 |
| Consistency | Help/contact mechanism in the same place across pages | 3.2.6 |
| Forms | Visible labels; required marked; errors identified in text, linked via `aria-describedby`, `aria-invalid`, with suggestions; no re-asking known info | 3.3.1, 3.3.2, 3.3.3, 3.3.7 |
| Authentication | No cognitive tests; paste allowed in password fields; password managers work | 3.3.8 |
| Name/role/value | Custom widgets expose correct role, name, state (`aria-expanded`, `aria-selected`, `aria-checked`) | 4.1.2 |
| Status messages | Toasts, async results and form summaries announced with `role="status"`/`aria-live="polite"` (`role="alert"` for errors) | 4.1.3 |
| Motion | Respect `prefers-reduced-motion`; nothing flashes more than 3 times per second; auto-playing motion over 5 s can be paused | 2.2.2, 2.3.1 |

## Component patterns

| Component | Must have |
|---|---|
| Dialog | Focus moves in on open, trapped, returns to trigger on close; Esc closes; labelled (`aria-labelledby`); background inert |
| Menu / dropdown | Trigger is a button with `aria-expanded`/`aria-haspopup`; arrow keys, Home/End, type-ahead; Esc closes and returns focus |
| Tabs | `tablist`/`tab`/`tabpanel`, arrow-key navigation, only selected tab in tab order |
| Combobox / select | Label, `aria-expanded`, active option announced, Esc clears or closes, works without a mouse |
| Toast | Polite live region; does not steal focus; stays long enough or has persistent/dismiss control; not the only place an error appears |
| Data table | Header cells with scope, `aria-sort`, labelled selection checkboxes, caption (`ui-data-table`) |
| Form | Label per control, grouped radios/checkboxes in `fieldset`/`legend`, error summary or first-error focus (`form-rhf-zod`) |
| Navigation | `nav` with label when several exist; current page `aria-current="page"` |
| Loading | Skeletons hidden from AT; busy regions `aria-busy`; announce completion for long operations |
| Charts | Text summary and data-table alternative (`ui-charts`) |

## Manual procedure (run for every new interactive component or page)

1. **Keyboard only:** unplug the mouse; Tab/Shift+Tab through; operate every control; confirm focus is always visible and never lost.
2. **Zoom/reflow:** browser zoom 200% and a 320px viewport; nothing clipped or overlapping.
3. **Screen reader smoke test:** VoiceOver (macOS/iOS) or NVDA (Windows): headings list, landmarks, form labels, error announcements, dialog open/close.
4. **Themes:** light and dark contrast; focus ring visible in both.
5. **Reduced motion:** enable the OS setting; confirm animations calm down.
6. Record results in the PR (checked items, unchecked items with reason).

## Reviewer output

Findings reported as `Severity | WCAG criterion | file:line | Problem | Fix`, verdict `PASS`, `PASS WITH ISSUES` or `FAIL`; items that need the running UI to verify are listed explicitly as "not verified".
