# Installation Guide
## AKF Learning Dashboard Plugin

## 📦 **Step 1: Create Plugin Zip**

### Option A: Using File Explorer (Windows)

1. **Navigate to your project folder**:
   ```
   C:\Users\Masroor\Documents\Projects\akf-learning-hub-api
   ```

2. **Select ALL files and folders** in the directory:
   - `akf-learning-dashboard.php`
   - `uninstall.php`
   - `README.md`
   - `includes/` folder
   - All other files

3. **Right-click → Send to → Compressed (zipped) folder**

4. **Rename the zip file** to: `akf-learning-dashboard.zip`

### Option B: Using Command Line

```powershell
# Navigate to project directory
cd C:\Users\Masroor\Documents\Projects\akf-learning-hub-api

# Create zip (PowerShell 5.0+)
Compress-Archive -Path * -DestinationPath akf-learning-dashboard.zip
```

### Option C: Using Git (if you have it)

```bash
# Create zip excluding git files
git archive --format=zip --output=akf-learning-dashboard.zip HEAD
```

---

## 📥 **Step 2: Install in WordPress**

### Method 1: Upload via WordPress Admin (Recommended)

1. **Login to WordPress Admin**
2. **Go to**: Plugins → Add New
3. **Click**: "Upload Plugin" button (top of page)
4. **Click**: "Choose File" and select `akf-learning-dashboard.zip`
5. **Click**: "Install Now"
6. **Click**: "Activate Plugin"

### Method 2: Manual Upload via FTP

1. **Extract the zip file**
2. **Upload the entire folder** to:
   ```
   /wp-content/plugins/akf-learning-dashboard/
   ```
3. **Go to**: Plugins → Installed Plugins
4. **Find**: "AKF Learning Dashboard API"
5. **Click**: "Activate"

---

## ✅ **Step 3: Verify Installation**

### Check Plugin is Active
- ✅ Go to Plugins → Installed Plugins
- ✅ "AKF Learning Dashboard API" should show as "Active"

### Check for Errors
- ✅ Check WordPress debug log (if `WP_DEBUG` is enabled)
- ✅ Check browser console for JavaScript errors
- ✅ Check that no PHP errors appear

### Verify REST API Routes
1. **Visit**: `https://your-site.com/wp-json/custom-api/v1/users-count`
2. **Expected**: Should return JSON (not 404)
3. **If 404**: Go to Settings → Permalinks → Click "Save Changes" (flushes rewrite rules)

---

## 🔧 **Step 4: Configuration**

### Update CORS Origins (if needed)

If your Next.js dashboard URL is different, update it in:
```
akf-learning-dashboard.php (around line 200)
```

Find this section:
```php
$allowed_origins = array(
    'https://akf-learning-dash-git-feat-auth-adeel-akhtars-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
);
```

**Add your production URL** if different.

### Set Dashboard URL (for shortcode)

1. **Go to**: WordPress Admin → Settings
2. **Add option**: `akf_dashboard_url` (or use code)
3. **Or**: The shortcode will use default `http://localhost:3000`

---

## 🧪 **Step 5: Quick Test**

### Test 1: Check Routes are Registered
```
GET https://your-site.com/wp-json/custom-api/v1/users-count
```
**Expected**: JSON response with user counts

### Test 2: Test SSO Flow
1. **Login to WordPress** (as any user)
2. **Add shortcode** `[dashboard_link]` to a page
3. **Click the button**
4. **Expected**: Redirects to dashboard with SSO token

### Test 3: Test JWT Authentication
1. **Generate SSO token** (via shortcode or API)
2. **Exchange for JWT** (via `/auth/exchange-token`)
3. **Use JWT** in Authorization header for protected endpoints

---

## 🚨 **Troubleshooting**

### Plugin Won't Activate
- ✅ Check PHP version (requires 7.4+)
- ✅ Check WordPress version (requires 5.8+)
- ✅ Check for PHP syntax errors
- ✅ Check file permissions

### Endpoints Return 404
- ✅ Flush permalinks: Settings → Permalinks → Save
- ✅ Check `.htaccess` file exists and is writable
- ✅ Check REST API is enabled: `https://your-site.com/wp-json/`

### Authentication Not Working
- ✅ Check JWT token is valid (not expired)
- ✅ Check Authorization header format: `Bearer {token}`
- ✅ Check user has correct permissions

### CORS Errors
- ✅ Check allowed origins in plugin code
- ✅ Check server allows CORS headers
- ✅ Check Next.js is making requests to correct URL

---

## 📋 **File Structure After Installation**

After installation, your WordPress should have:
```
wp-content/plugins/akf-learning-dashboard/
├── akf-learning-dashboard.php
├── uninstall.php
├── README.md
└── includes/
    ├── class-autoloader.php
    ├── core/
    │   ├── class-jwt-manager.php
    │   ├── class-rate-limiter.php
    │   ├── class-sso-endpoint.php
    │   └── class-rest-controller.php
    ├── dashboards/
    │   ├── admin/
    │   │   └── class-admin-controller.php
    │   ├── manager/
    │   ├── facilitator/
    │   └── learner/
    ├── helpers/
    │   ├── class-authentication.php
    │   ├── class-session-tracker.php
    │   ├── class-image-upload.php
    │   ├── class-permissions.php
    │   ├── class-utilities.php
    │   └── class-role-mapper.php
    └── shortcodes/
        └── class-dashboard-link.php
```

---

## ✅ **Installation Checklist**

- [ ] Created plugin zip file
- [ ] Uploaded to WordPress
- [ ] Activated plugin
- [ ] Verified no errors
- [ ] Tested at least one endpoint
- [ ] Updated CORS origins (if needed)
- [ ] Tested SSO flow
- [ ] Ready for full testing

---

## 🎯 **Next Steps After Installation**

1. **Run through Testing Checklist** (see `TESTING_CHECKLIST.md`)
2. **Verify all working endpoints** (24 endpoints)
3. **Test with your Next.js frontend**
4. **Once verified, remove API code from theme's functions.php**
5. **Then complete remaining endpoints** (Teams, Reports)

---

**You're ready to install!** 🚀

