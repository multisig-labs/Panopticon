import { deploymentFn as deploymentFnAnrFly } from "./anr-fly.js";
import { deploymentFn as deploymentFnAnrLocal } from "./anr-local.js";
import { deploymentFn as deploymentFnHardhat } from "./hardhat.js";
import { deploymentFn as deploymentFnFuji } from "./fuji.js";
import { deploymentFn as deploymentFnMainnetTest } from "./mainnet-test.js";
import { deploymentFn as deploymentFnMainnet } from "./mainnet.js";

// Return whichever deployment is selected in localStorage

let DEPLOYMENT;

async function init() {
  if (!localStorage.getItem("deployment")) localStorage.setItem("deployment", "mainnet");

  switch (localStorage.getItem("deployment")) {
    case "mainnet":
      DEPLOYMENT = await deploymentFnMainnet();
      break;
    case "anr-fly":
      DEPLOYMENT = await deploymentFnAnrFly();
      break;
    case "anr-local":
      DEPLOYMENT = await deploymentFnAnrLocal();
      break;
    case "hardhat":
      DEPLOYMENT = await deploymentFnHardhat();
      break;
    case "fuji":
      DEPLOYMENT = await deploymentFnFuji();
      break;
    case "mainnet-test":
      DEPLOYMENT = await deploymentFnMainnetTest();
      break;
  }
}
await init();

// Overrides from URL
const params = new URLSearchParams(document.location.search);
if (params.get("ethURL")) {
  DEPLOYMENT.ethURL = params.get("ethURL");
}

export { DEPLOYMENT };
