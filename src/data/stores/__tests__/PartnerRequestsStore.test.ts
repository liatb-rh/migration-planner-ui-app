import type {
  PartnerApiInterface,
  PartnerRequest,
} from "@openshift-migration-advisor/planner-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PartnerRequestsStore } from "../PartnerRequestsStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makePartnerRequest = (
  overrides: Partial<PartnerRequest> = {},
): PartnerRequest =>
  ({
    id: "req-1",
    requestStatus: "pending",
    partner: {
      id: "partner-1",
      name: "Test Partner",
      kind: "partner" as const,
      icon: "",
      company: "Test Company",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    },
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  }) as PartnerRequest;

const createMockApi = (): PartnerApiInterface =>
  ({
    listPartnerRequests: vi.fn(),
    createPartnerRequest: vi.fn(),
    cancelPartnerRequest: vi.fn(),
    updatePartnerRequest: vi.fn(),
  }) as unknown as PartnerApiInterface;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PartnerRequestsStore", () => {
  let api: PartnerApiInterface;
  let store: PartnerRequestsStore;

  beforeEach(() => {
    api = createMockApi();
    store = new PartnerRequestsStore(api);
  });

  it("initial snapshot is empty array", () => {
    expect(store.getSnapshot()).toEqual([]);
  });

  it("list() fetches partner requests and updates snapshot", async () => {
    const requests = [
      makePartnerRequest({ id: "req-1" }),
      makePartnerRequest({ id: "req-2" }),
    ];
    vi.mocked(api.listPartnerRequests).mockResolvedValue(requests);

    const result = await store.list();

    expect(api.listPartnerRequests).toHaveBeenCalledWith({});
    expect(result).toEqual(requests);
    expect(store.getSnapshot()).toEqual(requests);
  });

  it("create() adds new partner request", async () => {
    const created = makePartnerRequest({ id: "req-1" });
    vi.mocked(api.createPartnerRequest).mockResolvedValue(created);

    const input = {
      name: "Customer Name",
      contactName: "John Doe",
      email: "john@example.com",
      contactPhone: "+1-555-0123",
      location: "us-east-1",
    };
    const result = await store.create("partner-1", input);

    expect(api.createPartnerRequest).toHaveBeenCalledWith({
      id: "partner-1",
      partnerRequestCreate: input,
    });
    expect(result).toEqual(created);
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0]).toEqual(created);
  });

  it("create() appends to existing requests", async () => {
    const existing = [makePartnerRequest({ id: "req-1" })];
    vi.mocked(api.listPartnerRequests).mockResolvedValue(existing);
    await store.list();

    const created = makePartnerRequest({ id: "req-2" });
    vi.mocked(api.createPartnerRequest).mockResolvedValue(created);

    await store.create("partner-1", {
      name: "Customer Name",
      contactName: "John Doe",
      email: "john@example.com",
      contactPhone: "+1-555-0123",
      location: "us-east-1",
    });

    expect(store.getSnapshot()).toHaveLength(2);
    expect(store.getSnapshot()[1]).toEqual(created);
  });

  it("cancel() removes request and refreshes list", async () => {
    const requests = [
      makePartnerRequest({ id: "req-1" }),
      makePartnerRequest({ id: "req-2" }),
    ];
    vi.mocked(api.listPartnerRequests).mockResolvedValue(requests);
    await store.list();

    const afterCancel = [makePartnerRequest({ id: "req-2" })];
    vi.mocked(api.listPartnerRequests).mockResolvedValue(afterCancel);
    vi.mocked(api.cancelPartnerRequest).mockResolvedValue(undefined);

    await store.cancel("req-1");

    expect(api.cancelPartnerRequest).toHaveBeenCalledWith({ id: "req-1" });
    expect(api.listPartnerRequests).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()).toEqual(afterCancel);
  });

  it("accept() updates request status to accepted", async () => {
    const pending = makePartnerRequest({
      id: "req-1",
      requestStatus: "pending",
    });
    vi.mocked(api.listPartnerRequests).mockResolvedValue([pending]);
    await store.list();

    const accepted = makePartnerRequest({
      id: "req-1",
      requestStatus: "accepted",
    });
    vi.mocked(api.updatePartnerRequest).mockResolvedValue(accepted);

    const result = await store.accept("req-1");

    expect(api.updatePartnerRequest).toHaveBeenCalledWith({
      id: "req-1",
      partnerRequestUpdate: { status: "accepted" },
    });
    expect(result).toEqual(accepted);
    expect(store.getSnapshot()[0].requestStatus).toBe("accepted");
  });

  it("accept() preserves other requests", async () => {
    const requests = [
      makePartnerRequest({ id: "req-1", requestStatus: "pending" }),
      makePartnerRequest({ id: "req-2", requestStatus: "pending" }),
    ];
    vi.mocked(api.listPartnerRequests).mockResolvedValue(requests);
    await store.list();

    const accepted = makePartnerRequest({
      id: "req-1",
      requestStatus: "accepted",
    });
    vi.mocked(api.updatePartnerRequest).mockResolvedValue(accepted);

    await store.accept("req-1");

    expect(store.getSnapshot()).toHaveLength(2);
    expect(store.getSnapshot()[0].requestStatus).toBe("accepted");
    expect(store.getSnapshot()[1].requestStatus).toBe("pending");
  });

  it("deny() updates request status to rejected with reason", async () => {
    const pending = makePartnerRequest({
      id: "req-1",
      requestStatus: "pending",
    });
    vi.mocked(api.listPartnerRequests).mockResolvedValue([pending]);
    await store.list();

    const rejected = makePartnerRequest({
      id: "req-1",
      requestStatus: "rejected",
      reason: "Does not meet criteria",
    });
    vi.mocked(api.updatePartnerRequest).mockResolvedValue(rejected);

    const result = await store.deny("req-1", "Does not meet criteria");

    expect(api.updatePartnerRequest).toHaveBeenCalledWith({
      id: "req-1",
      partnerRequestUpdate: {
        status: "rejected",
        reason: "Does not meet criteria",
      },
    });
    expect(result).toEqual(rejected);
    expect(store.getSnapshot()[0].requestStatus).toBe("rejected");
  });

  it("deny() preserves other requests", async () => {
    const requests = [
      makePartnerRequest({ id: "req-1", requestStatus: "pending" }),
      makePartnerRequest({ id: "req-2", requestStatus: "pending" }),
    ];
    vi.mocked(api.listPartnerRequests).mockResolvedValue(requests);
    await store.list();

    const rejected = makePartnerRequest({
      id: "req-1",
      requestStatus: "rejected",
      reason: "Test reason",
    });
    vi.mocked(api.updatePartnerRequest).mockResolvedValue(rejected);

    await store.deny("req-1", "Test reason");

    expect(store.getSnapshot()).toHaveLength(2);
    expect(store.getSnapshot()[0].requestStatus).toBe("rejected");
    expect(store.getSnapshot()[1].requestStatus).toBe("pending");
  });

  it("subscriber notification on list()", async () => {
    const listener = vi.fn();
    store.subscribe(listener);

    vi.mocked(api.listPartnerRequests).mockResolvedValue([
      makePartnerRequest(),
    ]);
    await store.list();

    expect(listener).toHaveBeenCalled();
  });

  it("subscriber notification on create()", async () => {
    const listener = vi.fn();
    store.subscribe(listener);

    const created = makePartnerRequest({ id: "req-1" });
    vi.mocked(api.createPartnerRequest).mockResolvedValue(created);
    await store.create("partner-1", {
      name: "Customer Name",
      contactName: "John Doe",
      email: "john@example.com",
      contactPhone: "+1-555-0123",
      location: "us-east-1",
    });

    expect(listener).toHaveBeenCalled();
  });

  it("subscriber notification on accept()", async () => {
    const pending = makePartnerRequest({
      id: "req-1",
      requestStatus: "pending",
    });
    vi.mocked(api.listPartnerRequests).mockResolvedValue([pending]);
    await store.list();

    const listener = vi.fn();
    store.subscribe(listener);

    const accepted = makePartnerRequest({
      id: "req-1",
      requestStatus: "accepted",
    });
    vi.mocked(api.updatePartnerRequest).mockResolvedValue(accepted);
    await store.accept("req-1");

    expect(listener).toHaveBeenCalled();
  });

  it("subscriber notification on deny()", async () => {
    const pending = makePartnerRequest({
      id: "req-1",
      requestStatus: "pending",
    });
    vi.mocked(api.listPartnerRequests).mockResolvedValue([pending]);
    await store.list();

    const listener = vi.fn();
    store.subscribe(listener);

    const rejected = makePartnerRequest({
      id: "req-1",
      requestStatus: "rejected",
      reason: "Test reason",
    });
    vi.mocked(api.updatePartnerRequest).mockResolvedValue(rejected);
    await store.deny("req-1", "Test reason");

    expect(listener).toHaveBeenCalled();
  });
});
