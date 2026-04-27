import { css } from "@emotion/css";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Tab,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";
import { CopyIcon } from "@patternfly/react-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { generatePlainTextRecommendation } from "../../view-models/ClusterSizingHelpers";
import {
  type UseClusterSizingWizardOptions,
  useClusterSizingWizardViewModel,
} from "../../view-models/useClusterSizingWizardViewModel";
import { ComplexityResult } from "./ComplexityResult";
import { RecommendationTemplate } from "./RecommendationTemplate";
import { SizingInputForm } from "./SizingInputForm";
import { SizingResult } from "./SizingResult";
import { TimeEstimationForm } from "./TimeEstimationForm";
import { TimeEstimationResult } from "./TimeEstimationResult";
import type { ClusterRequirementsResponse, SizingFormValues } from "./types";

interface ClusterSizingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clusterName: string;
  clusterId: string;
  /** Assessment ID for the API endpoint */
  assessmentId: string;
  /**
   * Called whenever a sizing calculation succeeds. Used by the parent to
   * cache the result for inclusion in the PDF export.
   */
  onCalculated?: (
    result: ClusterRequirementsResponse,
    formValues: SizingFormValues,
  ) => void;
  /** Pre-populated data for the wizard (used in the example report). */
  options?: UseClusterSizingWizardOptions;
  /** When true, collapses and disables the preferences panel (used in the example report). */
  isReadOnly?: boolean;
}

type MenuItem = "architecture" | "time-estimation" | "complexity" | "plan";

const modalBodyStyle = css`
  display: flex;
  flex-direction: column;
  height: 680px;
`;

const tabsContainerStyle = css`
  margin-bottom: var(--pf-t--global--spacer--300);

  .pf-v6-c-tabs__list {
    border-bottom: 1px solid var(--pf-t--global--border--color--default);
  }

  .pf-v6-c-tabs__item {
    margin-bottom: 0;
  }

  .pf-v6-c-tabs__link {
    padding: var(--pf-t--global--spacer--200) var(--pf-t--global--spacer--300);
    color: var(--pf-t--global--text--color--subtle);
    font-weight: var(--pf-t--global--font--weight--body--default);
    border: none;
    background: transparent;
    border-bottom: 2px solid transparent;
  }

  .pf-v6-c-tabs__link:hover:not(.pf-m-disabled) {
    color: var(--pf-t--global--text--color--regular);
    background: transparent;
  }

  .pf-v6-c-tabs__link.pf-m-current {
    color: var(--pf-t--global--text--color--regular);
    font-weight: var(--pf-t--global--font--weight--body--bold);
    border-bottom-color: var(--pf-t--global--color--brand--default);
    background: transparent;
  }

  .pf-v6-c-tabs__link:is(:disabled, .pf-m-disabled, .pf-m-aria-disabled) {
    color: var(--pf-t--global--text--color--disabled);
    opacity: 0.7;
    cursor: not-allowed;
    border-radius: var(--pf-t--global--border--radius--small)
      var(--pf-t--global--border--radius--small) 0 0;
  }
`;

const contentContainerStyle = css`
  flex: 1;
  overflow: auto;
  padding: var(--pf-t--global--spacer--300);
`;

