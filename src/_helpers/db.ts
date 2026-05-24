// src/_helpers/db.ts
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

export interface Database {
  User: any;
  Account: any;
  RefreshToken: any;
}

export const db: Database = {} as Database;

export async function initialize(): Promise<void> {
  const host     = process.env.DB_HOST || 'localhost';
  const port     = parseInt(process.env.DB_PORT || '3306');
  const user     = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'root1234';
  const database = process.env.DB_NAME || 'typescript_crud_api';

  // Create database if it doesn't exist
  const connection = await mysql.createConnection({ host, port, user, password });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();

  // Connect with Sequelize
  const sequelize = new Sequelize(database, user, password, {
    host,
    dialect: 'mysql',
    port,
    logging: false,
    dialectOptions: {
      connectTimeout: 60000
    }
  });

  // Initialize models
  const { default: accountModel } = await import('../accounts/account.model');
  const { default: refreshTokenModel } = await import('../accounts/refresh-token.model');

  db.Account = accountModel(sequelize);
  db.RefreshToken = refreshTokenModel(sequelize);

  // Associations
  db.Account.hasMany(db.RefreshToken, {
    foreignKey: 'accountId',
    onDelete: 'CASCADE'
  });
  db.RefreshToken.belongsTo(db.Account, {
    foreignKey: 'accountId'
  });

  await sequelize.sync({ alter: true });
  console.log('✅ Database initialized and models synced');
}