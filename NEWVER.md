Currently this is a quick-and-dirty mostly-js, runs in the browser, project.

The goal is to make a Javascript-based, generic class that could run in Node (Deno?) that takes as inputs:

- `contracts.json` -- all contract ABIs together in one obj, contract name as key
- `deployment.json` -- all contract addresses, RPC urls, etc
- `dashboard.json` -- description of all variables we want to grab from contracts or URLs

The class would scrape the data, transform it as necessary, and expose the data for Prometheum/Grafana

`contracts.json`

```json
{
  "ContractA": {
    "abi": [ ... ]
  },
  "ContractB": {
    "abi": [ ... ]
  }
}
```

`deployment.json`

```js
{
  // metrics can specify which baseURL to use
  baseURLs: {
    eth: {
      url: "https://anr.fly.dev/ext/bc/C/rpc",
      // optional Basic Auth
      username: "",
      password: ""
    },
    ava: "https://anr.fly.dev",
    explorerP: "https://anr.fly.dev/cgi-bin/txp"
  },
  chain: {
    name: "custom",
    chainId: 43112,
  },
  // system will xform addrs to friendly names if found here
  EOALabels: {
    "0xE992bAb78A4901f4AF1C3356a9c6310Da0BA8bee": "nodeOp1"
  },
  // Array of metrics to grab. Could be contract data, or data from other URLs
  dashboard: [ (metrics objects) ]
}
```

A `metric object` to get contract data is defined as:

```js
{
  type: "contract",
  metric: {
    baseURL: "eth",
    contract: "ContractA",
    method: "getSomeData",
    args: [],
    title: "Some Data",
    desc: "Friendly description",
    formatter: (v) => (v') or "name of a defined formatting function",
  }
}
```

A `metric object` to get some data from an RPC URL

```js
{
  type: "rpc",
  metric: {
    baseURL: "ava",
    path: "/ext/bc/P",
    method: "platform.getHeight",
    args: [],
    title: "Height of Pchain",
    desc: "Friendly description",
    formatter: (v) => (v') or "name of a defined formatting function",
  }
}
```

# Architecture
