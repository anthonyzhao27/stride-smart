/**
 * Authentication module for AWS Cognito
 * 
 * This module provides:
 * - JWT token verification middleware
 * - User authentication helpers
 * - TypeScript types for authenticated requests
 */

export { authenticateToken, optionalAuth, getUserId, requireUserId } from './middleware';
export { idVerifier, accessVerifier, createCognitoIdVerifier, createCognitoAccessVerifier } from './verifier';
export type { AuthenticatedRequest, CognitoTokenPayload } from './types';
