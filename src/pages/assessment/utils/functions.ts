export const openAssistedInstaller = (): void => {
  const currentHost = window.location.hostname;

  if (currentHost === "console.stage.redhat.com") {
    window.open(
      "https://console.dev.redhat.com/openshift/assisted-installer/clusters/~new?source=assisted_migration",
      "_blank",
    );
  } else {
    window.open(
      "/openshift/assisted-installer/clusters/~new?source=assisted_migration",
      "_blank",
    );
  }
};
