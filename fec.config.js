const assert = require("node:assert");
const webpack = require("webpack");
const dependencies = require("./package.json").dependencies;

assert(
  process.env.MIGRATION_PLANNER_API_BASE_URL,
  "MIGRATION_PLANNER_API_BASE_URL is required",
);

const getRoutes = () => {
  const routes = {};

  if (process.env.OMA_LIGHTSPEED_URL) {
    routes["/api/oma-lightspeed/"] = {
      host: process.env.OMA_LIGHTSPEED_URL,
    };
  }

  return Object.keys(routes).length > 0 ? routes : undefined;
};

/** @type {import('@redhat-cloud-services/frontend-components-config').FecWebpackConfiguration} */
module.exports = {
  appUrl: "/openshift/migration-advisor",
  debug: true,
  useProxy: true,
  proxyVerbose: true,
  sassPrefix: ".assisted-migration-app, .assistedMigrationApp",
  interceptChromeConfig: false,
  routes: getRoutes(),
  plugins: [
    new webpack.DefinePlugin({
      "process.env.MIGRATION_PLANNER_API_BASE_URL": JSON.stringify(
        process.env.MIGRATION_PLANNER_API_BASE_URL,
      ),
      "process.env.MIGRATION_PLANNER_UI_GIT_COMMIT": JSON.stringify(
        process.env.MIGRATION_PLANNER_UI_GIT_COMMIT,
      ),
      "process.env.MIGRATION_PLANNER_UI_VERSION": JSON.stringify(
        process.env.MIGRATION_PLANNER_UI_VERSION,
      ),
      // Static mount-path prefix — consumed by src/routing/Routes.ts.
      // Must match appUrl in this file. In standalone (Vite) mode this is
      // defined as "" in dev/vite.config.ts.
      "process.env.MIGRATION_PLANNER_APP_BASENAME": JSON.stringify(
        "/openshift/migration-advisor",
      ),
      "process.env.OMA_LIGHTSPEED_URL": JSON.stringify(
        process.env.OMA_LIGHTSPEED_URL || "",
      ),
      "process.env.CHAT_API_URL": JSON.stringify(
        process.env.CHAT_API_URL || "",
      ),
    }),
    // Prevent EMFILE (too many open files) by excluding node_modules from
    // webpack's file-system watcher.  The FEC-generated config sets no
    // watchOptions, so without this patch watchpack opens OS-level watchers
    // for every file in node_modules.
    {
      apply(compiler) {
        compiler.options.watchOptions = {
          ...compiler.options.watchOptions,
          ignored: ["**/node_modules/**", "**/build-tools/**"],
        };
      },
    },
  ],
  hotReload: process.env.HOT === "true",
  moduleFederation: {
    exposes: {
      "./RootApp": "./src/MainApp",
    },
    exclude: ["react-router-dom"],
    shared: [
      {
        "react-router-dom": {
          singleton: true,
          import: false,
          version: dependencies["react-router-dom"],
        },
      },
    ],
  },
};
