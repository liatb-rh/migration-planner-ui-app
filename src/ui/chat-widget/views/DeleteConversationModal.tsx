import type { Conversation } from "@patternfly/chatbot";
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";
import React, { useCallback, useState } from "react";

import { getErrorMessage } from "../helpers";

interface DeleteConversationModalProps {
  conversation: Conversation;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export const DeleteConversationModal: React.FC<DeleteConversationModalProps> = ({
  conversation,
  onClose,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>();

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    setError(undefined);
    try {
      await onDelete();
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete, onClose]);

  return (
    <Modal
      isOpen
      onClose={onClose}
      aria-label="Delete conversation"
      variant="small"
    >
      <ModalHeader title="Delete conversation" />
      <ModalBody>
        {error && (
          <Alert variant="danger" isInline title="Error">
            {error}
          </Alert>
        )}
        <p>
          Are you sure you want to delete the conversation from{" "}
          {conversation.text}? This action cannot be undone.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={() => void handleDelete()}
          isLoading={isDeleting}
          isDisabled={isDeleting}
        >
          Delete
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isDeleting}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
