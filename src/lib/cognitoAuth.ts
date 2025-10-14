import { NextRequest } from 'next/server';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

// Create JWT verifier for Cognito ID tokens
let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

const getVerifier = () => {
  if (!verifier && process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID && process.env.AWS_REGION) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      tokenUse: 'id',
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    });
  }
  return verifier;
};

export interface CognitoTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  'cognito:username': string;
  aud: string;
  token_use: string;
  auth_time: number;
  exp: number;
  iat: number;
}

/**
 * Verify Cognito JWT token from Authorization header
 * @param request - Next.js request object
 * @returns Decoded token payload or null if invalid
 */
export async function verifyCognitoToken(
  request: NextRequest
): Promise<CognitoTokenPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const tokenVerifier = getVerifier();
    
    if (!tokenVerifier) {
      console.error('JWT verifier not configured');
      return null;
    }

    const payload = await tokenVerifier.verify(token);
    return payload as unknown as CognitoTokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract user ID from Cognito token
 * @param request - Next.js request object
 * @returns User ID (sub claim) or null if not authenticated
 */
export async function getUserIdFromToken(
  request: NextRequest
): Promise<string | null> {
  const payload = await verifyCognitoToken(request);
  return payload?.sub || null;
}

/**
 * Middleware helper to require authentication
 * @param request - Next.js request object
 * @returns Token payload if authenticated, throws error otherwise
 */
export async function requireAuth(
  request: NextRequest
): Promise<CognitoTokenPayload> {
  const payload = await verifyCognitoToken(request);
  
  if (!payload) {
    throw new Error('Unauthorized');
  }
  
  return payload;
}
