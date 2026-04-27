import type {
  MigrationComplexityResponse,
  MigrationEstimationByComplexityResponse,
} from "@openshift-migration-advisor/planner-sdk";

import type {
  ClusterRequirementsResponse,
  MigrationEstimationResponse,
  SizingFormValues,
} from "../cluster-sizer/types";

export const EXAMPLE_FORM_VALUES: SizingFormValues = {
  clusterMode: "full-ha",
  workerNodePreset: "large",
  customCpu: 64,
  customMemoryGb: 256,
  haReplicas: 3,
  cpuOvercommitRatio: 4,
  memoryOvercommitRatio: 2,
  scheduleOnControlPlane: false,
  smtEnabled: false,
  smtThreads: 2,
  controlPlaneCpu: 16,
  controlPlaneMemoryGb: 64,
};

export interface ExampleClusterData {
  clusterName: string;
  result: ClusterRequirementsResponse;
  migrationEstimation: MigrationEstimationResponse;
  complexityEstimation: MigrationComplexityResponse;
  estimationByComplexity: MigrationEstimationByComplexityResponse;
}

export const EXAMPLE_SIZING_MAP: Record<string, ExampleClusterData> = {
  "domain-c34": {
    clusterName: "Cluster domain-c34",
    result: {
      clusterSizing: {
        totalNodes: 20,
        workerNodes: 17,
        controlPlaneNodes: 3,
        failoverNodes: 2,
        totalCPU: 1088,
        totalMemory: 4352,
      },
      resourceConsumption: {
        cpu: 91.5,
        memory: 86.2,
        limits: { cpu: 95.0, memory: 92.0 },
        overCommitRatio: { cpu: 4.0, memory: 2.0 },
      },
      inventoryTotals: { totalVMs: 350, totalCPU: 1297, totalMemory: 2855 },
    },
    migrationEstimation: {
      estimationContext: {
        schemas: ["network-based", "storage-offload"],
        params: {
          work_hours_per_day: 8,
          post_migration_engineers: 10,
          transfer_rate_mbps: 620,
        },
      },
      estimation: {
        "network-based": {
          minTotalDuration: "360h0m0s",
          maxTotalDuration: "720h0m0s",
          breakdown: {
            "Data transfer": {
              minDuration: "300h0m0s",
              maxDuration: "600h0m0s",
              reason:
                "42,454 GB total disk data transferred at 620 Mbps (1 min/4GB)",
            },
            "Post-migration checks": {
              minDuration: "60h0m0s",
              maxDuration: "120h0m0s",
              reason:
                "350 VMs @ 15 mins each, 10 engineers working 8-hour shifts, 45 work days",
            },
          },
        },
        "storage-offload": {
          minTotalDuration: "180h0m0s",
          maxTotalDuration: "360h0m0s",
          breakdown: {
            "Storage offload": {
              minDuration: "120h0m0s",
              maxDuration: "240h0m0s",
              reason:
                "42,454 GB total, 0.5 – 2.0 GB/s transfer rate; assumes storage array supports bulk offload",
            },
            "Post-migration checks": {
              minDuration: "60h0m0s",
              maxDuration: "120h0m0s",
              reason:
                "350 VMs @ 15 mins each, 10 engineers working 8-hour shifts, 45 work days",
            },
          },
        },
      },
    },
    complexityEstimation: {
      diskSizeRatings: {
        "0-10 TB": 1,
        "11-20 TB": 2,
        "21-50 TB": 3,
        "> 50 TB": 4,
      },
      osRatings: {
        "Red Hat Enterprise Linux 9 (64-bit)": 1,
        "Red Hat Enterprise Linux 8 (64-bit)": 1,
        "Red Hat Enterprise Linux 10 (64-bit)": 1,
        "Microsoft Windows Server 2022 (64-bit)": 2,
        "Microsoft Windows Server 2019 (64-bit)": 2,
        "Microsoft Windows Server 2016 (64-bit)": 2,
        "Microsoft Windows 10 (64-bit)": 2,
        "Microsoft Windows 11 (64-bit)": 2,
        "Amazon Linux 2 (64-bit)": 3,
        "CentOS 9 (64-bit)": 3,
        "CentOS 8 (64-bit)": 3,
        "CentOS 7 (64-bit)": 3,
        "Red Hat Fedora (64-bit)": 3,
        "Other 2.6.x Linux (64-bit)": 4,
        "Other Linux (64-bit)": 4,
      },
      complexityByOS: [
        { score: 0, vmCount: 0 },
        { score: 1, vmCount: 195 },
        { score: 2, vmCount: 24 },
        { score: 3, vmCount: 45 },
        { score: 4, vmCount: 86 },
      ],
      complexityByOSName: [
        {
          osName: "Red Hat Enterprise Linux 9 (64-bit)",
          score: 1,
          vmCount: 145,
        },
        {
          osName: "Red Hat Enterprise Linux 8 (64-bit)",
          score: 1,
          vmCount: 49,
        },
        {
          osName: "Red Hat Enterprise Linux 10 (64-bit)",
          score: 1,
          vmCount: 1,
        },
        {
          osName: "Microsoft Windows Server 2022 (64-bit)",
          score: 2,
          vmCount: 11,
        },
        {
          osName: "Microsoft Windows Server 2019 (64-bit)",
          score: 2,
          vmCount: 5,
        },
        {
          osName: "Microsoft Windows Server 2016 (64-bit)",
          score: 2,
          vmCount: 3,
        },
        { osName: "Microsoft Windows 10 (64-bit)", score: 2, vmCount: 3 },
        { osName: "Microsoft Windows 11 (64-bit)", score: 2, vmCount: 2 },
        { osName: "Amazon Linux 2 (64-bit)", score: 3, vmCount: 10 },
        { osName: "CentOS 9 (64-bit)", score: 3, vmCount: 3 },
        { osName: "CentOS 8 (64-bit)", score: 3, vmCount: 1 },
        { osName: "CentOS 7 (64-bit)", score: 3, vmCount: 1 },
        { osName: "Red Hat Fedora (64-bit)", score: 3, vmCount: 30 },
        { osName: "Other 2.6.x Linux (64-bit)", score: 4, vmCount: 57 },
        { osName: "Other Linux (64-bit)", score: 4, vmCount: 29 },
      ],
      complexityByDisk: [
        { score: 1, vmCount: 145, totalSizeTB: 7.2 },
        { score: 2, vmCount: 120, totalSizeTB: 18.5 },
        { score: 3, vmCount: 60, totalSizeTB: 13.2 },
        { score: 4, vmCount: 25, totalSizeTB: 3.1 },
      ],
    },
    estimationByComplexity: {
      complexityMatrix: {
        "0": { "1": 0, "2": 0, "3": 0, "4": 0 },
        "1": { "1": 1, "2": 1, "3": 2, "4": 3 },
        "2": { "1": 1, "2": 2, "3": 2, "4": 3 },
        "3": { "1": 2, "2": 3, "3": 3, "4": 4 },
        "4": { "1": 3, "2": 3, "3": 4, "4": 4 },
      },
      complexityByOsDisk: [
        { score: 0, vmCount: 0, totalDiskSizeTB: 0 },
        {
          score: 1,
          vmCount: 152,
          totalDiskSizeTB: 7.2,
          estimation: {
            "network-based": {
              minTotalDuration: "160h0m0s",
              maxTotalDuration: "320h0m0s",
              breakdown: {},
            },
            "storage-offload": {
              minTotalDuration: "80h0m0s",
              maxTotalDuration: "160h0m0s",
              breakdown: {},
            },
          },
        },
        {
          score: 2,
          vmCount: 98,
          totalDiskSizeTB: 16.5,
          estimation: {
            "network-based": {
              minTotalDuration: "120h0m0s",
              maxTotalDuration: "240h0m0s",
              breakdown: {},
            },
            "storage-offload": {
              minTotalDuration: "60h0m0s",
              maxTotalDuration: "120h0m0s",
              breakdown: {},
            },
          },
        },
        {
          score: 3,
          vmCount: 68,
          totalDiskSizeTB: 14.7,
          estimation: {
            "network-based": {
              minTotalDuration: "80h0m0s",
              maxTotalDuration: "160h0m0s",
              breakdown: {},
            },
            "storage-offload": {
              minTotalDuration: "40h0m0s",
              maxTotalDuration: "80h0m0s",
              breakdown: {},
            },
          },
        },
        {
          score: 4,
          vmCount: 32,
          totalDiskSizeTB: 4.0,
          estimation: {
            "network-based": {
              minTotalDuration: "40h0m0s",
              maxTotalDuration: "80h0m0s",
              breakdown: {},
            },
            "storage-offload": {
              minTotalDuration: "20h0m0s",
              maxTotalDuration: "40h0m0s",
              breakdown: {},
            },
          },
        },
      ],
    },
  },
  "domain-c146658": {
    clusterName: "Cluster domain-c146658",
    result: {
      clusterSizing: {
        totalNodes: 16,
        workerNodes: 13,
        controlPlaneNodes: 3,
        failoverNodes: 2,
        totalCPU: 832,
        totalMemory: 3328,
      },
      resourceConsumption: {
        cpu: 88.7,
        memory: 82.1,
        limits: { cpu: 93.0, memory: 88.0 },
        overCommitRatio: { cpu: 4.0, memory: 2.0 },
      },
      inventoryTotals: { totalVMs: 280, totalCPU: 980, totalMemory: 2150 },
    },
    migrationEstimation: {
      estimationContext: {
        schemas: ["network-based", "storage-offload"],
        params: {
          work_hours_per_day: 8,
          post_migration_engineers: 10,
          transfer_rate_mbps: 620,
        },
      },
      estimation: {
        "network-based": {
          minTotalDuration: "280h0m0s",
          maxTotalDuration: "560h0m0s",
          breakdown: {
            "Data transfer": {
              minDuration: "232h0m0s",
              maxDuration: "464h0m0s",
              reason:
                "32,768 GB total disk data transferred at 620 Mbps (1 min/4GB)",
            },
            "Post-migration checks": {
              minDuration: "48h0m0s",
              maxDuration: "96h0m0s",
              reason:
                "280 VMs @ 15 mins each, 10 engineers working 8-hour shifts, 35 work days",
            },
          },
        },
        "storage-offload": {
          minTotalDuration: "140h0m0s",
          maxTotalDuration: "280h0m0s",
          breakdown: {
            "Storage offload": {
              minDuration: "92h0m0s",
              maxDuration: "184h0m0s",
              reason:
                "32,768 GB total, 0.5 – 2.0 GB/s transfer rate; assumes storage array supports bulk offload",
            },
            "Post-migration checks": {
              minDuration: "48h0m0s",
              maxDuration: "96h0m0s",
              reason:
                "280 VMs @ 15 mins each, 10 engineers working 8-hour shifts, 35 work days",
            },
          },
        },
      },
    },
    complexityEstimation: {
      diskSizeRatings: {
        "0-10 TB": 1,
        "11-20 TB": 2,
        "21-50 TB": 3,
        "> 50 TB": 4,
      },
      osRatings: {
        "Red Hat Enterprise Linux 9 (64-bit)": 1,
        "Red Hat Enterprise Linux 8 (64-bit)": 1,
        "Red Hat Enterprise Linux 10 (64-bit)": 1,
        "Microsoft Windows Server 2022 (64-bit)": 2,
        "Microsoft Windows Server 2019 (64-bit)": 2,
        "Microsoft Windows Server 2016 (64-bit)": 2,
        "Microsoft Windows 10 (64-bit)": 2,
        "Microsoft Windows 11 (64-bit)": 2,
        "Amazon Linux 2 (64-bit)": 3,
        "CentOS 9 (64-bit)": 3,
        "CentOS 8 (64-bit)": 3,
        "CentOS 7 (64-bit)": 3,
        "Red Hat Fedora (64-bit)": 3,
        "Other 2.6.x Linux (64-bit)": 4,
        "Other Linux (64-bit)": 4,
      },
      complexityByOS: [
        { score: 0, vmCount: 0 },
        { score: 1, vmCount: 155 },
        { score: 2, vmCount: 20 },
        { score: 3, vmCount: 35 },
        { score: 4, vmCount: 70 },
      ],
      complexityByOSName: [
        {
          osName: "Red Hat Enterprise Linux 9 (64-bit)",
          score: 1,
          vmCount: 115,
        },
        {
          osName: "Red Hat Enterprise Linux 8 (64-bit)",
          score: 1,
          vmCount: 38,
        },
        {
          osName: "Red Hat Enterprise Linux 10 (64-bit)",
          score: 1,
          vmCount: 2,
        },
        {
          osName: "Microsoft Windows Server 2022 (64-bit)",
          score: 2,
          vmCount: 8,
        },
        {
          osName: "Microsoft Windows Server 2019 (64-bit)",
          score: 2,
          vmCount: 5,
        },
        {
          osName: "Microsoft Windows Server 2016 (64-bit)",
          score: 2,
          vmCount: 3,
        },
        { osName: "Microsoft Windows 10 (64-bit)", score: 2, vmCount: 2 },
        { osName: "Microsoft Windows 11 (64-bit)", score: 2, vmCount: 2 },
        { osName: "Amazon Linux 2 (64-bit)", score: 3, vmCount: 8 },
        { osName: "CentOS 9 (64-bit)", score: 3, vmCount: 4 },
        { osName: "CentOS 8 (64-bit)", score: 3, vmCount: 2 },
        { osName: "CentOS 7 (64-bit)", score: 3, vmCount: 2 },
        { osName: "Red Hat Fedora (64-bit)", score: 3, vmCount: 19 },
        { osName: "Other 2.6.x Linux (64-bit)", score: 4, vmCount: 45 },
        { osName: "Other Linux (64-bit)", score: 4, vmCount: 25 },
      ],
      complexityByDisk: [
        { score: 1, vmCount: 110, totalSizeTB: 5.8 },
        { score: 2, vmCount: 95, totalSizeTB: 14.2 },
        { score: 3, vmCount: 50, totalSizeTB: 9.8 },
        { score: 4, vmCount: 25, totalSizeTB: 2.8 },
      ],
    },
    estimationByComplexity: {
      complexityMatrix: {
        "0": { "1": 0, "2": 0, "3": 0, "4": 0 },
        "1": { "1": 1, "2": 1, "3": 2, "4": 3 },
        "2": { "1": 1, "2": 2, "3": 2, "4": 3 },
        "3": { "1": 2, "2": 3, "3": 3, "4": 4 },
        "4": { "1": 3, "2": 3, "3": 4, "4": 4 },
      },
      complexityByOsDisk: [
        { score: 0, vmCount: 0, totalDiskSizeTB: 0 },
        {
          score: 1,
          vmCount: 122,
          totalDiskSizeTB: 5.8,
          estimation: {
            "network-based": {
              minTotalDuration: "128h0m0s",
              maxTotalDuration: "256h0m0s",
              breakdown: {},
            },
            "storage-offload": {
              minTotalDuration: "64h0m0s",
              maxTotalDuration: "128h0m0s",
              breakdown: {},
            },
          },
        },
        {
          score: 2,
          vmCount: 79,
          totalDiskSizeTB: 13.2,
          estimation: {
            "network-based": {
              minTotalDuration: "96h0m0s",
              maxTotalDuration: "192h0m0s",
              breakdown: {},
            },
            "storage-offload": {
              minTotalDuration: "48h0m0s",
              maxTotalDuration: "96h0m0s",
              breakdown: {},
            },
          },
        },
        {
          score: 3,
          vmCount: 54,
          totalDiskSizeTB: 11.2,
          estimation: {
            "network-based": {
              minTotalDuration: "56h0m0s",
              maxTotalDuration: "112h0m0s",
              breakdown: {},
            },
            "storage-offload": {
              minTotalDuration: "28h0m0s",
              maxTotalDuration: "56h0m0s",
              breakdown: {},
            },
          },
        },
        {
          score: 4,
          vmCount: 25,
          totalDiskSizeTB: 2.6,
          estimation: {
            "network-based": {
              minTotalDuration: "32h0m0s",
              maxTotalDuration: "64h0m0s",
              breakdown: {},
            },
            "storage-offload": {
              minTotalDuration: "16h0m0s",
              maxTotalDuration: "32h0m0s",
              breakdown: {},
            },
          },
        },
      ],
    },
  },
};
