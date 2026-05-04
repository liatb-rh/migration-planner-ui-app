import {
  type AssessmentApiInterface,
  type CalculateAssessmentClusterRequirementsRequest,
  type CalculateMigrationComplexityRequest,
  type CalculateMigrationEstimationByComplexityRequest,
  type CalculateMigrationEstimationRequest,
  type GetAssessmentClusterRequirementsStoredInputRequest,
  ResponseError,
} from "@openshift-migration-advisor/planner-sdk";
import { type Assessment } from "@openshift-migration-advisor/planner-sdk";
import {
  type Configuration,
  type InitOverrideFunction,
  type Middleware,
} from "@openshift-migration-advisor/planner-sdk";

import { parseApiError } from "../../lib/common/ErrorParser";
import { PollableStoreBase } from "../../lib/mvvm/PollableStore";
import {
  type AssessmentModel,
  type CalculateCostEstimationRequest,
  type CostEstimationResponse,
  createAssessmentModel,
} from "../../models/AssessmentModel";
import type { IAssessmentsStore } from "./interfaces/IAssessmentsStore";

export type AssessmentListResponse =
  | Assessment[]
  | { items?: Assessment[] }
  | { assessments?: Assessment[] };

type AssessmentCreateForm = Parameters<
  AssessmentApiInterface["createAssessment"]
>[0]["assessmentForm"];
type AssessmentUpdateForm = Parameters<
  AssessmentApiInterface["updateAssessment"]
>[0]["assessmentUpdate"];

const normalizeListResponse = (
  response: AssessmentListResponse,
): Assessment[] => {
  if (Array.isArray(response)) {
    return response;
  }
  if ("items" in response && Array.isArray(response.items)) {
    return response.items;
  }
  if ("assessments" in response && Array.isArray(response.assessments)) {
    return response.assessments;
  }
  return [];
};

