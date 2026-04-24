import { yupResolver } from "@hookform/resolvers/yup";
import type {
  Group,
  GroupCreate,
  GroupCreateKindEnum,
} from "@openshift-migration-advisor/planner-sdk";
import { Form } from "@patternfly/react-core";
import React, { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";

import {
  SelectFormGroup,
  TextAreaFormGroup,
  TextInputFormGroup,
} from "../../../core/components/form";

export type CreateGroupFormValues = GroupCreate;

export type EditGroupFormValues = Pick<
  Group,
  "id" | "name" | "description" | "icon" | "company"
>;

const validationSchema: yup.ObjectSchema<CreateGroupFormValues> = yup
  .object()
  .shape({
    name: yup.string().trim().required("Name is required"),
    description: yup.string().trim().default(""),
    icon: yup.string().default(""),
    kind: yup
      .string()
      .oneOf(["admin", "partner"] as const)
      .required("Kind is required") as yup.Schema<GroupCreateKindEnum>,
    company: yup.string().trim().required("Company is required"),
  });

interface BaseGroupFormProps {
  id: string;
  setIsValid?: (isValid: boolean) => void;
}

interface EditGroupFormProps extends BaseGroupFormProps {
  group: Group;
  onSubmit: (values: EditGroupFormValues) => void;
}

interface CreateGroupFormProps extends BaseGroupFormProps {
  group?: never;
  onSubmit: (values: CreateGroupFormValues) => void;
}

export type GroupFormProps = EditGroupFormProps | CreateGroupFormProps;

export const GroupForm: React.FC<GroupFormProps> = ({
  id,
  group,
  onSubmit,
  setIsValid,
}) => {
  const methods = useForm<CreateGroupFormValues>({
    resolver: yupResolver(validationSchema),
    mode: "onTouched",
    defaultValues: group
      ? {
          name: group.name,
          description: group.description || "",
          icon: group.icon || "",
          kind: group.kind,
          company: group.company || "",
        }
      : {
          name: "",
          description: "",
          icon: "",
          kind: "partner" as GroupCreateKindEnum,
          company: "",
        },
  });

  useEffect(() => {
    setIsValid?.(methods.formState.isValid);
  }, [methods.formState.isValid, setIsValid]);

  const handleFormSubmit = (data: CreateGroupFormValues) => {
    if (group) {
      onSubmit({
        id: group.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        company: data.company,
      });
    } else {
      onSubmit(data);
    }
  };

  return (
    <FormProvider {...methods}>
      <Form
        noValidate
        id={id}
        onSubmit={(e) => {
          void methods.handleSubmit(handleFormSubmit)(e);
        }}
      >
        <TextInputFormGroup
          label="Group Name"
          id="group-name"
          name="name"
          isRequired
          placeholder="Example: Tech Solutions Inc"
        />

        <TextInputFormGroup
          label="Company"
          id="group-company"
          name="company"
          isRequired
          placeholder="Example: Acme Corporation"
        />

        <SelectFormGroup
          label="Kind"
          id="group-kind"
          name="kind"
          isRequired
          isDisabled={!!group}
          options={[
            { label: "Partner", value: "partner" },
            { label: "Admin", value: "admin" },
          ]}
        />

        <TextAreaFormGroup
          label="Description"
          id="group-description"
          name="description"
          placeholder="Example: Leading technology solutions provider"
        />

        <TextInputFormGroup
          label="Icon"
          id="group-icon"
          name="icon"
          placeholder="data:image/svg+xml;base64,..."
          helpText="Base64 encoded image or URL to group icon"
        />
      </Form>
    </FormProvider>
  );
};

GroupForm.displayName = "GroupForm";
