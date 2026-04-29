import { css } from "@emotion/css";
import type { PartnerRequestCreate } from "@openshift-migration-advisor/planner-sdk";
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from "@patternfly/react-core";
import React from "react";

import { ContactForm } from "./ContactForm";

const errorDivStyle = css`
  padding-top: 1em;
`;

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: PartnerRequestCreate) => void | Promise<void>;
  error?: Error;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  error,
}) => {
  const handleSubmit = async (values: PartnerRequestCreate) => {
    await onSubmit(values);
  };

  return (
    <Modal variant={ModalVariant.medium} isOpen={isOpen} onClose={onClose}>
      <ModalHeader title="Request a partner" />
      <ModalBody>
        <ContactForm
          id="contact-partner-form"
          onSubmit={(values) => {
            void handleSubmit(values);
          }}
        />
        {error && (
          <div className={errorDivStyle}>
            <Alert isInline variant="danger" title="Request a partner failed">
              {error.message}
            </Alert>
          </div>
        )}
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
