import { deployment } from "./anr-fly.js";

// Apply any overrides we need to the Fly config

const overrides = {
  host: "http://localhost:8545",
  rpc: "http://localhost:8545/ext/bc/C/rpc",
  orc: "http://localhost:7450",
  chain: {
    name: "custom",
    chainId: 43112,
  },
};

const newDeployment = Object.assign(deployment, overrides);

// HACK Since only Chrome has the above "assert" syntax
const contracts = deployment.dashboard.map((v) => v.contract);
async function deploymentFn() {
  async function fetchABIs(names) {
    const abis = {};
    const promises = names.map((name) => fetch(`/contracts/${name}.sol/${name}.json`).then((res) => res.json()));
    const responses = await Promise.all(promises);
    for (let i = 0; i < contracts.length; i++) {
      abis[contracts[i]] = responses[i];
    }
    return abis;
  }

  deployment.abis = await fetchABIs(contracts);
  return deployment;
}

export { newDeployment as deployment, deploymentFn };
