import type { Group } from "@openshift-migration-advisor/planner-sdk";

import type { Partner } from "../../models/PartnerModel";
import { FAKE_GROUPS } from "./stubGroups";

/**
 * LocalStorage key for partner feature visibility
 */
export const PARTNER_FEATURE_VISIBLE_KEY =
  "migration-advisor:partner-feature-visible";

/**
 * Checks if the partner feature is enabled via localStorage.
 * @returns true if the feature is enabled, false otherwise
 */
export function isPartnerFeatureEnabled(): boolean {
  try {
    const item = window.localStorage.getItem(PARTNER_FEATURE_VISIBLE_KEY);
    if (item) {
      const parsed = JSON.parse(item) as { value: boolean; version: number };
      return parsed.value === true;
    }
    return false;
  } catch {
    return false;
  }
}

export const getFakePartners = () => {
  return FAKE_GROUPS.filter((group) => group.kind === "partner").map(
    groupToPartner,
  );
};

export const groupToPartner = (group: Group): Partner => {
  return {
    ...group,
    kind: "partner",
  };
};
