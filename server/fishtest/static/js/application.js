// Global variables
const fishtestBroadcastKey = "fishtest_broadcast";
let broadcastDispatch = {
  logout_: logout_,
};

// Application main function
(async () => {
  await DOMContentLoaded();
  handleTabsBroadcasting();
  protectForms();
  handleApplicationLogout();
  handleApplicationThemes();
  handleSortingTables();
})();

// Awaits the page content to load
function DOMContentLoaded() {
  // Use as
  // await DOMContentLoaded();
  // in an async function.
  return new Promise((resolve, _reject) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", resolve);
    } else {
      resolve();
    }
  });
}

// Executes a function in all connected tabs.
// See notifications.js for a usage example.
function handleTabsBroadcasting() {
  window.addEventListener("storage", (event) => {
    if (event.key === fishtestBroadcastKey) {
      const cmd = JSON.parse(event.newValue);
      const cmdFunction = broadcastDispatch[cmd["cmd"]];
      if (cmdFunction) {
        if (cmd["arg"]) cmdFunction(cmd["arg"]);
        else cmdFunction();
      }
    }
  });
}

// CSRF protection for links and forms
function protectForms() {
  const csrfToken = document.querySelector("meta[name='csrf-token']")[
    "content"
  ];

  document.querySelectorAll("form[method='POST']")?.forEach((form) => {
    const input = document.createElement("input");
    input["type"] = "hidden";
    input["name"] = "csrf_token";
    input["value"] = csrfToken;
    form.append(input);
  });
}

// Gets from the browser the value of a saved cookie
function getCookie(cookieName) {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([name]) => name === cookieName)?.[1];
}

function formatBytes(bytes) {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let unitIndex = 0;
  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024;
    unitIndex++;
  }
  return `${bytes.toFixed(2)} ${units[unitIndex]}`;
}

function handleApplicationThemes() {
  if (!getCookie("theme")) {
    setTheme(mediaTheme());
  }

  try {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => setTheme(mediaTheme()));
  } catch (e) {
    console.error(e);
  }

  document
    .getElementById("sun")
    .addEventListener("click", () => setTheme("light"));

  document
    .getElementById("moon")
    .addEventListener("click", () => setTheme("dark"));
}

// Gets prefered theme based on user's system
function mediaTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Click the sun/moon icons to change the color theme of the site
function setTheme(theme) {
  if (theme === "dark") {
    document.getElementById("sun").style.display = "";
    document.getElementById("moon").style.display = "none";
    const link = document.createElement("link");
    link["rel"] = "stylesheet";
    link["href"] = darkThemeHash;
    document.querySelector("head").append(link);
  } else {
    document.getElementById("sun").style.display = "none";
    document.getElementById("moon").style.display = "";
    document.querySelector('head link[href*="/css/theme.dark.css"]')?.remove();
  }
  // Remember the theme for 30 days
  document.cookie = `theme=${theme}; path=/; max-age=${
    30 * 24 * 60 * 60
  }; SameSite=Lax`;
}

function supportsNotifications() {
  return (
    // Notifications only work over a secure connection
    window.location.protocol === "https:" &&
    // Safari on iOS doesn't support them
    "Notification" in window &&
    // Chrome and Opera on Android don't support them
    !(
      navigator.userAgent.match(/Android/i) &&
      navigator.userAgent.match(/Chrome/i)
    )
  );
}

function notify(title, body, link, fallback) {
  // Instrumentation
  log(`Notification: title=${title} body=${body}`);
  if (supportsNotifications() && Notification.permission === "granted") {
    const notification = new Notification(title, {
      body: body,
      requireInteraction: true,
      icon: "/img/stockfish.webp",
    });
    notification.onclick = () => {
      window.open(link, "_blank");
    };
  } else if (fallback) {
    fallback(title, body, link);
  }
}

// A console log with time stamp and optional stack trace
function log(message, trace) {
  const d = new Date().toISOString();
  const message_ = `${d}: ${message}`;
  if (trace) {
    console.trace(message_);
  } else {
    console.log(message_);
  }
}

// Convert HTTP status code into status text
function getStatusText(code) {
  return (
    {
      100: "Continue",
      101: "Switching Protocols",
      102: "Processing",
      200: "OK",
      201: "Created",
      202: "Accepted",
      203: "Non-authoritative Information",
      204: "No Content",
      205: "Reset Content",
      206: "Partial Content",
      207: "Multi-Status",
      208: "Already Reported",
      226: "IM Used",
      300: "Multiple Choices",
      301: "Moved Permanently",
      302: "Found",
      303: "See Other",
      304: "Not Modified",
      305: "Use Proxy",
      307: "Temporary Redirect",
      308: "Permanent Redirect",
      400: "Bad Request",
      401: "Unauthorized",
      402: "Payment Required",
      403: "Forbidden",
      404: "Not Found",
      405: "Method Not Allowed",
      406: "Not Acceptable",
      407: "Proxy Authentication Required",
      408: "Request Timeout",
      409: "Conflict",
      410: "Gone",
      411: "Length Required",
      412: "Precondition Failed",
      413: "Payload Too Large",
      414: "Request-URI Too Long",
      415: "Unsupported Media Type",
      416: "Requested Range Not Satisfiable",
      417: "Expectation Failed",
      418: "I'm a teapot",
      421: "Misdirected Request",
      422: "Unprocessable Entity",
      423: "Locked",
      424: "Failed Dependency",
      426: "Upgrade Required",
      428: "Precondition Required",
      429: "Too Many Requests",
      431: "Request Header Fields Too Large",
      444: "Connection Closed Without Response",
      451: "Unavailable For Legal Reasons",
      499: "Client Closed Request",
      500: "Internal Server Error",
      501: "Not Implemented",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
      505: "HTTP Version Not Supported",
      506: "Variant Also Negotiates",
      507: "Insufficient Storage",
      508: "Loop Detected",
      510: "Not Extended",
      511: "Network Authentication Required",
      599: "Network Connect Timeout Error",
    }[code] || ""
  );
}

