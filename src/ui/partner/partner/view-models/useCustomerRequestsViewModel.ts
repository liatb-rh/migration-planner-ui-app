import type { PartnerRequest } from "@openshift-migration-advisor/planner-sdk";
import { useInjection } from "@y0n1/react-ioc";
import { useSyncExternalStore } from "react";
import { useAsync, useAsyncFn } from "react-use";

import { Symbols } from "../../../../config/Dependencies";
import type { ICustomersStore } from "../../../../data/stores/interfaces/ICustomersStore";
import type { IPartnerRequestsStore } from "../../../../data/stores/interfaces/IPartnerRequestsStore";

export interface CustomerRequestsViewModel {
  requests: PartnerRequest[];
  isLoading: boolean;
  error?: Error;
  acceptPartnerRequest: (partnerRequestId: string) => Promise<PartnerRequest>;
  denyPartnerRequest: (
    partnerRequestId: string,
    reason: string,
  ) => Promise<PartnerRequest>;
}

export const useCustomerRequestsViewModel = (): CustomerRequestsViewModel => {
  const partnerRequestsStore = useInjection<IPartnerRequestsStore>(
    Symbols.PartnerRequestsStore,
  );

  const customersStore = useInjection<ICustomersStore>(Symbols.CustomersStore);

  const requests = useSyncExternalStore<PartnerRequest[]>(
    partnerRequestsStore.subscribe.bind(partnerRequestsStore),
    partnerRequestsStore.getSnapshot.bind(partnerRequestsStore),
  );

  const { loading, error } = useAsync(() => partnerRequestsStore.list(), []);

  const [acceptState, doAcceptPartnerRequest] = useAsyncFn(
    async (partnerRequestId: string): Promise<PartnerRequest> => {
      const result = await partnerRequestsStore.accept(partnerRequestId);
      await customersStore.list();
      return result;
    },
    [partnerRequestsStore, customersStore],
  );

  const [denyState, doDenyPartnerRequest] = useAsyncFn(
    async (
      partnerRequestId: string,
      reason: string,
    ): Promise<PartnerRequest> => {
      return await partnerRequestsStore.deny(partnerRequestId, reason);
    },
    [partnerRequestsStore],
  );

  return {
    requests,
    isLoading: loading || acceptState.loading || denyState.loading,
    error: error || acceptState.error || denyState.error,
    acceptPartnerRequest: doAcceptPartnerRequest,
    denyPartnerRequest: doDenyPartnerRequest,
  };
};
