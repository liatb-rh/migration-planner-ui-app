import type {
  AccountApiInterface,
  Identity,
} from "@openshift-migration-advisor/planner-sdk";

import { ExternalStoreBase } from "../../lib/mvvm/ExternalStore";
import type { IAccountStore } from "./interfaces/IAccountStore";

export class AccountStore
  extends ExternalStoreBase<Identity | null>
  implements IAccountStore
{
  private identity: Identity | null = null;
  private api: AccountApiInterface;

  constructor(api: AccountApiInterface) {
    super();
    this.api = api;
  }

  async getIdentity(): Promise<Identity> {
    this.identity = await this.api.getIdentity();
    this.notify();
    return this.identity;
  }

  override getSnapshot(): Identity | null {
    return this.identity;
  }
}
