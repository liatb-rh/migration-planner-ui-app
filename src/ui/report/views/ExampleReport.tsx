import {
  Button,
  Content,
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
import React from "react";

import { routes } from "../../../routing/Routes";
import { AppPage } from "../../core/components/AppPage";
import { useExampleReportViewModel } from "../view-models/useExampleReportViewModel";
import type { ClusterOption } from "./assessment-report/ClusterView";
import { Dashboard } from "./assessment-report/Dashboard";
import { ClusterSizingWizard } from "./cluster-sizer/ClusterSizingWizard";
import { EXAMPLE_FORM_VALUES } from "./example-data/clusterSizingFixture";

const ExampleReport: React.FC = () => {
  const vm = useExampleReportViewModel();

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
          children: "RVTools example report",
          isActive: true,
        },
      ]}
      title="RVTools example report"
      headerActions={
        vm.exampleSizing ? (
          <Split hasGutter>
            <SplitItem>
              <Button
                variant="primary"
                onClick={() => vm.setIsSizingWizardOpen(true)}
              >
                View recommendation for {vm.exampleSizing.clusterName}
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
            for RVTools file upload.
          </StackItem>
          <StackItem>
            {vm.clusterCount > 0 ? (
              typeof vm.vms?.total === "number" ? (
                <>
                  Detected <strong>{vm.vms.total} VMs</strong> in{" "}
                  <strong>
                    {vm.clusterCount}{" "}
                    {vm.clusterCount === 1 ? "cluster" : "clusters"}
                  </strong>
                </>
              ) : (
                <>
                  Detected{" "}
                  <strong>
                    {vm.clusterCount}{" "}
                    {vm.clusterCount === 1 ? "cluster" : "clusters"}
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
              isOpen={vm.isClusterSelectOpen}
              selected={vm.clusterView.selectionId}
              onSelect={vm.handleClusterSelect}
              onOpenChange={(isOpen: boolean) => {
                if (!vm.clusterSelectDisabled)
                  vm.setIsClusterSelectOpen(isOpen);
              }}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  isExpanded={vm.isClusterSelectOpen}
                  onClick={() => {
                    if (!vm.clusterSelectDisabled) {
                      vm.setIsClusterSelectOpen(!vm.isClusterSelectOpen);
                    }
                  }}
                  isDisabled={vm.clusterSelectDisabled}
                  style={{ minWidth: "422px" }}
                >
                  {vm.clusterView.selectionLabel}
                </MenuToggle>
              )}
            >
              <SelectList>
                {vm.clusterView.clusterOptions.map((option: ClusterOption) => (
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
      {vm.clusterView.viewInfra &&
      vm.clusterView.viewVms &&
      vm.clusterView.cpuCores &&
      vm.clusterView.ramGB ? (
        <Dashboard
          infra={vm.clusterView.viewInfra}
          cpuCores={vm.clusterView.cpuCores}
          ramGB={vm.clusterView.ramGB}
          vms={vm.clusterView.viewVms}
          clusters={vm.clusterView.viewClusters}
          isAggregateView={vm.clusterView.isAggregateView}
          clusterFound={vm.clusterView.clusterFound}
        />
      ) : (
        <Content component="p">
          No data is available for the selected cluster.
        </Content>
      )}

      {vm.exampleSizing && (
        <ClusterSizingWizard
          key={vm.selectedClusterId}
          isOpen={vm.isSizingWizardOpen}
          onClose={() => vm.setIsSizingWizardOpen(false)}
          clusterName={vm.exampleSizing.clusterName}
          clusterId={vm.selectedClusterId}
          assessmentId="example"
          options={{
            initialSizerOutput: vm.exampleSizing.result,
            initialFormValues: EXAMPLE_FORM_VALUES,
            initialMigrationEstimation: vm.exampleSizing.migrationEstimation,
            initialComplexityEstimation: vm.exampleSizing.complexityEstimation,
            initialEstimationByComplexity:
              vm.exampleSizing.estimationByComplexity,
          }}
          isReadOnly
        />
      )}
    </AppPage>
  );
};

ExampleReport.displayName = "ExampleReport";

export default ExampleReport;
