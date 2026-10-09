import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { ProblemError } from './problem';

/** Returns true when server field errors were applied. Unknown paths land on root.server (<FormRootError />). */
export function applyProblemToForm<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, knownFields?: ReadonlySet<string>): boolean {
  if (!(err instanceof ProblemError) || !err.problem.errors) return false;
  let handled = false;
  for (const [path, msgs] of Object.entries(err.problem.errors)) {
    const known = !knownFields || knownFields.has(path);
    setError((known ? path : 'root.server') as FieldPath<T>, { type: 'server', message: msgs[0] });
    handled = true;
  }
  return handled;
}
