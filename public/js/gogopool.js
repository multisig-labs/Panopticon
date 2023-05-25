// Etherjs read-only interface to GoGoPool Protocol

import { utils as ethersUtils, providers, Contract, constants, BigNumber } from "https://esm.sh/ethers@5.7.2";
import { Contract as MCContract, Provider as MCProvider } from "https://esm.sh/ethcall@4.8.13";
import { MINIPOOL_STATUS_MAP, formatters, stripNumberKeys, bigToNumber } from "/js/utils.js";
import { minipoolTransformer } from "/js/transformers.js";

// Hard-code reward cycle amounts
const REWARDS_TOTAL_NODEOP_POOL_AMT = {
  0: BigNumber.from("50629343838906640213406"),
  1: BigNumber.from("50832782764109674639470"),
  2: BigNumber.from("51037039147986861608379"),
  3: BigNumber.from("51242116275252192212662"),
  4: BigNumber.from("51448017443818301518451"),
  5: BigNumber.from("51654745964849503381680"),
  6: BigNumber.from("51862305162815038368864"),
  7: BigNumber.from("52070698375542535638786"),
  8: BigNumber.from("52279928954271689644796"),
  9: BigNumber.from("52490000263708152520974"),
  10: BigNumber.from("52700915682077643018745"),
  11: BigNumber.from("52912678601180272864145"),
};

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

  // Deconstruct params from a DEPLOYMENT descriptor
  constructor({
    ethURL = this.required(),
    chain = this.required(),
    contracts = this.required(),
    storage = this.required(),
    multicall3 = this.required(),
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
    });
    this.minipoolsData = [];
    this.dashboardData = [];
    this.stakersData = [];
    this.isLoaded = false;
  }

  // @return [{name: "Contract1", address: "0x123"}]
  getContracts() {
    const data = [];
    for (const c in this.contracts) {
      data.push({ name: c, address: this.contracts[c].address });
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

    // Loop through all other contract names we have abis for
    for (const name of Object.keys(this.contracts)) {
      if (name === "Storage") continue;
      try {
        const addr = await this.contracts.Storage.contract.getAddress(
          ethersUtils.solidityKeccak256(["string", "string"], ["contract.address", name])
        );

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

  async fetchMinipools({ status } = { status: Object.keys(MINIPOOL_STATUS_MAP) }) {
    await this.until((_) => this.isLoaded);

    const promises = status.map((s) => this.contracts.MinipoolManager.contract.getMinipools(s, 0, 0));
    const results = await Promise.all(promises);
    this.minipoolsData = await minipoolTransformer(results.flat());
    console.log("Minipools", this.minipoolsData);
    return this.minipoolsData;
  }

  minipoolsAsTabulatorData() {
    return this.minipoolsData;
  }

  async fetchStakers({ status } = { status: Object.keys(MINIPOOL_STATUS_MAP) }) {
    await this.until((_) => this.isLoaded);

    let eligibleStakers = await this.contracts.Staking.contract.getStakers(0, 0);
    eligibleStakers = eligibleStakers
      .filter((s) => s.rewardsStartTime.gt(0) && s.avaxValidatingHighWater.gt(0))
      .map((s) => Object.assign({}, s)) // ethers gives us weird obj, make it a normal one
      .map(stripNumberKeys); // ethers obj has redundant keys like "1": ..., "2": ... Get rid of them for God's sake

    // For each ELIGIBLE staker we want to call a couple funcs, so mush them all together for speed into batches
    const calls = [];
    const fns = [
      "getMinimumGGPStake",
      "getEffectiveRewardsRatio",
      "getCollateralizationRatio",
      "getEffectiveGGPStaked",
    ];

    for (const s of eligibleStakers) {
      const c = this.contracts["Staking"].mccontract;
      for (const fn of fns) {
        try {
          // Un-label the addr argh
          const addr = s.stakerAddrHex || s.stakerAddr;
          calls.push(c[fn].call(this, addr));
        } catch (err) {
          console.error("error calling fn", fn, err);
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

    // Now add the results of the batch to each staker
    const l = fns.length;
    for (const [index, s] of eligibleStakers.entries()) {
      fns.forEach((fnName, i) => {
        s[fnName] = results[index * l + i];
      });
    }

    // Convert BigNums to numbers (taking into account AVAX/GGP which are in Wei)
    eligibleStakers = eligibleStakers.map(bigToNumber);
    console.log("eligibleStakers", eligibleStakers);
    // return;

    // REWARDS CALCULATIONS
    // Should probably extract this to a generic JS class for reuse

    const INVESTOR_ADDRS = {
      "0xFE5200De605AdCB6306F4CDed77f9A8D9FD47127": true,
      // "0x443FaaE0354c0dC34681b92a6a9e252F4E89D54d": true,
    };
    const INVESTOR_REWARDS_SHARE = 0.1;
    const REWARDS_POOL_AMT = REWARDS_TOTAL_NODEOP_POOL_AMT[this.rewardsCycleCount()];

    // Make 2 groups, investors and users. (do math in regular numbers)
    const investors = eligibleStakers.filter((s) => INVESTOR_ADDRS[s.stakerAddr]);
    const users = eligibleStakers.filter((s) => !INVESTOR_ADDRS[s.stakerAddr]);

    // Investors share 10% of rewards pie
    const investorTotalGGPStaked = investors.reduce((acc, s) => acc + s.getEffectiveGGPStaked, 0);
    investors.map((s) => {
      s.ggpInvestorRewardsPoolPct = s.getEffectiveGGPStaked / investorTotalGGPStaked;
      s.ggpRewardsPoolAmt = REWARDS_POOL_AMT * INVESTOR_REWARDS_SHARE * s.ggpInvestorRewardsPoolPct;
      s.ggpRewardsPoolPct = s.ggpRewardsPoolAmt / REWARDS_POOL_AMT;
    });

    // Users share 90% of rewards pie
    const userTotalGGPStaked = users.reduce((acc, s) => acc + s.getEffectiveGGPStaked, 0);
    users.map((s) => {
      s.ggpUserRewardsPoolPct = s.getEffectiveGGPStaked / userTotalGGPStaked;
      s.ggpRewardsPoolAmt = REWARDS_POOL_AMT * (1 - INVESTOR_REWARDS_SHARE) * s.ggpUserRewardsPoolPct;
      s.ggpRewardsPoolPct = s.ggpRewardsPoolAmt / REWARDS_POOL_AMT;
    });

    const totalRewardsCheck = eligibleStakers.reduce((acc, s) => acc + s.ggpRewardsPoolAmt, 0);
    console.log("totalRewardsCheck", totalRewardsCheck);

    this.stakersData = eligibleStakers;
    return this.stakersData;
  }

  stakersAsTabulatorData() {
    return this.stakersData;
  }

  // Helpers
  refreshDataLoop(fn) {
    const poll = async () => {
      // console.log("Polling for data");
      await this.fetchDashboardData();
      await this.fetchMinipools();
      await this.fetchStakers();
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
      console.log("Yielding", records.length);
      yield records.splice(0, batchsize);
    }
  }
}

export { GoGoPool };
