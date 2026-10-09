import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('registrations', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    // RESTRICT, not CASCADE: an event with sign-ups cannot be removed by accident, and the list of who signed up is a record.
    event_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'events', key: 'id' }, onDelete: 'RESTRICT' },
    // Null for someone who signed up without an account. The account may go away without taking the sign-up with it.
    user_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false },
    phone: { type: DataTypes.STRING(11), allowNull: true },
    cpf: { type: DataTypes.CHAR(11), allowNull: true },
    is_minor: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    guardian_name: { type: DataTypes.STRING(120), allowNull: true },
    guardian_phone: { type: DataTypes.STRING(11), allowNull: true },
    image_authorized: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    consented_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
  });

  // The collation ignores case and accents: "Ana Souza" and "ana souza" are the same person at the same address.
  await queryInterface.addIndex('registrations', ['event_id', 'email', 'name'], {
    name: 'registrations_event_email_name_unique',
    unique: true,
  });
  await queryInterface.addIndex('registrations', ['user_id'], { name: 'registrations_user_id_idx' });

  await queryInterface.sequelize.query(
    `ALTER TABLE registrations ADD CONSTRAINT registrations_guardian_for_minor CHECK (
      NOT is_minor OR (
        guardian_name IS NOT NULL AND CHAR_LENGTH(TRIM(guardian_name)) > 0
        AND guardian_phone IS NOT NULL AND CHAR_LENGTH(TRIM(guardian_phone)) > 0
      )
    )`,
  );
  await queryInterface.sequelize.query(`ALTER TABLE registrations ADD CONSTRAINT registrations_cpf_digits CHECK (cpf IS NULL OR cpf REGEXP '^[0-9]{11}$')`);
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('registrations');
};
