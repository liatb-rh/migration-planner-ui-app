import { Button, Tooltip } from "@patternfly/react-core";
import React from "react";

import LightSpeedLogo from "../assets/lightspeed-logo.svg";
import { aiChatbotButton, chatBotButtonIcon } from "./styles";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ChatBotButton {
  export type Props = {
    isOpen: boolean;
    onClick: () => void;
  };
}

export const ChatBotButton: React.FC<ChatBotButton.Props> = ({
  isOpen,
  onClick,
}) => {
  return (
    <Tooltip content={isOpen ? "Close assistant" : "Open assistant"}>
      <Button
        icon={
          <img
            src={LightSpeedLogo}
            alt="Lightspeed logo"
            className={chatBotButtonIcon}
          />
        }
        variant="plain"
        className={aiChatbotButton}
        onClick={onClick}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
      />
    </Tooltip>
  );
};

ChatBotButton.displayName = "ChatBotButton";
