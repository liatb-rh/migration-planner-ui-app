import "@testing-library/jest-dom";

import { Button } from "@patternfly/react-core";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ContactForm } from "../ContactForm";

describe("ContactForm", () => {
  it("renders all form fields", () => {
    const mockOnSubmit = vi.fn();
    const { getByRole } = render(
      <ContactForm id="contact-form" onSubmit={mockOnSubmit} />,
    );

    expect(
      getByRole("textbox", { name: /Your company name/i }),
    ).toBeInTheDocument();
    expect(
      getByRole("textbox", { name: /Primary contact name/i }),
    ).toBeInTheDocument();
    expect(
      getByRole("textbox", { name: /Contact phone/i }),
    ).toBeInTheDocument();
    expect(getByRole("textbox", { name: /Email/i })).toBeInTheDocument();
    expect(getByRole("textbox", { name: /Location/i })).toBeInTheDocument();
  });

  it("submits the form with correct values", async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    const { getByRole } = render(
      <>
        <ContactForm id="contact-form" onSubmit={mockOnSubmit} />
        <Button variant="primary" type="submit" form="contact-form">
          Contact
        </Button>
      </>,
    );

    const name = getByRole("textbox", { name: /Your company name/i });
    await user.clear(name);
    await user.type(name, "Acme Corporation");

    const contactName = getByRole("textbox", {
      name: /Primary contact name/i,
    });
    await user.clear(contactName);
    await user.type(contactName, "John Doe");

    const phone = getByRole("textbox", { name: /Contact phone/i });
    await user.clear(phone);
    await user.type(phone, "+1-555-0123");

    const email = getByRole("textbox", { name: /Email/i });
    await user.clear(email);
    await user.type(email, "john.doe@acme.com");

    const location = getByRole("textbox", { name: /Location/i });
    await user.clear(location);
    await user.type(location, "Paris");

    const contactButton = getByRole("button", { name: /Contact/i });
    await user.click(contactButton);

    await waitFor(() => {
      expect(mockOnSubmit.mock.calls.length).toBe(1);
      expect(mockOnSubmit.mock.calls[0][0]).toEqual({
        name: "Acme Corporation",
        contactName: "John Doe",
        contactPhone: "+1-555-0123",
        email: "john.doe@acme.com",
        location: "Paris",
      });
    });
  });

  it("displays error messages for required fields on submit", async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    const { getByRole, getByText } = render(
      <>
        <ContactForm id="contact-form" onSubmit={mockOnSubmit} />
        <Button variant="primary" type="submit" form="contact-form">
          Contact
        </Button>
      </>,
    );

    const contactButton = getByRole("button", { name: /Contact/i });
    await user.click(contactButton);

    // Form should not be submitted
    expect(mockOnSubmit).not.toHaveBeenCalled();

    // Error messages should appear
    expect(getByText("Your company name is required")).toBeInTheDocument();
    expect(getByText("Primary contact name is required")).toBeInTheDocument();
    expect(getByText("Email is required")).toBeInTheDocument();
  });

  it("validates email format", async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    const { getByRole, getByText } = render(
      <>
        <ContactForm id="contact-form" onSubmit={mockOnSubmit} />
        <Button variant="primary" type="submit" form="contact-form">
          Contact
        </Button>
      </>,
    );

    const email = getByRole("textbox", { name: /Email/i });
    await user.type(email, "invalid-email");

    const contactButton = getByRole("button", { name: /Contact/i });
    await user.click(contactButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(getByText("Please enter a valid email address")).toBeInTheDocument();
  });

  it("clears error when user starts typing", async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    const { getByRole, getByText, queryByText } = render(
      <>
        <ContactForm id="contact-form" onSubmit={mockOnSubmit} />
        <Button variant="primary" type="submit" form="contact-form">
          Contact
        </Button>
      </>,
    );

    const contactButton = getByRole("button", { name: /Contact/i });
    await user.click(contactButton);

    // Error should appear
    expect(getByText("Your company name is required")).toBeInTheDocument();

    // Type in the field
    const name = getByRole("textbox", { name: /Your company name/i });
    await user.type(name, "A");

    // Error should disappear
    await waitFor(() => {
      expect(
        queryByText("Your company name is required"),
      ).not.toBeInTheDocument();
    });
  });

  it("updates form fields when typing", async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    const { getByRole } = render(
      <ContactForm id="contact-form" onSubmit={mockOnSubmit} />,
    );

    const name = getByRole("textbox", { name: /Your company name/i });
    await user.type(name, "Test Company");

    expect(name).toHaveValue("Test Company");
  });

  it("displays error on blur for empty required field", async () => {
    const mockOnSubmit = vi.fn();
    const user = userEvent.setup();
    const { getByRole, getByText } = render(
      <ContactForm id="contact-form" onSubmit={mockOnSubmit} />,
    );

    const name = getByRole("textbox", { name: /Your company name/i });

    // Focus and then blur without entering anything
    await user.click(name);
    await user.tab();

    await waitFor(() => {
      expect(getByText("Your company name is required")).toBeInTheDocument();
    });
  });
});
