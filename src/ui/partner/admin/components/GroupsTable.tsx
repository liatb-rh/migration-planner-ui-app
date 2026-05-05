import type { Group } from "@openshift-migration-advisor/planner-sdk";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  type MenuToggleElement,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Truncate,
} from "@patternfly/react-core";
import { EllipsisVIcon, PlusIcon } from "@patternfly/react-icons";
import {
  Table,
  TableText,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";
import React, { useMemo, useState } from "react";

interface GroupsTableProps {
  groups: Group[];
  onCreateGroupClick: () => void;
  onGroupClick: (groupId: string) => void;
  onDeleteGroup: (group: Group) => void;
}

export const GroupsTable: React.FC<GroupsTableProps> = ({
  groups,
  onCreateGroupClick,
  onGroupClick,
  onDeleteGroup,
}) => {
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.name.localeCompare(b.name));
  }, [groups]);

  return (
    <>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <Button
              variant="primary"
              onClick={onCreateGroupClick}
              icon={<PlusIcon />}
            >
              Create group
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      <Table aria-label="Groups table" variant="compact">
        <Thead>
          <Tr>
            <Th width={10}>Icon</Th>
            <Th width={10}>ID</Th>
            <Th width={20}>Name</Th>
            <Th width={10}>Kind</Th>
            <Th width={40}>Description</Th>
            <Th screenReaderText="Actions" />
          </Tr>
        </Thead>
        <Tbody>
          {sortedGroups.map((group) => (
            <Tr key={group.id}>
              <Td dataLabel="Group icon" isActionCell>
                {Boolean(group.icon) && (
                  <img
                    src={group.icon}
                    alt={`${group.name} icon`}
                    style={{
                      height: "40px",
                    }}
                  />
                )}
              </Td>
              <Td dataLabel="ID">
                <TableText>
                  <Truncate content={group.id} />
                </TableText>
              </Td>
              <Td dataLabel="Name">
                <Button
                  variant="link"
                  isInline
                  onClick={(): void => onGroupClick(group.id)}
                >
                  {group.name}
                </Button>
              </Td>
              <Td dataLabel="Kind">{group.kind}</Td>
              <Td dataLabel="Description">{group.description}</Td>
              <Td dataLabel="Actions" isActionCell>
                <Dropdown
                  isOpen={openRowId === group.id}
                  popperProps={{
                    appendTo: () => document.body,
                    position: "end",
                  }}
                  onOpenChange={(isOpen) =>
                    setOpenRowId(isOpen ? group.id : null)
                  }
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      aria-label="Actions"
                      variant="plain"
                      onClick={() =>
                        setOpenRowId((prev) =>
                          prev === group.id ? null : group.id,
                        )
                      }
                    >
                      <EllipsisVIcon />
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem onClick={() => onGroupClick(group.id)}>
                      See group
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => {
                        onDeleteGroup(group);
                        setOpenRowId(null);
                      }}
                    >
                      Delete group
                    </DropdownItem>
                  </DropdownList>
                </Dropdown>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </>
  );
};

GroupsTable.displayName = "GroupsTable";
