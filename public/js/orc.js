// Etherjs read-only interface to Rialto Orchestrator

import { DateTime } from "https://cdn.skypack.dev/luxon";
import { makeRpc } from "/js/utils.js";

class Orc {
  orcURL;
  minipools;
  info;

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

  minipoolsAsTabulatorData() {
    return this.minipools;
  }

  refreshDataLoop(fn) {
    const poll = async () => {
      // console.log("Polling for orc data");
      await this.fetchMinipools();
      fn();
      setTimeout(poll, 5000);
    };
    poll();
  }

  required() {
    throw new Error("Missing argument.");
  }
}

export { Orc };
