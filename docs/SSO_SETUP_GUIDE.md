# SSO Authentication Setup Guide

Complete step-by-step guide for setting up Single Sign-On (SSO) between WordPress and your Next.js Dashboard.

## 📋 Prerequisites

- WordPress site with the SSO code added to `functions.php`
- Next.js dashboard deployed on Vercel
- Both sites should use HTTPS (required for security)

---

## 🔧 Step 1: WordPress Setup

### 1.1 Copy Code to functions.php

The SSO code has already been added to your `wordpress-endpoints/functions-complete.php`. You need to:

1. **Copy the entire SSO section** from `functions-complete.php` to your WordPress theme's `functions.php` file
   - Location: Usually in `wp-content/themes/your-theme/functions.php`
   - Or if using a child theme: `wp-content/themes/your-child-theme/functions.php`

2. **The code includes:**
   - `JWT_Manager` class
   - `Rate_Limiter` class
   - `SSO_Endpoint` class
   - Endpoint registrations
   - CORS headers
   - Redirect function and shortcode

### 1.2 Update CORS Origins

In `functions-complete.php`, find the CORS section (around line 5000+) and update with your actual Vercel URL:

```php
$allowed_origins = [
    'https://your-dashboard.vercel.app', // ← Update this
    'http://localhost:3000',
    'http://localhost:3001',
];
```

**Replace `your-dashboard.vercel.app` with your actual Vercel deployment URL.**

### 1.3 Set Dashboard URL (Optional)

You can set the dashboard URL in WordPress options. Add this to your WordPress admin or `functions.php`:

```php
// Set dashboard URL (run once)
update_option('akf_dashboard_url', 'https://your-dashboard.vercel.app');
```

Or set it via WordPress admin → Settings → General (if you add a custom field).

---

## 🔗 Step 2: Create WordPress Redirect Link

You have **3 options** to create the dashboard link in WordPress:

### Option A: Using Shortcode (Easiest)

Add this shortcode anywhere in your WordPress content:

```
[dashboard_link]
```

Or with custom text:

```
[dashboard_link text="Go to Dashboard" class="button button-primary"]
```

### Option B: Using PHP Function

In your WordPress template file (header.php, footer.php, or any template):

```php
<?php
if (is_user_logged_in()) {
    $url = wp_nonce_url(
        admin_url('admin-post.php?action=redirect_to_dashboard'),
        'redirect_dashboard'
    );
    echo '<a href="' . esc_url($url) . '" class="button">Go to Dashboard</a>';
} else {
    echo '<a href="' . esc_url(wp_login_url()) . '" class="button">Login</a>';
}
?>
```

### Option C: Direct Link (Less Secure - Not Recommended)

```php
<a href="<?php echo esc_url(admin_url('admin-post.php?action=redirect_to_dashboard&_wpnonce=' . wp_create_nonce('redirect_dashboard'))); ?>">Dashboard</a>
```

---

## 🚀 Step 3: Next.js Dashboard Setup

### 3.1 Environment Variables

Create or update `.env.local` in your Next.js project root:

```env
NEXT_PUBLIC_WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json
```

**Replace `your-wordpress-site.com` with your actual WordPress domain.**

### 3.2 Verify Integration Files

The following files have been created/updated:

✅ `lib/store/slices/authSlice.ts` - Updated with token support  
✅ `lib/store/api/authApi.ts` - New SSO API endpoints  
✅ `lib/store/index.ts` - Added authApi to store  
✅ `lib/api/wordpressBaseQuery.ts` - Updated to use JWT tokens  
✅ `lib/types/roles.ts` - Updated AuthState interface  
✅ `components/providers/sso-handler.tsx` - New SSO handler  
✅ `components/providers/auth-initializer.tsx` - Updated for JWT  
✅ `app/[locale]/(dashboards)/layout.tsx` - Added SSOHandler  

### 3.3 Test the Integration

1. **Build and deploy** your Next.js app to Vercel
2. **Update CORS** in WordPress with your Vercel URL
3. **Test the flow:**
   - Login to WordPress
   - Click the dashboard link
   - You should be automatically authenticated in the dashboard

---

## 🔄 Step 4: How It Works

### Flow Diagram

```
1. User clicks "Dashboard" link in WordPress
   ↓
2. WordPress generates temporary SSO token (60 seconds)
   ↓
3. User redirected to: https://dashboard.vercel.app/?sso_token=XXX
   ↓
4. Next.js SSOHandler detects token in URL
   ↓
5. Dashboard calls: POST /wp-json/custom-api/v1/auth/exchange-token
   ↓
6. WordPress validates token, returns JWT (2 hours)
   ↓
7. Dashboard stores JWT, removes token from URL
   ↓
8. User is authenticated! All API calls use JWT
```

