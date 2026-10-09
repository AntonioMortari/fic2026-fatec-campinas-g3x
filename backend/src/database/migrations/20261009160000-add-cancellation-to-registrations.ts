import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  // A sign-up is cancelled, never deleted: the row stays as a record and only stops counting.
  await queryInterface.addColumn('registrations', 'cancelled_at', { type: DataTypes.DATE, allowNull: true });

  // The personal link that cancels one sign-up. Rows that already exist get theirs before the column turns mandatory.
  await queryInterface.addColumn('registrations', 'cancel_code', { type: DataTypes.UUID, allowNull: true });
  await queryInterface.sequelize.query('UPDATE registrations SET cancel_code = UUID() WHERE cancel_code IS NULL');
  await queryInterface.changeColumn('registrations', 'cancel_code', { type: DataTypes.UUID, allowNull: false });
  await queryInterface.addIndex('registrations', ['cancel_code'], { name: 'registrations_cancel_code_unique', unique: true });

  // Cancelling must free the person to sign up again. The old unique index (event, e-mail, name) would refuse it, so
  // the key gets a column that is 1 while the sign-up is alive and NULL once cancelled: MySQL lets NULLs repeat.
  await queryInterface.sequelize.query(
    'ALTER TABLE registrations ADD COLUMN active_key TINYINT GENERATED ALWAYS AS (IF(cancelled_at IS NULL, 1, NULL)) VIRTUAL',
  );
  // The new key goes in before the old one goes out: the foreign key on event_id needs an index that starts with it.
  await queryInterface.addIndex('registrations', ['event_id', 'email', 'name', 'active_key'], {
    name: 'registrations_event_email_name_active_unique',
    unique: true,
  });
  await queryInterface.removeIndex('registrations', 'registrations_event_email_name_unique');
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addIndex('registrations', ['event_id', 'email', 'name'], { name: 'registrations_event_email_name_unique', unique: true });
  await queryInterface.removeIndex('registrations', 'registrations_event_email_name_active_unique');
  await queryInterface.sequelize.query('ALTER TABLE registrations DROP COLUMN active_key');
  await queryInterface.removeIndex('registrations', 'registrations_cancel_code_unique');
  await queryInterface.removeColumn('registrations', 'cancel_code');
  await queryInterface.removeColumn('registrations', 'cancelled_at');
};
