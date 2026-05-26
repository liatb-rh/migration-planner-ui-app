import { useCallback, useState } from "react";

import { generateId, getErrorMessage } from "../helpers";
import type {
  ChatMessage,
  ConversationHistoryResponse,
  StreamEvent,
} from "../types";

const CHAT_API_BASE = process.env.CHAT_API_URL?.replace("/v1/query", "") ?? "/api/chat";

interface UseMessagesResult {
  messages: ChatMessage[];
  conversationId: string | undefined;
  isStreaming: boolean;
  isLoading: boolean;
  error: string | undefined;
  sendMessage: (message: string) => Promise<void>;
  startNewConversation: () => void;
  loadConversation: (convId: string) => Promise<void>;
  resetError: () => void;
}

export const useMessages = (): UseMessagesResult => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const loadConversation = useCallback(async (convId: string) => {
    setIsLoading(true);
    setError(undefined);
    setConversationId(convId);
    setMessages([]);

    try {
      const resp = await fetch(`${CHAT_API_BASE}/v1/conversations/${convId}`);
      if (!resp.ok) {
        throw new Error(`Failed to load conversation: ${resp.status}`);
      }

      const conv = (await resp.json()) as ConversationHistoryResponse;
      const msgs = conv.chat_history.flatMap(({ messages: historyMsgs, completed_at }) => {
        const timestamp = new Date(completed_at);
        return historyMsgs.map<ChatMessage>(({ content, type }) => ({
          id: generateId(),
          role: type === "assistant" ? "assistant" : "user",
          content,
          timestamp,
        }));
      });

      setMessages(msgs);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      setError(undefined);
      setIsStreaming(true);

      const timestamp = new Date();
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: message,
        timestamp,
      };

      // Add user message and placeholder for bot response
      setMessages((msgs) => [
        ...msgs,
        userMessage,
        {
          id: generateId(),
          role: "assistant",
          content: "",
          timestamp,
        },
      ]);

      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;

      try {
        const resp = await fetch(`${CHAT_API_BASE}/v1/streaming_query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: message,
            conversation_id: conversationId,
          }),
        });

        if (!resp.ok) {
          let errMsg = `Request failed: ${resp.status}`;
          try {
            const errData = await resp.json();
            if (errData.detail) {
              errMsg = typeof errData.detail === "string"
                ? errData.detail
                : errData.detail.response || errMsg;
            }
          } catch {
            // Use default error
          }
          throw new Error(errMsg);
        }

        reader = resp.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let newConvId = "";

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const lines = part.split("\n");
            let data = "";
            for (const line of lines) {
              if (line.startsWith("data:")) {
                data += line.slice(5).trim() + "\n";
              }
            }

            if (!data.trim()) continue;

            try {
              const ev = JSON.parse(data) as StreamEvent;

              if (ev.event === "start" && "data" in ev) {
                newConvId = (ev as { event: "start"; data: { conversation_id: string } }).data.conversation_id;
              } else if (ev.event === "token" && "data" in ev) {
                const token = (ev as { event: "token"; data: { token: string } }).data.token;
                setMessages((msgs) => {
                  const allButLast = msgs.slice(0, -1);
                  const lastMsg = msgs[msgs.length - 1];
                  return [
                    ...allButLast,
                    {
                      ...lastMsg,
                      content: lastMsg.content + token,
                    },
                  ];
                });
              }
            } catch {
              // Skip malformed events
            }
          }
        }

        if (newConvId) {
          setConversationId(newConvId);
        }
      } catch (e) {
        if (reader) {
          try {
            await reader.cancel();
          } catch {
            // Ignore cancel errors
          }
        }
        setError(getErrorMessage(e));
        // Remove the empty bot message on error
        setMessages((msgs) => {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.role === "assistant" && !lastMsg.content) {
            return msgs.slice(0, -1);
          }
          return msgs;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [conversationId],
  );

  const startNewConversation = useCallback(() => {
    setConversationId(undefined);
    setMessages([]);
    setError(undefined);
  }, []);

  const resetError = useCallback(() => {
    setError(undefined);
  }, []);

  return {
    messages,
    conversationId,
    isStreaming,
    isLoading,
    error,
    sendMessage,
    startNewConversation,
    loadConversation,
    resetError,
  };
};
