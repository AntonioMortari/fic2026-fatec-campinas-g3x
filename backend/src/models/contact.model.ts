import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

export class Contact extends Model<InferAttributes<Contact>, InferCreationAttributes<Contact>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare institution: string | null;
  declare message: string;
  declare consentedAt: Date;
  declare originHash: string | null;
  declare createdAt: CreationOptional<Date>;
}

Contact.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false },
    phone: { type: DataTypes.STRING(11), allowNull: true },
    institution: { type: DataTypes.STRING(160), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: false },
    consentedAt: { type: DataTypes.DATE, allowNull: false },
    originHash: { type: DataTypes.CHAR(64), allowNull: true },
    createdAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'contacts', updatedAt: false },
);
