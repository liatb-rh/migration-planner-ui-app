import { Button, Tooltip } from "@patternfly/react-core";
import React from "react";

import LightSpeedLogo from "../assets/lightspeed-logo.svg";

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
            style={{ height: "46px", width: "46px" }}
          />
        }
        variant="plain"
        className="ai-chatbot__button"
        onClick={onClick}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
      />
    </Tooltip>
  );
};

ChatBotButton.displayName = "ChatBotButton";
