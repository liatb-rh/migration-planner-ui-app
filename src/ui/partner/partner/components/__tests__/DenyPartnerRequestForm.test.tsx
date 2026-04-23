import "@testing-library/jest-dom";

import { Button } from "@patternfly/react-core";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DenyPartnerRequestForm } from "../DenyPartnerRequestForm";

describe("DenyPartnerRequestForm", () => {
  it("renders the form with a textarea", () => {
    const mockOnSubmit = vi.fn();
    const { getByRole } = render(
      <DenyPartnerRequestForm
        id="reject-request-form"
        onSubmit={mockOnSubmit}
      />,
    );

    expect(
      getByRole("textbox", { name: /Reason for rejection/i }),
    ).toBeInTheDocument();
  });

  it("submits the form with correct values", async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    const { getByRole } = render(
      <>
        <DenyPartnerRequestForm
          id="reject-request-form"
          onSubmit={mockOnSubmit}
        />
        <Button variant="danger" type="submit" form="reject-request-form">
          Deny
        </Button>
      </>,
    );

    const reason = getByRole("textbox", { name: /Reason for rejection/i });
    await user.type(reason, "The request does not meet our criteria");

    const rejectButton = getByRole("button", { name: /Deny/i });
    await user.click(rejectButton);

    await waitFor(() => {
      expect(mockOnSubmit.mock.calls.length).toBe(1);
      expect(mockOnSubmit.mock.calls[0][0]).toEqual({
        reason: "The request does not meet our criteria",
      });
    });
  });

  it("displays error message when submitting empty form", async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    const { getByRole, getByText } = render(
      <>
        <DenyPartnerRequestForm
          id="reject-request-form"
          onSubmit={mockOnSubmit}
        />
        <Button variant="danger" type="submit" form="reject-request-form">
          Deny
        </Button>
      </>,
    );

    const rejectButton = getByRole("button", { name: /Deny/i });
    await user.click(rejectButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(getByText("Reason is required")).toBeInTheDocument();
  });

  it("clears error when user starts typing", async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    const { getByRole, getByText, queryByText } = render(
      <>
        <DenyPartnerRequestForm
          id="reject-request-form"
          onSubmit={mockOnSubmit}
        />
        <Button variant="danger" type="submit" form="reject-request-form">
          Deny
        </Button>
      </>,
    );

    const rejectButton = getByRole("button", { name: /Deny/i });
    await user.click(rejectButton);

    expect(getByText("Reason is required")).toBeInTheDocument();

    const reason = getByRole("textbox", { name: /Reason for rejection/i });
    await user.type(reason, "Test");

    await waitFor(() => {
      expect(queryByText("Reason is required")).not.toBeInTheDocument();
    });
  });

  it("displays error on blur for empty required field", async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    const { getByRole, getByText } = render(
      <DenyPartnerRequestForm
        id="reject-request-form"
        onSubmit={mockOnSubmit}
      />,
    );

    const reason = getByRole("textbox", { name: /Reason for rejection/i });
    await user.click(reason);
    await user.tab();

    await waitFor(() => {
      expect(getByText("Reason is required")).toBeInTheDocument();
    });
  });

  it("updates form field when typing", async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    const { getByRole } = render(
      <DenyPartnerRequestForm
        id="reject-request-form"
        onSubmit={mockOnSubmit}
      />,
    );

    const reason = getByRole("textbox", { name: /Reason for rejection/i });
    await user.type(reason, "Test reason");

    expect(reason).toHaveValue("Test reason");
  });
});
