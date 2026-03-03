/**
 * Maps frontend route paths to their corresponding backend API paths.
 * This allows a single build to work with multiple deployments.
 */
const ROUTE_TO_API_MAP: Record<string, string> = {
  "/openshift/migration-assessment": "/api/migration-assessment",
  "/openshift/migration-advisor-dev": "/api/migration-advisor-dev",
} as const;

/**
 * Fallback API base URL for local development or when route is not recognized.
 */
const DEFAULT_API_BASE_URL = "/api/migration-assessment";

/**
 * Determines the API base URL at runtime based on the current frontend path.
 *
 * This enables a single build to support multiple deployments (e.g., stage and dev)
 * by detecting the frontend route and mapping it to the appropriate backend API.
 *
 * @returns The API base URL for the current deployment
 */
export function resolveApiBaseUrl(): string {
  try {
    // Strip known Chrome preview/beta prefixes before matching (only full path segments)
    const pathname = window.location.pathname.replace(
      /^\/(preview|beta)(?=\/|$)/,
      "",
    );

    // Check each known route pattern (match full path segments only)
    for (const [route, apiPath] of Object.entries(ROUTE_TO_API_MAP)) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        return apiPath;
      }
    }

    // Fallback for local development or unknown routes
    // If MIGRATION_PLANNER_API_BASE_URL is set at build time, use it
    if (process.env.MIGRATION_PLANNER_API_BASE_URL) {
      return process.env.MIGRATION_PLANNER_API_BASE_URL;
    }

    return DEFAULT_API_BASE_URL;
  } catch {
    // SSR / test environment without DOM - use build-time variable or fallback
    return process.env.MIGRATION_PLANNER_API_BASE_URL || DEFAULT_API_BASE_URL;
  }
}
