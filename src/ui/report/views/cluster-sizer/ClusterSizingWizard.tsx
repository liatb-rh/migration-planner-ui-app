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
import React, { useCallback, useEffect, useState } from "react";

import { useClusterSizingWizardViewModel } from "../../view-models/useClusterSizingWizardViewModel";
import { RecommendationTemplate } from "./RecommendationTemplate";
import { SizingInputForm } from "./SizingInputForm";
import { SizingResult } from "./SizingResult";
import { TimeEstimationForm } from "./TimeEstimationForm";
import { TimeEstimationResult } from "./TimeEstimationResult";

interface ClusterSizingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clusterName: string;
  clusterId: string;
  /** Assessment ID for the API endpoint */
  assessmentId: string;
}

type MenuItem =
  | "architecture"
  | "time-estimation"
  | "complexity"
  | "plan"
  | null;

const welcomeMessageStyle = css`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  font-size: var(--pf-t--global--font--size--2xl);
  color: var(--pf-t--global--text--color--regular);
  padding: var(--pf-t--global--spacer--600);
  font-weight: var(--pf-t--global--font--weight--body--default);
  line-height: var(--pf-t--global--font--line-height--body);
`;

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
}) => {
  const vm = useClusterSizingWizardViewModel(assessmentId, clusterId);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem>(null);

  const handleClose = useCallback(() => {
    vm.reset();
    setSelectedMenuItem(null);
    onClose();
  }, [onClose, vm]);

  const handleCalculate = useCallback(() => {
    void vm.calculate();
  }, [vm]);

  const handleCalculateEstimation = useCallback(() => {
    void vm.calculateEstimation();
  }, [vm]);

  useEffect(() => {
    vm.ensureEstimationForMenu(selectedMenuItem);
  }, [selectedMenuItem, vm]);

  const renderContent = () => {
    switch (selectedMenuItem) {
      case null:
        return (
          <div className={welcomeMessageStyle}>
            The following recommendations are designed to facilitate the
            migration of vCenter {clusterName}
          </div>
        );
      case "architecture":
        return (
          <RecommendationTemplate
            preferencesTitle="Migration preferences"
            preferencesContent={
              <SizingInputForm
                values={vm.formValues}
                onChange={vm.setFormValues}
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
            hasResults={Boolean(
              vm.sizerOutput || vm.isCalculating || vm.calculateError,
            )}
            generateButtonText="Generate recommendation"
          />
        );
      case "time-estimation":
        return (
          <RecommendationTemplate
            preferencesTitle="Migration estimation parameters"
            preferencesContent={<TimeEstimationForm values={vm.formValues} />}
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
            generateButtonText="Calculate time estimation"
            resultsTitle=""
            showAlert={false}
            hidePreferences={true}
          />
        );
      case "complexity":
        return <div>Migration Complexity content (coming soon)</div>;
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
      onEscapePress={handleClose}
      variant="large"
    >
      <ModalHeader title={`${clusterName} - Recommendation`} />
      <ModalBody className={modalBodyStyle}>
        <div className={tabsContainerStyle}>
          <Tabs
            activeKey={selectedMenuItem ?? ""}
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
              isDisabled
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
