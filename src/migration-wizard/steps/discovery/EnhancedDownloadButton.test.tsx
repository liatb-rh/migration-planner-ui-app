import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { ReportExportService } from '../../../services/report-export';

import { EnhancedDownloadButton } from './EnhancedDownloadButton';

// Mock the useInjection hook
const mockReportExportService: ReportExportService = {
  exportPdf: vi.fn().mockResolvedValue({ success: true }),
  exportHtml: vi.fn().mockResolvedValue({ success: true }),
} as unknown as ReportExportService;

vi.mock('@migration-planner-ui/ioc', () => ({
  useInjection: vi.fn(() => mockReportExportService),
}));

describe('EnhancedDownloadButton', () => {
  const baseProps = {
    elementId: 'test-report',
    componentToRender: <div>Test Component</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HTML export option availability', () => {
    it('enables HTML export when isAggregateView is true', () => {
      render(<EnhancedDownloadButton {...baseProps} isAggregateView={true} />);

      const toggle = screen.getByRole('button', { name: /export report/i });
      fireEvent.click(toggle);

      const htmlOption = screen.getByRole('menuitem', { name: /html/i });
      expect(htmlOption).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('disables HTML export when isAggregateView is false', () => {
      render(<EnhancedDownloadButton {...baseProps} isAggregateView={false} />);

      const toggle = screen.getByRole('button', { name: /export report/i });
      fireEvent.click(toggle);

      const htmlOption = screen.getByRole('menuitem', { name: /html/i });
      expect(htmlOption).toBeDisabled();
    });

    it('enables HTML export by default when isAggregateView is not provided', () => {
      render(<EnhancedDownloadButton {...baseProps} />);

      const toggle = screen.getByRole('button', { name: /export report/i });
      fireEvent.click(toggle);

      const htmlOption = screen.getByRole('menuitem', { name: /html/i });
      expect(htmlOption).not.toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('PDF export option availability', () => {
    it('always enables PDF export regardless of isAggregateView', () => {
      render(<EnhancedDownloadButton {...baseProps} isAggregateView={false} />);

      const toggle = screen.getByRole('button', { name: /export report/i });
      fireEvent.click(toggle);

      const pdfOption = screen.getByRole('menuitem', { name: /pdf/i });
      expect(pdfOption).not.toHaveAttribute('aria-disabled', 'true');
    });

    it('enables PDF export when isAggregateView is true', () => {
      render(<EnhancedDownloadButton {...baseProps} isAggregateView={true} />);

      const toggle = screen.getByRole('button', { name: /export report/i });
      fireEvent.click(toggle);

      const pdfOption = screen.getByRole('menuitem', { name: /pdf/i });
      expect(pdfOption).not.toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Export functionality', () => {
    it('calls exportPdf when PDF option is clicked', async () => {
      render(<EnhancedDownloadButton {...baseProps} />);

      const toggle = screen.getByRole('button', { name: /export report/i });
      fireEvent.click(toggle);

      const pdfOption = screen.getByRole('menuitem', { name: /pdf/i });
      fireEvent.click(pdfOption);

      await waitFor(() => {
        expect(mockReportExportService.exportPdf).toHaveBeenCalledTimes(1);
        expect(mockReportExportService.exportPdf).toHaveBeenCalledWith(
          baseProps.componentToRender,
          { documentTitle: undefined },
        );
      });
    });

    it('calls exportHtml when HTML option is clicked and enabled', async () => {
      const mockSnapshot = {
        inventory: {
          infra: { totalHosts: 1 },
          vms: { total: 1 },
        },
      };
      render(
        <EnhancedDownloadButton
          {...baseProps}
          snapshot={mockSnapshot}
          isAggregateView={true}
        />,
      );

      const toggle = screen.getByRole('button', { name: /export report/i });
      fireEvent.click(toggle);

      const htmlOption = screen.getByRole('menuitem', { name: /html/i });
      fireEvent.click(htmlOption);

      await waitFor(() => {
        expect(mockReportExportService.exportHtml).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call exportHtml when HTML option is disabled', async () => {
      render(<EnhancedDownloadButton {...baseProps} isAggregateView={false} />);

      const toggle = screen.getByRole('button', { name: /export report/i });
      fireEvent.click(toggle);

      const htmlOption = screen.getByRole('menuitem', { name: /html/i });
      expect(htmlOption).toBeDisabled();

      // Try to click the disabled option - it should not trigger the action
      fireEvent.click(htmlOption);

      await waitFor(() => {
        expect(mockReportExportService.exportHtml).not.toHaveBeenCalled();
      });
    });
  });

  describe('Loading states', () => {
    it('shows loading state when PDF is being generated', async () => {
      mockReportExportService.exportPdf = vi
        .fn()
        .mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<EnhancedDownloadButton {...baseProps} />);

      const toggle = screen.getByRole('button', { name: /export report/i });
      fireEvent.click(toggle);

      const pdfOption = screen.getByRole('menuitem', { name: /pdf/i });
      fireEvent.click(pdfOption);

      await waitFor(() => {
        expect(screen.getByText(/generating pdf/i)).toBeInTheDocument();
      });
    });

    it('shows loading state when HTML is being generated', async () => {
      const mockSnapshot = {
        inventory: {
          infra: { totalHosts: 1 },
          vms: { total: 1 },
        },
      };
      mockReportExportService.exportHtml = vi
        .fn()
        .mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <EnhancedDownloadButton
          {...baseProps}
          snapshot={mockSnapshot}
          isAggregateView={true}
        />,
      );

      const toggle = screen.getByRole('button', { name: /export report/i });
      fireEvent.click(toggle);

      const htmlOption = screen.getByRole('menuitem', { name: /html/i });
      fireEvent.click(htmlOption);

      await waitFor(() => {
        expect(screen.getByText(/generating html/i)).toBeInTheDocument();
      });
    });
  });
});
