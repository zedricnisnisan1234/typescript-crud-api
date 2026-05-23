// src/_helpers/db.ts
import config from '../../config.json';
import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';

export interface Database {
  User: any;
  Account: any;
  RefreshToken: any;
}

export const db: Database = {} as Database;

export async function initialize(): Promise<void> {
  const { host, port, user, password, database } = config.database;

  // Create database if it doesn't exist
  const connection = await mysql.createConnection({ host, port, user, password });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();

  // Connect to database with Sequelize
  const sequelize = new Sequelize(database, user, password, {
    host,
    dialect: 'mysql',
    port,
    logging: false
  });

  // Initialize models
  const { default: accountModel } = await import('../accounts/account.model');
  const { default: refreshTokenModel } = await import('../accounts/refresh-token.model');

  db.Account = accountModel(sequelize);
  db.RefreshToken = refreshTokenModel(sequelize);

  // Define associations
  db.Account.hasMany(db.RefreshToken, { 
    foreignKey: 'accountId',
    onDelete: 'CASCADE' 
  });
  db.RefreshToken.belongsTo(db.Account, {
    foreignKey: 'accountId'
  });

  // Sync models with database
  await sequelize.sync({ alter: true });

  console.log('✅ Database initialized and models synced');
}