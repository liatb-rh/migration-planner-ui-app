/**
 * Generates PDF reports from React components
 */

import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";

import { EXPORT_CONFIG, TOC_ITEMS } from "./constants";

/**
 * Expected number of custom segments for the PDF report layout.
 * The report is divided into 3 segments (one per page after the cover):
 *  - Segment 1: Blocks 1 & 2 combined (summary charts)
 *  - Segment 2: Block 3 (migration recommendations)
 *  - Segment 3: Block 4 (detailed analysis)
 */
const EXPECTED_CUSTOM_SEGMENTS = 3;

export interface PdfGeneratorOptions {
  documentTitle?: string;
}

interface BlockBoundary {
  top: number;
  bottom: number;
  height: number;
}

interface Segment {
  top: number;
  height: number;
}

export class PdfGenerator {
  private hiddenContainer: HTMLDivElement | null = null;
  private root: Root | null = null;
  private tempDiv: HTMLDivElement | null = null;

  /**
   * Generate a PDF from a React component
   */
  async generate(
    componentToRender: React.ReactNode,
    options: PdfGeneratorOptions = {},
  ): Promise<void> {
    try {
      this.createHiddenContainer();
      await this.renderComponent(componentToRender);
      this.injectPrintStyles();

      const blockBoundaries = this.collectBlockBoundaries();
      const canvas = await this.captureCanvas();

      const pdf = this.buildPdf(canvas, blockBoundaries, options.documentTitle);
      this.downloadPdf(pdf, options.documentTitle);
    } finally {
      this.cleanup();
    }
  }

