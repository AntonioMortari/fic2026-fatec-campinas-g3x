import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

export class FaqTheme extends Model<InferAttributes<FaqTheme>, InferCreationAttributes<FaqTheme>> {
  declare id: string;
  declare name: string;
  declare sortOrder: number;
  declare published: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

FaqTheme.init(
  {
    id: { type: DataTypes.STRING(60), primaryKey: true },
    name: { type: DataTypes.STRING(40), allowNull: false },
    sortOrder: { type: DataTypes.SMALLINT, allowNull: false },
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, tableName: 'faq_themes' },
);
