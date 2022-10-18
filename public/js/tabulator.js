import { ORC_STATE_MAP, formatters } from "/js/utils.js";
import { DEPLOYMENT } from "/deployments/selected.js";

// Formatters specific for use in Tabulator cells
function formatEther(cell, formatterParams, onRendered) {
  return formatters.formatEther(cell.getValue());
}

function formatUnixTime(cell, formatterParams, onRendered) {
  return formatters.unixToISO(cell.getValue());
}

function formatTxID(cell, formatterParams, onRendered) {
  const tx = cell.getValue();
  if (tx == "11111111111111111111111111111111LpoYY") {
    return "";
  }
  if (tx.substring(0, 2) === "0x") {
    return `<a href="https://anr.fly.dev/cgi-bin/txc/${tx}" target="_blank">${tx}</a>`;
  } else {
    return `<a href="https://anr.fly.dev/cgi-bin/txp/${tx}" target="_blank">${tx}</a>`;
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

const minipoolsDef = {
  data: [], // Filled in later by JS
  index: "index",
  // height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  groupBy: "statusName",
  groupHeader: function (value, count, data, group) {
    return `${value}<span style="color:#00d; margin-left:10px;"">(${count} items)</span>`;
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
      field: "statusName",
      width: 90,
    },
    { title: "Dur", field: "duration", width: 60 },
    {
      title: "Start",
      field: "startTime",
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
    {
      title: "End",
      field: "endTime",
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
    { title: "Owner", field: "owner", width: 120 },
    {
      title: "AvaxNodeOp",
      field: "avaxNodeOpAmt",
    },
    { title: "AvaxLiqStkr", field: "avaxLiquidStakerAmt" },
    { title: "GGPSlash", field: "ggpSlashAmt" },
    { title: "Error", field: "errorMsg" },
    {
      title: "NodeAddr",
      field: "nodeAddr",
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "MultisigAddr",
      field: "multisigAddr",
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "avaxTotalRewardAmt",
      field: "avaxTotalRewardAmt",
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "avaxNodeOpRewardAmt",
      field: "avaxNodeOpRewardAmt",
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "avaxLiquidStakerRewardAmt",
      field: "avaxLiquidStakerRewardAmt",
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "txID",
      field: "txID",
      formatter: formatTxID,
      minWidth: 5000,
      responsive: 9,
    },
    { title: "startTimeUnix", field: "startTimeUnix", minWidth: 5000, responsive: 9 },
    { title: "endTimeUnix", field: "endTimeUnix", minWidth: 5000, responsive: 9 },
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
    { title: "StakerAddr", field: "stakerAddr" },
    { title: "MP Count", field: "minipoolCount", width: 100 },
    {
      title: "Start",
      field: "rewardsStartTime",
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
    { title: "ggpStaked", field: "ggpStaked", width: 150 },
    { title: "avaxStaked", field: "avaxStaked", width: 150 },
    { title: "avaxAssigned", field: "avaxAssigned", width: 150 },
    { title: "ggpRewards", field: "ggpRewards", width: 150 },
  ],
};

const orcDef = {
  data: [], // Filled in later by JS
  index: "ID",
  // height: 900, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
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
    { title: "State", field: "State", width: 90 },
    { title: "Status", field: "Status", width: 70 },
    { title: "Dur", field: "Duration", width: 60 },
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
    { title: "Owner", field: "Owner", width: 120 },
    { title: "AvaxNodeOp", field: "AvaxNodeOpAmt", formatter: formatEther },
    { title: "AvaxUser", field: "AvaxUserAmt", formatter: formatEther },
    { title: "GGPSlash", field: "GgpSlashAmt", formatter: formatEther },
    { title: "Error", field: "MinipoolError" },
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

export { orcDef, minipoolsDef, stakersDef, dashboardDef };
