/**
 * Report Export Service
 *
 * Provides functionality to export reports in various formats (PDF, HTML).
 *
 * ## Dependency Injection
 *
 * The recommended way to use this service is via the DI container:
 *
 * ```typescript
 * import { useInjection } from '@migration-planner-ui/ioc';
 * import { ReportExportService } from '@/services/report-export';
 * import { Symbols } from '@/main/Symbols';
 *
 * // In a React component
 * const reportExportService = useInjection<ReportExportService>(Symbols.ReportExportService);
 *
 * // Export as PDF
 * await reportExportService.exportPdf(componentToRender, { documentTitle: 'My Report' });
 *
 * // Export as HTML
 * await reportExportService.exportHtml(inventoryData, { filename: 'report.html' });
 * ```
 *
 * ## Advanced Usage
 *
 * For testing or advanced scenarios, you can instantiate classes directly:
 *
 * ```typescript
 * import { ReportExportService, PdfGenerator, HtmlGenerator } from '@/services/report-export';
 *
 * const customService = new ReportExportService({
 *   pdfGenerator: new PdfGenerator(),
 *   htmlGenerator: new HtmlGenerator(),
 * });
 * ```
 */

// Main service
export {
  type ReportExportResult,
  ReportExportService,
  type ReportExportServiceDeps,
} from "./ReportExportService";

// Individual generators (for advanced use cases or testing)
export { HtmlGenerator } from "./HtmlGenerator";
export { PdfGenerator } from "./PdfGenerator";

// Data transformers (for advanced use cases or testing)
export { ChartDataTransformer } from "./ChartDataTransformer";
export { HtmlTemplateBuilder } from "./HtmlTemplateBuilder";

// Types
export type {
  ChartData,
  Datastore,
  ExportError,
  ExportOptions,
  HtmlExportOptions,
  InfraData,
  InventoryData,
  LoadingState,
  MigrationWarning,
  Network,
  OSInfo,
  PdfExportOptions,
  PowerStates,
  ResourceInfo,
  SnapshotLike,
  VMsData,
} from "./types";

// Constants
export { CHART_COLORS, EXPORT_CONFIG, TOC_ITEMS } from "./constants";
