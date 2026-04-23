import type { Customer } from "@openshift-migration-advisor/planner-sdk";

import type { ExternalStore } from "../../../lib/mvvm/ExternalStore";

export interface ICustomersStore extends ExternalStore<Customer[]> {
  list(): Promise<Customer[]>;
}
