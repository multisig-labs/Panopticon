// Etherjs read-only interface to GoGoPool Protocol

import { utils as ethersUtils, providers, Contract } from "https://cdn.skypack.dev/ethers";
import { Contract as MCContract, Provider as MCProvider } from "https://cdn.skypack.dev/ethcall";
import { MINIPOOL_STATUS_MAP, formatters } from "/js/utils.js";
import { transformer } from "/js/transformer.js";

class GoGoPool {
  // Required Params
  addresses;
  abis;
  // Optional Params
  chain;
  rpc;
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
  isLoaded;

  // Deconstruct parms from a DEPLOYMENT descriptor
  constructor({
    addresses = this.required(),
    abis = this.required(),
    chain = this.required(),
    rpc = this.required(),
    dashboard = [],
    transforms = [],
    addressLabels = {},
  }) {
    Object.assign(this, {
      addresses,
      abis,
      chain,
      rpc,
      dashboard,
      transforms,
      addressLabels,
    });
    this.contracts = {};
    this.mccontracts = {};
    this.minipoolsData = [];
    this.dashboardData = [];
    this.isLoaded = false;
  }

  async fetchContracts() {
    // Make a standard ethers provider
    this.provider = new providers.JsonRpcProvider(this.rpc, this.chain);
    // Make a Multicall provider as well
    this.multicallProvider = new MCProvider();
    await this.multicallProvider.init(this.provider);

    // Get Storage contract, where we can look up other addresses
    this.contracts.Storage = await new Contract(this.addresses.Storage, this.abis.Storage.abi, this.provider);
    this.mccontracts.Storage = await new MCContract(this.addresses.Storage, this.abis.Storage.abi);

    // Loop through all other contract names we have abis for
    for (const name of Object.keys(this.abis)) {
      if (name === "Storage") continue;
      try {
        const address = await this.contracts.Storage.getAddress(
          ethersUtils.solidityKeccak256(["string", "string"], ["contract.address", name])
        );
        this.addresses[name] = address;

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
        calls.push(c[metric.fn].call(this, ...(metric.args || [])));
      }
    }

    let results;
    try {
      results = await this.multicallProvider.tryAll(calls);
    } catch (err) {
      console.error("ERROR in Multicall, so we dont know which call failed. Check your deployment descriptor.");
    }
    // console.log("Multicall Results", results);
    if (!results) return [];

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
    while (this.dashboardData.length > 0) {
      this.dashboardData.pop();
    }
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

  // Helpers
  refreshDataLoop(fn) {
    const poll = async () => {
      // console.log("Polling for data");
      await this.fetchDashboardData();
      await this.fetchMinipools();
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

  // await until(_ => flag == true);
  until(conditionFunction) {
    const poll = (resolve) => {
      if (conditionFunction()) resolve();
      else setTimeout((_) => poll(resolve), 200);
    };

    return new Promise(poll);
  }
}

export { GoGoPool };
