import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

export const NEWS_KINDS = ['news', 'campaign'] as const;
export type NewsKind = (typeof NEWS_KINDS)[number];

export class News extends Model<InferAttributes<News>, InferCreationAttributes<News>> {
  declare id: CreationOptional<string>;
  declare kind: CreationOptional<NewsKind>;
  declare title: string;
  declare summary: string | null;
  declare body: string;
  declare published: CreationOptional<boolean>;
  declare publishedAt: CreationOptional<Date | null>;
  declare imageFile: CreationOptional<string | null>;
  declare imageMime: CreationOptional<string | null>;
  declare imageAlt: CreationOptional<string | null>;
  declare imageAuthorizedAt: CreationOptional<Date | null>;
  declare imageUpdatedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

News.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    kind: { type: DataTypes.ENUM(...NEWS_KINDS), allowNull: false, defaultValue: 'news' },
    title: { type: DataTypes.STRING(200), allowNull: false },
    summary: { type: DataTypes.STRING(500), allowNull: true },
    body: { type: DataTypes.TEXT, allowNull: false },
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    publishedAt: { type: DataTypes.DATE(3), allowNull: true },
    imageFile: { type: DataTypes.STRING(60), allowNull: true },
    imageMime: { type: DataTypes.STRING(20), allowNull: true },
    imageAlt: { type: DataTypes.STRING(300), allowNull: true },
    imageAuthorizedAt: { type: DataTypes.DATE, allowNull: true },
    imageUpdatedAt: { type: DataTypes.DATE(3), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'news' },
);
