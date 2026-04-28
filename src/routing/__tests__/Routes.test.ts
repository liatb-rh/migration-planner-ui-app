import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Set window.location.pathname, reset the module registry so that the lazy
 * cache (_cachedBasename) starts as null, then re-import Routes.
 *
 * The pathname must be set BEFORE import so that the first routes.* access
 * (which triggers lazy detection) reads the correct value.
 */
async function importRoutesAtPathname(pathname: string) {
  Object.defineProperty(window, "location", {
    value: { ...window.location, pathname },
    writable: true,
    configurable: true,
  });
  vi.resetModules();
  return import("../Routes");
}

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: { ...window.location, pathname: "/" },
    writable: true,
    configurable: true,
  });
  vi.resetModules();
});

// ---------------------------------------------------------------------------
// Standalone mode — URL is "/" (no Console Chrome prefix)
// ---------------------------------------------------------------------------

describe("Standalone mode — pathname is /", () => {
  let routes: Awaited<ReturnType<typeof importRoutesAtPathname>>["routes"];

  beforeEach(async () => {
    ({ routes } = await importRoutesAtPathname("/"));
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
// Microfrontend mode — URL starts with /openshift/migration-advisor
// ---------------------------------------------------------------------------

describe("Microfrontend mode — pathname starts with /openshift/migration-advisor", () => {
  const BASE = "/openshift/migration-advisor";

  let routes: Awaited<ReturnType<typeof importRoutesAtPathname>>["routes"];

  beforeEach(async () => {
    ({ routes } = await importRoutesAtPathname(`${BASE}/assessments`));
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
// Legacy slug — /openshift/migration-assessment
// ---------------------------------------------------------------------------

describe("Legacy slug — pathname starts with /openshift/migration-assessment", () => {
  it("routes.assessments uses the legacy basename", async () => {
    const { routes } = await importRoutesAtPathname(
      "/openshift/migration-assessment/assessments",
    );
    expect(routes.assessments).toBe(
      "/openshift/migration-assessment/assessments",
    );
  });
});

// ---------------------------------------------------------------------------
// /preview prefix — stage environments use /preview/openshift/...
// ---------------------------------------------------------------------------

describe("/preview prefix — stage pathname includes /preview", () => {
  it("strips /preview and detects the correct basename", async () => {
    const BASE = "/openshift/migration-advisor";
    const { routes } = await importRoutesAtPathname(
      `/preview${BASE}/assessments`,
    );
    expect(routes.assessments).toBe(`${BASE}/assessments`);
    expect(routes.root).toBe(BASE);
  });
});

// ---------------------------------------------------------------------------
// Stability — cached value never recomputed after first access
// ---------------------------------------------------------------------------

describe("Stability — basename is cached after the first routes.* access", () => {
  it("routes remain stable when window.location changes after first access", async () => {
    const BASE = "/openshift/migration-advisor";
    const { routes } = await importRoutesAtPathname(`${BASE}/assessments`);

    expect(routes.assessments).toBe(`${BASE}/assessments`);

    // Simulate Chrome synchronously updating window.location before React
    // finishes rendering (the Back-button race condition).
    Object.defineProperty(window, "location", {
      value: { ...window.location, pathname: "/openshift/" },
      writable: true,
      configurable: true,
    });

    // Cached value must be unchanged
    expect(routes.assessments).toBe(`${BASE}/assessments`);
    expect(routes.root).toBe(BASE);
  });
});
