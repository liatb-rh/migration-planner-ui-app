import "./StartingPageModal.css";

import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Title,
} from "@patternfly/react-core";
import { Modal, ModalVariant } from "@patternfly/react-core/deprecated";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import StartingPage from "./StartingPage";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onOpenRVToolsModal: () => void;
};

const StartingPageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenRVToolsModal,
}) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCreateFromRVTools = (): void => {
    setIsDropdownOpen(false);
    onClose();
    onOpenRVToolsModal();
  };

  const handleCreateFromOVA = (): void => {
    setIsDropdownOpen(false);
    onClose();
    navigate("/openshift/migration-assessment/assessments/create", {
      state: { reset: true },
    });
  };

  return (
    <Modal
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
      aria-label="Getting started with Migration Assessment"
      className="starting-page-modal"
      header={
        <Title headingLevel="h1" size="xl">
          Getting started with Migration Assessment
        </Title>
      }
      actions={[
        <Dropdown
          key="create-dropdown"
          isOpen={isDropdownOpen}
          onOpenChange={setIsDropdownOpen}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              variant="primary"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              isExpanded={isDropdownOpen}
              style={{ minWidth: "290px" }}
            >
              Create new migration assessment
            </MenuToggle>
          )}
        >
          <DropdownList>
            <DropdownItem key="ova" onClick={handleCreateFromOVA}>
              With discovery OVA
            </DropdownItem>
            <DropdownItem key="rvtools" onClick={handleCreateFromRVTools}>
              From RVTools (XLS/X)
            </DropdownItem>
          </DropdownList>
        </Dropdown>,
        <Button key="close" variant="link" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <StartingPage />
    </Modal>
  );
};

StartingPageModal.displayName = "StartingPageModal";

export default StartingPageModal;
