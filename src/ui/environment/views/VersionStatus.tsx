import { css } from "@emotion/css";
import type { Agent } from "@openshift-migration-advisor/planner-sdk";
import {
  Button,
  Icon,
  Popover,
  Split,
  SplitItem,
} from "@patternfly/react-core";
import { InfoCircleIcon, QuestionCircleIcon } from "@patternfly/react-icons";
import { t_global_color_status_success_default as globalSuccessColor } from "@patternfly/react-tokens/dist/js/t_global_color_status_success_default";
import { t_global_icon_color_status_info_default as globalInfoColor } from "@patternfly/react-tokens/dist/js/t_global_icon_color_status_info_default";
import { t_global_text_color_status_warning_default as globalTextWarningColor } from "@patternfly/react-tokens/dist/js/t_global_text_color_status_warning_default";
import React from "react";

import { VCenterSetupInstructions } from "../../core/components/VCenterSetupInstructions";

const VALUE_NOT_AVAILABLE = "N/A";

const splitGap = css`
  gap: 0.5rem;
`;

const popoverButton = css`
  padding: 0;
  min-width: auto;
`;

const latestStyle = css`
  color: ${globalSuccessColor.var};
`;

const outdatedStyle = css`
  color: ${globalTextWarningColor.var};
`;

const ovaDownloadingStyle = css`
  color: ${globalInfoColor.var};
`;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const OvaDownloading: React.FC = () => (
  <Split hasGutter className={splitGap}>
    <SplitItem>
      <span className={ovaDownloadingStyle}>Download pending</span>
    </SplitItem>
    <SplitItem>
      <Popover
        aria-label="OVA installation instructions"
        headerContent="Install the OVA in your vCenter"
        headerComponent="h2"
        bodyContent={<VCenterSetupInstructions />}
        minWidth="600px"
      >
        <Button
          variant="plain"
          aria-label="OVA installation instructions"
          className={popoverButton}
        >
          <Icon isInline>
            <QuestionCircleIcon color={globalInfoColor.var} />
          </Icon>
        </Button>
      </Popover>
    </SplitItem>
  </Split>
);

const OvaDownloaded: React.FC = () => (
  <Split hasGutter className={splitGap}>
    <SplitItem>
      <span className={ovaDownloadingStyle}>OVA downloaded</span>
    </SplitItem>
    <SplitItem>
      <Popover
        aria-label="OVA installation instructions"
        headerContent="Install the OVA in your vCenter"
        headerComponent="h2"
        bodyContent={<VCenterSetupInstructions />}
        minWidth="600px"
      >
        <Button
          variant="plain"
          aria-label="OVA installation instructions"
          className={popoverButton}
        >
          <Icon isInline>
            <QuestionCircleIcon color={globalInfoColor.value} />
          </Icon>
        </Button>
      </Popover>
    </SplitItem>
  </Split>
);

const NotAvailable: React.FC<{ warning?: string | null }> = ({ warning }) => (
  <Split hasGutter className={splitGap}>
    <SplitItem>
      <span>{VALUE_NOT_AVAILABLE}</span>
    </SplitItem>
    {warning && (
      <SplitItem>
        <Popover
          aria-label="Version information"
          headerContent="Version Information"
          headerComponent="h2"
          bodyContent={<div>{warning}</div>}
        >
          <Button
            variant="plain"
            aria-label="Version information"
            className={popoverButton}
          >
            <Icon isInline>
              <InfoCircleIcon color={globalInfoColor.value} />
            </Icon>
          </Button>
        </Popover>
      </SplitItem>
    )}
  </Split>
);

const VersionWarning: React.FC<{ warning: string }> = ({ warning }) => (
  <Split hasGutter className={splitGap}>
    <SplitItem>
      <span className={outdatedStyle}>Outdated</span>
    </SplitItem>
    <SplitItem>
      <Popover
        aria-label="Version warning"
        headerContent="Version Warning"
        headerComponent="h2"
        bodyContent={<div>{warning}</div>}
      >
        <Button
          variant="plain"
          aria-label="Version warning info"
          className={popoverButton}
        >
          <Icon isInline>
            <QuestionCircleIcon color={globalTextWarningColor.var} />
          </Icon>
        </Button>
      </Popover>
    </SplitItem>
  </Split>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Renders the "Agent Version" column cell in the Sources table.
 *
 * The displayed value is derived from three inputs:
 *
 * | displayStatus                 | isUploadedManually | agentVersion | agentVersionWarning | Renders                             |
 * |-------------------------------|--------------------|--------------|---------------------|-------------------------------------|
 * | `not-connected`               | `false`            | falsy        | any                 | "Download pending" (blue) + popover |
 * | `not-connected`               | `false`            | truthy       | any                 | "OVA downloaded" (blue) + popover   |
 * | `not-connected`               | `true`             | any          | falsy               | "N/A"                               |
 * | `not-connected`               | `true`             | any          | truthy              | "N/A" (blue info icon) + popover    |
 * | `waiting-for-credentials`     | n/a                | any          | falsy               | "Up to date" (green)                |
 * | `waiting-for-credentials`     | n/a                | any          | truthy              | "Outdated" (yellow) + popover       |
 * | `gathering-initial-inventory` | n/a                | any          | falsy               | "Up to date" (green)                |
 * | `gathering-initial-inventory` | n/a                | any          | truthy              | "Outdated" (yellow) + popover       |
 * | `error`                       | n/a                | any          | falsy               | "Up to date" (green)                |
 * | `error`                       | n/a                | any          | truthy              | "Outdated" (yellow) + popover       |
 * | `up-to-date`                  | n/a                | any          | falsy               | "Up to date" (green)                |
 * | `up-to-date`                  | n/a                | any          | truthy              | "Outdated" (yellow) + popover       |
 *
 * `isUploadedManually` = `source.onPremises === true && source.inventory !== undefined`.
 * `agentVersion` is stored by the backend when the OVA is downloaded; its presence means
 * the OVA has been downloaded (and likely deployed in vCenter) even if the agent has not
 * yet connected back.
 * `agentVersionWarning` comes directly from the `Source.agentVersionWarning` API field.
 */
type VersionStatusProps = {
  displayStatus: Agent["status"];
  isUploadedManually: boolean;
  agentVersion?: string | null;
  agentVersionWarning?: string | null;
};

export const VersionStatus: React.FC<VersionStatusProps> = ({
  displayStatus,
  isUploadedManually,
  agentVersion,
  agentVersionWarning,
}) => {
  if (displayStatus === "not-connected" && !isUploadedManually) {
    return agentVersion ? <OvaDownloaded /> : <OvaDownloading />;
  }

  if (displayStatus === "not-connected") {
    return <NotAvailable warning={agentVersionWarning} />;
  }

  if (agentVersionWarning) {
    return <VersionWarning warning={agentVersionWarning} />;
  }

  return <span className={latestStyle}>Up to date</span>;
};
