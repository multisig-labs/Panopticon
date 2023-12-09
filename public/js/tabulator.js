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

function formatPct(cell, formatterParams, onRendered) {
  return formatters.formatPct(cell.getValue());
}

function formatNumber(cell, formatterParams, onRendered) {
  return formatters.formatNumber(cell.getValue());
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

function formatDurationHumanUntil(cell, formatterParams, onRendered) {
  const timestamp = Math.floor(Date.now() / 1000);
  return formatters.formatDurationHuman(cell.getValue() - timestamp);
}

function formatDurationHuman(cell, formatterParams, onRendered) {
  return formatters.formatDurationHuman(cell.getValue());
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

function formatGlacierAmount(cell, formatterParams, onRendered) {
  return formatters.formatAvax(cell.getValue()[0].amount);
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
    return `<a href="${DEPLOYMENT.cExplorerURL}${tx}" target="_blank">${tx}</a>`;
  } else {
    return `<a href="${DEPLOYMENT.pExplorerURL}${tx}" target="_blank">${tx}</a>`;
  }
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
    { title: "Reward", field: "estimatedReward", formatter: formatAvax },
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
    { title: "Dur", field: "duration", formatter: formatDurationHumanShort, width: 60 },
    {
      title: "Start",
      field: "initialStartTime",
      width: 90,
      formatter: formatUnixTime,
    },
    {
      title: "End",
      field: "endTime",
      width: 90,
      formatter: formatUnixTime,
    },
    {
      title: "CycleEnd",
      field: "cycleEndTime",
      formatter: formatUnixTime,
      width: 90,
    },
    { title: "Owner", field: "owner", formatter: labelAddress, sorter: "alphanum", width: 120 },
    {
      title: "avaxInital",
      field: "avaxNodeOpInitialAmt",
      width: 90,
      formatter: formatEther,
    },
    {
      title: "avaxCurrent",
      field: "avaxNodeOpAmt",
      width: 100,
      formatter: formatEther,
    },
    { title: "QueueDur", field: "queueDuration", formatter: formatDurationHuman, sorter: "number", responsive: 9 },
    { title: "AvaxLiqStkr", field: "avaxLiquidStakerAmt", formatter: formatEther, minWidth: 5000, responsive: 9 },
    { title: "Error", field: "errorCode", formatter: formatErrorMsg, minWidth: 5000, responsive: 9 },
    { title: "GGPSlash", field: "ggpSlashAmt", formatter: formatEther, minWidth: 5000, responsive: 9 },
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
      title: "Created",
      field: "creationTime",
      minWidth: 5000,
      formatter: formatUnixTime,
      responsive: 9,
    },
    {
      title: "cycleStartTime",
      field: "startTime",
      formatter: formatUnixTime,
      minWidth: 5000,
      responsive: 9,
    },
    {
      title: "cycleEndTime",
      field: "cycleEndTime",
      formatter: formatUnixTime,
      minWidth: 5000,
      responsive: 9,
    },
    { title: "Snowtrace", field: "owner", formatter: formatSnowtraceLinkIcon, width: 5000, responsive: 9 },
  ],
};

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
    return "Eligible NodeOps";
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
      width: 70,
      headerWordWrap: true,
      formatter: formatUnixTime,
    },
    {
      title: "GGP Investor Rwrds Pool Pct",
      field: "ggpInvestorRewardsPoolPct",
      formatter: formatPct,
      headerWordWrap: true,
      width: 80,
    },
    {
      title: "GGP User Rwrds Pool Pct",
      field: "ggpUserRewardsPoolPct",
      formatter: formatPct,
      headerWordWrap: true,
      width: 80,
    },
    {
      title: "GGP Total Rwrds Pool Pct",
      field: "ggpRewardsPoolPct",
      formatter: formatPct,
      headerWordWrap: true,
      width: 80,
    },
    {
      title: "GGP Rwrds Amt Estimate",
      field: "ggpRewardsPoolAmt",
      formatter: formatNumber,
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
    { title: "GGP Staked", field: "ggpStaked", formatter: formatNumber, headerWordWrap: true, width: 75 },
    // { title: "avaxStaked", field: "avaxStaked", formatter: formatNumber, width: 75 },
    // { title: "avaxAssigned", field: "avaxAssigned", formatter: formatNumber, width: 150 },
    {
      title: "Effective GGP Staked",
      field: "getEffectiveGGPStaked",
      formatter: formatNumber,
      headerWordWrap: true,
      width: 75,
    },
    { title: "Unclaimed GGP Rewards", field: "ggpRewards", formatter: formatNumber, headerWordWrap: true, width: 80 },
    { title: "GGP Unstaked", field: "balanceOf", formatter: formatNumber, headerWordWrap: true, width: 75 },
    {
      title: "AVAX Validating HighWater",
      field: "avaxValidatingHighWater",
      formatter: formatNumber,
      headerWordWrap: true,
      width: 75,
    },
    {
      title: "Minimum GGP Stake",
      field: "getMinimumGGPStake",
      formatter: formatNumber,
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
    { title: "GGP Locked Until", field: "ggpLockedUntil", formatter: formatUnixTime, headerWordWrap: true, width: 75 },
    { title: "Last Rwds Cycle Completed", field: "lastRewardsCycleCompleted", headerWordWrap: true, width: 75 },
    { title: "Staker Addr Snowtrace", field: "stakerAddr", formatter: formatSnowtraceLinkIcon, width: 35 },
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

export { orcDef, minipoolsDef, stakersDef, dashboardDef, contractsDef, ggAVAXDef, ggAVAXStatsDef };
