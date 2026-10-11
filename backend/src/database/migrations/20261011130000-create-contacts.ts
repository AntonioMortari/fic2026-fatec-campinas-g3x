import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('contacts', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false },
    phone: { type: DataTypes.STRING(11), allowNull: true },
    institution: { type: DataTypes.STRING(160), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: false },
    consented_at: { type: DataTypes.DATE, allowNull: false },
    origin_hash: { type: DataTypes.CHAR(64), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('contacts', ['origin_hash', 'created_at'], { name: 'contacts_origin_created_idx' });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('contacts');
};
