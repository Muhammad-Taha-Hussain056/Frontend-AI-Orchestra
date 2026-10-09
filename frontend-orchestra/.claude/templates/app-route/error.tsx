'use client';
import { Button } from '{{scope}}/ui';
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="space-y-3">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      {error.digest && <p className="text-sm text-muted-foreground">Reference: {error.digest}</p>}
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
