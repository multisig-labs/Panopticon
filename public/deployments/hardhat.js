const deployment = {
  avaURL: null,
  ethURL: "http://localhost:8545",
  orcURL: null,
  chain: {
    name: "localhost",
    chainId: 31337,
  },
  contracts: {}, // will merge in contracts.json
  storage: "0xAE77fDd010D498678FCa3cC23e6E11f120Bf576c",
  multicall3: "0x6E79E232E9Bcc6aeA69f3fA2C9afFC7D1C90Be44",
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
        { fn: "getMinipoolMinStakingAmt", formatter: "formatEther" },
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

async function deploymentFn() {
  deployment.contracts = await fetch("/deployments/contracts.json").then((res) => res.json());
  return deployment;
}

export { deployment, deploymentFn };
