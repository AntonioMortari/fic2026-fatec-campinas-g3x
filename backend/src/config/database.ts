import { Sequelize } from 'sequelize';
import { env } from './env';

export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  timezone: '+00:00',
  logging: env.NODE_ENV === 'development' ? (sql) => console.debug(sql) : false,
  define: {
    underscored: true,
    timestamps: true,
  },
});
