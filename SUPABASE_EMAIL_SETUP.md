# Supabase Email Template Setup Guide

This guide will help you configure proper email templates in Supabase for password reset and email confirmation functionality.

## Overview

The current issue is that the password reset link in emails is pointing to a 404 page. This happens because:
1. The email template in Supabase is not properly configured
2. The redirect URL needs to match your local development environment

## Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `mcxpwhdfnoivfiujquaq`

## Step 2: Configure Authentication Settings

1. In the left sidebar, click on **Authentication**
2. Click on **Settings**
3. Scroll down to **Email Templates**

## Step 3: Configure Password Reset Email Template

### Template Settings:
- **Subject**: `Reset your MechAgent password`
- **Redirect URL**: `http://localhost:3000/auth/reset-password`

### HTML Template:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .info-box {
            background-color: #f3f4f6;
            border-left: 4px solid #2563eb;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .security-note {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 4px;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MechAgent</div>
            <h1 class="title">Reset Your Password</h1>
            <p class="subtitle">We received a request to reset your password</p>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            <p>You recently requested to reset your password for your MechAgent account. Click the button below to reset it:</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
            </div>
            
            <div class="info-box">
                <strong>Important:</strong> This password reset link will expire in 24 hours for security reasons.
            </div>
            
            <div class="security-note">
                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </div>
            
            <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">{{ .ConfirmationURL }}</p>
        </div>
        
        <div class="footer">
            <p>This email was sent by MechAgent</p>
            <p>If you have any questions, contact us at <a href="mailto:support@mechagent.com">support@mechagent.com</a></p>
        </div>
    </div>
</body>
</html>
```

## Step 4: Configure Email Confirmation Template

### Template Settings:
- **Subject**: `Confirm your MechAgent email`
- **Redirect URL**: `http://localhost:3000/auth/login`

### HTML Template:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #059669;
        }
        .info-box {
            background-color: #f3f4f6;
            border-left: 4px solid #10b981;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">MechAgent</div>
            <h1 class="title">Welcome to MechAgent!</h1>
            <p class="subtitle">Please confirm your email address</p>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            <p>Thank you for signing up for MechAgent! To complete your registration, please confirm your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
            </div>
            
            <div class="info-box">
                <strong>Next Steps:</strong> After confirming your email, you'll be able to sign in and start using MechAgent.
            </div>
            
            <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; color: #10b981;">{{ .ConfirmationURL }}</p>
        </div>
        
        <div class="footer">
            <p>This email was sent by MechAgent</p>
            <p>If you have any questions, contact us at <a href="mailto:support@mechagent.com">support@mechagent.com</a></p>
        </div>
    </div>
</body>
</html>
```

## Step 5: Configure Site URL Settings

1. In the Authentication settings, find **Site URL**
2. Set it to: `http://localhost:3000`
3. In **Redirect URLs**, add:
   - `http://localhost:3000/auth/reset-password`
   - `http://localhost:3000/auth/login`
   - `http://localhost:3000/auth/signup`

## Step 6: Test the Configuration

1. Restart your backend server to pick up the new environment variables
2. Go to the forgot password page: `http://localhost:3000/auth/forgot-password`
3. Enter your email address
4. Check your email for the reset link
5. Click the reset link - it should now redirect to your local reset password page

## Important Notes

### For Production Deployment:
When deploying to production, update the following:
1. Change `FRONTEND_URL` in your environment variables to your production domain
2. Update the Supabase email template redirect URLs to your production domain
3. Update the Site URL and Redirect URLs in Supabase settings

### Template Variables:
- `{{ .ConfirmationURL }}` - The magic link URL generated by Supabase
- `{{ .Email }}` - The user's email address
- `{{ .Token }}` - The confirmation token (if needed)

### Troubleshooting:
1. **404 Error**: Check that the redirect URL in Supabase matches your frontend URL
2. **Email not received**: Check spam folder and verify SMTP settings
3. **Invalid token**: Ensure the token hasn't expired (24-hour default)
4. **CORS errors**: Make sure your frontend URL is added to the allowed origins

## Environment Variables Summary

Make sure these are set in your `.env` file:
```
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://mcxpwhdfnoivfiujquaq.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

After completing these steps, your password reset emails should work correctly and redirect users to the proper local development page.