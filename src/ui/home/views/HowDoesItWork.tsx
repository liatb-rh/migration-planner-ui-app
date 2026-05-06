import { css } from "@emotion/css";
import {
  Button,
  Card,
  CardBody,
  CardExpandableContent,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  Icon,
  Tooltip,
} from "@patternfly/react-core";
import {
  ClusterIcon,
  InfoCircleIcon,
  MigrationIcon,
  OutlinedQuestionCircleIcon,
} from "@patternfly/react-icons";
import { t_global_color_nonstatus_gray_300 as globalNonStatusGrayColor } from "@patternfly/react-tokens/dist/js/t_global_color_nonstatus_gray_300";
import { t_global_text_color_link_default as globalActiveColor300 } from "@patternfly/react-tokens/dist/js/t_global_text_color_link_default";
import { t_global_text_color_status_info_default as globalTextColorStatusInfoDefault } from "@patternfly/react-tokens/dist/js/t_global_text_color_status_info_default";
import React from "react";
import { useNavigate } from "react-router-dom";

import useLocalStorage from "../../../hooks/useLocalStorage";
import { routes } from "../../../routing/Routes";
import { CustomEnterpriseIcon } from "../../core/components/CustomEnterpriseIcon";

const flexContainerStyle = css`
  padding-top: 2.5em;
  padding-bottom: 2.2em;
`;

const flexItemStyle = css`
  max-width: 380px;
`;

const headingStyle = css`
  margin-top: 0.5em !important;
`;

const questionIconStyle = css`
  margin-left: 0.3em;
`;

const descriptionStyle = css`
  font-size: 100%;
  margin-top: 1em;
`;

const linkButtonStyle = css`
  text-decoration: none;
`;

const cardStyle = css`
  --pf-v6-c-card--BorderColor: ${globalTextColorStatusInfoDefault.var};
`;

const HOW_DOES_IT_WORK_EXPANDED_KEY =
  "migration-advisor:how-does-it-work-card-expanded";

export const HowDoesItWork: React.FC = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useLocalStorage(
    HOW_DOES_IT_WORK_EXPANDED_KEY,
    true,
  );

  return (
    <Card isExpanded={isExpanded} className={cardStyle}>
      <CardHeader onExpand={() => setIsExpanded(!isExpanded)}>
        <CardTitle>
          <Icon size="md" style={{ marginRight: "0.5rem" }}>
            <InfoCircleIcon color={globalTextColorStatusInfoDefault.var} />
          </Icon>
          How does this work?
        </CardTitle>
      </CardHeader>
      <CardExpandableContent>
        <CardBody>
          <Flex
            spaceItems={{
              default: "spaceItemsLg",
              "2xl": "spaceItems4xl",
            }}
            justifyContent={{ default: "justifyContentCenter" }}
            className={flexContainerStyle}
          >
            <FlexItem flex={{ default: "flex_1" }} className={flexItemStyle}>
              <Icon size="xl">
                <CustomEnterpriseIcon color={globalNonStatusGrayColor.var} />
              </Icon>
              <Content component="h3" className={headingStyle}>
                Assess VMware
                <Tooltip content="As part of the discovery process, we're collecting aggregated data about your VMware environment. This includes information such as the number of clusters, hosts, and VMs; VM counts per operating system type; total CPU cores and memory; network types and VLANs; and a list of datastores.">
                  <Icon size="lg" className={questionIconStyle}>
                    <OutlinedQuestionCircleIcon
                      color={globalActiveColor300.var}
                    />
                  </Icon>
                </Tooltip>
              </Content>
              <Content className={descriptionStyle}>
                Run discovery or upload an inventory file to generate a
                migration report.{" "}
                <Button
                  isInline
                  variant="link"
                  onClick={() => navigate(routes.exampleReport)}
                  className={linkButtonStyle}
                >
                  See RVtools example report
                </Button>{" "}
                or{" "}
                <Button
                  isInline
                  variant="link"
                  onClick={() => navigate(routes.discoveryOvaExampleReport)}
                  className={linkButtonStyle}
                >
                  Discovery OVA example report
                </Button>
              </Content>
            </FlexItem>
            <FlexItem flex={{ default: "flex_1" }} className={flexItemStyle}>
              <Icon size="xl">
                <ClusterIcon color={globalNonStatusGrayColor.var} />
              </Icon>
              <Content component="h3" className={headingStyle}>
                Select Target Cluster
              </Content>
              <Content className={descriptionStyle}>
                Select or create an OpenShift Cluster for Migration
              </Content>
            </FlexItem>
            <FlexItem flex={{ default: "flex_1" }} className={flexItemStyle}>
              <Icon size="xl">
                <MigrationIcon color={globalNonStatusGrayColor.var} />
              </Icon>
              <Content component="h3" className={headingStyle}>
                Plan Migration
              </Content>
              <Content className={descriptionStyle}>
                Select VMs, map network and storage, and schedule a migration
              </Content>
            </FlexItem>
          </Flex>
        </CardBody>
      </CardExpandableContent>
    </Card>
  );
};

HowDoesItWork.displayName = "HowDoesItWork";

export default HowDoesItWork;
