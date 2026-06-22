/**
 * JWT authentication middleware for PCP API routes.
 * Uses the same JWT_SECRET as the portal backend.
 */

import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export interface AuthUserPayload {
  sub: string;
  role: string;
  cockpitRoles: string[];
  jti: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUserPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization ?? '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    if (process.env['NODE_ENV'] === 'production') {
      res.status(503).json({ error: { message: 'JWT_SECRET not configured' } });
      return;
    }
    next();
    return;
  }

  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: { message: 'Unauthorized' } });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as AuthUserPayload;
    req.authUser = payload;
    next();
  } catch {
    res.status(401).json({ error: { message: 'Unauthorized' } });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const secret = process.env['JWT_SECRET'];
  const token = extractToken(req);
  if (secret && token) {
    try {
      req.authUser = jwt.verify(token, secret) as AuthUserPayload;
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }
  next();
}
