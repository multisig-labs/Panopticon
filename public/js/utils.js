import { utils as ethersUtils, constants as ethersConstants, BigNumber } from "https://esm.sh/ethers@5.7.2";
import { DateTime, Duration } from "https://esm.sh/luxon@3.3.0";

function pick(o, ...props) {
  return Object.assign({}, ...props.map((prop) => ({ [prop]: o[prop] })));
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

export { formatters, transformerFns, pipeAsyncFunctions, pipe, pick, sha256, cb58Encode, cb58Decode, makeRpc };
