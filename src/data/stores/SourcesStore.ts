import type {
  SourceApiInterface,
  SourceCreate,
  SourceUpdate,
} from "@openshift-migration-advisor/planner-sdk";
import { UpdateInventoryFromJSON } from "@openshift-migration-advisor/planner-sdk";

import { PollableStoreBase } from "../../lib/mvvm/PollableStore";
import { createSourceModel, type SourceModel } from "../../models/SourceModel";
import { createStubSources } from "../stubs/stubSources";
import type { ISourcesStore } from "./interfaces/ISourcesStore";

export type SourceNetworkConfigType = "dhcp" | "static";

export type SourceCreateInput = {
  name: string;
  sshPublicKey: string;
  enableProxy: boolean;
  httpProxy: string;
  httpsProxy: string;
  noProxy: string;
  networkConfigType?: SourceNetworkConfigType;
  ipAddress?: string;
  subnetMask?: string;
  defaultGateway?: string;
  dns?: string;
};

export type SourceUpdateInput = Omit<SourceCreateInput, "name"> & {
  sourceId: string;
};

type UpdateInventoryInput = Parameters<typeof UpdateInventoryFromJSON>[0];
type ProxyPayload = NonNullable<SourceCreate["proxy"]>;
type NetworkPayload = NonNullable<SourceCreate["vmNetwork"]>;

const buildProxyPayload = (
  httpProxy: string,
  httpsProxy: string,
  noProxy: string,
): ProxyPayload | undefined => {
  const proxyFields: {
    httpUrl?: string;
    httpsUrl?: string;
    noProxy?: string;
  } = {};

  if (httpProxy && httpProxy.trim()) {
    proxyFields.httpUrl = httpProxy;
  }
  if (httpsProxy && httpsProxy.trim()) {
    proxyFields.httpsUrl = httpsProxy;
  }
  if (noProxy && noProxy.trim()) {
    proxyFields.noProxy = noProxy;
  }

  return Object.keys(proxyFields).length > 0 ? proxyFields : undefined;
};

const buildNetworkPayload = (
  input: SourceCreateInput | SourceUpdateInput,
): NetworkPayload | undefined => {
  if (
    input.networkConfigType === "static" &&
    input.ipAddress?.trim() &&
    input.subnetMask?.trim() &&
    input.defaultGateway?.trim() &&
    input.dns?.trim()
  ) {
    return {
      ipv4: {
        ipAddress: input.ipAddress.trim(),
        subnetMask: input.subnetMask.trim(),
        defaultGateway: input.defaultGateway.trim(),
        dns: input.dns.trim(),
      },
    };
  }
  return undefined;
};

const buildSourceCreatePayload = (input: SourceCreateInput): SourceCreate => {
  const payload: SourceCreate = {
    name: input.name,
  };

  if (input.sshPublicKey && input.sshPublicKey.trim()) {
    payload.sshPublicKey = input.sshPublicKey;
  }

  if (input.enableProxy) {
    payload.proxy = buildProxyPayload(
      input.httpProxy,
      input.httpsProxy,
      input.noProxy,
    );
  }

  if (input.networkConfigType === "static") {
    payload.vmNetwork = buildNetworkPayload(input);
  }

  return payload;
};

const buildSourceUpdatePayload = (input: SourceUpdateInput): SourceUpdate => {
  const payload: SourceUpdate = {};

  if (input.sshPublicKey && input.sshPublicKey.trim()) {
    payload.sshPublicKey = input.sshPublicKey;
  }

  payload.enableProxy = input.enableProxy;
  if (input.enableProxy) {
    payload.proxy = buildProxyPayload(
      input.httpProxy,
      input.httpsProxy,
      input.noProxy,
    );
  }

  payload.networkConfigType = input.networkConfigType;
  if (input.networkConfigType === "static") {
    payload.vmNetwork = buildNetworkPayload(input);
  }

  return payload;
};

export class SourcesStore
  extends PollableStoreBase<SourceModel[]>
  implements ISourcesStore
{
  private sources: SourceModel[] = [];
  private api: SourceApiInterface;
  private usingStubs = false;

  constructor(api: SourceApiInterface) {
    super();
    this.api = api;
  }

  async list(signal?: AbortSignal): Promise<SourceModel[]> {
    try {
      const sources = await this.api.listSources({ signal });
      this.sources = sources.map(createSourceModel);
      this.usingStubs = false;
      this.notify();
      return this.sources;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return this.sources;
      }

      if (process.env.NODE_ENV !== "production") {
        if (!this.usingStubs) {
          console.warn(
            "[SourcesStore] API unreachable, using stub sources for development:",
            error,
          );
          this.sources = createStubSources().map(createSourceModel);
          this.usingStubs = true;
          this.notify();
        }
        return this.sources;
      }

      throw error;
    }
  }

  getById(id: string): SourceModel | undefined {
    return this.sources.find((source) => source.id === id);
  }

  async create(
    input: SourceCreateInput,
    signal?: AbortSignal,
  ): Promise<SourceModel> {
    const created = await this.api.createSource(
      {
        sourceCreate: buildSourceCreatePayload(input),
      },
      { signal },
    );
    const model = createSourceModel(created);
    this.sources = [...this.sources, model];
    this.notify();
    return model;
  }

  async update(
    input: SourceUpdateInput,
    signal?: AbortSignal,
  ): Promise<SourceModel> {
    const updated = await this.api.updateSource(
      {
        id: input.sourceId,
        sourceUpdate: buildSourceUpdatePayload(input),
      },
      { signal },
    );
    const model = createSourceModel(updated);
    this.sources = this.sources.map((source) =>
      source.id === model.id ? model : source,
    );
    this.notify();
    return model;
  }

  async delete(id: string, signal?: AbortSignal): Promise<SourceModel> {
    const deleted = await this.api.deleteSource({ id }, { signal });
    this.sources = this.sources.filter((source) => source.id !== deleted.id);
    this.notify();
    return createSourceModel(deleted);
  }

  async updateInventory(
    sourceId: string,
    inventory: unknown,
    signal?: AbortSignal,
  ): Promise<SourceModel> {
    const updated = await this.api.updateInventory(
      {
        id: sourceId,
        updateInventory: UpdateInventoryFromJSON(
          inventory as UpdateInventoryInput,
        ),
      },
      { signal },
    );
    const model = createSourceModel(updated);
    this.sources = this.sources.map((source) =>
      source.id === model.id ? model : source,
    );
    this.notify();
    return model;
  }

  override getSnapshot(): SourceModel[] {
    return this.sources;
  }

  protected override async poll(signal: AbortSignal): Promise<void> {
    await this.list(signal);
  }
}
