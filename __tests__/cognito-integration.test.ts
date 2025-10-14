/**
 * Cognito Integration Tests
 * 
 * These tests verify the integration between different auth modules
 * and check that the auth system works end-to-end
 */

import { describe, it, expect, jest } from '@jest/globals';

describe('Cognito Integration', () => {
  describe('Module integration', () => {
    it('should import all auth modules without errors', () => {
      expect(() => {
        require('../backend/auth/index');
        require('../src/lib/cognito');
        require('../backend/auth/middleware');
        require('../backend/auth/verifier');
        require('../backend/auth/types');
      }).not.toThrow();
    });

    it('should have consistent exports across modules', () => {
      const authIndex = require('../backend/auth/index');
      const middleware = require('../backend/auth/middleware');
      const verifier = require('../backend/auth/verifier');

      // Check that index re-exports match the source modules
      expect(authIndex.authenticateToken).toBe(middleware.authenticateToken);
      expect(authIndex.optionalAuth).toBe(middleware.optionalAuth);
      expect(authIndex.getUserId).toBe(middleware.getUserId);
      expect(authIndex.requireUserId).toBe(middleware.requireUserId);
      expect(authIndex.verifier).toBe(verifier.verifier);
      expect(authIndex.createCognitoVerifier).toBe(verifier.createCognitoVerifier);
    });
  });

  describe('Verifier initialization', () => {
    it('should handle missing environment variables gracefully', () => {
      const { createCognitoVerifier } = require('../backend/auth/verifier');
      
      // This should not throw even if env vars are missing
      expect(() => createCognitoVerifier()).not.toThrow();
    });

    it('should return null when Cognito is not configured', () => {
      // Remove env vars temporarily
      const originalUserPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
      const originalRegion = process.env.AWS_REGION;
      
      delete process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
      delete process.env.AWS_REGION;

      // Re-import to get fresh instance
      jest.resetModules();
      const { createCognitoVerifier } = require('../backend/auth/verifier');
      const result = createCognitoVerifier();
      
      expect(result).toBeNull();

      // Restore env vars
      if (originalUserPoolId) process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = originalUserPoolId;
      if (originalRegion) process.env.AWS_REGION = originalRegion;
      jest.resetModules();
    });
  });

  describe('Middleware authentication flow', () => {
    let middleware: any;

    beforeAll(() => {
      middleware = require('../backend/auth/middleware');
    });

    it('authenticateToken should reject requests without authorization header', async () => {
      const mockReq = {
        headers: {}
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      const mockNext = jest.fn();

      await middleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('authenticateToken should reject requests with malformed authorization header', async () => {
      const mockReq = {
        headers: {
          authorization: 'NotBearer token123'
        }
      } as any;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      const mockNext = jest.fn();

      await middleware.authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('optionalAuth should continue without error if no token provided', async () => {
      const mockReq = {
        headers: {}
      } as any;

      const mockRes = {} as any;
      const mockNext = jest.fn();

      await middleware.optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('optionalAuth should continue even with invalid token', async () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      } as any;

      const mockRes = {} as any;
      const mockNext = jest.fn();

      await middleware.optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      // User should not be set on invalid token
      expect(mockReq.user).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    let cognitoModule: any;

    beforeAll(() => {
      cognitoModule = require('../src/lib/cognito');
    });

    it('getCurrentUser should return null when userPool is not configured', () => {
      const result = cognitoModule.getCurrentUser();
      // In test environment without proper config, this should return null
      expect(result === null || result === undefined).toBe(true);
    });

    it('isCognitoAvailable should return boolean', () => {
      const result = cognitoModule.isCognitoAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('API Client integration (frontend)', () => {
    it('should import API client without errors', () => {
      expect(() => require('../src/lib/apiClient')).not.toThrow();
    });

    it('should export apiClient singleton', () => {
      const { apiClient } = require('../src/lib/apiClient');
      expect(apiClient).toBeDefined();
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.patch).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
    });

    it('should export ApiClient class', () => {
      const ApiClient = require('../src/lib/apiClient').default;
      expect(ApiClient).toBeDefined();
      expect(typeof ApiClient).toBe('function');
      
      const instance = new ApiClient('http://test.com');
      expect(instance).toBeDefined();
      expect(typeof instance.get).toBe('function');
    });
  });

  describe('CognitoAuth utilities (frontend - Next.js API routes)', () => {
    it('should import cognitoAuth utilities without errors', () => {
      expect(() => require('../src/lib/cognitoAuth')).not.toThrow();
    });

    it('should export verifyCognitoToken function', () => {
      const { verifyCognitoToken } = require('../src/lib/cognitoAuth');
      expect(verifyCognitoToken).toBeDefined();
      expect(typeof verifyCognitoToken).toBe('function');
    });

    it('should export getUserIdFromToken function', () => {
      const { getUserIdFromToken } = require('../src/lib/cognitoAuth');
      expect(getUserIdFromToken).toBeDefined();
      expect(typeof getUserIdFromToken).toBe('function');
    });

    it('should export requireAuth function', () => {
      const { requireAuth } = require('../src/lib/cognitoAuth');
      expect(requireAuth).toBeDefined();
      expect(typeof requireAuth).toBe('function');
    });
  });
});
