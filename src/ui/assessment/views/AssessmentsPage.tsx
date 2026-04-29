import { css } from "@emotion/css";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  InputGroup,
  InputGroupItem,
  MenuToggle,
  type MenuToggleElement,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { ColumnsIcon, FilterIcon, TimesIcon } from "@patternfly/react-icons";
import React, { useCallback, useState } from "react";

import type { AssessmentModel } from "../../../models/AssessmentModel";
import { ConfirmationModal } from "../../core/components/ConfirmationModal";
import CreateAssessmentDropdown from "../../core/components/CreateAssessmentDropdown";
import FilterPill from "../../core/components/FilterPill";
import { useAssessmentPageViewModel } from "../view-models/useAssessmentPageViewModel";
import AssessmentEmptyState from "./AssessmentEmptyState";
import {
  AssessmentsTable,
  type ColumnKey,
  Columns,
  MANDATORY_COLUMNS,
  type SortableColumn,
} from "./AssessmentsTable";
import CreateAssessmentModal, {
  type AssessmentMode,
} from "./CreateAssessmentModal";
import UpdateAssessment from "./UpdateAssessment";

type AssessmentsPageProps = {
  assessments: AssessmentModel[];
  // When this token changes, the component should open the RVTools modal.
  rvtoolsOpenToken?: string;
};

const checkboxStyle = css`
  margin-right: 8px;
`;

const searchInputStyle = css`
  min-width: 300px;
  width: 300px;
`;

const filterContainerStyle = css`
  margin-top: 8px;
`;

const filterInnerStyle = css`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  background: var(--pf-t--global--background--color--secondary--default);
  padding: 6px 8px;
  border-radius: 6px;
`;

const filterLabelStyle = css`
  background: var(--pf-t--global--background--color--secondary--hover);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
`;

const tableContainerStyle = css`
  margin-top: 10px;
  max-width: 100%;
  overflow: auto;
`;

