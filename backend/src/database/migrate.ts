import path from 'node:path';
import { SequelizeStorage, Umzug } from 'umzug';
import { sequelize } from '../config/database';

export const migrator = new Umzug({
  migrations: { glob: path.join(__dirname, 'migrations', '*.{ts,js}').replaceAll('\\', '/') },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

export type Migration = typeof migrator._types.migration;

if (require.main === module) {
  const run = process.argv[2] === 'down' ? migrator.down() : migrator.up();
  run
    .then(() => sequelize.close())
    .catch(async (error) => {
      console.error(error);
      await sequelize.close();
      process.exit(1);
    });
}
