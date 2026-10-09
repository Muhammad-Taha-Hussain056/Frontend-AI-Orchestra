---
name: ui-charts
description: Charting standard - Recharts by default, ECharts for large or complex data (explicit thresholds), lazy client-only loading, token-based colors, accessibility alternatives, loading/empty states, number formatting and the shared ChartCard. Use whenever you add a chart, graph, sparkline, dashboard widget or any data visualization, or when a chart is slow, clipped, unreadable in dark mode or inaccessible.
---

# Charts

## Library choice (rule-based)

| Use **Recharts** (default) | Use **ECharts** |
|---|---|
| Line, bar, area, pie/donut, scatter, sparklines | More than about 5,000 points rendered, or streaming updates |
| Up to a few hundred points per series | Heatmaps, treemaps, sankey, candlestick, geo maps, radar-heavy or 3D visuals |
| Simple tooltips/legends | Need canvas performance, dataZoom brush, rich built-in interactions |

Pick one per chart and record the reason in a comment only when choosing ECharts. Do not add Visx/Chart.js without approval.

## Loading and structure

Charts are client components, **lazy-loaded** so they never enter the initial bundle:

```tsx
'use client';
import dynamic from 'next/dynamic';
export const RevenueChart = dynamic(() => import('./revenue-chart'), { ssr: false, loading: () => <ChartSkeleton /> });
```

Wrap every chart in `ChartCard` (`packages/ui`): title, optional description, actions, loading/empty/error slots, fixed minimum height (prevents layout shift). Recharts' `ResponsiveContainer` needs a parent with a defined height.

## Data

- Aggregate and downsample **on the server** (BFF/NestJS); never ship raw event logs to the browser.
- Fetch with TanStack Query like any server data; the chart receives plain arrays.
- Dates on the x-axis are ISO strings formatted by shared helpers; numbers by `Intl.NumberFormat` (compact for axes, full for tooltips).

## Color and theming

Series colors come from `--chart-1`...`--chart-5` tokens, read through CSS variables (`stroke="var(--chart-1)"`), so dark mode works. Never hard-code hex. More than five series: group into "Other" or use a table.

## Accessibility (manual checklist applies)

- A text title and short description summarizing the insight.
- Do not rely on color alone: add direct labels, markers or patterns; keep 3:1 contrast against the background.
- Provide the same data as a table (toggle or `<details>`), and `role="img"` with `aria-label` on decorative SVG wrappers when the table exists.
- Tooltips must be reachable by keyboard when they carry unique information.
- Respect `prefers-reduced-motion`: disable chart animations (`isAnimationActive={false}` / ECharts `animation: false`).

## States

Skeleton (matching height), empty ("No data for this period" with the date range), error with retry. Zero is data; missing is empty.

## Anti-patterns

- Rendering charts during SSR or importing the library statically in a server component.
- Pie charts for more than five slices, or truncated bar axes.
- Passing thousands of points to Recharts.
- Chart-specific color palettes outside the token set.
- Dual-axis charts without explicit axis labels.
