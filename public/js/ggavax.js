class ggAVAX {
  currentDelegations;
  wavaxBalance;

  constructor() {}

  async fetchCurrentDelegations() {
    const timestamp = Math.floor(Date.now() / 1000);
    const response = await fetch(
      `https://glacier-api.avax.network/v1/networks/mainnet/blockchains/p-chain/transactions:listStaking?addresses=avax10f8305248c0wsfsdempdtpx7lpkc30vwzl9y9q&txTypes=AddDelegatorTx&startTimestamp=1&endTimestamp=${timestamp}&pageSize=100`,
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
