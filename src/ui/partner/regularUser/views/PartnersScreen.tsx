import { Flex } from "@patternfly/react-core";
import React from "react";

import { LoadingSpinner } from "../../../core/components/LoadingSpinner";
import { usePartnerRequestsViewModel } from "../view-models/usePartnerRequestsViewModel";
import { PartnerRequestsSection } from "./PartnerRequestsSection";
import { PartnersListSection } from "./PartnersListSection";

export const PartnersScreen: React.FC = () => {
  const vm = usePartnerRequestsViewModel();

  if (vm.isLoading) {
    return <LoadingSpinner />;
  }

  if (vm.hasPendingRequest) {
    return <PartnerRequestsSection vm={vm} />;
  }

  return (
    <Flex direction={{ default: "column" }} rowGap={{ default: "rowGapXl" }}>
      <PartnersListSection />
      <PartnerRequestsSection vm={vm} />
    </Flex>
  );
};

PartnersScreen.displayName = "PartnersScreen";
