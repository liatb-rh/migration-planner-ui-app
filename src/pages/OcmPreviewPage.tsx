import { Bullseye } from "@patternfly/react-core";
import React from "react";

import { AppPage } from "../components/AppPage";
import { VMwareMigrationCard } from "../ocm/VMwareMigrationCard";

const OcmPreviewPage: React.FC = () => {
  return (
    <AppPage title="VMware Migration Assessment Card for OCM">
      <Bullseye>
        <VMwareMigrationCard />
      </Bullseye>
    </AppPage>
  );
};

OcmPreviewPage.displayName = "OcmPreviewPage";

export default OcmPreviewPage;
