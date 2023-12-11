import { utils as ethersUtils, constants as ethersConstants, BigNumber } from "https://esm.sh/ethers@5.7.2";
import { DateTime, Duration } from "https://esm.sh/luxon@3.3.0";

const ORC_STATE_MAP = {
  0: "Prelaunch",
  1: "ClaimMPStrt",
  2: "ClaimMPFin",
  3: "ExportC2PStrt",
  4: "ExportC2PFin",
  5: "ImportC2PStrt",
  6: "ImportC2PFin",
  7: "StakeMPStrt",
  8: "StakeMPFin",
  9: "RecStkStartStrt",
  10: "RecStkStartFin",
  11: "Validating",
  12: "ExportP2CStrt",
  13: "ExportP2CFin",
  14: "ImportP2CStrt",
  15: "ImportP2CFin",
  16: "RecStkEndStrt",
  17: "RecreateMPStrt",
  18: "RecStkErrStrt",
  19: "CancelMPStrt",
  20: "RecStkEndFin",
  21: "RecreateMPFin",
  22: "RecStkErrorFin",
  23: "CancelMPFin",
  24: "MPError",
};

const MINIPOOL_STATUS_MAP = {
  0: "Prelaunch",
  1: "Launched",
  2: "Staking",
  3: "Withdrawable",
  4: "Finished",
  5: "Canceled",
  6: "Error",
};

function pick(o, ...props) {
  return Object.assign({}, ...props.map((prop) => ({ [prop]: o[prop] })));
}

function checkNetworkStatus(eth_rpc_url) {
  eth_rpc_url ||= localStorage.getItem("eth_rpc_url");
  return fetch(`${eth_rpc_url}/ext/bc/P`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: {
      jsonrpc: "2.0",
      id: 1,
      method: "platform.getHeight",
      params: {},
    },
  });
}

function makeRpc(method, params = {}) {
  const rpc = {
    id: 1,
    jsonrpc: "2.0",
    method,
    params,
  };

  return {
    method: "POST",
    body: JSON.stringify(rpc),
    headers: {
      "Content-Type": "application/json",
    },
  };
}

async function sha256(message) {
  const buffer = await window.crypto.subtle.digest("SHA-256", message.buffer);
  return new Uint8Array(buffer);
}

async function cb58Encode(message) {
  const payload = ethersUtils.arrayify(message);
  const checksum = await sha256(payload);
  const buffer = new Uint8Array(payload.length + 4);
  buffer.set(payload);
  buffer.set(checksum.slice(-4), payload.length);
  return ethersUtils.base58.encode(new Uint8Array(buffer));
}

async function cb58Decode(message) {
  const buffer = ethersUtils.base58.decode(message);
  const payload = buffer.slice(0, -4);
  const checksum = buffer.slice(-4);
  const newChecksum = (await sha256(payload)).slice(-4);

  if (
    (checksum[0] ^ newChecksum[0]) |
    (checksum[1] ^ newChecksum[1]) |
    (checksum[2] ^ newChecksum[2]) |
    (checksum[3] ^ newChecksum[3])
  )
    throw new Error("Invalid checksum");
  return payload;
}

// Usage
// const pipeline = pipeAsyncFunctions(...fns);
// const promises = objs.map((obj) => pipeline(obj));
// const xobjs = await Promise.all(promises);
const pipeAsyncFunctions =
  (...fns) =>
  (arg) =>
    fns.reduce((p, f) => p.then(f), Promise.resolve(arg));

const pipe = (fns) => (data) => {
  return fns.reduce((value, func) => func(value), data);
};

