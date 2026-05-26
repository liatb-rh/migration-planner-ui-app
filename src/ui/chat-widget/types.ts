export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface QueryRequest {
  query: string;
  conversation_id?: string;
  model?: string;
  no_tools?: boolean;
}

export interface QueryResponse {
  response: string;
  conversation_id: string;
  input_tokens?: number;
  output_tokens?: number;
  truncated?: boolean;
  tool_calls?: Array<{
    tool_name: string;
    arguments: Record<string, unknown>;
    result: Record<string, unknown>;
  }>;
}

export interface ChatApiError {
  detail?: string;
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

export interface ConversationListResponse {
  conversations: Array<{
    conversation_id: string;
    created_at: string;
  }>;
}

export interface ConversationHistoryResponse {
  chat_history: Array<{
    messages: Array<{
      content: string;
      type: "user" | "assistant";
    }>;
    completed_at: string;
  }>;
}

export interface DeleteConversationResponse {
  success: boolean;
  response: string;
}

export type StartStreamEvent = {
  event: "start";
  data: { conversation_id: string };
};

export type EndStreamEvent = {
  event: "end";
};

export type InferenceStreamEvent = {
  event: "token";
  data: { token: string };
};

export type ToolArgStreamEvent = {
  event: "tool_call";
  data: {
    id: number;
    token: { tool_name: string; arguments: Record<string, unknown> };
  };
};

export type ToolResponseStreamEvent = {
  event: "tool_result";
  data: {
    id: number;
    token: { tool_name: string; response: string };
  };
};

export type StreamEvent =
  | StartStreamEvent
  | EndStreamEvent
  | InferenceStreamEvent
  | ToolArgStreamEvent
  | ToolResponseStreamEvent;

// Type guards
export const isStartStreamEvent = (ev: StreamEvent): ev is StartStreamEvent =>
  ev.event === "start";

export const isEndStreamEvent = (ev: StreamEvent): ev is EndStreamEvent =>
  ev.event === "end";

export const isInferenceStreamEvent = (
  ev: StreamEvent,
): ev is InferenceStreamEvent => ev.event === "token";

export const isToolArgStreamEvent = (
  ev: StreamEvent,
): ev is ToolArgStreamEvent => ev.event === "tool_call";

export const isToolResponseStreamEvent = (
  ev: StreamEvent,
): ev is ToolResponseStreamEvent => ev.event === "tool_result";
