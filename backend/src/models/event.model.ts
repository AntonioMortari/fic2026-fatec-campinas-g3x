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
  declare published: CreationOptional<boolean>;
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
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'events' },
);
