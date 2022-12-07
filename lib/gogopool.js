// Etherjs read-only interface to GoGoPool Protocol

import { utils as ethersUtils, providers, Contract, constants } from "https://cdn.skypack.dev/ethers";
import { Contract as MCContract, Provider as MCProvider } from "https://cdn.skypack.dev/ethcall";
// import { DateTime } from "https://cdn.skypack.dev/luxon";
import { MINIPOOL_STATUS_MAP, formatters } from "./utils.js";
import { minipoolTransformer, stakerTransformer } from "./transformers.js";

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
        } catch {
          console.log("cant find fn in contract for metric:", metric);
        }
      }
    }

    let results = [];

    for (const batch of this.getBatch(calls)) {
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
      }
    }
    return this.dashboard;
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

  async fetchStakers({ _status } = { status: Object.keys(MINIPOOL_STATUS_MAP) }) {
    await this.until((_) => this.isLoaded);

    let results = await this.contracts.Staking.contract.getStakers(0, 0);
    this.stakersData = await stakerTransformer(results);

    // For each staker we want to call a couple funcs, so mush them all together for speed into batches
    const calls = [];
    const fns = [
      "getMinimumGGPStake",
      "getEffectiveRewardsRatio",
      "getCollateralizationRatio",
      "getAVAXAssignedHighWater",
    ];

    for (const s of this.stakersData) {
      const c = this.contracts["Staking"].mccontract;
      for (const fn of fns) {
        try {
          // Un-label the addr argh
          const addr = s.stakerAddrHex || s.stakerAddr;
          calls.push(c[fn].call(this, addr));
        } catch (err) {
          console.log("error", err);
        }
      }
    }

    results = [];

    for (const batch of this.getBatch(calls)) {
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
    for (const [index, s] of this.stakersData.entries()) {
      s.getMinimumGGPStake = results[index * 3];
      s.getEffectiveRewardsRatio = results[index * 3 + 1];
      s.getCollateralizationRatio = results[index * 3 + 2];
      s.getAVAXAssignedHighWater = results[index * 3 + 3];
    }
    // console.log("Stakers", this.stakersData);
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
      setTimeout(poll, 5000);
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

  *getBatch(records, batchsize = window.BATCHSIZE || 50) {
    while (records.length) {
      yield records.splice(0, batchsize);
    }
  }
}

export { GoGoPool };
