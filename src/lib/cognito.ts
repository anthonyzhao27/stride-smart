import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  ISignUpResult,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';

// Check if we're in a build environment
const isBuildTime = typeof window === 'undefined' && !process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;

// Cognito User Pool configuration
const poolData = isBuildTime
  ? null
  : {
      UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    };

export const userPool = poolData ? new CognitoUserPool(poolData) : null;

// Helper function to check if Cognito is available
export const isCognitoAvailable = () => {
  return !isBuildTime && userPool !== null;
};

// Get current authenticated user
export const getCurrentUser = () => {
  if (!userPool) return null;
  return userPool.getCurrentUser();
};

// Sign up a new user
export const signUp = (
  email: string,
  password: string
): Promise<ISignUpResult> => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito not configured'));
      return;
    }

    const attributeList = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: email,
      }),
    ];

    userPool.signUp(email, password, attributeList, [], (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      if (!result) {
        reject(new Error('Sign up failed'));
        return;
      }
      resolve(result);
    });
  });
};

// Sign in a user
export const signIn = (
  email: string,
  password: string
): Promise<CognitoUser> => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito not configured'));
      return;
    }

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: () => {
        resolve(cognitoUser);
      },
      onFailure: (err) => {
        reject(err);
      },
      newPasswordRequired: () => {
        // Handle case where user needs to set a new password
        reject(new Error('New password required'));
      },
    });
  });
};

// Sign out the current user
export const signOut = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCurrentUser();
    if (!cognitoUser) {
      reject(new Error('No user logged in'));
      return;
    }

    cognitoUser.signOut(() => {
      resolve();
    });
  });
};

// Get user session (includes JWT tokens)
export const getUserSession = (): Promise<{
  idToken: string;
  accessToken: string;
  refreshToken: string;
}> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCurrentUser();
    if (!cognitoUser) {
      reject(new Error('No user logged in'));
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) {
        reject(err);
        return;
      }

      if (!session || !session.isValid()) {
        reject(new Error('Invalid session'));
        return;
      }

      resolve({
        idToken: session.getIdToken().getJwtToken(),
        accessToken: session.getAccessToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      });
    });
  });
};

// Get user attributes (email, etc.)
export const getUserAttributes = (): Promise<{
  email?: string;
  sub?: string;
  [key: string]: string | undefined;
}> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = getCurrentUser();
    if (!cognitoUser) {
      reject(new Error('No user logged in'));
      return;
    }
    // Ensure session is valid (and refresh tokens if needed) before fetching attributes
    cognitoUser.getSession((sessionErr: Error | null, session: CognitoUserSession | null) => {
      if (sessionErr || !session || !session.isValid()) {
        reject(new Error('No user logged in'));
        return;
      }

      cognitoUser.getUserAttributes((err, attributes) => {
        if (err) {
          // Normalize common Cognito error when tokens are stale
          const code = (typeof err === 'object' && err && 'code' in err) ? (err as { code?: string }).code : undefined;
          if (code === 'NotAuthorizedException' || (err as Error)?.message === 'User is not authenticated') {
            reject(new Error('No user logged in'));
            return;
          }
          reject(err);
          return;
        }

        const userAttributes: { [key: string]: string } = {};
        attributes?.forEach((attribute) => {
          userAttributes[attribute.Name] = attribute.Value;
        });

        resolve(userAttributes);
      });
    });
  });
};

// Confirm sign up with verification code
export const confirmSignUp = (
  email: string,
  code: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito not configured'));
      return;
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

// Resend confirmation code
export const resendConfirmationCode = (email: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito not configured'));
      return;
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.resendConfirmationCode((err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
};

// Forgot password - initiate reset
export const forgotPassword = (email: string): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito not configured'));
      return;
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.forgotPassword({
      onSuccess: (data) => {
        resolve(data);
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};

// Confirm new password after forgot password
export const confirmPassword = (
  email: string,
  verificationCode: string,
  newPassword: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      reject(new Error('Cognito not configured'));
      return;
    }

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmPassword(verificationCode, newPassword, {
      onSuccess: () => {
        resolve('Password changed successfully');
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};
