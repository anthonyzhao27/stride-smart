// Simple test to check Firebase connection
// This test will help verify that your Firebase configuration is working

describe('Firebase Connection Test', () => {
  it('should be able to import Firebase modules', () => {
    // This test just verifies that we can import the Firebase modules
    // without TypeScript compilation errors
    expect(() => {
      require('../src/lib/firebase');
    }).not.toThrow();
  });

  it('should have Firebase configuration', () => {
    // Check if environment variables are set
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'
    ];

    requiredEnvVars.forEach(envVar => {
      expect(process.env[envVar]).toBeDefined();
      expect(process.env[envVar]).not.toBe('');
    });
  });

  it('should have valid Firebase project ID', () => {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    expect(projectId).toMatch(/^[a-z0-9-]+$/); // Firebase project IDs are lowercase with hyphens
  });

  it('should have valid Firebase API key format', () => {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    expect(apiKey).toMatch(/^AIza[0-9A-Za-z-_]{35}$/); // Firebase API keys start with "AIza" and are 39 chars
  });
});
