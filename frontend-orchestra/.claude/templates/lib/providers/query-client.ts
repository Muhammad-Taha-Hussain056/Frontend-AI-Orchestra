import { cache } from 'react';
import { isServer, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ProblemError } from '@/lib/api/problem';
import { STALE } from '@/lib/queries/stale-times';

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: (err, q) => { if (!q.meta?.silent) handleGlobalError(err); } }),
    mutationCache: new MutationCache({ onError: (err, _v, _c, m) => { if (!m.meta?.silent) handleGlobalError(err); } }),
    defaultOptions: {
      queries: {
        staleTime: STALE.standard,                                   // > 0 so hydrated data is not refetched immediately
        retry: (count, err) => !(err instanceof ProblemError && err.status < 500 && ![408, 429].includes(err.status)) && count < 2,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: 0 },
    },
  });
}

function handleGlobalError(err: unknown) {
  if (!(err instanceof ProblemError)) return;
  // 401 -> login/refresh; 403 -> permission toast; 5xx -> toast with traceId. Wire to the toast/router here (see form-error-mapping).
}

let browserClient: QueryClient | undefined;
export function getQueryClient() {
  if (isServer) return makeQueryClient();                             // new per call on the server
  return (browserClient ??= makeQueryClient());                       // singleton in the browser
}
export const getServerQueryClient = cache(makeQueryClient);           // one per request for Server Components
