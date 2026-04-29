import type { PartnerRequestCreate } from "@openshift-migration-advisor/planner-sdk";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Partner } from "../../../../../models/PartnerModel";
import { usePartnersViewModel } from "../usePartnersViewModel";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockPartnersStore: {
  subscribe: ReturnType<typeof vi.fn>;
  getSnapshot: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
};

let mockPartnerRequestsStore: {
  create: ReturnType<typeof vi.fn>;
};

vi.mock("@y0n1/react-ioc", () => ({
  useInjection: (symbol: symbol) => {
    const key = symbol.description;
    if (key === "PartnersStore") return mockPartnersStore;
    if (key === "PartnerRequestsStore") return mockPartnerRequestsStore;
    throw new Error(`Unexpected symbol: ${String(symbol)}`);
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("usePartnersViewModel - createPartnerRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a partner request with partnerId and data", async () => {
    const partnerId = "partner-123";
    const mockPartnerRequestCreate: PartnerRequestCreate = {
      name: "Test Customer",
      contactName: "John Doe",
      contactPhone: "+1234567890",
      email: "john.doe@example.com",
      location: "US-East",
    };

    const unsubscribe = vi.fn();
    const cachedPartners: unknown[] = [];
    mockPartnersStore = {
      subscribe: vi.fn(() => unsubscribe),
      getSnapshot: vi.fn(() => cachedPartners),
      list: vi.fn().mockResolvedValue(undefined),
    };

    mockPartnerRequestsStore = {
      create: vi.fn().mockResolvedValue(undefined),
    };

    const { result } = renderHook(() => usePartnersViewModel());

    // Wait for initial useAsync to complete
    await act(async () => {
      await Promise.resolve();
    });

    // Open the contact form modal to select the partner
    act(() => {
      result.current.openContactFormModal({ id: partnerId } as Partner);
    });

    // Create the partner request
    await act(async () => {
      await result.current.createPartnerRequest(mockPartnerRequestCreate);
    });

    expect(mockPartnerRequestsStore.create).toHaveBeenCalledWith(
      partnerId,
      mockPartnerRequestCreate,
    );
  });
});
