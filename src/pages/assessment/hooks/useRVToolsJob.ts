import { JobApi } from "@migration-planner-ui/api-client/apis";
import { Job, JobStatus } from "@migration-planner-ui/api-client/models";
import { useCallback, useRef, useState } from "react";
import { useInterval } from "react-use";

import {
  JOB_POLLING_INTERVAL,
  TERMINAL_JOB_STATUSES,
} from "../utils/rvToolsJobUtils";

interface UseRVToolsJobProps {
  jobApi: JobApi;
  /** Called only when job completes successfully WITHOUT being cancelled */
  onSuccess: (assessmentId: string) => void;
  onDeleteAssessment?: (assessmentId: string) => Promise<void>;
}

interface UseRVToolsJobReturn {
  currentJob: Job | null;
  isCreatingRVToolsJob: boolean;
  errorCreatingRVToolsJob: Error | undefined;
  createRVToolsJob: (name: string, file: File) => Promise<Job | undefined>;
  cancelRVToolsJob: () => Promise<void>;
}

export const useRVToolsJob = ({
  jobApi,
  onSuccess,
  onDeleteAssessment,
}: UseRVToolsJobProps): UseRVToolsJobReturn => {
  // RVTools Job State
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [jobPollingDelay, setJobPollingDelay] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<Error | undefined>(undefined);
  // AbortController ref to cancel in-flight API requests
  const abortControllerRef = useRef<AbortController | null>(null);
  // Ref to track cancel in progress - checked synchronously to prevent race conditions
  const cancelInProgressRef = useRef<boolean>(false);

  // Helper to clear all job state
  const clearState = useCallback(() => {
    setCurrentJob(null);
    setJobPollingDelay(null);
    setIsCreating(false);
    setCreateError(undefined);
  }, []);

  // Job polling
  useInterval(() => {
    // Skip polling if cancel is in progress (ref check avoids stale closure)
    if (cancelInProgressRef.current) {
      return;
    }
    if (currentJob && !TERMINAL_JOB_STATUSES.includes(currentJob.status)) {
      jobApi
        .getJob({ id: currentJob.id })
        .then((updated) => {
          // Skip if cancel happened while request was in flight
          if (cancelInProgressRef.current) {
            return;
          }
          setCurrentJob(updated);
          if (TERMINAL_JOB_STATUSES.includes(updated.status)) {
            setJobPollingDelay(null);
            // Only call onSuccess if completed AND cancel not requested
            if (
              updated.status === JobStatus.Completed &&
              updated.assessmentId &&
              !cancelInProgressRef.current
            ) {
              clearState();
              onSuccess(updated.assessmentId);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to poll job status:", err);
        });
    }
  }, jobPollingDelay);

  // Create RVTools job
  const createRVToolsJob = useCallback(
    async (name: string, file: File): Promise<Job | undefined> => {
      // Reset cancel flag for new job
      cancelInProgressRef.current = false;

      // Abort any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsCreating(true);
      setCreateError(undefined);

      try {
        const job = await jobApi.createRVToolsAssessment(
          { name, file },
          { signal: abortController.signal },
        );

        // Check if aborted before setting state
        if (abortController.signal.aborted) {
          if (job?.id && !TERMINAL_JOB_STATUSES.includes(job.status)) {
            jobApi.cancelJob({ id: job.id }).catch(() => {});
          }
          return undefined;
        }

        setCurrentJob(job);
        setJobPollingDelay(JOB_POLLING_INTERVAL);
        setIsCreating(false);
        return job;
      } catch (err) {
        if (abortController.signal.aborted) {
          return undefined;
        }
        setCreateError(err as Error);
        setIsCreating(false);
        throw err;
      }
    },
    [jobApi],
  );

  // Cancel job - single entry point for all cancel operations
  const cancelRVToolsJob = useCallback(async () => {
    // Skip if cancel already in progress
    if (cancelInProgressRef.current) {
      return;
    }

    // Set flag synchronously FIRST to block any racing success callbacks
    cancelInProgressRef.current = true;

    // Abort any in-flight API request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (currentJob) {
      // Fetch latest job status (local state may be stale)
      let latestJob: Job | null = null;
      try {
        latestJob = await jobApi.getJob({ id: currentJob.id });
      } catch {
        latestJob = currentJob;
      }

      if (!TERMINAL_JOB_STATUSES.includes(latestJob.status)) {
        // Job still running - cancel it on server
        try {
          await jobApi.cancelJob({ id: latestJob.id });
        } catch (err) {
          console.error("Failed to cancel job:", err);
        }
      } else if (
        latestJob.status === JobStatus.Completed &&
        latestJob.assessmentId &&
        onDeleteAssessment
      ) {
        // Job already completed - delete the assessment
        try {
          await onDeleteAssessment(latestJob.assessmentId);
        } catch (err) {
          console.error("Failed to delete assessment:", err);
        }
      }
    }

    // Clear all state
    clearState();
    // Reset flag after cleanup
    cancelInProgressRef.current = false;
  }, [currentJob, jobApi, onDeleteAssessment, clearState]);

  return {
    currentJob,
    isCreatingRVToolsJob: isCreating,
    errorCreatingRVToolsJob: createError,
    createRVToolsJob,
    cancelRVToolsJob,
  };
};
