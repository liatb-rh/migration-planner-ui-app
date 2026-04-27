import { useInjection } from "@y0n1/react-ioc";
import { useState, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAsync } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAccountStore } from "../../../data/stores/interfaces/IAccountStore";
import type { IPartnerRequestsStore } from "../../../data/stores/interfaces/IPartnerRequestsStore";
import { routes } from "../../../routing/Routes";

export type HomeScreenOutletContext = {
  rvtoolsOpenToken?: string;
};

export interface HomeScreenViewModel {
  activeTabKey: number;
  breadcrumbs: Array<{
    key: number;
    children: string;
    isActive?: boolean;
  }>;
  rvtoolsOpenToken: boolean;
  partnerTab: {
    label: string;
    path: string;
    key: number;
  } | null;
  handleTabClick: (
    event: React.MouseEvent<HTMLElement> | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number,
  ) => void;
  handleOpenRVToolsModal: () => void;
  pendingRequestsCount: number;
  shouldShowBadge: boolean;
  isLoadingPartnerRequests: boolean;
}

export const useHomeScreenViewModel = (): HomeScreenViewModel => {
  const location = useLocation();
  const navigate = useNavigate();

  // User store injection
  const accountStore = useInjection<IAccountStore>(Symbols.AccountStore);
  const identity = useSyncExternalStore(
    accountStore.subscribe.bind(accountStore),
    accountStore.getSnapshot.bind(accountStore),
  );

  // Partner requests store subscription
  const partnerRequestsStore = useInjection<IPartnerRequestsStore>(
    Symbols.PartnerRequestsStore,
  );

  const requests = useSyncExternalStore(
    partnerRequestsStore.subscribe.bind(partnerRequestsStore),
    partnerRequestsStore.getSnapshot.bind(partnerRequestsStore),
  );

  const shouldShowBadge = identity?.kind === "partner";

  const { loading: isLoadingPartnerRequestsRaw } = useAsync(async () => {
    if (!shouldShowBadge) return [];
    return partnerRequestsStore.list();
  }, [partnerRequestsStore, shouldShowBadge]);

  const isLoadingPartnerRequests =
    shouldShowBadge && isLoadingPartnerRequestsRaw;

  const pendingRequestsCount = requests.filter(
    (request) => request.requestStatus === "pending",
  ).length;

  const getActiveTabKey = (): number => {
    if (location.pathname.startsWith(routes.environments)) return 1;
    if (
      location.pathname.startsWith(routes.partners) ||
      location.pathname.startsWith(routes.myPartner) ||
      location.pathname.startsWith(routes.customers) ||
      location.pathname.startsWith(routes.adminGroups)
    ) {
      return 2;
    }
    return 0; // assessments
  };

  const activeTabKey = getActiveTabKey();

  const [rvtoolsOpenToken, setRvtoolsOpenToken] = useState(false);

  const getBreadcrumbLabel = (): string => {
    switch (activeTabKey) {
      case 0:
        return "assessments";
      case 1:
        return "environments";
      case 2:
        return "partners";
      default:
        return "assessments";
    }
  };

  const breadcrumbs = [
    { key: 1, children: "Migration advisor" },
    {
      key: 2,
      children: getBreadcrumbLabel(),
      isActive: true,
    },
  ];

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement> | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number,
  ): void => {
    const index = typeof tabIndex === "number" ? tabIndex : Number(tabIndex);

    switch (index) {
      case 0:
        navigate(routes.assessments);
        break;
      case 1:
        navigate(routes.environments);
        break;
      case 2:
        navigate(partnerTab?.path ?? routes.partners);
        break;
      default:
        navigate(routes.assessments);
    }
  };

  const handleOpenRVToolsModal = () => {
    setRvtoolsOpenToken(true);
    navigate(routes.assessments); // switch to assessments tab
  };

  const getPartnerTabConfig = () => {
    if (!identity) return null;

    switch (identity.kind) {
      case "regular":
        return {
          label: "Partners",
          path: routes.partners,
          key: 2,
        };
      case "customer":
        return {
          label: "My partner",
          path: routes.myPartner,
          key: 2,
        };
      case "partner":
        return {
          label: "Customers",
          path: routes.customers,
          key: 2,
        };
      case "admin":
        return {
          label: "Partners administration",
          path: routes.adminGroups,
          key: 2,
        };
      default:
        return null;
    }
  };
  const partnerTab = getPartnerTabConfig();

  return {
    activeTabKey,
    breadcrumbs,
    rvtoolsOpenToken,
    partnerTab,
    pendingRequestsCount,
    shouldShowBadge,
    isLoadingPartnerRequests,
    handleTabClick,
    handleOpenRVToolsModal,
  };
};
