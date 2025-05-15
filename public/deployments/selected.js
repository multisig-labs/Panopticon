import { deploymentFn as deploymentFnNftStakingFuji } from "./nftstaking-fuji.js";
// Return whichever deployment is selected in localStorage

let DEPLOYMENT;

async function init() {
  if (!localStorage.getItem("deployment")) localStorage.setItem("deployment", "nftstaking-fuji");

  switch (localStorage.getItem("deployment")) {
    case "nftstaking-fuji":
      DEPLOYMENT = await deploymentFnNftStakingFuji();
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
