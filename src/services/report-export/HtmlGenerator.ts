/**
 * Generates HTML reports from inventory data
 */

import { ChartDataTransformer } from "./ChartDataTransformer";
import { DEFAULT_DOCUMENT_TITLE, EXPORT_CONFIG } from "./constants";
import { HtmlTemplateBuilder } from "./HtmlTemplateBuilder";
import type { InventoryData, SnapshotLike } from "./types";

export interface HtmlGeneratorOptions {
  documentTitle?: string;
  filename?: string;
}

export class HtmlGenerator {
  private chartTransformer = new ChartDataTransformer();
  private templateBuilder = new HtmlTemplateBuilder();

  /**
   * Generate and download an HTML report
   */
  async generate(
    inventory: InventoryData | SnapshotLike,
    options: HtmlGeneratorOptions = {},
  ): Promise<void> {
    if (!inventory) {
      throw new Error("No inventory data available for export");
    }

    const chartData = this.chartTransformer.transform(inventory);
    const title = options.documentTitle || DEFAULT_DOCUMENT_TITLE;
    const htmlContent = this.templateBuilder.build(
      chartData,
      inventory,
      new Date(),
      title,
    );
    const filename = options.filename || EXPORT_CONFIG.HTML_FILENAME;

    await this.downloadHtml(htmlContent, filename);
  }

  /**
   * Download HTML content as a file
   */
  private downloadHtml(content: string, filename: string): Promise<void> {
    const blob = new Blob([content], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    return new Promise<void>((resolve) =>
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
        resolve();
      }, 250),
    );
  }
}
