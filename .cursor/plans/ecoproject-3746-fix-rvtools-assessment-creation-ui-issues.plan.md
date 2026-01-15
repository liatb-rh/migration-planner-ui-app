---
name: ECOPROJECT-3746: Fix RVTools assessment creation UI issues
overview: "Fix two UI issues in the RVTools assessment creation flow: enable the cancel button at any time during upload/processing, and disable the file select/clear buttons during assessment creation."
todos: []
---

# ECOPROJECT-3746: Fix RVTools Assessment Creation UI Issues

## Overview

**Jira Ticket**: [ECOPROJECT-3746](https://issues.redhat.com/browse/ECOPROJECT-3746)

Address two UI issues in the RVTools assessment creation flow:

1. **Cancel button**: Should be enabled at any time during the upload/creation process (currently only enabled after 20% progress)
2. **Select/Clear buttons**: Should be disabled during assessment creation to prevent file changes mid-process

## Current Behavior Analysis

### Cancel Button Logic

In [`src/pages/assessment/CreateAssessmentModal.tsx`](src/pages/assessment/CreateAssessmentModal.tsx) (line 290), the cancel button is currently disabled when:

```typescript
isDisabled={isLoading && !isJobProcessing}
```

This means cancel is only enabled when:

- Not loading, OR
- Job is processing (after it reaches Pending status at 20%)

The issue states cancel should be enabled at any time during the process.

### FileUpload Component

The FileUpload component in [`src/pages/assessment/CreateAssessmentModal.tsx`](src/pages/assessment/CreateAssessmentModal.tsx) (lines 398-412) currently always allows file selection and clearing, even during job creation/processing.

## Implementation Plan

### 1. Fix Cancel Button Logic

**File**: [`src/pages/assessment/CreateAssessmentModal.tsx`](src/pages/assessment/CreateAssessmentModal.tsx)

**Change**: Update the cancel button's `isDisabled` prop to always be enabled (or only disabled when there's no activity).

**Current code** (line 286-293):

```typescript
<Button
  key="cancel"
  variant="link"
  onClick={handleClose}
  isDisabled={isLoading && !isJobProcessing}
>
  Cancel
</Button>
```

**New code**:

```typescript
<Button
  key="cancel"
  variant="link"
  onClick={handleClose}
  isDisabled={false}  // Always enabled - user can cancel at any time
>
  Cancel
</Button>
```

**Rationale**: The cancel handler (`handleClose`) already calls `onClose()` which triggers `handleCloseModal` in `Assessment.tsx` that properly handles cancellation via `cancelRVToolsJob()`. There's no reason to disable cancel during the process.

### 2. Disable FileUpload Select/Clear Buttons During Creation

**File**: [`src/pages/assessment/CreateAssessmentModal.tsx`](src/pages/assessment/CreateAssessmentModal.tsx)

**Change**: Update the handler functions to check if job is creating/processing and return early, preventing file changes during assessment creation.

**Current code** (lines 174-215):

```typescript
const handleFileChange = (
  _event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>,
  file: File,
): void => {
  setFileErrorDismissed(true);
  // ... validation and file setting logic
};

const handleFileClear = (): void => {
  setSelectedFile(null);
  setFilename('');
  setFileValidationError('');
  setFileErrorDismissed(true);
};
```

**New code**:

Add a helper variable after the `isJobProcessing` definition (around line 93):

```typescript
// Helper to check if file operations should be disabled (RVTools mode during job creation/processing)
const isFileOperationsDisabled = mode === 'rvtools' && (isLoading || isJobProcessing);
```

Update handlers (lines 174-215):

```typescript
const handleFileChange = (
  _event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>,
  file: File,
): void => {
  // Prevent file changes during RVTools job creation/processing
  if (isFileOperationsDisabled) {
    return;
  }
  
  setFileErrorDismissed(true);
  // ... existing validation and file setting logic
};

const handleFileClear = (): void => {
  // Prevent file clearing during RVTools job creation/processing
  if (isFileOperationsDisabled) {
    return;
  }
  
  setSelectedFile(null);
  setFilename('');
  setFileValidationError('');
  setFileErrorDismissed(true);
};
```

**FileUpload component** (lines 398-412) - use the helper:

```typescript
<FileUpload
  id="assessment-file"
  type="text"
  value=""
  filename={filename}
  filenamePlaceholder="Drag and drop a file or select one"
  onFileInputChange={handleFileChange}
  onClearClick={handleFileClear}
  isLoading={isFileLoading}
  allowEditingUploadedText={false}
  browseButtonText="Select"
  validated={fileValidationError ? 'error' : 'default'}
  accept={config.accept}
  hideDefaultPreview
  isDisabled={isFileOperationsDisabled}  // Visual indication when disabled
/>
```

**Rationale**:

- Moving the conditional logic into the handlers keeps the JSX cleaner and makes the behavior more explicit
- Early return in handlers prevents any file changes during RVTools job creation/processing
- Adding `isDisabled` prop (if supported by PatternFly FileUpload) provides visual indication that the component is disabled
- The check is scoped to `mode === 'rvtools'` to only affect RVTools flow

### 3. Scope Limitation

**Important**: These changes should only apply when `mode === 'rvtools'`. For other modes (inventory, agent), the existing behavior should remain unchanged.

**Implementation**: Wrap the FileUpload changes in a conditional check for `mode === 'rvtools'`, or apply the disabled state only when in RVTools mode.

## Testing Considerations

1. **Cancel button**: Verify it's enabled immediately after clicking "Create Migration Assessment" and remains enabled throughout the upload/processing
2. **Select/Clear buttons**: Verify they're disabled when:

   - Job creation starts (`isLoading === true`)
   - Job is processing (`isJobProcessing === true`)
   - They're re-enabled if job fails or is cancelled

3. **Other modes**: Verify inventory and agent modes are unaffected

## Files to Modify

- [`src/pages/assessment/CreateAssessmentModal.tsx`](src/pages/assessment/CreateAssessmentModal.tsx)
  - Line 93 (after `isJobProcessing`): Add helper variable `isFileOperationsDisabled` to encapsulate the condition
  - Line 290: Update cancel button `isDisabled` logic
  - Lines 174-215: Update `handleFileChange` and `handleFileClear` to use `isFileOperationsDisabled` and return early
  - Lines 398-412: Update FileUpload component `isDisabled` prop to use `isFileOperationsDisabled`