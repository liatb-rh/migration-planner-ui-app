import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Re-import Routes with a specific MIGRATION_PLANNER_APP_BASENAME value.
 *
 * Because APP_BASENAME is a module-level constant (computed once on import),
 * we must reset the module registry and re-import after stubbing the env var.
 */
async function importRoutesWithBasename(basename: string) {
  vi.resetModules();
  vi.stubEnv("MIGRATION_PLANNER_APP_BASENAME", basename);
  return import("../Routes");
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

// ---------------------------------------------------------------------------
// Standalone mode (dev) — env var is "" (Vite sets it to empty string)
// ---------------------------------------------------------------------------

describe("Standalone mode (dev) — APP_BASENAME is empty", () => {
  let routes: Awaited<ReturnType<typeof importRoutesWithBasename>>["routes"];
  let APP_BASENAME: string;

  beforeEach(async () => {
    ({ routes, APP_BASENAME } = await importRoutesWithBasename(""));
  });

  it("APP_BASENAME is empty", () => {
    expect(APP_BASENAME).toBe("");
  });

  it("routes.root returns /", () => {
    expect(routes.root).toBe("/");
  });

  it("routes.assessments returns /assessments", () => {
    expect(routes.assessments).toBe("/assessments");
  });

  it("routes.assessmentById returns /assessments/:id", () => {
    expect(routes.assessmentById("test-123")).toBe("/assessments/test-123");
  });

  it("routes.assessmentReport returns /assessments/:id/report", () => {
    expect(routes.assessmentReport("test-123")).toBe(
      "/assessments/test-123/report",
    );
  });

  it("routes.assessmentCreate returns /assessments/create", () => {
    expect(routes.assessmentCreate).toBe("/assessments/create");
  });

  it("routes.exampleReport returns /assessments/example-report", () => {
    expect(routes.exampleReport).toBe("/assessments/example-report");
  });

  it("routes.environments returns /environments", () => {
    expect(routes.environments).toBe("/environments");
  });

  it("routes.partners returns /partners", () => {
    expect(routes.partners).toBe("/partners");
  });
});

// ---------------------------------------------------------------------------
// Microfrontend mode (stage/prod) — Webpack injects the full slug
// ---------------------------------------------------------------------------

describe("Microfrontend mode (stage/prod) — APP_BASENAME is /openshift/migration-advisor", () => {
  const BASE = "/openshift/migration-advisor";

  let routes: Awaited<ReturnType<typeof importRoutesWithBasename>>["routes"];
  let APP_BASENAME: string;

  beforeEach(async () => {
    ({ routes, APP_BASENAME } = await importRoutesWithBasename(BASE));
  });

  it("APP_BASENAME matches the app slug", () => {
    expect(APP_BASENAME).toBe(BASE);
  });

  it("routes.root returns the basename", () => {
    expect(routes.root).toBe(BASE);
  });

  it("routes.assessments includes basename", () => {
    expect(routes.assessments).toBe(`${BASE}/assessments`);
  });

  it("routes.assessmentById includes basename", () => {
    expect(routes.assessmentById("test-123")).toBe(
      `${BASE}/assessments/test-123`,
    );
  });

  it("routes.assessmentReport includes basename", () => {
    expect(routes.assessmentReport("test-123")).toBe(
      `${BASE}/assessments/test-123/report`,
    );
  });

  it("routes.assessmentCreate includes basename", () => {
    expect(routes.assessmentCreate).toBe(`${BASE}/assessments/create`);
  });

  it("routes.exampleReport includes basename", () => {
    expect(routes.exampleReport).toBe(`${BASE}/assessments/example-report`);
  });

  it("routes.environments includes basename", () => {
    expect(routes.environments).toBe(`${BASE}/environments`);
  });

  it("routes.partners includes basename", () => {
    expect(routes.partners).toBe(`${BASE}/partners`);
  });

  it("routes.myPartner includes basename", () => {
    expect(routes.myPartner).toBe(`${BASE}/partners/my`);
  });

  it("routes.adminGroupById includes basename", () => {
    expect(routes.adminGroupById("g-1")).toBe(`${BASE}/partners/groups/g-1`);
  });
});

// ---------------------------------------------------------------------------
// Stability — routes never change mid-session (no window.location dependency)
// ---------------------------------------------------------------------------

describe("Stability — APP_BASENAME is a static constant", () => {
  it("routes stay stable regardless of window.location changes", async () => {
    const BASE = "/openshift/migration-advisor";
    const { routes } = await importRoutesWithBasename(BASE);

    // Routes are correct when the app is active.
    expect(routes.assessments).toBe(`${BASE}/assessments`);

    // Simulate Chrome updating window.location before React finishes rendering
    // (back-button race condition). With a static constant this has no effect.
    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: "/openshift/" },
      writable: true,
      configurable: true,
    });

    // Routes must be unchanged — they do not read window.location.
    expect(routes.assessments).toBe(`${BASE}/assessments`);
  });
});
