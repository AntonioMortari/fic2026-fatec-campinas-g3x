import { sequelize } from '../config/database';

/**
 * Registro central dos models do Sequelize (RNF-BE-02).
 *
 * Cada model novo é importado aqui e, se tiver associações, elas são
 * declaradas aqui também — num lugar só, depois de todos os models existirem.
 * As tabelas são criadas pelas migrations de `src/database/migrations/`,
 * nunca por `sequelize.sync()`.
 */
export { sequelize };
