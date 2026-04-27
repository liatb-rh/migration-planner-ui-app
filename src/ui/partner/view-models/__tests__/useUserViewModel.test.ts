import type { Identity } from "@openshift-migration-advisor/planner-sdk";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useIdentityViewModel } from "../useIdentityViewModel";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockAccountStore: {
  subscribe: ReturnType<typeof vi.fn>;
  getSnapshot: ReturnType<typeof vi.fn>;
  getIdentity: ReturnType<typeof vi.fn>;
};

vi.mock("@y0n1/react-ioc", () => ({
  useInjection: (symbol: symbol) => {
    const key = symbol.description;
    if (key === "AccountStore") return mockAccountStore;
    throw new Error(`Unexpected symbol: ${String(symbol)}`);
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useUserViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user from the store snapshot", async () => {
    const adminIdentity: Identity = {
      username: "admin-1",
      kind: "admin",
      groupId: "53b29bc8-8545-421f-b1a5-cf084c51247e",
      partnerId: null,
    };

    mockAccountStore = {
      subscribe: vi.fn(() => () => {}),
      getSnapshot: vi.fn(() => adminIdentity),
      getIdentity: vi.fn().mockResolvedValue(adminIdentity),
    };

    const { result } = renderHook(() => useIdentityViewModel());
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.identity).toEqual(adminIdentity);
  });
});
