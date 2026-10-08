import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    /** Preenchido por `autenticar` quando o JWT é válido. */
    usuario?: { id: string };
  }
}
