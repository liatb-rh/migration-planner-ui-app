import { InvalidObject } from "@redhat-cloud-services/frontend-components/InvalidObject";
import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AssessmentsScreen } from "../ui/assessment/views/AssessmentsScreen";
import { EnvironmentsScreen } from "../ui/environment/views/EnvironmentsScreen";
import { HomeScreen } from "../ui/home/views/HomeScreen";
import { GroupsScreen } from "../ui/partner/admin/views/GroupsScreen";
import { MyPartnerScreen } from "../ui/partner/customer/views/MyPartnerScreen";
import { CustomersScreen } from "../ui/partner/partner/views/CustomersScreen";
import { PartnersScreen } from "../ui/partner/regularUser/views/PartnersScreen";
import { PartnerViewRequireRole } from "../ui/partner/views/PartnerViewRequireRole";
import { IdentityWrapper } from "./IdentityWrapper";
import { routes } from "./Routes";

const Report = lazy(
  () => import(/* webpackChunkName: "Report" */ "../ui/report/views/Report"),
);

const ExampleReport = lazy(
  () =>
    import(
      /* webpackChunkName: "ExampleReport" */ "../ui/report/views/ExampleReport"
    ),
);

const DiscoveryOvaExampleReport = lazy(
  () =>
    import(
      /* webpackChunkName: "DiscoveryOvaExampleReport" */ "../ui/report/views/DiscoveryOvaExampleReport"
    ),
);

const CreateFromOva = lazy(
  () =>
    import(
      /* webpackChunkName: "CreateFromOva" */ "../ui/assessment/views/CreateFromOva"
    ),
);

const AssessmentDetails = lazy(
  () =>
    import(
      /* webpackChunkName: "AssessmentDetails" */ "../ui/assessment/views/AssessmentDetails"
    ),
);

const GroupDetailScreen = lazy(
  () =>
    import(
      /* webpackChunkName: "Group" */ "../ui/partner/admin/views/GroupDetailScreen"
    ),
);

export const AppRoutes: React.FC = () => (
  <Routes>
    {/* Identity wrapper loads current identity and renders child routes */}
    <Route element={<IdentityWrapper />}>
      <Route index element={<Navigate to={routes.assessments} replace />} />

      {/* Pathless layout route — HomeScreen renders the shell + <Outlet /> */}
      <Route element={<HomeScreen />} errorElement={<InvalidObject />}>
        <Route path="assessments" element={<AssessmentsScreen />} />
        <Route path="environments" element={<EnvironmentsScreen />} />

        {/* Partner feature */}
        <Route
          path="partners"
          element={<PartnerViewRequireRole role="regular" />}
        >
          <Route index element={<PartnersScreen />} />
        </Route>
        <Route
          path="partners/my"
          element={<PartnerViewRequireRole role="customer" />}
        >
          <Route index element={<MyPartnerScreen />} />
        </Route>
        <Route
          path="partners/customers"
          element={<PartnerViewRequireRole role="partner" />}
        >
          <Route index element={<CustomersScreen />} />
        </Route>
        <Route
          path="partners/groups"
          element={<PartnerViewRequireRole role="admin" />}
        >
          <Route index element={<GroupsScreen />} />
          <Route path=":id" element={<GroupDetailScreen />} />
        </Route>
      </Route>
      {/* Independent routes — they have their own page layout */}
      <Route path="assessments/:id/report" element={<Report />} />
      <Route path="assessments/example-report" element={<ExampleReport />} />
      <Route
        path="assessments/discovery-ova-example-report"
        element={<DiscoveryOvaExampleReport />}
      />
      <Route path="assessments/create" element={<CreateFromOva />} />
      <Route path="assessments/:id" element={<AssessmentDetails />} />
    </Route>
    <Route path="*" element={<InvalidObject />} />
  </Routes>
);
