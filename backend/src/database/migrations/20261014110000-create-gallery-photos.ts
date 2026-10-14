import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('gallery_photos', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    album: { type: DataTypes.STRING(120), allowNull: false },
    alt: { type: DataTypes.STRING(300), allowNull: false },
    caption: { type: DataTypes.STRING(300), allowNull: true },
    image_file: { type: DataTypes.STRING(60), allowNull: false },
    image_mime: { type: DataTypes.STRING(20), allowNull: false },
    image_updated_at: { type: DataTypes.DATE(3), allowNull: false },
    authorized_at: { type: DataTypes.DATE, allowNull: true },
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    published_at: { type: DataTypes.DATE(3), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('gallery_photos', ['published', 'published_at'], { name: 'gallery_photos_published_idx' });
  await queryInterface.sequelize.query(`
    ALTER TABLE gallery_photos ADD CONSTRAINT gallery_photos_image_valid CHECK (
      image_file REGEXP '^[0-9a-f-]{36}[.](jpg|png|gif|webp)$'
      AND image_mime IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp')
      AND CHAR_LENGTH(TRIM(alt)) > 0
      AND CHAR_LENGTH(TRIM(album)) > 0
    )
  `);
  await queryInterface.sequelize.query(`
    ALTER TABLE gallery_photos ADD CONSTRAINT gallery_photos_published_needs_authorization CHECK (
      published = 0 OR authorized_at IS NOT NULL
    )
  `);
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('gallery_photos');
};
