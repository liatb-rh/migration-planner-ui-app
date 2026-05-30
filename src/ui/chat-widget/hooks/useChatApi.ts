import { useCallback, useRef, useState } from "react";

import type { ChatApiError, ChatMessage, QueryRequest, QueryResponse } from "../types";

const CHAT_API_URL = process.env.CHAT_API_URL ?? "/api/chat/v1/query";

interface UseChatApiResult {
  sendMessage: (
    messages: ChatMessage[],
    signal?: AbortSignal,
  ) => Promise<string>;
  abort: () => void;
}

export const useChatApi = (): UseChatApiResult => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [conversationId, setConversationId] = useState<string>();

  const sendMessage = useCallback(
    async (messages: ChatMessage[], signal?: AbortSignal): Promise<string> => {
      abortControllerRef.current = new AbortController();
      const combinedSignal = signal ?? abortControllerRef.current.signal;

      // Get the latest user message
      const latestUserMessage = messages.filter((m) => m.role === "user").pop();
      if (!latestUserMessage) {
        throw new Error("No user message to send");
      }

      const request: QueryRequest = {
        query: latestUserMessage.content,
        conversation_id: conversationId,
      };

      const response = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: combinedSignal,
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = (await response.json()) as ChatApiError;
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // Use default error message
        }
        throw new Error(errorMessage);
      }

      const data = (await response.json()) as QueryResponse;

      if (!data.response) {
        throw new Error("Invalid response format from chat API");
      }

      // Store conversation ID for subsequent messages
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      return data.response;
    },
    [conversationId],
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  return { sendMessage, abort };
};
