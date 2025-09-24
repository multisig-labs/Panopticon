const deployment = {
  avaURL: "https://api.avax.network",
  ethURL: "https://api.avax.network/ext/bc/C/rpc",
  orcURL: "https://rialto-orc.scorpion-scala.ts.net",
  pExplorerURL: "https://subnets.avax.network/p-chain/tx/",
  cExplorerURL: "https://snowtrace.io/",
  pandasiaURL: "https://api.pandasia.io/",
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
  addresses: {
    // of contracts not in storage
    pandasia: "0x5746c7210f668e2aFc7D572C39Ff2f61a1FA593B",
    MinipoolStreamliner: "0x8C05D78066431C3b11bBFB6f3546fD3F1396115C",
    OonodzHardwareProvider: "0xfE6ca6cD383d1e213f5d1015dD0BB35275E8Fe3E",
    WithdrawQueue: "0x61f908D4992a790A2792D3C36850B4b9eB5849A3",
    WAVAX: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
  },
};

async function deploymentFn() {
  deployment.contracts = await fetch("/deployments/contracts-mainnet.json").then((res) => res.json());
  deployment.dashboard = await fetch("/deployments/dashboard.json").then((res) => res.json());
  // Hack in Pandasia ABIs
  const pandasiaAbi = await fetch("/deployments/pandasia-abi.json").then((res) => res.json());
  deployment.contracts.Pandasia = pandasiaAbi;
  return deployment;
}

export { deploymentFn };
