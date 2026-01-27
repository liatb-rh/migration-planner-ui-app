import "./DownloadPDFStyles.css";

import { Button, Spinner } from "@patternfly/react-core";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React, { useRef, useState } from "react";
import { createRoot } from "react-dom/client";

interface DownloadPDFButtonProps {
  elementId: string;
  componentToRender: React.ReactNode;
}

const DownloadPDFButton: React.FC<DownloadPDFButtonProps> = ({
  elementId: _elementId,
  componentToRender,
}): JSX.Element => {
  const hiddenContainerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const handleDownloadPDF = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const originalWarn = console.warn;
      console.warn = (): void => {};

      const hiddenContainer = hiddenContainerRef.current;
      if (!hiddenContainer) return;
      hiddenContainer.innerHTML = "";

      const tempDiv = document.createElement("div");
      hiddenContainer.appendChild(tempDiv);
      const root = createRoot(tempDiv);
      root.render(componentToRender);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(hiddenContainer, { useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const scaleFactor = Math.min(
        contentWidth / imgWidth,
        contentHeight / imgHeight,
      );

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        margin,
        imgWidth * scaleFactor,
        imgHeight * scaleFactor,
      );
      pdf.save("Dashboard_Report.pdf");

      hiddenContainer.innerHTML = "";
      console.warn = originalWarn;
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          void handleDownloadPDF();
        }}
      >
        {isLoading ? (
          <>
            <Spinner size="sm" /> Generating PDF...
          </>
        ) : (
          "Export PDF"
        )}
      </Button>
      <div
        id="hidden-container"
        ref={hiddenContainerRef}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "1600px",
          minHeight: "1200px",
          padding: "2rem",
          backgroundColor: "white", // Para fondo claro
          zIndex: -1,
        }}
      />
    </>
  );
};

export default DownloadPDFButton;
