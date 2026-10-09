import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  // The keyed hash of the connection, never the address. Null for rows that came before the limit existed.
  await queryInterface.addColumn('registrations', 'origin_hash', { type: DataTypes.CHAR(64), allowNull: true });
  await queryInterface.addIndex('registrations', ['origin_hash', 'created_at'], { name: 'registrations_origin_created_idx' });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeIndex('registrations', 'registrations_origin_created_idx');
  await queryInterface.removeColumn('registrations', 'origin_hash');
};
