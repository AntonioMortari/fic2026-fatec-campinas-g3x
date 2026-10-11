import { DataTypes, Model, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

export class VolunteerArea extends Model<InferAttributes<VolunteerArea>, InferCreationAttributes<VolunteerArea>> {
  declare id: string;
  declare name: string;
  declare description: string;
  declare sortOrder: number;
}

VolunteerArea.init(
  {
    id: { type: DataTypes.STRING(40), primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
    sortOrder: { type: DataTypes.SMALLINT, allowNull: false },
  },
  { sequelize, tableName: 'volunteer_areas', timestamps: false },
);
