import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

export type PersonType = 'individual' | 'organization';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare personType: PersonType;
  declare passwordHash: string;
  declare wantsToVolunteer: boolean;
  declare wantsToDonate: boolean;
  declare isStaff: CreationOptional<boolean>;
  declare adultConfirmedAt: Date;
  declare consentedAt: Date;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(11), allowNull: true },
    personType: { type: DataTypes.ENUM('individual', 'organization'), allowNull: false },
    passwordHash: { type: DataTypes.STRING(72), allowNull: false },
    wantsToVolunteer: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    wantsToDonate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    isStaff: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    adultConfirmedAt: { type: DataTypes.DATE, allowNull: false },
    consentedAt: { type: DataTypes.DATE, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'users' },
);
