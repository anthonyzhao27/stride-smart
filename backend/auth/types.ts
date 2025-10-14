import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

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
