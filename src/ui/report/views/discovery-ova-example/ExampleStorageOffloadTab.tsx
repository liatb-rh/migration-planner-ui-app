import { css } from "@emotion/css";
import {
  Card,
  CardBody,
  CardTitle,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Icon,
  Label,
  Popover,
  Progress,
  ProgressMeasureLocation,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExternalLinkAltIcon,
  InfoCircleIcon,
} from "@patternfly/react-icons";
import React from "react";

const sectionSpacing = css`
  margin-top: var(--pf-t--global--spacer--lg);
`;

const TECH_PREVIEW_LINK =
  "https://access.redhat.com/support/offerings/techpreview";

const ExampleStorageOffloadTab: React.FC = () => (
  <div className={sectionSpacing}>
    <Stack hasGutter>
      <StackItem>
        <Flex
          gap={{ default: "gapMd" }}
          alignItems={{ default: "alignItemsCenter" }}
        >
          <FlexItem>
            <Content component="h3">Storage Offload Estimator</Content>
          </FlexItem>
          <FlexItem>
            <Popover
              bodyContent={
                <>
                  Technology preview features provide early access to upcoming
                  product innovations, enabling you to test functionality and
                  provide feedback during the development process.{" "}
                  <a
                    href={TECH_PREVIEW_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn more <ExternalLinkAltIcon />
                  </a>
                </>
              }
              position="top"
            >
              <Label
                style={{ cursor: "pointer" }}
                color="orange"
                icon={<InfoCircleIcon />}
              >
                TP
              </Label>
            </Popover>
          </FlexItem>
        </Flex>
      </StackItem>

      <StackItem>
        <Content component="p">
          Estimate how long a storage-offload migration would take for your
          environment by analyzing datastore pairs between source and target
          arrays.
        </Content>
      </StackItem>

      <StackItem>
        <Gallery hasGutter minWidths={{ default: "300px", md: "45%" }}>
          <GalleryItem>
            <Card>
              <CardTitle>Estimated datastore pairs</CardTitle>
              <CardBody>
                <DescriptionList isHorizontal>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Source array</DescriptionListTerm>
                    <DescriptionListDescription>
                      NetApp FAS8200 (eco-iscsi-ds3)
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Target array</DescriptionListTerm>
                    <DescriptionListDescription>
                      NetApp ONTAP Select (ocp-nfs-stor01)
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Total data</DescriptionListTerm>
                    <DescriptionListDescription>
                      42.5 TB
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Transfer rate</DescriptionListTerm>
                    <DescriptionListDescription>
                      0.5 - 2.0 GB/s
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </GalleryItem>

          <GalleryItem>
            <Card>
              <CardTitle>Estimation results</CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <Content component="small">
                      <Icon status="success" isInline>
                        <CheckCircleIcon />
                      </Icon>{" "}
                      Completed — example estimation
                    </Content>
                  </StackItem>
                  <StackItem>
                    <DescriptionList isHorizontal>
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          Min estimated time
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          <strong>5 hours 54 min</strong>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>
                          Max estimated time
                        </DescriptionListTerm>
                        <DescriptionListDescription>
                          <strong>23 hours 36 min</strong>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </StackItem>
                  <StackItem>
                    <Progress
                      value={100}
                      title="Estimation complete"
                      measureLocation={ProgressMeasureLocation.outside}
                    />
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GalleryItem>
        </Gallery>
      </StackItem>
    </Stack>
  </div>
);

ExampleStorageOffloadTab.displayName = "ExampleStorageOffloadTab";

export { ExampleStorageOffloadTab };
