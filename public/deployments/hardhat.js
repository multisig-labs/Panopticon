const deployment = {
  avaURL: null,
  ethURL: "http://localhost:8545",
  orcURL: null,
  pExplorerURL: null,
  cExplorerURL: null,
  chain: {
    name: "custom",
    chainId: 43112,
  },
  storage: "0xbf81Dc1F4a38D63c93dfb10b9b8819cF60180F1e",
  multicall3: "0x02871815f996Ebe1473A1C24F0dacF0f6965dB5F",
  EOALabels: {
    "0xE992bAb78A4901f4AF1C3356a9c6310Da0BA8bee": "nodeOp1",
    "0xB654A60A22b9c307B4a0B8C200CdB75A78c4187c": "rialto",
    "0xC70f1A9B1CBb13C7fF1A8a847f8EF188d89730e0": "alice",
    "0xcF14BAa2352770904C2BB17783FFf2a92C48bf7a": "bob",
    "0xCC1cc77F3E1F122C00D1Db7BCc52f3504B9BbBcB": "cam",
    "0xAb755865Ba9516097fB9421b8FaF1DC9d1BA4B45": "deployer",
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
