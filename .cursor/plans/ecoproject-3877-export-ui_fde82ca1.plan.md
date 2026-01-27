---
name: ECOPROJECT-3877-export-ui
overview: Adjust the report export UI to only offer HTML when the aggregate cluster view is selected, and show a single PDF button when HTML is unavailable, aligning with the latest issue comments.
todos:
  - id: update-button-ui
    content: Render single PDF button when not aggregate
    status: completed
  - id: update-tests
    content: Adjust EnhancedDownloadButton tests for new UI
    status: completed
---

# Export Options Alignment Plan

## Context

- Export selection and HTML availability are controlled in `EnhancedDownloadButton`, which currently always renders a dropdown with HTML disabled when `isAggregateView` is false.

```117:183:src/migration-wizard/steps/discovery/EnhancedDownloadButton.tsx
  const exportOptions: ExportOption[] = [
    {
      key: 'pdf',
      label: 'PDF',
      description: 'Export the report as static charts',
      action: handleDownloadPDF,
    },
    {
      key: 'html-interactive',
      label: 'HTML',
      description: 'Export the report as interactive charts',
      action: handleHTMLExport,
      disabled: !isAggregateView,
    },
  ];

  return (
    <Dropdown
      isOpen={isDropdownOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => setIsDropdownOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onToggleClick}
          isExpanded={isDropdownOpen}
          variant="secondary"
          isDisabled={isLoading || isDisabled}
          aria-label="Export report options"
        >
          {/* ... */}
        </MenuToggle>
      )}
    >
      <DropdownList className="dropdown-list-reset">
        {exportOptions.map((option) => (
          <DropdownItem
            key={option.key}
            onClick={option.action}
            description={option.description}
            isDisabled={option.disabled}
          >
            {option.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
```

- The report page already passes `isAggregateView` based on the current cluster selection.

```333:361:src/pages/report/Report.tsx
        <EnhancedDownloadButton
          onError={setExportError}
          elementId="discovery-report"
          componentToRender={
            <Dashboard
              /* ... */
              isAggregateView={clusterView.isAggregateView}
              clusterFound={clusterView.clusterFound}
            />
          }
          sourceData={discoverySourcesContext.sourceSelected as Source}
          snapshot={last}
          documentTitle={`${assessment.name || `Assessment ${id}`} - vCenter report${clusterView.isAggregateView
            ? ''
            : ` - ${clusterView.selectionLabel}`
            }`}
          isAggregateView={clusterView.isAggregateView}
        />
```

## Plan

- Update `EnhancedDownloadButton` to compute available export options based on `isAggregateView`:
  - When `isAggregateView` is true: show the existing dropdown with PDF + HTML.
- When `isAggregateView` is false: render a single secondary `Button` labeled "Export to PDF" that triggers PDF export directly.
  - Preserve loading states and disabled behavior for the single-button mode (same text/spinner behavior as the dropdown toggle).
- Adjust `EnhancedDownloadButton` tests to assert:
  - For `isAggregateView=false`, the UI shows a single button (no menu items) and clicks invoke `exportPdf` directly.
  - For `isAggregateView=true`, dropdown renders both options and HTML remains enabled.
  - Loading states work for both UI variants.
- Confirm report page behavior remains unchanged except the HTML option disappearing when a specific cluster is selected.

## Files to Update

- [`src/migration-wizard/steps/discovery/EnhancedDownloadButton.tsx`](src/migration-wizard/steps/discovery/EnhancedDownloadButton.tsx)
- [`src/migration-wizard/steps/discovery/EnhancedDownloadButton.test.tsx`](src/migration-wizard/steps/discovery/EnhancedDownloadButton.test.tsx)

## Validation

- Run the existing unit tests for the updated component (e.g., `npm test` or `vitest run`) after changes.
- If needed, run `make lint` or `make lint-fix` for quick feedback on JSX/TSX edits.
