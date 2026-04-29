#!/bin/bash

set -e

# Check if OpenAPI spec path is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_openapi_spec>"
  echo "Example: $0 ../migration-planner/api/v1alpha1/openapi.yaml"
  exit 1
fi

OPENAPI_SPEC="$1"
SDK_OUTPUT_DIR="dev/planner-sdk"
PACKAGE_NAME="@openshift-migration-advisor/planner-sdk"

# Read the package version from package.json
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found"
  exit 1
fi

PACKAGE_VERSION=$(node -pe "require('./package.json').dependencies['$PACKAGE_NAME']" | tr -d '^~')

if [ -z "$PACKAGE_VERSION" ]; then
  echo "Error: Could not find $PACKAGE_NAME in package.json dependencies"
  exit 1
fi

# Check if OpenAPI spec exists
if [ ! -f "$OPENAPI_SPEC" ]; then
  echo "Error: OpenAPI spec file not found: $OPENAPI_SPEC"
  exit 1
fi

echo "🔧 Generating SDK from: $OPENAPI_SPEC"

# Clean up previous generated SDK
if [ -d "$SDK_OUTPUT_DIR" ]; then
  echo "🧹 Cleaning up previous SDK..."
  rm -rf "$SDK_OUTPUT_DIR"
fi

# Generate the SDK using OpenAPI Generator
echo "📦 Generating TypeScript client..."
npx openapi-generator-cli generate \
  -i "$OPENAPI_SPEC" \
  -g typescript-fetch \
  -o "$SDK_OUTPUT_DIR" \
  --additional-properties="npmName=$PACKAGE_NAME,npmVersion=$PACKAGE_VERSION,ensureUniqueParams=true,supportsES6=true,withInterfaces=true,importFileExtension=.js"

# Navigate to generated SDK directory
cd "$SDK_OUTPUT_DIR"

echo "📥 Installing SDK dependencies..."
npm install

# Build the SDK if there's a build script
if grep -q '"build"' package.json; then
  echo "🔨 Building SDK..."
  npm run build
fi

# Go back to project root
cd - > /dev/null

# Replace the SDK in node_modules
SDK_NODE_MODULES_PATH="node_modules/$PACKAGE_NAME"
echo "📦 Replacing SDK in node_modules..."

# Remove existing SDK in node_modules
if [ -d "$SDK_NODE_MODULES_PATH" ]; then
  rm -rf "$SDK_NODE_MODULES_PATH"
fi

# Move the generated SDK to node_modules
mkdir -p "$(dirname "$SDK_NODE_MODULES_PATH")"
mv "$SDK_OUTPUT_DIR" "$SDK_NODE_MODULES_PATH"

# Clear Vite cache to ensure the new SDK is loaded
if [ -d "node_modules/.vite" ]; then
  echo "🧹 Clearing Vite cache..."
  rm -rf node_modules/.vite
fi

# Clean up openapitools.json if it was created
if [ -f "openapitools.json" ]; then
  echo "🧹 Cleaning up openapitools.json..."
  rm openapitools.json
fi

echo "✅ Local SDK successfully installed in node_modules!"
echo ""
echo "The SDK version $PACKAGE_VERSION has been replaced in node_modules."
echo "To restore the published version, run: npm install --force"
