import { CognitoJwtVerifier } from 'aws-jwt-verify';

/**
 * Create JWT verifier for Cognito ID tokens
 * Singleton instance to avoid recreating on every request
 */
export const createCognitoIdVerifier = () => {
  if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || !process.env.AWS_REGION) {
    console.warn('Cognito configuration not found in environment variables');
    return null;
  }

  return CognitoJwtVerifier.create({
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    tokenUse: 'id',
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
  });
};

export const createCognitoAccessVerifier = () => {
  if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || !process.env.AWS_REGION) {
    console.warn('Cognito configuration not found in environment variables');
    return null;
  }

  return CognitoJwtVerifier.create({
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    tokenUse: 'access',
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
  });
};

export const idVerifier = createCognitoIdVerifier();
export const accessVerifier = createCognitoAccessVerifier();
