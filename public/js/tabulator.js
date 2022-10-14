// Definitions for Tabulator tables

const dashboardDef = {
  data: [], //assign data to table
  index: "title",
  // reactiveData: true,
  // height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
  layout: "fitColumns", //fit columns to width of table (optional)
  responsiveLayout: "collapse",
  responsiveLayoutCollapseStartOpen: false,
  groupBy: "contract",
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
  data: [], //assign data to table
  index: "index",
  // reactiveData: true,
  height: 600, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
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
    //Define Table Columns
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
      formatter: txFormatter,
      minWidth: 5000,
      responsive: 9,
    },
  ],
};

export { minipoolsDef, dashboardDef };
