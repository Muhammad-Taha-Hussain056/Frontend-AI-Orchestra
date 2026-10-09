'use client';
import { Controller, FormProvider, useFormContext, type ControllerProps, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { useId } from 'react';
import { cn } from './cn';

// Form = FormProvider alias so features never import react-hook-form providers directly from the app layer.
export function Form<T extends FieldValues>(props: UseFormReturn<T> & { children: React.ReactNode }) {
  const { children, ...form } = props;
  return <FormProvider {...(form as UseFormReturn<T>)}>{children}</FormProvider>;
}

type FieldProps<T extends FieldValues, N extends FieldPath<T>> = {
  control: ControllerProps<T, N>['control'];
  name: N;
  label: string;
  description?: string;
  required?: boolean;
  children: (ctx: { field: Parameters<ControllerProps<T, N>['render']>[0]['field'] & { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string } }) => React.ReactElement;
};

export function FormField<T extends FieldValues, N extends FieldPath<T>>({ control, name, label, description, required, children }: FieldProps<T, N>) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const descId = description ? `${id}-desc` : undefined;
        const errId = fieldState.error ? `${id}-err` : undefined;
        return (
          <div className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-medium">{label}{required && <span aria-hidden="true" className="text-destructive"> *</span>}</label>
            {children({ field: { ...field, id, 'aria-invalid': !!fieldState.error, 'aria-describedby': [descId, errId].filter(Boolean).join(' ') || undefined } })}
            {description && <p id={descId} className="text-sm text-muted-foreground">{description}</p>}
            {fieldState.error && <p id={errId} className={cn('text-sm text-destructive')}>{fieldState.error.message}</p>}
          </div>
        );
      }}
    />
  );
}

export function FormRootError() {
  const { formState } = useFormContext();
  const message = (formState.errors.root as { server?: { message?: string } } | undefined)?.server?.message;
  return message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null;
}
