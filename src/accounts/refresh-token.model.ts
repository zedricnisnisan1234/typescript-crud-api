// src/accounts/refresh-token.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import type { Sequelize } from 'sequelize';

export interface RefreshTokenAttributes {
  id: number;
  accountId: number;
  token: string;
  expires: Date;
  created: Date;
  createdByIp: string;
  revoked?: Date;
  revokedByIp?: string;
  replacedByToken?: string;
  isExpired?: boolean;
  isActive?: boolean;
}

export interface RefreshTokenCreationAttributes
  extends Optional<RefreshTokenAttributes, 'id' | 'created'> {}

export class RefreshToken
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes {
  public id!: number;
  public accountId!: number;
  public token!: string;
  public expires!: Date;
  public created!: Date;
  public createdByIp!: string;
  public revoked?: Date;
  public revokedByIp?: string;
  public replacedByToken?: string;

  get isExpired(): boolean {
    return new Date() >= this.expires;
  }

  get isActive(): boolean {
    return !this.revoked && !this.isExpired;
  }
}

export default function (sequelize: Sequelize): typeof RefreshToken {
  RefreshToken.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false
      },
      expires: {
        type: DataTypes.DATE,
        allowNull: false
      },
      created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      createdByIp: {
        type: DataTypes.STRING,
        allowNull: false
      },
      revoked: {
        type: DataTypes.DATE
      },
      revokedByIp: {
        type: DataTypes.STRING
      },
      replacedByToken: {
        type: DataTypes.STRING
      },
      isExpired: {
        type: DataTypes.VIRTUAL,
        get() {
          return new Date() >= this.expires;
        }
      },
      isActive: {
        type: DataTypes.VIRTUAL,
        get() {
          return !this.revoked && new Date() < this.expires;
        }
      }
    },
    {
      sequelize,
      modelName: 'RefreshToken',
      tableName: 'refresh_tokens',
      timestamps: false,
      underscored: true
    }
  );
  return RefreshToken;
}