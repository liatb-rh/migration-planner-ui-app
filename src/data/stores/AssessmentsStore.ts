import {
  type AssessmentApiInterface,
  type CalculateAssessmentClusterRequirementsRequest,
  type CalculateMigrationEstimationRequest,
  ResponseError,
} from "@openshift-migration-advisor/planner-sdk";
import { type Assessment } from "@openshift-migration-advisor/planner-sdk";
import { type InitOverrideFunction } from "@openshift-migration-advisor/planner-sdk";

import { PollableStoreBase } from "../../lib/mvvm/PollableStore";
import {
  type AssessmentModel,
  createAssessmentModel,
} from "../../models/AssessmentModel";
import type { IAssessmentsStore } from "./interfaces/IAssessmentsStore";

type AssessmentListResponse =
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
    this.assessments = normalizeListResponse(response).map(
      createAssessmentModel,
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
    const created = await this.api.createAssessment(
      { assessmentForm },
      initOverrides,
    );
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
    const updated = await this.api.updateAssessment(
      { id, assessmentUpdate },
      initOverrides,
    );
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
      // Only suppress parsing errors if the HTTP response was successful.
      // The SDK throws ResponseError when JSON parsing fails after a successful HTTP call.
      // We must verify the deletion actually succeeded (status 200) before updating local state.
      const hasSuccessStatus =
        (error as { response?: { status?: number } })?.response?.status === 200;

      const isSuccessfulDeletion =
        error instanceof ResponseError && hasSuccessStatus;

      if (!isSuccessfulDeletion) {
        throw error;
      }
    }

    this.assessments = this.assessments.filter(
      (assessment) => assessment.id !== id,
    );
    this.notify();
    return deletedAssessment;
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

  calculateMigrationEstimation(
    requestParameters: CalculateMigrationEstimationRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ) {
    return this.api.calculateMigrationEstimation(
      requestParameters,
      initOverrides,
    );
  }

  override getSnapshot(): AssessmentModel[] {
    return this.assessments;
  }

  protected override async poll(signal: AbortSignal): Promise<void> {
    await this.list(undefined, { signal });
  }
}
