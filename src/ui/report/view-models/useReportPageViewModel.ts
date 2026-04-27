import type {
  ClusterRequirementsResponse,
  Infra,
  InventoryData,
  Job,
  VMs,
} from "@openshift-migration-advisor/planner-sdk";
import { JobStatus } from "@openshift-migration-advisor/planner-sdk";
import { useInjection } from "@y0n1/react-ioc";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAsyncFn, useMount } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import type { IJobsStore } from "../../../data/stores/interfaces/IJobsStore";
import type { IReportStore } from "../../../data/stores/interfaces/IReportStore";
import type { ExportError } from "../../../data/stores/interfaces/IReportStore";
import type { ISourcesStore } from "../../../data/stores/interfaces/ISourcesStore";
import {
  JOB_POLLING_INTERVAL,
  TERMINAL_JOB_STATUSES,
} from "../../../data/stores/JobsStore";
import type { AssessmentModel } from "../../../models/AssessmentModel";
import type { SourceModel } from "../../../models/SourceModel";
import { routes } from "../../../routing/Routes";
import type { SnapshotLike } from "../../../services/html-export/types";
import type {
  PdfExtraPage,
  PdfExtraPageItem,
} from "../../../services/pdf-export/PdfExportService";
import {
  buildClusterViewModel,
  type ClusterViewModel,
  compareClustersByVmCount,
} from "../helpers/clusterViewModel";
import type { SizingFormValues } from "../views/cluster-sizer/types";
import {
  formatNumber,
  formatRatio,
  getCpuOvercommitLabel,
  getMemoryOvercommitLabel,
} from "./ClusterSizingHelpers";

// ---------------------------------------------------------------------------
// Sizing → PDF page builder
// ---------------------------------------------------------------------------

const buildSizingPdfExtraPage = (data: SizingPdfData): PdfExtraPage => {
  const { result, formValues, clusterName } = data;
  const isSNO = formValues.clusterMode === "single-node";
  const hasControlPlane = result.clusterSizing.controlPlaneNodes > 0;

  const cpuOverCommitRatio =
    result.resourceConsumption.overCommitRatio?.cpu ?? 0;
  const memoryOverCommitRatio =
    result.resourceConsumption.overCommitRatio?.memory ?? 0;
  const cpuLimits = result.resourceConsumption.limits?.cpu ?? 0;
  const memoryLimits = result.resourceConsumption.limits?.memory ?? 0;

  const items: PdfExtraPageItem[] = [
    { label: "Cluster name", value: clusterName },
    { label: "Target platform", value: "Bare metal" },
  ];

  if (isSNO) {
    items.push(
      {
        label: "Total nodes",
        value: String(result.clusterSizing.totalNodes),
      },
      {
        label: "Node size",
        value: `${formValues.controlPlaneCpu} CPU, ${formValues.controlPlaneMemoryGb} GB memory`,
      },
      {
        label: "VMs to migrate",
        value: formatNumber(result.inventoryTotals.totalVMs),
      },
      {
        label: "VM resources (request)",
        value: `${formatNumber(result.inventoryTotals.totalCPU)} CPU, ${formatNumber(result.inventoryTotals.totalMemory)} GB memory`,
      },
    );
  } else {
    items.push(
      {
        label: "Total nodes",
        value: `${result.clusterSizing.totalNodes} (${result.clusterSizing.workerNodes} workers + ${result.clusterSizing.controlPlaneNodes} control plane)`,
      },
      {
        label: "Failover capacity",
        value: `${result.clusterSizing.failoverNodes} failover nodes`,
      },
    );

    if (hasControlPlane) {
      items.push(
        {
          label: "Worker node size",
          value: `${formValues.customCpu} CPU, ${formValues.customMemoryGb} GB memory`,
        },
        {
          label: "Control plane node size",
          value: `${formValues.controlPlaneCpu} CPU, ${formValues.controlPlaneMemoryGb} GB memory`,
        },
      );
    } else {
      items.push({
        label: "Node size",
        value: `${formValues.customCpu} CPU, ${formValues.customMemoryGb} GB memory`,
      });
    }

    items.push(
      {
        label: "Overcommitment",
        value: `CPU ${getCpuOvercommitLabel(formValues.cpuOvercommitRatio)}, Memory ${getMemoryOvercommitLabel(formValues.memoryOvercommitRatio)}`,
      },
      {
        label: "VMs to migrate",
        value: formatNumber(result.inventoryTotals.totalVMs),
      },
      {
        label: "CPU over-commit ratio",
        value: formatRatio(cpuOverCommitRatio),
      },
      {
        label: "Memory over-commit ratio",
        value: formatRatio(memoryOverCommitRatio),
      },
      {
        label: "VM resources (request)",
        value: `${formatNumber(result.inventoryTotals.totalCPU)} CPU, ${formatNumber(result.inventoryTotals.totalMemory)} GB memory`,
      },
      {
        label: "With over-commit (limits)",
        value: `${formatNumber(cpuLimits)} CPU, ${formatNumber(memoryLimits)} GB memory`,
      },
      {
        label: "Physical capacity",
        value: `${formatNumber(result.clusterSizing.totalCPU)} CPU, ${formatNumber(result.clusterSizing.totalMemory)} GB memory`,
      },
    );
  }

  return {
    title: "Cluster sizing recommendations",
    items,
    footer:
      "Note: Resource requirements are estimates based on current workloads. Please verify this architecture with your SME team to ensure optimal performance.",
  };
};

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

