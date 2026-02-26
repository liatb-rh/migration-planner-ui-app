import type { Middleware } from "@openshift-migration-advisor/planner-sdk";
import type { ChromeAPI } from "@redhat-cloud-services/types";

export const createAuthMiddleware = (auth: ChromeAPI["auth"]): Middleware => ({
  pre: async ({ url, init }) => {
    const token = await auth.getToken();
    const headers = new Headers(init.headers ?? {});
    headers.set("X-Authorization", `Bearer ${token}`);
    return {
      url,
      init: { ...init, headers },
    };
  },
});
