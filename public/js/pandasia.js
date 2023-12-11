import { utils as ethersUtils, providers, Contract, constants, BigNumber } from "https://esm.sh/ethers@5.7.2";
import { Contract as MCContract, Provider as MCProvider } from "https://esm.sh/ethcall@4.8.13";

class Pandasia {
  trees;
  airdrops;
  users;

  // for querying the blockchain network
  provider;
  ethURL;
  pandasiaURL;
  chain;
  address; // address of the contract
  abi; // abi of the contract
  contract;

  constructor(DEPLOYMENT = this.required()) {
    this.ethURL = DEPLOYMENT.ethURL;
    this.chain = DEPLOYMENT.chain.chainId;
    this.address = DEPLOYMENT.pandasia;
    this.pandasiaURL = DEPLOYMENT.pandasiaURL;
    this.abi = DEPLOYMENT.contracts.Pandasia.abi;
    this.provider = new providers.JsonRpcProvider(this.ethURL, this.chain);
    // initialize a new contract instance
    this.contract = new Contract(this.address, this.abi, this.provider);
  }

  async fetchTrees() {
    const resp = await fetch(this.pandasiaURL + "trees").then((res) => res.json());
    this.trees = resp;
    return this.trees;
  }

  async fetchAirdrops() {
    // get airdrops in chunks of 10 until they stop returning
    let localAirdrops = [];
    // get airdrops takes an offset and a limit
    let offset = 0;
    let limit = 10;
    while (true) {
      // make a request to the contract
      const resp = await this.contract.getAirdrops(offset, limit);
      // if the response is empty, break out of the loop
      if (resp.length === 0) {
        break;
      }
      // otherwise, add the response to the local airdrops
      localAirdrops.push(...resp);
      if (resp.length < limit) {
        break;
      }
      // increment the offset
      offset += limit;
    }

    // set the airdrops
    this.airdrops = localAirdrops.map((airdrop, i) => {
      return {
        idx: i,
        airdropId: airdrop.id,
        owner: airdrop.owner,
        erc20: airdrop.erc20,
        balance: airdrop.balance,
        customRoot: airdrop.customRoot,
        claimAmount: airdrop.claimAmount,
        startsAt: airdrop.startsAt,
        expiresAt: airdrop.expiresAt,
      };
    });
  }

  async fetchVerifiedAddresses() {
    // get the public p2c addresses variable from the contract
    const addressCount = await this.contract.cChainAddrsCount();
    // convert from a BigNumber to a number
    const count = addressCount.toNumber();
    // getRegisteredUsers takes an offset and a limit
    let offset = 0;
    let limit = 10;
    let users = [];
    while (users.length < count) {
      // make a request to the contract
      const resp = await this.contract.getRegisteredUsers(offset, limit);
      // if the response is empty, break out of the loop
      if (resp.length === 0) {
        break;
      }
      // otherwise, add the response to the local addresses
      users.push(...resp);
      if (resp.length < limit) {
        break;
      }
      // increment the offset
      offset += limit;
    }

    // users are an object with two keys: cChainAddr and pChainAddr
    this.users = users.map((user, i) => {
      return {
        idx: i,
        cChainAddr: user.cChainAddr,
        pChainAddr: user.pChainAddr,
      };
    });
  }

  refreshDataLoop(fn) {
    const poll = async () => {
      await Promise.all([this.fetchTrees(), this.fetchAirdrops(), this.fetchVerifiedAddresses()]);
      fn();
      setTimeout(poll, 30000);
    };
    poll();
  }

  required() {
    throw new Error("Missing argument.");
  }
}

export { Pandasia };
