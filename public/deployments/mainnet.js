const deployment = {
  avaURL: "https://api.avax.network",
  ethURL: "https://api.avax.network/ext/bc/C/rpc",
  orcURL: "https://rialto-orc.scorpion-scala.ts.net",
  pExplorerURL: "https://api.avax.network",
  cExplorerURL: "https://snowtrace.io/",
  chain: {
    name: "ava-mainnet",
    chainId: 43114,
  },
  storage: "0x1cEa17F9dE4De28FeB6A102988E12D4B90DfF1a9",
  multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
  EOALabels: {
    "0xf5c149aCB200f5BC8FC5e51dF4a7DEf38d64cfB2": "deployer",
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
