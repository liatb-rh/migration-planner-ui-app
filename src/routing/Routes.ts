/**
 * Known app slugs used by the Console Chrome to mount this microfrontend.
 * Both serve the same RootApp module (see deploy/frontend.yaml).
 */
const APP_SLUG = "/openshift/migration-advisor";
const LEGACY_APP_SLUG = "/openshift/migration-assessment";

/**
 * Detect the mount-path prefix from window.location.pathname at module-load
 * time. This is safe because the federated module is first imported only after
 * the Chrome shell has already navigated to the app's URL, so pathname is
 * reliably set to the correct value.
 *
 * This is intentionally called ONCE and cached — unlike the old approach that
 * re-read window.location on every routes.* access, this cannot be affected by
 * subsequent URL changes (e.g. Chrome's synchronous update during Back navigation).
 */
function detectBasenameOnLoad(): string {
  try {
    const pathname = window.location.pathname.replace(/^\/(preview|beta)/, "");
    if (pathname.startsWith(APP_SLUG)) return APP_SLUG;
    if (pathname.startsWith(LEGACY_APP_SLUG)) return LEGACY_APP_SLUG;
    return "";
  } catch {
    return ""; // SSR / test environment
  }
}

/**
 * The app's mount-path prefix.
 *
 * Resolution order (first defined value wins):
 *
 * 1. **Build-time injection** — Webpack's DefinePlugin (fec.config.js) sets
 *    `process.env.MIGRATION_PLANNER_APP_BASENAME` to `"/openshift/migration-advisor"`.
 *    Vite (dev/vite.config.ts) sets it to `""` for standalone mode.
 *    This is the primary mechanism and matches the pattern used by the
 *    uhc-portal's `withBasename` / `ocmBaseName`.
 *
 * 2. **Module-load detection fallback** — if the build pipeline did not inject
 *    the constant (e.g. a misconfigured or cached build), we read
 *    window.location.pathname once when the module is first imported. Because
 *    the Chrome shell only imports the federated module after navigating to its
 *    URL, the pathname is correct at this point and will not be affected by any
 *    later navigation events.
 *
 * Either way the result is a stable string constant — never re-computed on
 * subsequent calls — so Chrome's synchronous window.location update during
 * Back/Forward navigation cannot cause routes.* getters to return stale paths.
 */
const APP_BASENAME: string =
  process.env.MIGRATION_PLANNER_APP_BASENAME ?? detectBasenameOnLoad();

/**
 * The app's mount-path prefix at module-load time.
 *
 * @deprecated Use the `routes` object instead. This export exists only for
 * legacy callers; it has the same value as the internal APP_BASENAME constant.
 */
export { APP_BASENAME };

/**
 * Centralized route map.
 *
 * Every path includes the build-time basename prefix so that navigate() and
 * <Link to> calls work correctly in both standalone and microfrontend mode.
 */
export const routes = {
  get root() {
    return APP_BASENAME || "/";
  },
  get assessments() {
    return `${APP_BASENAME}/assessments`;
  },
  assessmentById: (id: string) => `${APP_BASENAME}/assessments/${id}`,
  assessmentReport: (id: string) => `${APP_BASENAME}/assessments/${id}/report`,
  get assessmentCreate() {
    return `${APP_BASENAME}/assessments/create`;
  },
  get exampleReport() {
    return `${APP_BASENAME}/assessments/example-report`;
  },
  get environments() {
    return `${APP_BASENAME}/environments`;
  },
  get partners() {
    return `${APP_BASENAME}/partners`;
  },
  get myPartner() {
    return `${APP_BASENAME}/partners/my`;
  },
  get customers() {
    return `${APP_BASENAME}/partners/customers`;
  },
  get adminGroups() {
    return `${APP_BASENAME}/partners/groups`;
  },
  adminGroupById: (id: string) => `${APP_BASENAME}/partners/groups/${id}`,
} as const;
