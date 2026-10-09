import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('users', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(11), allowNull: true },
    person_type: { type: DataTypes.ENUM('individual', 'organization'), allowNull: false },
    password_hash: { type: DataTypes.STRING(72), allowNull: false },
    wants_to_volunteer: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    wants_to_donate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_staff: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    adult_confirmed_at: { type: DataTypes.DATE, allowNull: false },
    consented_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('users');
};
