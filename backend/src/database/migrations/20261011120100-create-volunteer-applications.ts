import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('volunteer_applications', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    status: { type: DataTypes.ENUM('new', 'in_contact', 'volunteering', 'ended'), allowNull: false, defaultValue: 'new' },
    message: { type: DataTypes.STRING(2000), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.sequelize.query(
    "ALTER TABLE volunteer_applications ADD COLUMN active_key TINYINT GENERATED ALWAYS AS (IF(status = 'ended', NULL, 1)) VIRTUAL",
  );
  await queryInterface.addIndex('volunteer_applications', ['user_id', 'active_key'], {
    name: 'volunteer_applications_user_active_unique',
    unique: true,
  });
  await queryInterface.addIndex('volunteer_applications', ['status', 'created_at'], { name: 'volunteer_applications_status_created_idx' });

  await queryInterface.createTable('volunteer_application_areas', {
    application_id: { type: DataTypes.UUID, allowNull: false, primaryKey: true, references: { model: 'volunteer_applications', key: 'id' }, onDelete: 'CASCADE' },
    area_id: { type: DataTypes.STRING(40), allowNull: false, primaryKey: true, references: { model: 'volunteer_areas', key: 'id' }, onDelete: 'RESTRICT' },
  });
  await queryInterface.addIndex('volunteer_application_areas', ['area_id'], { name: 'volunteer_application_areas_area_idx' });
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('volunteer_application_areas');
  await queryInterface.dropTable('volunteer_applications');
};
