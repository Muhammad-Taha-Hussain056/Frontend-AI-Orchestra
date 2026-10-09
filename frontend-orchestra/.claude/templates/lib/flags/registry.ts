export const FLAGS = {
  // 'orders.bulkActions': { default: false, owner: 'team-orders', description: 'Bulk actions on the orders table', removeBy: '2026-12-01' },
} as const satisfies Record<string, { default: boolean; owner: string; description: string; removeBy: string }>;
export type FlagKey = keyof typeof FLAGS;
