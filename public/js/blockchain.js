// Etherjs read-only interface to Avalanche Blockchain parameters

import { DateTime } from "https://cdn.skypack.dev/luxon";
import { makeRpc } from "./utils.js";

class Blockchain {
  avaURL;
  data;

  constructor({ avaURL = this.required() }) {
    Object.assign(this, {
      avaURL,
    });
  }

  async fetchData() {
    if (!this.avaURL) return;
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
        resultFn: (v) => {
          const dt = DateTime.fromISO(v.timestamp).toLocaleString(DateTime.DATETIME_SHORT);
          const unix = DateTime.fromISO(v.timestamp).toFormat("X");
          return `${dt} unix: ${unix}`;
        },
      },
    ];
    const promises = metrics.map((m) =>
      fetch(`${this.avaURL}${m.url}`, makeRpc(m.method, m.params)).then((res) => res.json())
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
    // If hardhat then just return
    if (!this.avaURL) return "";
    const d = this.data || {};
    return `[C-chain blk #${d.blockNumberC} @ ${d.timestampC}] [P-chain blk #${d.heightP} @ ${d.timestampP}]`;
  }

  refreshDataLoop(fn) {
    if (!this.avaURL) return;
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

export { Blockchain };
