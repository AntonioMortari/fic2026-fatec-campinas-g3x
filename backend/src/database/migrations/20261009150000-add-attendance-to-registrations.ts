import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  // Three states, on purpose: NULL = nobody checked, 1 = came, 0 = did not come. A list nobody checked
  // must not read as a list of absences.
  await queryInterface.addColumn('registrations', 'attended', { type: DataTypes.BOOLEAN, allowNull: true });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeColumn('registrations', 'attended');
};
