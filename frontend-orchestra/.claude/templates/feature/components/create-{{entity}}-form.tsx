'use client';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, FormField, FormRootError, Input, toast } from '{{scope}}/ui';
import { applyProblemToForm } from '@/lib/api/apply-problem-to-form';
import { useUnsavedChangesGuard } from '@/lib/hooks/use-unsaved-changes-guard';
import { routes } from '@/lib/routes';
import { useCreate{{Entity}} } from '../hooks/use-create-{{entity}}';
import { messages } from '../messages';
import { create{{Entity}}FormSchema, toCreate{{Entity}}Input, type Create{{Entity}}FormInput, type Create{{Entity}}FormValues } from '../schemas/create-{{entity}}-form';

export function Create{{Entity}}Form() {
  const router = useRouter();
  const create = useCreate{{Entity}}();
  const keyRef = useRef(crypto.randomUUID());

  const form = useForm<Create{{Entity}}FormInput, unknown, Create{{Entity}}FormValues>({
    resolver: zodResolver(create{{Entity}}FormSchema),
    defaultValues: { /* every field, e.g. name: '' */ } as Create{{Entity}}FormInput,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
  useUnsavedChangesGuard(form.formState.isDirty && !form.formState.isSubmitSuccessful);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const created = await create.mutateAsync({ input: toCreate{{Entity}}Input(values), idempotencyKey: keyRef.current });
      keyRef.current = crypto.randomUUID();
      router.push(routes.{{entity}}(created.id));
    } catch (e) {
      if (!applyProblemToForm(e, form.setError)) toast.error(messages.createFailed);
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField control={form.control} name={'name' as never} label="Name">
          {({ field }) => <Input {...field} autoComplete="off" />}
        </FormField>
        <FormRootError />
        <Button type="submit" loading={form.formState.isSubmitting}>{messages.form.submit}</Button>
      </form>
    </Form>
  );
}
