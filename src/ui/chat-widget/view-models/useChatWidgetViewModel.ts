import { useCallback, useState } from "react";

import { useMessages } from "../hooks/useMessages";
import type { ChatMessage } from "../types";

export interface ChatWidgetViewModel {
  messages: ChatMessage[];
  inputValue: string;
  isOpen: boolean;
  isLoading: boolean;
  isStreaming: boolean;
  isHistoryOpen: boolean;
  conversationId: string | undefined;
  error: string | null;
  setInputValue: (value: string) => void;
  sendMessage: () => Promise<void>;
  toggleDrawer: () => void;
  closeDrawer: () => void;
  clearError: () => void;
  setHistoryOpen: (open: boolean) => void;
  startNewConversation: (closeDrawer?: boolean) => void;
  loadConversation: (id: string) => Promise<void>;
}

export const useChatWidgetViewModel = (): ChatWidgetViewModel => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    messages,
    conversationId,
    isStreaming,
    isLoading,
    error,
    sendMessage: sendApiMessage,
    startNewConversation: startNew,
    loadConversation,
    resetError,
  } = useMessages();

  const sendMessage = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isStreaming) return;

    setInputValue("");
    await sendApiMessage(trimmedInput);
  }, [inputValue, isStreaming, sendApiMessage]);

  const toggleDrawer = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearError = useCallback(() => {
    resetError();
  }, [resetError]);

  const startNewConversation = useCallback(
    (closeDrawer = true) => {
      startNew();
      if (closeDrawer) {
        setIsHistoryOpen(false);
      }
    },
    [startNew],
  );

  return {
    messages,
    inputValue,
    isOpen,
    isLoading,
    isStreaming,
    isHistoryOpen,
    conversationId,
    error: error ?? null,
    setInputValue,
    sendMessage,
    toggleDrawer,
    closeDrawer,
    clearError,
    setHistoryOpen: setIsHistoryOpen,
    startNewConversation,
    loadConversation,
  };
};
