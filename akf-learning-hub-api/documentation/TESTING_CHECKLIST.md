# Testing Checklist
## Before Completing Remaining Functionalities

## 📦 **Plugin Installation**

### Step 1: Create Plugin Zip
1. Zip the entire plugin folder (all files in `akf-learning-hub-api/`)
2. Name it: `akf-learning-dashboard.zip`
3. **Important**: Zip the contents, not the folder itself

**Correct Structure:**
```
akf-learning-dashboard.zip
├── akf-learning-dashboard.php
├── uninstall.php
├── README.md
└── includes/
    └── ...
```

**Wrong Structure:**
```
akf-learning-dashboard.zip
└── akf-learning-hub-api/
    ├── akf-learning-dashboard.php
    └── ...
```

### Step 2: Install in WordPress
1. Go to WordPress Admin → Plugins → Add New
2. Click "Upload Plugin"
3. Choose `akf-learning-dashboard.zip`
4. Click "Install Now"
5. Click "Activate Plugin"

### Step 3: Verify Installation
- ✅ Check that plugin appears in Plugins list
- ✅ Check that no PHP errors appear
- ✅ Check WordPress debug log (if WP_DEBUG is enabled)

---

## 🧪 **Testing Checklist**

### Core Authentication (Test First!)

#### 1. SSO Token Generation
- [ ] **Test**: `POST /wp-json/custom-api/v1/auth/generate-sso-token`
- [ ] **Expected**: Returns `{success: true, token: "...", expires_in: 60}`
- [ ] **Note**: Requires WordPress login session

#### 2. SSO Token Exchange
- [ ] **Test**: `POST /wp-json/custom-api/v1/auth/exchange-token` with token from step 1
- [ ] **Expected**: Returns JWT token and user data
- [ ] **Note**: Use token from step 1

#### 3. JWT Token Validation
- [ ] **Test**: `POST /wp-json/custom-api/v1/auth/validate` with JWT from step 2
- [ ] **Expected**: Returns `{success: true, valid: true, user: {...}}`

#### 4. JWT Token Refresh
- [ ] **Test**: `POST /wp-json/custom-api/v1/auth/refresh` with JWT
- [ ] **Expected**: Returns new JWT token

---

### User Endpoints

#### 5. Users Count
- [ ] **Test**: `GET /wp-json/custom-api/v1/users-count`
- [ ] **Expected**: Returns user counts by role, active courses/teams
- [ ] **Test with**: `?period=1month`

#### 6. Users List
- [ ] **Test**: `GET /wp-json/custom-api/v1/users/list`
- [ ] **Expected**: Returns paginated user list
- [ ] **Test with**: `?page=1&per_page=10&search=test&role=learner`

#### 7. User Details
- [ ] **Test**: `GET /wp-json/custom-api/v1/users/1` (replace 1 with real user ID)
- [ ] **Expected**: Returns detailed user information

#### 8. Update User
- [ ] **Test**: `PUT /wp-json/custom-api/v1/users/1` with JSON body
- [ ] **Expected**: Updates user and returns updated data
- [ ] **Requires**: JWT token with admin permissions

#### 9. Delete User
- [ ] **Test**: `DELETE /wp-json/custom-api/v1/users/1`
- [ ] **Expected**: Deletes user (be careful!)
- [ ] **Requires**: JWT token with admin permissions

---

### Course Endpoints

#### 10. Courses List
- [ ] **Test**: `GET /wp-json/custom-api/v1/courses`
- [ ] **Expected**: Returns list of courses
- [ ] **Test with**: `?page=1&per_page=10&search=test`

#### 11. Course Completion Rate
- [ ] **Test**: `GET /wp-json/custom-api/v1/course-completion-rate`
- [ ] **Expected**: Returns completion statistics
- [ ] **Requires**: LearnDash active

