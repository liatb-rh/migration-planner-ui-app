import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import { ArrowLeftIcon, SearchIcon } from "@patternfly/react-icons";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { routes } from "../../../../routing/Routes";
import { LoadingSpinner } from "../../../core/components/LoadingSpinner";
import { EditGroupModal } from "../components/EditGroupModal";
import type { EditGroupFormValues } from "../components/GroupForm";
import { useGroupDetailsViewModel } from "../view-models/useGroupDetailsViewModel";
import { GroupMembersSection } from "./GroupMembersSection";

export const GroupDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const vm = useGroupDetailsViewModel();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditSubmit = async (values: EditGroupFormValues) => {
    const { id: _id, ...updateData } = values;
    await vm.updateGroup(updateData);
    setIsEditModalOpen(false);
  };

  return (
    <>
      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <Button
              variant="link"
              onClick={() => navigate(routes.adminGroups)}
              icon={<ArrowLeftIcon />}
            >
              Back to groups
            </Button>
          </StackItem>

          <StackItem>
            <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
              <FlexItem>
                <Title headingLevel="h1">Group {vm.group?.name}</Title>
              </FlexItem>
              <FlexItem>
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  isDisabled={!vm.group || vm.isLoading || Boolean(vm.error)}
                >
                  Edit
                </Button>
              </FlexItem>
            </Flex>
          </StackItem>

          {vm.isLoading && (
            <StackItem>
              <LoadingSpinner />
            </StackItem>
          )}

          {vm.error && (
            <StackItem>
              <Alert
                isInline
                variant="danger"
                title={`Error loading partner (id: ${vm.id}): ${vm.error.message}`}
              />
            </StackItem>
          )}

          {!vm.isLoading && !vm.error && !vm.group && (
            <StackItem>
              <EmptyState
                headingLevel="h4"
                icon={SearchIcon}
                titleText={`No partner with id ${vm.id} available`}
                variant="sm"
              />
            </StackItem>
          )}

          {vm.group && (
            <StackItem>
              <Card>
                <CardHeader>
                  <img
                    src={vm.group.icon}
                    alt={`${vm.group.name} icon`}
                    style={{ height: "80px", objectFit: "contain" }}
                  />
                </CardHeader>
                <CardBody>
                  <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>ID</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vm.group.id}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vm.group.name}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Company</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vm.group.company}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Kind</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vm.group.kind}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Description</DescriptionListTerm>
                      <DescriptionListDescription>
                        {vm.group.description}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </CardBody>
              </Card>
              {isEditModalOpen && (
                <EditGroupModal
                  isOpen={isEditModalOpen}
                  group={vm.group}
                  onClose={() => setIsEditModalOpen(false)}
                  onSubmit={(values) => {
                    void handleEditSubmit(values);
                  }}
                />
              )}
            </StackItem>
          )}
        </Stack>
      </PageSection>
      {vm.group && <GroupMembersSection group={vm.group} />}
    </>
  );
};

GroupDetailScreen.displayName = "GroupDetailScreen";

export default GroupDetailScreen;
