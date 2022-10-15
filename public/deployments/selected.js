import { deploymentFn as deploymentFnAnrFly } from "./anr-fly.js";
import { deploymentFn as deploymentFnAnrLocal } from "./anr-local.js";

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
  }
}
await init();

export { DEPLOYMENT };
