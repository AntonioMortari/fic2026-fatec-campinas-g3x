import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

export class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
  declare id: CreationOptional<string>;
  declare title: string;
  declare description: string | null;
  declare category: string | null;
  declare startsAt: Date;
  declare endsAt: Date | null;
  declare location: string | null;
  declare ageRange: string | null;
  declare capacity: number | null;
  declare requiresCpf: CreationOptional<boolean>;
  declare registrationOnSite: CreationOptional<boolean>;
  declare published: CreationOptional<boolean>;
  declare imageData: CreationOptional<Buffer | null>;
  declare imageMime: CreationOptional<string | null>;
  declare imageAlt: CreationOptional<string | null>;
  declare imageAuthorizedAt: CreationOptional<Date | null>;
  declare imageUpdatedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Event.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(80), allowNull: true },
    startsAt: { type: DataTypes.DATE, allowNull: false },
    endsAt: { type: DataTypes.DATE, allowNull: true },
    location: { type: DataTypes.STRING(200), allowNull: true },
    ageRange: { type: DataTypes.STRING(80), allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: true },
    requiresCpf: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    registrationOnSite: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    imageData: { type: DataTypes.BLOB('medium'), allowNull: true },
    imageMime: { type: DataTypes.STRING(20), allowNull: true },
    imageAlt: { type: DataTypes.STRING(300), allowNull: true },
    imageAuthorizedAt: { type: DataTypes.DATE, allowNull: true },
    imageUpdatedAt: { type: DataTypes.DATE(3), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'events',
    defaultScope: { attributes: { exclude: ['imageData'] } },
  },
);
