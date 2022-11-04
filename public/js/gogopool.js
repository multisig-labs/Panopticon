// Etherjs read-only interface to GoGoPool Protocol

import { utils as ethersUtils, providers, Contract } from "https://cdn.skypack.dev/ethers";
import { Contract as MCContract, Provider as MCProvider } from "https://cdn.skypack.dev/ethcall";
import { DateTime } from "https://cdn.skypack.dev/luxon";
import { MINIPOOL_STATUS_MAP, formatters } from "/js/utils.js";
import { transformer } from "/js/transformer.js";

class GoGoPool {
  // Required Params
  addresses;
  chain;
  contracts;
  rpc;
  // Optional Params
  addressLabels;
  dashboard;
  transforms;
  // Internal data
  contracts;
  mccontracts;
  provider;
  multicallProvider;
  minipoolsData;
  dashboardData;
  stakersData;
  isLoaded;

  // Deconstruct parms from a DEPLOYMENT descriptor
  constructor({
    addresses = this.required(),
    chain = this.required(),
    contracts = this.required(),
    rpc = this.required(),
    dashboard = [],
    transforms = [],
    addressLabels = {},
  }) {
    Object.assign(this, {
      addresses,
      chain,
      contracts,
      rpc,
      dashboard,
      transforms,
      addressLabels,
    });
    this.contracts = {};
    this.mccontracts = {};
    this.minipoolsData = [];
    this.dashboardData = [];
    this.stakersData = [];
    this.isLoaded = false;
  }

  getContracts() {
    const data = [];
    for (const c in this.contracts) {
      data.push({ name: c, address: this.addresses[c] });
    }
    console.log(data);
    return data;
  }

  // Get addrs of contracts from storage, and if we have an ABI instantiate the contract as well
  async fetchContracts() {
    // Make a standard ethers provider (static means stop querying for chainid all the time)
    this.provider = new providers.StaticJsonRpcProvider(this.rpc, this.chain);
    // Make a Multicall provider as well
    this.multicallProvider = new MCProvider();
    await this.multicallProvider.init(this.provider);
    this.multicallProvider.multicall3 = { address: this.addresses.Multicall3 };

    // Get Storage contract, where we can look up other addresses
    this.contracts.Storage = await new Contract(this.addresses.Storage, this.abis.Storage.abi, this.provider);
    this.mccontracts.Storage = await new MCContract(this.addresses.Storage, this.abis.Storage.abi);

    // Loop through all other contract names we have abis for
    for (const name of this.contractNames) {
      if (name === "Storage") continue;
      try {
        const address = await this.contracts.Storage.getAddress(
          ethersUtils.solidityKeccak256(["string", "string"], ["contract.address", name])
        );
        // If we have an address (like multicall3) then dont look in storage
        this.addresses[name] = this.addresses[name] || address;

        // Make a standard ethers contract
        const contract = await new Contract(this.addresses[name], this.abis[name].abi, this.provider);
        this.contracts[name] = contract;

        // Also make a MultiCall contract for use with 'ethcall'
        const mccontract = await new MCContract(this.addresses[name], this.abis[name].abi);
        this.mccontracts[name] = mccontract;
      } catch (e) {
        console.log(`error [${name}]`, e);
      }
    }

    this.isLoaded = true;
  }

  // Uses multicall to grab all data defined in the dashboard from various contracts
  async fetchDashboardData() {
    await this.until((_) => this.isLoaded);

    const calls = [];

    for (const obj of this.dashboard) {
      const c = this.mccontracts[obj.contract];
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
          address: this.addresses[obj.contract],
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

    const promises = status.map((s) => this.contracts.MinipoolManager.getMinipools(s, 0, 0));
    const results = await Promise.all(promises);
    this.minipoolsData = await transformer(this.transforms.minipool, this.addressLabels, results.flat());
    // console.log("Minipools", this.minipoolsData);
    return this.minipoolsData;
  }

  minipoolsAsTabulatorData() {
    return this.minipoolsData;
  }

  async fetchStakers({ status } = { status: Object.keys(MINIPOOL_STATUS_MAP) }) {
    await this.until((_) => this.isLoaded);

    const results = await this.contracts.Staking.getStakers(0, 0);
    this.stakersData = await transformer(this.transforms.staker, this.addressLabels, results);
    // Because names are not consistent we do it manually
    this.stakersData.map((s) => {
      s.ggpStaked = ethersUtils.formatEther(s.ggpStaked);
      s.avaxStaked = ethersUtils.formatEther(s.avaxStaked);
      s.avaxAssigned = ethersUtils.formatEther(s.avaxAssigned);
      s.ggpRewards = ethersUtils.formatEther(s.ggpRewards);
      s.rewardsStartTime = DateTime.fromSeconds(s.rewardsStartTime.toNumber());
    });
    // console.log("Stakers", this.stakersData);
    return this.stakersData;
  }

  stakersAsTabulatorData() {
    return this.stakersData;
  }
  stakersData;

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

  *getBatch(records, batchsize = 50) {
    while (records.length) {
      yield records.splice(0, batchsize);
    }
  }
}

export { GoGoPool };
