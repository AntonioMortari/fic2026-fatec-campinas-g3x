import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

export class FaqItem extends Model<InferAttributes<FaqItem>, InferCreationAttributes<FaqItem>> {
  declare id: string;
  declare themeId: string;
  declare question: string;
  declare answer: string;
  declare linkTo: string | null;
  declare source: string;
  declare sortOrder: number;
  declare published: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

FaqItem.init(
  {
    id: { type: DataTypes.STRING(60), primaryKey: true },
    themeId: { type: DataTypes.STRING(60), allowNull: false },
    question: { type: DataTypes.STRING(200), allowNull: false },
    answer: { type: DataTypes.TEXT, allowNull: false },
    linkTo: { type: DataTypes.STRING(40), allowNull: true },
    source: { type: DataTypes.STRING(40), allowNull: false },
    sortOrder: { type: DataTypes.SMALLINT, allowNull: false },
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, tableName: 'faq_items' },
);
