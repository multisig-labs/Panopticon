import { deploymentFn as deploymentFnAnrFly } from "./anr-fly.js";
import { deploymentFn as deploymentFnAnrLocal } from "./anr-local.js";
import { deploymentFn as deploymentFnHardhat } from "./hardhat.js";
import { deploymentFn as deploymentFnFuji } from "./fuji.js";

// Return whichever deployment is selected in localStorage

let DEPLOYMENT;

async function init() {
  if (!localStorage.getItem("deployment")) localStorage.setItem("deployment", "anr-fly");

  switch (localStorage.getItem("deployment")) {
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
  }
}
await init();

export { DEPLOYMENT };
