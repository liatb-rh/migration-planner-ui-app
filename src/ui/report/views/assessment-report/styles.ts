import { css } from "@emotion/css";

// ---------------------------------------------------------------------------
// Shared base card properties (replaces global .pf-v6-c-card override)
// ---------------------------------------------------------------------------
const cardBase = `
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 10px !important;
`;

// ---------------------------------------------------------------------------
// Reusable dashboard card styles
// ---------------------------------------------------------------------------

/** Standard dashboard card with min/max height and shadow. */
export const dashboardCard = css`
  ${cardBase}
  border: 1px solid #d2d2d2 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 430px;
  max-height: 520px;
  justify-content: space-between;
`;

/** Lighter card variant used for infra-overview stat boxes. */
export const dashboardCardBorder = css`
  ${cardBase}
  border: 1px solid #d2d2d2 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

/** Clip wrapper that rounds inner card corners. */
export const dashboardCardClip = css`
  clip-path: inset(0 round 10px);
  background: #fff;
  height: 100%;
  width: 100%;
`;

/** Scrollable card body container. */
export const dashboardCardScroll = css`
  height: 100%;
  min-height: 300px;
  max-height: 500px;
  overflow: auto;
  display: flex;
  flex-direction: column;
`;

/** Row that stretches children to equal height. */
export const dashboardEqualHeightRow = css`
  display: flex;
  gap: var(--pf-global--gutter);
  align-items: stretch;
`;

/** Column child that stretches to fill row height. */
export const dashboardEqualHeight = css`
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  height: 100%;
`;

// ---------------------------------------------------------------------------
// StorageOverview-specific styles
// ---------------------------------------------------------------------------

export const storageCardOverflowHidden = css`
  overflow: hidden;
`;

export const storageCardOverflowVisible = css`
  overflow: visible;
`;

export const storageFlexFullWidth = css`
  width: 100%;
`;

export const storageMenuToggleMinWidth = css`
  min-width: 250px;
`;

export const storageNoDataContainer = css`
  padding: 20px;
  text-align: center;
`;

export const storageChartWrapper = css`
  display: flex;
  justify-content: center;
`;

export const storageTotalsNote = css`
  color: #6a6e73;
  margin-left: 20px;
`;

export const storageExportSectionMargin = css`
  margin-bottom: 24px;
`;

export const storageExportSectionTitle = css`
  font-weight: 600;
  margin-bottom: 8px;
`;
