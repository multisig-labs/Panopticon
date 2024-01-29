import { ORC_STATE_MAP, formatters } from "/js/utils.js";
import { DEPLOYMENT } from "/deployments/selected.js";

// Formatters specific for use in Tabulator cells, try to reuse
// utils.formatters as much as possible
function formatUnixTime(cell, formatterParams, onRendered) {
  return formatters.unixToISOOnly(cell.getValue());
}

function formatAmount(cell, formatterParams, onRendered) {
  return formatters.formatAmount(cell.getValue());
}

function formatEther(cell, formatterParams, onRendered) {
  return formatters.formatEther(cell.getValue());
}

function formatAvaxAmount(cell, formatterParams, onRendered) {
  return formatters.formatAvax(cell.getValue());
}

function formatNumber(cell, formatterParams, onRendered) {
  return formatters.formatNumber(cell.getValue());
}

function formatGlacierAmount(cell, formatterParams, onRendered) {
  return formatters.formatAvax(cell.getValue()[0].amount);
}

function formatPct(cell, formatterParams, onRendered) {
  return formatters.formatPct(cell.getValue());
}

function formatDurationHumanUntil(cell, formatterParams, onRendered) {
  const timestamp = Math.floor(Date.now() / 1000);
  return formatters.formatDurationHumanShort(cell.getValue() - timestamp);
}

function formatDurationHumanShort(cell, formatterParams, onRendered) {
  return formatters.formatDurationHumanShort(cell.getValue());
}

function formatSnowtraceLinkIcon(cell, formatterParams, onRendered) {
  return `<a class="mirror" target="_blank" href="${DEPLOYMENT.cExplorerURL}/address/${cell.getValue()}">⎋</a>`;
}

function formatNodeIdLink(cell, formatterParams, onRendered) {
  return `<a target="_blank" href='https://avascan.info/staking/validator/${cell.getValue()}'>${cell.getValue()}</a>`;
}

// Convert a bool to yes/no
function formatYesNo(cell, formatterParams, onRendered) {
  return cell.getValue() ? "Yes" : "No";
}

function formatTxIdLink(cell, formatterParams, onRendered) {
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
    return `<a href="${DEPLOYMENT.cExplorerURL}${tx}" target="_blank">${tx}</a>`;
  } else {
    return `<a href="${DEPLOYMENT.pExplorerURL}${tx}" target="_blank">${tx}</a>`;
  }
}

// Accessors are used when exporting tabulator to CSV
function accessUnixTime(value, data, accessorParams) {
  return formatters.unixToISOOnly(value);
}

// Definitions for Tabulator tables
const ggAVAXDef = {
  data: [], // Filled in later by JS
  index: "startTimestamp",
  // height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  selectable: true,
  clipboard: "copy",
  clipboardCopyRowRange: "selected",
  columns: [
    { width: 20, formatter: "responsiveCollapse", headerSort: false },
    { title: "Started", field: "startTimestamp", formatter: formatUnixTime },
    { title: "Node", field: "nodeId", formatter: formatNodeIdLink },
    { title: "Amount", field: "amountStaked", formatter: formatGlacierAmount },
    { title: "Reward", field: "estimatedReward", formatter: formatAvaxAmount },
    { title: "Period Ends", field: "endTimestamp", formatter: formatDurationHumanUntil },
  ],
};

