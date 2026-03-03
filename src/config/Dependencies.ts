import {
  AssessmentApi,
  ImageApi,
  InfoApi,
  JobApi,
  SourceApi,
} from "@openshift-migration-advisor/planner-sdk";
import { Configuration } from "@openshift-migration-advisor/planner-sdk";
import type { ChromeAPI } from "@redhat-cloud-services/types";
import { Container } from "@y0n1/react-ioc";

import { AssessmentsStore } from "../data/stores/AssessmentsStore";
import { ImagesStore } from "../data/stores/ImagesStore";
import { JobsStore } from "../data/stores/JobsStore";
import { ReportStore } from "../data/stores/ReportStore";
import { SourcesStore } from "../data/stores/SourcesStore";
import { VersionsStore } from "../data/stores/VersionsStore";
import { createAuthMiddleware } from "../lib/middleware/Auth";
import { HtmlExportService } from "../services/html-export/HtmlExportService";
import { PdfExportService } from "../services/pdf-export/PdfExportService";
import { resolveApiBaseUrl } from "./ApiConfig";

/** Symbols used by the DI container */
export const Symbols = Object.freeze({
  // Stores
  AssessmentsStore: Symbol.for("AssessmentsStore"),
  ImagesStore: Symbol.for("ImagesStore"),
  SourcesStore: Symbol.for("SourcesStore"),
  VersionsStore: Symbol.for("VersionsStore"),
  JobsStore: Symbol.for("JobsStore"),
  ReportStore: Symbol.for("ReportStore"),
});

export const createContainer = (auth: ChromeAPI["auth"]): Container => {
  const apiBaseUrl = resolveApiBaseUrl();

  // Log the detected API path for debugging (safe for SSR/test environments)
  try {
    console.log("[Migration Planner] Runtime API Path Detection:", {
      currentPath: window.location.pathname,
      detectedApiPath: apiBaseUrl,
    });
  } catch {
    // SSR or test environment without DOM - skip logging
  }

  const plannerApiConfig = new Configuration({
    basePath: apiBaseUrl,
    middleware: [createAuthMiddleware(auth)],
  });

  const sourceApi = new SourceApi(plannerApiConfig);
  const imageApi = new ImageApi(plannerApiConfig);
  const assessmentApi = new AssessmentApi(plannerApiConfig);
  const infoApi = new InfoApi(plannerApiConfig);
  const jobApi = new JobApi(plannerApiConfig);

  const c = new Container();

  // Stores
  c.register(Symbols.AssessmentsStore, new AssessmentsStore(assessmentApi));
  c.register(Symbols.ImagesStore, new ImagesStore(imageApi));
  c.register(Symbols.VersionsStore, new VersionsStore(infoApi));
  c.register(Symbols.SourcesStore, new SourcesStore(sourceApi));
  c.register(Symbols.JobsStore, new JobsStore(jobApi));

  // Report export
  c.register(
    Symbols.ReportStore,
    new ReportStore(new PdfExportService(), new HtmlExportService()),
  );

  return c;
};
