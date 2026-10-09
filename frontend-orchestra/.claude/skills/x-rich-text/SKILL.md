---
name: x-rich-text
description: Rich text editor selector and standard - choosing between Tiptap and Lexical per project, JSON document storage with a contract schema, sanitization, SSR-safe client-only loading, read-only rendering, link and image handling, toolbar accessibility. Use whenever you add a rich text editor, comments with formatting, a CMS-like field, markdown or WYSIWYG input, mentions or editor extensions, or when editor content must be rendered or stored.
---

# Rich text

Toggle: `toggles.richText` is `none`, `tiptap` or `lexical`. Ask the user before choosing when it is `none`.

## Selector

| Choose **Tiptap** (default when undecided) | Choose **Lexical** |
|---|---|
| Rich extension ecosystem, mentions, tables, slash commands | Very large documents or strict performance needs |
| Real-time collaboration through Yjs-based providers | Team already experienced with Lexical/Meta tooling |
| Headless on ProseMirror, straightforward React API | Need fine-grained control of the editor state model |

Whichever is selected, the **rules below are identical**, and only one editor library ships in the project.

## Storage and contract

- Store the **document JSON**, not HTML. Contract: `richTextDocSchema` in `@scope/contracts` (versioned envelope: `{ version: number; doc: unknown-object }`), validated on both sides.
- Plain-text derivatives (search, previews, notifications) are produced server-side from the JSON.
- Never render stored HTML with `dangerouslySetInnerHTML`. If HTML must be generated (emails, exports), generate it on the server from JSON and sanitize it (allowlist of tags/attributes, `rel="noopener noreferrer"` on links).

## Loading and SSR

- The editor is a **client-only, lazy-loaded** component (`next/dynamic`, `ssr: false` inside a client file). Tiptap needs its SSR/hydration option set so the first client render matches (`immediatelyRender: false`; confirm in the docs for the pinned version).
- Read-only display of stored content uses a lightweight renderer (server-generated safe output or a read-only editor instance), never the full editor.
- Provide a skeleton with the editor's final height to avoid layout shift.

## Behavior standards

| Topic | Standard |
|---|---|
| Forms | Controlled through React Hook Form `Controller`; value is the JSON; `required` means non-empty text, not non-null JSON |
| Links | Validate URL scheme (`http`, `https`, `mailto`); auto-add `rel`; open external in new tab with `noopener` |
| Images | Upload through `x-uploads`; the document stores the file reference, never base64 |
| Paste | Strip styles and unknown nodes; paste-as-plain-text option |
| Mentions/commands | Backed by TanStack Query search endpoints, debounced |
| Limits | Max document size and node depth enforced client and server |
| Autosave | Debounced mutation (`data-mutations`) with a "saving/saved" indicator; no optimistic version overwrite without a version/ETag |

## Accessibility

Toolbar is a `role="toolbar"` with roving tabindex, buttons with `aria-label` and `aria-pressed`, shortcuts documented; editor area has an accessible name and `role="textbox"` with `aria-multiline`; focus visible; do not trap Tab unless an explicit escape is provided (Esc then Tab). Run `ui-a11y-checklist`.

## Anti-patterns

- Persisting HTML and rendering it unsanitized.
- Importing the editor statically in a server component or page.
- Base64 images inside documents.
- Two editor libraries in one app.
- Treating editor state as server state in a store.
