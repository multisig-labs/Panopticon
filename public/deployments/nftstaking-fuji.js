const deployment = {
  avaURL: "https://api.avax-test.network",
  ethURL: "https://subnets.avax.network/ggp4/testnet/rpc",
  pExplorerURL: "https://subnets-test.avax.network/ggp4",
  cExplorerURL: "https://subnets-test.avax.network/ggp4",
  chain: {
    name: "ggp4-fuji",
    chainId: 69714,
    contracts: {
      multicall3: {
        address: "0xE806A9EDaAbC7c61Ee7819D98b7D864195530B6b",
      },
    },
  },
  EOALabels: {
    "0xe757FdF984e0e4F3B5cC2F049Dc4A3b228A10421": "deployer",
  },
  dashboard: [], // will merge in dashboard.json
  abis: {}, // will merge in abi.json
  addresses: {
    ValidatorManager: "0x0feedc0de0000000000000000000000000000000",
    NFTStakingManager: "0xdfd96c5848e09c226f7c1fb2a1e08e563c125779",
  },
};

async function deploymentFn() {
  deployment.abis = await fetch("/deployments/abi-fuji.json").then((res) => res.json());
  deployment.dashboard = await fetch("/deployments/dashboard.json").then((res) => res.json());
  return deployment;
}

export { deploymentFn };