export const ClusterSizingWizard: React.FC<ClusterSizingWizardProps> = ({
  isOpen,
  onClose,
  clusterName,
  clusterId,
  assessmentId,
  onCalculated,
  options,
  isReadOnly = false,
}) => {
  const vm = useClusterSizingWizardViewModel(assessmentId, clusterId, options);
  const [selectedMenuItem, setSelectedMenuItem] =
    useState<MenuItem>("architecture");

  useEffect(() => {
    if (vm.sizerOutput && onCalculated) {
      onCalculated(vm.sizerOutput, vm.formValues);
    }
    // Only fire when sizerOutput changes (not on every formValues keystroke)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vm.sizerOutput]);

  const handleClose = useCallback(() => {
    vm.reset();
    setSelectedMenuItem("architecture");
    onClose();
  }, [onClose, vm]);

  const handleCalculate = useCallback(() => {
    void vm.calculate();
  }, [vm]);

  const handleCalculateEstimation = useCallback(() => {
    void vm.calculateEstimation();
  }, [vm]);

  const handleCalculateComplexity = useCallback(() => {
    void vm.calculateComplexity();
  }, [vm]);

  const plainTextRecommendation = useMemo(() => {
    if (!vm.sizerOutput) return "";
    return generatePlainTextRecommendation(
      clusterName,
      vm.formValues,
      vm.sizerOutput,
    );
  }, [clusterName, vm.formValues, vm.sizerOutput]);

  const handleCopyRecommendations = useCallback(() => {
    if (
      !navigator.clipboard ||
      !navigator.clipboard.writeText ||
      (typeof window !== "undefined" && !window.isSecureContext)
    ) {
      return;
    }
    void navigator.clipboard.writeText(plainTextRecommendation);
  }, [plainTextRecommendation]);

  useEffect(() => {
    vm.ensureEstimationForMenu(selectedMenuItem);
  }, [selectedMenuItem, vm]);

  const renderContent = () => {
    switch (selectedMenuItem) {
      case "architecture":
        return (
          <RecommendationTemplate
            preferencesTitle="Migration preferences"
            preferencesContent={
              <SizingInputForm
                values={vm.formValues}
                onChange={vm.setFormValues}
                showWorkerNode={vm.showWorkerNode}
                showControlPlane={vm.showControlPlane}
                showControlPlaneScheduling={vm.showControlPlaneScheduling}
                showSmt={vm.showSmt}
              />
            }
            resultsContent={
              <SizingResult
                clusterName={clusterName}
                formValues={vm.formValues}
                sizerOutput={vm.sizerOutput}
                isLoading={vm.isCalculating}
                error={vm.calculateError ?? null}
              />
            }
            onGenerate={handleCalculate}
            isLoading={vm.isCalculating}
            isGenerateDisabled={!vm.isFormValid}
            hasResults={Boolean(
              vm.sizerOutput || vm.isCalculating || vm.calculateError,
            )}
            generateButtonText="Generate recommendation"
            hasError={Boolean(vm.calculateError)}
            isPreferencesInitiallyExpanded={!isReadOnly}
            isPreferencesDisabled={isReadOnly}
            headerAction={
              vm.sizerOutput ? (
                <Button
                  variant="link"
                  icon={<CopyIcon />}
                  iconPosition="end"
                  onClick={handleCopyRecommendations}
                >
                  Copy as plain text
                </Button>
              ) : undefined
            }
          />
        );
      case "time-estimation":
        return (
          <RecommendationTemplate
            preferencesTitle="Migration preferences"
            preferencesContent={
              <TimeEstimationForm
                values={vm.estimationFormValues}
                onChange={vm.setEstimationFormValues}
              />
            }
            resultsContent={
              <TimeEstimationResult
                clusterName={clusterName}
                estimationOutput={vm.migrationEstimation}
                isLoading={vm.isCalculatingEstimation}
                error={vm.estimationError ?? null}
              />
            }
            onGenerate={handleCalculateEstimation}
            isLoading={vm.isCalculatingEstimation}
            hasResults={Boolean(
              vm.migrationEstimation ||
              vm.isCalculatingEstimation ||
              vm.estimationError,
            )}
            generateButtonText="Calculate"
            resultsTitle=""
            showAlert={false}
            hasError={Boolean(vm.estimationError)}
            isPreferencesInitiallyExpanded={!isReadOnly}
            isPreferencesDisabled={isReadOnly}
          />
        );
      case "complexity":
        return (
          <RecommendationTemplate
            preferencesTitle="Complexity analysis parameters"
            preferencesContent={<div>Analysis parameters (coming soon)</div>}
            resultsContent={
              <ComplexityResult
                clusterName={clusterName}
                complexityOutput={vm.complexityEstimation}
                isLoading={vm.isCalculatingComplexity}
                error={vm.complexityError ?? null}
                estimationByComplexity={vm.estimationByComplexity}
                isLoadingEstimationByComplexity={
                  vm.isCalculatingEstimationByComplexity
                }
                estimationByComplexityError={
                  vm.estimationByComplexityError ?? null
                }
              />
            }
            onGenerate={handleCalculateComplexity}
            isLoading={vm.isCalculatingComplexity}
            hasResults={Boolean(
              vm.complexityEstimation ||
              vm.isCalculatingComplexity ||
              vm.complexityError,
            )}
            generateButtonText="Calculate complexity"
            resultsTitle=""
            showAlert={false}
            hidePreferences={true}
          />
        );
      case "plan":
        return <div>Migration Plan content (coming soon)</div>;
      default:
        return null;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      aria-label="Target cluster recommendations modal"
      onClose={handleClose}
      onEscapePress={handleClose}
      variant="large"
    >
      <ModalHeader title={`${clusterName} - Recommendation`} />
      <ModalBody className={modalBodyStyle}>
        <div className={tabsContainerStyle}>
          <Tabs
            activeKey={selectedMenuItem}
            onSelect={(_event, tabIndex) =>
              setSelectedMenuItem(tabIndex as MenuItem)
            }
          >
            <Tab
              eventKey="architecture"
              title={
                <TabTitleText>OpenShift Cluster Architecture</TabTitleText>
              }
            />
            <Tab
              eventKey="time-estimation"
              title={<TabTitleText>Migration Time Estimation</TabTitleText>}
            />
            <Tab
              eventKey="complexity"
              title={<TabTitleText>Migration Complexity</TabTitleText>}
            />
            <Tab
              eventKey="plan"
              title={<TabTitleText>Migration Plan</TabTitleText>}
              isDisabled
            />
          </Tabs>
        </div>
        <div className={contentContainerStyle}>{renderContent()}</div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

ClusterSizingWizard.displayName = "ClusterSizingWizard";

export default ClusterSizingWizard;
