import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes, type NonAttribute } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './user.model';
import { VolunteerApplicationArea } from './volunteer-application-area.model';
import { VolunteerArea } from './volunteer-area.model';

export const VOLUNTEER_STATUSES = ['new', 'in_contact', 'volunteering', 'ended'] as const;
export type VolunteerStatus = (typeof VOLUNTEER_STATUSES)[number];

export class VolunteerApplication extends Model<InferAttributes<VolunteerApplication>, InferCreationAttributes<VolunteerApplication>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare status: CreationOptional<VolunteerStatus>;
  declare message: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare user?: NonAttribute<User>;
  declare areas?: NonAttribute<VolunteerArea[]>;
}

VolunteerApplication.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    status: { type: DataTypes.ENUM(...VOLUNTEER_STATUSES), allowNull: false, defaultValue: 'new' },
    message: { type: DataTypes.STRING(2000), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'volunteer_applications' },
);

VolunteerApplication.belongsTo(User, { foreignKey: 'userId', as: 'user' });
VolunteerApplication.belongsToMany(VolunteerArea, {
  through: VolunteerApplicationArea,
  foreignKey: 'applicationId',
  otherKey: 'areaId',
  as: 'areas',
});
