import { DataTypes } from 'sequelize';
import type { Migration } from '../migrate';
import { FAQ_INITIAL_ITEMS, FAQ_INITIAL_THEMES } from '../faq-initial';

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('faq_themes', {
    id: { type: DataTypes.STRING(60), primaryKey: true },
    name: { type: DataTypes.STRING(40), allowNull: false },
    sort_order: { type: DataTypes.SMALLINT, allowNull: false },
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  // The collation ignores case and accents: "Seus dados" and "seus dados" are the same theme.
  await queryInterface.sequelize.query('ALTER TABLE faq_themes MODIFY name VARCHAR(40) COLLATE utf8mb4_0900_ai_ci NOT NULL, ADD UNIQUE INDEX faq_themes_name_uq (name)');

  await queryInterface.createTable('faq_items', {
    id: { type: DataTypes.STRING(60), primaryKey: true },
    theme_id: { type: DataTypes.STRING(60), allowNull: false, references: { model: 'faq_themes', key: 'id' }, onDelete: 'RESTRICT' },
    question: { type: DataTypes.STRING(200), allowNull: false },
    answer: { type: DataTypes.TEXT, allowNull: false },
    link_to: { type: DataTypes.STRING(40), allowNull: true },
    source: { type: DataTypes.STRING(40), allowNull: false },
    sort_order: { type: DataTypes.SMALLINT, allowNull: false },
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });
  await queryInterface.addIndex('faq_items', ['theme_id', 'sort_order'], { name: 'faq_items_theme_order_idx' });

  const now = new Date();
  await queryInterface.bulkInsert(
    'faq_themes',
    FAQ_INITIAL_THEMES.map((theme, index) => ({ id: theme.id, name: theme.name, sort_order: index + 1, published: true, created_at: now, updated_at: now })),
  );
  const perTheme = new Map<string, number>();
  await queryInterface.bulkInsert(
    'faq_items',
    FAQ_INITIAL_ITEMS.map((item) => {
      const position = (perTheme.get(item.theme) ?? 0) + 1;
      perTheme.set(item.theme, position);
      return { id: item.id, theme_id: item.theme, question: item.question, answer: item.answer, link_to: item.link, source: item.source, sort_order: position, published: true, created_at: now, updated_at: now };
    }),
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('faq_items');
  await queryInterface.dropTable('faq_themes');
};
