import type {
  Infra,
  InventoryData,
  VMResourceBreakdown,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";

export type ClusterSelection = string;

export type ClusterOption = { id: string; label: string };

export type ClusterViewModel = {
  viewInfra?: Infra;
  viewVms?: VMs;
  viewClusters?: { [key: string]: InventoryData };
  cpuCores?: VMResourceBreakdown;
  ramGB?: VMResourceBreakdown;
  nicCount?: VMResourceBreakdown;
  isAggregateView: boolean;
  selectionId: ClusterSelection;
  selectionLabel: string;
  clusterOptions: ClusterOption[];
  clusterFound: boolean;
};

/**
 * Domain-layer comparator: sorts cluster keys by VM count (descending), then by name (ascending).
 */
export const compareClustersByVmCount = (
  a: string,
  b: string,
  clusters?: { [key: string]: InventoryData },
): number => {
  const vmsA = clusters?.[a]?.vms?.total ?? 0;
  const vmsB = clusters?.[b]?.vms?.total ?? 0;
  return vmsB - vmsA || a.localeCompare(b);
};

export const getClusterOptions = (clusters?: {
  [key: string]: InventoryData;
}): ClusterOption[] => {
  const keys = clusters ? Object.keys(clusters) : [];
  const sortedKeys = [...keys].sort((a, b) =>
    compareClustersByVmCount(a, b, clusters),
  );
  return [
    { id: "all", label: "All clusters" },
    ...sortedKeys.map((key) => ({ id: key, label: key })),
  ];
};

/**
 * Build a view model for the selected cluster.
 *
 * - When "all" is selected, return aggregate data.
 * - When a cluster is selected but data is missing, return an empty view (no infra/vms)
 *   so the UI can show a non-blocking empty state instead of falling back to aggregates.
 * - If the selected cluster no longer exists in the map, fall back to "all".
 */
export const buildClusterViewModel = ({
  infra,
  vms,
  clusters,
  selectedClusterId = "all",
}: {
  infra?: Infra;
  vms?: VMs;
  clusters?: { [key: string]: InventoryData };
  selectedClusterId?: ClusterSelection;
}): ClusterViewModel => {
  const options = getClusterOptions(clusters);
  const clusterExists =
    selectedClusterId === "all"
      ? true
      : Boolean(
          clusters &&
          Object.prototype.hasOwnProperty.call(clusters, selectedClusterId),
        );
  const effectiveSelection =
    selectedClusterId === "all" || clusterExists ? selectedClusterId : "all";

  if (effectiveSelection === "all") {
    return {
      viewInfra: infra,
      viewVms: vms,
      cpuCores: vms?.cpuCores,
      ramGB: vms?.ramGB,
      nicCount: vms?.nicCount,
      viewClusters: clusters,
      isAggregateView: true,
      selectionId: "all",
      selectionLabel: "All clusters",
      clusterOptions: options,
      clusterFound: true,
    };
  }

  const clusterData = clusters ? clusters[effectiveSelection] : undefined;
  const clusterInfra = clusterData?.infra;
  const clusterVms = clusterData?.vms;
  const selectionLabel = clusterData ? effectiveSelection : "Missing cluster";

  return {
    viewInfra: clusterInfra,
    viewVms: clusterVms,
    cpuCores: clusterVms?.cpuCores,
    ramGB: clusterVms?.ramGB,
    nicCount: clusterVms?.nicCount,
    viewClusters: clusterData
      ? { [effectiveSelection]: clusterData }
      : undefined,
    isAggregateView: false,
    selectionId: effectiveSelection,
    selectionLabel,
    clusterOptions: options,
    clusterFound: Boolean(clusterData),
  };
};
