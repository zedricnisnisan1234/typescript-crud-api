// src/accounts/account.model.ts
import { DataTypes, Model, Optional } from 'sequelize';
import type { Sequelize } from 'sequelize';
import { Role } from '../_helpers/role';

export interface AccountAttributes {
  id: number;
  email: string;
  passwordHash: string;
  title: string;
  firstName: string;
  lastName: string;
  role: string;
  verificationToken?: string;
  verified?: Date;
  resetToken?: string;
  resetTokenExpires?: Date;
  passwordReset?: Date;
  created: Date;
  updated?: Date;
  isVerified?: boolean;
}

export interface AccountCreationAttributes
  extends Optional<AccountAttributes, 'id' | 'created'> {}

export class Account
  extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes {
  public id!: number;
  public email!: string;
  public passwordHash!: string;
  public title!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: string;
  public verificationToken?: string;
  public verified?: Date;
  public resetToken?: string;
  public resetTokenExpires?: Date;
  public passwordReset?: Date;
  public created!: Date;
  public updated?: Date;

  get isVerified(): boolean {
    return !!(this.verified || this.passwordReset);
  }
}

export default function (sequelize: Sequelize): typeof Account {
  Account.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: Role.User
      },
      verificationToken: {
        type: DataTypes.STRING
      },
      verified: {
        type: DataTypes.DATE
      },
      resetToken: {
        type: DataTypes.STRING
      },
      resetTokenExpires: {
        type: DataTypes.DATE
      },
      passwordReset: {
        type: DataTypes.DATE
      },
      created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated: {
        type: DataTypes.DATE
      },
      isVerified: {
        type: DataTypes.VIRTUAL,
        get() {
          return !!(this.verified || this.passwordReset);
        }
      }
    },
    {
      sequelize,
      modelName: 'Account',
      tableName: 'accounts',
      timestamps: false,
      defaultScope: {
        attributes: { exclude: ['passwordHash'] }
      },
      scopes: {
        withHash: {
          attributes: { include: ['passwordHash'] }
        }
      }
    }
  );
  return Account;
}