const ggAVAXStatsDef = {
  data: [], // Filled in later by JS
  index: "title",
  // height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
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

// Definitions for Tabulator tables
const pandasiaDef = {
  data: [], // Filled in later by JS
  index: "ID",
  // height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  selectable: true,
  clipboard: "copy",
  clipboardCopyRowRange: "selected",
  columns: [
    { title: "ID", field: "ID", width: 50 },
    {
      title: "Height",
      field: "Height",
      width: 100,
    },
    {
      title: "Tree Type",
      field: "TreeType",
      width: 100,
    },
    {
      title: "Root",
      field: "Root",
    },
  ],
};

const pandasiaAirdropsDef = {
  data: [], // Filled in later by JS
  index: "idx",
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  selectable: true,
  clipboard: "copy",
  clipboardCopyRowRange: "selected",
  columns: [
    { title: "ID", field: "airdropId", width: 50, formatter: formatNumber },
    { title: "Balance", field: "balance", width: 100, formatter: formatEther },
    { title: "Token Address", field: "erc20", width: 300 },
    { title: "Owner", field: "owner", width: 300 },
    { title: "Starts At", field: "startsAt", width: 200, formatter: formatUnixTime },
    { title: "Expires At", field: "expiresAt", width: 200, formatter: formatUnixTime },
    { title: "Claim Amount", field: "claimAmount", width: 100, formatter: formatEther },
    { title: "Custom Root", field: "customRoot", width: 300 },
  ],
};

const pandasiaUsersDef = {
  data: [], // Filled in later by JS
  index: "idx",
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  selectable: true,
  clipboard: "copy",
  clipboardCopyRowRange: "selected",
  columns: [
    { title: "ID", field: "idx", width: 50, formatter: formatNumber },
    { title: "C Chain Address", field: "cChainAddr", width: 300 },
    { title: "P Chain Address", field: "pChainAddr", width: 300 },
  ],
};

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
    { title: "Address", field: "address" },
    { title: "", field: "address", width: 30, formatter: formatSnowtraceLinkIcon },
  ],
};

const minipoolsDef = {
  data: [], // Filled in later by JS
  index: "index",
  height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
  // rowHeight: 30,
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  groupBy: "status",
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
      field: "status",
      width: 90,
    },
    {
      title: "Dur",
      field: "duration",
      formatter: formatDurationHumanShort,
      width: 60,
    },
    {
      title: "Start",
      field: "initialStartTime",
      formatter: formatUnixTime,
      accessor: accessUnixTime,
      width: 90,
    },
    {
      title: "End",
      field: "endTime",
      formatter: formatUnixTime,
      accessor: accessUnixTime,
      width: 90,
    },
    {
      title: "CycleEnd",
      field: "cycleEndTime",
      formatter: formatUnixTime,
      accessor: accessUnixTime,
      width: 90,
    },
    { title: "Owner", field: "owner", sorter: "alphanum", width: 120 },
    {
      title: "avaxInital",
      field: "avaxNodeOpInitialAmt",
      formatter: formatAmount,
      width: 90,
    },
    {
      title: "avaxCurrent",
      field: "avaxNodeOpAmt",
      formatter: formatAmount,
      width: 100,
    },
    {
      title: "QueueDur",
      field: "queueDuration",
      formatter: formatDurationHumanShort,
      sorter: "number",
      responsive: 9,
    },
    {
      title: "AvaxLiqStkr",
      field: "avaxLiquidStakerAmt",
      minWidth: 5000,
      formatter: formatAmount,
      responsive: 9,
    },
    {
      title: "Error",
      field: "errorCode",
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "GGPSlash",
      field: "ggpSlashAmt",
      minWidth: 5000,
      responsive: 9,
    },
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
      formatter: formatAmount,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "avaxNodeOpRewardAmt",
      field: "avaxNodeOpRewardAmt",
      formatter: formatAmount,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "avaxLiquidStakerRewardAmt",
      field: "avaxLiquidStakerRewardAmt",
      formatter: formatAmount,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "Staking txID",
      field: "txID",
      formatter: formatTxIdLink,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "Created",
      field: "creationTime",
      formatter: formatUnixTime,
      accessor: accessUnixTime,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "cycleStartTime",
      field: "startTime",
      formatter: formatUnixTime,
      accessor: accessUnixTime,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "Snowtrace",
      field: "owner",
      formatter: formatSnowtraceLinkIcon,
      width: 5000,
      responsive: 9,
    },
  ],
};

// Force all columns to be in the CSV download
minipoolsDef.columns.forEach((c) => (c.download = true));

