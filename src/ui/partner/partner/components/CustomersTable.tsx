import type { Customer } from "@openshift-migration-advisor/planner-sdk";
import { EmptyState, EmptyStateBody } from "@patternfly/react-core";
import { UserIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React, { useMemo } from "react";

interface CustomersTableProps {
  customers: Customer[];
}

export const CustomersTable: React.FC<CustomersTableProps> = ({
  customers,
}) => {
  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => a.name.localeCompare(b.name));
  }, [customers]);

  if (customers.length === 0) {
    return (
      <EmptyState
        headingLevel="h4"
        icon={UserIcon}
        titleText="No customers yet"
        variant="sm"
      >
        <EmptyStateBody>
          No customers yet. To get started, accept a pending requests.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Table aria-label="Customers table" variant="compact">
      <Thead>
        <Tr>
          <Th>Customer</Th>
          <Th>Contact name</Th>
          <Th>Username</Th>
          <Th>Email</Th>
          <Th>Location</Th>
        </Tr>
      </Thead>
      <Tbody>
        {sortedCustomers.map((customer) => (
          <Tr key={customer.username}>
            <Td dataLabel="Customer name">{customer.name}</Td>
            <Td dataLabel="Contact name">{customer.contactName}</Td>
            <Td dataLabel="Username">{customer.username}</Td>
            <Td dataLabel="Email">{customer.email}</Td>
            <Td dataLabel="Location">
              {customer.location ? customer.location : "N/A"}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

CustomersTable.displayName = "CustomersTable";
