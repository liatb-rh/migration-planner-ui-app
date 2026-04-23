import type { PartnerRequestCreate } from "@openshift-migration-advisor/planner-sdk";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from "@patternfly/react-core";
import React from "react";

import { ContactForm } from "./ContactForm";

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: PartnerRequestCreate) => void | Promise<void>;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const handleSubmit = async (values: PartnerRequestCreate) => {
    await onSubmit(values);
    onClose();
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={isOpen}
      onClose={onClose}
      aria-label="Connect with a partner"
    >
      <ModalHeader title="Request a partner" />
      <ModalBody>
        <ContactForm
          id="contact-partner-form"
          onSubmit={(values) => {
            void handleSubmit(values);
          }}
        />
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" type="submit" form="contact-partner-form">
          Submit Request
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

ContactFormModal.displayName = "ContactFormModal";
