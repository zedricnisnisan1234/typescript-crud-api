// src/_middleware/authorize.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../_helpers/db';
import config from '../../config.json';

export function authorize(roles: string[] = []) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const decoded: any = jwt.verify(token, config.jwtSecret);
      const account = await db.Account.findByPk(decoded.id);

      if (!account) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (roles.length && !roles.includes(account.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      req.body.accountId = account.id;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}