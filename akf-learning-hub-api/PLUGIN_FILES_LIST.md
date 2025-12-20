# Files to Include in Plugin Zip

## ✅ MUST INCLUDE (Essential Plugin Files)

### Root Files:
- `akf-learning-dashboard.php` - Main plugin file (REQUIRED)
- `uninstall.php` - Plugin uninstall handler
- `README.md` - Plugin documentation (optional but recommended)

### Includes Directory (Complete):
```
includes/
├── class-autoloader.php
├── admin/
│   └── class-settings-page.php
├── core/
│   ├── class-jwt-manager.php
│   ├── class-rate-limiter.php
│   ├── class-rest-controller.php
│   └── class-sso-endpoint.php
├── dashboards/
│   ├── admin/
│   │   └── class-admin-controller.php
│   ├── facilitator/
│   │   └── class-facilitator-controller.php
│   ├── learner/
│   │   └── class-learner-controller.php
│   └── manager/
│       └── class-manager-controller.php
├── helpers/
│   ├── class-authentication.php
│   ├── class-image-upload.php
│   ├── class-permissions.php
│   ├── class-role-mapper.php
│   ├── class-session-tracker.php
│   └── class-utilities.php
└── shortcodes/
    └── class-dashboard-link.php
```

## ❌ DO NOT INCLUDE (Development/Reference Files)

- `documentation/` folder - Development documentation
- `reference-code/` folder - Original functions.php reference
- `.gitignore` - Git configuration file
- `.git/` directory - Git repository data
- `.vscode/`, `.idea/` - IDE configuration files
- `*.log` files - Log files
- `node_modules/` - Node.js dependencies (if any)
- `vendor/` - Composer dependencies (if any)

## 📦 Final Plugin Structure

When zipped, your plugin should have this structure:

```
akf-learning-dashboard/
├── akf-learning-dashboard.php
├── uninstall.php
├── README.md
└── includes/
    ├── class-autoloader.php
    ├── admin/
    │   └── class-settings-page.php
    ├── core/
    │   ├── class-jwt-manager.php
    │   ├── class-rate-limiter.php
    │   ├── class-rest-controller.php
    │   └── class-sso-endpoint.php
    ├── dashboards/
    │   ├── admin/
    │   ├── facilitator/
    │   ├── learner/
    │   └── manager/
    ├── helpers/
    │   ├── class-authentication.php
    │   ├── class-image-upload.php
    │   ├── class-permissions.php
    │   ├── class-role-mapper.php
    │   ├── class-session-tracker.php
    │   └── class-utilities.php
    └── shortcodes/
        └── class-dashboard-link.php
```

## 🚀 Quick Zip Creation Instructions

### Option 1: Manual Selection
1. Create a new folder named `akf-learning-dashboard`
2. Copy the files listed above into this folder
3. Zip the `akf-learning-dashboard` folder
4. The zip file should be named `akf-learning-dashboard.zip`

### Option 2: Using Command Line (Windows PowerShell)
```powershell
# Create plugin directory structure
New-Item -ItemType Directory -Path "akf-learning-dashboard" -Force
New-Item -ItemType Directory -Path "akf-learning-dashboard\includes" -Force
New-Item -ItemType Directory -Path "akf-learning-dashboard\includes\admin" -Force
New-Item -ItemType Directory -Path "akf-learning-dashboard\includes\core" -Force
New-Item -ItemType Directory -Path "akf-learning-dashboard\includes\dashboards\admin" -Force
New-Item -ItemType Directory -Path "akf-learning-dashboard\includes\dashboards\facilitator" -Force
New-Item -ItemType Directory -Path "akf-learning-dashboard\includes\dashboards\learner" -Force
New-Item -ItemType Directory -Path "akf-learning-dashboard\includes\dashboards\manager" -Force
New-Item -ItemType Directory -Path "akf-learning-dashboard\includes\helpers" -Force
New-Item -ItemType Directory -Path "akf-learning-dashboard\includes\shortcodes" -Force

# Copy files
Copy-Item "akf-learning-dashboard.php" "akf-learning-dashboard\"
Copy-Item "uninstall.php" "akf-learning-dashboard\"
Copy-Item "README.md" "akf-learning-dashboard\"
Copy-Item "includes\*" "akf-learning-dashboard\includes\" -Recurse -Exclude "*.md"

# Create zip
Compress-Archive -Path "akf-learning-dashboard" -DestinationPath "akf-learning-dashboard.zip" -Force
```

### Option 3: Using Command Line (Git Bash / Linux)
```bash
# Create plugin directory
mkdir -p akf-learning-dashboard/includes/{admin,core,dashboards/{admin,facilitator,learner,manager},helpers,shortcodes}

# Copy files
cp akf-learning-dashboard.php uninstall.php README.md akf-learning-dashboard/
cp includes/*.php akf-learning-dashboard/includes/
cp -r includes/admin akf-learning-dashboard/includes/
cp -r includes/core akf-learning-dashboard/includes/
cp -r includes/dashboards akf-learning-dashboard/includes/
cp -r includes/helpers akf-learning-dashboard/includes/
cp -r includes/shortcodes akf-learning-dashboard/includes/

# Create zip
zip -r akf-learning-dashboard.zip akf-learning-dashboard/
```

