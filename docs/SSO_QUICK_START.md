# SSO Quick Start Guide

## ✅ What's Already Done

1. ✅ SSO code added to `functions-complete.php`
2. ✅ Next.js integration files created
3. ✅ Auth system updated to support JWT tokens
4. ✅ SSO handler component created

## 🚀 Quick Setup (5 Steps)

### Step 1: Copy to WordPress
Copy the SSO code from `wordpress-endpoints/functions-complete.php` to your WordPress theme's `functions.php`

**Location in functions-complete.php:**
- Lines ~4339-5105 (JWT_Manager, Rate_Limiter, SSO_Endpoint classes)
- Lines ~5106+ (Endpoint registration and CORS)

### Step 2: Update CORS URL
In `functions-complete.php`, find line ~5010 and update:

```php
$allowed_origins = [
    'https://YOUR-VERCEL-URL.vercel.app', // ← Change this
    'http://localhost:3000',
];
```

### Step 3: Set Dashboard URL
In WordPress, add this to `functions.php` (or set via options):

```php
update_option('akf_dashboard_url', 'https://YOUR-VERCEL-URL.vercel.app');
```

### Step 4: Create WordPress Link
Add this shortcode anywhere in WordPress:

```
[dashboard_link]
```

Or use PHP:
```php
<?php
if (is_user_logged_in()) {
    $url = wp_nonce_url(admin_url('admin-post.php?action=redirect_to_dashboard'), 'redirect_dashboard');
    echo '<a href="' . esc_url($url) . '">Go to Dashboard</a>';
}
?>
```

### Step 5: Deploy & Test
1. Deploy Next.js to Vercel
2. Update CORS with Vercel URL
3. Test the link!

## 📝 Environment Variables

Make sure `.env.local` has:

```env
NEXT_PUBLIC_WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json
```

## 🔍 Testing

1. Login to WordPress
2. Click dashboard link
3. Should redirect and auto-authenticate

## ❌ Common Issues

**CORS Error?** → Update CORS origins in WordPress  
**Token Invalid?** → Check WordPress debug logs  
**Not Authenticated?** → Check browser console for errors

## 📖 Full Guide

See `docs/SSO_SETUP_GUIDE.md` for complete documentation.

