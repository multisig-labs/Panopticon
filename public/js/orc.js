// Etherjs read-only interface to Rialto Orchestrator
import { formatters, pick } from "/js/utils.js";
import { DateTime, Interval } from "https://esm.sh/luxon@3.3.0";

class Orc {
  orcURL;
  minipools;
  info;
  txLogs;

  constructor({ orcURL = this.required() }) {
    Object.assign(this, {
      orcURL,
    });
  }

  async fetchMinipools() {
    const response = await fetch(`${this.orcURL}/all_minipools`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`admin:${ORC_AUTH_TOKEN}`)}`,
        "User-Agent": "Panopticon",
      },
    }).then((res) => res.json());
    this.minipools = response.Minipools;
    return this.minipools;
  }

  async fetchInfo() {
    const response = await fetch(`${this.orcURL}/info`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`admin:${ORC_AUTH_TOKEN}`)}`,
        "User-Agent": "Panopticon",
      },
    }).then((res) => res.json());
    this.info = response;
    return this.info;
  }

  async fetchTxLogs() {
    const response = await fetch(`${this.orcURL}/all_tx_logs?limit=100`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`admin:${ORC_AUTH_TOKEN}`)}`,
        "User-Agent": "Panopticon",
      },
    }).then((res) => res.json());
    this.txLogs = response.TxLogs;
    console.log(this);
    return this.txLogs;
  }

  minipoolsAsTabulatorData() {
    return this.minipools;
  }

  txLogsAsJson() {
    var now = DateTime.now();
    return (this.txLogs || []).map((l) => {
      const body = JSON.parse(l.RialtoBody);
      const result = l.RialtoResult && JSON.parse(l.RialtoResult);
      const out = {};
      out.CreatedAt = DateTime.fromISO(l.CreatedAt).toRelative();
      out.RialtoEndpoint = l.RialtoEndpoint;
      out.Error = l?.ErrorMsg ? "❌" : "";
      out.Nonce = l.Nonce;
      out.NodeID = body?.NodeID;
      out.TxID = body?.TxID || result?.TxID;
      out.ErrorMsg = l?.ErrorMsg;
      out.RialtoBody = { body: JSON.parse(l.RialtoBody) };
      out.RialtoResult = { result: l.RialtoResult && JSON.parse(l.RialtoResult) };
      out.SSID = l.SSID;
      return out;
    });
  }

  refreshDataLoop(fn) {
    const poll = async () => {
      await this.fetchTxLogs();
      fn();
      setTimeout(poll, 10000);
    };
    poll();
  }

  required() {
    throw new Error("Missing argument.");
  }
}

export { Orc };
