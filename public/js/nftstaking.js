import {
  createPublicClient,
  http,
  defineChain,
  parseAbiItem,
  parseAbi,
  decodeFunctionResult,
  encodeFunctionData,
  getContract,
} from "https://esm.sh/viem@2.29.1";
import { NftStakingManagerService } from "./nftStakingManagerService.js";
class NFTStakingManagerClient {
  ethURL;
  chain;
  abis;
  addresses;
  dashboard;

  publicClient;
  isLoaded;
  contractSettings;
  dashboardData;
  contracts;

  constructor({
    ethURL = this.required(),
    chain = this.required(),
    abis = this.required(),
    addresses = this.required(),
    dashboard = this.required(),
  }) {
    Object.assign(this, {
      ethURL,
      chain,
      abis,
      addresses,
      dashboard,
    });

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(this.ethURL),
    });

    this.contracts = {};
    for (const c in this.abis) {
      this.contracts[c] = getContract({
        address: this.addresses[c],
        abi: this.abis[c],
        client: {
          public: this.publicClient,
        },
      });
    }

    this.isLoaded = true;
    this.contractSettings = {};
    this.dashboardData = [];
  }

  //   const results = await publicClient.multicall({
  //   contracts: [
  //     {
  //       address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
  //       abi: wagmiAbi,
  //       functionName: 'totalSupply',
  //     },
  //     ...
  //   ],
  //   multicallAddress: '0xca11bde05977b3631167028862be2a173976ca11'
  // })

  // Uses multicall to grab all data defined in the dashboard from various contracts
  async fetchDashboardData() {
    await this.until((_) => this.isLoaded);

    const nftStakingManagerService = new NftStakingManagerService(
      this.publicClient,
      this.addresses.NFTStakingManager,
      this.abis.NFTStakingManager,
    );
    const nftStakingManagerData = await nftStakingManagerService.fetchAllData();
    console.log(nftStakingManagerData);

    const calls = [];

    for (const obj of this.dashboard) {
      for (const metric of obj.metrics) {
        try {
          calls.push({
            address: this.addresses[obj.contract],
            abi: this.abis[obj.contract],
            functionName: metric.fn,
            args: metric.args,
          });
        } catch (err) {
          console.log("cant find fn in contract for metric:", metric);
        }
      }
    }

    let results = [];

    for (let batch of this.getBatch(calls)) {
      try {
        results = results.concat(await this.publicClient.multicall({ contracts: batch }));
      } catch (err) {
        console.error(
          "ERROR in Multicall, so we dont know which call failed. Make sure Multicall3 addr is correct and check the /deployments descriptor.",
          err,
        );
        console.error(batch);
      }
    }

    if (results.length == 0) return results;

    let i = 0;
    for (const obj of this.dashboard) {
      for (const metric of obj.metrics) {
        try {
          metric.rawValue = results[i];
          if (results[i].status !== "success") {
            throw new Error("Multicall failed");
          }
          switch (typeof metric.formatter) {
            case "string":
              metric.value = formatters[metric.formatter].call(this, results[i].result);
              break;
            case "function":
              metric.value = metric.formatter.call(this, results[i].result);
              break;
            default:
              metric.value = results[i].result;
              break;
          }
          i++;
        } catch (err) {
          console.log("Error formatting metric", metric);
          metric.value = "err";
        }
      }
    }
    console.log(this.dashboard);
    return this.dashboard;
  }

  // Reformat data shape to fit Tabulator table
  dashboardAsTabulatorData() {
    this.dashboardData = [];
    for (const obj of this.dashboard) {
      for (const metric of obj.metrics) {
        this.dashboardData.push({
          contract: obj.contract,
          address: this.addresses[obj.contract],
          title: metric.title ?? metric.fn,
          desc: metric.desc,
          value: metric.value,
        });
      }
    }
    return this.dashboardData;
  }

  refreshDataLoop(fn) {
    const poll = async () => {
      await Promise.all([this.fetchDashboardData()]);
      fn();
      setTimeout(poll, window.POLL_INTERVAL || 60 * 1000);
    };
    poll();
  }

  async isLoaded() {
    await this.until((_) => this.isLoaded);
  }

  required() {
    throw new Error("Missing argument.");
  }

  // usage: await until(_ => flag == true);
  until(conditionFunction) {
    const poll = (resolve) => {
      if (conditionFunction()) resolve();
      else setTimeout((_) => poll(resolve), 200);
    };

    return new Promise(poll);
  }

  *getBatch(records, batchsize = window.BATCHSIZE || 100) {
    while (records.length) {
      console.log("Yielding Batch of ", records.length);
      yield records.splice(0, batchsize);
    }
  }
}

export { NFTStakingManagerClient };