// A custom error for 400 and 500 responses
class HTTPError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = this.constructor.name;
    this.response = options.response;
  }
}

// A useful function from the python requests package
function raiseForStatus(response) {
  if (response.ok) {
    return;
  }
  options = { response: response };
  throw new HTTPError(
    `request ${response.url} failed with status code ${response.status} (${getStatusText(response.status)})`,
    options,
  );
}

async function handleTitle(count) {
  // async because the document title is often set in javascript
  await DOMContentLoaded();
  let title = document.title;
  // check if there is already a number
  if (/\([\d]+\)/.test(title)) {
    // if so, remove it
    let idx = title.indexOf(" ");
    title = title.slice(idx + 1);
  }
  // add it again if necessary
  if (count > 0) {
    document.title = `(${count}) ${title}`;
  } else {
    document.title = title;
  }
}

function asyncSleep(ms) {
  return new Promise((resolve, _reject) => {
    const t0 = Date.now();
    setTimeout(() => {
      const t1 = Date.now();
      resolve(t1 - t0);
    }, ms);
  });
}

async function fetchText(url, options) {
  const response = await fetch(url, options);
  raiseForStatus(response);
  return response.text();
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  raiseForStatus(response);
  return response.json();
}

async function fetchPost(url, payload) {
  const options = {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };
  return fetchJson(url, options);
}

function handleApplicationLogout() {
  document.getElementById("logout")?.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
}

// Alerts errors to the UI
function alertError(message) {
  document.getElementById("error_div").style.display = "";
  document.getElementById("error").textContent = message;
}

async function logout_() {
  const csrfToken = document.querySelector("meta[name='csrf-token']")[
    "content"
  ];

  try {
    const response = await fetch("/logout", {
      method: "POST",
      headers: {
        "X-CSRF-Token": csrfToken,
      },
    });

    raiseForStatus(response);
    window.location = "/";
  } catch (error) {
    alertError("Network error: please check your network!");
  }
}

function logout() {
  broadcast("logout_");
}

function broadcast(cmd, arg) {
  const cmdFunction = broadcastDispatch[cmd];
  localStorage.setItem(
    fishtestBroadcastKey,
    JSON.stringify({ cmd: cmd, arg: arg, rnd: Math.random() }),
  );
  if (arg) cmdFunction(arg);
  else cmdFunction();
}

