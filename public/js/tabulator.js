import { ORC_STATE_MAP, formatters } from "/js/utils.js";
import { DEPLOYMENT } from "/deployments/selected.js";

// Formatters specific for use in Tabulator cells
function formatEther(cell, formatterParams, onRendered) {
  return formatters.formatEther(cell.getValue());
}

function formatAvax(cell, formatterParams, onRendered) {
  return formatters.formatAvax(cell.getValue());
}

function formatUnixTime(cell, formatterParams, onRendered) {
  return formatters.unixToISO(cell.getValue());
}

function formatEtherPct(cell, formatterParams, onRendered) {
  return formatters.formatEtherPct(cell.getValue());
}

function formatMPStatus(cell, formatterParams, onRendered) {
  return formatters.formatMPStatus(cell.getValue());
}

function formatErrorMsg(cell, formatterParams, onRendered) {
  return formatters.formatErrorMsg(cell.getValue());
}

function labelAddress(cell, formatterParams, onRendered) {
  return formatters.labelAddress(cell.getValue(), DEPLOYMENT.EOALabels);
}

function formatDuration(cell, formatterParams, onRendered) {
  return formatters.formatDuration(cell.getValue());
}

function formatSnowtrace(cell, formatterParams, onRendered) {
  return `<a target="_blank" href="https://snowtrace.io/address/${cell.getValue()}">${cell.getValue()}</a>`;
}

function formatTxID(cell, formatterParams, onRendered) {
  const tx = cell.getValue();
  // These are zero values converted to CB58
  if (
    tx === undefined ||
    tx === null ||
    tx === "11111111111111111111111111111111LpoYY" ||
    tx === "111111111111111111111115WtNroYg1XQm1fmuvF"
  ) {
    return "";
  }
  if (tx.substring(0, 2) === "0x") {
    return `<a href="${DEPLOYMENT.cExplorerURL}/${tx}" target="_blank">${tx}</a>`;
  } else {
    return `<a href="${DEPLOYMENT.pExplorerURL}/${tx}" target="_blank">${tx}</a>`;
  }
}

// Definitions for Tabulator tables

const dashboardDef = {
  data: [], // Filled in later by JS
  index: "title",
  // height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  groupBy: "contract", // contract name
  groupHeader: function (value, count, data, group) {
    return `${value} ${data[0].address.substring(
      0,
      6
    )} <span style="color:#00d; margin-left:10px;"">(${count} items)</span>`;
  },
  selectable: true,
  clipboard: "copy",
  clipboardCopyRowRange: "selected",
  columns: [
    { width: 20, formatter: "responsiveCollapse", headerSort: false },
    { title: "Variable", field: "title", width: 300 },
    { title: "Value", field: "value" },
    { title: "Desc", field: "desc" },
  ],
};

const contractsDef = {
  data: [], // Filled in later by JS
  index: "name",
  // height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  selectable: true,
  clipboard: "copy",
  clipboardCopyRowRange: "selected",
  columns: [
    { title: "Contract", field: "name", width: 150 },
    { title: "Address", field: "address", formatter: formatSnowtrace },
  ],
};

const minipoolsDef = {
  data: [], // Filled in later by JS
  index: "index",
  // height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  groupBy: "status",
  groupHeader: function (value, count, data, group) {
    return `${formatters.formatMPStatus(value)}<span style="color:#00d; margin-left:10px;"">(${count} items)</span>`;
  },
  selectable: true,
  clipboard: "copy",
  clipboardCopyRowRange: "selected",
  rowFormatter: function (row) {
    let data = row.getData();
    if (data.ggpSlashAmt > 0) {
      row.getElement().style.backgroundColor = "#ff0000bf";
    }
  },
  columns: [
    { width: 20, formatter: "responsiveCollapse", headerSort: false },
    { title: "idx", field: "index", width: 5 },
    { title: "NodeID", field: "nodeID" },
    {
      title: "Status",
      field: "status",
      formatter: formatMPStatus,
      width: 90,
    },
    { title: "Dur", field: "duration", width: 60 },
    {
      title: "Start",
      field: "startTime",
      width: 90,
      formatter: formatUnixTime,
    },
    {
      title: "End",
      field: "endTime",
      width: 90,
      formatter: formatUnixTime,
    },
    { title: "Owner", field: "owner", formatter: labelAddress, width: 120 },
    {
      title: "AvaxNodeOp",
      field: "avaxNodeOpAmt",
      formatter: formatEther,
    },
    { title: "AvaxLiqStkr", field: "avaxLiquidStakerAmt", formatter: formatEther },
    { title: "GGPSlash", field: "ggpSlashAmt", formatter: formatEther },
    { title: "Error", field: "errorCode", formatter: formatErrorMsg },
    { title: "Error", field: "errorCode", formatter: formatErrorMsg, minWidth: 5000, responsive: 9 },
    {
      title: "NodeAddr",
      field: "nodeAddr",
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "MultisigAddr",
      field: "multisigAddr",
      formatter: labelAddress,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "avaxTotalRewardAmt",
      field: "avaxTotalRewardAmt",
      formatter: formatEther,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "avaxNodeOpRewardAmt",
      field: "avaxNodeOpRewardAmt",
      formatter: formatEther,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "avaxLiquidStakerRewardAmt",
      field: "avaxLiquidStakerRewardAmt",
      formatter: formatEther,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "Staking txID",
      field: "txID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "avaxNodeOpInitialAmt",
      field: "avaxNodeOpInitialAmt",
      formatter: formatEther,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "initialStartTime",
      field: "initialStartTime",
      formatter: formatUnixTime,
      minWidth: 5000,
      responsive: 9,
    },
  ],
};

