import { problemDetailsSchema, type ProblemDetails } from '{{scope}}/contracts';

export class ProblemError extends Error {
  constructor(public readonly problem: ProblemDetails) { super(problem.title); this.name = 'ProblemError'; }
  get status() { return this.problem.status; }
  static async fromResponse(res: Response): Promise<ProblemError> {
    const parsed = problemDetailsSchema.safeParse(await res.json().catch(() => null));
    return new ProblemError(parsed.success ? parsed.data : { type: 'about:blank', title: res.statusText || 'Request failed', status: res.status });
  }
}
