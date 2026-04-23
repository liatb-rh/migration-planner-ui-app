import { Container } from "@y0n1/react-ioc";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createContainer, Symbols } from "../Dependencies";

// ---------------------------------------------------------------------------
// Mocks — API clients (stateless, so we just need constructable stubs)
// ---------------------------------------------------------------------------

vi.mock("@openshift-migration-advisor/planner-sdk", () => ({
  AccountApi: vi.fn(),
  AssessmentApi: vi.fn(),
  ImageApi: vi.fn(),
  InfoApi: vi.fn(),
  JobApi: vi.fn(),
  SourceApi: vi.fn(),
  Configuration: vi.fn(),
  PartnerApi: vi.fn(),
}));

vi.mock("../../data/stores/AccountStore", () => ({
  AccountStore: class {
    _type = "AccountStore";
  },
}));
vi.mock("../../data/stores/GroupsStore", () => ({
  GroupsStore: class {
    _type = "GroupsStore";
  },
}));
vi.mock("../../data/stores/GroupMembersStore", () => ({
  GroupMembersStore: class {
    _type = "GroupMembersStore";
  },
}));
vi.mock("../../data/stores/PartnersStore", () => ({
  PartnersStore: class {
    _type = "PartnersStore";
  },
}));
vi.mock("../../data/stores/PartnerRequestsStore", () => ({
  PartnerRequestsStore: class {
    _type = "PartnerRequestsStore";
  },
}));
vi.mock("../../data/stores/CustomersStore", () => ({
  CustomersStore: class {
    _type = "CustomersStore";
  },
}));
vi.mock("../../data/stores/AssessmentsStore", () => ({
  AssessmentsStore: class {
    _type = "AssessmentsStore";
  },
}));
vi.mock("../../data/stores/ImagesStore", () => ({
  ImagesStore: class {
    _type = "ImagesStore";
  },
}));
vi.mock("../../data/stores/JobsStore", () => ({
  JobsStore: class {
    _type = "JobsStore";
  },
}));
vi.mock("../../data/stores/ReportStore", () => ({
  ReportStore: class {
    _type = "ReportStore";
  },
}));
vi.mock("../../data/stores/SourcesStore", () => ({
  SourcesStore: class {
    _type = "SourcesStore";
  },
}));
vi.mock("../../data/stores/VersionsStore", () => ({
  VersionsStore: class {
    _type = "VersionsStore";
  },
}));
vi.mock("../../services/html-export/HtmlExportService", () => ({
  HtmlExportService: class {},
}));
vi.mock("../../services/pdf-export/PdfExportService", () => ({
  PdfExportService: class {},
}));
vi.mock("../../lib/middleware/Auth", () => ({
  createAuthMiddleware: vi.fn().mockReturnValue({ pre: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Chrome stub
// ---------------------------------------------------------------------------

const makeChromeStub = () =>
  ({
    auth: { getToken: vi.fn().mockResolvedValue("tok") },
  }) as unknown as Parameters<typeof createContainer>[0];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Symbols", () => {
  it("contains a frozen object with all expected symbol keys", () => {
    expect(Object.isFrozen(Symbols)).toBe(true);

    const expected = [
      "AccountStore",
      "AssessmentsStore",
      "ImagesStore",
      "SourcesStore",
      "VersionsStore",
      "JobsStore",
      "ReportStore",
      "GroupsStore",
      "GroupMembersStore",
      "PartnersStore",
      "PartnerRequestsStore",
      "CustomersStore",
    ];

    for (const key of expected) {
      expect(Symbols).toHaveProperty(key);
      expect(typeof (Symbols as Record<string, symbol>)[key]).toBe("symbol");
    }
  });

  it("all symbols have matching description", () => {
    for (const [key, sym] of Object.entries(Symbols)) {
      expect(sym.description).toBe(key);
    }
  });
});

describe("createContainer", () => {
  let container: Container;

  beforeEach(() => {
    container = createContainer(makeChromeStub());
  });

  it("returns a Container instance", () => {
    expect(container).toBeInstanceOf(Container);
  });
  it("registers AccountStore", () => {
    const store = container.get(Symbols.AccountStore);
    expect(store).toBeDefined();
    expect((store as Record<string, string>)._type).toBe("AccountStore");
  });

  it("registers AssessmentsStore", () => {
    const store = container.get(Symbols.AssessmentsStore);
    expect(store).toBeDefined();
    expect((store as Record<string, string>)._type).toBe("AssessmentsStore");
  });

  it("registers ImagesStore", () => {
    const store = container.get(Symbols.ImagesStore);
    expect(store).toBeDefined();
    expect((store as Record<string, string>)._type).toBe("ImagesStore");
  });

  it("registers SourcesStore", () => {
    const store = container.get(Symbols.SourcesStore);
    expect(store).toBeDefined();
    expect((store as Record<string, string>)._type).toBe("SourcesStore");
  });

  it("registers VersionsStore", () => {
    const store = container.get(Symbols.VersionsStore);
    expect(store).toBeDefined();
    expect((store as Record<string, string>)._type).toBe("VersionsStore");
  });

  it("registers JobsStore", () => {
    const store = container.get(Symbols.JobsStore);
    expect(store).toBeDefined();
    expect((store as Record<string, string>)._type).toBe("JobsStore");
  });

  it("registers ReportStore", () => {
    const store = container.get(Symbols.ReportStore);
    expect(store).toBeDefined();
    expect((store as Record<string, string>)._type).toBe("ReportStore");
  });

  it("registers GroupsStore", () => {
    const store = container.get(Symbols.GroupsStore);
    expect(store).toBeDefined();
    expect((store as Record<string, string>)._type).toBe("GroupsStore");
  });

  it("registers GroupMembersStore", () => {
    const store = container.get(Symbols.GroupMembersStore);
    expect(store).toBeDefined();
    expect((store as Record<string, string>)._type).toBe("GroupMembersStore");
  });

  it("registers PartnersStore", () => {
    const store = container.get(Symbols.PartnersStore);
    expect(store).toBeDefined();
    expect((store as Record<string, string>)._type).toBe("PartnersStore");
  });

  it("registers PartnerRequestsStore", () => {
    const store = container.get(Symbols.PartnerRequestsStore);
    expect(store).toBeDefined();
    expect((store as Record<string, string>)._type).toBe(
      "PartnerRequestsStore",
    );
  });

  it("registers CustomersStore", () => {
    const store = container.get(Symbols.CustomersStore);
    expect(store).toBeDefined();
    expect((store as Record<string, string>)._type).toBe("CustomersStore");
  });
});
