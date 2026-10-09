import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

export class Registration extends Model<InferAttributes<Registration>, InferCreationAttributes<Registration>> {
  declare id: CreationOptional<string>;
  declare eventId: string;
  declare userId: string | null;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare cpf: string | null;
  declare isMinor: boolean;
  declare guardianName: string | null;
  declare guardianPhone: string | null;
  declare imageAuthorized: boolean;
  declare consentedAt: Date;
  declare createdAt: CreationOptional<Date>;
}

Registration.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    eventId: { type: DataTypes.UUID, allowNull: false },
    userId: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false },
    phone: { type: DataTypes.STRING(11), allowNull: true },
    cpf: { type: DataTypes.CHAR(11), allowNull: true },
    isMinor: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    guardianName: { type: DataTypes.STRING(120), allowNull: true },
    guardianPhone: { type: DataTypes.STRING(11), allowNull: true },
    imageAuthorized: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    consentedAt: { type: DataTypes.DATE, allowNull: false },
    createdAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'registrations', updatedAt: false },
);
