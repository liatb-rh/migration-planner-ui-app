import "@patternfly/chatbot/dist/css/main.css";

import {
  Chatbot,
  ChatbotAlert,
  ChatbotContent,
  ChatbotDisplayMode,
  ChatbotFooter,
  ChatbotFootnote,
  ChatbotHeader,
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderMenu,
  ChatbotHeaderTitle,
  ChatbotWelcomePrompt,
  Message,
  MessageBar,
  MessageBox,
} from "@patternfly/chatbot";
import { Brand } from "@patternfly/react-core";
import React, { useCallback, useEffect, useRef } from "react";

import LightSpeedLogo from "../assets/lightspeed-logo.svg";
import { useChatWidgetViewModel } from "../view-models/useChatWidgetViewModel";
import { ChatBotButton } from "./ChatBotButton";
import { ChatBotHistory } from "./ChatBotHistory";
import {
  aiChatbot,
  aiChatbotBrand,
  pfChatbot,
  pfChatbotMessageAndActions,
} from "./styles";

export const ChatWidget: React.FC = () => {
  const vm = useChatWidgetViewModel();
  const scrollToBottomRef = useRef<HTMLDivElement>(null);
  const msgBarRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [vm.messages, vm.isStreaming, vm.isLoading]);

  useEffect(() => {
    if (vm.isOpen) {
      requestAnimationFrame(() => msgBarRef.current?.focus());
    }
  }, [vm.isOpen]);

  const handleSendMessage = useCallback(() => {
    if (vm.inputValue.trim()) {
      void vm.sendMessage();
    }
  }, [vm]);

  const isProcessing = vm.isStreaming || vm.isLoading;

  return (
    <div className={aiChatbot}>
      <ChatBotButton isOpen={vm.isOpen} onClick={vm.toggleDrawer} />
      {vm.isOpen && (
        <Chatbot displayMode={ChatbotDisplayMode.embedded} className={pfChatbot}>
          <ChatBotHistory
            isOpen={vm.isHistoryOpen}
            setIsOpen={vm.setHistoryOpen}
            startNewConversation={vm.startNewConversation}
            loadConversation={vm.loadConversation}
            conversationId={vm.conversationId}
          >
            <ChatbotHeader>
              <ChatbotHeaderMain>
                <ChatbotHeaderMenu
                  onMenuToggle={() => vm.setHistoryOpen(!vm.isHistoryOpen)}
                />
                <ChatbotHeaderTitle>
                  <Brand
                    src={LightSpeedLogo}
                    alt="Lightspeed"
                    className={aiChatbotBrand}
                  />
                </ChatbotHeaderTitle>
              </ChatbotHeaderMain>
              <ChatbotHeaderActions>
                <ChatbotHeaderCloseButton onClick={vm.closeDrawer} />
              </ChatbotHeaderActions>
            </ChatbotHeader>
            <ChatbotContent>
              <MessageBox>
                {vm.messages.length === 0 && (
                  <ChatbotWelcomePrompt
                    title="Hello, I'm your assistant"
                    description="How can I help you today?"
                  />
                )}
                {vm.messages.map((message, index) => {
                  const isLastBotMessage =
                    index === vm.messages.length - 1 &&
                    message.role === "assistant";
                  const showLoading =
                    isLastBotMessage && vm.isStreaming && !message.content;

                  return (
                    <Message
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      timestamp={message.timestamp.toLocaleTimeString()}
                      isLoading={showLoading}
                      className={pfChatbotMessageAndActions}
                    />
                  );
                })}
                {vm.error && (
                  <ChatbotAlert
                    variant="danger"
                    onClose={vm.clearError}
                    title="Error"
                  >
                    {vm.error}
                  </ChatbotAlert>
                )}
                <div ref={scrollToBottomRef} />
              </MessageBox>
            </ChatbotContent>
            <ChatbotFooter>
              <MessageBar
                onSendMessage={handleSendMessage}
                value={vm.inputValue}
                onChange={(_, value) => vm.setInputValue(`${value}`)}
                ref={msgBarRef}
                isSendButtonDisabled={isProcessing}
              />
              <ChatbotFootnote label="AI-generated content may be inaccurate." />
            </ChatbotFooter>
          </ChatBotHistory>
        </Chatbot>
      )}
    </div>
  );
};

ChatWidget.displayName = "ChatWidget";
