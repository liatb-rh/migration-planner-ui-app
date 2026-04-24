import type {
  CalculateAssessmentClusterRequirementsRequest,
  CalculateMigrationComplexityRequest,
  CalculateMigrationEstimationByComplexityRequest,
  CalculateMigrationEstimationRequest,
  ClusterRequirementsResponse,
  ClusterRequirementsStoredInput,
  GetAssessmentClusterRequirementsStoredInputRequest,
  InitOverrideFunction,
  MigrationComplexityResponse,
  MigrationEstimationByComplexityResponse,
  MigrationEstimationResponse,
} from "@openshift-migration-advisor/planner-sdk";

import type { ExternalStore } from "../../../lib/mvvm/ExternalStore";
import type { AssessmentModel } from "../../../models/AssessmentModel";
type AssessmentCreateForm = {
  name: string;
  sourceType?: string;
  sourceId?: string;
};

type AssessmentUpdateForm = {
  name?: string;
};

export interface IAssessmentsStore extends ExternalStore<AssessmentModel[]> {
  list(
    sourceId?: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel[]>;
  getById(id: string): AssessmentModel | undefined;
  create(
    assessmentForm: AssessmentCreateForm,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel>;
  update(
    id: string,
    assessmentUpdate: AssessmentUpdateForm,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel>;
  remove(
    id: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel>;
  share(id: string): Promise<void>;
  calculateAssessmentClusterRequirements(
    requestParameters: CalculateAssessmentClusterRequirementsRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<ClusterRequirementsResponse>;
  getAssessmentClusterRequirementsStoredInput(
    requestParameters: GetAssessmentClusterRequirementsStoredInputRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<ClusterRequirementsStoredInput>;
  calculateMigrationEstimation(
    requestParameters: CalculateMigrationEstimationRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<MigrationEstimationResponse>;
  calculateComplexityEstimation(
    requestParameters: CalculateMigrationComplexityRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<MigrationComplexityResponse>;
  calculateEstimationByComplexity(
    requestParameters: CalculateMigrationEstimationByComplexityRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<MigrationEstimationByComplexityResponse>;
  startPolling(intervalMs?: number): void;
  stopPolling(): void;
}
