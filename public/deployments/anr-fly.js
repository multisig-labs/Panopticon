// Only chrome supports this syntax, dang it
// import Storage from "/contracts/Storage.sol/Storage.json" assert { type: "json" };
// import MinipoolManager from "/contracts/MinipoolManager.sol/MinipoolManager.json" assert { type: "json" };
// import TokenggAVAX from "/contracts/TokenggAVAX.sol/TokenggAVAX.json" assert { type: "json" };
// import Oracle from "/contracts/Oracle.sol/Oracle.json" assert { type: "json" };
// import Staking from "/contracts/Staking.sol/Staking.json" assert { type: "json" };

// const abis = {
//   Storage,
//   MinipoolManager,
//   TokenggAVAX,
//   Oracle,
//   Staking,
// };

const deployment = {
  host: "https://anr.fly.dev",
  rpc: "https://anr.fly.dev/ext/bc/C/rpc",
  chain: {
    name: "custom",
    chainId: 43112,
  },
  // abis, // On Chrome we could just do this.
  abis: {},
  addresses: {
    Storage: "0xAE77fDd010D498678FCa3cC23e6E11f120Bf576c",
  },
  addressLabels: {
    "0xE992bAb78A4901f4AF1C3356a9c6310Da0BA8bee": "nodeOp1",
    "0xB654A60A22b9c307B4a0B8C200CdB75A78c4187c": "rialto",
    "0xC70f1A9B1CBb13C7fF1A8a847f8EF188d89730e0": "alice",
    "0xcF14BAa2352770904C2BB17783FFf2a92C48bf7a": "bob",
    "0xCC1cc77F3E1F122C00D1Db7BCc52f3504B9BbBcB": "cam",
    "0xAb755865Ba9516097fB9421b8FaF1DC9d1BA4B45": "deployer",
  },
  dashboard: [
    {
      contract: "Oracle",
      metrics: [
        {
          fn: "getGGPPrice",
          title: "GGP @ TS",
          desc: "GGP price in AVAX at a particular timestamp",
          formatter: "formatEtherAtTime",
        },
      ],
    },
    { contract: "MinipoolManager", metrics: [] },
    {
      contract: "TokenggAVAX",
      metrics: [
        { fn: "totalAssets", desc: "friendly desc", formatter: "formatEther" },
        { fn: "lastSync", desc: null, formatter: "unixToISO" },
        { fn: "rewardsCycleEnd", desc: null, formatter: "unixToISO" },
        { fn: "lastRewardAmount", desc: null, formatter: "formatEther" },
        { fn: "totalReleasedAssets", desc: null, formatter: "formatEther" },
        { fn: "stakingTotalAssets", desc: null, formatter: "formatEther" },
        {
          fn: "amountAvailableForStaking",
          desc: null,
          formatter: "formatEther",
        },
      ],
    },
    {
      contract: "Staking",
      metrics: [
        {
          fn: "getTotalGGPStake",
          title: "Total GGP Stake",
          desc: "Total GGP in vault assigned to the Staking contract",
          formatter: "formatEther",
        },
        {
          fn: "getStakerCount",
          title: "Staker Count",
          desc: "",
          formatter: "bigToNumber",
        },
      ],
    },
  ],
};

export default deployment;

// HACK Since only Chrome has the above "assert" syntax
const contracts = [
  "Storage",
  "MinipoolManager",
  "TokenggAVAX",
  "Oracle",
  "Staking",
];

export async function deploymentFn() {
  async function fetchABIs(names) {
    const abis = {};
    const promises = names.map((name) =>
      fetch(`/contracts/${name}.sol/${name}.json`).then((res) => res.json())
    );
    const responses = await Promise.all(promises);
    for (let i = 0; i < contracts.length; i++) {
      abis[contracts[i]] = responses[i];
    }
    return abis;
  }

  deployment.abis = await fetchABIs(contracts);
  return deployment;
}
