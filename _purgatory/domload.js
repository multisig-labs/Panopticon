// Scripts that need to load before everything
document.addEventListener("ggp:loaded", (e) => {
  console.log("ggp:loaded");
});

document.addEventListener("DOMContentLoaded", (e) => {
  // To Debug HTMX uncomment this line
  // htmx.logAll();

  console.log("DOMContentLoaded");

  document.body.addEventListener("htmx:load", function (evt) {
    console.log("htmx:load", evt);
  });

  document.body.addEventListener("htmx:configRequest", function (evt) {
    // If hx-path contains `${someGlobalVar}/foo` lets evaluate it
    try {
      // evt.detail.path = eval(evt.detail.path);
    } catch (e) {
      console.log(e);
    }
    // TODO Store basicauth login in localstoreage
    evt.detail.headers["Authorization"] = "Basic YWRtaW46c2VrcmV0";
  });

  // Parse http errors and show a toast box
  document.body.addEventListener("htmx:responseError", function (evt) {
    var response = evt.detail.xhr.statusText;
    try {
      response = JSON.parse(evt.detail.xhr.response);
    } catch {
      response = { message: evt.detail.xhr.statusText };
    }
    new ToasterBox({
      msg: response.message,
      duration: 3000,
      closeIcon: '<i class="bi bi-x-circle">',
      className: "toastError",
    });
  });

  // Setup Nunjucks templating environment
  var nunjucksEnv = new nunjucks.Environment();
  nunjucksEnv.addFilter("fmtAVAX", function (num) {
    return (parseInt(num, 10) / 1000000000).toLocaleString();
  });
  nunjucksEnv.addFilter("fmtDate", function (dt) {
    return dayjs.unix(dt).fromNow();
  });
  nunjucks = nunjucksEnv;
});
