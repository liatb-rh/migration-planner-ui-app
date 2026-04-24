import { css } from "@emotion/css";
import type { PartnerRequest } from "@openshift-migration-advisor/planner-sdk";
import {
  Alert,
  Button,
  Content,
  EmptyState,
  Flex,
  FlexItem,
  PageSection,
  Title,
} from "@patternfly/react-core";
import { SearchIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React, { useState } from "react";

import { sortByNewestFirst } from "../../../../lib/common/Sort";
import { humanizeDate } from "../../../../lib/common/Time";
import { LoadingSpinner } from "../../../core/components/LoadingSpinner";
import { RequestStatus } from "../../regularUser/components/RequestStatus";
import { type DenyPartnerRequestFormValues } from "../components/DenyPartnerRequestForm";
import { DenyPartnerRequestModal } from "../components/DenyPartnerRequestModal";
import { useCustomerRequestsViewModel } from "../view-models/useCustomerRequestsViewModel";

const introStyle = css`
  padding-bottom: 1em;
`;

export const CustomerRequestsSection: React.FC = () => {
  const vm = useCustomerRequestsViewModel();
  const [requestToDeny, setRequestToDeny] = useState<PartnerRequest | null>(
    null,
  );

  const handleAccept = async (request: PartnerRequest) => {
    await vm.acceptPartnerRequest(request.id);
  };

  const handleDeny = async (values: DenyPartnerRequestFormValues) => {
    if (requestToDeny) {
      await vm.denyPartnerRequest(requestToDeny.id, values.reason);
    }
  };

  return (
    <PageSection>
      <Content className={introStyle}>
        <Title headingLevel="h1">Customer assignment requests</Title>
        <Content component="p">
          Review pending requests to add customers to your list. Denied requests
          will remain here with an updated status.
        </Content>
      </Content>

      {vm.isLoading && <LoadingSpinner />}

      {vm.error && (
        <div className={introStyle}>
          <Alert isInline variant="danger" title="Customer Requests API error">
            {vm.error.message}
          </Alert>
        </div>
      )}

      {!vm.isLoading && !vm.error && vm.requests.length === 0 && (
        <EmptyState
          headingLevel="h4"
          icon={SearchIcon}
          titleText="No customer requests yet"
          variant="sm"
        />
      )}

      {!vm.isLoading && !vm.error && vm.requests.length > 0 && (
        <Table aria-label="Customer request table" variant="compact">
          <Thead>
            <Tr>
              <Th>Customer name</Th>
              <Th>Contact name</Th>
              <Th>Email</Th>
              <Th>Location</Th>
              <Th>Request date</Th>
              <Th>Status</Th>
              <Th>Reason</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortByNewestFirst(vm.requests).map((request) => (
              <Tr key={request.id}>
                <Td dataLabel="Customer name">{request.name}</Td>
                <Td dataLabel="Contact name">{request.contactName}</Td>
                <Td dataLabel="Email">{request.email}</Td>
                <Td dataLabel="Location">
                  {request.location ? request.location : "N/A"}
                </Td>
                <Td dataLabel="Request date">
                  {humanizeDate(new Date(request.createdAt))}
                </Td>
                <Td dataLabel="Status">
                  {request.requestStatus === "pending" ? (
                    <Flex spaceItems={{ default: "spaceItemsXs" }}>
                      <FlexItem>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            void handleAccept(request);
                          }}
                        >
                          Accept
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="secondary"
                          size="sm"
                          isDanger
                          onClick={() => setRequestToDeny(request)}
                        >
                          Deny
                        </Button>
                      </FlexItem>
                    </Flex>
                  ) : (
                    <RequestStatus status={request.requestStatus} />
                  )}
                </Td>
                <Td dataLabel="Reason">
                  {request.reason ? request.reason : "N/A"}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <DenyPartnerRequestModal
        isOpen={requestToDeny !== null}
        onClose={() => setRequestToDeny(null)}
        onSubmit={(values) => {
          void handleDeny(values);
        }}
      />
    </PageSection>
  );
};

CustomerRequestsSection.displayName = "CustomerRequestsSection";
