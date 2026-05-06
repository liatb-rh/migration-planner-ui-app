import { css } from "@emotion/css";
import {
  Label,
  Pagination,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React, { useMemo, useState } from "react";

import type { MockVirtualMachine } from "../example-data/ovaVmFixture";

const MB_IN_GB = 1024;
const MB_IN_TB = 1024 * 1024;

const formatDiskSize = (sizeInMB: number): string => {
  if (sizeInMB >= MB_IN_TB) {
    const sizeInTB = sizeInMB / MB_IN_TB;
    return `${sizeInTB.toFixed(sizeInTB % 1 === 0 ? 0 : 2)} TB`;
  }
  const sizeInGB = sizeInMB / MB_IN_GB;
  return `${sizeInGB.toFixed(sizeInGB % 1 === 0 ? 0 : 2)} GB`;
};

const formatMemorySize = (sizeInMB: number): string => {
  const sizeInGB = sizeInMB / MB_IN_GB;
  return `${sizeInGB.toFixed(sizeInGB % 1 === 0 ? 0 : 2)} GB`;
};

const statusLabels: Record<string, string> = {
  poweredOn: "Powered on",
  poweredOff: "Powered off",
  suspended: "Suspended",
};

const tableStyle = css`
  th button {
    display: flex;
    align-items: center;
    width: 100%;
    text-align: left;
    justify-content: space-between;
    gap: 0.5rem;
  }
`;

interface ExampleVMTableProps {
  vms: MockVirtualMachine[];
}

export const ExampleVMTable: React.FC<ExampleVMTableProps> = ({ vms }) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVMs = useMemo(() => {
    if (!searchTerm.trim()) return vms;
    const lowerSearch = searchTerm.toLowerCase();
    return vms.filter(
      (vm) =>
        vm.name.toLowerCase().includes(lowerSearch) ||
        vm.id.toLowerCase().includes(lowerSearch),
    );
  }, [vms, searchTerm]);

  const paginatedVMs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredVMs.slice(start, start + pageSize);
  }, [filteredVMs, page, pageSize]);

  return (
    <>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              placeholder="Search by name or ID"
              value={searchTerm}
              onChange={(_e, value) => {
                setSearchTerm(value);
                setPage(1);
              }}
              onClear={() => {
                setSearchTerm("");
                setPage(1);
              }}
            />
          </ToolbarItem>
          <ToolbarItem variant="pagination" align={{ default: "alignEnd" }}>
            <Pagination
              itemCount={filteredVMs.length}
              perPage={pageSize}
              page={page}
              onSetPage={(_e, newPage) => setPage(newPage)}
              onPerPageSelect={(_e, newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              isCompact
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <Table aria-label="Virtual Machines" className={tableStyle}>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Status</Th>
            <Th>Migration Readiness</Th>
            <Th>Cluster</Th>
            <Th>Disk size</Th>
            <Th>Memory size</Th>
            <Th>Issues</Th>
          </Tr>
        </Thead>
        <Tbody>
          {paginatedVMs.map((vm) => (
            <Tr key={vm.id}>
              <Td dataLabel="Name">{vm.name}</Td>
              <Td dataLabel="Status">
                <Label
                  color={vm.vCenterState === "poweredOn" ? "green" : "grey"}
                  isCompact
                >
                  {statusLabels[vm.vCenterState] ?? vm.vCenterState}
                </Label>
              </Td>
              <Td dataLabel="Migration Readiness">
                {vm.migratable ? (
                  <Label color="green" icon={<CheckCircleIcon />} isCompact>
                    Ready
                  </Label>
                ) : vm.issueCount > 0 ? (
                  <Label
                    color="orange"
                    icon={<ExclamationTriangleIcon />}
                    isCompact
                  >
                    With warnings
                  </Label>
                ) : (
                  <Label color="red" icon={<ExclamationCircleIcon />} isCompact>
                    Not ready
                  </Label>
                )}
              </Td>
              <Td dataLabel="Cluster">{vm.cluster}</Td>
              <Td dataLabel="Disk size">{formatDiskSize(vm.diskSize)}</Td>
              <Td dataLabel="Memory size">{formatMemorySize(vm.memory)}</Td>
              <Td dataLabel="Issues">
                {vm.issueCount > 0 ? (
                  <Label color="orange" isCompact>
                    {vm.issueCount}
                  </Label>
                ) : (
                  "0"
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Toolbar>
        <ToolbarContent>
          <ToolbarItem variant="pagination" align={{ default: "alignEnd" }}>
            <Pagination
              itemCount={filteredVMs.length}
              perPage={pageSize}
              page={page}
              onSetPage={(_e, newPage) => setPage(newPage)}
              onPerPageSelect={(_e, newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              isCompact
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
    </>
  );
};

ExampleVMTable.displayName = "ExampleVMTable";
