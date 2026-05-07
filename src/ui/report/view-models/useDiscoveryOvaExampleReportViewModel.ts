import type {
  Infra,
  Inventory,
  InventoryData,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";
import React, { useMemo, useState } from "react";

import {
  buildClusterViewModel,
  type ClusterViewModel,
} from "../views/assessment-report/ClusterView";
import type { ExampleClusterData } from "../views/example-data/clusterSizingFixture";
import { EXAMPLE_SIZING_MAP } from "../views/example-data/clusterSizingFixture";
import { getExampleInventory } from "../views/example-data/inventoryFixture";
import type { MockVirtualMachine } from "../views/example-data/ovaVmFixture";
import { EXAMPLE_OVA_VMS } from "../views/example-data/ovaVmFixture";

export interface DiscoveryOvaExampleReportVM {
  infra: Infra | undefined;
  vms: VMs | undefined;
  clusters: { [key: string]: InventoryData } | undefined;
  clusterCount: number;
  clusterSelectDisabled: boolean;

  selectedClusterId: string;
  clusterView: ClusterViewModel;

  isClusterSelectOpen: boolean;
  setIsClusterSelectOpen: (open: boolean) => void;

  activeTab: string | number;
  handleTabSelect: (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: string | number,
  ) => void;

  handleClusterSelect: (
    event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => void;

  isSizingWizardOpen: boolean;
  setIsSizingWizardOpen: (open: boolean) => void;
  exampleSizing: ExampleClusterData | null;

  filteredVMs: MockVirtualMachine[];
}

export function useDiscoveryOvaExampleReportViewModel(): DiscoveryOvaExampleReportVM {
  const inventory: Inventory = getExampleInventory();
  const infra = inventory.vcenter?.infra;
  const vms = inventory.vcenter?.vms;
  const clusters = inventory.clusters;

  const [userSelectedClusterId, setUserSelectedClusterId] = useState<
    string | null
  >(null);
  const [isClusterSelectOpen, setIsClusterSelectOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | number>(0);
  const [isSizingWizardOpen, setIsSizingWizardOpen] = useState(false);

  const selectedClusterId = useMemo(
    () => userSelectedClusterId ?? "all",
    [userSelectedClusterId],
  );

  const clusterView = useMemo(
    () => buildClusterViewModel({ infra, vms, clusters, selectedClusterId }),
    [infra, vms, clusters, selectedClusterId],
  );

  const clusterCount = clusters ? Object.keys(clusters).length : 0;
  const clusterSelectDisabled = clusterCount <= 0;

  const exampleSizing =
    selectedClusterId !== "all"
      ? (EXAMPLE_SIZING_MAP[selectedClusterId] ?? null)
      : null;

  const filteredVMs = useMemo(() => {
    if (selectedClusterId === "all") return EXAMPLE_OVA_VMS;
    return EXAMPLE_OVA_VMS.filter((vm) => vm.cluster === selectedClusterId);
  }, [selectedClusterId]);

  const handleClusterSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    if (typeof value === "string") {
      setUserSelectedClusterId(value);
      setIsClusterSelectOpen(false);
      setActiveTab(0);
    }
  };

  const handleTabSelect = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: string | number,
  ) => {
    setActiveTab(tabIndex);
  };

  return {
    infra,
    vms,
    clusters,
    clusterCount,
    clusterSelectDisabled,
    selectedClusterId,
    clusterView,
    isClusterSelectOpen,
    setIsClusterSelectOpen,
    activeTab,
    handleTabSelect,
    handleClusterSelect,
    isSizingWizardOpen,
    setIsSizingWizardOpen,
    exampleSizing,
    filteredVMs,
  };
}
