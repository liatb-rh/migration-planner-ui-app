import { css } from "@emotion/css";
import {
  Card,
  CardBody,
  Flex,
  FlexItem,
  Gallery,
  Label,
  Skeleton,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import React from "react";

import type { CostEstimationResponse } from "../../../../models/AssessmentModel";

interface CostEstimationResultProps {
  costEstimation: CostEstimationResponse | null;
}

const heroCardStyle = css`
  background: var(--pf-t--global--background--color--primary--default);
  border: 1px solid var(--pf-t--global--border--color--default);
  text-align: center;
  padding: var(--pf-t--global--spacer--md);
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
  font-size: var(--pf-t--global--font--size--body--sm);
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

export const CostEstimationResult: React.FC<CostEstimationResultProps> = ({
  costEstimation,
}) => {
  if (!costEstimation) {
    return null;
  }

  const { results, savings } = costEstimation;
  const ovTotal = results.openshiftVirtualization.totalThreeYearCostEstimation;
  const breakdown = results.openshiftVirtualization.breakdown;

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2">Cost Estimation</Title>
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
          Breakdown
        </Title>
        <Gallery hasGutter minWidths={{ default: "300px" }}>
          <Card className={breakdownCardStyle}>
            <CardBody>
              <div className={breakdownLabelStyle}>Software Subscriptions</div>
              <div className={breakdownValueStyle}>
                {formatCurrency(breakdown.softwareSubscriptions)}
              </div>
            </CardBody>
          </Card>
          <Card className={breakdownCardStyle}>
            <CardBody>
              <div className={breakdownLabelStyle}>
                Ansible Automation Platform
              </div>
              <div className={breakdownValueStyle}>
                {formatCurrency(breakdown.ansibleAutomationPlatform)}
              </div>
            </CardBody>
          </Card>
          <Card className={breakdownCardStyle}>
            <CardBody>
              <div className={breakdownLabelStyle}>
                Migration Consulting Services
              </div>
              <div className={breakdownValueStyle}>
                {formatCurrency(breakdown.migrationConsultingServices)}
              </div>
            </CardBody>
          </Card>
          <Card className={breakdownCardStyle}>
            <CardBody>
              <div className={breakdownLabelStyle}>Swing Hardware Upgrades</div>
              <div className={breakdownValueStyle}>
                {formatCurrency(breakdown.swingHardwareUpgrades)}
              </div>
            </CardBody>
          </Card>
          <Card className={breakdownCardStyle}>
            <CardBody>
              <div className={breakdownLabelStyle}>
                Additional Storage Costs
              </div>
              <div className={breakdownValueStyle}>
                {formatCurrency(breakdown.additionalStorageCosts)}
              </div>
            </CardBody>
          </Card>
          <Card className={breakdownCardStyle}>
            <CardBody>
              <div className={breakdownLabelStyle}>Third Party ISV Costs</div>
              <div className={breakdownValueStyle}>
                {formatCurrency(breakdown.thirdPartyIsvCosts)}
              </div>
            </CardBody>
          </Card>
        </Gallery>
      </StackItem>

      {(savings.vsVcf || savings.vsVvf) && (
        <StackItem>
          <Title headingLevel="h3" className={sectionTitleStyle}>
            Savings summary
          </Title>
          <Gallery hasGutter minWidths={{ default: "400px" }}>
            {savings.vsVcf && (
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
            )}
            {savings.vsVvf && (
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
            )}
          </Gallery>
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
        <Title headingLevel="h2">Cost Estimation</Title>
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
          Breakdown
        </Title>
        <Gallery hasGutter minWidths={{ default: "300px" }}>
          <Card className={breakdownCardStyle}>
            <CardBody>
              <div className={breakdownLabelStyle}>Software Subscriptions</div>
              <div className={breakdownPriceSkeletonStyle}>
                <Skeleton
                  fontSize="2xl"
                  width="30%"
                  screenreaderText="Loading Software Subscriptions"
                />
              </div>
            </CardBody>
          </Card>
          <Card className={breakdownCardStyle}>
            <CardBody>
              <div className={breakdownLabelStyle}>
                Ansible Automation Platform
              </div>
              <div className={breakdownPriceSkeletonStyle}>
                <Skeleton
                  fontSize="2xl"
                  width="30%"
                  screenreaderText="Loading Ansible Automation Platform"
                />
              </div>
            </CardBody>
          </Card>
          <Card className={breakdownCardStyle}>
            <CardBody>
              <div className={breakdownLabelStyle}>
                Migration Consulting Services
              </div>
              <div className={breakdownPriceSkeletonStyle}>
                <Skeleton
                  fontSize="2xl"
                  width="30%"
                  screenreaderText="Loading Migration Consulting Services"
                />
              </div>
            </CardBody>
          </Card>
          <Card className={breakdownCardStyle}>
            <CardBody>
              <div className={breakdownLabelStyle}>Swing Hardware Upgrades</div>
              <div className={breakdownPriceSkeletonStyle}>
                <Skeleton
                  fontSize="2xl"
                  width="30%"
                  screenreaderText="Loading Swing Hardware Upgrades"
                />
              </div>
            </CardBody>
          </Card>
          <Card className={breakdownCardStyle}>
            <CardBody>
              <div className={breakdownLabelStyle}>
                Additional Storage Costs
              </div>
              <div className={breakdownPriceSkeletonStyle}>
                <Skeleton
                  fontSize="2xl"
                  width="30%"
                  screenreaderText="Loading Additional Storage Costs"
                />
              </div>
            </CardBody>
          </Card>
          <Card className={breakdownCardStyle}>
            <CardBody>
              <div className={breakdownLabelStyle}>Third Party ISV Costs</div>
              <div className={breakdownPriceSkeletonStyle}>
                <Skeleton
                  fontSize="2xl"
                  width="30%"
                  screenreaderText="Loading Third Party ISV Costs"
                />
              </div>
            </CardBody>
          </Card>
        </Gallery>
      </StackItem>
    </Stack>
  );
};

CostEstimationResultSkeleton.displayName = "CostEstimationResultSkeleton";

export default CostEstimationResult;
