// Etherjs read-only interface to GoGoPool Protocol

import { utils as ethersUtils, providers, Contract, constants, BigNumber } from "https://esm.sh/ethers@5.7.2";
import { Contract as MCContract, Provider as MCProvider } from "https://esm.sh/ethcall@4.8.13";
import { MINIPOOL_STATUS_MAP, formatters, transformerFns, unfuckEthersObj } from "/js/utils.js";
import { minipoolsTransformer } from "/js/transformers.js";
import { DateTime } from "https://esm.sh/luxon@3.3.0";

// Hard-code reward cycle amounts
// Note we show the rewards for the *next* cycle amount
const REWARDS_TOTAL_NODEOP_POOL_AMT = {
  1: BigNumber.from("50629343838906640213406"),
  2: BigNumber.from("50832782764109674639470"),
  3: BigNumber.from("51037039147986861608379"),
  4: BigNumber.from("51242116275252192212662"),
  5: BigNumber.from("51448017443818301518451"),
  6: BigNumber.from("51654745964849503381680"),
  7: BigNumber.from("51862305162815038368864"),
  8: BigNumber.from("52070698375542535638786"),
  9: BigNumber.from("52279928954271689644796"),
  10: BigNumber.from("52490000263708152520974"),
  11: BigNumber.from("52700915682077643018745"),
  12: BigNumber.from("52912678601180272864145"),
};

const REWARDS_CYCLE_DURATION = 2592000; // 30 days
// Convert to eth
for (const k in REWARDS_TOTAL_NODEOP_POOL_AMT) {
  REWARDS_TOTAL_NODEOP_POOL_AMT[k] =
    REWARDS_TOTAL_NODEOP_POOL_AMT[k].mul(100000).div(constants.WeiPerEther).toNumber() / 100000;
}

class GoGoPool {
  // Required Params
  ethURL;
  chain;
  contracts;
  storage;
  multicall3;
  pandasia;
  // Optional Params
  EOALabels;
  transforms;
  dashboard;
  // Internal data
  provider;
  multicallProvider;
  minipoolsData;
  dashboardData;
  stakersData;
  isLoaded;
  statusesToFetch;

  // Deconstruct params from a DEPLOYMENT descriptor
  constructor({
    ethURL = this.required(),
    chain = this.required(),
    contracts = this.required(),
    storage = this.required(),
    multicall3 = this.required(),
    pandasia = this.required(),
    OonodzHardwareProvider,
    MinipoolStreamliner,
    EOALabels = {},
    transforms = [],
    dashboard = [],
  }) {
    Object.assign(this, {
      ethURL,
      chain,
      contracts,
      storage,
      multicall3,
      EOALabels,
      transforms,
      dashboard,
      pandasia,
      OonodzHardwareProvider,
      MinipoolStreamliner,
    });
    this.minipoolsData = [];
    this.dashboardData = [];
    this.stakersData = [];
    this.isLoaded = false;
    this.statusesToFetch = undefined;
  }

  // @return [{name: "Contract1", address: "0x123"}]
  getContracts() {
    const data = [];
    for (const c in this.contracts) {
      if (this.contracts[c].address) {
        data.push({ name: c, address: this.contracts[c].address });
      }
    }
    data.push({ name: "Multicall3", address: this.multicall3 });
    return data;
  }

