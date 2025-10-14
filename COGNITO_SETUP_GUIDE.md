# AWS Cognito Authentication Setup Guide

This guide will walk you through setting up AWS Cognito for authentication in your workout tracker app.

## Prerequisites

- AWS Account
- AWS CLI configured (optional but recommended)
- Access to AWS Console

## Step 1: Create a Cognito User Pool

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito)
2. Click **Create user pool**
3. Configure sign-in experience:
   - **Sign-in options**: Select **Email**
   - Click **Next**

4. Configure security requirements:
   - **Password policy**: Choose your preferred policy (recommended: Cognito defaults)
   - **Multi-factor authentication**: Optional (can enable later)
   - **User account recovery**: Enable **Email only**
   - Click **Next**

5. Configure sign-up experience:
   - **Self-registration**: Enable **Allow users to sign themselves up**
   - **Attribute verification**: Select **Send email message, verify email address**
   - **Required attributes**: 
     - Email (should be pre-selected)
   - Click **Next**

6. Configure message delivery:
   - **Email provider**: 
     - For development: **Send email with Cognito** (limited to 50 emails/day)
     - For production: **Send email with Amazon SES** (recommended)
   - **FROM email address**: Use default or configure custom
   - Click **Next**

7. Integrate your app:
   - **User pool name**: `WorkoutTrackerUserPool` (or your preferred name)
   - **App client name**: `WorkoutTrackerWebApp`
   - **Client secret**: **Don't generate a client secret** (for web apps)
   - **Authentication flows**: Enable **ALLOW_USER_PASSWORD_AUTH**
   - Click **Next**

8. Review and create:
   - Review all settings
   - Click **Create user pool**

## Step 2: Get Your Cognito Configuration Values

After creating the user pool:

1. **User Pool ID**:
   - Go to your user pool in the Cognito console
   - Copy the **User pool ID** (format: `us-east-1_XXXXXXXXX`)

2. **App Client ID**:
   - In your user pool, go to **App integration** tab
   - Click on your app client name
   - Copy the **Client ID**

3. **AWS Region**:
   - Note the region where you created the user pool (e.g., `us-east-1`)

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update the Cognito values in `.env.local`:
   ```env
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   NEXT_PUBLIC_COGNITO_CLIENT_ID=your_app_client_id_here
   AWS_REGION=us-east-1
   ```

## Step 4: Test Your Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the signup page: `http://localhost:3000/signup`

3. Create a test account:
   - Enter your email and password
   - Check your email for the verification code
   - Enter the verification code to verify your account

4. Log in at `http://localhost:3000/login`

## Optional: Configure Google Sign-In (Advanced)

To enable Google OAuth with Cognito:

1. **Set up Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs for Cognito

2. **Configure Cognito Hosted UI**:
   - In your user pool, go to **App integration** → **App client settings**
   - Enable **Google** as an identity provider
   - Configure callback URLs
   - Enable **Authorization code grant**

3. **Update your app**:
   - Implement Cognito Hosted UI redirect flow
   - Update the Google sign-in button to redirect to Cognito Hosted UI

## User Pool Configuration Best Practices

### For Development:
- Use Cognito's built-in email service
- Simple password policy (8 characters minimum)
- Email-only verification

### For Production:
- Use Amazon SES for email delivery
- Strong password policy (uppercase, lowercase, numbers, special characters)
- Consider enabling MFA
- Set up account recovery mechanisms
- Configure advanced security features (adaptive authentication)

## Troubleshooting

### "User is not confirmed" error
- Check your email for the verification code
- Use the verification form in the signup flow
- Verify the email in Cognito console manually if needed

### "Invalid email or password" error
- Ensure password meets requirements (8+ characters by default)
- Check if email is correctly formatted
- Verify the user exists in Cognito console

### JWT verification fails
- Ensure `AWS_REGION` matches your user pool region
- Verify `NEXT_PUBLIC_COGNITO_USER_POOL_ID` is correct
- Check that the token hasn't expired (default: 1 hour)

## Security Considerations

1. **Never commit `.env.local` to version control**
2. **Use environment-specific user pools** (dev, staging, production)
3. **Enable MFA for production** environments
4. **Configure CORS** properly in your app client settings
5. **Use HTTPS in production**
6. **Regularly rotate credentials**
7. **Monitor authentication logs** in CloudWatch

## Cost Estimation

Cognito pricing (as of 2024):
- **First 50,000 MAUs**: Free
- **Beyond 50,000 MAUs**: $0.0055 per MAU
- **Email delivery with Cognito**: Limited to 50/day (free)
- **Email delivery with SES**: $0.10 per 1,000 emails

## Next Steps

1. ✅ User Pool created
2. ✅ Environment variables configured
3. ✅ Basic authentication working
4. 🔲 Configure custom email templates
5. 🔲 Set up SES for production email delivery
6. 🔲 Enable MFA (optional)
7. 🔲 Configure OAuth providers (optional)
8. 🔲 Set up CloudWatch monitoring

## Additional Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Cognito User Pool Best Practices](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-settings.html)
- [AWS JWT Verify Library](https://github.com/awslabs/aws-jwt-verify)
