// Etherjs read-only interface to GoGoPool Protocol

import { DateTime } from "https://cdn.skypack.dev/luxon";
import { utils as ethersUtils } from "https://cdn.skypack.dev/ethers";
import { MINIPOOL_STATUS_MAP, pipeAsyncFunctions, cb58Encode } from "/js/utils.js";

// transforms look like ["stripNumberKeys", "formatEther"]
// Fn will take array of objs and send them through the defined transforms
async function transformer(transforms, addressLabels, objs) {
  const xfns = {
    // Etherjs sends a weird obj, so make it a standard one
    convertToObj: async (obj) => Object.assign({}, obj),
    stripNumberKeys: async (obj) => {
      for (const k of Object.keys(obj)) {
        if (k.match("[0-9]+")) {
          delete obj[k];
        }
      }
      return obj;
    },
    formatEther: async (obj) => {
      for (const k of Object.keys(obj)) {
        if (k.match("Amt$")) {
          obj[k] = ethersUtils.formatEther(obj[k]);
        }
      }
      return obj;
    },
    bigToNum: async (obj) => {
      for (const k of Object.keys(obj)) {
        if (obj[k].constructor.name === "BigNumber") {
          obj[k] = obj[k].toNumber();
        }
      }
      return obj;
    },
    unixToISO: (obj) => {
      for (const k of Object.keys(obj)) {
        if (k.match("Time$")) {
          obj[k] = DateTime.fromSeconds(obj[k]);
        }
      }
      return obj;
    },
    labelAddresses: (obj) => {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string" && addressLabels[v]) {
          obj[k] = addressLabels[v];
        }
      }
      return obj;
    },
    addStatusName: (obj) => {
      obj.statusName = MINIPOOL_STATUS_MAP[obj.status];
      return obj;
    },
    decodeErrorMsg: (obj) => {
      obj.errorMsg = ethersUtils.toUtf8String(ethersUtils.stripZeros(obj.errorCode));
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

  const fns = transforms.map((name) => xfns[name]);
  const pipeline = pipeAsyncFunctions(...fns);
  const promises = objs.map((obj) => pipeline(obj));
  const xobjs = await Promise.all(promises);
  return xobjs;
}

export { transformer };
