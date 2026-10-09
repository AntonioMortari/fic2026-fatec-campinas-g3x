import type { Request } from 'express';
import { normalizeIp, originHash } from '../src/utils/origin';

const req = (ip: string | undefined, headers: Record<string, string> = {}) => ({ ip, headers }) as unknown as Request;

describe('normalizeIp', () => {
  it('leaves an IPv4 address alone, and unwraps one carried inside IPv6', () => {
    expect(normalizeIp('203.0.113.7')).toBe('203.0.113.7');
    expect(normalizeIp('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });

  it('keeps the first 64 bits of an IPv6 address, so a whole home connection is one origin', () => {
    expect(normalizeIp('2001:db8:85a3:1234:aaaa:bbbb:cccc:dddd')).toBe('2001:0db8:85a3:1234::/64');
    expect(normalizeIp('2001:db8:85a3:1234:1:2:3:4')).toBe('2001:0db8:85a3:1234::/64');
  });

  it('expands the compressed form before cutting', () => {
    expect(normalizeIp('2001:db8::1')).toBe('2001:0db8:0000:0000::/64');
    expect(normalizeIp('::1')).toBe('0000:0000:0000:0000::/64');
    expect(normalizeIp('2001:DB8:0:0:0:0:0:1')).toBe('2001:0db8:0000:0000::/64');
  });

  it('gives the same origin to two addresses of the same /64 and another to a neighbour', () => {
    expect(normalizeIp('2001:db8:1:1::a')).toBe(normalizeIp('2001:db8:1:1:ffff::b'));
    expect(normalizeIp('2001:db8:1:1::a')).not.toBe(normalizeIp('2001:db8:1:2::a'));
  });
});

describe('originHash', () => {
  it('is a 64-hex keyed hash, stable per address, and does not contain the address', () => {
    const hash = originHash(req('203.0.113.7'))!;

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(originHash(req('203.0.113.7'))).toBe(hash);
    expect(originHash(req('203.0.113.8'))).not.toBe(hash);
    expect(hash).not.toContain('203');
  });

  it('is not the plain SHA-256 of the address: that one can be undone by trying every address', async () => {
    const { createHash } = await import('node:crypto');

    expect(originHash(req('203.0.113.7'))).not.toBe(createHash('sha256').update('203.0.113.7').digest('hex'));
  });

  it('puts the two forms of the same IPv4 address in the same origin', () => {
    expect(originHash(req('::ffff:203.0.113.7'))).toBe(originHash(req('203.0.113.7')));
  });

  it('is null when the address is unknown, so nobody is blamed for it', () => {
    expect(originHash(req(undefined))).toBeNull();
  });
});

describe('the proxy warning', () => {
  function withTrustProxy(value: string, run: (hash: typeof originHash) => void) {
    const previous = process.env.TRUST_PROXY;
    process.env.TRUST_PROXY = value;
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        run((require('../src/utils/origin') as { originHash: typeof originHash }).originHash);
      });
    } finally {
      process.env.TRUST_PROXY = previous;
    }
  }

  it('warns, once, when X-Forwarded-For arrives but no proxy is trusted: everyone would share one limit', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    withTrustProxy('0', (hash) => {
      hash(req('10.0.0.1', { 'x-forwarded-for': '203.0.113.7' }));
      hash(req('10.0.0.1', { 'x-forwarded-for': '203.0.113.8' }));
    });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('TRUST_PROXY');
    warn.mockRestore();
  });

  it('stays quiet when a proxy is trusted, or when there is no forwarding header', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    withTrustProxy('1', (hash) => hash(req('10.0.0.1', { 'x-forwarded-for': '203.0.113.7' })));
    withTrustProxy('0', (hash) => hash(req('203.0.113.7')));

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
