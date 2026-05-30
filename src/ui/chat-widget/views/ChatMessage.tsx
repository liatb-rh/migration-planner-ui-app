import { css } from "@emotion/css";
import { Content, Flex, FlexItem, Icon } from "@patternfly/react-core";
import { OutlinedUserIcon, RobotIcon } from "@patternfly/react-icons";
import { t_global_color_brand_default as brandDefault } from "@patternfly/react-tokens/dist/js/t_global_color_brand_default";
import { t_global_color_nonstatus_gray_default as grayDefault } from "@patternfly/react-tokens/dist/js/t_global_color_nonstatus_gray_default";
import React from "react";
import Markdown from "react-markdown";

import type { ChatMessage as ChatMessageType } from "../types";

const userMessageStyle = css`
  background-color: var(--pf-t--global--background--color--secondary--default);
  border-radius: var(--pf-t--global--border--radius--small);
  padding: var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md);
  max-width: 85%;
  align-self: flex-end;
`;

const assistantMessageStyle = css`
  background-color: var(--pf-t--global--background--color--primary--default);
  border-radius: var(--pf-t--global--border--radius--small);
  padding: var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md);
  max-width: 85%;
  align-self: flex-start;
  border: 1px solid var(--pf-t--global--border--color--default);
`;

const messageContainerStyle = css`
  display: flex;
  flex-direction: column;
  gap: var(--pf-t--global--spacer--xs);
  margin-bottom: var(--pf-t--global--spacer--md);
`;

const userContainerStyle = css`
  align-items: flex-end;
`;

const assistantContainerStyle = css`
  align-items: flex-start;
`;

const iconWrapperStyle = css`
  display: flex;
  align-items: center;
  gap: var(--pf-t--global--spacer--xs);
`;

const markdownContentStyle = css`
  & p {
    margin: 0 0 var(--pf-t--global--spacer--sm) 0;
  }
  & p:last-child {
    margin-bottom: 0;
  }
  & pre {
    background-color: var(
      --pf-t--global--background--color--secondary--default
    );
    padding: var(--pf-t--global--spacer--sm);
    border-radius: var(--pf-t--global--border--radius--small);
    overflow-x: auto;
    font-size: var(--pf-t--global--font--size--sm);
  }
  & code {
    font-family: var(--pf-t--global--font--family--mono);
    font-size: var(--pf-t--global--font--size--sm);
  }
  & ul,
  & ol {
    margin: 0 0 var(--pf-t--global--spacer--sm) 0;
    padding-left: var(--pf-t--global--spacer--lg);
  }
`;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ChatMessageView {
  export type Props = {
    message: ChatMessageType;
  };
}

export const ChatMessageView: React.FC<ChatMessageView.Props> = ({
  message,
}) => {
  const isUser = message.role === "user";

  return (
    <div
      className={`${messageContainerStyle} ${isUser ? userContainerStyle : assistantContainerStyle}`}
    >
      <div className={iconWrapperStyle}>
        <Icon>
          {isUser ? (
            <OutlinedUserIcon color={grayDefault.value} />
          ) : (
            <RobotIcon color={brandDefault.value} />
          )}
        </Icon>
        <Content component="small">{isUser ? "You" : "AI Assistant"}</Content>
      </div>
      <div className={isUser ? userMessageStyle : assistantMessageStyle}>
        <Flex>
          <FlexItem>
            <div className={markdownContentStyle}>
              <Markdown>{message.content}</Markdown>
            </div>
          </FlexItem>
        </Flex>
      </div>
    </div>
  );
};

ChatMessageView.displayName = "ChatMessageView";
