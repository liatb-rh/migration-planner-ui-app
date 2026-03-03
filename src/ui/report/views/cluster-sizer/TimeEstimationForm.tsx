import {
  Form,
  FormGroup,
  Grid,
  GridItem,
  TextInput,
  Title,
} from "@patternfly/react-core";
import React from "react";

import PopoverIcon from "./PopoverIcon";
import type { SizingFormValues } from "./types";

interface TimeEstimationFormProps {
  values: SizingFormValues;
}

export const TimeEstimationForm: React.FC<TimeEstimationFormProps> = ({
  values,
}) => {
  return (
    <Form>
      <Grid hasGutter>
        <GridItem span={12}>
          <Title headingLevel="h2">Migration parameters</Title>
        </GridItem>

        <GridItem span={6}>
          <FormGroup
            label="Worker node CPU cores"
            isRequired
            fieldId="time-worker-cpu"
            labelHelp={
              <PopoverIcon
                noVerticalAlign
                headerContent="Worker node CPU cores"
                bodyContent="The number of CPU cores allocated to each worker node."
              />
            }
          >
            <TextInput
              id="time-worker-cpu"
              value={String(values.customCpu)}
              isDisabled
              aria-label="Worker node CPU cores"
            />
          </FormGroup>
        </GridItem>

        <GridItem span={6}>
          <FormGroup
            label="Worker node memory size (GB)"
            isRequired
            fieldId="time-worker-memory"
            labelHelp={
              <PopoverIcon
                noVerticalAlign
                headerContent="Worker node memory size"
                bodyContent="The amount of memory in GB allocated to each worker node."
              />
            }
          >
            <TextInput
              id="time-worker-memory"
              value={String(values.customMemoryGb)}
              isDisabled
              aria-label="Worker node memory size"
            />
          </FormGroup>
        </GridItem>

        <GridItem span={6}>
          <FormGroup
            label="CPU overcommitment"
            isRequired
            fieldId="time-cpu-overcommit"
            labelHelp={
              <PopoverIcon
                noVerticalAlign
                headerContent="CPU overcommitment"
                bodyContent="The ratio of virtual CPUs to physical cores."
              />
            }
          >
            <TextInput
              id="time-cpu-overcommit"
              value={`1:${values.cpuOvercommitRatio}`}
              isDisabled
              aria-label="CPU overcommitment ratio"
            />
          </FormGroup>
        </GridItem>

        <GridItem span={6}>
          <FormGroup
            label="Memory overcommitment"
            isRequired
            fieldId="time-memory-overcommit"
            labelHelp={
              <PopoverIcon
                noVerticalAlign
                headerContent="Memory overcommitment"
                bodyContent="The ratio of virtual memory to physical memory."
              />
            }
          >
            <TextInput
              id="time-memory-overcommit"
              value={`1:${values.memoryOvercommitRatio}`}
              isDisabled
              aria-label="Memory overcommitment ratio"
            />
          </FormGroup>
        </GridItem>
      </Grid>
    </Form>
  );
};

TimeEstimationForm.displayName = "TimeEstimationForm";

export default TimeEstimationForm;
