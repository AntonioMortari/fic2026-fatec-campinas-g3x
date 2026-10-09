import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('events', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(80), allowNull: true },
    starts_at: { type: DataTypes.DATE, allowNull: false },
    ends_at: { type: DataTypes.DATE, allowNull: true },
    location: { type: DataTypes.STRING(200), allowNull: true },
    age_range: { type: DataTypes.STRING(80), allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: true },
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('events', ['published', 'starts_at'], { name: 'events_published_starts_at_idx' });
  await queryInterface.sequelize.query('ALTER TABLE events ADD CONSTRAINT events_capacity_positive CHECK (capacity IS NULL OR capacity > 0)');
  await queryInterface.sequelize.query('ALTER TABLE events ADD CONSTRAINT events_ends_after_start CHECK (ends_at IS NULL OR ends_at > starts_at)');
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('events');
};
