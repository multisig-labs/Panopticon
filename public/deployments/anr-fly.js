const deployment = {
  baseURLs: {
    ava: "https://anr.fly.dev",
    eth: "https://anr.fly.dev/ext/bc/C/rpc",
    orc: {
      url: "https://orchestrator.fly.dev",
      user: "admin",
      password: "sekret",
    },
  },
  chain: {
    name: "custom",
    chainId: 43112,
  },
  addresses: {
    Multicall: "0x3A07D36c8bA41d3d2464E48D836e654F75435C83",
    WAVAX: "0x4FeF9f4d231Ee924d47E0aF4f66dc63972d21bad",
    Storage: "0xAE77fDd010D498678FCa3cC23e6E11f120Bf576c",
    OneInchMock: "0xf1C1A8625e0e5645a1d30972eD42159772eFf2d5",
    Vault: "0xAC0b8Bb0cC456427Af85Dd4906123E4C0eCc36c9",
    Oracle: "0x7D9B78E545Ec4a11F72ceEC022CA00F488747dD9",
    ProtocolDAO: "0xc0154E9cBC75fBfcC357E5a25fB461498575462a",
    MultisigManager: "0x471277fDa89D4F08577477A10Ee1Ef484D3aA2Eb",
    TokenGGP: "0xfAbddBBf27Cd558EdBab042fA0bB2119c68194D1",
    TokenggAVAX: "0xBACA5746afe31E50B6428Dfa0e19C333718aE5F2",
    MinipoolManager: "0xFB7EC923a63c59300F0c3eBD164131C5cD97f339",
    RewardsPool: "0x0c8De90B0C8206A5f271B022a5C33Fa1dBA36097",
    ClaimNodeOp: "0x7209E192AA92D442314255142dcb834B34d0AEce",
    Staking: "0x3f1F12b672CEA8d9F798b43AF57Fbe4Ad9cbf8BD",
    ClaimProtocolDAO: "0xaF3713Bb5f365e8Bc7be6f0A0E713B1a2a4d87d0",
    Multicall3: "0x6E79E232E9Bcc6aeA69f3fA2C9afFC7D1C90Be44",
    Ocyticus: "0x86e8838cc9E85b8eAA1D5e1660E4bd748ADEF509",
  },
  contracts: {}, // will merge in contracts.json
  EOALabels: {
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
          fn: "getGGPPriceInAVAX",
          title: "GGP @ TS",
          desc: "GGP price in AVAX at a particular timestamp",
          formatter: "formatEtherAtTime",
        },
      ],
    },
    {
      contract: "RewardsPool",
      metrics: [
        { fn: "canStartRewardsCycle", desc: "" },
        { fn: "getRewardsCycleStartTime", formatter: "unixToISO" },
        { fn: "getRewardsCyclesElapsed", desc: "" },
        { fn: "getRewardsCycleTotalAmt", formatter: "formatEther" },
        { fn: "getInflationIntervalStartTime", formatter: "unixToISO" },
        { fn: "getInflationIntervalsElapsed" },
        { fn: "getInflationAmt", formatter: "formatInflationAmt" },
        {
          fn: "getClaimingContractDistribution",
          args: ["ClaimNodeOp"],
          title: "getClaimingContractDistribution (NodeOp)",
          formatter: "formatEtherPct",
        },
        {
          fn: "getClaimingContractDistribution",
          args: ["ClaimProtocolDAO"],
          title: "getClaimingContractDistribution (DAO)",
          formatter: "formatEtherPct",
        },
        {
          fn: "getClaimingContractDistribution",
          args: ["ClaimNodeOp"],
          title: "getClaimingContractDistribution (NodeOp)",
          formatter: "formatEther",
        },
        {
          fn: "getClaimingContractDistribution",
          args: ["ClaimProtocolDAO"],
          title: "getClaimingContractDistribution (DAO)",
          formatter: "formatEther",
        },
      ],
    },
    {
      contract: "MinipoolManager",
      metrics: [
        {
          fn: "getTotalAVAXLiquidStakerAmt",
          desc: "total AVAX *actually* withdrawn from ggAVAX and sent to Rialto",
          formatter: "formatEther",
        },
      ],
    },
    {
      contract: "ProtocolDAO",
      metrics: [
        { fn: "getRewardsEligibilityMinSeconds", desc: "" },
        {
          fn: "getRewardsCycleSeconds",
          desc: "Seconds",
        },
        {
          fn: "getTotalGGPCirculatingSupply",
          desc: "",
          formatter: "formatEther",
        },
        // Needs an arg, wat do?
        // { fn: "getClaimingContractPerc" },
        { fn: "getInflationIntervalRate", desc: "" },
        { fn: "getInflationIntervalSeconds", desc: "Seconds" },
        { fn: "getMinipoolMinAVAXStakingAmt", formatter: "formatEther" },
        { fn: "getMinipoolNodeCommissionFeePct", desc: "", formatter: "formatEtherPct" },
        { fn: "getMinipoolMaxAVAXAssignment", formatter: "formatEther" },
        { fn: "getMinipoolMinAVAXAssignment", formatter: "formatEther" },
        { fn: "getExpectedAVAXRewardsRate", desc: "", formatter: "formatEtherPct" },
        { fn: "getMaxCollateralizationRatio", desc: "", formatter: "formatEtherPct" },
        { fn: "getMinCollateralizationRatio", desc: "", formatter: "formatEtherPct" },
        { fn: "getTargetGGAVAXReserveRate", desc: "", formatter: "formatEtherPct" },
      ],
    },
    {
      contract: "TokenggAVAX",
      metrics: [
        { fn: "totalAssets", desc: "friendly desc", formatter: "formatEther" },
        { fn: "lastSync", desc: null, formatter: "unixToISO" },
        { fn: "rewardsCycleEnd", desc: null, formatter: "unixToISO" },
        { fn: "lastRewardsAmt", desc: null, formatter: "formatEther" },
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
    {
      contract: "Storage",
      metrics: [
        {
          fn: "getGuardian",
          title: "Guardian",
          desc: "Address of current Guardian",
        },
      ],
    },
  ],
};

import c from "./contracts.json" assert { type: "json" };

async function deploymentFn() {
  deployment.contracts = c;
  return deployment;
}

export { deploymentFn };
