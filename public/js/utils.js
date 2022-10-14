const STATEMAP = {
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
  17: "RecStkErrStrt",
  18: "CancelMPStrt",
  19: "RecStkEndFin",
  20: "RecStkErrorFin",
  21: "CancelMPFin",
  22: "MPError",
};

function addrFormatter(cell, formatterParams, onRendered) {
  const addr = cell.getValue();
  return addr.substring(0, 6) + ".." + addr.substring(addr.length - 4);
}

function txFormatter(cell, formatterParams, onRendered) {
  const tx = cell.getValue();
  if (tx.substring(0, 2) === "0x") {
    return `<a href="https://anr.fly.dev/cgi-bin/txc/${tx}" target="_blank">${tx}</a>`;
  } else {
    return `<a href="https://anr.fly.dev/cgi-bin/txp/${tx}" target="_blank">${tx}</a>`;
  }
}

function stateFormatter(cell, formatterParams, onRendered) {
  console.log(cell.getValue());
  return STATEMAP[cell.getValue()];
}

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
