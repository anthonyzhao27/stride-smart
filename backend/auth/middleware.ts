import { Response, NextFunction } from 'express';
import { idVerifier, accessVerifier } from './verifier';
import { AuthenticatedRequest } from './types';

/**
 * Middleware to verify Cognito JWT tokens
 * Adds user information to req.user if authenticated
 * Returns 401 if no token provided, 403 if token is invalid
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Env-based bypass to simplify local testing (no effect in prod if not set)
  if (process.env.AUTH_BYPASS === 'true') {
    const hdr = req.headers['user-id'];
    const headerUserId = typeof hdr === 'string' ? hdr : Array.isArray(hdr) ? hdr[0] : undefined;
    const userId = headerUserId || process.env.AUTH_BYPASS_USER_ID || 'test-user';
    req.user = {
      id: userId,
      email: `${userId}@example.com`,
      username: userId,
    };
    next();
    return;
  }
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (!token) {
      res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
      return;
    }

    if (!idVerifier && !accessVerifier) {
      console.error('JWT verifier not configured');
      res.status(500).json({ error: 'Server Error', message: 'Authentication not configured' });
      return;
    }
    let payload: import('./types').CognitoTokenPayload | null = null;
    try {
      if (idVerifier) payload = (await idVerifier.verify(token)) as unknown as import('./types').CognitoTokenPayload;
    } catch {}
    if (!payload) {
      try {
        if (accessVerifier) payload = (await accessVerifier.verify(token)) as unknown as import('./types').CognitoTokenPayload;
      } catch {}
    }
    if (!payload) {
      res.status(403).json({ error: 'Forbidden', message: 'Invalid or expired token' });
      return;
    }
    
    // Add user info to request
    req.user = {
      id: payload.sub,
      email: payload.email as string,
      username: payload['cognito:username'] as string,
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(403).json({ error: 'Forbidden', message: 'Invalid or expired token' });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present and valid, but doesn't require it
 * Continues with next() even if authentication fails
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Env-based bypass for optional auth as well
  if (process.env.AUTH_BYPASS === 'true') {
    const hdr = req.headers['user-id'];
    const headerUserId = typeof hdr === 'string' ? hdr : Array.isArray(hdr) ? hdr[0] : undefined;
    const userId = headerUserId || process.env.AUTH_BYPASS_USER_ID || 'test-user';
    req.user = {
      id: userId,
      email: `${userId}@example.com`,
      username: userId,
    };
    next();
    return;
  }
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    if (token && (idVerifier || accessVerifier)) {
      let payload: import('./types').CognitoTokenPayload | null = null;
      try {
        if (idVerifier) payload = (await idVerifier.verify(token)) as unknown as import('./types').CognitoTokenPayload;
      } catch {}
      if (!payload) {
        try {
          if (accessVerifier) payload = (await accessVerifier.verify(token)) as unknown as import('./types').CognitoTokenPayload;
        } catch {}
      }
      if (payload) {
      req.user = {
        id: payload.sub,
        email: payload.email as string,
        username: payload['cognito:username'] as string,
      };
      }
    }
  } catch (error) {
    console.error('Optional auth failed:', error);
    // Continue without authentication
  }
  
  next();
};

/**
 * Helper to get user ID from authenticated request
 * Returns null if user is not authenticated
 */
export const getUserId = (req: AuthenticatedRequest): string | null => {
  return req.user?.id || null;
};

/**
 * Helper to require user ID from authenticated request
 * Throws error if user is not authenticated
 */
export const requireUserId = (req: AuthenticatedRequest): string => {
  const userId = getUserId(req);
  if (!userId) {
    throw new Error('User ID is required but not found in request');
  }
  return userId;
};
