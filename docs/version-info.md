# Version Information

This document explains how to view version information for the Migration Planner UI application.

## Viewing Version in Browser

1. Open the Migration Planner UI in your browser
2. Open Browser Developer Tools (F12 or right-click → Inspect)
3. Go to the **Console** tab
4. Type one of the following commands:

### Option 1: View via Window Object

```javascript
window.__MIGRATION_PLANNER_VERSION__;
```

This will display the complete version information object with UI and API versions.

### Option 2: View via Document Object Model Element

In the **Elements/Inspector** tab, search for the element with id `migration-planner-version-info`. You'll see version data in the element's attributes:

- `data-ui-name`
- `data-ui-version`
- `data-ui-git-commit`
- `data-api-name`
- `data-api-version`
- `data-api-git-commit`

Or access it via console:

```javascript
document.getElementById("migration-planner-version-info");
```

## What Version Information is Available

- **UI Name**: Application name (migration-planner-ui-app)
- **UI Version**: Version number or git tag
- **UI Git Commit**: Git commit hash from when it was built
- **API Name**: Backend API name (migration-planner)
- **API Version**: Backend API version (fetched from `/api/migration-assessment/info`)
- **API Git Commit**: Backend API git commit hash
