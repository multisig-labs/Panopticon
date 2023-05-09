const deployment = {
  // avaURL: "http://fuji.multisiglabs.org",
  // ethURL: "http://fuji.multisiglabs.org/ext/bc/C/rpc",
  avaURL: "https://api.avax-test.network",
  ethURL: "https://api.avax-test.network/ext/bc/C/rpc",
  orcURL: "https://orchestrator-fuji.fly.dev",
  pExplorerURL: "https://api.avax-test.network",
  cExplorerURL: "https://api.avax-test.network",
  chain: {
    name: "fuji",
    chainId: 43113,
  },
  storage: "0x26952d1aa2DEC9d69fef96d9AD8A9D8944C37cE2",
  multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
  EOALabels: {
    "0x5d4d83e6743c868B2b4565B2c72845cDEfF37421": "deployer",
  },
  contracts: {}, // will merge in contracts.json
  dashboard: [], // will merge in dashboard.json
};

async function deploymentFn() {
  deployment.contracts = await fetch("/deployments/contracts.json").then((res) => res.json());
  deployment.dashboard = await fetch("/deployments/dashboard.json").then((res) => res.json());
  return deployment;
}

export { deploymentFn };
