import { createHmac } from 'node:crypto';
import { isIPv6 } from 'node:net';
import type { Request } from 'express';
import { env } from '../config/env';

// An IPv6 address is not one machine: a home connection hands out a whole /64, so limiting per address would let one
// person walk around the limit for free. Keep the first 64 bits.
export function normalizeIp(ip: string): string {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapped) return mapped[1] as string;
  if (!isIPv6(ip)) return ip;

  const [head = '', tail = ''] = ip.split('::');
  const headGroups = head ? head.split(':') : [];
  const tailGroups = tail ? tail.split(':') : [];
  const missing = ip.includes('::') ? 8 - headGroups.length - tailGroups.length : 0;
  const groups = [...headGroups, ...Array<string>(Math.max(missing, 0)).fill('0'), ...tailGroups];
  return `${groups
    .slice(0, 4)
    .map((group) => group.toLowerCase().padStart(4, '0'))
    .join(':')}::/64`;
}

let warned = false;

// The IP itself is never stored: only this keyed hash. It is keyed so that it cannot be undone by hashing every IPv4
// address, which takes minutes; without the secret there is nothing to try.
export function originHash(req: Request): string | null {
  if (env.TRUST_PROXY === 0 && req.headers['x-forwarded-for'] && !warned) {
    warned = true;
    console.warn('[proxy] X-Forwarded-For recebido com TRUST_PROXY=0: atrás de um proxy, todo visitante cai no mesmo limite por conexão. Ajuste TRUST_PROXY.');
  }
  const ip = req.ip;
  if (!ip) return null;
  return createHmac('sha256', env.JWT_SECRET).update(normalizeIp(ip)).digest('hex');
}
