import {
  Alert,
  Content,
  Flex,
  PageSection,
  Title,
} from "@patternfly/react-core";
import React from "react";

import { LoadingSpinner } from "../../../core/components/LoadingSpinner";
import { CustomersTable } from "../components/CustomersTable";
import { useCustomersViewModel } from "../view-models/useCustomersViewModel";
import { CustomerRequestsSection } from "./CustomerRequestsSection";

export const CustomersScreen: React.FC = () => {
  const vm = useCustomersViewModel();

  return (
    <Flex direction={{ default: "column" }} rowGap={{ default: "rowGapXl" }}>
      <CustomerRequestsSection />

      <PageSection>
        <Content>
          <Title headingLevel="h1">My customers</Title>
          <Content component="p">
            Customers you've approved and are partnered with.
          </Content>
        </Content>

        {vm.isLoading && <LoadingSpinner />}

        {vm.error && (
          <Alert isInline variant="danger" title="Customers API error">
            {vm.error.message}
          </Alert>
        )}

        {!vm.isLoading && !vm.error && (
          <CustomersTable customers={vm.customers} />
        )}
      </PageSection>
    </Flex>
  );
};

CustomersScreen.displayName = "CustomersScreen";
