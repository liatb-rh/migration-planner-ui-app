import { Button, Icon, Tooltip } from "@patternfly/react-core";
import { UploadIcon } from "@patternfly/react-icons";
import React, { useCallback } from "react";

import { uploadInventoryFile } from "../../../../../utils/uploadInventory";
import { DiscoverySources } from "../../../../contexts/discovery-sources/@types/DiscoverySources";

interface UploadInventoryProps {
  discoverySourcesContext: DiscoverySources.Context;
  sourceId: string;
  asLink?: boolean;
  onUploadResult?: (message?: string, isError?: boolean) => void;
  onUploadSuccess?: () => void;
}

export const UploadInventoryAction: React.FC<UploadInventoryProps> = ({
  discoverySourcesContext,
  sourceId,
  asLink,
  onUploadResult,
  onUploadSuccess,
}): JSX.Element => {
  const handleUploadSource = useCallback(() => {
    uploadInventoryFile(
      sourceId,
      discoverySourcesContext,
      onUploadResult,
      onUploadSuccess,
    );
  }, [discoverySourcesContext, sourceId, onUploadResult, onUploadSuccess]);

  return asLink ? (
    <Button
      variant="link"
      onClick={handleUploadSource}
      style={{ padding: 0, marginTop: "5px" }}
    >
      Upload discovery file (JSON)
    </Button>
  ) : (
    <Tooltip content="Upload JSON file">
      <Button variant="plain" onClick={handleUploadSource}>
        <Icon size="md" isInline>
          <UploadIcon />
        </Icon>
      </Button>
    </Tooltip>
  );
};
