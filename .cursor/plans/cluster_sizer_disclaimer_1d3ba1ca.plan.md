---
name: Cluster Sizer Disclaimer
overview: Add the estimation disclaimer to the cluster sizing results UI and copied recommendations, plus unit tests for the new copy text and UI rendering.
todos:
  - id: add-ui-alert
    content: Insert inline disclaimer alert in `SizingResult` UI.
    status: completed
  - id: update-copy-text
    content: Append disclaimer to copied recommendations text.
    status: completed
  - id: add-tests
    content: Add unit tests for disclaimer UI and copy text.
    status: completed
  - id: run-tests
    content: Run sizing result tests to validate.
    status: completed
---

# Add sizing disclaimer + tests

## Scope

- Insert an inline informational disclaimer in the cluster sizing results panel so users see it with the recommendations.
- Append the same disclaimer to the copied recommendations text.
- Add unit tests to cover disclaimer rendering and copy text content.

## Files to update

- [`src/pages/report/cluster-sizer/SizingResult.tsx`](src/pages/report/cluster-sizer/SizingResult.tsx)
- Add an inline PatternFly `Alert` (info variant) near the top of the results content with the provided message.
- Extend `generatePlainTextRecommendation` to include the disclaimer after the main content, separated by a blank line.
- Tests (discover location once confirmed by repo structure): likely `SizingResult.test.tsx` near the component or under a central `__tests__` folder.
- Verify the disclaimer text renders when `sizerOutput` is present.
- Verify clipboard/copy text includes the disclaimer (via exposed helper or by clicking copy button with mocked `navigator.clipboard`).

## Implementation notes

- Use the exact wording: “Note: Resource requirements are estimates based on current workloads. Please verify this architecture with your SME team to ensure optimal performance.”
- Keep the alert concise and non-blocking (inline info). No behavior changes beyond display text.

## Validation

- Run the relevant unit tests for the sizing result component.

## Todos

- `add-ui-alert`: Insert inline disclaimer alert in `SizingResult` panel content.
- `update-copy-text`: Append disclaimer to copied recommendations text.
- `add-tests`: Add unit tests for disclaimer rendering and copy text content.
- `run-tests`: Run the sizing result test suite.
