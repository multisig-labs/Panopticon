import { DEPLOYMENT } from "./deployments/selected.js";
import { GoGoPool } from "./js/gogopool.js";
import { Blockchain } from "./js/blockchain.js";
import { contractsDef, dashboardDef, minipoolsDef, stakersDef } from "./js/tabulator.js";
let GGP, BC;

async function initData() {
  GGP = new GoGoPool(DEPLOYMENT);
  BC = new Blockchain(DEPLOYMENT);

  await Promise.all([
    BC.fetchData(),
    GGP.fetchContracts(),
    GGP.fetchDashboardData(),
    GGP.fetchMinipools(),
    GGP.fetchStakers(),
  ]);
}
await initData();

console.log("Data Loaded", GGP, BC);
