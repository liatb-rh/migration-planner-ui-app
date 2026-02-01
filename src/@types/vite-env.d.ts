/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    MIGRATION_PLANNER_API_BASE_URL?: string;
    MIGRATION_PLANNER_UI_VERSION?: string;
    MIGRATION_PLANNER_UI_GIT_COMMIT?: string;
  }
}
