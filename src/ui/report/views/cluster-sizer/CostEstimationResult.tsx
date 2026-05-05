import { css } from "@emotion/css";
import {
  Card,
  CardBody,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Label,
  Skeleton,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import CpuIcon from "@patternfly/react-icons/dist/esm/icons/cpu-icon";
import ServerGroupIcon from "@patternfly/react-icons/dist/esm/icons/server-group-icon";
import ServerIcon from "@patternfly/react-icons/dist/esm/icons/server-icon";
import VirtualMachineIcon from "@patternfly/react-icons/dist/esm/icons/virtual-machine-icon";
import React from "react";

import type { CostEstimationResponse } from "../../../../models/AssessmentModel";

interface CostEstimationResultProps {
  costEstimation: CostEstimationResponse | null;
}

const heroCardStyle = css`
  text-align: center;
`;

const heroTitleStyle = css`
  text-transform: uppercase;
  color: var(--pf-t--global--color--brand--default);
  margin-bottom: var(--pf-t--global--spacer--md);
`;

const heroPriceSkeletonStyle = css`
  display: flex;
  justify-content: center;
  height: 84px;
`;

const heroPriceStyle = css`
  font-size: 3.5rem;
  font-weight: var(--pf-t--global--font--weight--heading--default);
  color: var(--pf-t--global--color--brand--default);
`;

const breakdownPriceSkeletonStyle = css`
  display: flex;
  justify-content: center;
`;

const breakdownCardStyle = css`
  text-align: center;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const breakdownLabelStyle = css`
  font-size: var(--pf-t--global--font--size--body--md);
  color: var(--pf-t--global--text--color--subtle);
  margin-bottom: var(--pf-t--global--spacer--sm);
`;

const breakdownValueStyle = css`
  font-size: var(--pf-t--global--font--size--2xl);
  font-weight: var(--pf-t--global--font--weight--heading--default);
  color: var(--pf-t--global--text--color--regular);
`;

const savingsCardStyle = css`
  background: var(--pf-t--global--background--color--status--success--default);
  border: 1px solid var(--pf-t--global--border--color--status--success--default);
`;

const savingsTitleStyle = css`
  font-size: var(--pf-t--global--font--size--body--default);
  color: var(--pf-t--global--color--status--success--default);
  font-weight: var(--pf-t--global--font--weight--body--bold);
  margin-bottom: var(--pf-t--global--spacer--sm);
`;

const savingsAmountStyle = css`
  font-size: var(--pf-t--global--font--size--2xl);
  font-weight: var(--pf-t--global--font--weight--heading--default);
  color: var(--pf-t--global--color--status--success--default);
`;

const sectionTitleStyle = css`
  margin-top: var(--pf-t--global--spacer--xl);
  margin-bottom: var(--pf-t--global--spacer--md);
`;

const formatCurrency = (value: number): string => {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};

interface MetricCardProps {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value }) => (
  <Card className={breakdownCardStyle}>
    <CardBody>
      <div className={breakdownLabelStyle}>
        {icon && <>{icon} </>}
        {label}
      </div>
      <div
        className={value ? breakdownValueStyle : breakdownPriceSkeletonStyle}
      >
        {value ?? (
          <Skeleton
            fontSize="2xl"
            width="30%"
            screenreaderText={`Loading ${label}`}
          />
        )}
      </div>
    </CardBody>
  </Card>
);

export const CostEstimationResult: React.FC<CostEstimationResultProps> = ({
  costEstimation,
}) => {
  if (!costEstimation) {
    return null;
  }

  const { results, savings, customerEnvironment } = costEstimation;
  const ovTotal = results.openshiftVirtualization.totalThreeYearCostEstimation;
  const breakdown = results.openshiftVirtualization.breakdown;

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2">Cost estimation</Title>
      </StackItem>

      <StackItem>
        <Card className={heroCardStyle}>
          <CardBody>
            <Title headingLevel="h3" className={heroTitleStyle}>
              Total OpenShift 3-Year cost estimation
            </Title>
            <div className={heroPriceStyle}>{formatCurrency(ovTotal)}</div>
          </CardBody>
        </Card>
      </StackItem>

      <StackItem>
        <Title headingLevel="h3" className={sectionTitleStyle}>
          Customer environment
        </Title>
        <Grid hasGutter md={6} lg={3}>
          <GridItem>
            <MetricCard
              icon={<ServerIcon />}
              label="Total ESXi hosts"
              value={customerEnvironment.totalEsxiHosts}
            />
          </GridItem>
          <GridItem>
            <MetricCard
              icon={<ServerGroupIcon />}
              label="Sockets per host"
              value={customerEnvironment.socketsPerHost}
            />
          </GridItem>
          <GridItem>
            <MetricCard
              icon={<CpuIcon />}
              label="Cores per socket"
              value={customerEnvironment.coresPerSocket}
            />
          </GridItem>
          <GridItem>
            <MetricCard
              icon={<VirtualMachineIcon />}
              label="Total virtual machines"
              value={customerEnvironment.totalVirtualMachines}
            />
          </GridItem>
        </Grid>
      </StackItem>

      <StackItem>
        <Title headingLevel="h3" className={sectionTitleStyle}>
          Breakdown
        </Title>
        <Grid hasGutter md={6} lg={4}>
          <GridItem>
            <MetricCard
              label="Software subscriptions"
              value={formatCurrency(breakdown.softwareSubscriptions)}
            />
          </GridItem>
          <GridItem>
            <MetricCard
              label="Migration consulting services"
              value={formatCurrency(breakdown.migrationConsultingServices)}
            />
          </GridItem>
          <GridItem>
            <MetricCard
              label="Swing hardware upgrades"
              value={formatCurrency(breakdown.swingHardwareUpgrades)}
            />
          </GridItem>
        </Grid>
      </StackItem>

      {(savings.vsVcf || savings.vsVvf) && (
        <StackItem>
          <Title headingLevel="h3" className={sectionTitleStyle}>
            Savings summary
          </Title>
          <Grid hasGutter md={12} lg={6}>
            {savings.vsVcf && (
              <GridItem>
                <Card className={savingsCardStyle}>
                  <CardBody>
                    <Flex
                      justifyContent={{ default: "justifyContentSpaceBetween" }}
                      alignItems={{ default: "alignItemsCenter" }}
                    >
                      <FlexItem>
                        <div className={savingsAmountStyle}>
                          {formatCurrency(savings.vsVcf.absoluteThreeYearUsd)}
                        </div>
                        <Label color="green">
                          {savings.vsVcf.percentage.toFixed(1)}% Saved
                        </Label>
                      </FlexItem>
                      <FlexItem>
                        <div className={savingsTitleStyle}>
                          Savings vs VMware VCF
                        </div>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </GridItem>
            )}
            {savings.vsVvf && (
              <GridItem>
                <Card className={savingsCardStyle}>
                  <CardBody>
                    <Flex
                      justifyContent={{ default: "justifyContentSpaceBetween" }}
                      alignItems={{ default: "alignItemsCenter" }}
                    >
                      <FlexItem>
                        <div className={savingsAmountStyle}>
                          {formatCurrency(savings.vsVvf.absoluteThreeYearUsd)}
                        </div>
                        <Label color="green">
                          {savings.vsVvf.percentage.toFixed(1)}% Saved
                        </Label>
                      </FlexItem>
                      <FlexItem>
                        <div className={savingsTitleStyle}>
                          Savings vs VMware VVF
                        </div>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </GridItem>
            )}
          </Grid>
        </StackItem>
      )}
    </Stack>
  );
};

CostEstimationResult.displayName = "CostEstimationResult";

export const CostEstimationResultSkeleton: React.FC = () => {
  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2">Cost estimation</Title>
      </StackItem>

      <StackItem>
        <Card className={heroCardStyle}>
          <CardBody>
            <Title headingLevel="h3" className={heroTitleStyle}>
              Total OpenShift 3-Year cost estimation
            </Title>
            <div className={heroPriceSkeletonStyle}>
              <Skeleton
                fontSize="4xl"
                width="30%"
                height="100%"
                screenreaderText="Loading total cost value"
              />
            </div>
          </CardBody>
        </Card>
      </StackItem>

      <StackItem>
        <Title headingLevel="h3" className={sectionTitleStyle}>
          Customer environment
        </Title>
        <Grid hasGutter md={6} lg={3}>
          <GridItem>
            <MetricCard icon={<ServerIcon />} label="Total ESXi hosts" />
          </GridItem>
          <GridItem>
            <MetricCard icon={<ServerGroupIcon />} label="Sockets per host" />
          </GridItem>
          <GridItem>
            <MetricCard icon={<CpuIcon />} label="Cores per socket" />
          </GridItem>
          <GridItem>
            <MetricCard
              icon={<VirtualMachineIcon />}
              label="Total virtual machines"
            />
          </GridItem>
        </Grid>
      </StackItem>

      <StackItem>
        <Title headingLevel="h3" className={sectionTitleStyle}>
          Breakdown
        </Title>
        <Grid hasGutter md={6} lg={4}>
          <GridItem>
            <MetricCard label="Software subscriptions" />
          </GridItem>
          <GridItem>
            <MetricCard label="Migration consulting services" />
          </GridItem>
          <GridItem>
            <MetricCard label="Swing hardware upgrades" />
          </GridItem>
        </Grid>
      </StackItem>
    </Stack>
  );
};

CostEstimationResultSkeleton.displayName = "CostEstimationResultSkeleton";

export default CostEstimationResult;
