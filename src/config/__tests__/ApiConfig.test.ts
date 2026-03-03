import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveApiBaseUrl } from "../ApiConfig";

describe("resolveApiBaseUrl", () => {
  const originalLocation = window.location;

  afterEach(() => {
    // Restore environment variables
    vi.unstubAllEnvs();
    // Restore window.location
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("should return /api/migration-assessment for production route", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/openshift/migration-assessment/assessments",
      },
      writable: true,
      configurable: true,
    });

    expect(resolveApiBaseUrl()).toBe("/api/migration-assessment");
  });

  it("should return /api/migration-advisor-dev for dev route", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/openshift/migration-advisor-dev/assessments",
      },
      writable: true,
      configurable: true,
    });

    expect(resolveApiBaseUrl()).toBe("/api/migration-advisor-dev");
  });

  it("should strip /preview prefix before matching", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/preview/openshift/migration-assessment/assessments",
      },
      writable: true,
      configurable: true,
    });

    expect(resolveApiBaseUrl()).toBe("/api/migration-assessment");
  });

  it("should strip /beta prefix before matching", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/beta/openshift/migration-advisor-dev/assessments",
      },
      writable: true,
      configurable: true,
    });

    expect(resolveApiBaseUrl()).toBe("/api/migration-advisor-dev");
  });

  it("should use build-time env variable for unknown routes", () => {
    vi.stubEnv("MIGRATION_PLANNER_API_BASE_URL", "/api/custom-path");

    Object.defineProperty(window, "location", {
      value: {
        pathname: "/unknown/path",
      },
      writable: true,
      configurable: true,
    });

    expect(resolveApiBaseUrl()).toBe("/api/custom-path");
  });

  it("should use default fallback when no env variable and unknown route", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/unknown/path",
      },
      writable: true,
      configurable: true,
    });

    expect(resolveApiBaseUrl()).toBe("/api/migration-assessment");
  });

  it("should NOT strip /preview when not a full path segment", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/previewx/openshift/migration-assessment/assessments",
      },
      writable: true,
      configurable: true,
    });

    // Should fall back to default since /previewx/openshift/... is not a known route
    expect(resolveApiBaseUrl()).toBe("/api/migration-assessment");
  });

  it("should NOT strip /beta when not a full path segment", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/beta-test/openshift/migration-assessment/assessments",
      },
      writable: true,
      configurable: true,
    });

    // Should fall back to default since /beta-test/openshift/... is not a known route
    expect(resolveApiBaseUrl()).toBe("/api/migration-assessment");
  });

  it("should NOT match partial route segments (suffix)", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/openshift/migration-assessment-foo/assessments",
      },
      writable: true,
      configurable: true,
    });

    // Should fall back to default since the route continues without a separator
    expect(resolveApiBaseUrl()).toBe("/api/migration-assessment");
  });

  it("should NOT match partial route segments for dev route", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/openshift/migration-advisor-development/assessments",
      },
      writable: true,
      configurable: true,
    });

    // Should fall back to default since migration-advisor-development != migration-advisor-dev
    expect(resolveApiBaseUrl()).toBe("/api/migration-assessment");
  });

  it("should match exact route without trailing path", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/openshift/migration-assessment",
      },
      writable: true,
      configurable: true,
    });

    expect(resolveApiBaseUrl()).toBe("/api/migration-assessment");
  });

  it("should handle error and fall back to env variable", () => {
    vi.stubEnv("MIGRATION_PLANNER_API_BASE_URL", "/api/fallback");

    // Mock window.location to throw error
    Object.defineProperty(window, "location", {
      get: () => {
        throw new Error("No window");
      },
      configurable: true,
    });

    expect(resolveApiBaseUrl()).toBe("/api/fallback");
  });

  it("should handle error and use default when no env variable", () => {
    // Mock window.location to throw error
    Object.defineProperty(window, "location", {
      get: () => {
        throw new Error("No window");
      },
      configurable: true,
    });

    expect(resolveApiBaseUrl()).toBe("/api/migration-assessment");
  });
});
