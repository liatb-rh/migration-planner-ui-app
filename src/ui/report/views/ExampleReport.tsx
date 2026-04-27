import { type Infra, type VMs } from "@openshift-migration-advisor/planner-sdk";
import {
  Button,
  Icon,
  MenuToggle,
  type MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { CheckCircleIcon } from "@patternfly/react-icons";
import { t_global_color_status_success_default as globalSuccessColor100 } from "@patternfly/react-tokens/dist/js/t_global_color_status_success_default";
import React, { useMemo, useState } from "react";

import { routes } from "../../../routing/Routes";
import { AppPage } from "../../core/components/AppPage";
import {
  buildClusterViewModel,
  type ClusterOption,
} from "./assessment-report/ClusterView";
import { Dashboard } from "./assessment-report/Dashboard";
import { ClusterSizingWizard } from "./cluster-sizer/ClusterSizingWizard";
import {
  EXAMPLE_FORM_VALUES,
  EXAMPLE_SIZING_MAP,
} from "./example-data/clusterSizingFixture";
import { getExampleInventory } from "./example-data/inventoryFixture";

const ExampleReport: React.FC = () => {
  const inventory = getExampleInventory();
  const infra = inventory.vcenter?.infra as Infra;
  const vms = inventory.vcenter?.vms as VMs;
  const clusters = inventory.clusters;

  // State for cluster selection
  const [userSelectedClusterId, setUserSelectedClusterId] = useState<
    string | null
  >(null);
  const [isClusterSelectOpen, setIsClusterSelectOpen] = useState(false);

  // Compute effective selection - default to "all"
  const selectedClusterId = useMemo(() => {
    if (userSelectedClusterId !== null) {
      return userSelectedClusterId;
    }
    return "all";
  }, [userSelectedClusterId]);

  // Build cluster view model
  const clusterView = useMemo(
    () =>
      buildClusterViewModel({
        infra,
        vms,
        clusters,
        selectedClusterId,
      }),
    [infra, vms, clusters, selectedClusterId],
  );

  const handleClusterSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ) => {
    if (typeof value === "string") {
      setUserSelectedClusterId(value);
      setIsClusterSelectOpen(false);
    }
  };

  const clusterCount = clusters ? Object.keys(clusters).length : 0;
  const clusterSelectDisabled = clusterCount <= 0;

  // Sizing wizard state
  const [isSizingWizardOpen, setIsSizingWizardOpen] = useState(false);

  // Example sizing data for the currently selected cluster (if any)
  const exampleSizing =
    selectedClusterId !== "all"
      ? (EXAMPLE_SIZING_MAP[selectedClusterId] ?? null)
      : null;

  return (
    <AppPage
      breadcrumbs={[
        {
          key: 1,
          children: "Migration advisor",
        },
        {
          key: 2,
          to: routes.assessments,
          children: "assessments",
        },
        {
          key: 3,
          children: "Example - vCenter report",
          isActive: true,
        },
      ]}
      title="Example - vCenter report"
      headerActions={
        exampleSizing ? (
          <Split hasGutter>
            <SplitItem>
              <Button
                variant="primary"
                onClick={() => setIsSizingWizardOpen(true)}
              >
                View recommendation for {exampleSizing.clusterName}
              </Button>
            </SplitItem>
          </Split>
        ) : undefined
      }
      caption={
        <Stack hasGutter>
          <StackItem>
            Discovery VM status :{" "}
            <Icon size="md" isInline>
              <CheckCircleIcon color={globalSuccessColor100.var} />
            </Icon>{" "}
            Ready
            <br />
            This is an example report showcasing the migration advisor dashboard
          </StackItem>
          <StackItem>
            {clusterCount > 0 ? (
              typeof vms?.total === "number" ? (
                <>
                  Detected <strong>{vms?.total} VMs</strong> in{" "}
                  <strong>
                    {clusterCount} {clusterCount === 1 ? "cluster" : "clusters"}
                  </strong>
                </>
              ) : (
                <>
                  Detected{" "}
                  <strong>
                    {clusterCount} {clusterCount === 1 ? "cluster" : "clusters"}
                  </strong>
                </>
              )
            ) : (
              "No clusters detected"
            )}
          </StackItem>
          <StackItem>
            <Select
              isScrollable
              isOpen={isClusterSelectOpen}
              selected={clusterView.selectionId}
              onSelect={handleClusterSelect}
              onOpenChange={(isOpen: boolean) => {
                if (!clusterSelectDisabled) setIsClusterSelectOpen(isOpen);
              }}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  isExpanded={isClusterSelectOpen}
                  onClick={() => {
                    if (!clusterSelectDisabled) {
                      setIsClusterSelectOpen((prev) => !prev);
                    }
                  }}
                  isDisabled={clusterSelectDisabled}
                  style={{ minWidth: "422px" }}
                >
                  {clusterView.selectionLabel}
                </MenuToggle>
              )}
            >
              <SelectList>
                {clusterView.clusterOptions.map((option: ClusterOption) => (
                  <SelectOption key={option.id} value={option.id}>
                    {option.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </StackItem>
        </Stack>
      }
    >
      <Dashboard
        infra={clusterView.viewInfra as Infra}
        cpuCores={clusterView.cpuCores!}
        ramGB={clusterView.ramGB!}
        vms={clusterView.viewVms as VMs}
        clusters={clusterView.viewClusters}
        isAggregateView={clusterView.isAggregateView}
        clusterFound={clusterView.clusterFound}
      />

      {exampleSizing && (
        <ClusterSizingWizard
          key={selectedClusterId}
          isOpen={isSizingWizardOpen}
          onClose={() => setIsSizingWizardOpen(false)}
          clusterName={exampleSizing.clusterName}
          clusterId={selectedClusterId}
          assessmentId="example"
          options={{
            initialSizerOutput: exampleSizing.result,
            initialFormValues: EXAMPLE_FORM_VALUES,
            initialMigrationEstimation: exampleSizing.migrationEstimation,
            initialComplexityEstimation: exampleSizing.complexityEstimation,
            initialEstimationByComplexity: exampleSizing.estimationByComplexity,
          }}
          isReadOnly
        />
      )}
    </AppPage>
  );
};

ExampleReport.displayName = "ExampleReport";

export default ExampleReport;
