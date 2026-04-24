import type {
  AccountApiInterface,
  Group,
} from "@openshift-migration-advisor/planner-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GroupsStore } from "../GroupsStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeGroup = (overrides: Partial<Group> = {}): Group => ({
  id: "g-1",
  name: "Test Group",
  kind: "partner" as const,
  icon: "test-icon",
  company: "Test Company",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  ...overrides,
});

const createMockApi = (): AccountApiInterface =>
  ({
    listGroups: vi.fn(),
    createGroup: vi.fn(),
    getGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
  }) as unknown as AccountApiInterface;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GroupsStore", () => {
  let api: AccountApiInterface;
  let store: GroupsStore;

  beforeEach(() => {
    api = createMockApi();
    store = new GroupsStore(api);
  });

  it("initial snapshot is empty array", () => {
    expect(store.getSnapshot()).toEqual([]);
  });

  it("list() fetches groups and updates snapshot", async () => {
    const groups = [
      makeGroup({ id: "g-1", name: "Group 1" }),
      makeGroup({ id: "g-2", name: "Group 2" }),
    ];
    vi.mocked(api.listGroups).mockResolvedValue(groups);

    const result = await store.list();

    expect(api.listGroups).toHaveBeenCalledWith({});
    expect(result).toEqual(groups);
    expect(store.getSnapshot()).toEqual(groups);
  });

  it("create() adds new group", async () => {
    const created = makeGroup({ id: "g-1", name: "New Group" });
    vi.mocked(api.createGroup).mockResolvedValue(created);

    const input = {
      name: "New Group",
      description: "Test description",
      kind: "partner" as const,
      icon: "test-icon",
      company: "Test Company",
    };
    const result = await store.create(input);

    expect(api.createGroup).toHaveBeenCalledWith({ groupCreate: input });
    expect(result).toEqual(created);
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0]).toEqual(created);
  });

  it("create() appends to existing groups", async () => {
    const existing = [makeGroup({ id: "g-1", name: "Group 1" })];
    vi.mocked(api.listGroups).mockResolvedValue(existing);
    await store.list();

    const created = makeGroup({ id: "g-2", name: "Group 2" });
    vi.mocked(api.createGroup).mockResolvedValue(created);

    await store.create({
      name: "Group 2",
      description: "Test description",
      kind: "partner" as const,
      icon: "test-icon",
      company: "Test Company",
    });

    expect(store.getSnapshot()).toHaveLength(2);
    expect(store.getSnapshot()[1]).toEqual(created);
  });

  it("get() delegates to API", async () => {
    const group = makeGroup({ id: "g-1", name: "Group 1" });
    vi.mocked(api.getGroup).mockResolvedValue(group);

    const result = await store.get("g-1");

    expect(api.getGroup).toHaveBeenCalledWith({ id: "g-1" });
    expect(result).toEqual(group);
  });

  it("update() updates existing group in snapshot", async () => {
    const initial = makeGroup({ id: "g-1", name: "Old Name" });
    vi.mocked(api.listGroups).mockResolvedValue([initial]);
    await store.list();

    const updated = makeGroup({ id: "g-1", name: "New Name" });
    vi.mocked(api.updateGroup).mockResolvedValue(updated);

    const input = { name: "New Name" };
    const result = await store.update("g-1", input);

    expect(api.updateGroup).toHaveBeenCalledWith({
      id: "g-1",
      groupUpdate: input,
    });
    expect(result).toEqual(updated);
    expect(store.getSnapshot()[0].name).toBe("New Name");
  });

  it("update() preserves other groups", async () => {
    const groups = [
      makeGroup({ id: "g-1", name: "Group 1" }),
      makeGroup({ id: "g-2", name: "Group 2" }),
    ];
    vi.mocked(api.listGroups).mockResolvedValue(groups);
    await store.list();

    const updated = makeGroup({ id: "g-1", name: "Updated" });
    vi.mocked(api.updateGroup).mockResolvedValue(updated);

    await store.update("g-1", { name: "Updated" });

    expect(store.getSnapshot()).toHaveLength(2);
    expect(store.getSnapshot()[0].name).toBe("Updated");
    expect(store.getSnapshot()[1].name).toBe("Group 2");
  });

  it("delete() removes group from snapshot", async () => {
    const groups = [
      makeGroup({ id: "g-1", name: "Group 1" }),
      makeGroup({ id: "g-2", name: "Group 2" }),
    ];
    vi.mocked(api.listGroups).mockResolvedValue(groups);
    await store.list();

    vi.mocked(api.deleteGroup).mockResolvedValue(makeGroup({ id: "g-1" }));

    await store.delete("g-1");

    expect(api.deleteGroup).toHaveBeenCalledWith({ id: "g-1" });
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].id).toBe("g-2");
  });

  it("subscriber notification on list()", async () => {
    const listener = vi.fn();
    store.subscribe(listener);

    vi.mocked(api.listGroups).mockResolvedValue([makeGroup()]);
    await store.list();

    expect(listener).toHaveBeenCalled();
  });

  it("subscriber notification on create()", async () => {
    const listener = vi.fn();
    store.subscribe(listener);

    const created = makeGroup({ id: "g-1" });
    vi.mocked(api.createGroup).mockResolvedValue(created);
    await store.create({
      name: "New Group",
      description: "Test description",
      kind: "partner" as const,
      icon: "test-icon",
      company: "Test Company",
    });

    expect(listener).toHaveBeenCalled();
  });

  it("subscriber notification on update()", async () => {
    const initial = makeGroup({ id: "g-1" });
    vi.mocked(api.listGroups).mockResolvedValue([initial]);
    await store.list();

    const listener = vi.fn();
    store.subscribe(listener);

    const updated = makeGroup({ id: "g-1", name: "Updated" });
    vi.mocked(api.updateGroup).mockResolvedValue(updated);
    await store.update("g-1", { name: "Updated" });

    expect(listener).toHaveBeenCalled();
  });

  it("subscriber notification on delete()", async () => {
    const groups = [makeGroup({ id: "g-1" })];
    vi.mocked(api.listGroups).mockResolvedValue(groups);
    await store.list();

    const listener = vi.fn();
    store.subscribe(listener);

    vi.mocked(api.deleteGroup).mockResolvedValue(undefined as unknown as Group);
    await store.delete("g-1");

    expect(listener).toHaveBeenCalled();
  });
});
