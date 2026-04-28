/**
 * Known app slugs used by the Console Chrome to mount this microfrontend.
 * Both serve the same RootApp module (see deploy/frontend.yaml).
 */
const APP_SLUG = "/openshift/migration-advisor";
const LEGACY_APP_SLUG = "/openshift/migration-assessment";

/**
 * Lazily cached mount-path prefix.
 *
 * Design rationale
 * ----------------
 * We intentionally do NOT rely on a Webpack DefinePlugin / Vite `define`
 * constant. The FEC (frontend-components-config) build tool owns the
 * `process.env.*` namespace and may substitute an empty string for any env var
 * that is absent from the real process environment — including our constant.
 * If that override fires first, the cache would be seeded with "" and every
 * route would lose its prefix.
 *
 * We also intentionally do NOT read window.location at module-load time.
 * Webpack Module Federation pre-loads federated modules in the background
 * while the user is on a different page (Console home, search, etc.). At that
 * point window.location.pathname is not the app's URL and would return "".
 *
 * Instead, the value is read and cached the first time any `routes.*` getter
 * is accessed. That first access always happens inside a React render, and the
 * Chrome shell only renders the migration-advisor component after it has
 * already navigated to the app's URL — so pathname is guaranteed to be correct.
 *
 * The cache is permanent: `_cachedBasename` is set exactly once and never
 * re-evaluated. This makes it immune to Chrome's synchronous window.location
 * update that occurs before React's render cycle during Back/Forward
 * navigation (the original race-condition bug).
 */
let _cachedBasename: string | null = null;

function getAppBasename(): string {
  if (_cachedBasename !== null) return _cachedBasename;

  try {
    const pathname = window.location.pathname.replace(/^\/(preview|beta)/, "");
    if (pathname.startsWith(APP_SLUG)) return (_cachedBasename = APP_SLUG);
    if (pathname.startsWith(LEGACY_APP_SLUG))
      return (_cachedBasename = LEGACY_APP_SLUG);
  } catch {
    // SSR / test environment without window
  }

  return (_cachedBasename = "");
}

/**
 * Centralized route map.
 *
 * Every path includes the mount-path prefix so that navigate() and <Link to>
 * calls work correctly in both standalone and microfrontend mode.
 * All getters call getAppBasename() which caches on first access.
 */
export const routes = {
  get root() {
    return getAppBasename() || "/";
  },
  get assessments() {
    return `${getAppBasename()}/assessments`;
  },
  assessmentById: (id: string) => `${getAppBasename()}/assessments/${id}`,
  assessmentReport: (id: string) =>
    `${getAppBasename()}/assessments/${id}/report`,
  get assessmentCreate() {
    return `${getAppBasename()}/assessments/create`;
  },
  get exampleReport() {
    return `${getAppBasename()}/assessments/example-report`;
  },
  get environments() {
    return `${getAppBasename()}/environments`;
  },
  get partners() {
    return `${getAppBasename()}/partners`;
  },
  get myPartner() {
    return `${getAppBasename()}/partners/my`;
  },
  get customers() {
    return `${getAppBasename()}/partners/customers`;
  },
  get adminGroups() {
    return `${getAppBasename()}/partners/groups`;
  },
  adminGroupById: (id: string) => `${getAppBasename()}/partners/groups/${id}`,
} as const;
