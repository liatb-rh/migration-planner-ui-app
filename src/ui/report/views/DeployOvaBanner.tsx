import { css } from "@emotion/css";
import {
  Button,
  Content,
  ContentVariants,
  Icon,
  List,
  ListItem,
  Popover,
} from "@patternfly/react-core";
import {
  ExternalLinkAltIcon,
  OutlinedQuestionCircleIcon,
} from "@patternfly/react-icons";
import React from "react";
import { useNavigate } from "react-router-dom";

import { routes } from "../../../routing/Routes";

const bannerStyle = css`
  display: flex;
  align-items: center;
  gap: 0.4em;
  padding-bottom: var(--pf-t--global--spacer--md);
`;

const popoverLinksStyle = css`
  display: flex;
  gap: 1.5em;
  margin-top: 0.5em;
`;

const SETUP_GUIDE_URL =
  "https://kubev2v.github.io/openshift-migration-advisor-docs/docs/tutorial/#discovery-agent-flow";

export const DeployOvaBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={bannerStyle}>
      <Popover
        headerContent="Deploy the Migration Advisor OVA"
        bodyContent={
          <div>
            <Content component={ContentVariants.p}>
              To unlock granular, VM-specific details and readiness scores, you
              must deploy the Migration Advisor Open Virtual Appliance (OVA).
            </Content>

            <Content component={ContentVariants.p}>
              <strong>Why use the OVA?</strong>
            </Content>
            <List>
              <ListItem>
                Granular Detail: Analyzes specific hardware, disk, and network
                configurations for every VM.
              </ListItem>
              <ListItem>
                Live Data: Replaces static uploads with a real-time feed from
                your environment.
              </ListItem>
              <ListItem>
                Identify Blockers: Automatically flags technical issues that
                could impact migration success.
              </ListItem>
            </List>

            <Content component={ContentVariants.p}>
              <strong>What is it?</strong>
            </Content>
            <Content component={ContentVariants.p}>
              A pre-configured, read-only collector appliance that securely
              sends metadata to the console to build your detailed roadmap.
            </Content>

            <div className={popoverLinksStyle}>
              <Button
                isInline
                variant="link"
                onClick={() => navigate(routes.environments)}
              >
                Download OVA
              </Button>
              <Button
                isInline
                variant="link"
                component="a"
                href={SETUP_GUIDE_URL}
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExternalLinkAltIcon />}
                iconPosition="end"
              >
                Read Setup Guide
              </Button>
            </div>
          </div>
        }
        position="top"
      >
        <Button variant="link" isInline>
          <Icon isInline>
            <OutlinedQuestionCircleIcon />
          </Icon>{" "}
          Looking for more VM specific insights? Deploy the Migration Advisor
          Open Virtual Appliance (OVA)
        </Button>
      </Popover>
    </div>
  );
};

DeployOvaBanner.displayName = "DeployOvaBanner";
