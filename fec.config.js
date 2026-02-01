const webpack = require("webpack");

/** @type {import('@redhat-cloud-services/frontend-components-config').FecWebpackConfiguration} */
module.exports = {
  appUrl: "/openshift/migration-assessment",
  debug: true,
  useProxy: true,
  proxyVerbose: true,
  sassPrefix: ".assisted-migration-app, .assistedMigrationApp",
  interceptChromeConfig: false,
  plugins: [
    new webpack.DefinePlugin({
      "process.env.MIGRATION_PLANNER_API_BASE_URL": JSON.stringify(
        process.env.MIGRATION_PLANNER_API_BASE_URL ||
          "/api/migration-assessment",
      ),
      "process.env.MIGRATION_PLANNER_UI_GIT_COMMIT": JSON.stringify(
        process.env.MIGRATION_PLANNER_UI_GIT_COMMIT,
      ),
      "process.env.MIGRATION_PLANNER_UI_VERSION": JSON.stringify(
        process.env.MIGRATION_PLANNER_UI_VERSION,
      ),
    }),
  ],
  hotReload: process.env.HOT === "true",
  moduleFederation: {
    exposes: {
      "./RootApp": "./src/AppEntry",
    },
    exclude: ["react-router-dom"],
    shared: [
      {
        "react-router-dom": {
          singleton: true,
          import: false,
          version: "^6.3.0",
        },
      },
    ],
  },
};