  // Get addrs of contracts from storage, and if we have an ABI instantiate the contract as well
  async fetchContracts() {
    // Make a standard ethers provider (static means stop querying for chainid all the time)
    this.provider = new providers.StaticJsonRpcProvider(this.ethURL, this.chain);
    // Make a Multicall provider as well
    this.multicallProvider = new MCProvider();
    await this.multicallProvider.init(this.provider);
    this.multicallProvider.multicall3 = { address: this.multicall3 };

    // Get Storage contract, where we can look up other addresses
    this.contracts.Storage.address = this.storage;
    this.contracts.Storage.contract = await new Contract(this.storage, this.contracts.Storage.abi, this.provider);
    this.contracts.Storage.mccontract = await new MCContract(this.storage, this.contracts.Storage.abi);

    // Use multicall to Storage to get addrs in one swoop

    const contractNames = Object.keys(this.contracts).filter((n) => n !== "Storage");
    const getAddrCalls = [];

    for (const name of contractNames) {
      const args = ethersUtils.solidityKeccak256(["string", "string"], ["contract.address", name]);
      getAddrCalls.push(this.contracts.Storage.mccontract["getAddress"].call(this, args));
    }

    let results = [];

    for (let batch of this.getBatch(getAddrCalls)) {
      try {
        results = results.concat(await this.multicallProvider.tryAll(batch));
      } catch (err) {
        console.error(
          "ERROR in Multicall, so we dont know which call failed. Make sure Multicall3 addr is correct and check the /deployments descriptor.",
          err
        );
        console.error(batch);
      }
    }

    // Loop through all other contract names we have abis for
    for (let i = 0; i < contractNames.length; i++) {
      try {
        const name = contractNames[i];
        const addr = results[i];

        if (addr == constants.AddressZero) {
          console.log(`${name} not found in Storage`);
        } else {
          this.contracts[name].address = addr;
          // Make a standard ethers contract
          const contract = await new Contract(this.contracts[name].address, this.contracts[name].abi, this.provider);
          this.contracts[name].contract = contract;

          // Also make a MultiCall contract for use with 'ethcall'
          const mccontract = await new MCContract(this.contracts[name].address, this.contracts[name].abi);
          this.contracts[name].mccontract = mccontract;
        }
      } catch (e) {
        console.log(
          `error in getAddress, ensure that storage addr ${this.storage} points to a Storage contract. [${name}]`,
          e
        );
      }
    }
    if (this.contracts["Pandasia"]) {
      // if we have a pandasia contract, set the address
      this.contracts["Pandasia"].address = this.pandasia;
    }
    this.contracts["MinipoolStreamliner"].address = this.MinipoolStreamliner;
    this.contracts["OonodzHardwareProvider"].address = this.OonodzHardwareProvider;

    console.log(this.contracts);
    this.isLoaded = true;
  }

  // Uses multicall to grab all data defined in the dashboard from various contracts
  async fetchDashboardData() {
    await this.until((_) => this.isLoaded);

    const calls = [];

    for (const obj of this.dashboard) {
      const c = this.contracts[obj.contract].mccontract;
      for (const metric of obj.metrics) {
        try {
          calls.push(c[metric.fn].call(this, ...(metric.args || [])));
        } catch (err) {
          console.log("cant find fn in contract for metric:", metric);
        }
      }
    }

    let results = [];

    for (let batch of this.getBatch(calls)) {
      try {
        results = results.concat(await this.multicallProvider.tryAll(batch));
      } catch (err) {
        console.error(
          "ERROR in Multicall, so we dont know which call failed. Make sure Multicall3 addr is correct and check the /deployments descriptor.",
          err
        );
        console.error(batch);
      }
    }

    if (results.length == 0) return results;

    let i = 0;
    for (const obj of this.dashboard) {
      for (const metric of obj.metrics) {
        try {
          metric.rawValue = results[i];
          switch (typeof metric.formatter) {
            case "string":
              metric.value = formatters[metric.formatter].call(this, results[i]);
              break;
            case "function":
              metric.value = metric.formatter.call(this, results[i]);
              break;
            default:
              metric.value = results[i];
              break;
          }
          i++;
        } catch (err) {
          console.log("Error formatting metric", metric);
          metric.value = "err";
        }
      }
    }
    return this.dashboard;
  }

  rewardsCycleCount() {
    const ctrct = this.dashboard.filter((r) => r.contract === "RewardsPool")[0];
    const cycle = ctrct.metrics.filter((r) => r.fn === "getRewardsCycleCount")[0];
    return cycle.value.toNumber();
  }

  rewardsCycleStartTime() {
    const ctrct = this.dashboard.filter((r) => r.contract === "RewardsPool")[0];
    const cycle = ctrct.metrics.filter((r) => r.fn === "getRewardsCycleStartTime")[0];
    return cycle.value.toNumber();
  }

  dashboardValue(contract, metric) {
    return this.dashboard.find((obj) => obj.contract === contract).metrics.find((obj) => obj.fn === metric).rawValue;
  }

  // Reformat data shape to fit Tabulator table
  dashboardAsTabulatorData() {
    this.dashboardData = [];
    for (const obj of this.dashboard) {
      for (const metric of obj.metrics) {
        this.dashboardData.push({
          contract: obj.contract,
          address: this.contracts[obj.contract].address,
          title: metric.title ?? metric.fn,
          desc: metric.desc,
          value: metric.value,
        });
      }
    }
    return this.dashboardData;
  }

