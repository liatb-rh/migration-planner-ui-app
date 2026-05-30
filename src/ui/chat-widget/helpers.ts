export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
};

export const generateId = (): string =>
  `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const botRole = "bot" as const;
export const userRole = "user" as const;