### Security Features

- ✅ **Rate Limiting**: 10 token generations, 5 exchanges per 5 minutes
- ✅ **IP Validation**: Token must be exchanged from same IP
- ✅ **User-Agent Validation**: Prevents token theft
- ✅ **Single-Use Tokens**: SSO tokens expire after 60 seconds
- ✅ **JWT Expiration**: JWT tokens expire after 2 hours
- ✅ **Token Revocation**: Tokens can be revoked if compromised

---

## 🧪 Step 5: Testing

### Test Checklist

- [ ] WordPress link redirects to dashboard
- [ ] SSO token appears in dashboard URL
- [ ] Token is exchanged for JWT automatically
- [ ] User is authenticated in dashboard
- [ ] API calls work with JWT token
- [ ] Token persists after page refresh
- [ ] Logout clears token

### Debug Mode

Enable WordPress debug logging to see SSO activity:

In `wp-config.php`:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

Check logs in: `wp-content/debug.log`

---

## 🐛 Troubleshooting

### Issue: "Token is invalid or expired"

**Solution:**
- Check if token was generated more than 60 seconds ago
- Verify IP addresses match (if behind proxy, check `X-Forwarded-For`)
- Check WordPress debug logs

### Issue: CORS errors

**Solution:**
- Verify your Vercel URL is in the `$allowed_origins` array
- Check that both sites use HTTPS
- Clear browser cache

### Issue: "Rate limit exceeded"

**Solution:**
- Wait 5 minutes before trying again
- Check if multiple users are sharing same IP
- Adjust rate limits in `Rate_Limiter::check()` if needed

### Issue: User not authenticated after redirect

**Solution:**
- Check browser console for errors
- Verify JWT token is stored in localStorage
- Check network tab for API call failures
- Verify WordPress API URL is correct in `.env.local`

---

## 📝 Additional Configuration

### Customize Token Expiration

In `functions-complete.php`, find `JWT_Manager::generate_token()`:

```php
$expire = $expiration ?? ($issued_at + (HOUR_IN_SECONDS * 2)); // Change 2 to your desired hours
```

### Customize Rate Limits

In `SSO_Endpoint::generate_sso_token()`:

```php
$rate_check = Rate_Limiter::check($user_id, 'sso_generate', 10, 300); // 10 attempts, 300 seconds
```

### Add Token Refresh

The dashboard can automatically refresh tokens before expiration. Add this to your auth logic:

```typescript
// Check token expiration and refresh if needed
useEffect(() => {
  if (token) {
    // Decode JWT to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    const timeUntilExpiry = expiresAt - Date.now();
    
    // Refresh if less than 30 minutes remaining
    if (timeUntilExpiry < 30 * 60 * 1000) {
      refreshToken();
    }
  }
}, [token]);
```

---

## ✅ Final Checklist

Before going live:

- [ ] WordPress SSO code is in `functions.php`
- [ ] CORS origins updated with production Vercel URL
- [ ] Dashboard URL set in WordPress options
- [ ] WordPress link/button is working
- [ ] Environment variables set in Vercel
- [ ] Tested SSO flow end-to-end
- [ ] HTTPS enabled on both sites
- [ ] Debug logging disabled in production

---

## 🆘 Support

If you encounter issues:

1. Check WordPress debug logs
2. Check browser console for errors
3. Check network tab for failed API calls
4. Verify all URLs and environment variables
5. Test with a fresh incognito window

---

## 📚 API Endpoints Reference

### WordPress Endpoints

- `POST /wp-json/custom-api/v1/auth/generate-sso-token` - Generate SSO token (requires login)
- `POST /wp-json/custom-api/v1/auth/exchange-token` - Exchange SSO for JWT
- `POST /wp-json/custom-api/v1/auth/validate` - Validate JWT token
- `POST /wp-json/custom-api/v1/auth/refresh` - Refresh JWT token
- `POST /wp-json/custom-api/v1/auth/revoke` - Revoke JWT token

### Next.js Usage

```typescript
import { useExchangeSSOTokenMutation } from '@/lib/store/api/authApi';

const [exchangeToken] = useExchangeSSOTokenMutation();
exchangeToken({ token: 'sso_token_here' });
```

---

**Setup Complete!** 🎉

Your SSO integration is ready. Users can now seamlessly access the dashboard from WordPress without logging in again.

