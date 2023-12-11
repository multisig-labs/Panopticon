class ggAVAX {
  currentDelegations;

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

  refreshDataLoop(fn) {
    const poll = async () => {
      await this.fetchCurrentDelegations();
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
