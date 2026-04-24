import React from "react";

import { LoadingSpinner } from "../../core/components/LoadingSpinner";
import { useAssessmentsScreenViewModel } from "../view-models/useAssessmentsScreenViewModel";
import { AssessmentsPage } from "./AssessmentsPage";

export const AssessmentsScreen: React.FC = () => {
  const { assessments, isLoading, hasInitialLoad, rvtoolsOpenToken } =
    useAssessmentsScreenViewModel();

  // Show spinner if loading or if no initial load
  if (isLoading || !hasInitialLoad) {
    return <LoadingSpinner />;
  }

  // Always show assessment component
  return (
    <AssessmentsPage
      assessments={assessments}
      rvtoolsOpenToken={rvtoolsOpenToken}
    />
  );
};

AssessmentsScreen.displayName = "AssessmentsScreen";
