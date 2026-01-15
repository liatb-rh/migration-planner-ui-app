---
name: Cluster Sizer Error Messaging
overview: Preserve backend validation errors from the cluster sizing API and surface a clean, user-facing message in the results view.
todos:
  - id: locate-error-handling
    content: Review cluster-sizer error handling and API client error shape.
    status: completed
  - id: extract-error-message
    content: Parse ResponseError response text and attach payload as error cause.
    status: completed
  - id: wire-to-wizard
    content: Update handleCalculate to propagate parsed error details.
    status: completed
  - id: verify-ui
    content: Verify SizingResult shows backend message and fallback.
    status: completed
  - id: add-tests
    content: Add unit tests for error parsing and display.
    status: completed
---

# Cluster Sizer Error Messaging Plan

## Context

The Jira issue reports that backend validation errors (e.g., insufficient worker node size) are returned with a detailed `message`, but the UI shows a vague error. The fix should preserve the backend error payload and display a user-friendly message in the cluster sizing results step.

## Plan

1. Use `ResponseError` handling in `ClusterSizingWizard` to read `response.text()` and store the raw payload as the `Error` cause for downstream parsing.
2. Update `handleCalculate` in [`src/pages/report/cluster-sizer/ClusterSizingWizard.tsx`](src/pages/report/cluster-sizer/ClusterSizingWizard.tsx) to:

- Detect `ResponseError` from the API client.
- Capture the response body string via `response.text()` and attach it to `Error` as `cause`.
- Keep a safe fallback message for non-response errors.

3. Enhance error rendering in [`src/pages/report/cluster-sizer/SizingResult.tsx`](src/pages/report/cluster-sizer/SizingResult.tsx) to parse the `cause` JSON and display the backend `message` in an inline danger `Alert`, with graceful fallback to `error.message`.
4. Add unit tests covering the `ResponseError` handling and error display behavior.
5. Document a manual test using a known backend validation error payload.

### Notes

- This change should surface messages like: "failed to calculate cluster requirements: worker node size ..." directly to the user.
- No API changes required; only client-side error parsing and UI error display.

## Acceptance Criteria

- When the backend returns a JSON error with a `message`, the UI displays that message in the "Review cluster recommendations" step.
- Non-JSON or unexpected errors still show a reasonable fallback message.
- Unit tests cover parsing of `ResponseError` payloads and fallback behavior.