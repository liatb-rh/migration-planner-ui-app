import { useMemo, useState } from "react";

import type { MockVirtualMachine } from "../views/example-data/ovaVmFixture";

interface UseExampleVMTableResult {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredVMs: MockVirtualMachine[];
  paginatedVMs: MockVirtualMachine[];
}

export function useExampleVMTable(
  vms: MockVirtualMachine[],
  initialPageSize = 20,
): UseExampleVMTableResult {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
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

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    searchTerm,
    setSearchTerm,
    filteredVMs,
    paginatedVMs,
  };
}
