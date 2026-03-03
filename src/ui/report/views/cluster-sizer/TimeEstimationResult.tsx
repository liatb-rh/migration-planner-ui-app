import { css } from "@emotion/css";
import type { MigrationEstimationResponse } from "@openshift-migration-advisor/planner-sdk";
import {
  Alert,
  List,
  ListItem,
  Spinner,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React from "react";

import {
  parsePostMigrationChecks,
  parseStorageTransfer,
} from "./timeParsingUtils";
import { parseDuration } from "./timeUtils";

interface TimeEstimationResultProps {
  clusterName: string;
  estimationOutput: MigrationEstimationResponse | null;
  isLoading: boolean;
  error: Error | null;
}

const sectionStyle = css`
  border: 1px solid var(--pf-t--global--border--color--default);
  border-radius: var(--pf-t--global--border--radius--small);
  padding: var(--pf-t--global--spacer--400);
  margin-bottom: var(--pf-t--global--spacer--400);
`;

const totalTimeStyle = css`
  font-size: var(--pf-t--global--font--size--xl);
  font-weight: var(--pf-t--global--font--weight--body--bold);
  margin-bottom: var(--pf-t--global--spacer--300);
`;

const subtitleStyle = css`
  color: var(--pf-t--global--text--color--subtle);
  margin-bottom: var(--pf-t--global--spacer--300);
`;

const phaseHeaderStyle = css`
  font-weight: var(--pf-t--global--font--weight--body--bold);
  margin-top: var(--pf-t--global--spacer--300);
  margin-bottom: var(--pf-t--global--spacer--200);
`;

const getTotalDurationInHours = (duration: string): number => {
  const seconds = parseDuration(duration);
  return Math.ceil(seconds / 3600);
};

export const TimeEstimationResult: React.FC<TimeEstimationResultProps> = ({
  clusterName,
  estimationOutput,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <Stack hasGutter>
        <StackItem>
          <Spinner
            size="lg"
            aria-label="Calculating migration time estimation"
          />
        </StackItem>
        <StackItem>
          <p>Calculating migration time estimation for {clusterName}...</p>
        </StackItem>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" isInline title="Calculation failed">
        {error.message}
      </Alert>
    );
  }

  if (!estimationOutput) {
    return null;
  }

  const totalHours =
    estimationOutput.totalDuration &&
    typeof estimationOutput.totalDuration === "string" &&
    estimationOutput.totalDuration.trim() !== ""
      ? getTotalDurationInHours(estimationOutput.totalDuration)
      : null;

  const breakdownEntries =
    estimationOutput.breakdown &&
    typeof estimationOutput.breakdown === "object" &&
    Object.keys(estimationOutput.breakdown).length > 0
      ? Object.entries(estimationOutput.breakdown)
      : [];

  return (
    <Stack hasGutter>
      <StackItem>
        <div className={sectionStyle}>
          <Title headingLevel="h3">Migration Time Summary</Title>
          <div className={totalTimeStyle}>
            Total Estimated Time:{" "}
            {totalHours !== null ? `${totalHours} Hours` : "N/A"}
          </div>

          <Table aria-label="Migration time breakdown" variant="compact">
            <Thead>
              <Tr>
                <Th>Phase</Th>
                <Th>Duration</Th>
                <Th>Details</Th>
              </Tr>
            </Thead>
            <Tbody>
              {breakdownEntries.map(([phase, detail]) => {
                const normalizedDetail =
                  detail && typeof detail === "object"
                    ? (detail as unknown as Record<string, unknown>)
                    : ({} as Record<string, unknown>);

                const duration =
                  "duration" in normalizedDetail &&
                  typeof normalizedDetail.duration === "string"
                    ? normalizedDetail.duration
                    : "";

                const durationHours =
                  duration.trim() !== ""
                    ? getTotalDurationInHours(duration)
                    : null;

                const reason =
                  "reason" in normalizedDetail &&
                  typeof normalizedDetail.reason === "string"
                    ? normalizedDetail.reason
                    : "";

                const volumeMatch = reason.match(/([\d,]+\.?\d*)\s+GB/i);
                const vmsMatch = reason.match(/(\d+)\s+VMs?/i);

                let detailText = "";
                if (volumeMatch) {
                  const gb = parseFloat(volumeMatch[1].replace(/,/g, ""));
                  const tb = (gb / 1000).toFixed(1);
                  detailText = `${tb} TB Total Volume`;
                } else if (vmsMatch) {
                  detailText = `${vmsMatch[1]} Virtual Machines`;
                }

                return (
                  <Tr key={phase}>
                    <Td>{phase}</Td>
                    <Td>
                      {durationHours !== null
                        ? `${durationHours} Hours`
                        : "N/A"}
                    </Td>
                    <Td>{detailText}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </div>
      </StackItem>
      <StackItem>
        <div className={sectionStyle}>
          <Title headingLevel="h3">Migration Assumptions</Title>
          <p className={subtitleStyle}>
            The following parameters were used to calculate this estimate:
          </p>

          {breakdownEntries.map(([phase, detail]) => {
            const normalizedDetail =
              detail && typeof detail === "object"
                ? (detail as unknown as Record<string, unknown>)
                : ({} as Record<string, unknown>);

            const reason =
              "reason" in normalizedDetail &&
              typeof normalizedDetail.reason === "string"
                ? normalizedDetail.reason
                : "";

            const isPostMigration = phase
              .toLowerCase()
              .includes("post-migration");
            const assumptions = isPostMigration
              ? parsePostMigrationChecks(reason)
              : parseStorageTransfer(reason);

            return (
              <div key={phase}>
                <div className={phaseHeaderStyle}>{phase}</div>
                <List>
                  {assumptions.workload && (
                    <ListItem>
                      <strong>Workload:</strong> {assumptions.workload}
                    </ListItem>
                  )}
                  {assumptions.resources && (
                    <ListItem>
                      <strong>Resources:</strong> {assumptions.resources}
                    </ListItem>
                  )}
                  {assumptions.schedule && (
                    <ListItem>
                      <strong>Schedule:</strong> {assumptions.schedule}
                    </ListItem>
                  )}
                  {assumptions.volume && (
                    <ListItem>
                      <strong>Volume:</strong> {assumptions.volume}
                    </ListItem>
                  )}
                  {assumptions.transferSpeed && (
                    <ListItem>
                      <strong>Transfer Speed:</strong>{" "}
                      {assumptions.transferSpeed}
                    </ListItem>
                  )}
                </List>
              </div>
            );
          })}
        </div>
      </StackItem>
    </Stack>
  );
};

TimeEstimationResult.displayName = "TimeEstimationResult";

export default TimeEstimationResult;
