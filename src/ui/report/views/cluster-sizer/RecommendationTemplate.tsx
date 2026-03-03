import { css } from "@emotion/css";
import {
  Alert,
  Button,
  ExpandableSection,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import type { ReactNode } from "react";
import React, { useState } from "react";

const preferencesWrapperStyle = css`
  padding: var(--pf-t--global--spacer--400);
  border-radius: var(--pf-t--global--border--radius--large);
`;

const preferencesWrapperCollapsedStyle = css`
  padding: var(--pf-t--global--spacer--300);
  border-radius: var(--pf-t--global--border--radius--large);
`;

const expandableSectionStyle = css`
  background-color: #e0f0ff !important;
`;

const expandableSectionDisabledStyle = css`
  background-color: #e0f0ff !important;
  opacity: 0.6;
  pointer-events: none;
`;

const preferencesContentStackStyle = css`
  margin-top: var(--pf-t--global--spacer--300);
`;

interface RecommendationTemplateProps {
  /** Title for the preferences section */
  preferencesTitle?: string;
  /** React component or element to render in the preferences section */
  preferencesContent: ReactNode;
  /** React component or element to render in the results section */
  resultsContent: ReactNode;
  /** Function to call when Generate recommendation is clicked */
  onGenerate: () => void | Promise<void>;
  /** Whether the generate operation is currently loading */
  isLoading?: boolean;
  /** Whether results are available to display */
  hasResults?: boolean;
  /** Custom button text (defaults to "Generate recommendation") */
  generateButtonText?: string;
  /** Title for the results section (defaults to "Cluster recommendations") */
  resultsTitle?: string;
  /** Whether to show the info alert in the results section (defaults to true) */
  showAlert?: boolean;
  /** Initial expanded state for preferences section (defaults to true) */
  isPreferencesInitiallyExpanded?: boolean;
  /** Whether the preferences section is disabled (defaults to false) */
  isPreferencesDisabled?: boolean;
  /** Whether to hide the preferences section entirely (defaults to false) */
  hidePreferences?: boolean;
}

export const RecommendationTemplate: React.FC<RecommendationTemplateProps> = ({
  preferencesTitle = "Migration preferences",
  preferencesContent,
  resultsContent,
  onGenerate,
  isLoading = false,
  hasResults = false,
  generateButtonText = "Generate recommendation",
  resultsTitle = "Cluster recommendations",
  showAlert = true,
  isPreferencesInitiallyExpanded = true,
  isPreferencesDisabled = false,
  hidePreferences = false,
}) => {
  const [isPreferencesExpanded, setIsPreferencesExpanded] = useState(
    isPreferencesInitiallyExpanded,
  );

  const handleGenerate = () => {
    const result = onGenerate();
    if (result instanceof Promise) {
      void result
        .catch((err) => {
          console.error("Generate recommendation failed:", err);
        })
        .finally(() => {
          setIsPreferencesExpanded(false);
        });
    } else {
      setIsPreferencesExpanded(false);
    }
  };

  return (
    <Stack hasGutter>
      {!hidePreferences && (
        <StackItem>
          <div
            className={
              isPreferencesExpanded
                ? preferencesWrapperStyle
                : preferencesWrapperCollapsedStyle
            }
          >
            <ExpandableSection
              title={preferencesTitle}
              toggleText={preferencesTitle}
              isExpanded={isPreferencesExpanded}
              onToggle={
                isPreferencesDisabled
                  ? undefined
                  : (_event, expanded) => setIsPreferencesExpanded(expanded)
              }
              displaySize="lg"
              className={
                isPreferencesDisabled
                  ? expandableSectionDisabledStyle
                  : expandableSectionStyle
              }
            >
              <Stack hasGutter className={preferencesContentStackStyle}>
                <StackItem>{preferencesContent}</StackItem>
                <StackItem>
                  <Button
                    variant="primary"
                    onClick={handleGenerate}
                    isLoading={isLoading}
                    isDisabled={isLoading || isPreferencesDisabled}
                  >
                    {generateButtonText}
                  </Button>
                </StackItem>
              </Stack>
            </ExpandableSection>
          </div>
        </StackItem>
      )}

      {hasResults && (
        <StackItem>
          <Panel>
            {resultsTitle && (
              <PanelHeader>
                <Title headingLevel="h2">{resultsTitle}</Title>
              </PanelHeader>
            )}
            <PanelMain>
              <PanelMainBody>
                <Stack hasGutter>
                  {showAlert && (
                    <StackItem>
                      <Alert
                        variant="info"
                        isInline
                        title="Resource requirements are estimates based on current workloads"
                      >
                        Confirm this architecture with your team to ensure
                        optimal performance.
                      </Alert>
                    </StackItem>
                  )}
                  <StackItem>{resultsContent}</StackItem>
                </Stack>
              </PanelMainBody>
            </PanelMain>
          </Panel>
        </StackItem>
      )}
    </Stack>
  );
};

RecommendationTemplate.displayName = "RecommendationTemplate";

export default RecommendationTemplate;