const stakersDef = {
  data: [], // Filled in later by JS
  index: "stakerAddr",
  height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
  // rowHeight: 30,
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  selectable: true,
  clipboard: "copy",
  clipboardCopyRowRange: "selected",
  groupBy: function (data) {
    return "NodeOps";
  },
  groupHeader: function (value, count, data, group) {
    //value - the value all members of this group share
    //count - the number of rows in this group
    //data - an array of all the row data objects in this group
    //group - the group component for the group

    return value + "<span style='color:#d00; margin-left:10px;'>(" + count + " item)</span>";
  },
  // rowFormatter: function (row) {
  //   let data = row.getData();
  //   if (data.ggpSlashAmt > 0) {
  //     row.getElement().style.backgroundColor = "#ff0000bf";
  //   }
  // },
  columns: [
    { width: 20, formatter: "responsiveCollapse", headerSort: false },
    { title: "StakerAddr", field: "stakerAddr", sorter: "alphanum", width: 150 },
    {
      title: "Eligibility Date",
      field: "rewardsStartTime",
      formatter: formatUnixTime,
      accessor: accessUnixTime,
      headerWordWrap: true,
      width: 70,
    },
    {
      title: "GGP Rwrds Pool Pct",
      field: "ggpRewardsPoolPct",
      formatter: formatPct,
      headerWordWrap: true,
      width: 80,
    },
    {
      title: "GGP Rwrds Amt Estimate",
      field: "ggpRewardsPoolAmt",
      formatter: formatAmount,
      headerWordWrap: true,
      width: 75,
    },
    {
      title: "GGP Rwds Collat Ratio",
      field: "getEffectiveRewardsRatio",
      formatter: formatPct,
      headerWordWrap: true,
      width: 75,
    },
    {
      title: "GGP Staked",
      field: "ggpStaked",
      formatter: formatAmount,
      headerWordWrap: true,
      width: 75,
    },
    // { title: "avaxStaked", field: "avaxStaked",  width: 75 },
    // { title: "avaxAssigned", field: "avaxAssigned",  width: 150 },
    {
      title: "Effective GGP Staked",
      field: "getEffectiveGGPStaked",
      formatter: formatAmount,
      headerWordWrap: true,
      width: 75,
    },
    {
      title: "Unclaimed GGP Rewards",
      field: "ggpRewards",
      formatter: formatAmount,
      headerWordWrap: true,
      width: 80,
    },
    {
      title: "GGP Unstaked",
      field: "balanceOf",
      formatter: formatAmount,
      headerWordWrap: true,
      width: 75,
    },
    {
      title: "AVAX Validating HighWater",
      field: "avaxValidatingHighWater",
      formatter: formatAmount,
      headerWordWrap: true,
      width: 75,
    },
    {
      title: "Minimum GGP Stake",
      field: "getMinimumGGPStake",
      formatter: formatAmount,
      headerWordWrap: true,
      width: 75,
    },
    {
      title: "Collat Ratio",
      field: "getCollateralizationRatio",
      formatter: formatPct,
      headerWordWrap: true,
      width: 75,
    },
    {
      title: "Eligible For Rewards This Cycle",
      field: "isEligible",
      formatter: formatYesNo,
      headerWordWrap: true,
      width: 75,
    },
    { title: "Last Rwds Cycle Completed", field: "lastRewardsCycleCompleted", headerWordWrap: true, width: 75 },
    { title: "Staker Addr Snowtrace", field: "stakerAddr", formatter: formatSnowtraceLinkIcon, width: 35 },
    {
      title: "GGP Locked Until",
      field: "ggpLockedUntil",
      formatter: formatUnixTime,
      accessor: accessUnixTime,
      headerWordWrap: true,
      width: 75,
    },
  ],
};

// Force all columns to be in the CSV download
stakersDef.columns.forEach((c) => (c.download = true));

export {
  minipoolsDef,
  stakersDef,
  dashboardDef,
  contractsDef,
  ggAVAXDef,
  ggAVAXStatsDef,
  pandasiaDef,
  pandasiaAirdropsDef,
  pandasiaUsersDef,
};
