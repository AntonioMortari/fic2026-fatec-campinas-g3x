import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.addColumn('events', 'registration_on_site', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });

  await queryInterface.addColumn('events', 'image_data', { type: DataTypes.BLOB('medium'), allowNull: true });
  await queryInterface.addColumn('events', 'image_mime', { type: DataTypes.STRING(20), allowNull: true });
  await queryInterface.addColumn('events', 'image_alt', { type: DataTypes.STRING(300), allowNull: true });
  await queryInterface.addColumn('events', 'image_authorized_at', { type: DataTypes.DATE, allowNull: true });
  await queryInterface.addColumn('events', 'image_updated_at', { type: DataTypes.DATE(3), allowNull: true });

  await queryInterface.sequelize.query(`
    ALTER TABLE events ADD CONSTRAINT events_image_all_or_nothing CHECK (
      (image_data IS NULL AND image_mime IS NULL AND image_alt IS NULL AND image_authorized_at IS NULL AND image_updated_at IS NULL)
      OR (image_data IS NOT NULL AND image_mime IS NOT NULL AND image_mime IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp')
          AND image_alt IS NOT NULL AND CHAR_LENGTH(TRIM(image_alt)) > 0
          AND image_authorized_at IS NOT NULL AND image_updated_at IS NOT NULL)
    )
  `);
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.sequelize.query('ALTER TABLE events DROP CHECK events_image_all_or_nothing');
  await queryInterface.removeColumn('events', 'image_updated_at');
  await queryInterface.removeColumn('events', 'image_authorized_at');
  await queryInterface.removeColumn('events', 'image_alt');
  await queryInterface.removeColumn('events', 'image_mime');
  await queryInterface.removeColumn('events', 'image_data');
  await queryInterface.removeColumn('events', 'registration_on_site');
};
