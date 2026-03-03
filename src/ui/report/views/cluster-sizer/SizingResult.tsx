import { css } from "@emotion/css";
import {
  Alert,
  AlertActionCloseButton,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  List,
  ListItem,
  Spinner,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { CopyIcon } from "@patternfly/react-icons";
import React, { useCallback, useMemo, useState } from "react";

import { CPU_OVERCOMMIT_OPTIONS, MEMORY_OVERCOMMIT_OPTIONS } from "./constants";
import type { ClusterRequirementsResponse, SizingFormValues } from "./types";

const DISCLAIMER_TEXT =
  "Note: Resource requirements are estimates based on current workloads. Please verify this architecture with your SME team to ensure optimal performance.";

const descriptionListStyles = css`
  .pf-v6-c-description-list__term {
    min-width: 250px;
    width: auto;
  }
`;

interface SizingResultProps {
  clusterName: string;
  formValues: SizingFormValues;
  sizerOutput: ClusterRequirementsResponse | null;
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * Format a number with locale-specific thousands separators
 */
const formatNumber = (value: number): string => value.toLocaleString();

/**
 * Format a ratio value
 */
const formatRatio = (value: number): string => value.toFixed(2);

/**
 * Get the CPU over-commit ratio label
 */
const getCpuOvercommitLabel = (ratio: number): string => {
  const option = CPU_OVERCOMMIT_OPTIONS.find((opt) => opt.value === ratio);
  return option?.label || `1:${ratio}`;
};

/**
 * Get the memory over-commit ratio label
 */
const getMemoryOvercommitLabel = (ratio: number): string => {
  const option = MEMORY_OVERCOMMIT_OPTIONS.find((opt) => opt.value === ratio);
  return option?.label || `1:${ratio}`;
};

/**
 * Generate the plain text recommendation for clipboard copy
 */
const generatePlainTextRecommendation = (
  clusterName: string,
  formValues: SizingFormValues,
  output: ClusterRequirementsResponse,
): string => {
  const cpuOverCommitRatio =
    output.resourceConsumption.overCommitRatio?.cpu ?? 0;
  const memoryOverCommitRatio =
    output.resourceConsumption.overCommitRatio?.memory ?? 0;
  const cpuLimits = output.resourceConsumption.limits?.cpu ?? 0;
  const memoryLimits = output.resourceConsumption.limits?.memory ?? 0;

  return `
Cluster: ${clusterName}
Total Nodes: ${output.clusterSizing.totalNodes} (${output.clusterSizing.workerNodes} workers + ${output.clusterSizing.controlPlaneNodes} control plane)
Failover Capacity: ${output.clusterSizing.failoverNodes} failover nodes
Node Size: ${formValues.customCpu} CPU / ${formValues.customMemoryGb} GB

Additional info
Target Platform: Bare Metal
Over-Commitment: CPU ${getCpuOvercommitLabel(formValues.cpuOvercommitRatio)}, Memory ${getMemoryOvercommitLabel(formValues.memoryOvercommitRatio)}
VMs to Migrate: ${formatNumber(output.inventoryTotals.totalVMs)} VMs
- CPU Over-Commit Ratio: ${formatRatio(cpuOverCommitRatio)}
- Memory Over-Commit Ratio: ${formatRatio(memoryOverCommitRatio)}
Resource Breakdown
VM resources (request): ${formatNumber(output.inventoryTotals.totalCPU)} CPU / ${formatNumber(output.inventoryTotals.totalMemory)} GB
With Over-commit (limits): ${formatNumber(cpuLimits)} CPU / ${formatNumber(memoryLimits)} GB
Physical Capacity: ${formatNumber(output.clusterSizing.totalCPU)} CPU / ${formatNumber(output.clusterSizing.totalMemory)} GB

${DISCLAIMER_TEXT}
`.trim();
};

export const SizingResult: React.FC<SizingResultProps> = ({
  clusterName,
  formValues,
  sizerOutput,
  isLoading = false,
  error = null,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const plainTextRecommendation = useMemo(() => {
    if (!sizerOutput) return "";
    return generatePlainTextRecommendation(
      clusterName,
      formValues,
      sizerOutput,
    );
  }, [clusterName, formValues, sizerOutput]);

  const handleCopyRecommendations = useCallback(() => {
    setCopyError(null);
    setCopySuccess(false);

    if (
      !navigator.clipboard ||
      !navigator.clipboard.writeText ||
      (typeof window !== "undefined" && !window.isSecureContext)
    ) {
      setCopyError(
        "Clipboard API is not available. Please use HTTPS or a secure context.",
      );
      setTimeout(() => setCopyError(null), 5000);
      return;
    }

    navigator.clipboard
      .writeText(plainTextRecommendation)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch((err) => {
        console.error("Failed to copy recommendations:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to copy to clipboard. Please check your browser permissions.";
        setCopyError(errorMessage);
        setTimeout(() => setCopyError(null), 5000);
      });
  }, [plainTextRecommendation]);

  if (isLoading) {
    return (
      <Stack hasGutter>
        <StackItem>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentCenter" }}
            style={{ minHeight: "200px" }}
          >
            <FlexItem>
              <Spinner size="lg" aria-label="Loading recommendations" />
            </FlexItem>
          </Flex>
        </StackItem>
      </Stack>
    );
  }

  if (error) {
    const title = "Failed to calculate sizing recommendation";
    let message = error.message;
    if (error.cause && typeof error.cause === "string") {
      try {
        const parsedCause = JSON.parse(error.cause) as { message: string };
        const m = parsedCause.message;
        const firstChar = m.charAt(0);
        message = firstChar ? firstChar.toUpperCase() + m.slice(1) : m;
      } catch {
        // Fall back to original message without crashing
      }
    }

    return (
      <Stack hasGutter>
        <StackItem>
          <Alert isInline variant="danger" title={title}>
            {message}
          </Alert>
        </StackItem>
      </Stack>
    );
  }

  if (!sizerOutput) {
    return (
      <Stack hasGutter>
        <StackItem>
          <p>No sizing data available.</p>
        </StackItem>
      </Stack>
    );
  }

  // Extract optional fields with defaults
  const cpuOverCommitRatio =
    sizerOutput.resourceConsumption.overCommitRatio?.cpu ?? 0;
  const memoryOverCommitRatio =
    sizerOutput.resourceConsumption.overCommitRatio?.memory ?? 0;
  const cpuLimits = sizerOutput.resourceConsumption.limits?.cpu ?? 0;
  const memoryLimits = sizerOutput.resourceConsumption.limits?.memory ?? 0;

  return (
    <Stack hasGutter>
      <StackItem>
        <DescriptionList
          isHorizontal
          isCompact
          className={descriptionListStyles}
        >
          <DescriptionListGroup>
            <DescriptionListTerm>Cluster name</DescriptionListTerm>
            <DescriptionListDescription>
              {clusterName}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Target platform</DescriptionListTerm>
            <DescriptionListDescription>Bare Metal</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Total nodes</DescriptionListTerm>
            <DescriptionListDescription>
              {sizerOutput.clusterSizing.totalNodes} (
              {sizerOutput.clusterSizing.workerNodes} workers +{" "}
              {sizerOutput.clusterSizing.controlPlaneNodes} control plane)
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Failover Capacity</DescriptionListTerm>
            <DescriptionListDescription>
              {sizerOutput.clusterSizing.failoverNodes} failover nodes
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Node size</DescriptionListTerm>
            <DescriptionListDescription>
              {formValues.customCpu} CPU, {formValues.customMemoryGb} GB memory
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Over-commitment</DescriptionListTerm>
            <DescriptionListDescription>
              CPU {getCpuOvercommitLabel(formValues.cpuOvercommitRatio)}, Memory{" "}
              {getMemoryOvercommitLabel(formValues.memoryOvercommitRatio)}
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Workload details</DescriptionListTerm>
            <DescriptionListDescription>
              <List isPlain>
                <ListItem>
                  VMs to migrate:{" "}
                  {formatNumber(sizerOutput.inventoryTotals.totalVMs)}
                </ListItem>
                <ListItem>
                  CPU over-commit ratio: {formatRatio(cpuOverCommitRatio)}
                </ListItem>
                <ListItem>
                  Memory over-commit ratio: {formatRatio(memoryOverCommitRatio)}
                </ListItem>
              </List>
            </DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>Resources</DescriptionListTerm>
            <DescriptionListDescription>
              <List isPlain>
                <ListItem>
                  VM resources (request):{" "}
                  {formatNumber(sizerOutput.inventoryTotals.totalCPU)} CPU,{" "}
                  {formatNumber(sizerOutput.inventoryTotals.totalMemory)} GB
                  memory
                </ListItem>
                <ListItem>
                  With Over-commit (limits): {formatNumber(cpuLimits)} CPU,{" "}
                  {formatNumber(memoryLimits)} GB memory
                </ListItem>
                <ListItem>
                  Physical capacity:{" "}
                  {formatNumber(sizerOutput.clusterSizing.totalCPU)} CPU,{" "}
                  {formatNumber(sizerOutput.clusterSizing.totalMemory)} GB
                  memory
                </ListItem>
              </List>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>

      <StackItem>
        <Button
          variant="link"
          icon={<CopyIcon />}
          iconPosition="end"
          onClick={handleCopyRecommendations}
        >
          Copy as plain text
        </Button>
      </StackItem>

      {copySuccess && (
        <StackItem>
          <Alert
            variant="success"
            isInline
            title="Copied to clipboard"
            actionClose={
              <AlertActionCloseButton onClose={() => setCopySuccess(false)} />
            }
          />
        </StackItem>
      )}

      {copyError && (
        <StackItem>
          <Alert
            variant="danger"
            isInline
            title="Failed to copy"
            actionClose={
              <AlertActionCloseButton onClose={() => setCopyError(null)} />
            }
          >
            {copyError}
          </Alert>
        </StackItem>
      )}
    </Stack>
  );
};

SizingResult.displayName = "SizingResult";

export default SizingResult;
