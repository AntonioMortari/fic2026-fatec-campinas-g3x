import path from 'node:path';
import { SequelizeStorage, Umzug } from 'umzug';
import { sequelize } from '../config/database';

/**
 * Executor das migrations (RNF-BE-02). Cada arquivo de `migrations/` exporta
 * `up` e `down` e recebe `{ context: QueryInterface }`. A tabela
 * `sequelize_meta` registra o que já rodou.
 *
 *   npm run db:migrate        aplica as pendentes
 *   npm run db:migrate:undo   desfaz a última
 */
export const migrador = new Umzug({
  migrations: { glob: path.join(__dirname, 'migrations', '*.{ts,js}').replaceAll('\\', '/') },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

export type Migracao = typeof migrador._types.migration;

if (require.main === module) {
  const comando = process.argv[2];
  const execucao = comando === 'down' ? migrador.down() : migrador.up();
  execucao
    .then(() => sequelize.close())
    .catch(async (erro) => {
      console.error(erro);
      await sequelize.close();
      process.exit(1);
    });
}