  async fetchMinipools() {
    const params = new URLSearchParams(document.location.search);
    if (params.get("status")) {
      this.statusesToFetch = params.get("status").split(",");
    } else {
      this.statusesToFetch = [0, 1, 2];
    }
    await this.until((_) => this.isLoaded);

    const totalMinipools = (await this.contracts.MinipoolManager.contract.getMinipoolCount()).toNumber();
    const pageSize = 400; // Number of minipools to fetch per page
    const maxTotalPages = Math.ceil(totalMinipools / pageSize);

    const promises = [];
    for (const status of this.statusesToFetch) {
      // Could get fancier here but we dont really know total count for each status so eh we end up throwing
      // more requests than we need. But they are parallel so its fast.
      const totalPagesForStatus = maxTotalPages;
      for (let pageIndex = 0; pageIndex < maxTotalPages; pageIndex++) {
        const startIndex = pageIndex * pageSize;
        promises.push(this.contracts.MinipoolManager.contract.getMinipools(status, startIndex, pageSize));
        // console.log(`fetch status ${status} start ${startIndex} pageSize ${pageSize}`);
      }
    }

    // Execute promises concurrently using Promise.all
    const results = await Promise.all(promises);
    this.minipoolsData = await minipoolsTransformer(results.flat());

    return this.minipoolsData;
  }

  minipoolsAsTabulatorData() {
    return this.minipoolsData;
  }

  launchCapacityData() {
    const ignoreNodes = {
      "NodeID-2wWroHMggzJvKh6t3tdPtJTTP9DNmdc4K": true,
      "NodeID-LUhB7mVaTMnkYLQsqf2RV2PUerJfsq2wW": true,
      "NodeID-LXpULpbU1A4AobEzCSBy6wYLEbogwsMK1": true,
      "NodeID-GpDhyVHYVaL8qXFB2a1QPBsXyUMZjiXLF": true,
    };
    const now = DateTime.now().startOf("day") / 1000;
    let stakingMPs = this.minipoolsData.filter(
      (mp) =>
        !ignoreNodes[mp.nodeID] && mp.status === "Staking" && mp.endTime > now && mp.endTime < now + 60 * 60 * 24 * 7
    );
    stakingMPs = stakingMPs.map((mp) => {
      return {
        date: DateTime.fromSeconds(mp.endTime),
        value: 1,
      };
    });

    // Add an element for each mp we could launch right now
    const amtAvail = parseFloat(
      this.dashboardAsTabulatorData().filter(
        (obj) => obj.contract === "TokenggAVAX" && obj.title === "amountAvailableForStaking"
      )[0].value
    );
    const mpAvail = Math.floor(amtAvail / 1000);
    // console.log(mpAvail);
    for (let i = 0; i < mpAvail; i++) {
      stakingMPs.push({
        date: DateTime.fromSeconds(now),
        value: 1,
      });
    }
    // console.log(stakingMPs);
    return stakingMPs;
  }

