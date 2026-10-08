import { Sequelize } from 'sequelize';
import { ambiente } from './env';

/**
 * Conexão única com o MySQL (RNF-BE-02). Os models se registram nesta
 * instância em `src/models/index.ts`.
 */
export const sequelize = new Sequelize(ambiente.DB_NOME, ambiente.DB_USUARIO, ambiente.DB_SENHA, {
  host: ambiente.DB_HOST,
  port: ambiente.DB_PORTA,
  dialect: 'mysql',
  timezone: '+00:00',
  logging: ambiente.NODE_ENV === 'development' ? (sql) => console.debug(sql) : false,
  define: {
    underscored: true,
    timestamps: true,
  },
});
