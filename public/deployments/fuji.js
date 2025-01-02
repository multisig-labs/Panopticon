const deployment = {
  // avaURL: "http://fuji.multisiglabs.org",
  // ethURL: "http://fuji.multisiglabs.org/ext/bc/C/rpc",
  avaURL: "https://api.avax-test.network",
  ethURL: "https://api.avax-test.network/ext/bc/C/rpc",
  orcURL: "http://18.222.246.33:9000",
  pExplorerURL: "https://subnets-test.avax.network/p-chain/tx/",
  cExplorerURL: "https://testnet.snowtrace.io/",
  pandasiaURL: "https://api-test.pandasia.io/",
  chain: {
    name: "fuji",
    chainId: 43113,
  },
  storage: "0x399D78327E665D21c8B9582D4843CA5DCA0e7dc4",
  multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
  EOALabels: {
    "0x5d4d83e6743c868B2b4565B2c72845cDEfF37421": "deployer",
  },
  contracts: {}, // will merge in contracts.json
  dashboard: [], // will merge in dashboard.json,
  pandasia: "0x930BfF0eaa8B6056ade39C94bf8082187FA0B991",
  ArtifactHardwareProvider: "0xd68922cB57Ff95F705405553A92aaD8746A55F88",
};

async function deploymentFn() {
  deployment.contracts = await fetch("/deployments/contracts-fuji.json").then((res) => res.json());
  deployment.dashboard = await fetch("/deployments/dashboard.json").then((res) => res.json());
  return deployment;
}

export { deploymentFn };
