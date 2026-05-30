import { css } from "@emotion/css";

export const aiChatbot = css`
  position: fixed;
  z-index: 29999;
`;

export const aiChatbotButton = css`
  position: fixed;
  inset-block-end: 20px;
  inset-inline-end: 20px;
  height: 46px;
  width: 46px;
  box-shadow: var(--pf-t--global--box-shadow--lg);
  border-radius: 10px;
`;

export const pfChatbot = css`
  inset-block-end: 80px;
  inset-inline-end: 20px;
`;

export const aiChatbotBrand = css`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

export const pfChatbotMessageAndActions = css`
  overflow-wrap: anywhere;
`;

export const chatBotButtonIcon = css`
  height: 46px;
  width: 46px;
`;
