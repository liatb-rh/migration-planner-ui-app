import { yupResolver } from "@hookform/resolvers/yup";
import type { PartnerRequestCreate } from "@openshift-migration-advisor/planner-sdk";
import { Form } from "@patternfly/react-core";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";

import { TextInputFormGroup } from "../../../core/components/form";

interface ContactFormProps {
  id: string;
  onSubmit: (values: PartnerRequestCreate) => void;
}

const validationSchema: yup.ObjectSchema<PartnerRequestCreate> = yup
  .object()
  .shape({
    name: yup.string().trim().required("Your company name is required"),
    contactName: yup
      .string()
      .trim()
      .required("Primary contact name is required"),
    contactPhone: yup.string().trim().default(""),
    email: yup
      .string()
      .trim()
      .required("Email is required")
      .email("Please enter a valid email address"),
    location: yup.string().trim().default(""),
  });

export const ContactForm: React.FC<ContactFormProps> = ({ id, onSubmit }) => {
  const methods = useForm<PartnerRequestCreate>({
    resolver: yupResolver(validationSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      contactName: "",
      contactPhone: "",
      email: "",
      location: "",
    },
  });

  return (
    <FormProvider {...methods}>
      <Form
        noValidate
        id={id}
        onSubmit={(e) => {
          void methods.handleSubmit(onSubmit)(e);
        }}
      >
        <TextInputFormGroup
          label="Your company name"
          id="name"
          name="name"
          placeholder="ACME Corp"
          isRequired
        />

        <TextInputFormGroup
          label="Primary contact name"
          id="contact-name"
          name="contactName"
          placeholder="John Doe"
          isRequired
        />
        <TextInputFormGroup
          label="Contact email address"
          id="email"
          name="email"
          type="email"
          placeholder="john.doe@example.org"
          isRequired
        />

        <TextInputFormGroup
          label="Contact phone number"
          id="contact-phone"
          name="contactPhone"
          placeholder="+1 415-555-2671"
          type="tel"
        />

        <TextInputFormGroup
          label="Location"
          id="location"
          name="location"
          placeholder="New York, US"
          helpText="This field will help us partner you with a person closer to your region."
        />
      </Form>
    </FormProvider>
  );
};

ContactForm.displayName = "ContactForm";
