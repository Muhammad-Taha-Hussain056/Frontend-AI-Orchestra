import { z } from 'zod';
import { create{{Entity}}InputSchema, type Create{{Entity}}Input } from '{{scope}}/contracts';

// Derived from the contract. Only add what the inputs actually differ in (see skill form-rhf-zod).
export const create{{Entity}}FormSchema = create{{Entity}}InputSchema.extend({
  // example: quantity: z.number().int().min(1, messages.form.quantityMin),   (import messages from '../messages')
});
export type Create{{Entity}}FormInput = z.input<typeof create{{Entity}}FormSchema>;
export type Create{{Entity}}FormValues = z.output<typeof create{{Entity}}FormSchema>;

// Single mapping point from form values to the API input (identity when shapes match).
export const toCreate{{Entity}}Input = (v: Create{{Entity}}FormValues): Create{{Entity}}Input => v;