/** Sizing result cached for inclusion in the PDF export. */
export interface SizingPdfData {
  result: ClusterRequirementsResponse;
  formValues: SizingFormValues;
  clusterName: string;
  clusterId: string;
}

export interface ReportPageViewModel {
  // Route param
  assessmentId: string | undefined;

  // Data (reactive from stores)
  assessment: AssessmentLike | undefined;
  source: SourceModel | undefined;
  isLoadingData: boolean;

  // Cluster view
  clusterView: ClusterViewModel;
  selectedClusterId: string;
  selectCluster: (clusterId: string) => void;
  isClusterSelectOpen: boolean;
  setClusterSelectOpen: (open: boolean) => void;
  clusterSelectDisabled: boolean;

  // Computed data from latest snapshot
  infra: Infra | undefined;
  vms: VMs | undefined;
  clusters: { [key: string]: InventoryData } | undefined;
  latestSnapshot: SnapshotLike;
  lastUpdatedText: string;
  clusterCount: number;

  // Scoped cluster view (typed with required fields for Dashboard rendering)
  scopedClusterView: ClusterScopedView | undefined;
  canExportReport: boolean;
  canShowClusterRecommendations: boolean;

  // Missing metrics (old inventories lacking CPU/Memory data)
  missingMetrics: string[];
  hasMissingMetrics: boolean;

  // Export
  isExporting: boolean;
  exportLoadingLabel: string | null;
  exportPdf: (container: HTMLElement) => void;
  exportHtml: () => void;
  exportError: ExportError | null;
  clearExportError: () => void;

  // Sizing wizard
  isSizingWizardOpen: boolean;
  setIsSizingWizardOpen: (open: boolean) => void;
  /**
   * All sizing results calculated in this session, keyed by clusterId.
   * Used by exportPdf to include recommendations for every sized cluster.
   */
  savedSizingDataMap: Record<string, SizingPdfData>;
  onSizingCalculated: (data: SizingPdfData) => void;

