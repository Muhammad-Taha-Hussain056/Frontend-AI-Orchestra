'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create{{Entity}}InputSchema, {{entity}}Schema, type Create{{Entity}}Input } from '{{scope}}/contracts';
import { apiFetch } from '@/lib/api/client';
import { {{entity}}Keys } from '../api/keys';

export function useCreate{{Entity}}() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: Create{{Entity}}Input; idempotencyKey: string }) =>
      apiFetch('/{{feature}}', { method: 'POST', body: create{{Entity}}InputSchema.parse(input), schema: {{entity}}Schema, idempotencyKey }),
    onSuccess: (created) => {
      qc.setQueryData({{entity}}Keys.detail(created.id), created);
      return qc.invalidateQueries({ queryKey: {{entity}}Keys.lists() });
    },
  });
}
