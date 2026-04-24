import type { InitOverrideFunction } from "@openshift-migration-advisor/planner-sdk";
import type { JobApi } from "@openshift-migration-advisor/planner-sdk";
import type { Job } from "@openshift-migration-advisor/planner-sdk";
import {
  JobStatus,
  ResponseError,
} from "@openshift-migration-advisor/planner-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { JobsStore, TERMINAL_JOB_STATUSES } from "../JobsStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: 1,
  status: JobStatus.Pending,
  assessmentId: undefined,
  ...overrides,
});

const createMockApi = (): JobApi =>
  ({
    createRVToolsAssessment: vi.fn(),
    getJob: vi.fn(),
    cancelJob: vi.fn(),
  }) as unknown as JobApi;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("JobsStore", () => {
  let api: JobApi;
  let store: JobsStore;

  beforeEach(() => {
    vi.useFakeTimers();
    api = createMockApi();
    store = new JobsStore(api);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -- Initial state --------------------------------------------------------

  it("has a clean initial state", () => {
    const snap = store.getSnapshot();
    expect(snap.currentJob).toBeNull();
    expect(snap.isCreating).toBe(false);
    expect(snap.createError).toBeUndefined();
  });

  // -- createRVToolsJob -----------------------------------------------------

  it("sets isCreating while the API call is in flight", async () => {
    let resolveFn!: (job: Job) => void;
    vi.mocked(api.createRVToolsAssessment).mockReturnValue(
      new Promise<Job>((resolve) => {
        resolveFn = resolve;
      }),
    );

    const promise = store.createRVToolsJob("test", new File([], "f.xlsx"));
    expect(store.getSnapshot().isCreating).toBe(true);

    resolveFn(makeJob());
    await promise;
    expect(store.getSnapshot().isCreating).toBe(false);
  });

  it("stores the created job in state (does NOT auto-start polling)", async () => {
    const job = makeJob({ status: JobStatus.Parsing });
    vi.mocked(api.createRVToolsAssessment).mockResolvedValue(job);

    await store.createRVToolsJob("test", new File([], "f.xlsx"));
    expect(store.getSnapshot().currentJob).toEqual(job);

    // Polling is NOT auto-started — the view model is responsible
    vi.mocked(api.getJob).mockResolvedValue(job);
    await vi.advanceTimersByTimeAsync(1100);
    expect(api.getJob).not.toHaveBeenCalled();
  });

  it("sets createError on failure", async () => {
    const error = new Error("boom");
    vi.mocked(api.createRVToolsAssessment).mockRejectedValue(error);

    const result = await store.createRVToolsJob("test", new File([], "f.xlsx"));

    expect(result).toBeUndefined();
    expect(store.getSnapshot().createError).toEqual(new Error("boom"));
    expect(store.getSnapshot().isCreating).toBe(false);
  });

  it("extracts error message from ResponseError with JSON response", async () => {
    const mockResponse = {
      text: vi
        .fn()
        .mockResolvedValue(
          JSON.stringify({ message: "The provided name: aaa aaa is invalid." }),
        ),
      status: 400,
      ok: false,
      statusText: "Bad Request",
    } as unknown as Response;

    const responseError = new ResponseError(mockResponse, "Bad Request");

    vi.mocked(api.createRVToolsAssessment).mockRejectedValue(responseError);

    const result = await store.createRVToolsJob("test", new File([], "f.xlsx"));

    expect(result).toBeUndefined();
    expect(store.getSnapshot().createError?.message).toBe(
      "The provided name: aaa aaa is invalid.",
    );
    expect(store.getSnapshot().isCreating).toBe(false);
  });

  it("extracts error message from ResponseError with plain text response", async () => {
    const mockResponse = {
      text: vi.fn().mockResolvedValue("Invalid RVTools file format"),
      status: 400,
      ok: false,
      statusText: "Bad Request",
    } as unknown as Response;

    const responseError = new ResponseError(mockResponse, "Bad Request");

    vi.mocked(api.createRVToolsAssessment).mockRejectedValue(responseError);

    const result = await store.createRVToolsJob("test", new File([], "f.xlsx"));

    expect(result).toBeUndefined();
    expect(store.getSnapshot().createError?.message).toBe(
      "Invalid RVTools file format",
    );
    expect(store.getSnapshot().isCreating).toBe(false);
  });

  it("stale call does not overwrite state when a newer call has started", async () => {
    let rejectFirst!: (err: Error) => void;
    vi.mocked(api.createRVToolsAssessment)
      .mockImplementationOnce(
        () =>
          new Promise<Job>((_resolve, reject) => {
            rejectFirst = reject;
          }),
      )
      .mockRejectedValueOnce(new Error("second error"));

    const firstPromise = store.createRVToolsJob(
      "first",
      new File([], "f.xlsx"),
    );

    const secondPromise = store.createRVToolsJob(
      "second",
      new File([], "f.xlsx"),
    );

    // First call was aborted when second started; resolve it now.
    // The catch guard should prevent it from overwriting state.
    rejectFirst(new Error("first error"));

    await firstPromise;
    await secondPromise;

    expect(store.getSnapshot().createError?.message).toBe("second error");
  });

  // -- Polling --------------------------------------------------------------

  it("polls the job and updates state on each tick", async () => {
    const initialJob = makeJob({ status: JobStatus.Parsing });
    vi.mocked(api.createRVToolsAssessment).mockResolvedValue(initialJob);
    await store.createRVToolsJob("t", new File([], "f.xlsx"));

    // Caller (view model) starts polling
    store.startPolling(1000);

    const updatedJob = makeJob({ status: JobStatus.Parsing, id: 1 });
    vi.mocked(api.getJob).mockResolvedValue(updatedJob);

    await vi.advanceTimersByTimeAsync(1000);

    // The poll now forwards an AbortSignal to getJob so stopPolling() can abort it.
    const [firstArg, secondArg] = vi.mocked(api.getJob).mock.calls[0] as [
      { id: number },
      RequestInit | undefined,
    ];
    expect(firstArg).toEqual({ id: 1 });
    expect(secondArg?.signal).toBeInstanceOf(AbortSignal);

    expect(store.getSnapshot().currentJob).toEqual(updatedJob);

    store.stopPolling();
  });

  it("poll() is a no-op when job reaches terminal state", async () => {
    const initialJob = makeJob({ status: JobStatus.Parsing });
    vi.mocked(api.createRVToolsAssessment).mockResolvedValue(initialJob);
    await store.createRVToolsJob("t", new File([], "f.xlsx"));

    // Caller (view model) starts polling
    store.startPolling(1000);

    const completedJob = makeJob({
      status: JobStatus.Completed,
      assessmentId: "a-1",
    });
    vi.mocked(api.getJob).mockResolvedValue(completedJob);

    // First tick: poll returns completed job
    await vi.advanceTimersByTimeAsync(1000);
    expect(store.getSnapshot().currentJob?.status).toBe(JobStatus.Completed);

    // Second tick: poll is a no-op (terminal state), but interval still runs
    // until the caller stops it
    vi.mocked(api.getJob).mockClear();
    await vi.advanceTimersByTimeAsync(1000);
    expect(api.getJob).not.toHaveBeenCalled();

    store.stopPolling();
  });

  // -- cancelRVToolsJob -----------------------------------------------------

  it("cancels a running job on the server and returns it", async () => {
    const runningJob = makeJob({ status: JobStatus.Parsing });
    vi.mocked(api.createRVToolsAssessment).mockResolvedValue(runningJob);
    await store.createRVToolsJob("t", new File([], "f.xlsx"));

    vi.mocked(api.getJob).mockResolvedValue(runningJob);
    vi.mocked(api.cancelJob).mockResolvedValue(undefined as unknown as Job);

    const result = await store.cancelRVToolsJob();

    expect(api.cancelJob).toHaveBeenCalledWith({ id: 1 });
    expect(result).toEqual(runningJob);
    expect(store.getSnapshot().currentJob).toBeNull();
  });

  it("does NOT cancel an already-completed job on the server", async () => {
    const runningJob = makeJob({ status: JobStatus.Parsing });
    vi.mocked(api.createRVToolsAssessment).mockResolvedValue(runningJob);
    await store.createRVToolsJob("t", new File([], "f.xlsx"));

    const completedJob = makeJob({
      status: JobStatus.Completed,
      assessmentId: "a-1",
    });
    vi.mocked(api.getJob).mockResolvedValue(completedJob);

    const result = await store.cancelRVToolsJob();

    expect(api.cancelJob).not.toHaveBeenCalled();
    expect(result).toEqual(completedJob);
    expect(store.getSnapshot().currentJob).toBeNull();
  });

  it("returns null when there is no current job", async () => {
    const result = await store.cancelRVToolsJob();
    expect(result).toBeNull();
  });

  it("resets store state immediately (before the server getJob/cancelJob round-trips)", async () => {
    const runningJob = makeJob({ status: JobStatus.Parsing });
    vi.mocked(api.createRVToolsAssessment).mockResolvedValue(runningJob);
    await store.createRVToolsJob("t", new File([], "f.xlsx"));

    // Make getJob hang so we can observe intermediate state.
    let resolveGetJob!: (job: Job) => void;
    vi.mocked(api.getJob).mockReturnValue(
      new Promise<Job>((resolve) => {
        resolveGetJob = resolve;
      }),
    );

    const cancelPromise = store.cancelRVToolsJob();

    // State should already be clean even though getJob hasn't resolved yet.
    expect(store.getSnapshot().currentJob).toBeNull();
    expect(store.getSnapshot().isCreating).toBe(false);

    // Let getJob resolve so the cancel promise can finish.
    vi.mocked(api.cancelJob).mockResolvedValue(undefined as unknown as Job);
    resolveGetJob(runningJob);
    await cancelPromise;
  });

  it("stale in-flight poll response does not repopulate currentJob after cancel", async () => {
    const runningJob = makeJob({ status: JobStatus.Parsing });
    vi.mocked(api.createRVToolsAssessment).mockResolvedValue(runningJob);
    await store.createRVToolsJob("t", new File([], "f.xlsx"));

    // Set up a poll getJob that we will resolve AFTER cancel completes.
    let resolvePollGetJob!: (job: Job) => void;
    vi.mocked(api.getJob)
      // First call: the poll tick (hangs until we release it)
      .mockImplementationOnce(
        (_params, initOverrides?: RequestInit | InitOverrideFunction) =>
          new Promise<Job>((resolve, reject) => {
            resolvePollGetJob = resolve;
            // Narrow to RequestInit (not the async function overload) to read signal.
            const init =
              typeof initOverrides !== "function" ? initOverrides : undefined;
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      )
      // Second call: the cancel's own getJob for status check
      .mockResolvedValueOnce(runningJob);

    store.startPolling(1000);

    // Advance timer to kick off the poll tick (starts getJob but doesn't resolve it).
    await vi.advanceTimersByTimeAsync(1000);

    // Now cancel — this calls stopPolling() (aborting the poll signal) and reset().
    vi.mocked(api.cancelJob).mockResolvedValue(undefined as unknown as Job);
    const cancelPromise = store.cancelRVToolsJob();

    // Simulate the stale poll getJob resolving AFTER cancel has reset state.
    resolvePollGetJob(runningJob);

    await cancelPromise;

    // The stale response must NOT put the job back.
    expect(store.getSnapshot().currentJob).toBeNull();
  });

  // -- clearCreateError ------------------------------------------------------

  it("clears createError", async () => {
    vi.mocked(api.createRVToolsAssessment).mockRejectedValue(
      new Error("name error"),
    );
    await store.createRVToolsJob("bad", new File([], "f.xlsx"));
    expect(store.getSnapshot().createError).toBeDefined();

    store.clearCreateError();

    expect(store.getSnapshot().createError).toBeUndefined();
    expect(store.getSnapshot().isCreating).toBe(false);
  });

  it("also clears currentJob when it is in a terminal state", async () => {
    const failedJob = makeJob({ status: JobStatus.Failed, error: "boom" });
    vi.mocked(api.createRVToolsAssessment).mockResolvedValue(
      makeJob({ status: JobStatus.Pending }),
    );
    await store.createRVToolsJob("t", new File([], "f.xlsx"));

    // Simulate polling setting the job to Failed
    vi.mocked(api.getJob).mockResolvedValue(failedJob);
    store.startPolling(1000);
    await vi.advanceTimersByTimeAsync(1000);
    store.stopPolling();
    expect(store.getSnapshot().currentJob?.status).toBe(JobStatus.Failed);

    store.clearCreateError();

    expect(store.getSnapshot().currentJob).toBeNull();
  });

  it("does NOT clear a non-terminal currentJob", async () => {
    const runningJob = makeJob({ status: JobStatus.Parsing });
    vi.mocked(api.createRVToolsAssessment).mockResolvedValue(runningJob);
    await store.createRVToolsJob("t", new File([], "f.xlsx"));

    store.clearCreateError();

    expect(store.getSnapshot().currentJob).toEqual(runningJob);
  });

  it("clearCreateError is a no-op when there is nothing to clear", () => {
    const listener = vi.fn();
    store.subscribe(listener);

    store.clearCreateError();

    expect(listener).not.toHaveBeenCalled();
  });

  // -- reset ----------------------------------------------------------------

  it("clears state on reset (does NOT stop polling)", async () => {
    const job = makeJob({ status: JobStatus.Parsing });
    vi.mocked(api.createRVToolsAssessment).mockResolvedValue(job);
    await store.createRVToolsJob("t", new File([], "f.xlsx"));

    store.reset();

    expect(store.getSnapshot().currentJob).toBeNull();
    expect(store.getSnapshot().isCreating).toBe(false);
    expect(store.getSnapshot().createError).toBeUndefined();
  });

  // -- subscribe / notify ---------------------------------------------------

  it("notifies subscribers on state changes", async () => {
    const listener = vi.fn();
    store.subscribe(listener);

    const job = makeJob();
    vi.mocked(api.createRVToolsAssessment).mockResolvedValue(job);
    await store.createRVToolsJob("t", new File([], "f.xlsx"));

    // At least isCreating=true and then isCreating=false + currentJob set
    expect(listener).toHaveBeenCalled();
  });

  // -- TERMINAL_JOB_STATUSES ------------------------------------------------

  it("exports the correct terminal statuses", () => {
    expect(TERMINAL_JOB_STATUSES).toContain(JobStatus.Completed);
    expect(TERMINAL_JOB_STATUSES).toContain(JobStatus.Failed);
    expect(TERMINAL_JOB_STATUSES).toContain(JobStatus.Cancelled);
    expect(TERMINAL_JOB_STATUSES).toHaveLength(3);
  });
});
