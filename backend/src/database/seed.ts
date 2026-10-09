import { env, type Env } from '../config/env';
import { sequelize, User } from '../models';
import { hashPassword } from '../utils/password';

export const DEV_PASSWORD = 'senha-dev-123';

export const DEV_ACCOUNTS = [
  { name: 'Admin de teste', email: 'admin@atelie.local', isStaff: true },
  { name: 'Usuário de teste', email: 'usuario@atelie.local', isStaff: false },
] as const;

// "db" is the compose service. Any other host is somebody else's database.
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', 'db'];

type SeedConfig = Pick<Env, 'NODE_ENV' | 'DB_HOST'>;

// Accounts with a password written in the repository must never reach a real database, so this refuses both
// by environment and by host: a developer with NODE_ENV=development and the production host in .env is still stopped.
export function assertSafeToSeed({ NODE_ENV, DB_HOST }: SeedConfig): void {
  if (NODE_ENV === 'production') {
    throw new Error('A seed de desenvolvimento não roda em produção: ela cria contas com senha conhecida.');
  }
  if (!LOCAL_HOSTS.includes(DB_HOST)) {
    throw new Error(`A seed de desenvolvimento só roda em banco local (${LOCAL_HOSTS.join(', ')}); DB_HOST é "${DB_HOST}".`);
  }
}

export async function seedDevAccounts(config: SeedConfig = env, now: Date = new Date()): Promise<void> {
  assertSafeToSeed(config);
  const passwordHash = await hashPassword(DEV_PASSWORD);

  for (const account of DEV_ACCOUNTS) {
    // Every column is listed by hand, as in registration. isStaff is written here and only here: the one place the
    // role is granted without SQL is the seed, and only for the account that is meant to be staff.
    const columns = {
      name: account.name,
      phone: null,
      personType: 'individual' as const,
      passwordHash,
      wantsToVolunteer: true,
      wantsToDonate: true,
      isStaff: account.isStaff,
    };
    const existing = await User.findOne({ where: { email: account.email } });
    if (existing) {
      await existing.update(columns);
    } else {
      await User.create({ ...columns, email: account.email, adultConfirmedAt: now, consentedAt: now });
    }
  }
}

if (require.main === module) {
  seedDevAccounts()
    .then(() => {
      console.log('[seed] contas de teste prontas (senha de todas: %s)', DEV_PASSWORD);
      for (const account of DEV_ACCOUNTS) {
        console.log('[seed]   %s  %s', account.isStaff ? 'equipe' : 'comum ', account.email);
      }
      return sequelize.close();
    })
    .catch(async (error: unknown) => {
      console.error('[seed]', error instanceof Error ? error.message : error);
      await sequelize.close();
      process.exit(1);
    });
}
