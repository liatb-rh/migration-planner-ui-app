import { Bullseye, Spinner } from "@patternfly/react-core";
import { InvalidObject } from "@redhat-cloud-services/frontend-components/InvalidObject";
import React, { Suspense } from "react";
import { Route as RouterRoute, Routes as RouterRoutes } from "react-router-dom";

import { Provider as DiscoverySourcesProvider } from "./migration-wizard/contexts/discovery-sources/Provider";
import MigrationPage from "./pages/MigrationPage";
import MigrationWizardPage from "./pages/MigrationWizardPage";
import ExampleReport from "./pages/report/ExampleReport";
import Report from "./pages/report/Report";

interface RouteType {
  path?: string;
  element: React.ComponentType<Record<string, unknown>>;
  childRoutes?: RouteType[];
  elementProps?: Record<string, unknown>;
}

const CreateFromOva = React.lazy(
  () => import("./pages/assessment/CreateFromOva"),
);

const AssessmentDetails = React.lazy(
  () => import("./pages/assessment/AssessmentDetails"),
);

const Routing: React.FC = () => {
  const routes: RouteType[] = [
    {
      path: "/",
      element: MigrationPage,
    },
    {
      path: "/assessments",
      element: MigrationPage,
      elementProps: { initialTabKey: 0 },
    },
    {
      path: "/assessments/:id",
      element: AssessmentDetails,
    },
    {
      path: "/environments",
      element: MigrationPage,
      elementProps: { initialTabKey: 1 },
    },
    {
      path: "/assessments/:id/report",
      element: Report,
    },
    {
      path: "/assessments/example-report",
      element: ExampleReport,
    },
    {
      path: "/assessments/create",
      element: CreateFromOva,
    },
    {
      path: "/wizard",
      element: MigrationWizardPage,
    },
    {
      path: "*",
      element: InvalidObject,
    },
  ];

  const renderRoutes = (routes: RouteType[] = []): JSX.Element[] =>
    routes.map(({ path, element: Element, childRoutes, elementProps }) => (
      <RouterRoute
        key={path}
        path={path}
        element={<Element {...elementProps} />}
      >
        {renderRoutes(childRoutes)}
      </RouterRoute>
    ));

  return (
    <DiscoverySourcesProvider>
      <Suspense
        fallback={
          <Bullseye>
            <Spinner />
          </Bullseye>
        }
      >
        <RouterRoutes>{renderRoutes(routes)}</RouterRoutes>
      </Suspense>
    </DiscoverySourcesProvider>
  );
};

export default Routing;
