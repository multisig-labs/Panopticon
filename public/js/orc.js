// Etherjs read-only interface to Rialto Orchestrator
import { formatters, pick } from "/js/utils.js";
import { DateTime, Interval } from "https://esm.sh/luxon@3.3.0";

class Orc {
  orcURL;
  minipools;
  info;
  txLogs;
  wallet;

  constructor({ orcURL = this.required() }) {
    Object.assign(this, {
      orcURL,
    });
  }

  async fetchWallet() {
    const response = await fetch(`${this.orcURL}/wallet`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`admin:${ORC_AUTH_TOKEN}`)}`,
        "User-Agent": "Panopticon",
      },
    }).then((res) => res.json());
    this.wallet = response;
    return this.wallet;
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
    const response = await fetch(`${this.orcURL}/all_tx_logs?limit=300`, {
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

  walletInfoLine() {
    let cp = "";
    if (this.wallet.balance.C2P + this.wallet.balance.P2C > 0) {
      cp = `<br />C2P: ${this.wallet.balance.C2P} P2C: ${this.wallet.balance.P2C}`;
    }
    return `C: ${formatters.formatAmount(this.wallet.displayBalance.C)} P: ${formatters.formatAmount(
      this.wallet.displayBalance.P
    )} ${cp}`;
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
      await this.fetchWallet();
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