// serializing objects
function saveObject(key, value) {
  const key_ = `__fishtest__${key}`;
  const value_ = JSON.stringify(value);
  localStorage.setItem(key_, value_);
}
function loadObject(key) {
  const key_ = `__fishtest__${key}`;
  const value_ = localStorage.getItem(key_);
  return JSON.parse(value_);
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

function handleSortingTables() {
  document.addEventListener("click", function (e) {
    const { target } = e;
    if (target.matches("th")) {
      const th = target;
      const table = th.closest("table");
      const body = table.querySelector("tbody");
      Array.from(body.querySelectorAll("tr"))
        .sort(
          comparer(
            Array.from(th.parentNode.children).indexOf(th),
            (this.asc = !this.asc),
          ),
        )
        .forEach((tr, index) => {
          const rankData = tr.querySelector("td.rank");
          if (rankData) {
            rankData.textContent = index + 1;
          }
          body.append(tr);
        });
    }
  });
}
// https://stackoverflow.com/questions/14267781/sorting-html-table-with-javascript
// https://stackoverflow.com/questions/40201533/sort-version-dotted-number-strings-in-javascript
function comparer(idx, asc) {
  let p1, p2;

  return (a, b) =>
    ((v1, v2) =>
      v1 !== "" && v2 !== "" && !isNaN(v1) && !isNaN(v2)
        ? v1 - v2
        : v1 !== "" && v2 !== "" && !isNaN("0x" + v1) && !isNaN("0x" + v2)
          ? parseInt(v1, 16) - parseInt(v2, 16)
          : v1 !== "" &&
              v2 !== "" &&
              !isNaN((p1 = padDotVersion(v1))) &&
              !isNaN((p2 = padDotVersion(v2)))
            ? p1 - p2
            : v1 !== "" &&
                v2 !== "" &&
                !isNaN(
                  padDotVersion(v1.replace("clang++ ", "").replace("g++ ", "")),
                ) &&
                !isNaN(
                  padDotVersion(v2.replace("clang++ ", "").replace("g++ ", "")),
                )
              ? padDotVersionStr(v1)
                  .toString()
                  .localeCompare(padDotVersionStr(v2))
              : v1.toString().localeCompare(v2))(
      getCellValue(asc ? a : b, idx),
      getCellValue(asc ? b : a, idx),
    );
}
function getCellValue(tr, idx) {
  return (
    tr.children[idx].dataset.sortValue ||
    tr.children[idx].innerText ||
    tr.children[idx].textContent
  );
}
function padDotVersion(dn) {
  return dn
    .split(".")
    .map((n) => +n + 1000)
    .join("");
}
function padDotVersionStr(dn) {
  return dn.replace(/\d+/g, (n) => +n + 1000);
}

// Filters tables client-side
function filterTable(inputValue, tableId, originalRows, predicate) {
  const table = document.getElementById(tableId);
  const tbody = table.querySelector("tbody");
  let noDataRow = table.querySelector(".no-data");
  inputValue = inputValue.toLowerCase();

  // Clear the table before filtering
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  let filteredRows = 0;

  originalRows.forEach((row) => {
    if (predicate(row, inputValue)) {
      tbody.append(row.cloneNode(true));
      filteredRows++;
    }
  });

  if (filteredRows === 0 && inputValue !== "") {
    // Create the no-data row dynamically if it doesn't exist
    if (!noDataRow) {
      noDataRow = document.createElement("tr");
      noDataRow.classList.add("no-data");
      const cell = document.createElement("td");
      cell.setAttribute("colspan", "20");
      cell.textContent = "No matching data found";
      noDataRow.append(cell);
    }
    tbody.append(noDataRow);
  }

  // Usage Example:
  // See also contributors.mak.

  // Assuming you have an HTML structure similar to this:
  /* HTML Structure:
  <label class="form-label">Search</label>
  <input id="my_input" class="form-control" type="text" placeholder="Search some text">
  <table id="my_table">
    <tbody>
      <!-- Rows of data -->
    </tbody>
  </table>
  */

  // Since we get the table data rendered already as HTML rows from the server,
  // we don't have the table data as JSON initially,
  // so for client filtering we need to clone the initial table rows once,
  // not to lose them while filtering.
  // P.S. hiding/showing rows instead of creating and removing rows,
  // will mess up the CSS Zebra striping.

  /* JavaScript Code:
  (async () => {
    await DOMContentLoaded();

    // Define your predicate function
    const myPredicate = (row, inputValue) => {
      const cells = Array.from(row.querySelectorAll("td"));
      return cells.some((cell) => {
        const cellText = cell.textContent || cell.innerText;
        return cellText.toLowerCase().indexOf(inputValue) > -1;
      });
    };

    const originalTable = document
      .getElementById("my_table")
      .cloneNode(true);
    const originalRows = Array.from(originalTable.querySelectorAll("tbody tr"));

    const searchInput = document.getElementById("my_input");
    searchInput.addEventListener("input", (e) => {
      filterTable(e.target.value, "my_table", originalRows, myPredicate);
    });
  })();
  */
}

function createRetryMessage(parentElement, callback) {
  const mainDiv = document.createElement("div");
  mainDiv.className = "retry";

  const innerDiv = document.createElement("div");
  innerDiv.className = "col-12 col-md-8 col-lg-3";

  const alertDiv = document.createElement("div");
  alertDiv.className =
    "alert alert-danger d-flex justify-content-between align-items-center";
  alertDiv.id = "error-message";

  const span = document.createElement("span");
  span.textContent = "Something went wrong. Please try again.";

  const button = document.createElement("button");
  button.className = "btn btn-primary";
  button.textContent = "Retry";

  alertDiv.appendChild(span);
  alertDiv.appendChild(button);

  innerDiv.appendChild(alertDiv);
  mainDiv.appendChild(innerDiv);

  parentElement.appendChild(mainDiv);

  // Add event listener after appending
  button.addEventListener("click", callback);
}

// A helper for conveniently adding a timeout
// to a fetch call
const abortTimeout = (timeout) => {
  if (AbortSignal.timeout) {
    return AbortSignal.timeout(timeout);
  } else {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller.signal;
  }
};

// Call the GitHub api to get the current
// rate limit.
async function rateLimit() {
  const url = "https://api.github.com/rate_limit";
  const token = localStorage.getItem("github_token");
  const options = token
    ? {
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    : {};
  options.signal = abortTimeout(3000);
  const rateLimit_ = await fetchJson(url, options);
  return rateLimit_["resources"]["core"];
}

// Parse headers of a response object.
function remainingApiCalls(response) {
  const headers = response.headers;
  if (headers.get("X-RateLimit-Resource") === "core") {
    if (headers.has("X-RateLimit-Remaining")) {
      return Number(headers.get("X-RateLimit-Remaining"));
    }
  }
  return Number.MAX_VALUE;
}
