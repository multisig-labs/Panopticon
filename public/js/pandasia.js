import { utils as ethersUtils, providers, Contract, constants, BigNumber } from "https://esm.sh/ethers@5.7.2";
import { Contract as MCContract, Provider as MCProvider } from "https://esm.sh/ethcall@4.8.13";

class Pandasia {
  trees;
  airdrops;

  // for querying the blockchain network
  provider;
  ethURL;
  chain;
  address; // address of the contract
  abi; // abi of the contract
  contract;

  constructor(ethURL = this.required(), chain = this.required(), address = this.required(), abi = this.required()) {
    this.ethURL = ethURL;
    this.chain = chain;
    this.address = address;
    this.abi = abi;
    this.provider = new providers.JsonRpcProvider(this.ethURL, this.chain);
    // initialize a new contract instance
    this.contract = new Contract(this.address, this.abi, this.provider);
  }

  async fetchTrees() {
    const resp = await fetch("https://api.pandasia.io/trees").then((res) => res.json());
    this.trees = resp;
    return this.trees;
  }

  async fetchAirdrops() {
    // get airdrops in chunks of 10 until they stop returning
    const localAirdrops = [];
    // get airdrops takes an offset and a limit
    let offset = 0;
    let limit = 10;
    while (true) {
      // make a request to the contract
      const resp = await this.contract.getAirdrops(offset, limit);
      // log the response and break for now
      console.log(resp);
      break;
    }
  }

  refreshDataLoop(fn) {
    const poll = async () => {
      await this.fetchTrees();
      await this.fetchAirdrops();
      fn();
      setTimeout(poll, 30000);
    };
    poll();
  }

  required() {
    throw new Error("Missing argument.");
  }
}

const abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AddressAlreadyClaimed",
    type: "error",
  },
  {
    inputs: [],
    name: "AddressNotEligible",
    type: "error",
  },
  {
    inputs: [],
    name: "AirdropExpired",
    type: "error",
  },
  {
    inputs: [],
    name: "AirdropNotStarted",
    type: "error",
  },
  {
    inputs: [],
    name: "AirdropOutOfFunds",
    type: "error",
  },
  {
    inputs: [],
    name: "AirdropStillActive",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAddress",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidAmount",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInitialization",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidWithdrawRequest",
    type: "error",
  },
  {
    inputs: [],
    name: "NotInitializing",
    type: "error",
  },
  {
    inputs: [],
    name: "NotOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "PAddrAlreadyRegistered",
    type: "error",
  },
  {
    inputs: [],
    name: "PAddrNotInMerkleTree",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroAmount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint64",
        name: "id",
        type: "uint64",
      },
      {
        indexed: true,
        internalType: "address",
        name: "claimant",
        type: "address",
      },
    ],
    name: "AirdropClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint64",
        name: "id",
        type: "uint64",
      },
    ],
    name: "AirdropCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "version",
        type: "uint64",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [],
    name: "airdropCount",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "airdropIds",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64",
      },
    ],
    name: "airdrops",
    outputs: [
      {
        internalType: "uint64",
        name: "id",
        type: "uint64",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "erc20",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "customRoot",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "claimAmount",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "startsAt",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "expiresAt",
        type: "uint64",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "c2p",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "cChainAddr",
        type: "address",
      },
      {
        internalType: "uint64",
        name: "airdropId",
        type: "uint64",
      },
      {
        internalType: "bytes32[]",
        name: "proof",
        type: "bytes32[]",
      },
    ],
    name: "canClaimAirdrop",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "airdropId",
        type: "uint64",
      },
      {
        internalType: "bytes32[]",
        name: "proof",
        type: "bytes32[]",
      },
    ],
    name: "claimAirdrop",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "claimed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "airdropId",
        type: "uint64",
      },
      {
        internalType: "uint256",
        name: "withdrawAmt",
        type: "uint256",
      },
    ],
    name: "emergencyWithdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "feePct",
    outputs: [
      {
        internalType: "uint32",
        name: "",
        type: "uint32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "airdropId",
        type: "uint64",
      },
      {
        internalType: "uint256",
        name: "fundAmount",
        type: "uint256",
      },
    ],
    name: "fundAirdrop",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "airdropId",
        type: "uint64",
      },
    ],
    name: "getAirdrop",
    outputs: [
      {
        components: [
          {
            internalType: "uint64",
            name: "id",
            type: "uint64",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "address",
            name: "erc20",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "balance",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "customRoot",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "claimAmount",
            type: "uint256",
          },
          {
            internalType: "uint64",
            name: "startsAt",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "expiresAt",
            type: "uint64",
          },
        ],
        internalType: "struct Pandasia.Airdrop",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "getAirdropIds",
    outputs: [
      {
        internalType: "uint64[]",
        name: "",
        type: "uint64[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "offset",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "limit",
        type: "uint64",
      },
    ],
    name: "getAirdrops",
    outputs: [
      {
        components: [
          {
            internalType: "uint64",
            name: "id",
            type: "uint64",
          },
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "address",
            name: "erc20",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "balance",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "customRoot",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "claimAmount",
            type: "uint256",
          },
          {
            internalType: "uint64",
            name: "startsAt",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "expiresAt",
            type: "uint64",
          },
        ],
        internalType: "struct Pandasia.Airdrop[]",
        name: "pageOfAirdrops",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "airdropId",
        type: "uint64",
      },
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "hasClaimed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "hashChecksummedMessage",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "isMinipoolOperator",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "isRegisteredValidator",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "merkleRoot",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "customRoot",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "erc20",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "claimAmount",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "startsAt",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "expiresAt",
        type: "uint64",
      },
    ],
    name: "newAirdrop",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "p2c",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "x",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "y",
        type: "uint256",
      },
    ],
    name: "pubKeyBytesToAvaAddressBytes",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
    ],
    name: "recoverMessage",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "v",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "r",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32",
      },
      {
        internalType: "bytes32[]",
        name: "proof",
        type: "bytes32[]",
      },
    ],
    name: "registerPChainAddr",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint32",
        name: "fee",
        type: "uint32",
      },
    ],
    name: "setFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "root",
        type: "bytes32",
      },
    ],
    name: "setMerkleRoot",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
    ],
    name: "setStorageContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "storageContract",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unregisterPChainAddr",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "root",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32[]",
        name: "proof",
        type: "bytes32[]",
      },
    ],
    name: "verify",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "airdropId",
        type: "uint64",
      },
    ],
    name: "withdrawFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "airdropId",
        type: "uint64",
      },
      {
        internalType: "uint256",
        name: "withdrawAmt",
        type: "uint256",
      },
    ],
    name: "withdrawFunding",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export { Pandasia, abi };
