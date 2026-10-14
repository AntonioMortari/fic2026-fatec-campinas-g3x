import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

export class GalleryPhoto extends Model<InferAttributes<GalleryPhoto>, InferCreationAttributes<GalleryPhoto>> {
  declare id: CreationOptional<string>;
  declare album: string;
  declare alt: string;
  declare caption: string | null;
  declare imageFile: string;
  declare imageMime: string;
  declare imageUpdatedAt: Date;
  declare authorizedAt: CreationOptional<Date | null>;
  declare published: CreationOptional<boolean>;
  declare publishedAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

GalleryPhoto.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    album: { type: DataTypes.STRING(120), allowNull: false },
    alt: { type: DataTypes.STRING(300), allowNull: false },
    caption: { type: DataTypes.STRING(300), allowNull: true },
    imageFile: { type: DataTypes.STRING(60), allowNull: false },
    imageMime: { type: DataTypes.STRING(20), allowNull: false },
    imageUpdatedAt: { type: DataTypes.DATE(3), allowNull: false },
    authorizedAt: { type: DataTypes.DATE, allowNull: true },
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    publishedAt: { type: DataTypes.DATE(3), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'gallery_photos' },
);
