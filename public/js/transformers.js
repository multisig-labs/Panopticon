import { pipeAsyncFunctions, formatters, bigToNumber, unfuckEthersObj } from "/js/utils.js";

// process each obj through a pipeline of fns
async function transformer(fns, objs) {
  const pipeline = pipeAsyncFunctions(...fns);
  const promises = objs.map((obj) => pipeline(obj));
  const xobjs = await Promise.all(promises);
  return xobjs;
}

async function fixupMinipool(obj) {
  obj.nodeAddr = obj.nodeID;
  obj.nodeID = await formatters.nodeAddrToId(obj.nodeAddr);
  obj.status = formatters.formatMPStatus(obj.status);
  obj.txID = await formatters.toCB58(obj.txID);

  obj.errorCode = formatters.formatErrorMsg(obj.errorCode);

  if (obj.endTime === 0 && obj.startTime !== 0) {
    obj.endTime = obj.startTime + obj.duration;
  }

  if (obj.startTime !== 0) {
    obj.cycleEndTime = obj.startTime + 15 * 24 * 60 * 60;
  }

  if (obj.creationTime > 0) {
    const t = obj.initialStartTime === 0 ? Math.floor(Date.now() / 1000) : obj.initialStartTime;
    obj.queueDuration = t - obj.creationTime;
  }

  return obj;
}

async function minipoolsTransformer(objs) {
  const pipeline = [unfuckEthersObj, fixupMinipool];
  return await transformer(pipeline, objs);
}

async function stakersTransformerStep1(objs) {
  return await transformer([unfuckEthersObj], objs);
}

async function stakersTransformerStep2(objs) {
  return await transformer([bigToNumber], objs);
}

async function ggavaxDelegationsTransformer(objs) {
  const pipeline = ["fixupDelegations"];
}

export { minipoolsTransformer, stakersTransformerStep1, stakersTransformerStep2 };
