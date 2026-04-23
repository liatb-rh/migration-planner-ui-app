import type { PartnerRequest } from "@openshift-migration-advisor/planner-sdk";
import { Label } from "@patternfly/react-core";
import React from "react";

interface RequestStatusProps {
  status: PartnerRequest["requestStatus"];
}

export const RequestStatus: React.FC<RequestStatusProps> = ({ status }) => {
  switch (status) {
    case "accepted":
      return <Label color="green">Accepted</Label>;
    case "pending":
      return <Label color="yellow">Pending</Label>;
    case "rejected":
      return <Label color="red">Denied</Label>;
    case "cancelled":
      return <Label color="grey">Cancelled</Label>;
    default:
      return <Label>{status}</Label>;
  }
};

RequestStatus.displayName = "RequestStatus";