export class AssessmentsStore
  extends PollableStoreBase<AssessmentModel[]>
  implements IAssessmentsStore
{
  private assessments: AssessmentModel[] = [];
  private api: AssessmentApiInterface;
  private deletedAssessmentIds = new Set<string>();

  constructor(api: AssessmentApiInterface) {
    super();
    this.api = api;
  }

  async list(
    sourceId?: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel[]> {
    const response = (await this.api.listAssessments(
      { sourceId },
      initOverrides,
    )) as AssessmentListResponse;
    const rawAssessments = normalizeListResponse(response).map(
      createAssessmentModel,
    );

    // Clean up the deleted IDs cache: if an ID is marked as deleted but no longer
    // appears in the server response, the backend has confirmed the deletion.
    // Only do this for unfiltered responses to avoid clearing the cache when
    // the server returns a source-filtered subset.
    if (!sourceId) {
      const serverIds = new Set(rawAssessments.map((a) => a.id));
      this.deletedAssessmentIds.forEach((deletedId) => {
        if (!serverIds.has(deletedId)) {
          this.deletedAssessmentIds.delete(deletedId);
        }
      });
    }

    // Filter out recently deleted assessments that the backend hasn't processed yet
    this.assessments = rawAssessments.filter(
      (a) => !this.deletedAssessmentIds.has(a.id),
    );

    this.notify();
    return this.assessments;
  }

  getById(id: string): AssessmentModel | undefined {
    return this.assessments.find((assessment) => assessment.id === id);
  }

  async create(
    assessmentForm: AssessmentCreateForm,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel> {
    let created;
    try {
      created = await this.api.createAssessment(
        { assessmentForm },
        initOverrides,
      );
    } catch (err) {
      throw await parseApiError(err, "Failed to create assessment");
    }
    const model = createAssessmentModel(created);
    this.assessments = [...this.assessments, model];
    this.notify();
    return model;
  }

  async update(
    id: string,
    assessmentUpdate: AssessmentUpdateForm,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel> {
    let updated;
    try {
      updated = await this.api.updateAssessment(
        { id, assessmentUpdate },
        initOverrides,
      );
    } catch (err) {
      throw await parseApiError(err, "Failed to update assessment");
    }
    const model = createAssessmentModel(updated);
    this.assessments = this.assessments.map((assessment) =>
      assessment.id === model.id ? model : assessment,
    );
    this.notify();
    return model;
  }

  async remove(
    id: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel> {
    const deletedAssessment = this.assessments.find((a) => a.id === id);
    if (!deletedAssessment) {
      throw new Error(`Assessment ${id} not found in local state`);
    }

    try {
      // Call the API - the backend's delete endpoint returns a malformed response
      // with null snapshots that breaks the SDK's JSON parser. We catch and ignore
      // this parsing error since the deletion itself succeeds (status 200).
      await this.api.deleteAssessment({ id }, initOverrides);
    } catch (error) {
      // The backend returns a malformed response that causes parsing errors.
      // We need to detect if the HTTP call succeeded even though parsing failed.

      // Check for ResponseError with 200 status
      const hasSuccessStatus =
        (error as { response?: { status?: number } })?.response?.status === 200;
      const isResponseErrorSuccess =
        error instanceof ResponseError && hasSuccessStatus;

      // Check for TypeError from JSON parsing (e.g., "Cannot read properties of null (reading 'map')")
      const isTypeErrorFromParsing =
        error instanceof TypeError &&
        error.message.includes(
          "Cannot read properties of null (reading 'map')",
        );

      // If it's a parsing error, we assume the delete succeeded since these only
      // happen after a successful HTTP response
      if (isResponseErrorSuccess || isTypeErrorFromParsing) {
        // Deletion succeeded despite parsing error, continue execution
      } else {
        throw error;
      }
    }

    // Track this ID as deleted to prevent it from reappearing if backend is slow
    this.deletedAssessmentIds.add(id);

    // Optimistic update: remove from local state immediately for instant UI feedback
    this.assessments = this.assessments.filter(
      (assessment) => assessment.id !== id,
    );
    this.notify();

    // Refresh from server in background to ensure consistency. This doesn't block
    // the UI from closing the modal. The list() method will filter out any items
    // in deletedAssessmentIds, preventing the deleted item from reappearing.
    void this.list(undefined, initOverrides).catch((err) => {
      console.error("Background refresh after delete failed:", err);
    });

    return deletedAssessment;
  }

  async share(
    id: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel> {
    try {
      await this.api.shareAssessment({ id }, initOverrides);
    } catch (err) {
      throw await parseApiError(err, "Failed to share assessment");
    }
    // Fetch the updated assessment to get the sharedBy information
    const updated = await this.api.getAssessment({ id }, initOverrides);
    const model = createAssessmentModel(updated);
    this.assessments = this.assessments.map((assessment) =>
      assessment.id === model.id ? model : assessment,
    );
    this.notify();
    return model;
  }

  calculateAssessmentClusterRequirements(
    requestParameters: CalculateAssessmentClusterRequirementsRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ) {
    return this.api.calculateAssessmentClusterRequirements(
      requestParameters,
      initOverrides,
    );
  }

  getAssessmentClusterRequirementsStoredInput(
    requestParameters: GetAssessmentClusterRequirementsStoredInputRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ) {
    return this.api.getAssessmentClusterRequirementsStoredInput(
      requestParameters,
      initOverrides,
    );
  }

  calculateMigrationEstimation(
    requestParameters: CalculateMigrationEstimationRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ) {
    return this.api.calculateMigrationEstimation(
      requestParameters,
      initOverrides,
    );
  }

  calculateComplexityEstimation(
    requestParameters: CalculateMigrationComplexityRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ) {
    return this.api.calculateMigrationComplexity(
      requestParameters,
      initOverrides,
    );
  }

  calculateEstimationByComplexity(
    requestParameters: CalculateMigrationEstimationByComplexityRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ) {
    return this.api.calculateMigrationEstimationByComplexity(
      requestParameters,
      initOverrides,
    );
  }

  async calculateCostEstimation(
    requestParameters: CalculateCostEstimationRequest,
    initOverrides?: RequestInit,
  ): Promise<CostEstimationResponse> {
    try {
      // Access SDK configuration to use basePath and middleware
      // AssessmentApi extends BaseAPI which has a protected configuration property
      const apiWithConfig = this.api as unknown as {
        configuration: Configuration;
      };
      const config = apiWithConfig.configuration;
      const basePath = config.basePath || "";
      const middleware: Middleware[] = config.middleware || [];
      const fetchApi = config.fetchApi || fetch;

      // Build the full URL using SDK's basePath
      const url = `${basePath}/api/v1/cost-estimation`;

      // Prepare request configuration
      let init: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestParameters),
      };

      // Apply initOverrides if provided (only RequestInit, not function overrides)
      if (initOverrides && typeof initOverrides !== "function") {
        init = { ...init, ...initOverrides };
      }

      // Apply middleware (auth headers) using SDK's middleware chain
      let requestContext = {
        fetch: (url: string, init?: RequestInit) => fetchApi(url, init),
        url,
        init,
      };
      for (const mw of middleware) {
        if (mw.pre) {
          const result = await mw.pre(requestContext);
          if (result) {
            requestContext = { ...requestContext, ...result };
          }
        }
      }

      const response = await requestContext.fetch(
        requestContext.url,
        requestContext.init,
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new ResponseError(response, errorData.message);
      }

      return (await response.json()) as CostEstimationResponse;
    } catch (err) {
      throw await parseApiError(err, "Failed to calculate cost estimation");
    }
  }

  override getSnapshot(): AssessmentModel[] {
    return this.assessments;
  }

  protected override async poll(signal: AbortSignal): Promise<void> {
    await this.list(undefined, { signal });
  }
}
