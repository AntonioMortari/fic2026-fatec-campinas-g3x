import { DataTypes, Model, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

export class VolunteerApplicationArea extends Model<InferAttributes<VolunteerApplicationArea>, InferCreationAttributes<VolunteerApplicationArea>> {
  declare applicationId: string;
  declare areaId: string;
}

VolunteerApplicationArea.init(
  {
    applicationId: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
    areaId: { type: DataTypes.STRING(40), allowNull: false, primaryKey: true },
  },
  { sequelize, tableName: 'volunteer_application_areas', timestamps: false },
);
