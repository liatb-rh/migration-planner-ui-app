import type {
  PartnerRequest,
  PartnerRequestCreate,
} from "@openshift-migration-advisor/planner-sdk";
import { useInjection } from "@y0n1/react-ioc";
import { useState, useSyncExternalStore } from "react";
import { useAsync, useAsyncFn } from "react-use";

import { Symbols } from "../../../../config/Dependencies";
import type { IPartnerRequestsStore } from "../../../../data/stores/interfaces/IPartnerRequestsStore";
import type { IPartnersStore } from "../../../../data/stores/interfaces/IPartnersStore";
import { parseApiError } from "../../../../lib/common/ErrorParser";
import type { Partner } from "../../../../models/PartnerModel";

export interface PartnersViewModel {
  partners: Partner[];
  isLoading: boolean;
  error?: Error;
  createError?: Error;
  openContactFormModal: (partner: Partner | null) => void;
  closeContactFormModal: () => void;
  createPartnerRequest: (data: PartnerRequestCreate) => Promise<PartnerRequest>;
  isContactFormModalOpen: boolean;
}

export const usePartnersViewModel = (): PartnersViewModel => {
  const partnersStore = useInjection<IPartnersStore>(Symbols.PartnersStore);
  const partnerRequestsStore = useInjection<IPartnerRequestsStore>(
    Symbols.PartnerRequestsStore,
  );

  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [createError, setCreateError] = useState<Error | undefined>();

  const partners = useSyncExternalStore<Partner[]>(
    partnersStore.subscribe.bind(partnersStore),
    partnersStore.getSnapshot.bind(partnersStore),
  );

  const { loading, error } = useAsync(() => partnersStore.list(), []);

  const closeContactFormModal = () => {
    setSelectedPartner(null);
    setCreateError(undefined);
  };

  const [createState, doCreatePartnerRequest] = useAsyncFn(
    async (partnerId: string, data: PartnerRequestCreate) => {
      try {
        const result = await partnerRequestsStore.create(partnerId, data);
        setCreateError(undefined);
        closeContactFormModal();
        return result;
      } catch (err) {
        const parsedError = await parseApiError(
          err,
          "Failed to create an assignment request",
        );
        setCreateError(parsedError);
        throw parsedError;
      }
    },
    [partnerRequestsStore],
  );

  const createPartnerRequest = async (
    data: PartnerRequestCreate,
  ): Promise<PartnerRequest> => {
    if (!selectedPartner) {
      throw new Error("No partner selected");
    }
    return doCreatePartnerRequest(selectedPartner.id, data);
  };

  return {
    partners,
    isLoading: loading || createState.loading,
    error,
    createError,
    openContactFormModal: setSelectedPartner,
    closeContactFormModal,
    isContactFormModalOpen: selectedPartner !== null,
    createPartnerRequest,
  };
};
