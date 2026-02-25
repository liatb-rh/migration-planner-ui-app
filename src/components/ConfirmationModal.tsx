import {
  Button,
  Flex,
  Modal /* data-codemods */,
  ModalBody /* data-codemods */,
  ModalFooter /* data-codemods */,
  ModalHeader /* data-codemods */,
} from "@patternfly/react-core";
import { css } from "@emotion/css";
import React from "react";

const confirmationModalClass = css({
  "& .pf-v5-c-modal-box__close, & .pf-v6-c-modal-box__close": {
    insetBlockStart: 0,
    top: "1rem",
  },
  "& .pf-v5-c-modal-box__header, & .pf-v6-c-modal-box__header": {
    alignItems: "flex-start",
    textAlign: "left",
  },
});

const confirmationModalBodyClass = css({
  paddingTop: "3rem",
  paddingBottom: "3rem",
  paddingLeft: "2rem",
});

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ConfirmationModal {
  export type Props = {
    onClose?: (event: KeyboardEvent | React.MouseEvent) => void;
    onCancel?: React.MouseEventHandler<HTMLButtonElement> | undefined;
    onConfirm?: React.MouseEventHandler<HTMLButtonElement> | undefined;
    isOpen?: boolean;
    isDisabled?: boolean;
    titleIconVariant?: "warning" | "success" | "danger" | "info" | "custom";
    variant?: "default" | "small" | "medium" | "large";
    primaryButtonVariant?:
      | "warning"
      | "danger"
      | "link"
      | "primary"
      | "secondary"
      | "tertiary"
      | "plain"
      | "control";
    title: string;
  };
}

export const ConfirmationModal: React.FC<
  React.PropsWithChildren<ConfirmationModal.Props>
> = (props) => {
  const {
    isOpen = false,
    isDisabled = false,
    onClose,
    onConfirm,
    onCancel,
    variant = "small",
    titleIconVariant = "info",
    primaryButtonVariant = "primary",
    title,
    children,
  } = props;

  return (
    <Modal
      width="44rem"
      isOpen={isOpen}
      variant={variant}
      className={confirmationModalClass}
      aria-describedby="modal-title-icon-description"
      aria-labelledby="title-icon-modal-title"
      onClose={onClose}
    >
      <div style={{ width: "100%" }}>
        <ModalHeader
          title={title}
          titleIconVariant={titleIconVariant}
          labelId="title-icon-modal-title"
        />
      </div>
      <ModalBody className={confirmationModalBodyClass}>{children}</ModalBody>
      <ModalFooter>
        <Flex justifyContent={{ default: "justifyContentFlexStart" }}>
          <Button
            key="confirm"
            variant={primaryButtonVariant}
            isDisabled={isDisabled}
            onClick={onConfirm}
          >
            Delete
          </Button>
          {onCancel && (
            <Button key="cancel" variant="link" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </Flex>
      </ModalFooter>
    </Modal>
  );
};

ConfirmationModal.displayName = "ConfirmationModal";
