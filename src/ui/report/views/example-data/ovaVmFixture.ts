/**
 * Mock VM list data for the Discovery OVA example report.
 * Mirrors the VirtualMachine shape from @openshift-migration-advisor/agent-sdk.
 */

export interface MockVirtualMachine {
  name: string;
  id: string;
  vCenterState: string;
  cluster: string;
  datacenter: string;
  diskSize: number;
  memory: number;
  issueCount: number;
  migratable: boolean;
}

const CLUSTERS = ["domain-c34", "domain-c146658"];
const DATACENTER = "EcoDatacenter";

const OS_PREFIXES: { prefix: string; count: number; migratable: boolean }[] = [
  { prefix: "rhel9-", count: 50, migratable: true },
  { prefix: "rhel8-", count: 20, migratable: true },
  { prefix: "win2022-", count: 6, migratable: true },
  { prefix: "win2019-", count: 5, migratable: true },
  { prefix: "win10-", count: 4, migratable: true },
  { prefix: "centos9-", count: 3, migratable: false },
  { prefix: "fedora-", count: 10, migratable: false },
  { prefix: "amazon-linux-", count: 5, migratable: false },
  { prefix: "ubuntu-", count: 3, migratable: false },
  { prefix: "suse-", count: 2, migratable: false },
  { prefix: "debian-", count: 1, migratable: false },
  { prefix: "other-linux-", count: 8, migratable: false },
  { prefix: "legacy-vm-", count: 3, migratable: false },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateMockVMs(): MockVirtualMachine[] {
  const vms: MockVirtualMachine[] = [];
  const rand = seededRandom(42);
  let vmIndex = 0;

  for (const { prefix, count, migratable } of OS_PREFIXES) {
    for (let i = 1; i <= count; i++) {
      const cluster = CLUSTERS[vmIndex % CLUSTERS.length];
      const poweredOn = rand() > 0.78;
      const diskGB = Math.round(20 + rand() * 480);
      const memoryGB = Math.pow(2, Math.floor(rand() * 4 + 1));
      const issues = migratable
        ? Math.floor(rand() * 3)
        : Math.floor(1 + rand() * 5);

      vms.push({
        name: `${prefix}${String(i).padStart(3, "0")}`,
        id: `vm-${String(vmIndex + 1000).padStart(5, "0")}`,
        vCenterState: poweredOn ? "poweredOn" : "poweredOff",
        cluster,
        datacenter: DATACENTER,
        diskSize: diskGB * 1024,
        memory: memoryGB * 1024,
        issueCount: issues,
        migratable,
      });

      vmIndex++;
    }
  }

  return vms;
}

export const EXAMPLE_OVA_VMS: MockVirtualMachine[] = generateMockVMs();
