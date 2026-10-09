import { Skeleton } from '{{scope}}/ui';
export default function Loading() {
  return <div className="space-y-3" aria-hidden="true"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
}
