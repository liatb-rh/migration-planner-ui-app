import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ReportExportService,
  SnapshotLike,
} from "../../../services/report-export";
import { EnhancedDownloadButton } from "./EnhancedDownloadButton";

vi.mock("@patternfly/react-core", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@patternfly/react-core")>();

  return {
    ...actual,
    Dropdown: ({
      children,
      toggle,
    }: {
      children?: React.ReactNode;
      toggle?: React.ReactNode | ((ref: React.Ref<unknown>) => React.ReactNode);
    }) => (
      <div>
        {typeof toggle === "function" ? toggle(null) : toggle}
        {children}
      </div>
    ),
  };
});

// Mock the useInjection hook
const mockExportPdf = vi.fn().mockResolvedValue({ success: true });
const mockExportHtml = vi.fn().mockResolvedValue({ success: true });
const mockReportExportService: ReportExportService = {
  exportPdf: mockExportPdf,
  exportHtml: mockExportHtml,
} as unknown as ReportExportService;

vi.mock("@migration-planner-ui/ioc", () => ({
  useInjection: vi.fn(() => mockReportExportService),
}));

describe("EnhancedDownloadButton", () => {
  const baseProps = {
    elementId: "test-report",
    componentToRender: <div>Test Component</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockExportPdf.mockReset().mockResolvedValue({ success: true });
    mockExportHtml.mockReset().mockResolvedValue({ success: true });
  });

  describe("HTML export option availability", () => {
    it("enables HTML export when isAggregateView is true", () => {
      render(<EnhancedDownloadButton {...baseProps} isAggregateView={true} />);

      const toggle = screen.getByRole("button", { name: /export report/i });
      act(() => {
        fireEvent.click(toggle);
      });

      const htmlOption = screen.getByRole("menuitem", { name: /html/i });
      expect(htmlOption).not.toHaveAttribute("aria-disabled", "true");
    });

    it("enables HTML export by default when isAggregateView is not provided", () => {
      render(<EnhancedDownloadButton {...baseProps} />);

      const toggle = screen.getByRole("button", { name: /export report/i });
      act(() => {
        fireEvent.click(toggle);
      });

      const htmlOption = screen.getByRole("menuitem", { name: /html/i });
      expect(htmlOption).not.toHaveAttribute("aria-disabled", "true");
    });

    it("does not render HTML option for non-aggregate view", () => {
      render(<EnhancedDownloadButton {...baseProps} isAggregateView={false} />);

      expect(
        screen.queryByRole("menuitem", { name: /html/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /export report/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /export to pdf/i }),
      ).toBeInTheDocument();
    });
  });

  describe("PDF export option availability", () => {
    it("shows Export to PDF button for non-aggregate view", () => {
      render(<EnhancedDownloadButton {...baseProps} isAggregateView={false} />);

      const button = screen.getByRole("button", { name: /export to pdf/i });
      expect(button).toBeEnabled();
    });

    it("shows PDF export option when isAggregateView is true", () => {
      render(<EnhancedDownloadButton {...baseProps} isAggregateView={true} />);

      const toggle = screen.getByRole("button", { name: /export report/i });
      act(() => {
        fireEvent.click(toggle);
      });

      const pdfOption = screen.getByRole("menuitem", { name: /pdf/i });
      expect(pdfOption).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Export functionality", () => {
    it("calls exportPdf when PDF option is clicked", async () => {
      render(<EnhancedDownloadButton {...baseProps} />);

      const toggle = screen.getByRole("button", { name: /export report/i });
      act(() => {
        fireEvent.click(toggle);
      });

      const pdfOption = screen.getByRole("menuitem", { name: /pdf/i });
      act(() => {
        fireEvent.click(pdfOption);
      });

      await waitFor(() => {
        expect(mockExportPdf).toHaveBeenCalledTimes(1);
        expect(mockExportPdf).toHaveBeenCalledWith(
          baseProps.componentToRender,
          { documentTitle: undefined },
        );
      });
    });

    it("calls exportPdf when Export to PDF button is clicked", async () => {
      render(<EnhancedDownloadButton {...baseProps} isAggregateView={false} />);

      const button = screen.getByRole("button", { name: /export to pdf/i });
      act(() => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(mockExportPdf).toHaveBeenCalledTimes(1);
      });
    });

    it("calls exportHtml when HTML option is clicked and enabled", async () => {
      const mockSnapshot = {
        inventory: {
          infra: { totalHosts: 1 },
          vms: { total: 1 },
        },
      };
      render(
        <EnhancedDownloadButton
          {...baseProps}
          snapshot={mockSnapshot as SnapshotLike}
          isAggregateView={true}
        />,
      );

      const toggle = screen.getByRole("button", { name: /export report/i });
      act(() => {
        fireEvent.click(toggle);
      });

      const htmlOption = screen.getByRole("menuitem", { name: /html/i });
      act(() => {
        fireEvent.click(htmlOption);
      });

      await waitFor(() => {
        expect(mockExportHtml).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Loading states", () => {
    it("shows loading state when PDF is being generated in dropdown", async () => {
      mockExportPdf.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<EnhancedDownloadButton {...baseProps} />);

      const toggle = screen.getByRole("button", { name: /export report/i });
      act(() => {
        fireEvent.click(toggle);
      });

      const pdfOption = screen.getByRole("menuitem", { name: /pdf/i });
      act(() => {
        fireEvent.click(pdfOption);
      });

      await waitFor(() => {
        expect(screen.getByText(/generating pdf/i)).toBeInTheDocument();
      });
    });

    it("shows loading state when PDF is being generated in button mode", async () => {
      mockExportPdf.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<EnhancedDownloadButton {...baseProps} isAggregateView={false} />);

      const button = screen.getByRole("button", { name: /export to pdf/i });
      act(() => {
        fireEvent.click(button);
      });

      await waitFor(() => {
        expect(screen.getByText(/generating pdf/i)).toBeInTheDocument();
      });
    });

    it("shows loading state when HTML is being generated", async () => {
      const mockSnapshot = {
        inventory: {
          infra: { totalHosts: 1 },
          vms: { total: 1 },
        },
      };
      mockExportHtml.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <EnhancedDownloadButton
          {...baseProps}
          snapshot={mockSnapshot as SnapshotLike}
          isAggregateView={true}
        />,
      );

      const toggle = screen.getByRole("button", { name: /export report/i });
      act(() => {
        fireEvent.click(toggle);
      });

      const htmlOption = screen.getByRole("menuitem", { name: /html/i });
      act(() => {
        fireEvent.click(htmlOption);
      });

      await waitFor(() => {
        expect(screen.getByText(/generating html/i)).toBeInTheDocument();
      });
    });
  });
});
