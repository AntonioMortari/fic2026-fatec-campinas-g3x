import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addColumn('events', 'requires_cpf', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn('events', 'requires_cpf');
};