export const AssessmentsPage: React.FC<AssessmentsPageProps> = ({
  assessments,
  rvtoolsOpenToken,
}) => {
  const {
    isCreatingJob,
    jobCreateError,
    isJobProcessing,
    jobProgressValue,
    jobProgressLabel,
    jobError,
    isNavigatingToReport,
    isSharingAssessment,
    isDeletingAssessment,
    isColumnSelectOpen,
    setIsColumnSelectOpen,
    visibleColumns,
    toggleColumn,
    sortBy,
    setSortBy,
    createRVToolsJob,
    clearJobCreateError,
    cancelRVToolsJob,
    updateAssessment,
    shareAssessment,
    deleteAssessment,
  } = useAssessmentPageViewModel();

  const [search, setSearch] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<AssessmentMode>("inventory");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isSharingModalOpen, setIsSharingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] =
    useState<AssessmentModel | null>(null);

  // Multi-select filters (checkbox)
  const [selectedSourceTypes, setSelectedSourceTypes] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);

  const toggleSourceType = (value: "rvtools" | "discovery"): void => {
    setSelectedSourceTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const clearSourceTypes = (): void => setSelectedSourceTypes([]);

  const toggleOwner = (owner: string): void => {
    setSelectedOwners((prev) =>
      prev.includes(owner) ? prev.filter((o) => o !== owner) : [...prev, owner],
    );
  };

  const clearOwners = (): void => setSelectedOwners([]);

  const formatName = (name?: string): string | undefined =>
    name
      ?.split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const owners = Array.from(
    new Set(
      (Array.isArray(assessments) ? assessments : [])
        .map((a) => {
          const ownerFirstName = formatName(a.ownerFirstName);
          const ownerLastName = formatName(a.ownerLastName);
          const ownerFullName =
            ownerFirstName && ownerLastName
              ? `${ownerFirstName} ${ownerLastName}`
              : ownerFirstName || ownerLastName || "";
          return ownerFullName;
        })
        .filter((name) => !!name && name.trim() !== ""),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const onSort = (
    _event: unknown,
    columnKey: SortableColumn,
    direction: "asc" | "desc",
  ): void => {
    setSortBy({ columnKey, direction });
  };

  const handleOpenModal = (mode: AssessmentMode): void => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  // Handle modal close - cancel handles everything (running job or completed assessment)
  const handleCloseModal = useCallback((): void => {
    void cancelRVToolsJob();
    setIsModalOpen(false);
  }, [cancelRVToolsJob]);

  // Open RVTools modal when the trigger token changes
  React.useEffect(() => {
    if (rvtoolsOpenToken) {
      handleOpenModal("rvtools");
    }
    // We intentionally only react to token changes
  }, [rvtoolsOpenToken]);

  // Close filter dropdown whenever any modal in this page opens
  React.useEffect(() => {
    if (isModalOpen || isUpdateModalOpen || isDeleteModalOpen) {
      setIsFilterDropdownOpen(false);
    }
  }, [isModalOpen, isUpdateModalOpen, isDeleteModalOpen]);

  const handleUpdateAssessment = (assessmentId: string): void => {
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (assessment) {
      setSelectedAssessment(assessment);
      setIsUpdateModalOpen(true);
    }
  };
  const handleShareAssessment = (assessmentId: string): void => {
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (assessment) {
      setSelectedAssessment(assessment);
      setIsSharingModalOpen(true);
    }
  };

  const isTableEmpty = (): boolean => {
    return !Array.isArray(assessments) || assessments.length === 0;
  };

  const handleDeleteAssessment = (assessmentId: string): void => {
    const assessment = assessments.find((a) => a.id === assessmentId);
    if (assessment) {
      setSelectedAssessment(assessment);
      setIsDeleteModalOpen(true);
    }
  };

  const handleCloseUpdateModal = (): void => {
    setIsUpdateModalOpen(false);
    setSelectedAssessment(null);
  };

  const handleCloseSharingModal = (): void => {
    setIsSharingModalOpen(false);
    setSelectedAssessment(null);
  };

  const handleCloseDeleteModal = (): void => {
    setIsDeleteModalOpen(false);
    setSelectedAssessment(null);
  };

  const handleConfirmUpdate = async (name: string): Promise<void> => {
    if (!selectedAssessment) return;
    await updateAssessment(selectedAssessment.id, name);
    handleCloseUpdateModal();
  };

  const handleConfirmShare = async (): Promise<void> => {
    if (!selectedAssessment) return;
    await shareAssessment(selectedAssessment.id);
    handleCloseSharingModal();
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!selectedAssessment) return;
    await deleteAssessment(selectedAssessment.id);
    handleCloseDeleteModal();
  };

  // Submit handler for RVTools mode - starts job, modal stays open.
  // The actual async work is fire-and-forget via the VM's useAsyncFn.
  const handleSubmitAssessment = (name: string, file: File | null): void => {
    if (!file) return;
    void createRVToolsJob(name, file);
  };

  return (
    <>
      {!isTableEmpty() && (
        <Toolbar>
          <ToolbarContent>
            <ToolbarGroup
              align={{ default: "alignStart" }}
              rowWrap={{ default: "wrap", md: "nowrap" }}
            >
              <ToolbarItem>
                <InputGroup>
                  <InputGroupItem>
                    <Dropdown
                      isOpen={isFilterDropdownOpen}
                      onOpenChange={(open) => setIsFilterDropdownOpen(open)}
                      onSelect={() => setIsFilterDropdownOpen(false)}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <MenuToggle
                          ref={toggleRef}
                          onClick={() =>
                            setIsFilterDropdownOpen(!isFilterDropdownOpen)
                          }
                          isExpanded={isFilterDropdownOpen}
                          icon={<FilterIcon />}
                        >
                          Filters
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        <DropdownItem isDisabled key="heading-source-type">
                          Source type
                        </DropdownItem>
                        <DropdownItem
                          key="st-all"
                          onClick={(
                            event: React.MouseEvent | React.KeyboardEvent,
                          ) => {
                            event.preventDefault();
                            event.stopPropagation();
                            clearSourceTypes();
                          }}
                        >
                          All source types
                        </DropdownItem>
                        <DropdownItem
                          key="st-discovery"
                          onClick={(
                            event: React.MouseEvent | React.KeyboardEvent,
                          ) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleSourceType("discovery");
                          }}
                        >
                          <input
                            type="checkbox"
                            readOnly
                            checked={selectedSourceTypes.includes("discovery")}
                            className={checkboxStyle}
                          />
                          Discovery OVA
                        </DropdownItem>
                        <DropdownItem
                          key="st-rvtools"
                          onClick={(
                            event: React.MouseEvent | React.KeyboardEvent,
                          ) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleSourceType("rvtools");
                          }}
                        >
                          <input
                            type="checkbox"
                            readOnly
                            checked={selectedSourceTypes.includes("rvtools")}
                            className={checkboxStyle}
                          />
                          RVTools (XLS/X)
                        </DropdownItem>

                        <DropdownItem isDisabled key="heading-owner">
                          Owner
                        </DropdownItem>
                        <DropdownItem
                          key="owner-all"
                          onClick={(
                            event: React.MouseEvent | React.KeyboardEvent,
                          ) => {
                            event.preventDefault();
                            event.stopPropagation();
                            clearOwners();
                          }}
                        >
                          All owners
                        </DropdownItem>
                        {owners.map((owner) => (
                          <DropdownItem
                            key={`owner-${owner}`}
                            onClick={(
                              event: React.MouseEvent | React.KeyboardEvent,
                            ) => {
                              event.preventDefault();
                              event.stopPropagation();
                              toggleOwner(owner);
                            }}
                          >
                            <input
                              type="checkbox"
                              readOnly
                              checked={selectedOwners.includes(owner)}
                              className={checkboxStyle}
                            />
                            {owner}
                          </DropdownItem>
                        ))}
                      </DropdownList>
                    </Dropdown>
                  </InputGroupItem>
                  <InputGroupItem isFill>
                    <SearchInput
                      id="assessment-search"
                      aria-label="Search by name"
                      placeholder="Search by name"
                      value={search}
                      onChange={(_event, value) => setSearch(value)}
                      onClear={() => setSearch("")}
                      className={searchInputStyle}
                    />
                  </InputGroupItem>
                </InputGroup>
              </ToolbarItem>

              <ToolbarItem>
                <Select
                  isOpen={isColumnSelectOpen}
                  onOpenChange={(isOpen) => setIsColumnSelectOpen(isOpen)}
                  onSelect={(_event, value) => {
                    if (typeof value === "string") {
                      toggleColumn(value as ColumnKey);
                    }
                  }}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsColumnSelectOpen(!isColumnSelectOpen)}
                      isExpanded={isColumnSelectOpen}
                      variant="plain"
                      icon={<ColumnsIcon />}
                    >
                      Manage Columns
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {(Object.keys(Columns) as ColumnKey[]).map((columnKey) => {
                      const isMandatory = MANDATORY_COLUMNS.includes(columnKey);
                      const isSelected = visibleColumns.includes(columnKey);

                      return (
                        <SelectOption
                          key={columnKey}
                          value={columnKey}
                          hasCheckbox
                          isSelected={isSelected}
                          isDisabled={isMandatory}
                        >
                          {Columns[columnKey] || columnKey}
                        </SelectOption>
                      );
                    })}
                  </SelectList>
                </Select>
              </ToolbarItem>
            </ToolbarGroup>
            <ToolbarGroup align={{ default: "alignStart", lg: "alignEnd" }}>
              <ToolbarItem>
                <CreateAssessmentDropdown
                  popperProps={{ position: "end" }}
                  onSelectRvtools={() => handleOpenModal("rvtools")}
                />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      )}
      {(selectedSourceTypes.length > 0 || selectedOwners.length > 0) && (
        <div className={filterContainerStyle}>
          <div className={filterInnerStyle}>
            <span className={filterLabelStyle}>Filters</span>

            {selectedSourceTypes
              .filter((t) => t === "discovery" || t === "rvtools")
              .map((t) => (
                <FilterPill
                  key={t}
                  label={`source type=${
                    t === "discovery" ? "discovery ova" : "rvtools"
                  }`}
                  ariaLabel={`Remove source type ${
                    t === "discovery" ? "discovery ova" : "rvtools"
                  }`}
                  onClear={() => toggleSourceType(t)}
                />
              ))}

            {selectedOwners
              .filter((o) => typeof o === "string" && o.trim() !== "")
              .map((owner) => (
                <FilterPill
                  key={owner}
                  label={`owner=${owner}`}
                  ariaLabel={`Remove owner ${owner}`}
                  onClear={() => toggleOwner(owner)}
                />
              ))}

            <Button
              icon={<TimesIcon />}
              variant="plain"
              aria-label="Clear all filters"
              onClick={() => {
                clearSourceTypes();
                clearOwners();
              }}
            />
          </div>
        </div>
      )}

      {isTableEmpty() ? (
        <AssessmentEmptyState onOpenModal={handleOpenModal} />
      ) : (
        <div className={tableContainerStyle}>
          <AssessmentsTable
            assessments={assessments}
            search={search}
            sortBy={sortBy}
            onSort={onSort}
            onDelete={handleDeleteAssessment}
            onUpdate={handleUpdateAssessment}
            onShareAssessment={handleShareAssessment}
            selectedSourceTypes={selectedSourceTypes}
            selectedOwners={selectedOwners}
            visibleColumns={visibleColumns}
          />
        </div>
      )}

      <CreateAssessmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAssessment}
        onClearError={clearJobCreateError}
        mode={modalMode}
        isLoading={isCreatingJob}
        error={jobCreateError}
        selectedEnvironment={null}
        isJobProcessing={isJobProcessing}
        jobProgressValue={jobProgressValue}
        jobProgressLabel={jobProgressLabel}
        jobError={jobError}
        isNavigatingToReport={isNavigatingToReport}
      />

      <UpdateAssessment
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        onSubmit={(name) => {
          void handleConfirmUpdate(name);
        }}
        name={(selectedAssessment as AssessmentModel)?.name || ""}
      />

      <ConfirmationModal
        isOpen={isSharingModalOpen}
        onClose={handleCloseSharingModal}
        onCancel={handleCloseSharingModal}
        onConfirm={() => {
          void handleConfirmShare();
        }}
        isDisabled={isSharingAssessment}
        title="Share assessment with partner"
        primaryButtonVariant="primary"
        confirmButtonText="Share"
      >
        Your partner will receive access to the{" "}
        <b>{(selectedAssessment as AssessmentModel)?.name}</b> assessment.
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onCancel={handleCloseDeleteModal}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        isDisabled={isDeletingAssessment}
        title="Delete Assessment"
        titleIconVariant="warning"
        primaryButtonVariant="danger"
      >
        Are you sure you want to delete{" "}
        <b>{(selectedAssessment as AssessmentModel)?.name}?</b>
      </ConfirmationModal>
    </>
  );
};

AssessmentsPage.displayName = "AssessmentsPage";
