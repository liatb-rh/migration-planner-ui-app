import { Time } from "../common/Time";
import { ExternalStoreBase } from "./ExternalStore";

/** App-wide default polling interval. Import this wherever you call `startPolling`. */
export const DEFAULT_POLLING_DELAY = 60 * Time.Second;

/**
 * Detect an AbortError regardless of how the runtime throws it.
 *
 * Browsers may throw a `DOMException` (which doesn't always extend `Error`
 * in jsdom), a plain `Error` with `name === "AbortError"`, or the native
 * `AbortError` type. This helper covers all variants.
 */
function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") {
    return true;
  }
  if (err instanceof Error && err.name === "AbortError") {
    return true;
  }
  return false;
}

/**
 * Store base class with built-in polling support.
 *
 * Subclasses implement {@link poll} which is called on each interval tick.
 * View models control the polling lifecycle via {@link startPolling} and
 * {@link stopPolling}.
 */
export abstract class PollableStoreBase<
  TSnapshot,
> extends ExternalStoreBase<TSnapshot> {
  private pollingTimer: number | null = null;
  private pollAbortController: AbortController | null = null;
  private pollInFlight = false;

  /** Start polling at the given interval (milliseconds). Restarts if already polling. */
  startPolling(intervalMs = DEFAULT_POLLING_DELAY): void {
    this.stopPolling();
    this.pollingTimer = window.setInterval(
      () => void this.executePoll(),
      intervalMs,
    );
  }

  /** Stop polling and abort any in-flight poll request. */
  stopPolling(): void {
    if (this.pollingTimer !== null) {
      window.clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.pollAbortController?.abort();
    this.pollAbortController = null;
  }

  get isPolling(): boolean {
    return this.pollingTimer !== null;
  }

  /**
   * Subclasses implement this to perform the actual data fetch.
   * The provided {@link AbortSignal} is cancelled when polling stops or when
   * the next tick fires before this one completes.
   */
  protected abstract poll(signal: AbortSignal): Promise<void>;

  private async executePoll(): Promise<void> {
    if (this.pollInFlight) {
      return;
    }

    this.pollAbortController?.abort();
    this.pollAbortController = new AbortController();
    this.pollInFlight = true;

    try {
      await this.poll(this.pollAbortController.signal);
    } catch (err: unknown) {
      if (isAbortError(err)) {
        return;
      }
      console.error(`Polling failed in ${this.constructor.name}:`, err);
    } finally {
      this.pollInFlight = false;
    }
  }
}
