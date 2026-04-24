import type {
  AccountApiInterface,
  Member,
} from "@openshift-migration-advisor/planner-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GroupMembersStore } from "../GroupMembersStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMember = (overrides: Partial<Member> = {}): Member => ({
  username: "testuser",
  email: "test@example.com",
  groupId: "g-1",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  ...overrides,
});

const createMockApi = (): AccountApiInterface =>
  ({
    listGroupMembers: vi.fn(),
    createGroupMember: vi.fn(),
    removeGroupMember: vi.fn(),
  }) as unknown as AccountApiInterface;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GroupMembersStore", () => {
  let api: AccountApiInterface;
  let store: GroupMembersStore;

  beforeEach(() => {
    api = createMockApi();
    store = new GroupMembersStore(api);
  });

  it("initial snapshot is empty array", () => {
    expect(store.getSnapshot()).toEqual({ groupId: null, members: [] });
  });

  it("listGroupMembers() fetches members and updates snapshot", async () => {
    const members = [
      makeMember({ username: "user1", email: "user1@example.com" }),
      makeMember({ username: "user2", email: "user2@example.com" }),
    ];
    vi.mocked(api.listGroupMembers).mockResolvedValue(members);

    const result = await store.list("g-1");

    expect(api.listGroupMembers).toHaveBeenCalledWith({ id: "g-1" });
    expect(result).toEqual(members);
    expect(store.getSnapshot()).toEqual({ groupId: "g-1", members });
  });

  it("createGroupMember() adds new member to current group", async () => {
    const existing = [makeMember({ username: "user1" })];
    vi.mocked(api.listGroupMembers).mockResolvedValue(existing);
    await store.list("g-1");

    const created = makeMember({
      username: "newuser",
      email: "new@example.com",
      groupId: "g-1",
    });
    vi.mocked(api.createGroupMember).mockResolvedValue(created);

    const input = { username: "newuser", email: "new@example.com" };
    const result = await store.create("g-1", input);

    expect(api.createGroupMember).toHaveBeenCalledWith({
      id: "g-1",
      memberCreate: input,
    });
    expect(result).toEqual(created);
    expect(store.getSnapshot().members).toHaveLength(2);
    expect(store.getSnapshot().members[1]).toEqual(created);
  });

  it("createGroupMember() does not update snapshot for different group", async () => {
    const existing = [makeMember({ username: "user1" })];
    vi.mocked(api.listGroupMembers).mockResolvedValue(existing);
    await store.list("g-1");

    const created = makeMember({
      username: "newuser",
      email: "new@example.com",
      groupId: "g-2",
    });
    vi.mocked(api.createGroupMember).mockResolvedValue(created);

    await store.create("g-2", {
      username: "newuser",
      email: "new@example.com",
    });

    expect(store.getSnapshot().members).toHaveLength(1);
    expect(store.getSnapshot().members[0].username).toBe("user1");
  });

  it("deleteGroupMember() removes member from snapshot", async () => {
    const members = [
      makeMember({ username: "user1", email: "user1@example.com" }),
      makeMember({ username: "user2", email: "user2@example.com" }),
    ];
    vi.mocked(api.listGroupMembers).mockResolvedValue(members);
    await store.list("g-1");

    vi.mocked(api.removeGroupMember).mockResolvedValue(undefined);

    await store.delete("g-1", "user1");

    expect(api.removeGroupMember).toHaveBeenCalledWith({
      id: "g-1",
      username: "user1",
    });
    expect(store.getSnapshot().members).toHaveLength(1);
    expect(store.getSnapshot().members[0].username).toBe("user2");
  });

  it("deleteGroupMember() does not update snapshot for different group", async () => {
    const members = [
      makeMember({ username: "user1" }),
      makeMember({ username: "user2" }),
    ];
    vi.mocked(api.listGroupMembers).mockResolvedValue(members);
    await store.list("g-1");

    vi.mocked(api.removeGroupMember).mockResolvedValue(undefined);

    await store.delete("g-2", "user1");

    expect(store.getSnapshot().members).toHaveLength(2);
  });

  it("subscriber notification on listGroupMembers()", async () => {
    const listener = vi.fn();
    store.subscribe(listener);

    vi.mocked(api.listGroupMembers).mockResolvedValue([makeMember()]);
    await store.list("g-1");

    expect(listener).toHaveBeenCalled();
  });

  it("subscriber notification on createGroupMember()", async () => {
    vi.mocked(api.listGroupMembers).mockResolvedValue([]);
    await store.list("g-1");

    const listener = vi.fn();
    store.subscribe(listener);

    const created = makeMember({ username: "newuser" });
    vi.mocked(api.createGroupMember).mockResolvedValue(created);
    await store.create("g-1", {
      username: "newuser",
      email: "new@example.com",
    });

    expect(listener).toHaveBeenCalled();
  });

  it("subscriber notification on deleteGroupMember()", async () => {
    const members = [makeMember({ username: "user1" })];
    vi.mocked(api.listGroupMembers).mockResolvedValue(members);
    await store.list("g-1");

    const listener = vi.fn();
    store.subscribe(listener);

    vi.mocked(api.removeGroupMember).mockResolvedValue(undefined);
    await store.delete("g-1", "user1");

    expect(listener).toHaveBeenCalled();
  });

  it("no notification when modifying different group", async () => {
    vi.mocked(api.listGroupMembers).mockResolvedValue([]);
    await store.list("g-1");

    const listener = vi.fn();
    store.subscribe(listener);

    const created = makeMember({ username: "newuser", groupId: "g-2" });
    vi.mocked(api.createGroupMember).mockResolvedValue(created);
    await store.create("g-2", {
      username: "newuser",
      email: "new@example.com",
    });

    expect(listener).not.toHaveBeenCalled();
  });

  // Non-regression test for infinite re-render bug
  it("getSnapshot() returns same reference when state unchanged", () => {
    const snapshot1 = store.getSnapshot();
    const snapshot2 = store.getSnapshot();
    const snapshot3 = store.getSnapshot();

    expect(snapshot1).toBe(snapshot2);
    expect(snapshot2).toBe(snapshot3);
  });

  it("getSnapshot() returns new reference after list() updates state", async () => {
    const snapshotBefore = store.getSnapshot();

    const members = [makeMember({ username: "user1" })];
    vi.mocked(api.listGroupMembers).mockResolvedValue(members);
    await store.list("g-1");

    const snapshotAfter1 = store.getSnapshot();
    const snapshotAfter2 = store.getSnapshot();

    // New reference after update
    expect(snapshotAfter1).not.toBe(snapshotBefore);
    // Same reference for subsequent calls
    expect(snapshotAfter1).toBe(snapshotAfter2);
  });
});
