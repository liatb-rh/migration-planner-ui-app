import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from "@patternfly/react-core";
import React from "react";

import {
  DenyPartnerRequestForm,
  type DenyPartnerRequestFormValues,
} from "./DenyPartnerRequestForm";

interface DenyPartnerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: DenyPartnerRequestFormValues) => void | Promise<void>;
}

export const DenyPartnerRequestModal: React.FC<
  DenyPartnerRequestModalProps
> = ({ isOpen, onClose, onSubmit }) => {
  const handleSubmit = async (values: DenyPartnerRequestFormValues) => {
    await onSubmit(values);
    onClose();
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onClose}
      aria-label="Deny partner request"
    >
      <ModalHeader title="Deny customer request" />
      <ModalBody>
        <DenyPartnerRequestForm
          id="deny-partner-request-form"
          onSubmit={(values) => {
            void handleSubmit(values);
          }}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="danger" type="submit" form="deny-partner-request-form">
          Deny
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

DenyPartnerRequestModal.displayName = "DenyPartnerRequestModal";
