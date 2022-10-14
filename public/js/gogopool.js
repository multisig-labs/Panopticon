// Etherjs read-only interface to GoGoPool Protocol

import { DateTime } from "https://cdn.skypack.dev/luxon";
import { utils, providers, Contract } from "https://cdn.skypack.dev/ethers";
import {
  Contract as MCContract,
  Provider as MCProvider,
} from "https://cdn.skypack.dev/ethcall";

const STATUSMAP = {
  0: "Prelaunch",
  1: "Launched",
  2: "Staking",
  3: "Withdrawable",
  4: "Finished",
  5: "Canceled",
  6: "Error",
};

async function sha256(message) {
  const buffer = await window.crypto.subtle.digest("SHA-256", message.buffer);
  return new Uint8Array(buffer);
}

async function cb58Encode(message) {
  const payload = utils.arrayify(message);
  const checksum = await sha256(payload);
  const buffer = new Uint8Array(payload.length + 4);
  buffer.set(payload);
  buffer.set(checksum.slice(-4), payload.length);
  return utils.base58.encode(new Uint8Array(buffer));
}

async function cb58Decode(message) {
  const buffer = utils.base58.decode(message);
  const payload = buffer.slice(0, -4);
  const checksum = buffer.slice(-4);
  const newChecksum = (await sha256(payload)).slice(-4);

  if (
    (checksum[0] ^ newChecksum[0]) |
    (checksum[1] ^ newChecksum[1]) |
    (checksum[2] ^ newChecksum[2]) |
    (checksum[3] ^ newChecksum[3])
  )
    throw new Error("Invalid checksum");
  return payload;
}

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
        newObj[k] = utils.formatEther(newObj[k]);
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
    newObj.statusName = STATUSMAP[newObj.status];
    return newObj;
  }

  function decodeErrorMsg(obj) {
    const newObj = Object.assign({}, obj);
    newObj.errorMsg = utils.toUtf8String(utils.stripZeros(newObj.errorCode));
    return newObj;
  }

  async function encodeNodeID(obj) {
    const newObj = Object.assign({}, obj);
    newObj.nodeAddr = obj.nodeID;
    const b = utils.arrayify(utils.getAddress(newObj.nodeAddr));
    const bec = await cb58Encode(b);
    newObj.nodeID = `NodeID-${bec}`;
    return newObj;
  }

  // Stored as 0x123 but its a P-chain tx so we need CB58
  async function encodeTxID(obj) {
    const newObj = Object.assign({}, obj);
    const b = utils.arrayify(newObj.txID);
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

// TODO Maybe just merge these with the Tabular ones, only format for the table?
const defaultFormatters = {
  formatEther: (v) => utils.formatEther(v),
  formatEtherAtTime: (v) => `${utils.formatEther(v[0])}@${v[1]}`,
  bigToNumber: (v) => v.toNumber(),
  unixToISO: (v) =>
    DateTime.fromSeconds(v).toLocaleString(DateTime.DATETIME_SHORT),
};

class Blockchain {
  host;
  data;

  constructor({ host = "http://localhost:8545" }) {
    Object.assign(this, {
      host,
    });
  }

  makeRpc(method, params = {}) {
    const rpc = {
      id: 1,
      jsonrpc: "2.0",
      method,
      params,
    };

    return {
      method: "POST",
      body: JSON.stringify(rpc),
      headers: {
        "Content-Type": "application/json",
      },
    };
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
        resultFn: (v) =>
          DateTime.fromISO(v.timestamp).toLocaleString(DateTime.DATETIME_SHORT),
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
        resultFn: (v) =>
          DateTime.fromISO(v.timestamp).toLocaleString(DateTime.DATETIME_SHORT),
      },
    ];
    const promises = metrics.map((m) =>
      fetch(`${this.host}${m.url}`, this.makeRpc(m.method, m.params)).then(
        (res) => res.json()
      )
    );
    let results = await Promise.all(promises);

    this.data = {};

    for (let i = 0; i < metrics.length; i++) {
      const value = metrics[i].resultFn
        ? metrics[i].resultFn.call(this, results[i].result)
        : results[i].result;
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
      setTimeout(poll, 30000);
    };
    poll();
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
  formatters;
  // Internal data
  contracts;
  mccontracts;
  provider;
  multicallProvider;
  minipools;
  minipoolsData;
  dashboardData;
  isLoaded;

  constructor({
    addresses = this.required(),
    abis = this.required(),
    chain = { name: "ANR", chainId: 43112 },
    rpc = "http://localhost:8545/ext/bc/C/rpc",
    formatters = defaultFormatters,
    dashboard = [],
    addressLabels = {},
  }) {
    Object.assign(this, {
      addresses,
      abis,
      chain,
      rpc,
      formatters,
      dashboard,
      addressLabels,
    });
    this.contracts = {};
    this.mccontracts = {};
    this.minipools = [];
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
    this.contracts.Storage = await new Contract(
      this.addresses.Storage,
      this.abis.Storage.abi,
      this.provider
    );

    // Loop through all other contract names we have abis for
    for (const name of Object.keys(this.abis)) {
      if (name === "Storage") continue;
      try {
        const address = await this.contracts.Storage.getAddress(
          utils.solidityKeccak256(
            ["string", "string"],
            ["contract.address", name]
          )
        );
        this.addresses[name] = address;

        // Make a standard ethers contract
        const contract = await new Contract(
          this.addresses[name],
          this.abis[name].abi,
          this.provider
        );
        this.contracts[name] = contract;

        // Also make a MultiCall contract for use with 'ethcall'
        const mccontract = await new MCContract(
          this.addresses[name],
          this.abis[name].abi
        );
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

    const results = await this.multicallProvider.all(calls);
    // console.log("Multicall Results", results);

    let i = 0;
    for (const obj of this.dashboard) {
      for (const metric of obj.metrics) {
        metric.rawValue = results[i];
        switch (typeof metric.formatter) {
          case "string":
            metric.value = this.formatters[metric.formatter].call(
              this,
              results[i]
            );
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

  async fetchMinipools({ status } = { status: Object.keys(STATUSMAP) }) {
    await this.until((_) => this.isLoaded);

    const promises = status.map((s) =>
      this.contracts.MinipoolManager.getMinipools(s, 0, 0)
    );
    const results = await Promise.all(promises);
    this.minipools = await transformMinipools(
      results.flat(),
      this.addressLabels
    );
    return this.minipools;
  }

  minipoolsAsTabulatorData() {
    return this.minipools;
    // while (this.minipoolsData.length > 0) {
    //   this.minipoolsData.pop();
    // }
    // for (const mp of this.minipools) {
    //   this.minipoolsData.push(mp);
    // }
    // return this.minipoolsData;
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
