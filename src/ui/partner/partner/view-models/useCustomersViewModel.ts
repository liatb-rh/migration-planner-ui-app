import type { Customer } from "@openshift-migration-advisor/planner-sdk";
import { useInjection } from "@y0n1/react-ioc";
import { useSyncExternalStore } from "react";
import { useAsync } from "react-use";

import { Symbols } from "../../../../config/Dependencies";
import type { ICustomersStore } from "../../../../data/stores/interfaces/ICustomersStore";

export interface CustomersViewModel {
  customers: Customer[];
  isLoading: boolean;
  error?: Error;
}

export const useCustomersViewModel = (): CustomersViewModel => {
  const customersStore = useInjection<ICustomersStore>(Symbols.CustomersStore);

  const customers = useSyncExternalStore<Customer[]>(
    customersStore.subscribe.bind(customersStore),
    customersStore.getSnapshot.bind(customersStore),
  );

  const { loading, error } = useAsync(() => customersStore.list(), []);

  return {
    customers,
    isLoading: loading,
    error: error,
  };
};
