// src/accounts/account.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { db } from '../_helpers/db';
import { Role } from '../_helpers/role';
import { sendEmail } from '../_helpers/send-email';
import config from '../../config.json';

export const accountService = {
  authenticate,
  refreshToken,
  revokeToken,
  register,
  verifyEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getAll,
  getById,
  create,
  update,
  delete: _delete
};

// ===== AUTHENTICATE =====
async function authenticate({ email, password, ipAddress }: {
  email: string;
  password: string;
  ipAddress: string;
}) {
  const account = await db.Account.scope('withHash').findOne({ where: { email } });

  if (!account || !account.isVerified ||
      !await bcrypt.compare(password, account.passwordHash)) {
    throw new Error('Email or password is incorrect');
  }

  const jwtToken = generateJwtToken(account);
  const refreshTokenObj = await generateRefreshToken(account, ipAddress);
  await refreshTokenObj.save();

  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: refreshTokenObj.token
  };
}

// ===== REFRESH TOKEN =====
async function refreshToken({ token, ipAddress }: {
  token: string;
  ipAddress: string;
}) {
  const refreshTokenObj = await getRefreshToken(token);
  const account = await refreshTokenObj.getAccount();

  const newRefreshToken = await generateRefreshToken(account, ipAddress);
  refreshTokenObj.revoked = new Date();
  refreshTokenObj.revokedByIp = ipAddress;
  refreshTokenObj.replacedByToken = newRefreshToken.token;
  await refreshTokenObj.save();
  await newRefreshToken.save();

  const jwtToken = generateJwtToken(account);

  return {
    ...basicDetails(account),
    jwtToken,
    refreshToken: newRefreshToken.token
  };
}

// ===== REVOKE TOKEN =====
async function revokeToken({ token, ipAddress }: {
  token: string;
  ipAddress: string;
}) {
  const refreshTokenObj = await getRefreshToken(token);
  refreshTokenObj.revoked = new Date();
  refreshTokenObj.revokedByIp = ipAddress;
  await refreshTokenObj.save();
}

// ===== REGISTER =====
async function register(params: any, origin: string) {
  if (await db.Account.findOne({ where: { email: params.email } })) {
    return await sendAlreadyRegisteredEmail(params.email, origin);
  }

  const account = new db.Account(params);
  const isFirstAccount = (await db.Account.count()) === 0;
  account.role = isFirstAccount ? Role.Admin : Role.User;
  account.verificationToken = randomTokenString();
  account.passwordHash = await bcrypt.hash(params.password, 10);
  await account.save();

  await sendVerificationEmail(account, origin);
}

// ===== VERIFY EMAIL =====
async function verifyEmail({ token }: { token: string }) {
  const account = await db.Account.findOne({
    where: { verificationToken: token }
  });

  if (!account) throw new Error('Verification failed');

  account.verified = new Date();
  account.verificationToken = undefined;
  await account.save();
}

// ===== FORGOT PASSWORD =====
async function forgotPassword({ email }: { email: string }, origin: string) {
  const account = await db.Account.findOne({ where: { email } });
  if (!account) return;

  account.resetToken = randomTokenString();
  account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await account.save();

  await sendPasswordResetEmail(account, origin);
}

// ===== VALIDATE RESET TOKEN =====
async function validateResetToken({ token }: { token: string }) {
  const account = await db.Account.findOne({
    where: {
      resetToken: token,
      resetTokenExpires: { [Op.gt]: new Date() }
    }
  });

  if (!account) throw new Error('Invalid token');
  return account;
}

// ===== RESET PASSWORD =====
async function resetPassword({ token, password }: {
  token: string;
  password: string;
}) {
  const account = await validateResetToken({ token });
  account.passwordHash = await bcrypt.hash(password, 10);
  account.passwordReset = new Date();
  account.resetToken = undefined;
  account.resetTokenExpires = undefined;
  await account.save();
}

// ===== CRUD =====
async function getAll() {
  const accounts = await db.Account.findAll();
  return accounts.map((a: any) => basicDetails(a));
}

async function getById(id: number) {
  const account = await getAccount(id);
  return basicDetails(account);
}

async function create(params: any) {
  if (await db.Account.findOne({ where: { email: params.email } })) {
    throw new Error(`Email "${params.email}" is already registered`);
  }

  const account = new db.Account(params);
  account.verified = new Date();
  account.passwordHash = await bcrypt.hash(params.password, 10);
  await account.save();
  return basicDetails(account);
}

async function update(id: number, params: any) {
  const account = await getAccount(id);

  if (params.email && params.email !== account.email &&
      await db.Account.findOne({ where: { email: params.email } })) {
    throw new Error(`Email "${params.email}" is already registered`);
  }

  if (params.password) {
    params.passwordHash = await bcrypt.hash(params.password, 10);
  }

  Object.assign(account, params);
  account.updated = new Date();
  await account.save();
  return basicDetails(account);
}

async function _delete(id: number) {
  const account = await getAccount(id);
  await account.destroy();
}

// ===== HELPERS =====
async function getAccount(id: number) {
  const account = await db.Account.findByPk(id);
  if (!account) throw new Error('Account not found');
  return account;
}

async function getRefreshToken(token: string) {
  const refreshToken = await db.RefreshToken.findOne({ where: { token } });
  if (!refreshToken || !refreshToken.isActive) throw new Error('Invalid token');
  return refreshToken;
}

function generateJwtToken(account: any) {
  return jwt.sign(
    { sub: account.id, id: account.id },
    config.jwtSecret,
    { expiresIn: '15m' }
  );
}

async function generateRefreshToken(account: any, ipAddress: string) {
  return new db.RefreshToken({
    accountId: account.id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress
  });
}

function randomTokenString() {
  return crypto.randomBytes(40).toString('hex');
}

function basicDetails(account: any) {
  const { id, title, firstName, lastName, email, role, created, updated, isVerified } = account;
  return { id, title, firstName, lastName, email, role, created, updated, isVerified };
}

async function sendVerificationEmail(account: any, origin: string) {
  const verifyUrl = `${origin}/account/verify-email?token=${account.verificationToken}`;
  await sendEmail({
    to: account.email,
    subject: 'Sign-up Verification API - Verify Email',
    html: `
      <h4>Verify Email</h4>
      <p>Thanks for registering!</p>
      <p>Please click the below link to verify your email address:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
    `
  });
}

async function sendAlreadyRegisteredEmail(email: string, origin: string) {
  await sendEmail({
    to: email,
    subject: 'Sign-up Verification API - Email Already Registered',
    html: `
      <h4>Email Already Registered</h4>
      <p>Your email <strong>${email}</strong> is already registered.</p>
      <p>If you don't know your password please visit the
      <a href="${origin}/account/forgot-password">forgot password</a> page.</p>
    `
  });
}

async function sendPasswordResetEmail(account: any, origin: string) {
  const resetUrl = `${origin}/account/reset-password?token=${account.resetToken}`;
  await sendEmail({
    to: account.email,
    subject: 'Sign-up Verification API - Reset Password',
    html: `
      <h4>Reset Password Email</h4>
      <p>Please click the below link to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
    `
  });
}