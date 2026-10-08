import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ApiError } from '../utils/api-error';

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    const issues: { location: string; field: string; message: string }[] = [];

    for (const location of ['body', 'query', 'params'] as const) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location]);
      if (!result.success) {
        for (const issue of result.error.issues) {
          issues.push({ location, field: issue.path.join('.'), message: issue.message });
        }
        continue;
      }
      // Express 5 exposes req.query as a getter, so it must be redefined rather than assigned.
      Object.defineProperty(req, location, { value: result.data, writable: true, configurable: true });
    }

    if (issues.length > 0) {
      next(new ApiError(400, 'invalid_data', 'Confira os dados enviados.', issues));
      return;
    }
    next();
  };
}
