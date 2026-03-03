import "@testing-library/jest-dom";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClusterSizingWizard } from "../ClusterSizingWizard";

// Mock the viewModel
const mockCalculate = vi.fn();
const mockReset = vi.fn();
const mockSetFormValues = vi.fn();
const mockCalculateEstimation = vi.fn();
const mockEnsureEstimationForMenu = vi.fn();

const mockViewModel = {
  formValues: {
    workerNodePreset: "custom" as const,
    customCpu: 32,
    customMemoryGb: 128,
    cpuOvercommitRatio: 6,
    memoryOvercommitRatio: 4,
    scheduleOnControlPlane: false,
  },
  setFormValues: mockSetFormValues,
  calculate: mockCalculate,
  isCalculating: false,
  sizerOutput: null,
  calculateError: null,
  migrationEstimation: null,
  isCalculatingEstimation: false,
  estimationError: null,
  calculateEstimation: mockCalculateEstimation,
  ensureEstimationForMenu: mockEnsureEstimationForMenu,
  reset: mockReset,
};

vi.mock("../../../view-models/useClusterSizingWizardViewModel", () => ({
  useClusterSizingWizardViewModel: vi.fn(() => mockViewModel),
}));

// Mock child components to simplify testing
vi.mock("../SizingInputForm", () => ({
  SizingInputForm: (): React.ReactElement => (
    <div data-testid="sizing-input-form">Migration Preferences Form</div>
  ),
}));

vi.mock("../SizingResult", () => ({
  SizingResult: (): React.ReactElement => (
    <div data-testid="sizing-result">Sizing Results</div>
  ),
}));

vi.mock("../TimeEstimationResult", () => ({
  TimeEstimationResult: ({
    isLoading,
  }: {
    isLoading: boolean;
  }): React.ReactElement => (
    <div data-testid="time-estimation-result">
      {isLoading ? "Loading..." : "Time Estimation Results"}
    </div>
  ),
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  clusterName: "test-cluster",
  clusterId: "cluster-1",
  assessmentId: "assessment-1",
};

describe("ClusterSizingWizard", () => {
  beforeEach(() => {
    mockCalculate.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockViewModel.isCalculatingEstimation = false;
    mockViewModel.migrationEstimation = null;
  });

  it("renders the modal with menu when open", () => {
    render(<ClusterSizingWizard {...defaultProps} />);

    expect(
      screen.getByText("test-cluster - Recommendation"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("OpenShift Cluster Architecture"),
    ).toBeInTheDocument();
    expect(screen.getByText("Migration Time Estimation")).toBeInTheDocument();
    expect(screen.getByText("Migration Complexity")).toBeInTheDocument();
    expect(screen.getByText("Migration Plan")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<ClusterSizingWizard {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByText("test-cluster - Recommendation"),
    ).not.toBeInTheDocument();
  });

  describe("navigation and calculation", () => {
    it("shows architecture section when tab is clicked", () => {
      render(<ClusterSizingWizard {...defaultProps} />);

      const architectureTab = screen.getByRole("tab", {
        name: /OpenShift Cluster Architecture/,
      });
      fireEvent.click(architectureTab);

      expect(screen.getByTestId("sizing-input-form")).toBeInTheDocument();
    });

    it("triggers calculation when clicking Generate recommendation button", async () => {
      render(<ClusterSizingWizard {...defaultProps} />);

      const architectureTab = screen.getByRole("tab", {
        name: /OpenShift Cluster Architecture/,
      });
      fireEvent.click(architectureTab);

      const generateButton = screen.getByRole("button", {
        name: /Generate recommendation/,
      });
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(mockCalculate).toHaveBeenCalledTimes(1);
      });
    });

    it("navigates to time estimation section when tab is clicked", async () => {
      mockViewModel.isCalculatingEstimation = true;
      render(<ClusterSizingWizard {...defaultProps} />);

      const timeEstimationTab = screen.getByRole("tab", {
        name: /Migration Time Estimation/,
      });
      fireEvent.click(timeEstimationTab);

      await waitFor(() => {
        expect(
          screen.getByTestId("time-estimation-result"),
        ).toBeInTheDocument();
      });
    });

    it("disables Migration Complexity tab", () => {
      render(<ClusterSizingWizard {...defaultProps} />);

      const complexityTab = screen.getByRole("tab", {
        name: /Migration Complexity/,
      });
      expect(complexityTab).toHaveAttribute("aria-disabled", "true");
      expect(complexityTab).toBeDisabled();
    });

    it("disables Migration Plan tab", () => {
      render(<ClusterSizingWizard {...defaultProps} />);

      const planTab = screen.getByRole("tab", {
        name: /Migration Plan/,
      });
      expect(planTab).toHaveAttribute("aria-disabled", "true");
      expect(planTab).toBeDisabled();
    });
  });
});
