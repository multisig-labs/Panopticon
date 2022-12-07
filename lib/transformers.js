// Etherjs read-only interface to GoGoPool Protocol

import { utils as ethersUtils } from "https://cdn.skypack.dev/ethers";
import { pipeAsyncFunctions, cb58Encode } from "./utils.js";

// transforms look like ["stripNumberKeys", "formatEther"]
// Fn will take array of objs and send them through the defined transforms
async function transformer(transforms, objs) {
  const xfns = {
    // Etherjs sends a weird obj, so make it a standard one
    convertToObj: (obj) => Object.assign({}, obj),
    stripNumberKeys: (obj) => {
      for (const k of Object.keys(obj)) {
        if (k.match("[0-9]+")) {
          delete obj[k];
        }
      }
      return obj;
    },
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

  const fns = transforms.map((name) => xfns[name]);
  const pipeline = pipeAsyncFunctions(...fns);
  const promises = objs.map((obj) => pipeline(obj));
  const xobjs = await Promise.all(promises);
  return xobjs;
}

async function minipoolTransformer(objs) {
  // indexToNum is necessary because Tabulator.js requires an int key for each row, BigInt doesnt work
  // the encode* transforms are async in order to use cb58, not sure how to do async in tabulator formatters, so doing it here
  const pipeline = ["convertToObj", "stripNumberKeys", "indexToNum", "encodeNodeID", "encodeTxID"];
  return await transformer(pipeline, objs);
}

async function stakerTransformer(objs) {
  const pipeline = ["convertToObj", "stripNumberKeys"];
  return await transformer(pipeline, objs);
}

export { minipoolTransformer, stakerTransformer };
