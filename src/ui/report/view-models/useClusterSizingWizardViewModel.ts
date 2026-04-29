import type {
  MigrationComplexityResponse,
  MigrationEstimationByComplexityResponse,
} from "@openshift-migration-advisor/planner-sdk";
import { ResponseError } from "@openshift-migration-advisor/planner-sdk";
import { useInjection } from "@y0n1/react-ioc";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useAsyncFn } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import type { CostEstimationResponse } from "../../../models/AssessmentModel";
import {
  DEFAULT_ESTIMATION_FORM_VALUES,
  DEFAULT_FORM_VALUES,
  SMT_THREADS_MAX,
  SMT_THREADS_MIN,
  WORKER_NODE_PRESETS,
} from "../views/cluster-sizer/constants";
import type {
  ClusterRequirementsResponse,
  EstimationFormValues,
  MigrationEstimationResponse,
  SizingFormValues,
} from "../views/cluster-sizer/types";
import {
  estimationFormToParams,
  formValuesToRequest,
} from "../views/cluster-sizer/types";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface ClusterSizingWizardViewModel {
  formValues: SizingFormValues;
  setFormValues: (v: SizingFormValues) => void;
  showWorkerNode: boolean;
  showControlPlane: boolean;
  showControlPlaneScheduling: boolean;
  showSmt: boolean;
  sizerOutput: ClusterRequirementsResponse | null;
  isCalculating: boolean;
  calculateError: Error | undefined;
  calculate: () => Promise<void>;
  estimationFormValues: EstimationFormValues;
  setEstimationFormValues: (v: EstimationFormValues) => void;
  migrationEstimation: MigrationEstimationResponse | null;
  isCalculatingEstimation: boolean;
  estimationError: Error | undefined;
  calculateEstimation: () => Promise<void>;
  complexityEstimation: MigrationComplexityResponse | null;
  isCalculatingComplexity: boolean;
  complexityError: Error | undefined;
  calculateComplexity: () => Promise<void>;
  estimationByComplexity: MigrationEstimationByComplexityResponse | null;
  isCalculatingEstimationByComplexity: boolean;
  estimationByComplexityError: Error | undefined;
  isFormValid: boolean;
  ensureEstimationForMenu: (menuItem: string | null) => void;
  reset: () => void;
  isCostEstimationTabVisible: boolean;
  getCostEstimation: () => void;
  costEstimation: CostEstimationResponse | null;
  isLoadingCostEstimation: boolean;
  costEstimationError: Error | undefined;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Options for pre-populating the sizing wizard with existing data.
 *
 * **Capture-once contract**: `useClusterSizingWizardViewModel` freezes these
 * options on the first render via `useMemo(() => ({ ... }), [])` (see
 * `initialValues` in the hook body). Any changes to option values after the
 * first render are silently ignored — subsequent renders will continue using
 * the snapshot taken on mount. If you need the wizard to reflect new initial
 * values, remount the component by changing its React `key` prop.
 */
export interface UseClusterSizingWizardOptions {
  /** Pre-populate the sizing result (bypasses the API call). */
  initialSizerOutput?: ClusterRequirementsResponse;
  /** Pre-populate the input form values. */
  initialFormValues?: SizingFormValues;
  /** Pre-populate the time estimation result (bypasses the API call). */
  initialMigrationEstimation?: MigrationEstimationResponse;
  /** Pre-populate the complexity estimation result (bypasses the API call). */
  initialComplexityEstimation?: MigrationComplexityResponse;
  /** Pre-populate the estimation-by-complexity result (bypasses the API call). */
  initialEstimationByComplexity?: MigrationEstimationByComplexityResponse;
}

export const useClusterSizingWizardViewModel = (
  assessmentId: string,
  clusterId: string,
  options?: UseClusterSizingWizardOptions,
): ClusterSizingWizardViewModel => {
  const assessmentsStore = useInjection<IAssessmentsStore>(
    Symbols.AssessmentsStore,
  );
  useSyncExternalStore(
    assessmentsStore.subscribe.bind(assessmentsStore),
    assessmentsStore.getSnapshot.bind(assessmentsStore),
  );

  // Capture initial option values once so reset() can restore them.
  const initialValues = useMemo(
    () => ({
      formValues: options?.initialFormValues ?? DEFAULT_FORM_VALUES,
      sizerOutput: options?.initialSizerOutput ?? null,
      migrationEstimation: options?.initialMigrationEstimation ?? null,
      complexityEstimation: options?.initialComplexityEstimation ?? null,
      estimationByComplexity: options?.initialEstimationByComplexity ?? null,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [formValues, setFormValues] = useState<SizingFormValues>(
    initialValues.formValues,
  );
  const [estimationFormValues, setEstimationFormValues] =
    useState<EstimationFormValues>(DEFAULT_ESTIMATION_FORM_VALUES);
  const [sizerOutput, setSizerOutput] =
    useState<ClusterRequirementsResponse | null>(initialValues.sizerOutput);
  const [migrationEstimation, setMigrationEstimation] =
    useState<MigrationEstimationResponse | null>(
      initialValues.migrationEstimation,
    );
  const [complexityEstimation, setComplexityEstimation] =
    useState<MigrationComplexityResponse | null>(
      initialValues.complexityEstimation,
    );
  const [estimationByComplexity, setEstimationByComplexity] =
    useState<MigrationEstimationByComplexityResponse | null>(
      initialValues.estimationByComplexity,
    );
  const [costEstimation, setCostEstimation] =
    useState<CostEstimationResponse | null>(null);
  const [manualCalculateError, setManualCalculateError] = useState<
    Error | undefined
  >(undefined);
  const [manualEstimationError, setManualEstimationError] = useState<
    Error | undefined
  >(undefined);
  const [manualCostEstimationError, setManualCostEstimationError] = useState<
    Error | undefined
  >(undefined);
  const [manualComplexityError, setManualComplexityError] = useState<
    Error | undefined
  >(undefined);
  const [manualEstByComplexityError, setManualEstByComplexityError] = useState<
    Error | undefined
  >(undefined);
  const [resetCounter, setResetCounter] = useState<number>(0);
  const latestComplexityRequestIdRef = useRef<string>("");

  const smtVisible =
    formValues.clusterMode === "full-ha" ||
    formValues.clusterMode === "hosted-control-plane";

  const hasSmtError =
    smtVisible &&
    formValues.smtEnabled &&
    (formValues.smtThreads < SMT_THREADS_MIN ||
      formValues.smtThreads > SMT_THREADS_MAX);

  const [calculateState, doCalculate] = useAsyncFn(async () => {
    if (hasSmtError) {
      return;
    }

    setManualCalculateError(undefined);
    // Get worker node CPU and memory based on preset or custom values
    const workerCpu =
      formValues.workerNodePreset !== "custom"
        ? WORKER_NODE_PRESETS[formValues.workerNodePreset].cpu
        : formValues.customCpu;
    const workerMemory =
      formValues.workerNodePreset !== "custom"
        ? WORKER_NODE_PRESETS[formValues.workerNodePreset].memoryGb
        : formValues.customMemoryGb;

    // Build the API request payload
    const clusterRequirementsRequest = formValuesToRequest(
      clusterId,
      formValues,
      workerCpu,
      workerMemory,
    );

    try {
      // POST /api/v1/assessments/{id}/cluster-requirements
      const result =
        await assessmentsStore.calculateAssessmentClusterRequirements({
          id: assessmentId,
          clusterRequirementsRequest,
        });

      setSizerOutput(result);
    } catch (err) {
      if (err instanceof ResponseError) {
        const message = await err.response.text();
        const combinedMessage = message
          ? `${err.message}: ${message}`
          : err.message;
        const error = new Error(combinedMessage, { cause: message });
        setManualCalculateError(error);
        throw error;
      }
      const error =
        err instanceof Error ? err : new Error("Failed to calculate sizing");
      setManualCalculateError(error);
      throw error;
    }
  }, [assessmentId, assessmentsStore, clusterId, formValues]);

  const [estimationState, doCalculateEstimation] = useAsyncFn(async () => {
    setManualEstimationError(undefined);
    try {
      const result = await assessmentsStore.calculateMigrationEstimation({
        id: assessmentId,
        migrationEstimationRequest: {
          clusterId,
          estimationSchema: ["network-based", "storage-offload"],
          params: estimationFormToParams(estimationFormValues),
        },
      });

      const hasSchemas =
        result?.estimation && Object.keys(result.estimation).length > 0;
      setMigrationEstimation(hasSchemas ? result : null);
    } catch (err) {
      if (err instanceof ResponseError) {
        const message = await err.response.text();
        const combinedMessage = message
          ? `${err.message}: ${message}`
          : err.message;
        const error = new Error(combinedMessage, { cause: message });
        setManualEstimationError(error);
        throw error;
      }
      const error =
        err instanceof Error
          ? err
          : new Error("Failed to calculate migration estimation");
      setManualEstimationError(error);
      throw error;
    }
  }, [assessmentId, assessmentsStore, clusterId, estimationFormValues]);

  const [complexityState, doCalculateComplexity] = useAsyncFn(async () => {
    setManualComplexityError(undefined);
    const requestId = `${assessmentId}-${clusterId}-${Date.now()}`;
    latestComplexityRequestIdRef.current = requestId;

    try {
      const result = await assessmentsStore.calculateComplexityEstimation({
        id: assessmentId,
        migrationComplexityRequest: { clusterId },
      });

      if (latestComplexityRequestIdRef.current === requestId) {
        setComplexityEstimation(result);
      }
    } catch (err) {
      if (latestComplexityRequestIdRef.current !== requestId) {
        return;
      }

      if (err instanceof ResponseError) {
        const message = await err.response.text();
        const combinedMessage = message
          ? `${err.message}: ${message}`
          : err.message;
        const error = new Error(combinedMessage, { cause: message });
        setManualComplexityError(error);
        throw error;
      }
      const error =
        err instanceof Error
          ? err
          : new Error("Failed to calculate complexity estimation");
      setManualComplexityError(error);
      throw error;
    }
  }, [assessmentId, assessmentsStore, clusterId]);

  const [estByComplexityState, doCalculateEstimationByComplexity] =
    useAsyncFn(async () => {
      setManualEstByComplexityError(undefined);
      try {
        const result = await assessmentsStore.calculateEstimationByComplexity({
          id: assessmentId,
          migrationEstimationRequest: {
            clusterId,
            estimationSchema: ["network-based", "storage-offload"],
            params: {
              work_hours_per_day: 8,
              post_migration_engineers: 10,
              transfer_rate_mbps: 620,
            },
          },
        });
        setEstimationByComplexity(result);
      } catch (err) {
        if (err instanceof ResponseError) {
          const message = await err.response.text();
          const combinedMessage = message
            ? `${err.message}: ${message}`
            : err.message;
          const error = new Error(combinedMessage, { cause: message });
          setManualEstByComplexityError(error);
          throw error;
        }
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to calculate estimation by complexity");
        setManualEstByComplexityError(error);
        throw error;
      }
    }, [assessmentId, assessmentsStore, clusterId]);

  const [costEstimationState, doGetCostEstimation] = useAsyncFn(
    async () => {
      setManualCostEstimationError(undefined);
      const costEstimation = await assessmentsStore.calculateCostEstimation({
        assessmentId,
        clusterId,
        discounts: {
          vcfDiscountPct: 0,
          vvfDiscountPct: 0,
          redhatDiscountPct: 0,
          aapDiscountPct: 0,
        },
      });
      setCostEstimation(costEstimation);
    },
    [assessmentId, assessmentsStore, clusterId],
    { loading: true },
  );

  const getCostEstimation = () => {
    void doGetCostEstimation().catch((err: unknown) => {
      setManualCostEstimationError(
        err instanceof Error
          ? err
          : new Error("Failed to calculate cost estimation"),
      );
    });
  };

  const ensureEstimationForMenu = useCallback(
    (menuItem: string | null) => {
      if (menuItem === "cost-estimation") {
        if (!costEstimation && !costEstimationState.error) {
          void doGetCostEstimation();
        }
      }
      if (menuItem === "complexity") {
        if (
          !complexityEstimation &&
          !complexityState.loading &&
          !manualComplexityError
        ) {
          void doCalculateComplexity();
        }
        if (
          !estimationByComplexity &&
          !estByComplexityState.loading &&
          !manualEstByComplexityError
        ) {
          void doCalculateEstimationByComplexity();
        }
      }
    },
    [
      costEstimation,
      costEstimationState.error,
      doGetCostEstimation,
      complexityEstimation,
      complexityState.loading,
      manualComplexityError,
      doCalculateComplexity,
      estimationByComplexity,
      estByComplexityState.loading,
      manualEstByComplexityError,
      doCalculateEstimationByComplexity,
    ],
  );

  const reset = useCallback(() => {
    setFormValues(initialValues.formValues);
    setEstimationFormValues(DEFAULT_ESTIMATION_FORM_VALUES);
    setSizerOutput(initialValues.sizerOutput);
    setMigrationEstimation(initialValues.migrationEstimation);
    setComplexityEstimation(initialValues.complexityEstimation);
    setEstimationByComplexity(initialValues.estimationByComplexity);
    setCostEstimation(null);
    setManualCostEstimationError(undefined);
    setManualCalculateError(undefined);
    setManualEstimationError(undefined);
    setManualComplexityError(undefined);
    setManualEstByComplexityError(undefined);
    setResetCounter((prev) => prev + 1);
  }, [initialValues]);

  const showWorkerNode =
    formValues.clusterMode === "full-ha" ||
    formValues.clusterMode === "hosted-control-plane";
  const showControlPlane =
    formValues.clusterMode === "full-ha" ||
    formValues.clusterMode === "single-node";
  const showControlPlaneScheduling = formValues.clusterMode === "full-ha";
  const showSmt = smtVisible;

  const isFormValid = !hasSmtError;

  return {
    formValues,
    setFormValues,
    showWorkerNode,
    showControlPlane,
    showControlPlaneScheduling,
    showSmt,
    sizerOutput,
    isCalculating: calculateState.loading,
    calculateError:
      manualCalculateError ??
      (resetCounter > 0 ? undefined : calculateState.error),
    calculate: doCalculate,
    estimationFormValues,
    setEstimationFormValues,
    migrationEstimation,
    isCalculatingEstimation: estimationState.loading,
    estimationError:
      manualEstimationError ??
      (resetCounter > 0 ? undefined : estimationState.error),
    calculateEstimation: doCalculateEstimation,
    complexityEstimation,
    isCalculatingComplexity: complexityState.loading,
    complexityError:
      manualComplexityError ??
      (resetCounter > 0 ? undefined : complexityState.error),
    calculateComplexity: doCalculateComplexity,
    estimationByComplexity,
    isCalculatingEstimationByComplexity: estByComplexityState.loading,
    estimationByComplexityError:
      manualEstByComplexityError ??
      (resetCounter > 0 ? undefined : estByComplexityState.error),
    isFormValid,
    ensureEstimationForMenu,
    reset,
    isCostEstimationTabVisible: false,
    getCostEstimation,
    costEstimation,
    isLoadingCostEstimation: costEstimationState.loading,
    costEstimationError: manualCostEstimationError ?? costEstimationState.error,
  };
};
