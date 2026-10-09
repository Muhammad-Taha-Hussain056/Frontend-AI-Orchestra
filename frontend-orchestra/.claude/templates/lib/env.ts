import { z } from 'zod';

// The ONLY place that reads process.env. Server and client schemas are separate; fail fast on boot.
const server = z.object({
  API_URL: z.string().url(),                        // NestJS base URL (server only)
  APP_URL: z.string().url(),                        // public origin of this app
  AUTH_REFRESH_PATH: z.string().default('/auth/refresh'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});
const client = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('App'),
});

const isServer = typeof window === 'undefined';
export const env = {
  ...(isServer ? server.parse(process.env) : ({} as z.infer<typeof server>)),
  ...client.parse({ NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME }),
};
