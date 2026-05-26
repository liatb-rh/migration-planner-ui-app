import {
  ChatbotConversationHistoryNav,
  ChatbotDisplayMode,
} from "@patternfly/chatbot";
import type { Conversation } from "@patternfly/chatbot/dist/esm/ChatbotConversationHistoryNav";
import { Alert, MenuItemAction } from "@patternfly/react-core";
import { TrashAltIcon } from "@patternfly/react-icons";
import React, { useCallback, useEffect, useState } from "react";

import { getErrorMessage } from "../helpers";
import type { ConversationListResponse } from "../types";
import { DeleteConversationModal } from "./DeleteConversationModal";

const CHAT_API_BASE =
  process.env.CHAT_API_URL?.replace("/v1/query", "") ?? "/api/chat";

interface ChatBotHistoryProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  startNewConversation: (closeDrawer?: boolean) => void;
  loadConversation: (id: string) => Promise<void>;
  conversationId?: string;
  children: React.ReactNode;
}

export const ChatBotHistory: React.FC<ChatBotHistoryProps> = ({
  isOpen,
  setIsOpen,
  children,
  conversationId,
  startNewConversation,
  loadConversation,
}) => {
  const [deleteConversation, setDeleteConversation] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<string>();

  const fetchConversations = useCallback(async (signal?: AbortSignal) => {
    const resp = await fetch(`${CHAT_API_BASE}/v1/conversations`, { signal });
    if (!resp.ok) {
      throw new Error(`Failed to load conversations: ${resp.status}`);
    }
    const data = (await resp.json()) as ConversationListResponse;
    setConversations(
      data.conversations
        .sort(
          (a, b) =>
            Date.parse(b.created_at) - Date.parse(a.created_at),
        )
        .map(({ conversation_id, created_at }) => ({
          id: conversation_id,
          text: new Date(created_at).toLocaleString(),
        })),
    );
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const abortController = new AbortController();
    setIsLoading(true);
    setError(undefined);
    void (async () => {
      try {
        await fetchConversations(abortController.signal);
      } catch (e) {
        if (abortController.signal.aborted) return;
        setError(getErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    })();

    return () => abortController.abort();
  }, [isOpen, fetchConversations]);

  const handleDeleteConversation = useCallback(async () => {
    if (!deleteConversation) return;

    const resp = await fetch(
      `${CHAT_API_BASE}/v1/conversations/${deleteConversation}`,
      { method: "DELETE" },
    );

    if (!resp.ok) {
      let errMsg = `Delete failed: ${resp.status}`;
      try {
        const errData = await resp.json();
        if (errData.detail?.cause) {
          errMsg = errData.detail.cause;
        }
      } catch {
        // Use default error
      }
      throw new Error(errMsg);
    }

    const result = await resp.json();
    if (!result.success) {
      throw new Error(result.response);
    }

    // If current conversation was deleted, start new one
    if (deleteConversation === conversationId) {
      startNewConversation(false);
    }

    await fetchConversations();
  }, [deleteConversation, conversationId, startNewConversation, fetchConversations]);

  return (
    <>
      <ChatbotConversationHistoryNav
        displayMode={ChatbotDisplayMode.embedded}
        onDrawerToggle={() => setIsOpen(!isOpen)}
        isLoading={isLoading}
        conversations={conversations.map<Conversation>((c) => ({
          ...c,
          additionalProps: {
            actions: (
              <MenuItemAction
                icon={<TrashAltIcon />}
                actionId="delete"
                onClick={() => setDeleteConversation(c.id)}
                aria-label={`Delete conversation from ${c.text}`}
              />
            ),
          },
        }))}
        onNewChat={() => {
          startNewConversation(true);
          setIsOpen(false);
        }}
        onSelectActiveItem={(_, itemId) => {
          if (itemId !== undefined) {
            void loadConversation(`${itemId}`);
          }
          setIsOpen(false);
        }}
        activeItemId={conversationId}
        errorState={
          error
            ? {
                bodyText: (
                  <Alert variant="danger" isInline title="Error">
                    xxxxx
                  </Alert>
                ),
              }
            : undefined
        }
        emptyState={
          !isLoading && !conversations.length
            ? { bodyText: "No conversation history" }
            : undefined
        }
      >
        {children}
      </ChatbotConversationHistoryNav>
      {deleteConversation && (
        <DeleteConversationModal
          conversation={
            conversations.find(({ id }) => id === deleteConversation) as Conversation
          }
          onClose={() => setDeleteConversation(undefined)}
          onDelete={handleDeleteConversation}
        />
      )}
    </>
  );
};
