/**
 * Constants for report export functionality
 */

export const DEFAULT_DOCUMENT_TITLE = "VMware Infrastructure Assessment Report";

export const EXPORT_CONFIG = {
  PDF_FILENAME: "Dashboard_Report.pdf",
  HTML_FILENAME: "VMware_Infrastructure_Assessment_Comprehensive.html",
  CANVAS_TIMEOUT: 500,
  HIDDEN_CONTAINER_WIDTH: 1600,
  HIDDEN_CONTAINER_HEIGHT: 1200,
  PDF_MARGIN: 10,
} as const;

export const CHART_COLORS = {
  PRIMARY: "#3498db",
  SUCCESS: "#27ae60",
  DANGER: "#e74c3c",
  WARNING: "#f39c12",
  INFO: "#9b59b6",
  SECONDARY: "#1abc9c",
  DARK: "#34495e",
  ORANGE: "#e67e22",
} as const;

export const TOC_ITEMS = [
  "- VM migration status",
  "- Operating system distribution",
  "- CPU & memory (VM distribution by CPU & memory size tier)",
  "- CPU & memory (VM distribution by vCPU count tier)",
  "- Disks (VM count by disk size tier)",
  "- Disks (Total disk size by tier)",
  "- Disks (VM count by disk type)",
  "- Clusters (VM distribution by cluster)",
  "- Clusters (Cluster distribution by data center)",
  "- Clusters (Cluster CPU over commitment)",
  "- Host distribution by model",
  "- Networks (VM distribution by network)",
  "- Networks (VM distribution by NIC count)",
  "- Migration warnings",
  "- Errors",
] as const;
