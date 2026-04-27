import { Alert, TabContent, TabContentBody } from "@patternfly/react-core";
import type { ReactNode } from "react";
import React from "react";

import { LoadingSpinner } from "../../../core/components/LoadingSpinner";

interface RecommendationTabContentProps {
  /** id for the TabContent **/
  id: string;
  /** Title for a11y */
  title: string;
  /** React component or element to render */
  content: ReactNode;
  /** Optional isLoading to display loading spinner */
  isLoading?: boolean;
  /** Optional loadingComponent to replace loading spinner */
  loadingComponent?: ReactNode;
  /** Error message **/
  errorMessage: Error | undefined;
}

export const RecommendationTabContent: React.FC<
  RecommendationTabContentProps
> = ({
  id,
  title,
  content,
  isLoading = false,
  loadingComponent,
  errorMessage,
}) => {
  return (
    <TabContent id={id}>
      <TabContentBody hasPadding>
        {isLoading ? (
          loadingComponent === undefined ? (
            <LoadingSpinner />
          ) : (
            loadingComponent
          )
        ) : errorMessage ? (
          <Alert isInline variant="danger" title={`${title} error`}>
            {errorMessage.message}
          </Alert>
        ) : (
          <div>{content}</div>
        )}
      </TabContentBody>
    </TabContent>
  );
};

RecommendationTabContent.displayName = "RecommendationTabContent";

export default RecommendationTabContent;
