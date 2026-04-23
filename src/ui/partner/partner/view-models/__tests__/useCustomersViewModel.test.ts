import type { Customer } from "@openshift-migration-advisor/planner-sdk";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCustomersViewModel } from "../useCustomersViewModel";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockCustomersStore: {
  subscribe: ReturnType<typeof vi.fn>;
  getSnapshot: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
};

vi.mock("@y0n1/react-ioc", () => ({
  useInjection: (symbol: symbol) => {
    const key = symbol.description;
    if (key === "CustomersStore") return mockCustomersStore;
    throw new Error(`Unexpected symbol: ${String(symbol)}`);
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCustomersViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load customers from the store", async () => {
    const unsubscribe = vi.fn();
    const cachedCustomers: Customer[] = [
      {
        username: "customer1",
        name: "Customer One",
        contactName: "John Doe",
        contactPhone: "+1234567890",
        email: "john@example.com",
        location: "US-East",
      },
    ];

    mockCustomersStore = {
      subscribe: vi.fn(() => unsubscribe),
      getSnapshot: vi.fn(() => cachedCustomers),
      list: vi.fn().mockResolvedValue(cachedCustomers),
    };

    const { result } = renderHook(() => useCustomersViewModel());

    // Wait for initial useAsync to complete
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockCustomersStore.list).toHaveBeenCalled();
    expect(result.current.customers).toEqual(cachedCustomers);
  });
});