// Generic display formatters, outputs strings for display
const formatters = {
  formatEther: (v) =>
    parseFloat(ethersUtils.formatEther(v || 0)).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
  formatAvax: (v) =>
    parseFloat(v / 1_000_000_000).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
  formatAmount: (v) =>
    parseFloat(v).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
  formatInflationAmt: (v) => {
    if (!v || v.length != 2) return "err";
    const newTokens = v[1].sub(v[0]);
    return parseFloat(ethersUtils.formatEther(newTokens)).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  },
  formatEtherPct: (v) => {
    if (v.eq(ethersConstants.MaxUint256)) {
      return "∞";
    }

    const p = parseFloat(ethersUtils.formatEther(v || 0)) * 100;
    return (
      p.toLocaleString(undefined, {
        maximumFractionDigits: 1,
      }) + "%"
    );
  },
  formatPct: (v) => {
    if (v === undefined) return "";
    if (v > 1e59) return "∞";
    const p = parseFloat(v) * 100;
    return (
      p.toLocaleString(undefined, {
        maximumFractionDigits: 1,
      }) + "%"
    );
  },
  formatNumber: (v) => {
    if (v === undefined) return "";
    const p = parseFloat(v);
    return p.toLocaleString(undefined, {
      maximumFractionDigits: 0,
    });
  },
  formatMPStatus: (v) => MINIPOOL_STATUS_MAP[v],
  formatErrorMsg: (v) => ethersUtils.toUtf8String(ethersUtils.stripZeros(v)),
  formatDuration: (v) => {
    const dur = Duration.fromMillis(v * 1000).toFormat("dd:hh:mm:ss");
    return `${dur} (${v})`;
  },
  formatDurationHumanShort: (v) => {
    if (v) {
      const dur = Duration.fromMillis(v * 1000)
        .rescale()
        .toHuman({ listStyle: "short", unitDisplay: "short" });
      // console.log(dur);
      return dur;
    }
  },
  labelAddress: (v, EOALabels) => EOALabels[v] || v,
  formatEtherAtTime: (v) => v && `${ethersUtils.formatEther(v[0])}@${v[1]}`,
  unixToISOOnly: (v) => {
    if (v?.toNumber) v = v.toNumber();
    if (v === 0) return v;
    return DateTime.fromSeconds(v || 0).toLocaleString(DateTime.DATETIME_SHORT);
  },
  unixToISO: (v) => {
    if (v?.toNumber) v = v.toNumber();
    if (v === 0) return v;
    const dt = DateTime.fromSeconds(v || 0).toLocaleString(DateTime.DATETIME_SHORT);
    return `${dt} (${v})`;
  },
  nodeAddrToId: async (v) => {
    const b = ethersUtils.arrayify(ethersUtils.getAddress(v));
    const bec = await cb58Encode(b);
    return `NodeID-${bec}`;
  },
  // Stored as 0x123 but its a P-chain tx so we need CB58
  toCB58: async (v) => await cb58Encode(ethersUtils.arrayify(v)),
};

// Fns for object-level transforms, can add/delete keys, mutate values, etc
const transformerFns = {
  stripNumberKeys: (obj) => {
    for (const k of Object.keys(obj)) {
      if (k.match("[0-9]+")) {
        delete obj[k];
      }
    }
    return obj;
  },
  // If num overflows, assume its in wei, and convert to eth
  bigToNumber: (obj) => {
    const bigKeys = Object.keys(obj).filter((k) => BigNumber.isBigNumber(obj[k]));
    for (const k of bigKeys) {
      if (obj[k].toHexString() === "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") {
        obj[k] = Infinity;
      } else {
        try {
          obj[k] = obj[k].toNumber();
        } catch (e) {
          obj[k] = obj[k].mul(100).div(ethersConstants.WeiPerEther).toNumber() / 100;
        }
      }
    }
    return obj;
  },
  // Etherjs sends a weird obj, so make it a standard one
  convertToObj: async (obj) => Object.assign({}, obj),
  indexToNum: (obj) => {
    obj.index = obj.index.toNumber();
    return obj;
  },
  encodeNodeID: async (obj) => {
    obj.nodeAddr = obj.nodeID;
    const b = ethersUtils.arrayify(ethersUtils.getAddress(obj.nodeAddr));
    const bec = await cb58Encode(b);
    obj.nodeID = `NodeID-${bec}`;
    return obj;
  },
  // Stored as 0x123 but its a P-chain tx so we need CB58
  encodeTxID: async (obj) => {
    const b = ethersUtils.arrayify(obj.txID);
    const bec = await cb58Encode(b);
    obj.txID = bec;
    return obj;
  },
};

// Ethers gives back an extremely ugly obj, I must be doing something wrong
function unfuckEthersObj(ugly) {
  // Make it a POJO
  let obj = Object.assign({}, ugly);

  // Strip out (stupid) number keys
  for (const k of Object.keys(obj)) {
    if (k.match("[0-9]+")) {
      delete obj[k];
    }
  }

  // Convert any bigNumbers to numbers or eth
  return bigToNumber(obj);
}

// This is dumb. Havent found the right abstraction for converting numbers yet :(
// A naming convention would have been a good idea, eh?
function bigToNumber(obj) {
  const weiKeys = /avax|Amt|balance|GGP|ggpRewards|ggpStaked/;
  const bigKeys = Object.keys(obj).filter((k) => BigNumber.isBigNumber(obj[k]));
  for (const k of bigKeys) {
    if (obj[k].toHexString() === "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") {
      obj[k] = Infinity;
    } else if (weiKeys.test(k)) {
      obj[k] = obj[k].mul(100).div(ethersConstants.WeiPerEther).toNumber() / 100;
    } else {
      obj[k] = obj[k].toNumber();
    }
  }
  return obj;
}

export {
  MINIPOOL_STATUS_MAP,
  ORC_STATE_MAP,
  formatters,
  transformerFns,
  pipeAsyncFunctions,
  pipe,
  pick,
  sha256,
  cb58Encode,
  cb58Decode,
  makeRpc,
  bigToNumber,
  unfuckEthersObj,
};
