# Password Reset Testing Guide

This guide will help you test the password reset functionality to ensure the email templates and redirect URLs are working correctly.

## Prerequisites

1. ✅ Backend server running on `http://localhost:8000`
2. ✅ Frontend server running on `http://localhost:3000`
3. ✅ Environment variables configured in `.env`
4. ⚠️ Supabase email templates configured (see SUPABASE_EMAIL_SETUP.md)

## Testing Steps

### Step 1: Test Password Reset Request

1. Open your browser and go to: `http://localhost:3000/auth/forgot-password`
2. Enter a valid email address that exists in your system
3. Click "Send Reset Link"
4. You should see a success message: "Password reset email sent successfully. Please check your email and follow the instructions."

### Step 2: Check Email

1. Check your email inbox (and spam folder)
2. Look for an email with subject: "Reset your MechAgent password"
3. The email should have:
   - Professional HTML formatting with MechAgent branding
   - A blue "Reset Password" button
   - Security notice about the 24-hour expiration
   - Fallback link in case the button doesn't work

### Step 3: Test Password Reset Link

1. Click the "Reset Password" button in the email
2. **Expected Result**: You should be redirected to `http://localhost:3000/auth/reset-password`
3. **Previous Issue**: This would show "404 Page not found" - this should now be fixed
4. The reset password page should load with:
   - Dark theme matching other auth pages
   - Form fields for new password and confirm password
   - Proper token handling

### Step 4: Complete Password Reset

1. On the reset password page, enter:
   - New password (minimum 8 characters)
   - Confirm password (must match)
2. Click "Reset Password"
3. You should see a success message
4. You should be redirected to the login page

### Step 5: Verify New Password

1. Go to `http://localhost:3000/auth/login`
2. Try logging in with your email and the OLD password - this should fail
3. Try logging in with your email and the NEW password - this should succeed

## Troubleshooting

### Issue: Still getting 404 on reset link

**Possible Causes:**
1. Supabase email template not updated
2. Redirect URL in Supabase doesn't match `http://localhost:3000/auth/reset-password`
3. Site URL in Supabase not set to `http://localhost:3000`

**Solution:**
1. Go to Supabase Dashboard → Authentication → Settings
2. Update email templates as described in `SUPABASE_EMAIL_SETUP.md`
3. Ensure Site URL is set to `http://localhost:3000`
4. Add `http://localhost:3000/auth/reset-password` to Redirect URLs

### Issue: Email not received

**Possible Causes:**
1. Email in spam folder
2. SMTP configuration issues
3. Supabase email service not configured

**Solution:**
1. Check spam/junk folder
2. Verify Supabase project has email service enabled
3. Check backend logs for any email sending errors

### Issue: Invalid or expired token

**Possible Causes:**
1. Token expired (24-hour limit)
2. Token already used
3. URL parameters corrupted

**Solution:**
1. Request a new password reset email
2. Use the reset link within 24 hours
3. Don't refresh or modify the reset URL

### Issue: Backend errors

**Check backend logs:**
```bash
# In the backend terminal, look for:
# - "Password reset email sent to [email] with redirect to http://localhost:3000/auth/reset-password"
# - Any error messages related to Supabase or email sending
```

## Environment Variables Checklist

Ensure these are set in your `.env` file:

```env
# Frontend URL for password reset redirects
FRONTEND_URL=http://localhost:3000

# Backend URL
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Supabase Configuration
SUPABASE_URL=https://mcxpwhdfnoivfiujquaq.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Other required variables...
```

## Supabase Dashboard Configuration Checklist

### Authentication Settings:
- ✅ Site URL: `http://localhost:3000`
- ✅ Redirect URLs: Include `http://localhost:3000/auth/reset-password`

### Email Templates:
- ✅ Password Reset template configured with proper HTML
- ✅ Redirect URL set to `http://localhost:3000/auth/reset-password`
- ✅ Subject: "Reset your MechAgent password"

## Success Criteria

✅ **Test Passed If:**
1. Password reset email is received
2. Email has professional formatting and branding
3. Reset link redirects to local reset password page (no 404)
4. Password can be successfully reset
5. Login works with new password
6. Old password no longer works

❌ **Test Failed If:**
1. No email received
2. Reset link shows 404 error
3. Reset password page doesn't load
4. Password reset doesn't work
5. Can still login with old password

## Next Steps After Testing

Once local testing is successful:

1. **For Production Deployment:**
   - Update `FRONTEND_URL` to your production domain
   - Update Supabase email templates with production URLs
   - Update Supabase Site URL and Redirect URLs
   - Test the flow again in production

2. **Additional Improvements:**
   - Add rate limiting for password reset requests
   - Implement email verification for new signups
   - Add password strength requirements
   - Consider adding 2FA for enhanced security

## Contact

If you encounter any issues during testing, check:
1. Backend terminal logs
2. Frontend browser console
3. Supabase dashboard logs
4. Email delivery logs

The password reset functionality should now work seamlessly with proper email templates and redirect handling!