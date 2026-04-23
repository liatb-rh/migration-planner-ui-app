import type {
  Customer,
  PartnerApiInterface,
} from "@openshift-migration-advisor/planner-sdk";

import { ExternalStoreBase } from "../../lib/mvvm/ExternalStore";
import type { ICustomersStore } from "./interfaces/ICustomersStore";

export class CustomersStore
  extends ExternalStoreBase<Customer[]>
  implements ICustomersStore
{
  private customers: Customer[] = [];
  private api: PartnerApiInterface;

  constructor(api: PartnerApiInterface) {
    super();
    this.api = api;
  }

  async list(): Promise<Customer[]> {
    this.customers = await this.api.listCustomers();
    this.notify();
    return this.customers;
  }

  override getSnapshot(): Customer[] {
    return this.customers;
  }
}