#### 12. Top Courses
- [ ] **Test**: `GET /wp-json/custom-api/v1/top-courses`
- [ ] **Expected**: Returns top 5 courses by enrollment
- [ ] **Requires**: LearnDash active

---

### Settings Endpoints

#### 13. Get General Settings
- [ ] **Test**: `GET /wp-json/custom-api/v1/settings/general`
- [ ] **Expected**: Returns current admin's settings
- [ ] **Requires**: JWT token with admin permissions

#### 14. Update General Settings
- [ ] **Test**: `PUT /wp-json/custom-api/v1/settings/general` with JSON body
- [ ] **Expected**: Updates settings and returns updated data
- [ ] **Test with**: `{"organisationName": "Test Org"}`

#### 15. Get Course Settings
- [ ] **Test**: `GET /wp-json/custom-api/v1/settings/course`
- [ ] **Expected**: Returns course settings

#### 16. Update Course Settings
- [ ] **Test**: `PUT /wp-json/custom-api/v1/settings/course` with JSON body
- [ ] **Expected**: Updates course settings

---

### Session Endpoints

#### 17. Get Login Sessions
- [ ] **Test**: `GET /wp-json/custom-api/v1/sessions`
- [ ] **Expected**: Returns list of active sessions
- [ ] **Requires**: JWT token (any authenticated user)

#### 18. Delete Login Session
- [ ] **Test**: `DELETE /wp-json/custom-api/v1/sessions/{session_id}`
- [ ] **Expected**: Deletes specified session
- [ ] **Note**: Cannot delete current session

#### 19. Logout All Sessions
- [ ] **Test**: `POST /wp-json/custom-api/v1/sessions/logout-all`
- [ ] **Expected**: Logs out all sessions except current

---

### Shortcode

#### 20. Dashboard Link Shortcode
- [ ] **Test**: Add `[dashboard_link]` to a WordPress page/post
- [ ] **Expected**: Button appears that generates SSO token on click
- [ ] **Test**: Click button and verify redirect to dashboard with token

---

## 🔍 **Common Issues to Check**

### If Endpoints Return 404
- ✅ Check that plugin is activated
- ✅ Check that permalinks are flushed (Settings → Permalinks → Save)
- ✅ Check WordPress REST API is enabled

### If Authentication Fails
- ✅ Check JWT token is in Authorization header: `Bearer {token}`
- ✅ Check token hasn't expired (2 hours default)
- ✅ Check user has correct permissions

### If CORS Errors
- ✅ Check allowed origins in `akf-learning-dashboard.php` (line ~200)
- ✅ Add your Next.js URL to allowed origins if needed

### If LearnDash Functions Fail
- ✅ Check LearnDash plugin is active
- ✅ Check LearnDash database tables exist

---

## 📝 **Testing Tools**

### Recommended Tools:
1. **Postman** - For API testing
2. **Browser DevTools** - For checking network requests
3. **WordPress REST API Tester Plugin** - Optional helper

### Example Postman Setup:
```
Method: GET
URL: https://your-site.com/wp-json/custom-api/v1/users-count
Headers:
  Authorization: Bearer {your_jwt_token}
```

---

## ✅ **After Testing**

Once you've verified all working endpoints:

1. ✅ Document any issues found
2. ✅ Note any differences from expected behavior
3. ✅ Then proceed to complete remaining endpoints (Teams, Reports)

---

## 🚨 **Important Notes**

- **Backup First**: Always backup your WordPress site before testing
- **Test Environment**: Consider testing on staging first
- **Keep Theme Code**: Don't remove code from theme's functions.php until plugin is fully tested
- **JWT Tokens**: Tokens expire after 2 hours by default

---

## 📊 **Expected Results**

If everything works correctly:
- ✅ All 24 working endpoints should return data
- ✅ All 8 placeholder endpoints should return 501 (Not Implemented)
- ✅ Authentication should work seamlessly
- ✅ No PHP errors in debug log

**Good luck with testing!** 🚀

