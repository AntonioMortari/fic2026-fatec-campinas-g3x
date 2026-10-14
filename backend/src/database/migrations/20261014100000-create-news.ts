import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('news', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    kind: { type: DataTypes.ENUM('news', 'campaign'), allowNull: false, defaultValue: 'news' },
    title: { type: DataTypes.STRING(200), allowNull: false },
    summary: { type: DataTypes.STRING(500), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    published_at: { type: DataTypes.DATE(3), allowNull: true },
    image_file: { type: DataTypes.STRING(60), allowNull: true },
    image_mime: { type: DataTypes.STRING(20), allowNull: true },
    image_alt: { type: DataTypes.STRING(300), allowNull: true },
    image_authorized_at: { type: DataTypes.DATE, allowNull: true },
    image_updated_at: { type: DataTypes.DATE(3), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('news', ['published', 'published_at'], { name: 'news_published_idx' });
  await queryInterface.sequelize.query(`
    ALTER TABLE news ADD CONSTRAINT news_image_all_or_nothing CHECK (
      (image_file IS NULL AND image_mime IS NULL AND image_alt IS NULL AND image_authorized_at IS NULL AND image_updated_at IS NULL)
      OR (image_file IS NOT NULL AND image_file REGEXP '^[0-9a-f-]{36}[.](jpg|png|gif|webp)$' AND image_mime IS NOT NULL AND image_mime IN ('image/jpeg', 'image/png', 'image/gif', 'image/webp')
          AND image_alt IS NOT NULL AND CHAR_LENGTH(TRIM(image_alt)) > 0
          AND image_authorized_at IS NOT NULL AND image_updated_at IS NOT NULL)
    )
  `);
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('news');
};
