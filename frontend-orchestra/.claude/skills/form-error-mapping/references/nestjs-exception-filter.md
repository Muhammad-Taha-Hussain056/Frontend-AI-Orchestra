# NestJS exception filter (for the backend repo)

Rules the backend must follow so the frontend mapping works:
- Every error response is `application/problem+json` with `type`, `title`, `status`; add `code`, `traceId`, `errors` where relevant.
- Validation failures use status 422 (or 400, pick one project-wide) with `errors` keyed by dot path (`items.0.sku`).
- `traceId` equals the request id propagated from the BFF (`x-request-id`).
- 5xx never leaks internals in `detail`.
- Keep the shape identical to `problemDetailsSchema` in `@scope/contracts`; validate in tests with that schema.

Reference sketch (adapt to the adapter and validation library in use; verify Nest APIs against the installed version):

```ts
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const req = host.switchToHttp().getRequest();
    const traceId = req.headers['x-request-id'] ?? randomUUID();

    let status = 500, title = 'Internal Server Error', code: string | undefined, errors: Record<string, string[]> | undefined;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as any;
      title = typeof body === 'string' ? body : body.error ?? exception.message;
      code = body.code;
      errors = body.errors;               // produced by the validation pipe, converted to dot paths
    }
    res.status(status).type('application/problem+json').send({ type: 'about:blank', title, status, code, traceId, instance: req.url, errors });
  }
}
```