  // RVTools modal (create-new-assessment from report page)
  isRvtoolsModalOpen: boolean;
  openRvtoolsModal: () => void;
  closeRvtoolsModal: () => void;
  createRVToolsJob: (name: string, file: File) => Promise<void>;
  cancelRVToolsJob: () => Promise<void>;
  isCreatingJob: boolean;
  jobCreateError?: Error;
  isJobProcessing: boolean;
  jobProgressValue: number;
  jobProgressLabel: string;
  jobError: Error | null;
  isNavigatingToReport: boolean;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type AssessmentLike = {
  id: string | number;
  sourceId?: string;
  name?: string;
  sourceType?: string;
  snapshots?: SnapshotLike[];
};

type ClusterScopedView = ClusterViewModel &
  Required<
    Pick<ClusterViewModel, "viewInfra" | "viewVms" | "cpuCores" | "ramGB">
  >;

// ---------------------------------------------------------------------------
// Private helpers — job progress mappers
// ---------------------------------------------------------------------------

const getProgressValue = (status: JobStatus): number => {
  switch (status) {
    case JobStatus.Pending:
      return 20;
    case JobStatus.Validating:
      return 50;
    case JobStatus.Parsing:
      return 80;
    case JobStatus.Completed:
      return 100;
    default:
      return 0;
  }
};

const getProgressLabel = (status: JobStatus): string => {
  switch (status) {
    case JobStatus.Pending:
      return "Uploading file..";
    case JobStatus.Parsing:
      return "Parsing data..";
    case JobStatus.Validating:
      return "Validating vms..";
    case JobStatus.Completed:
      return "Complete!";
    case JobStatus.Failed:
      return "Failed";
    case JobStatus.Cancelled:
      return "Cancelled";
    default:
      return "";
  }
};

const extractJobErrorMessage = (message: string): string => {
  const lastColonIndex = message.lastIndexOf(":");
  return lastColonIndex !== -1
    ? message.slice(lastColonIndex + 1).trim()
    : message;
};

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export const useReportPageViewModel = (): ReportPageViewModel => {
  // ---- Route params --------------------------------------------------------
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ---- Stores --------------------------------------------------------------
  const assessmentsStore = useInjection<IAssessmentsStore>(
    Symbols.AssessmentsStore,
  );
  const sourcesStore = useInjection<ISourcesStore>(Symbols.SourcesStore);
  const reportStore = useInjection<IReportStore>(Symbols.ReportStore);
  const jobsStore = useInjection<IJobsStore>(Symbols.JobsStore);

  // ---- Reactive store data -------------------------------------------------
  const assessments = useSyncExternalStore(
    assessmentsStore.subscribe.bind(assessmentsStore),
    assessmentsStore.getSnapshot.bind(assessmentsStore),
  );

  useSyncExternalStore(
    sourcesStore.subscribe.bind(sourcesStore),
    sourcesStore.getSnapshot.bind(sourcesStore),
  );

  const exportState = useSyncExternalStore(
    reportStore.subscribe.bind(reportStore),
    reportStore.getSnapshot.bind(reportStore),
  );

  const jobState = useSyncExternalStore(
    jobsStore.subscribe.bind(jobsStore),
    jobsStore.getSnapshot.bind(jobsStore),
  );

  // ---- Initial data fetch (no polling — detail page) -----------------------
  const [fetchState, doFetchData] = useAsyncFn(async () => {
    await Promise.all([assessmentsStore.list(), sourcesStore.list()]);
  }, [assessmentsStore, sourcesStore]);

  useMount(() => {
    // Only fetch if data is not already loaded
    if (!assessments || assessments.length === 0) {
      void doFetchData();
    }
  });

  // ---- Assessment lookup ---------------------------------------------------
  const assessment = useMemo(
    () =>
      assessments?.find((a: AssessmentModel) => String(a.id) === String(id)),
    [assessments, id],
  );

  // ---- Source lookup -------------------------------------------------------
  const source = useMemo(
    () =>
      assessment?.sourceId
        ? sourcesStore.getById(assessment.sourceId)
        : undefined,
    [assessment, sourcesStore],
  );

  // ---- Local UI state ------------------------------------------------------
  const [userSelectedClusterId, setUserSelectedClusterId] = useState<
    string | null
  >(null);
  const [isClusterSelectOpen, setIsClusterSelectOpen] = useState(false);
  const [isSizingWizardOpen, setIsSizingWizardOpen] = useState(false);
  const [savedSizingDataMap, setSavedSizingDataMap] = useState<
    Record<string, SizingPdfData>
  >({});

  const onSizingCalculated = useCallback((data: SizingPdfData): void => {
    setSavedSizingDataMap((prev) => ({ ...prev, [data.clusterId]: data }));
  }, []);

  // ---- Snapshot data -------------------------------------------------------
  const latestSnapshot = useMemo((): SnapshotLike => {
    const snapshots = assessment?.snapshots || [];
    return snapshots.length > 0 ? snapshots[snapshots.length - 1] : {};
  }, [assessment?.snapshots]);

  const infra = useMemo(
    () =>
      (latestSnapshot.infra ||
        latestSnapshot.inventory?.infra ||
        latestSnapshot.inventory?.vcenter?.infra) as Infra | undefined,
    [latestSnapshot],
  );

  const vms = useMemo(
    () =>
      (latestSnapshot.vms ||
        latestSnapshot.inventory?.vms ||
        latestSnapshot.inventory?.vcenter?.vms) as VMs | undefined,
    [latestSnapshot],
  );

  const clusters = useMemo(
    () =>
      latestSnapshot.inventory?.clusters as
        | { [key: string]: InventoryData }
        | undefined,
    [latestSnapshot],
  );

  // ---- Cluster selection ---------------------------------------------------
  const assessmentClusters = assessment?.snapshots?.length
    ? (
        assessment.snapshots[assessment.snapshots.length - 1] as {
          inventory?: { clusters?: { [key: string]: InventoryData } };
        }
      ).inventory?.clusters
    : undefined;

  const selectedClusterId = useMemo(() => {
    if (userSelectedClusterId !== null) {
      const isValidSelection =
        userSelectedClusterId === "all" ||
        Boolean(
          assessmentClusters &&
          Object.prototype.hasOwnProperty.call(
            assessmentClusters,
            userSelectedClusterId,
          ),
        );
      if (isValidSelection) {
        return userSelectedClusterId;
      }
    }

    const clusterKeys = assessmentClusters
      ? Object.keys(assessmentClusters)
      : [];

    if (clusterKeys.length === 0) {
      return "all";
    }

    const sortedKeys = [...clusterKeys].sort((a, b) =>
      compareClustersByVmCount(a, b, assessmentClusters),
    );

    return sortedKeys[0];
  }, [userSelectedClusterId, assessmentClusters]);

  const selectCluster = useCallback((clusterId: string) => {
    setUserSelectedClusterId(clusterId);
  }, []);

  // ---- Cluster view model --------------------------------------------------
  const clusterView = useMemo(
    () =>
      buildClusterViewModel({
        infra,
        vms,
        clusters,
        selectedClusterId,
      }),
    [infra, vms, clusters, selectedClusterId],
  );

  const clusterSelectDisabled = clusterView.clusterOptions.length <= 1;

  // ---- Scoped cluster view -------------------------------------------------
  const isClusterScopedData = useCallback(
    (view: ClusterViewModel): view is ClusterScopedView =>
      Boolean(view.viewInfra && view.viewVms && view.cpuCores && view.ramGB),
    [],
  );

  const scopedClusterView = isClusterScopedData(clusterView)
    ? clusterView
    : undefined;

  // ---- Resource checks -----------------------------------------------------
  const hasClusterResources = useCallback(
    (viewInfra?: Infra, viewVms?: VMs): boolean => {
      const totalHosts = viewInfra?.totalHosts ?? 0;
      const hostsCount = viewInfra?.hosts?.length ?? 0;
      const hasHosts = totalHosts > 0 || hostsCount > 0;
      const hasVms = (viewVms?.total ?? 0) > 0;
      return hasHosts && hasVms;
    },
    [],
  );

  const canShowClusterRecommendations =
    selectedClusterId !== "all" &&
    hasClusterResources(clusterView.viewInfra, clusterView.viewVms);

  const canExportReport = hasClusterResources(
    clusterView.viewInfra,
    clusterView.viewVms,
  );

  // ---- Last updated text ---------------------------------------------------
  const lastUpdatedText = useMemo((): string => {
    // Delegate to the domain model's pre-computed latestSnapshot
    const model = assessment;
    return model?.latestSnapshot?.lastUpdated || "-";
  }, [assessment]);

  const clusterCount = clusters ? Object.keys(clusters).length : 0;

  // ---- Missing metrics detection -------------------------------------------
  // Uses the scoped (cluster-level) data that the Dashboard actually renders,
  // falling back to the aggregate snapshot data when no scoped view exists.
  const missingMetrics = useMemo((): string[] => {
    const activeVms = scopedClusterView?.viewVms ?? vms;
    const activeInfra = scopedClusterView?.viewInfra ?? infra;
    if (!activeVms || activeVms.total === 0) return [];

    const missing: string[] = [];

    const isEmpty = (
      obj: Record<string, unknown> | undefined | null,
    ): boolean => !obj || Object.keys(obj).length === 0;

    const isCpuMissing =
      !activeVms.cpuCores ||
      activeVms.cpuCores.total === 0 ||
      isEmpty(activeVms.distributionByCpuTier);
    if (isCpuMissing) missing.push("CPU");

    const isMemoryMissing =
      !activeVms.ramGB ||
      activeVms.ramGB.total === 0 ||
      isEmpty(activeVms.distributionByMemoryTier);
    if (isMemoryMissing) missing.push("Memory");

    if (isEmpty(activeVms.osInfo) && isEmpty(activeVms.os))
      missing.push("Operating systems");
    if (isEmpty(activeVms.diskSizeTier)) missing.push("Disk size tiers");
    if (isEmpty(activeVms.diskTypes)) missing.push("Disk types");
    if (!activeInfra?.hosts || activeInfra.hosts.length === 0)
      missing.push("Hosts");
    if (!activeInfra?.networks || activeInfra.networks.length === 0)
      missing.push("Networks");
    if (
      isEmpty(activeVms.distributionByNicCount) &&
      (!activeVms.nicCount || !activeVms.nicCount.total)
    )
      missing.push("NIC count");

    return missing;
  }, [scopedClusterView, vms, infra]);

  // ---- Export (reactive from ReportStore) ----------------------------------
  const isExporting =
    exportState.loadingState === "generating-pdf" ||
    exportState.loadingState === "generating-html";

  const exportLoadingLabel = useMemo((): string | null => {
    switch (exportState.loadingState) {
      case "generating-pdf":
        return "Generating PDF...";
      case "generating-html":
        return "Generating HTML...";
      default:
        return null;
    }
  }, [exportState.loadingState]);

  const exportPdf = useCallback(
    (container: HTMLElement): void => {
      const title = `${assessment?.name || `Assessment ${id}`} - vCenter report`;

      // Determine which sizing entries to include:
      // - Single cluster view → only that cluster (if calculated)
      // - All-clusters view → every cluster that has been sized
      const sizingEntries: SizingPdfData[] =
        selectedClusterId === "all"
          ? Object.values(savedSizingDataMap)
          : savedSizingDataMap[selectedClusterId]
            ? [savedSizingDataMap[selectedClusterId]]
            : [];

      const additionalTocItems = sizingEntries.map(
        (entry) => `- Cluster sizing recommendations: ${entry.clusterName}`,
      );

      const extraPages = sizingEntries.map(buildSizingPdfExtraPage);

      void reportStore.exportPdf(container, {
        documentTitle: title,
        additionalTocItems,
        extraPages,
      });
    },
    [reportStore, assessment?.name, id, savedSizingDataMap, selectedClusterId],
  );

  const exportHtml = useCallback((): void => {
    const inventory =
      source?.inventory ?? latestSnapshot?.inventory ?? latestSnapshot;
    if (!inventory) {
      return;
    }
    const title = `${assessment?.name || `Assessment ${id}`} - vCenter report`;
    void reportStore.exportHtml(inventory, { documentTitle: title });
  }, [reportStore, source, latestSnapshot, assessment?.name, id]);

  const clearExportError = useCallback((): void => {
    reportStore.clearError();
  }, [reportStore]);

  // ---- RVTools modal (create-new-assessment from report page) ---------------
  const [isRvtoolsModalOpen, setIsRvtoolsModalOpen] = useState(false);

  const openRvtoolsModal = useCallback(
    (): void => setIsRvtoolsModalOpen(true),
    [],
  );
  const closeRvtoolsModal = useCallback((): void => {
    void jobsStore.cancelRVToolsJob();
    setIsRvtoolsModalOpen(false);
  }, [jobsStore]);

  const createRVToolsJob = useCallback(
    async (name: string, file: File): Promise<void> => {
      const job = await jobsStore.createRVToolsJob(name, file);
      if (job) {
        jobsStore.startPolling(JOB_POLLING_INTERVAL);
      }
    },
    [jobsStore],
  );

  const cancelRVToolsJob = useCallback(async (): Promise<void> => {
    jobsStore.stopPolling();
    const latestJob = await jobsStore.cancelRVToolsJob();
    if (latestJob?.status === JobStatus.Completed && latestJob.assessmentId) {
      try {
        await assessmentsStore.remove(latestJob.assessmentId);
      } catch (err) {
        console.error("Failed to delete assessment after job cancel:", err);
      }
    }
  }, [jobsStore, assessmentsStore]);

  // Navigate to the new report when the RVTools job completes
  const prevJobRef = useRef<Job | null>(null);
  const isNavigatingRef = useRef(false);

  const [rvtoolsNavigationState, navigateToReport] = useAsyncFn(
    async (assessmentId: string) => {
      try {
        await assessmentsStore.list();
        setIsRvtoolsModalOpen(false);
        navigate(routes.assessmentReport(assessmentId));
      } finally {
        isNavigatingRef.current = false;
        jobsStore.reset();
      }
    },
    [assessmentsStore, navigate, jobsStore],
  );

  useEffect(() => {
    const { currentJob } = jobState;
    const prevJob = prevJobRef.current;
    prevJobRef.current = currentJob;

    if (
      currentJob?.status === JobStatus.Completed &&
      currentJob.assessmentId &&
      prevJob?.status !== JobStatus.Completed &&
      !isNavigatingRef.current
    ) {
      const assessmentId = currentJob.assessmentId;
      isNavigatingRef.current = true;
      jobsStore.stopPolling();
      jobsStore.reset();

      void navigateToReport(assessmentId);
    }
  }, [jobState, jobsStore, navigateToReport]);

  const { currentJob } = jobState;

  const isJobProcessing = Boolean(
    currentJob && !TERMINAL_JOB_STATUSES.includes(currentJob.status),
  );

  const jobProgressValue = currentJob ? getProgressValue(currentJob.status) : 0;

  const jobProgressLabel = currentJob
    ? getProgressLabel(currentJob.status)
    : "";

  const jobError = useMemo(() => {
    return currentJob?.status === JobStatus.Failed
      ? new Error(
          extractJobErrorMessage(currentJob.error || "Processing failed"),
        )
      : null;
  }, [currentJob]);

  // ---- Return --------------------------------------------------------------
  return {
    assessmentId: id,

    assessment,
    source,
    isLoadingData: fetchState.loading,

    clusterView,
    selectedClusterId,
    selectCluster,
    isClusterSelectOpen,
    setClusterSelectOpen: setIsClusterSelectOpen,
    clusterSelectDisabled,

    infra,
    vms,
    clusters,
    latestSnapshot,
    lastUpdatedText,
    clusterCount,

    scopedClusterView,
    canExportReport,
    canShowClusterRecommendations,

    missingMetrics,
    hasMissingMetrics: missingMetrics.length > 0,

    isExporting,
    exportLoadingLabel,
    exportPdf,
    exportHtml,
    exportError: exportState.error,
    clearExportError,

    isSizingWizardOpen,
    setIsSizingWizardOpen,
    savedSizingDataMap,
    onSizingCalculated,

    isRvtoolsModalOpen,
    openRvtoolsModal,
    closeRvtoolsModal,
    createRVToolsJob,
    cancelRVToolsJob,
    isCreatingJob: jobState.isCreating,
    jobCreateError: jobState.createError,
    isJobProcessing,
    jobProgressValue,
    jobProgressLabel,
    jobError,
    // Cover the one-render gap between the poll that marks the job Completed
    // (isJobProcessing becomes false) and the effect that starts navigation
    // (rvtoolsNavigationState.loading becomes true).
    isNavigatingToReport:
      rvtoolsNavigationState.loading ||
      Boolean(
        currentJob?.status === JobStatus.Completed && currentJob?.assessmentId,
      ),
  };
};
