import { Card, CardBody, CardTitle } from "@patternfly/react-core";
import VirtualMachineIcon from "@patternfly/react-icons/dist/esm/icons/virtual-machine-icon";
import React from "react";

import MigrationDonutChart from "../../../core/components/MigrationDonutChart";
import { chartColorFailure, chartColorSuccess } from "./constants";
import { dashboardCard } from "./styles";

interface VmMigrationStatusProps {
  data: {
    migratable: number;
    nonMigratable: number;
  };
  isExportMode?: boolean;
}

export const VMMigrationStatus: React.FC<VmMigrationStatusProps> = ({
  data,
  isExportMode = false,
}) => {
  const donutData = [
    {
      name: "Migratable",
      count: data.migratable,
      countDisplay: `${data.migratable} VMs`,
      legendCategory: "Migratable",
    },
    {
      name: "Not ready for migration",
      count: data.nonMigratable,
      countDisplay: `${data.nonMigratable} VMs`,
      legendCategory: "Not ready for migration",
    },
  ];

  const legend = {
    Migratable: chartColorSuccess,
    "Not ready for migration": chartColorFailure,
  };

  return (
    <Card
      className={dashboardCard}
      id="vm-migration-status"
      style={{
        height: isExportMode ? "auto" : "340px !important",
        overflow: isExportMode ? "visible" : "hidden",
      }}
    >
      <CardTitle>
        <VirtualMachineIcon /> VM Migration Status
      </CardTitle>
      <CardBody>
        <MigrationDonutChart
          data={donutData}
          legend={legend}
          height={300}
          width={420}
          donutThickness={18}
          padAngle={1}
          title={`${data.migratable + data.nonMigratable}`}
          subTitle="VMs"
          subTitleColor="var(--pf-t--global--text--color--subtle)"
          titleFontSize={34}
          labelFontSize={18}
          itemsPerRow={2}
          marginLeft="40%"
        />
      </CardBody>
    </Card>
  );
};