const stakersDef = {
  data: [], // Filled in later by JS
  index: "stakerAddr",
  // height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  selectable: true,
  clipboard: "copy",
  clipboardCopyRowRange: "selected",
  // rowFormatter: function (row) {
  //   let data = row.getData();
  //   if (data.ggpSlashAmt > 0) {
  //     row.getElement().style.backgroundColor = "#ff0000bf";
  //   }
  // },
  columns: [
    { width: 20, formatter: "responsiveCollapse", headerSort: false },
    { title: "StakerAddr", field: "stakerAddr", formatter: formatSnowtrace, width: 150 },
    { title: "MP Count", field: "minipoolCount", width: 100 },
    {
      title: "rwdStart",
      field: "rewardsStartTime",
      width: 120,
      formatter: formatUnixTime,
    },
    { title: "ggpStaked", field: "ggpStaked", formatter: formatEther, width: 150 },
    { title: "avaxStaked", field: "avaxStaked", formatter: formatEther, width: 150 },
    { title: "avaxAssigned", field: "avaxAssigned", formatter: formatEther, width: 150 },
    { title: "collatRatio", field: "getCollateralizationRatio", formatter: formatEtherPct, width: 150 },
    { title: "ggpRewards", field: "ggpRewards", formatter: formatEther, width: 150 },
    { title: "lastRwdsCycComp", field: "lastRewardsCycleCompleted", width: 150 },
    { title: "minGGPStake", field: "getMinimumGGPStake", formatter: formatEther, width: 150 },
    { title: "EffRwdsRatio", field: "getEffectiveRewardsRatio", formatter: formatEtherPct, width: 150 },
    { title: "AVAXValidgHighWater", field: "getAVAXValidatingHighWater", formatter: formatEther, width: 150 },
    { title: "EffectGGPStaked", field: "getEffectiveGGPStaked", formatter: formatEther, width: 150 },
    { title: "CollatRatio", field: "getCollateralizationRatio", formatter: formatEther, width: 150 },
    { title: "ggpLockedUntil", field: "ggpLockedUntil", formatter: formatEther, width: 150 },
  ],
};

const orcDef = {
  data: [], // Filled in later by JS
  index: "ID",
  height: 900, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  groupBy: "State",
  groupHeader: function (value, count, data, group) {
    return `${ORC_STATE_MAP[value]}<span style="color:#00d; margin-left:10px;">(${count} items)</span>`;
  },
  selectable: true,
  clipboard: "copy",
  clipboardCopyRowRange: "selected",
  columns: [
    { width: 20, formatter: "responsiveCollapse", headerSort: false },
    { title: "ID", field: "ID", width: 5 },
    { title: "NodeID", field: "NodeID" },
    { title: "State", field: "State", width: 90, formatter: (cell) => ORC_STATE_MAP[cell.getValue()] },
    // { title: "Status", field: "Status", width: 70 },
    { title: "Dur", field: "Duration", width: 60 },
    {
      title: "End",
      field: "end",
      width: 60,
      mutator: function (value, data) {
        const end = luxon.DateTime.fromSeconds(data.InitialStartTime + data.Duration);
        const dur = end.diffNow(["days", "hours"]);
        return end.toRelative({ style: "short" });
      },
    },
    {
      title: "Created",
      field: "CreatedAt",
      width: 90,
      formatter: "datetime",
      sorter: "date",
      formatterParams: {
        inputFormat: "iso",
        outputFormat: "MM/dd/yy",
        invalidPlaceholder: "(invalid date)",
        timezone: "America/Los_Angeles",
      },
    },
    { title: "Owner", field: "Owner", formatter: labelAddress, width: 120 },
    { title: "AvaxNodeOp", field: "AvaxNodeOpAmt", formatter: formatAvax },
    { title: "AvaxUser", field: "AvaxUserAmt", formatter: formatAvax },
    { title: "GGPSlash", field: "GgpSlashAmt", formatter: formatAvax },
    { title: "Error", field: "MinipoolError" },
    { title: "Error", field: "MinipoolError", minWidth: 5000, responsive: 9 },
    {
      title: "NodeAddr",
      field: "NodeAddr",
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "MultisigAddr",
      field: "MultisigAddr",
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "ClaimMinipoolTxID",
      field: "ClaimMinipoolTxID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "ExportC2PTxID",
      field: "ExportC2PTxID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "ImportC2PTxID",
      field: "ImportC2PTxID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "StakeMinipoolTxID",
      field: "StakeMinipoolTxID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "RecordStakingStartTxID",
      field: "RecordStakingStartTxID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "ExportP2CTxID",
      field: "ExportP2CTxID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "ImportP2CTxID",
      field: "ImportP2CTxID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "RecordStakingEndTxID",
      field: "RecordStakingEndTxID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "RecordStakingEndThenMaybeCycleTxID",
      field: "RecordStakingEndThenMaybeCycleTxID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "RecordStakingErrorTxID",
      field: "RecordStakingErrorTxID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "CancelMinipoolTxID",
      field: "CancelMinipoolTxID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "DeletedAt",
      field: "DeletedAt",
      formatter: formatUnixTime,
      minWidth: 5000,
      responsive: 9,
    },
  ],
};

export { orcDef, minipoolsDef, stakersDef, dashboardDef, contractsDef };
