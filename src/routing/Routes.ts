/**
 * The app's mount-path prefix, injected at build time.
 *
 * - **Standalone (dev) mode** — Vite defines this as `""` so every route is
 *   root-relative (the app is served directly at `/`).
 *
 * - **Microfrontend (stage/prod) mode** — Webpack's DefinePlugin (fec.config.js)
 *   sets this to `"/openshift/migration-advisor"`. The Chrome's BrowserRouter
 *   has `basename="/"` and mounts the app at this slug, so all navigate() and
 *   <Link to> calls must include the full mount path as a prefix — exactly the
 *   same pattern used by the uhc-portal's `withBasename` / `ocmBaseName`.
 *
 * Using a static build-time constant (rather than reading window.location at
 * call-time) avoids a Chrome-specific race condition where the browser updates
 * window.location synchronously when the back/forward button is pressed, before
 * React finishes its current render cycle. That stale read caused routes.*
 * getters to return root-relative paths like /assessments instead of
 * /openshift/migration-advisor/assessments, crashing the Console.
 */
const APP_BASENAME: string = process.env.MIGRATION_PLANNER_APP_BASENAME ?? "";

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
