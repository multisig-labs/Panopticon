// Etherjs read-only interface to GoGoPool Protocol

import { DateTime } from "https://cdn.skypack.dev/luxon";
import { utils as ethersUtils, providers, Contract } from "https://cdn.skypack.dev/ethers";
import { Contract as MCContract, Provider as MCProvider } from "https://cdn.skypack.dev/ethcall";
import { MINIPOOL_STATUS_MAP, formatters, cb58Encode, makeRpc } from "/js/utils.js";

async function transformMinipools(mps, labels = {}) {
  // etherjs sends an obj with unnecessary data
  function stripNumberKeys(obj) {
    const newObj = Object.assign({}, obj);
    for (const k of Object.keys(newObj)) {
      if (k.match("[0-9]+")) {
        delete newObj[k];
      }
    }
    return newObj;
  }

  function labelAddresses(obj, labels) {
    const newObj = Object.assign({}, obj);
    for (const [k, v] of Object.entries(newObj)) {
      if (typeof v === "string" && labels[v]) {
        newObj[k] = labels[v];
      }
    }
    return newObj;
  }

  function formatEther(obj) {
    const newObj = Object.assign({}, obj);
    for (const k of Object.keys(newObj)) {
      if (k.match("Amt$")) {
        newObj[k] = ethersUtils.formatEther(newObj[k]);
      }
    }
    return newObj;
  }

  function bigToNum(obj) {
    const newObj = Object.assign({}, obj);
    for (const k of Object.keys(newObj)) {
      if (newObj[k].constructor.name === "BigNumber") {
        newObj[k] = newObj[k].toNumber();
      }
    }
    return newObj;
  }

  function unixToISO(obj) {
    const newObj = Object.assign({}, obj);
    for (const k of Object.keys(newObj)) {
      if (k.match("Time$")) {
        newObj[k] = DateTime.fromSeconds(newObj[k]);
      }
    }
    return newObj;
  }

  function addStatusName(obj) {
    const newObj = Object.assign({}, obj);
    newObj.statusName = MINIPOOL_STATUS_MAP[newObj.status];
    return newObj;
  }

  function decodeErrorMsg(obj) {
    const newObj = Object.assign({}, obj);
    newObj.errorMsg = ethersUtils.toUtf8String(ethersUtils.stripZeros(newObj.errorCode));
    return newObj;
  }

  async function encodeNodeID(obj) {
    const newObj = Object.assign({}, obj);
    newObj.nodeAddr = obj.nodeID;
    const b = ethersUtils.arrayify(ethersUtils.getAddress(newObj.nodeAddr));
    const bec = await cb58Encode(b);
    newObj.nodeID = `NodeID-${bec}`;
    return newObj;
  }

  // Stored as 0x123 but its a P-chain tx so we need CB58
  async function encodeTxID(obj) {
    const newObj = Object.assign({}, obj);
    const b = ethersUtils.arrayify(newObj.txID);
    const bec = await cb58Encode(b);
    newObj.txID = bec;
    return newObj;
  }

  let xmps = mps
    .map((mp) => stripNumberKeys(mp))
    .map((mp) => labelAddresses(mp, labels))
    .map((mp) => formatEther(mp))
    .map((mp) => bigToNum(mp))
    .map((mp) => unixToISO(mp))
    .map((mp) => addStatusName(mp))
    .map((mp) => decodeErrorMsg(mp));

  // Argh b58c.encode is async so we have to await
  xmps = await Promise.all(xmps.map((mp) => encodeNodeID(mp)));
  xmps = await Promise.all(xmps.map((mp) => encodeTxID(mp)));
  return xmps;
}

class Blockchain {
  host;
  data;

  constructor({ host = this.required() }) {
    Object.assign(this, {
      host,
    });
  }

  async fetchData() {
    const metrics = [
      {
        name: "nodeID",
        url: "/ext/info",
        method: "info.getNodeID",
        resultFn: (v) => v.nodeID,
      },
      {
        name: "IP",
        url: "/ext/info",
        method: "info.getNodeIP",
        resultFn: (v) => v.ip,
      },
      {
        name: "heightP",
        url: "/ext/bc/P",
        method: "platform.getHeight",
        resultFn: (v) => v.height,
      },
      {
        name: "timestampP",
        url: "/ext/bc/P",
        method: "platform.getTimestamp",
        resultFn: (v) => DateTime.fromISO(v.timestamp).toLocaleString(DateTime.DATETIME_SHORT),
      },
      {
        name: "blockNumberC",
        url: "/ext/bc/C/rpc",
        method: "eth_blockNumber",
        params: [],
        resultFn: (v) => parseInt(v, 16),
      },
      {
        name: "timestampC",
        url: "/ext/index/C/block",
        method: "index.getLastAccepted",
        resultFn: (v) => DateTime.fromISO(v.timestamp).toLocaleString(DateTime.DATETIME_SHORT),
      },
    ];
    const promises = metrics.map((m) =>
      fetch(`${this.host}${m.url}`, makeRpc(m.method, m.params)).then((res) => res.json())
    );
    let results = await Promise.all(promises);

    this.data = {};

    for (let i = 0; i < metrics.length; i++) {
      const value = metrics[i].resultFn ? metrics[i].resultFn.call(this, results[i].result) : results[i].result;
      this.data[metrics[i].name] = value;
    }

    // console.log("Blockchain Data", this.data);
    return this.data;
  }

  statusLine() {
    const d = this.data;
    return `[C-chain blk #${d.blockNumberC} @ ${d.timestampC}] [P-chain blk #${d.heightP} @ ${d.timestampP}]`;
  }

  refreshDataLoop(fn) {
    const poll = async () => {
      // console.log("Polling for blockchain data");
      await this.fetchData();
      fn();
      setTimeout(poll, 10000);
    };
    poll();
  }

  required() {
    throw new Error("Missing argument.");
  }
}

class GoGoPool {
  // Required Params
  addresses;
  abis;
  // Optional Params
  chain;
  rpc;
  addressLabels;
  dashboard;
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
    addressLabels = {},
  }) {
    Object.assign(this, {
      addresses,
      abis,
      chain,
      rpc,
      dashboard,
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
        calls.push(c[metric.fn].call());
      }
    }

    let results;
    try {
      console.log("foo");
      results = await this.multicallProvider.all(calls);
    } catch (err) {
      console.error("ERROR in Multicall, so we dont know which call failed. Check your deployment descriptor.");
    }
    console.log("Multicall Results", results);
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
    this.minipoolsData = await transformMinipools(results.flat(), this.addressLabels);
    console.log("Minipools", this.minipoolsData);
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

export { GoGoPool, Blockchain };
