import assert from "node:assert";
import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv, type UserConfig } from "vite";

const DEFAULT_TARGET_HOST = "http://localhost:3443";
const DEFAULT_CHAT_API_HOST = "http://localhost:8081";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(process.cwd(), ".."), [
    "VITE_",
    "MIGRATION_PLANNER_",
    "CHAT_",
  ]);

  assert(
    env.MIGRATION_PLANNER_API_BASE_URL,
    "MIGRATION_PLANNER_API_BASE_URL is required",
  );

  /**
   * Stage cluster: https://migration-planner-assisted-migration-stage.apps.crcs02ue1.urby.p1.openshiftapps.com
   *
   * Keeping this around for reference only. Theoretically we could use this to redirect to the stage cluster
   * for local development as well. However to hit this endpoint API calls need to be authenticated.
   */
  const target = env.MIGRATION_PLANNER_TARGET_HOST ?? DEFAULT_TARGET_HOST;
  const chatApiUrl = env.CHAT_API_URL ?? "/api/chat/v1/query";
  const chatApiTarget = env.CHAT_API_TARGET_HOST ?? DEFAULT_CHAT_API_HOST;

  const config: UserConfig = {
    plugins: [react()],
    define: {
      "process.env.MIGRATION_PLANNER_API_BASE_URL": JSON.stringify(
        env.MIGRATION_PLANNER_API_BASE_URL,
      ),
      "process.env.MIGRATION_PLANNER_UI_GIT_COMMIT": JSON.stringify(
        env.MIGRATION_PLANNER_UI_GIT_COMMIT,
      ),
      "process.env.MIGRATION_PLANNER_UI_VERSION": JSON.stringify(
        env.MIGRATION_PLANNER_UI_VERSION,
      ),
      // Standalone dev mode — app is served at "/", no mount-path prefix.
      // The microfrontend (Webpack) build sets this to "/openshift/migration-advisor"
      // via fec.config.js DefinePlugin. See src/routing/Routes.ts.
      "process.env.MIGRATION_PLANNER_APP_BASENAME": JSON.stringify(""),
      "process.env.CHAT_API_URL": JSON.stringify(chatApiUrl),
      "process.env.OMA_LIGHTSPEED_URL": JSON.stringify(""),
    },
    resolve: {
      alias: {
        "@redhat-cloud-services/frontend-components/useChrome": path.resolve(
          __dirname,
          "src/mocks/useChrome.ts",
        ),
        "@redhat-cloud-services/frontend-components-notifications":
          path.resolve(__dirname, "src/mocks/notifications.tsx"),
        "@redhat-cloud-services/frontend-components-utilities": path.resolve(
          __dirname,
          "src/mocks/utilities.ts",
        ),
      },
    },
    server: {
      port: 3000,
      proxy: {
        [`${env.MIGRATION_PLANNER_API_BASE_URL}/api/v1/cost-estimation`]: {
          target: "http://localhost:9205",
          secure: false,
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(
              new RegExp(`^${env.MIGRATION_PLANNER_API_BASE_URL}`),
              "",
            ),
        },
        [env.MIGRATION_PLANNER_API_BASE_URL]: {
          target,
          secure: false,
          changeOrigin: true,
          rewrite: (path: string) =>
            target === DEFAULT_TARGET_HOST
              ? path.replace(
                  new RegExp(`^${process.env.MIGRATION_PLANNER_API_BASE_URL}`),
                  "",
                )
              : path,
        },
        "/api/chat": {
          target: chatApiTarget,
          secure: false,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api\/chat/, ""),
        },
      },
    },
  };

  return config;
});