  async fetchStakers({ status } = { status: Object.keys(MINIPOOL_STATUS_MAP) }) {
    await this.until((_) => this.isLoaded);

    const rewardsCycleStartTime = (await this.contracts.RewardsPool.contract.getRewardsCycleStartTime()).toNumber();
    const rewardsCutoffTime = rewardsCycleStartTime + REWARDS_CYCLE_DURATION / 2;
    const rewardsCycleEndTime = rewardsCycleStartTime + REWARDS_CYCLE_DURATION;

    let allStakers = await this.contracts.Staking.contract.getStakers(0, 0);
    allStakers = allStakers.map(unfuckEthersObj);

    // if (stakerStartTime < cutoffDate && highWater > 0n && collatRatio > Tenth) {
    //   eligibility = "eligible";
    // } else if (stakerStartTime < cutoffDate && highWater === 0n && collatRatio > Tenth) {
    //   eligibility = "pending_launch";
    // } else {
    //   eligibility = "not_eligible";
    // }

    // Filter out stakers who have never run a minipool
    let eligibleStakers = allStakers.filter((s) => s.rewardsStartTime > 0);
    // Calc eligibility based on if they *will* be eligible for the next cycle
    eligibleStakers.forEach((s) => (s.isEligible = s.rewardsStartTime <= rewardsCutoffTime));
    console.log("eligibleStakers (pre enrichment)", eligibleStakers);

    // Define similiar structure as used in dashboard.js. Consolidate somehow, someday.
    const ethAsFloat = (v) => parseFloat(ethersUtils.formatEther(v || 0));
    const enrichments = [
      {
        contract: "Staking",
        metrics: [
          { fn: "getMinimumGGPStake", formatter: ethAsFloat },
          { fn: "getEffectiveRewardsRatio", formatter: ethAsFloat },
          { fn: "getCollateralizationRatio", formatter: ethAsFloat },
          { fn: "getEffectiveGGPStaked", formatter: ethAsFloat },
        ],
      },
      {
        contract: "TokenGGP",
        metrics: [{ fn: "balanceOf", formatter: ethAsFloat }],
      },
    ];

    // For each ELIGIBLE staker we want to call a couple contract funcs, so mush them all together for speed into batches
    const calls = [];
    for (const s of eligibleStakers) {
      for (const enrichment of enrichments) {
        const c = this.contracts[enrichment.contract].mccontract;
        for (const metric of enrichment.metrics) {
          try {
            calls.push(c[metric.fn].call(this, s.stakerAddr));
          } catch (err) {
            console.log("error calling enrichment:", enrichment, err);
          }
        }
      }
    }

    let results = [];
    for (let batch of this.getBatch(calls)) {
      try {
        results = results.concat(await this.multicallProvider.tryAll(batch));
      } catch (err) {
        console.error(
          "ERROR in Multicall, so we dont know which call failed. Make sure Multicall3 addr is correct and check the /deployments descriptor.",
          err
        );
        console.error(batch);
      }
    }

    const metrics = enrichments.map((e) => e.metrics).flat();

    // Now add the results of the batch to each staker
    const idFn = (v) => v;
    const l = metrics.length;
    for (const [index, s] of eligibleStakers.entries()) {
      metrics.forEach((metric, i) => {
        const rawValue = results[index * l + i];
        s[metric.fn] = (metric.formatter || idFn).call(this, rawValue);
      });
    }

    // So, I still want to show recently created minipool owners in the list, but since they are not yet eligible
    // we will nerf their rewards to zero
    // Also, we are assuming all prelaunch minipools will launch by rewards time
    eligibleStakers.forEach((s) => {
      // If they were eligible by time but their collat ratio is < 10%, then set them to not eligible
      if (s.getCollateralizationRatio < 0.1) s.isEligible = false;
      if (!s.isEligible) {
        console.log("notEligible", s);
        s.getEffectiveGGPStaked = 0;
        s.getEffectiveRewardsRatio = 0;
      }
    });

    // REWARDS CALCULATIONS

    const REWARDS_POOL_AMT = REWARDS_TOTAL_NODEOP_POOL_AMT[this.rewardsCycleCount() + 1]; // look forward to next cycle

    // Users share remainder of rewards pie
    const userTotalGGPStaked = eligibleStakers.reduce((acc, s) => acc + s.getEffectiveGGPStaked, 0);
    eligibleStakers.map((s) => {
      s.ggpUserRewardsPoolPct = s.getEffectiveGGPStaked / userTotalGGPStaked;
      s.ggpRewardsPoolAmt = REWARDS_POOL_AMT * s.ggpUserRewardsPoolPct;
      s.ggpRewardsPoolPct = s.ggpRewardsPoolAmt / REWARDS_POOL_AMT;
      // Lets calc how much GGP they would need to buy to max out rewards
      s.ggpReqToMax = 0;
      if (s.getCollateralizationRatio < 1.5) {
        s.ggpReqToMax = s.ggpStaked * (1.5 / s.getCollateralizationRatio) - s.ggpStaked - s.balanceOf - s.ggpRewards;
        if (s.ggpReqToMax < 0) s.ggpReqToMax = 0;
      }
    });

    console.log("eligibleStakers (post-enrichment)", eligibleStakers);

    const totalRewardsCheck = eligibleStakers.reduce((acc, s) => acc + s.ggpRewardsPoolAmt, 0);
    console.log("totalRewardsCheck", totalRewardsCheck);

    this.stakersData = eligibleStakers;
    return this.stakersData;
  }

  buyPressure() {
    return this.stakersData.reduce((acc, s) => acc + s.ggpReqToMax, 0);
  }

  stakersAsTabulatorData() {
    return this.stakersData;
  }

  // Helpers
  refreshDataLoop(fn) {
    const poll = async () => {
      await Promise.all([this.fetchDashboardData(), this.fetchMinipools(), this.fetchStakers()]);
      fn();
      setTimeout(poll, window.POLL_INTERVAL || 60 * 1000);
    };
    poll();
  }

  async isLoaded() {
    await this.until((_) => this.isLoaded);
  }

  required() {
    throw new Error("Missing argument.");
  }

  // usage: await until(_ => flag == true);
  until(conditionFunction) {
    const poll = (resolve) => {
      if (conditionFunction()) resolve();
      else setTimeout((_) => poll(resolve), 200);
    };

    return new Promise(poll);
  }

  *getBatch(records, batchsize = window.BATCHSIZE || 100) {
    while (records.length) {
      console.log("Yielding Batch of ", records.length);
      yield records.splice(0, batchsize);
    }
  }
}

export { GoGoPool };
