import { type Infra, type VMs } from "@openshift-migration-advisor/planner-sdk";
import {
  Button,
  Content,
  Flex,
  FlexItem,
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
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from "@patternfly/react-core";
import { CheckCircleIcon } from "@patternfly/react-icons";
import React, { useMemo, useState } from "react";

import { routes } from "../../../routing/Routes";
import { AppPage } from "../../core/components/AppPage";
import {
  buildClusterViewModel,
  type ClusterOption,
} from "./assessment-report/ClusterView";
import { Dashboard } from "./assessment-report/Dashboard";
import { ClusterSizingWizard } from "./cluster-sizer/ClusterSizingWizard";
import { ExampleStorageOffloadTab } from "./discovery-ova-example/ExampleStorageOffloadTab";
import { ExampleVMTable } from "./discovery-ova-example/ExampleVMTable";
import {
  EXAMPLE_FORM_VALUES,
  EXAMPLE_SIZING_MAP,
} from "./example-data/clusterSizingFixture";
import { getExampleInventory } from "./example-data/inventoryFixture";
import { EXAMPLE_OVA_VMS } from "./example-data/ovaVmFixture";

const DiscoveryOvaExampleReport: React.FC = () => {
  const inventory = getExampleInventory();
  const infra = inventory.vcenter?.infra as Infra;
  const vms = inventory.vcenter?.vms as VMs;
  const clusters = inventory.clusters;

  const [userSelectedClusterId, setUserSelectedClusterId] = useState<
    string | null
  >(null);
  const [isClusterSelectOpen, setIsClusterSelectOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string | number>(0);

  const selectedClusterId = useMemo(() => {
    if (userSelectedClusterId !== null) {
      return userSelectedClusterId;
    }
    return "all";
  }, [userSelectedClusterId]);

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
      setActiveTab(0);
    }
  };

  const handleTabSelect = (
    _event: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: string | number,
  ) => {
    setActiveTab(tabIndex);
  };

  const clusterCount = clusters ? Object.keys(clusters).length : 0;
  const clusterSelectDisabled = clusterCount <= 0;

  const [isSizingWizardOpen, setIsSizingWizardOpen] = useState(false);

  const exampleSizing =
    selectedClusterId !== "all"
      ? (EXAMPLE_SIZING_MAP[selectedClusterId] ?? null)
      : null;

  const filteredVMs = useMemo(() => {
    if (selectedClusterId === "all") return EXAMPLE_OVA_VMS;
    return EXAMPLE_OVA_VMS.filter((vm) => vm.cluster === selectedClusterId);
  }, [selectedClusterId]);

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
          children: "Discovery OVA example report",
          isActive: true,
        },
      ]}
      title=""
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
          {/* Header matching agent-UI Header component */}
          <StackItem>
            <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
              <FlexItem>
                <Title headingLevel="h1" size="2xl">
                  Migration Advisor Report
                </Title>
              </FlexItem>

              <FlexItem>
                <Flex
                  gap={{ default: "gapSm" }}
                  alignItems={{ default: "alignItemsCenter" }}
                >
                  <FlexItem>
                    <Content component="small">
                      <strong>Discovery VM status:</strong>
                    </Content>
                  </FlexItem>
                  <FlexItem>
                    <Flex
                      gap={{ default: "gapXs" }}
                      alignItems={{ default: "alignItemsCenter" }}
                    >
                      <Icon status="success">
                        <CheckCircleIcon />
                      </Icon>
                      <Content component="small">Connected</Content>
                    </Flex>
                  </FlexItem>
                </Flex>
              </FlexItem>

              <FlexItem>
                <Content component="p">
                  Presenting the information we were able to fetch from the
                  discovery process
                </Content>
              </FlexItem>

              <FlexItem>
                <Content component="small">
                  This is an example report showcasing the migration advisor
                  dashboard for discovery OVA deployment.
                </Content>
              </FlexItem>

              <FlexItem>
                <Content component="p">
                  Detected <strong>{vms?.total ?? 0} VMs</strong> in{" "}
                  <strong>
                    {clusterCount} {clusterCount === 1 ? "cluster" : "clusters"}
                  </strong>
                </Content>
              </FlexItem>
            </Flex>
          </StackItem>

          {/* Cluster selector */}
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
      {/* Tabbed layout matching agent-UI ReportContainer */}
      <Tabs activeKey={activeTab} onSelect={handleTabSelect}>
        <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
          <div style={{ marginTop: "24px" }}>
            <Dashboard
              infra={clusterView.viewInfra as Infra}
              cpuCores={clusterView.cpuCores!}
              ramGB={clusterView.ramGB!}
              vms={clusterView.viewVms as VMs}
              clusters={clusterView.viewClusters}
              isAggregateView={clusterView.isAggregateView}
              clusterFound={clusterView.clusterFound}
            />
          </div>
        </Tab>

        <Tab eventKey={1} title={<TabTitleText>Virtual Machines</TabTitleText>}>
          <div style={{ marginTop: "24px" }}>
            <ExampleVMTable vms={filteredVMs} />
          </div>
        </Tab>

        <Tab
          eventKey={2}
          title={<TabTitleText>Storage offload estimator</TabTitleText>}
        >
          <ExampleStorageOffloadTab />
        </Tab>
      </Tabs>

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

DiscoveryOvaExampleReport.displayName = "DiscoveryOvaExampleReport";

export default DiscoveryOvaExampleReport;