  private createHiddenContainer(): void {
    // Create container if it doesn't exist in the DOM
    this.hiddenContainer = document.createElement("div");
    this.hiddenContainer.id = "pdf-hidden-container";
    this.hiddenContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${EXPORT_CONFIG.HIDDEN_CONTAINER_WIDTH}px;
      min-height: ${EXPORT_CONFIG.HIDDEN_CONTAINER_HEIGHT}px;
      padding: 2rem;
      background-color: white;
      z-index: -1;
    `;
    document.body.appendChild(this.hiddenContainer);
  }

  private async renderComponent(component: React.ReactNode): Promise<void> {
    if (!this.hiddenContainer) {
      throw new Error("Hidden container not found");
    }

    this.tempDiv = document.createElement("div");
    this.tempDiv.id = "hidden-container";
    this.hiddenContainer.appendChild(this.tempDiv);

    this.root = createRoot(this.tempDiv);
    this.root.render(component);

    // Wait for rendering to complete deterministically
    await this.waitForRenderComplete();
  }

  /**
   * Wait for render to complete by ensuring:
   * 1. Two animation frames have passed (browser has painted the new tree)
   * 2. All webfonts are loaded
   * 3. All images in the container have finished loading
   */
  private async waitForRenderComplete(): Promise<void> {
    // Wait for two animation frames to ensure browser has painted
    await this.waitForAnimationFrames(2);

    // Wait for webfonts to be ready
    await document.fonts.ready;

    // Wait for all images to load
    await this.waitForImages();
  }

  /**
   * Wait for a specified number of animation frames
   */
  private waitForAnimationFrames(count: number): Promise<void> {
    return new Promise((resolve) => {
      let remaining = count;
      const tick = (): void => {
        remaining--;
        if (remaining <= 0) {
          resolve();
        } else {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    });
  }

  /**
   * Wait for all images in the tempDiv to finish loading
   */
  private async waitForImages(): Promise<void> {
    if (!this.tempDiv) return;

    const images = Array.from(this.tempDiv.querySelectorAll("img"));
    if (images.length === 0) return;

    const imagePromises = images.map((img) => {
      // If image is already complete, resolve immediately
      if (img.complete) {
        return Promise.resolve();
      }

      // Otherwise wait for load or error event
      return new Promise<void>((resolve) => {
        const handleLoad = (): void => {
          img.removeEventListener("load", handleLoad);
          img.removeEventListener("error", handleError);
          resolve();
        };
        const handleError = (): void => {
          img.removeEventListener("load", handleLoad);
          img.removeEventListener("error", handleError);
          // Resolve even on error to not block PDF generation
          resolve();
        };

        img.addEventListener("load", handleLoad);
        img.addEventListener("error", handleError);
      });
    });

    await Promise.all(imagePromises);
  }

  private injectPrintStyles(): void {
    if (!this.hiddenContainer) return;

    const style = document.createElement("style");
    style.textContent = `
      #hidden-container .dashboard-card-print,
      #hidden-container .dashboard-card,
      #hidden-container .pf-v6-c-card,
      #hidden-container [data-export-block] {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        margin-top: 80px !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
    `;
    this.hiddenContainer.appendChild(style);
  }

  private collectBlockBoundaries(): BlockBoundary[] {
    if (!this.hiddenContainer) return [];

    const containerRect = this.hiddenContainer.getBoundingClientRect();

    return Array.from(
      this.hiddenContainer.querySelectorAll<HTMLElement>(
        ".dashboard-card-print, .pf-v6-c-card",
      ),
    )
      .map((el) => {
        const r = el.getBoundingClientRect();
        const top = Math.max(0, r.top - containerRect.top);
        const bottom = Math.max(top, r.bottom - containerRect.top);
        const height = bottom - top;
        return { top, bottom, height };
      })
      .filter((b) => b.height > 4) // Ignore trivial blocks
      .sort((a, b) => a.top - b.top);
  }

  private async captureCanvas(): Promise<HTMLCanvasElement> {
    if (!this.hiddenContainer) {
      throw new Error("Hidden container not found");
    }
    return html2canvas(this.hiddenContainer, { useCORS: true });
  }

  private buildPdf(
    canvas: HTMLCanvasElement,
    domBlocks: BlockBoundary[],
    documentTitle?: string,
  ): jsPDF {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = EXPORT_CONFIG.PDF_MARGIN;

    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Build cover page with TOC
    this.buildCoverPage(pdf, pageWidth, pageHeight, margin, documentTitle);
    pdf.addPage();

    // Calculate scaling
    const scaleFactor = contentWidth / imgWidth;
    const pageHeightPx = contentHeight / scaleFactor;
    const domToCanvasScale =
      imgWidth / Math.max(1, this.hiddenContainer?.clientWidth || 1);

    const blocksPx = domBlocks.map((b) => ({
      top: b.top * domToCanvasScale,
      bottom: b.bottom * domToCanvasScale,
      height: b.height * domToCanvasScale,
    }));

    const BLEED_GUARD_PX = Math.max(0, Math.round(6 * domToCanvasScale));

    // Try custom segmentation based on data-export-block attributes
    const customSegments = this.buildCustomSegments(
      imgHeight,
      domToCanvasScale,
    );

    if (customSegments && customSegments.length === EXPECTED_CUSTOM_SEGMENTS) {
      this.renderCustomSegments(
        pdf,
        canvas,
        customSegments,
        imgWidth,
        imgHeight,
        contentWidth,
        contentHeight,
        margin,
      );
    } else {
      const sliceHeights = this.calculateSliceHeights(
        blocksPx,
        imgHeight,
        pageHeightPx,
        BLEED_GUARD_PX,
      );
      this.renderSlices(
        pdf,
        canvas,
        sliceHeights,
        imgWidth,
        imgHeight,
        contentWidth,
        contentHeight,
        margin,
      );
    }

    // Add page numbers
    this.addPageNumbers(pdf, pageWidth, pageHeight);

    return pdf;
  }

  private buildCoverPage(
    pdf: jsPDF,
    pageWidth: number,
    pageHeight: number,
    margin: number,
    documentTitle?: string,
  ): void {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    pdf.setFontSize(18);
    const headerTitle =
      documentTitle && documentTitle.trim().length > 0
        ? documentTitle
        : "VMware Infrastructure Assessment Report";
    pdf.text(headerTitle, pageWidth / 2, margin + 8, { align: "center" });

    pdf.setFontSize(11);
    const d = new Date();
    pdf.text(
      `Generated: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`,
      pageWidth / 2,
      margin + 18,
      { align: "center" },
    );

    pdf.setFontSize(14);
    pdf.text("Table of contents", margin, margin + 32);

    pdf.setFontSize(11);
    let tocY = margin + 42;
    TOC_ITEMS.forEach((line) => {
      if (tocY > pageHeight - margin - 10) {
        pdf.addPage();
        tocY = margin;
      }
      pdf.text(line, margin, tocY);
      tocY += 7;
    });
  }

  private buildCustomSegments(
    imgHeight: number,
    domToCanvasScale: number,
  ): Segment[] | null {
    if (!this.hiddenContainer) return null;

    const containerRect = this.hiddenContainer.getBoundingClientRect();
    const SEGMENT_PADDING_PX = 12 * domToCanvasScale;

    const getBlockByIndex = (
      idx: number,
    ): { top: number; bottom: number } | null => {
      const el = this.hiddenContainer?.querySelector<HTMLElement>(
        `[data-export-block="${idx}"]`,
      );
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const top = Math.max(0, r.top - containerRect.top) * domToCanvasScale;
      const bottom =
        Math.max(top, r.bottom - containerRect.top) * domToCanvasScale;
      return { top, bottom };
    };

    const b1 = getBlockByIndex(1);
    const b2 = getBlockByIndex(2);
    const b3 = getBlockByIndex(3);
    const b4 = getBlockByIndex(4);

    if (!b1 || !b2 || !b3 || !b4) return null;

    const firstTop = Math.max(0, Math.min(b1.top, b2.top) - SEGMENT_PADDING_PX);
    const firstBottom = Math.min(
      imgHeight,
      Math.max(b1.bottom, b2.bottom) + SEGMENT_PADDING_PX,
    );

    return [
      {
        top: firstTop,
        height: Math.max(1, firstBottom - firstTop),
      },
      {
        top: Math.max(0, b3.top - SEGMENT_PADDING_PX),
        height: Math.max(
          1,
          Math.min(imgHeight, b3.bottom + SEGMENT_PADDING_PX) -
            Math.max(0, b3.top - SEGMENT_PADDING_PX),
        ),
      },
      {
        top: Math.max(0, b4.top - SEGMENT_PADDING_PX),
        height: Math.max(
          1,
          Math.min(imgHeight, b4.bottom + SEGMENT_PADDING_PX) -
            Math.max(0, b4.top - SEGMENT_PADDING_PX),
        ),
      },
    ];
  }

  private calculateSliceHeights(
    blocksPx: BlockBoundary[],
    imgHeight: number,
    pageHeightPx: number,
    bleedGuardPx: number,
  ): number[] {
    const sliceHeights: number[] = [];

    if (blocksPx.length === 0) {
      let remaining = imgHeight;
      while (remaining > 0) {
        const h = Math.min(pageHeightPx, remaining);
        sliceHeights.push(h);
        remaining -= h;
      }
      return sliceHeights;
    }

    let y = 0;
    const MIN_ADVANCE = 32;
    const MAX_LOOP_GUARD = 2000;
    let guard = 0;

    while (y < imgHeight && guard++ < MAX_LOOP_GUARD) {
      const target = y + pageHeightPx;

      const eligibleBottoms = blocksPx
        .filter(
          (b) => b.top <= target - MIN_ADVANCE && b.bottom >= y + MIN_ADVANCE,
        )
        .map((b) => Math.round(b.bottom))
        .sort((a, b) => a - b);

      let cut: number;
      if (eligibleBottoms.length > 0) {
        const lastBottom = eligibleBottoms[eligibleBottoms.length - 1];
        const guarded = Math.max(y + MIN_ADVANCE, lastBottom - bleedGuardPx);
        cut = Math.min(imgHeight, guarded);
      } else {
        cut = Math.min(
          imgHeight,
          Math.max(y + MIN_ADVANCE, Math.round(target)),
        );
      }

      const height = Math.max(1, cut - y);
      sliceHeights.push(height);
      y += height;
    }

    return sliceHeights;
  }

  private renderCustomSegments(
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    segments: Segment[],
    imgWidth: number,
    imgHeight: number,
    contentWidth: number,
    contentHeight: number,
    margin: number,
  ): void {
    for (let i = 0; i < segments.length; i++) {
      const { top, height } = segments[i];
      const sliceHeightPx = Math.max(1, Math.min(height, imgHeight - top));

      const pageCanvas = this.createSliceCanvas(
        canvas,
        imgWidth,
        sliceHeightPx,
        top,
      );

      this.addCanvasToPdf(
        pdf,
        pageCanvas,
        imgWidth,
        sliceHeightPx,
        contentWidth,
        contentHeight,
        margin,
      );

      if (i < segments.length - 1) {
        pdf.addPage();
      }
    }
  }

  private renderSlices(
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    sliceHeights: number[],
    imgWidth: number,
    imgHeight: number,
    contentWidth: number,
    contentHeight: number,
    margin: number,
  ): void {
    let consumedPx = 0;

    for (let pageIndex = 0; pageIndex < sliceHeights.length; pageIndex++) {
      const sliceHeightPx = sliceHeights[pageIndex];

      const pageCanvas = this.createSliceCanvas(
        canvas,
        imgWidth,
        sliceHeightPx,
        consumedPx,
      );

      this.addCanvasToPdf(
        pdf,
        pageCanvas,
        imgWidth,
        sliceHeightPx,
        contentWidth,
        contentHeight,
        margin,
      );

      consumedPx += sliceHeightPx;

      if (consumedPx < imgHeight) {
        pdf.addPage();
      }
    }
  }

  private createSliceCanvas(
    sourceCanvas: HTMLCanvasElement,
    width: number,
    height: number,
    offsetY: number,
  ): HTMLCanvasElement {
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = width;
    pageCanvas.height = height;

    const ctx = pageCanvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(sourceCanvas, 0, offsetY, width, height, 0, 0, width, height);

    return pageCanvas;
  }

  private addCanvasToPdf(
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    imgWidth: number,
    sliceHeightPx: number,
    contentWidth: number,
    contentHeight: number,
    margin: number,
  ): void {
    const imgData = canvas.toDataURL("image/png");
    const pageScale = Math.min(
      contentWidth / imgWidth,
      contentHeight / sliceHeightPx,
    );
    const renderWidthMm = imgWidth * pageScale;
    const renderHeightMm = sliceHeightPx * pageScale;

    pdf.addImage(
      imgData,
      "PNG",
      margin + (contentWidth - renderWidthMm) / 2,
      margin,
      renderWidthMm,
      renderHeightMm,
    );
  }

  private addPageNumbers(
    pdf: jsPDF,
    pageWidth: number,
    pageHeight: number,
  ): void {
    const pdfWithPages = pdf as jsPDF & {
      getNumberOfPages?: () => number;
      internal?: { pages?: unknown[] };
    };
    const totalPagesFromMethod = pdfWithPages.getNumberOfPages?.();
    const totalPages =
      typeof totalPagesFromMethod === "number"
        ? totalPagesFromMethod
        : Array.isArray(pdfWithPages.internal?.pages)
          ? pdfWithPages.internal.pages.length
          : 1;

    pdf.setFontSize(9);
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 6, {
        align: "center",
      });
    }
  }

  private downloadPdf(pdf: jsPDF, documentTitle?: string): void {
    const filename = documentTitle
      ? `${documentTitle.replace(/\.pdf$/i, "")}.pdf`
      : EXPORT_CONFIG.PDF_FILENAME;
    pdf.save(filename);
  }

  private cleanup(): void {
    try {
      this.root?.unmount();
      this.tempDiv?.parentNode?.removeChild(this.tempDiv);
      this.hiddenContainer?.parentNode?.removeChild(this.hiddenContainer);
    } catch {
      // Ignore cleanup errors
    }

    this.root = null;
    this.tempDiv = null;
    this.hiddenContainer = null;
  }
}
