import { DEV_ACCOUNTS, DEV_PASSWORD, assertSafeToSeed, seedDevAccounts } from '../src/database/seed';
import { User } from '../src/models';
import { verifyPassword } from '../src/utils/password';

const LOCAL = { NODE_ENV: 'development', DB_HOST: 'db' } as const;
const NOW = new Date('2026-10-09T12:00:00Z');

afterEach(() => jest.restoreAllMocks());

describe('the development seed refuses to run where it could do harm', () => {
  it.each([
    ['production, even against a local host', { NODE_ENV: 'production', DB_HOST: 'localhost' }],
    ['a remote host, even in development', { NODE_ENV: 'development', DB_HOST: 'banco-gerenciado.exemplo.com' }],
    ['a host that only contains "localhost"', { NODE_ENV: 'development', DB_HOST: 'localhost.exemplo.com' }],
    ['a private address that is not this machine', { NODE_ENV: 'development', DB_HOST: '10.0.0.5' }],
  ] as const)('refuses %s, before touching the database', async (_label, config) => {
    const find = jest.spyOn(User, 'findOne');
    const create = jest.spyOn(User, 'create');

    await expect(seedDevAccounts(config, NOW)).rejects.toThrow();
    expect(find).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it.each(['localhost', '127.0.0.1', '::1', 'db'])('accepts the local host %s', (host) => {
    expect(() => assertSafeToSeed({ NODE_ENV: 'development', DB_HOST: host })).not.toThrow();
    expect(() => assertSafeToSeed({ NODE_ENV: 'test', DB_HOST: host })).not.toThrow();
  });

  it('says why when it refuses', () => {
    expect(() => assertSafeToSeed({ NODE_ENV: 'production', DB_HOST: 'db' })).toThrow(/produção/);
    expect(() => assertSafeToSeed({ NODE_ENV: 'development', DB_HOST: 'x.com' })).toThrow(/banco local/);
  });
});

describe('the development accounts', () => {
  it('are one staff and one ordinary account, with fixed addresses that pass the login validation', () => {
    expect(DEV_ACCOUNTS.map((account) => [account.email, account.isStaff])).toEqual([
      ['admin@atelie.local', true],
      ['usuario@atelie.local', false],
    ]);
  });

  it('are created with a bcrypt hash of the known password, never the password itself', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const create = jest.spyOn(User, 'create').mockResolvedValue({} as User);

    await seedDevAccounts(LOCAL, NOW);

    expect(create).toHaveBeenCalledTimes(2);
    for (const [row] of create.mock.calls) {
      const { passwordHash } = row as { passwordHash: string };
      expect(passwordHash).toMatch(/^\$2[aby]\$12\$.{53}$/);
      expect(passwordHash).not.toContain(DEV_PASSWORD);
      expect(await verifyPassword(DEV_PASSWORD, passwordHash)).toBe(true);
    }
  });

  it('grant staff to the admin and only the admin, and record age and consent as dates', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const create = jest.spyOn(User, 'create').mockResolvedValue({} as User);

    await seedDevAccounts(LOCAL, NOW);

    const rows = create.mock.calls.map(([row]) => row as { email: string; isStaff: boolean; adultConfirmedAt: Date; consentedAt: Date });
    expect(rows.map((row) => [row.email, row.isStaff])).toEqual([
      ['admin@atelie.local', true],
      ['usuario@atelie.local', false],
    ]);
    for (const row of rows) {
      expect(row.adultConfirmedAt).toEqual(NOW);
      expect(row.consentedAt).toEqual(NOW);
    }
  });

  it('are updated, not duplicated, when they already exist, and the roles are put back', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(User, 'findOne').mockResolvedValue({ update } as unknown as User);
    const create = jest.spyOn(User, 'create');

    await seedDevAccounts(LOCAL, NOW);

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledTimes(2);
    expect(update.mock.calls.map(([columns]) => (columns as { isStaff: boolean }).isStaff)).toEqual([true, false]);
  });

  it('look accounts up by e-mail only, so no real person is touched', async () => {
    const find = jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User, 'create').mockResolvedValue({} as User);

    await seedDevAccounts(LOCAL, NOW);

    expect(find.mock.calls.map(([options]) => options)).toEqual([{ where: { email: 'admin@atelie.local' } }, { where: { email: 'usuario@atelie.local' } }]);
  });
});
