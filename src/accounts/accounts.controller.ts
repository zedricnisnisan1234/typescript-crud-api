// src/accounts/accounts.controller.ts
import { Request, Response, NextFunction, Router } from 'express';
import Joi from 'joi';
import { Role } from '../_helpers/role';
import { validateRequest } from '../_middleware/validateRequest';
import { authorize } from '../_middleware/authorize';
import { accountService } from './account.service';
/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Account management and authentication
 */

/**
 * @swagger
 * /accounts/authenticate:
 *   post:
 *     summary: Authenticate account and get JWT token
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *       400:
 *         description: Invalid credentials
 */

/**
 * @swagger
 * /accounts/register:
 *   post:
 *     summary: Register a new account
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, firstName, lastName, email, password, confirmPassword, acceptTerms]
 *             properties:
 *               title:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               acceptTerms:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /accounts/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification successful
 *       400:
 *         description: Invalid token
 */

/**
 * @swagger
 * /accounts/forgot-password:
 *   post:
 *     summary: Submit email to get password reset token
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 */

/**
 * @swagger
 * /accounts/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password, confirmPassword]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Get all accounts (Admin only)
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all accounts
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
const router = Router();

// PUBLIC ROUTES
router.post('/authenticate', authenticateSchema, authenticate);
router.post('/refresh-token', refreshToken);
router.post('/revoke-token', authorize(), revokeTokenSchema, revokeToken);
router.post('/register', registerSchema, register);
router.post('/verify-email', verifyEmailSchema, verifyEmail);
router.post('/forgot-password', forgotPasswordSchema, forgotPassword);
router.post('/validate-reset-token', validateResetTokenSchema, validateResetToken);
router.post('/reset-password', resetPasswordSchema, resetPassword);

// ADMIN ROUTES
router.get('/', authorize([Role.Admin]), getAll);
router.get('/:id', authorize(), getById);
router.post('/', authorize([Role.Admin]), createSchema, create);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);

export default router;

// ROUTE HANDLERS
function authenticate(req: Request, res: Response, next: NextFunction): void {
  const ipAddress = req.ip || '127.0.0.1';
  accountService.authenticate({ ...req.body, ipAddress })
    .then(account => {
      setTokenCookie(res, account.refreshToken);
      res.json(account);
    })
    .catch(next);
}

function refreshToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies.refreshToken;
  const ipAddress = req.ip || '127.0.0.1';
  accountService.refreshToken({ token, ipAddress })
    .then(account => {
      setTokenCookie(res, account.refreshToken);
      res.json(account);
    })
    .catch(next);
}

function revokeToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.body.token || req.cookies.refreshToken;
  const ipAddress = req.ip || '127.0.0.1';
  if (!token) {
    res.status(400).json({ message: 'Token is required' });
    return;
  }
  accountService.revokeToken({ token, ipAddress })
    .then(() => res.json({ message: 'Token revoked' }))
    .catch(next);
}

function register(req: Request, res: Response, next: NextFunction): void {
  accountService.register(req.body, req.get('origin') || 'http://localhost:4000')
    .then(() => res.json({
      message: 'Registration successful, please check your email for verification instructions'
    }))
    .catch(next);
}

function verifyEmail(req: Request, res: Response, next: NextFunction): void {
  accountService.verifyEmail(req.body)
    .then(() => res.json({ message: 'Verification successful, you can now login' }))
    .catch(next);
}

function forgotPassword(req: Request, res: Response, next: NextFunction): void {
  accountService.forgotPassword(req.body, req.get('origin') || 'http://localhost:4000')
    .then(() => res.json({
      message: 'Please check your email for password reset instructions'
    }))
    .catch(next);
}

function validateResetToken(req: Request, res: Response, next: NextFunction): void {
  accountService.validateResetToken(req.body)
    .then(() => res.json({ message: 'Token is valid' }))
    .catch(next);
}

function resetPassword(req: Request, res: Response, next: NextFunction): void {
  accountService.resetPassword(req.body)
    .then(() => res.json({ message: 'Password reset successful, you can now login' }))
    .catch(next);
}

function getAll(req: Request, res: Response, next: NextFunction): void {
  accountService.getAll()
    .then(accounts => res.json(accounts))
    .catch(next);
}

function getById(req: Request, res: Response, next: NextFunction): void {
  accountService.getById(Number(req.params.id))
    .then(account => res.json(account))
    .catch(next);
}

function create(req: Request, res: Response, next: NextFunction): void {
  accountService.create(req.body)
    .then(account => res.json(account))
    .catch(next);
}

function update(req: Request, res: Response, next: NextFunction): void {
  accountService.update(Number(req.params.id), req.body)
    .then(account => res.json(account))
    .catch(next);
}

function _delete(req: Request, res: Response, next: NextFunction): void {
  accountService.delete(Number(req.params.id))
    .then(() => res.json({ message: 'Account deleted successfully' }))
    .catch(next);
}

// VALIDATION SCHEMAS
function authenticateSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required()
  });
  validateRequest(req, next, schema);
}

function registerSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    acceptTerms: Joi.boolean().valid(true).required()
  });
  validateRequest(req, next, schema);
}

function verifyEmailSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({ token: Joi.string().required() });
  validateRequest(req, next, schema);
}

function forgotPasswordSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({ email: Joi.string().email().required() });
  validateRequest(req, next, schema);
}

function validateResetTokenSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({ token: Joi.string().required() });
  validateRequest(req, next, schema);
}

function resetPasswordSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
  });
  validateRequest(req, next, schema);
}

function revokeTokenSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({ token: Joi.string().empty('') });
  validateRequest(req, next, schema);
}

function createSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    role: Joi.string().valid(Role.Admin, Role.User).required()
  });
  validateRequest(req, next, schema);
}

function updateSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title: Joi.string().empty(''),
    firstName: Joi.string().empty(''),
    lastName: Joi.string().empty(''),
    email: Joi.string().email().empty(''),
    password: Joi.string().min(6).empty(''),
    confirmPassword: Joi.string().valid(Joi.ref('password')).empty(''),
    role: Joi.string().valid(Role.Admin, Role.User).empty('')
  }).with('password', 'confirmPassword');
  validateRequest(req, next, schema);
}

// HELPER
function setTokenCookie(res: Response, token: string) {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
  res.cookie('refreshToken', token, cookieOptions);
}