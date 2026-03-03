import { ResponseError } from "@openshift-migration-advisor/planner-sdk";
import { describe, expect, it } from "vitest";

import { parseApiError } from "../ErrorParser";

describe("parseApiError", () => {
  it("parses ResponseError with JSON message field", async () => {
    const mockResponse = {
      text: () =>
        Promise.resolve(JSON.stringify({ message: "Validation failed" })),
    } as Response;

    const responseError = new ResponseError(mockResponse);
    const result = await parseApiError(responseError);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Validation failed");
  });

  it("parses ResponseError with raw text response", async () => {
    const mockResponse = {
      text: () => Promise.resolve("Server error occurred"),
    } as Response;

    const responseError = new ResponseError(mockResponse);
    const result = await parseApiError(responseError);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Server error occurred");
  });

  it("uses ResponseError message when response.text() fails", async () => {
    const mockResponse = {
      text: () => Promise.reject(new Error("Cannot read response")),
    } as unknown as Response;

    const responseError = new ResponseError(mockResponse);
    responseError.message = "Network timeout";
    const result = await parseApiError(responseError);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Network timeout");
  });

  it("returns Error instance as-is when err is an Error", async () => {
    const originalError = new Error("Original error message");
    const result = await parseApiError(originalError);

    expect(result).toBe(originalError);
    expect(result.message).toBe("Original error message");
  });

  it("uses fallback message when err is unknown type", async () => {
    const result = await parseApiError("some string error");

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("An error occurred");
  });

  it("uses custom fallback message when provided", async () => {
    const result = await parseApiError(
      { unknown: "object" },
      "Custom fallback message",
    );

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Custom fallback message");
  });

  it("handles ResponseError with empty message field", async () => {
    const mockResponse = {
      text: () => Promise.resolve(JSON.stringify({ message: "" })),
    } as Response;

    const responseError = new ResponseError(mockResponse);
    responseError.message = "Response error fallback";
    const result = await parseApiError(responseError);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Response error fallback");
  });

  it("handles ResponseError with non-string message field", async () => {
    const mockResponse = {
      text: () => Promise.resolve(JSON.stringify({ message: 12345 })),
    } as Response;

    const responseError = new ResponseError(mockResponse);
    const result = await parseApiError(responseError);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain("12345");
  });

  it("handles ResponseError with malformed JSON", async () => {
    const mockResponse = {
      text: () => Promise.resolve("{invalid json}"),
    } as Response;

    const responseError = new ResponseError(mockResponse);
    const result = await parseApiError(responseError);

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("{invalid json}");
  });
});
