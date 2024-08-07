class ggAVAX {
  currentDelegations;
  currentMEV;
  wavaxBalance;

  constructor() {}

  async fetchCurrentDelegations() {
    const startTimestamp = Math.floor(Date.now() / 1000) - 15 * 24 * 60 * 60;
    const endTimestamp = Math.floor(Date.now() / 1000);
    const response = await fetch(
      `https://glacier-api.avax.network/v1/networks/mainnet/blockchains/p-chain/transactions:listStaking?addresses=avax10f8305248c0wsfsdempdtpx7lpkc30vwzl9y9q&txTypes=AddPermissionlessDelegatorTx&startTimestamp=${startTimestamp}&endTimestamp=${endTimestamp}&pageSize=100`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    ).then((res) => res.json());
    this.currentDelegations = response.transactions;
    return this.currentDelegations;
  }

  async fetchCurrentMEV() {
    const startTimestamp = Math.floor(Date.now() / 1000) - 45 * 24 * 60 * 60;
    const endTimestamp = Math.floor(Date.now() / 1000);
    const url = (nextPageParamAndToken) =>
      `https://glacier-api.avax.network/v1/networks/mainnet/blockchains/p-chain/transactions:listStaking?addresses=avax10f8305248c0wsfsdempdtpx7lpkc30vwzl9y9q&txTypes=AddValidatorTx&txTypes=AddPermissionlessValidatorTx&startTimestamp=${startTimestamp}&endTimestamp=${endTimestamp}&pageSize=100${nextPageParamAndToken}`;

    const txs = [];
    let nextPageParamAndToken = "";
    let i = 0;
    do {
      const response = await fetch(url(nextPageParamAndToken)).then((res) => res.json());
      txs.push(...response.transactions);
      nextPageParamAndToken = response.nextPageToken ? `&pageToken=${response.nextPageToken}` : "";
      i++;
    } while (nextPageParamAndToken && i < 10);

    // exclude all nodes that are minipools (15 day duration)
    this.currentMEV = txs.filter((t) => {
      const dur = t.endTimestamp - t.startTimestamp;
      const isMinipool = dur >= 1295000 && dur <= 1296000;
      return !isMinipool;
    });
    return this.currentMEV;
  }

  async fetchWavaxBalance() {
    const response = await fetch(
      `https://glacier-api.avax.network/v1/chains/43114/addresses/0xA25EaF2906FA1a3a13EdAc9B9657108Af7B703e3/balances:listErc20?pageSize=10&contractAddresses=0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7&currency=usd`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    ).then((res) => res.json());
    this.wavaxBalance = response.erc20TokenBalances[0].balance;
    return this.wavaxBalance;
  }

  refreshDataLoop(fn) {
    const poll = async () => {
      await this.fetchCurrentDelegations();
      await this.fetchWavaxBalance();
      fn();
      setTimeout(poll, 30000);
    };
    poll();
  }

  required() {
    throw new Error("Missing argument.");
  }
}

export { ggAVAX };
