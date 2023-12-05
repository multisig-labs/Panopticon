class Pandasia {
  trees;

  constructor() {}

  async fetchTrees() {
    const resp = await fetch("https://api.pandasia.io/trees").then((res) => res.json());
    this.trees = resp;
    return this.trees;
  }

  refreshDataLoop(fn) {
    const poll = async () => {
      await this.fetchTrees();
      fn();
      setTimeout(poll, 30000);
    };
    poll();
  }
}

export { Pandasia };
