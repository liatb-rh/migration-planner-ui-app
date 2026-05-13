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

export interface ExampleReportVM {
  infra: Infra | undefined;
  vms: VMs | undefined;
  clusters: { [key: string]: InventoryData } | undefined;
  clusterCount: number;
  clusterSelectDisabled: boolean;
  detectedSummaryText: string;

  selectedClusterId: string;
  clusterView: ClusterViewModel;

  isClusterSelectOpen: boolean;
  setIsClusterSelectOpen: (open: boolean) => void;

  handleClusterSelect: (
    event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => void;

  isSizingWizardOpen: boolean;
  setIsSizingWizardOpen: (open: boolean) => void;
  exampleSizing: ExampleClusterData | null;
}

export function useExampleReportViewModel(): ExampleReportVM {
  const inventory: Inventory = getExampleInventory();
  const infra = inventory.vcenter?.infra;
  const vms = inventory.vcenter?.vms;
  const clusters = inventory.clusters;

  const [userSelectedClusterId, setUserSelectedClusterId] = useState<
    string | null
  >(null);
  const [isClusterSelectOpen, setIsClusterSelectOpen] = useState(false);
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

  const detectedSummaryText = useMemo(() => {
    if (clusterCount <= 0) return "No clusters detected";
    const clusterLabel =
      clusterCount === 1 ? "vSphere cluster" : "vSphere clusters";
    const totalVMs = vms?.total;
    if (typeof totalVMs === "number") {
      return `Detected ${totalVMs} VMs in ${clusterCount} ${clusterLabel}`;
    }
    return `Detected ${clusterCount} ${clusterLabel}`;
  }, [vms?.total, clusterCount]);

  const handleClusterSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    if (value == null) return;
    setUserSelectedClusterId(String(value));
    setIsClusterSelectOpen(false);
  };

  return {
    infra,
    vms,
    clusters,
    clusterCount,
    clusterSelectDisabled,
    detectedSummaryText,
    selectedClusterId,
    clusterView,
    isClusterSelectOpen,
    setIsClusterSelectOpen,
    handleClusterSelect,
    isSizingWizardOpen,
    setIsSizingWizardOpen,
    exampleSizing,
  };
}
