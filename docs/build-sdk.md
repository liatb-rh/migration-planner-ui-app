# Local SDK Development Guide

This guide explains how to build and use a local version of `@openshift-migration-advisor/planner-sdk` for development and testing.

## Quick Reference

```bash
# Build and install local SDK
npm run build-local-sdk

# Verify the installation
npm ls @openshift-migration-advisor/planner-sdk

# Restore published version
npm install --force
```

## Quick Start

To generate and link the local SDK from your OpenAPI specification:

```bash
# Using npm script (recommended)
npm run build-local-sdk

# Or directly with the script
./scripts/build_sdk.sh ../migration-planner/api/v1alpha1/openapi.yaml
```

This script will:

1. Generate a TypeScript client from your OpenAPI spec
2. Install dependencies
3. Build the SDK
4. Replace the SDK in node_modules with the local version

## Usage

### Generate and Link Local SDK

```bash
# Using npm script with default path (recommended)
npm run build-local-sdk

# Or using the script directly with the default path
./scripts/build_sdk.sh ../migration-planner/api/v1alpha1/openapi.yaml

# Using a custom OpenAPI spec path
./scripts/build_sdk.sh /path/to/your/openapi.yaml
```

### Verify the Installation

After running the script, verify that the local SDK is installed:

```bash
npm ls @openshift-migration-advisor/planner-sdk
```

You should see the version matching your package.json from `node_modules/@openshift-migration-advisor/planner-sdk`.

### Restore Published Version

When you're done testing with the local SDK:

```bash
npm install --force
```

This will restore the published version from the npm registry.

## Development Workflow

1. **Make changes** to the OpenAPI spec in the planner repository
2. **Rebuild** the local SDK:
   ```bash
   npm run build-local-sdk
   ```
3. **Restart** your dev server to pick up the changes:
   ```bash
   npm run start
   ```

## Directory Structure

```text
migration-planner-ui-app/
├── scripts/
│   └── build_sdk.sh        # SDK generation script
└── package.json
```

## Troubleshooting

### "OpenAPI spec file not found"

Make sure the path to your OpenAPI spec is correct. The default path assumes the `migration-planner` repository is in the same parent directory as this project.

### Changes Not Reflected

If you make changes to the OpenAPI spec and they're not reflected in your app:

1. Rebuild the SDK: `npm run build-local-sdk`
2. Restart your dev server
3. Clear your browser cache if needed

## Notes

- The local SDK replaces the published version in `node_modules/`, so VSCode will open the local source files
- To make further changes, regenerate the SDK with `npm run build-local-sdk`
