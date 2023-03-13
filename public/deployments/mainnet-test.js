const deployment = {
  avaURL: "https://api.avax.network",
  ethURL: "https://api.avax.network/ext/bc/C/rpc",
  orcURL: "https://orchestrator-mainnet-test.fly.dev",
  pExplorerURL: "https://api.avax.network",
  cExplorerURL: "https://api.avax.network",
  chain: {
    name: "mainnet-test",
    chainId: 43114,
  },
  storage: "0x4C3eD8Fee9C9f34161781Cf1385af7C5cfc6f6D7",
  multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
  EOALabels: {
    "0xD5d605B22D4d960A3c76D5f69b576F8AD2ccF5F0": "deployer",
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
