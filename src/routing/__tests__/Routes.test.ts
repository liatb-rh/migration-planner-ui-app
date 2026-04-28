import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Re-import Routes with a specific MIGRATION_PLANNER_APP_BASENAME value.
 *
 * Because the basename is lazily cached on the first routes.* access, we must
 * reset the module registry so that the cache (_cachedBasename) starts as null
 * again, then stub the env var before the first access.
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

  beforeEach(async () => {
    ({ routes } = await importRoutesWithBasename(""));
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

  beforeEach(async () => {
    ({ routes } = await importRoutesWithBasename(BASE));
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
// Fallback — env var not injected by DefinePlugin (e.g. misconfigured build)
// ---------------------------------------------------------------------------

describe("Fallback — env var absent, basename detected lazily from window.location", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: "/" },
      writable: true,
      configurable: true,
    });
  });

  it("detects /openshift/migration-advisor when routes are first accessed", async () => {
    const BASE = "/openshift/migration-advisor";

    // Set the URL to simulate Chrome shell having already navigated here
    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: `${BASE}/assessments` },
      writable: true,
      configurable: true,
    });

    // Do NOT stub env var — simulate DefinePlugin not having injected it
    vi.resetModules();
    vi.unstubAllEnvs();
    const { routes } = await import("../Routes");

    // First routes.* access triggers lazy detection
    expect(routes.assessments).toBe(`${BASE}/assessments`);
    expect(routes.root).toBe(BASE);
  });

  it("strips /preview prefix before detecting the slug", async () => {
    const BASE = "/openshift/migration-advisor";
    Object.defineProperty(window, "location", {
      value: {
        ...window.location,
        pathname: `/preview${BASE}/assessments`,
      },
      writable: true,
      configurable: true,
    });

    vi.resetModules();
    vi.unstubAllEnvs();
    const { routes } = await import("../Routes");

    expect(routes.assessments).toBe(`${BASE}/assessments`);
  });

  it("returns root-relative paths when pathname does not match any known slug", async () => {
    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: "/" },
      writable: true,
      configurable: true,
    });

    vi.resetModules();
    vi.unstubAllEnvs();
    const { routes } = await import("../Routes");

    expect(routes.assessments).toBe("/assessments");
    expect(routes.root).toBe("/");
  });
});

// ---------------------------------------------------------------------------
// Stability — once cached the value never changes regardless of URL changes
// ---------------------------------------------------------------------------

describe("Stability — basename is cached after first access", () => {
  it("routes stay stable when window.location changes after first access", async () => {
    const BASE = "/openshift/migration-advisor";
    const { routes } = await importRoutesWithBasename(BASE);

    // First access — cache is populated
    expect(routes.assessments).toBe(`${BASE}/assessments`);

    // Simulate Chrome updating window.location before React finishes rendering
    // (back-button race condition). With lazy caching this has no effect.
    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: "/openshift/" },
      writable: true,
      configurable: true,
    });

    // Cached value must be unchanged
    expect(routes.assessments).toBe(`${BASE}/assessments`);
  });
});
