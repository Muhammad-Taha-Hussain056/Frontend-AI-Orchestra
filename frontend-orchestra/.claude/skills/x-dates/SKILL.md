---
name: x-dates
description: Date and time standard - UTC ISO strings on the wire, date-only values, date-fns helpers in packages/utils, user timezone handling, hydration-safe rendering, parsing traps, schema definitions and test practices. Use whenever you display, parse, compare, format, store or send a date, time, duration or relative time, add a date picker, build a calendar or schedule, or see off-by-one-day or hydration mismatch bugs.
---

# Dates and times

Library: `date-fns` (plus its timezone package for zone-aware work). No Moment, no ad-hoc `Date` formatting. Check the pinned `date-fns` major and its timezone helper docs before using zone APIs (UNVERIFIED here).

## Wire format

| Kind | Format | Zod (contracts) |
|---|---|---|
| Instant (created at, scheduled at) | UTC ISO 8601 with `Z`: `2026-10-08T14:30:00.000Z` | ISO datetime string schema (`z.string().datetime()` in Zod 3; the ISO helper in Zod 4; check the pinned version) |
| Calendar date (birthday, due date, booking day) | `YYYY-MM-DD` string, **never** converted to an instant | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` |
| Duration | Integer seconds or ISO 8601 duration; document the unit in the field name (`timeoutSeconds`) | `z.number().int()` |
| Time of day | `HH:mm` string plus a separate timezone field when needed | regex |

Never send local-time strings without an offset. Never send epoch milliseconds unless the backend contract says so.

## Helpers (single home: `packages/utils/src/dates/`)

`formatDate(iso, opts)`, `formatDateTime(iso, opts)`, `formatRelative(iso, now?)`, `formatCalendarDate('YYYY-MM-DD', opts)`, `toIso(date)`, `parseIso(string)`, `isSameCalendarDay(a, b, tz)`. All accept `{ locale, timeZone }` with defaults from the app context. Components call helpers; they never call `toLocaleString`, `Intl.DateTimeFormat` or `format()` directly.

## Time zones

- Display in the **user's** timezone: profile setting first, then the browser's (`Intl.DateTimeFormat().resolvedOptions().timeZone`), stored in a cookie so the server can render the same output.
- Day boundaries ("today", "this week") are computed in the display timezone, not UTC.
- Scheduling for another place (meeting in a venue's zone) stores the IANA zone name with the instant.

## Hydration safety

Server and client must render identical text. Either render with a timezone known to both (cookie/profile), or render zone-dependent text in a client leaf after mount (`useEffect` + state) with a stable placeholder. Relative times ("5 minutes ago") are client-only and update on an interval.

## Traps (all banned)

- `new Date('2026-10-08')` parses as **UTC midnight** and shifts the day in negative-offset zones. Parse calendar dates with the helper.
- `new Date(string)` for anything not ISO; `Date.parse` on user input.
- Subtracting dates to count days across DST; use date-fns difference helpers in the right zone.
- Using `getTimezoneOffset()` arithmetic by hand.
- Storing the picker's `Date` directly: convert to an ISO string (instant) or `YYYY-MM-DD` (calendar date) in the form mapper (`form-rhf-zod`).

## Tests

Freeze time (`vi.useFakeTimers(); vi.setSystemTime(...)`), run helper tests under at least two timezones (e.g. `UTC` and `America/Los_Angeles`, set via the `TZ` env in the Vitest config), and include DST boundary cases.

## Anti-patterns

- Formatting dates in multiple styles across the UI; use the helper's named styles.
- Comparing ISO strings from different offsets lexicographically.
- Server components rendering `new Date()` into cached output.
