import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addColumn('contacts', 'status', {
    type: DataTypes.ENUM('new', 'in_contact', 'done'),
    allowNull: false,
    defaultValue: 'new',
  });
  await queryInterface.addColumn('contacts', 'staff_note', { type: DataTypes.TEXT, allowNull: true });
  await queryInterface.addIndex('contacts', ['status', 'created_at'], { name: 'contacts_status_created_idx' });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.removeIndex('contacts', 'contacts_status_created_idx');
  await queryInterface.removeColumn('contacts', 'staff_note');
  await queryInterface.removeColumn('contacts', 'status');
};
