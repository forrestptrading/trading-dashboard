const BACKEND_URL = "https://trade-dashboard-api--forrestpbusines.replit.app";

const DEFAULT_WATCHLIST = ["AAPL", "TSLA", "NVDA", "SPY", "QQQ"];

const STORAGE_KEYS = {
  watchlist: "fp_watchlist",
  connectedAccounts: "fp_connected_accounts",
  journal: "fp_trade_journal",
  approvals: "fp_trade_approvals",
  goal: "fp_portfolio_goal"
};

let quotes = {};
let watchlist = loadFromStorage(
  STORAGE_KEYS.watchlist,
  DEFAULT_WATCHLIST
);

let connectedAccounts = loadFromStorage(
  STORAGE_KEYS.connectedAccounts,
  [
    {
      id: "robinhood",
      name: "Robinhood",
      status: "Not Connected",
      balance: 0,
      buyingPower: 0,
      holdings: []
    },
    {
      id: "sofi",
      name: "SoFi",
      status: "Not Connected",
      balance: 0,
      buyingPower: 0,
      holdings: []
    },
    {
      id: "fidelity",
      name: "Fidelity",
      status: "Not Connected",
      balance: 0,
      buyingPower: 0,
      holdings: []
    },
    {
      id: "schwab",
      name: "Charles Schwab",
      status: "Not Connected",
      balance: 0,
      buyingPower: 0,
      holdings: []
    },
    {
      id: "webull",
      name: "Webull",
      status: "Not Connected",
      balance: 0,
      buyingPower: 0,
      holdings: []
    }
  ]
);

let tradeJournal = loadFromStorage(
  STORAGE_KEYS.journal,
  []
);

let approvalHistory = loadFromStorage(
  STORAGE_KEYS.approvals,
  []
);

const sampleOptions = [
  {
    ticker: "NVDA",
    type: "CALL",
    strike: 232.5,
    expiration: "2026-06-19",
    contracts: 3,
    avgCost: 0.14,
    current: 0.21
  },
  {
    ticker: "AGQ",
    type: "CALL",
    strike: 125,
    expiration: "2026-06-19",
    contracts: 1,
    avgCost: 0.18,
    current: 0.31
  },
  {
    ticker: "IWM",
    type: "CALL",
    strike: 286,
    expiration: "2026-06-19",
    contracts: 2,
    avgCost: 0.09,
    current: 0.05
  }
];

const pendingTrades = [
  {
    ticker: "NVDA",
    description: "Potential call setup. Watch momentum and volume before entry."
  },
  {
    ticker: "TSLA",
    description: "High-risk trade. Confirm trend direction before entering."
  },
  {
    ticker: "SPY",
    description: "Index play. Better for lower risk compared to single-name options."
  },
  {
    ticker: "AGQ",
    description: "Leveraged silver setup. Position sizing needs to stay small."
  }
];

let currentPendingIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupForms();
  setupButtons();

  renderAll();
  checkBackendHealth();
  fetchQuotes();

  setInterval(fetchQuotes, 60000);
});

/* STORAGE */

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);

    if (!stored) {
      return fallback;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error("Storage load failed:", error);
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  } catch (error) {
    console.error("Storage save failed:", error);
  }
}

/* FORMATTERS */

function formatCurrency(value) {
  const number = Number(value) || 0;

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
}

function formatPercent(value) {
  const number = Number(value) || 0;

  return `${number.toFixed(2)}%`;
}

function normalizeTicker(ticker) {
  return ticker
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9.-]/g, "");
}

function getChangeClass(value) {
  return Number(value) >= 0 ? "positive" : "negative";
}

/* NAVIGATION */

function setupNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".page-section");

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetSection = button.dataset.section;

      navButtons.forEach((btn) => {
        btn.classList.remove("active");
      });

      sections.forEach((section) => {
        section.classList.remove("active-section");
      });

      button.classList.add("active");

      const sectionToShow = document.getElementById(targetSection);

      if (sectionToShow) {
        sectionToShow.classList.add("active-section");
      }
    });
  });
}

/* FORMS */

function setupForms() {
  const addTickerForm = document.getElementById("addTickerForm");
  const tickerInput = document.getElementById("tickerInput");

  if (addTickerForm && tickerInput) {
    addTickerForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const ticker = normalizeTicker(tickerInput.value);

      if (!ticker) {
        return;
      }

      addTickerToWatchlist(ticker);
      tickerInput.value = "";
    });
  }

  const watchlistForm = document.getElementById("watchlistForm");
  const watchlistInput = document.getElementById("watchlistInput");

  if (watchlistForm && watchlistInput) {
    watchlistForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const ticker = normalizeTicker(watchlistInput.value);

      if (!ticker) {
        return;
      }

      addTickerToWatchlist(ticker);
      watchlistInput.value = "";
    });
  }

  const journalForm = document.getElementById("journalForm");

  if (journalForm) {
    journalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveJournalEntry();
    });
  }
}

/* BUTTONS */

function setupButtons() {
  const refreshQuotesBtn = document.getElementById("refreshQuotesBtn");

  if (refreshQuotesBtn) {
    refreshQuotesBtn.addEventListener("click", () => {
      fetchQuotes();
    });
  }

  const connectPlaidBtn = document.getElementById("connectPlaidBtn");

  if (connectPlaidBtn) {
    connectPlaidBtn.addEventListener("click", () => {
      showPlaidPlaceholder();
    });
  }

  const approveTradeBtn = document.getElementById("approveTradeBtn");

  if (approveTradeBtn) {
    approveTradeBtn.addEventListener("click", () => {
      handleTradeApproval("Approved");
    });
  }

  const rejectTradeBtn = document.getElementById("rejectTradeBtn");

  if (rejectTradeBtn) {
    rejectTradeBtn.addEventListener("click", () => {
      handleTradeApproval("Rejected");
    });
  }

  const saveGoalBtn = document.getElementById("saveGoalBtn");

  if (saveGoalBtn) {
    saveGoalBtn.addEventListener("click", () => {
      savePortfolioGoal();
    });
  }

  const enableNotificationsBtn = document.getElementById(
    "enableNotificationsBtn"
  );

  if (enableNotificationsBtn) {
    enableNotificationsBtn.addEventListener("click", () => {
      enableNotifications();
    });
  }

  const testNotificationBtn = document.getElementById("testNotificationBtn");

  if (testNotificationBtn) {
    testNotificationBtn.addEventListener("click", () => {
      sendTestNotification();
    });
  }
}

/* LIVE QUOTES */


/* LIVE PORTFOLIO */

async function fetchQuotes() {
  if (!watchlist.length) {
    renderQuoteGrid();
    renderWatchlistTable();
    return;
  }

  try {
    setText("quoteStatus", "Loading...");

    const symbols = watchlist.join(",");
    const response = await fetch(
      `${BACKEND_URL}/api/quotes?symbols=${symbols}`
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error("Quote response failed");
    }

    const quoteList = result.data || result.quotes || [];

    quotes = {};

    quoteList.forEach((quote) => {
      const symbol = quote.symbol || quote.ticker;

      if (symbol) {
        quotes[symbol.toUpperCase()] = quote;
      }
    });

    setBackendStatus("Live", true);
    setText("quoteStatus", `Live (${result.source || "backend"})`);
    setText("lastQuoteUpdate", new Date().toLocaleTimeString());

    renderQuoteGrid();
    renderWatchlistTable();
  } catch (error) {
    console.error("Quote fetch failed:", error);

    setBackendStatus("Offline", false);
    setText("quoteStatus", "Quotes failed");

    renderQuoteGrid();
    renderWatchlistTable();
  }
}

async function fetchPortfolio() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/portfolio`);
    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error("Portfolio response failed");
    }

    const p = result.data;

    setText("portfolioValue", money(p.total_value));
    setText("buyingPower", money(p.buying_power));
    setText("cash", money(p.cash));
    setText("dailyPL", money(p.day_change));
    setText("dailyPercent", `${p.day_change_percent}%`);
    setText("portfolioSource", result.source || "mock");
  } catch (error) {
    console.error("Portfolio fetch failed:", error);
  }
}

  const symbols = watchlist.join(",");

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/quotes?symbols=${symbols}`
    );

    if (!response.ok) {
      throw new Error("Quote request failed");
    }

    const data = await response.json();

    if (data.quotes) {
      quotes = data.quotes;
    } else if (Array.isArray(data)) {
      quotes = convertQuoteArrayToObject(data);
    } else {
      quotes = {};
    }

    setBackendStatus("Live", true);
    setText("quoteStatus", "Live");
    setText("lastQuoteUpdate", new Date().toLocaleTimeString());
  } catch (error) {
    console.error("Quote fetch failed:", error);
    setBackendStatus("Offline", false);
    setText("quoteStatus", "Offline");
  }

  renderQuoteGrid();
  renderWatchlistTable();
  renderPortfolioSummary();
}

function convertQuoteArrayToObject(data) {
  const output = {};

  data.forEach((item) => {
    const symbol = item.symbol || item.ticker;

    if (!symbol) {
      return;
    }

    output[symbol.toUpperCase()] = item;
  });

  return output;
}

function addTickerToWatchlist(ticker) {
  if (watchlist.includes(ticker)) {
    return;
  }

  watchlist.push(ticker);

  saveToStorage(
    STORAGE_KEYS.watchlist,
    watchlist
  );

  renderAll();
  fetchQuotes();
  fetchPortfolio();
}

function removeTickerFromWatchlist(ticker) {
  watchlist = watchlist.filter((item) => item !== ticker);

  delete quotes[ticker];

  saveToStorage(
    STORAGE_KEYS.watchlist,
    watchlist
  );

  renderAll();
  fetchQuotes();
}

/* MAIN RENDER */

function renderAll() {
  renderPortfolioSummary();
  renderQuoteGrid();
  renderWatchlistTable();
  renderAccountsList();
  renderBrokerCards();
  renderHoldingsTable();
  renderOptions();
  renderRiskAnalysis();
  renderPendingTrade();
  renderApprovalHistory();
  renderJournalEntries();
  renderGoal();
}

/* QUOTES DISPLAY */

function renderQuoteGrid() {
  const quoteGrid = document.getElementById("quoteGrid");

  if (!quoteGrid) {
    return;
  }

  if (!watchlist.length) {
    quoteGrid.innerHTML = `
      <p class="muted">
        No tickers yet. Add one above to start tracking live quotes.
      </p>
    `;
    return;
  }

  quoteGrid.innerHTML = watchlist.map((ticker) => {
    const quote = quotes[ticker] || {};
    const price = getQuotePrice(quote);
    const change = getQuoteChange(quote);
    const percent = getQuotePercent(quote);
    const changeClass = getChangeClass(change);

    return `
      <article class="quote-card">
        <div class="quote-card-header">
          <h4>${ticker}</h4>

          <button onclick="removeTickerFromWatchlist('${ticker}')">
            Remove
          </button>
        </div>

        <div class="quote-price">
          ${price ? formatCurrency(price) : "Loading..."}
        </div>

        <div class="quote-change ${changeClass}">
          ${formatCurrency(change)} / ${formatPercent(percent)}
        </div>

        <small class="muted">
          Source: ${quote.source || "Backend"}
        </small>
      </article>
    `;
  }).join("");
}

function renderWatchlistTable() {
  const watchlistTable = document.getElementById("watchlistTable");

  if (!watchlistTable) {
    return;
  }

  if (!watchlist.length) {
    watchlistTable.innerHTML = `
      <p class="muted">
        Your watchlist is empty.
      </p>
    `;
    return;
  }

  watchlistTable.innerHTML = watchlist.map((ticker) => {
    const quote = quotes[ticker] || {};
    const price = getQuotePrice(quote);
    const change = getQuoteChange(quote);
    const percent = getQuotePercent(quote);
    const changeClass = getChangeClass(change);

    return `
      <div class="table-row">
        <strong>${ticker}</strong>

        <span>
          ${price ? formatCurrency(price) : "Loading..."}
        </span>

        <span class="${changeClass}">
          ${formatCurrency(change)} / ${formatPercent(percent)}
        </span>

        <button onclick="removeTickerFromWatchlist('${ticker}')">
          Remove
        </button>
      </div>
    `;
  }).join("");
}

function getQuotePrice(quote) {
  return (
    quote.price ||
    quote.last_price ||
    quote.mark_price ||
    quote.lastTradePrice ||
    quote.regularMarketPrice ||
    0
  );
}

function getQuoteChange(quote) {
  return (
    quote.change ||
    quote.price_change ||
    quote.regularMarketChange ||
    0
  );
}

function getQuotePercent(quote) {
  return (
    quote.changePercent ||
    quote.change_percent ||
    quote.regularMarketChangePercent ||
    0
  );
}

/* ACCOUNTS */

function renderAccountsList() {
  const accountsList = document.getElementById("accountsList");

  if (!accountsList) {
    return;
  }

  accountsList.innerHTML = connectedAccounts.map((account) => {
    const connected = account.status === "Connected";

    return `
      <article class="account-card">
        <h4>${account.name}</h4>

        <span class="status-pill ${
          connected ? "status-connected" : "status-disconnected"
        }">
          ${account.status}
        </span>

        <p>
          Balance: <strong>${formatCurrency(account.balance)}</strong>
        </p>

        <p>
          Buying Power: <strong>${formatCurrency(account.buyingPower)}</strong>
        </p>
      </article>
    `;
  }).join("");
}

function renderBrokerCards() {
  const brokerCards = document.getElementById("brokerCards");

  if (!brokerCards) {
    return;
  }

  brokerCards.innerHTML = connectedAccounts.map((account) => {
    const connected = account.status === "Connected";

    return `
      <article class="broker-card">
        <h4>${account.name}</h4>

        <span class="status-pill ${
          connected ? "status-connected" : "status-coming"
        }">
          ${connected ? "Connected" : "Plaid Ready"}
        </span>

        <p class="muted">
          Secure account linking will run through Plaid Link.
        </p>

        <button onclick="connectBroker('${account.id}')">
          ${connected ? "Sync Account" : "Connect"}
        </button>
      </article>
    `;
  }).join("");
}

function connectBroker(accountId) {
  const account = connectedAccounts.find((item) => item.id === accountId);

  if (!account) {
    return;
  }

  alert(
    `${account.name} connection is ready for the Plaid backend step.`
  );
}

function showPlaidPlaceholder() {
  alert(
    "Plaid Link comes next. This button will open the secure account sign-in window."
  );
}

/* HOLDINGS */

function renderHoldingsTable() {
  const holdingsTable = document.getElementById("holdingsTable");

  if (!holdingsTable) {
    return;
  }

  const allHoldings = connectedAccounts.flatMap((account) => {
    return account.holdings.map((holding) => ({
      ...holding,
      accountName: account.name
    }));
  });

  if (!allHoldings.length) {
    holdingsTable.innerHTML = `
      <p class="muted">
        No connected holdings yet. Once Plaid is wired in, your positions
        from each brokerage will appear here.
      </p>
    `;
    return;
  }

  holdingsTable.innerHTML = allHoldings.map((holding) => {
    return `
      <div class="table-row">
        <strong>${holding.symbol}</strong>
        <span>${holding.accountName}</span>
        <span>${holding.quantity} shares</span>
        <span>${formatCurrency(holding.value)}</span>
      </div>
    `;
  }).join("");
}

/* PORTFOLIO SUMMARY */

function renderPortfolioSummary() {
  const accountTotal = connectedAccounts.reduce((sum, account) => {
    return sum + Number(account.balance || 0);
  }, 0);

  const accountBuyingPower = connectedAccounts.reduce((sum, account) => {
    return sum + Number(account.buyingPower || 0);
  }, 0);

  const demoPortfolioValue = 52341.87;
  const demoBuyingPower = 3241.56;
  const demoDailyPL = 412.34;
  const demoDailyPercent = 0.79;

  const totalValue = accountTotal > 0 ? accountTotal : demoPortfolioValue;
  const buyingPower = accountBuyingPower > 0 ? accountBuyingPower : demoBuyingPower;

  const allHoldings = connectedAccounts.flatMap((account) => {
    return account.holdings || [];
  });

  const connectedCount = connectedAccounts.filter((account) => {
    return account.status === "Connected";
  }).length;

  setText("openPositions", allHoldings.length || 4);
  setText("accountCount", `${connectedCount} accounts connected`);
  
}

/* OPTIONS */

function renderOptions() {
  const totalPL = sampleOptions.reduce((sum, option) => {
    return sum + getOptionPL(option);
  }, 0);

  const winningTrades = sampleOptions.filter((option) => {
    return getOptionPL(option) > 0;
  }).length;

  const winRate = sampleOptions.length
    ? (winningTrades / sampleOptions.length) * 100
    : 0;

  setText("optionContracts", getTotalContracts());
  setText("optionsPL", formatCurrency(totalPL));
  setText("optionWinRate", `${winRate.toFixed(0)}%`);
  setText("riskScore", calculateRiskScore());

  const openOptionsTable = document.getElementById("openOptionsTable");

  if (!openOptionsTable) {
    return;
  }

  openOptionsTable.innerHTML = sampleOptions.map((option) => {
    const pl = getOptionPL(option);
    const plClass = getChangeClass(pl);

    return `
      <div class="table-row">
        <strong>${option.ticker} ${option.type}</strong>
        <span>$${option.strike} / ${option.expiration}</span>
        <span>${option.contracts} contracts</span>
        <span class="${plClass}">${formatCurrency(pl)}</span>
      </div>
    `;
  }).join("");
}

function getOptionPL(option) {
  return (
    (Number(option.current) - Number(option.avgCost)) *
    Number(option.contracts) *
    100
  );
}

function getTotalContracts() {
  return sampleOptions.reduce((sum, option) => {
    return sum + Number(option.contracts || 0);
  }, 0);
}

function calculateRiskScore() {
  const contracts = getTotalContracts();

  if (contracts >= 10) {
    return 85;
  }

  if (contracts >= 5) {
    return 62;
  }

  return 38;
}

function renderRiskAnalysis() {
  const riskAnalysisBox = document.getElementById("riskAnalysisBox");

  if (!riskAnalysisBox) {
    return;
  }

  const score = calculateRiskScore();

  let message = "Risk is controlled. Position sizing is reasonable.";

  if (score >= 80) {
    message = "Risk is high. Reduce contract count or avoid overconcentration.";
  } else if (score >= 60) {
    message = "Risk is moderate. Keep position sizing tight and avoid chasing.";
  }

  riskAnalysisBox.innerHTML = `
    <p><strong>Current Risk Score:</strong> ${score}</p>
    <p>${message}</p>
    <p class="muted">
      This is placeholder logic for now. Later, it can use options Greeks,
      expiration dates, account size, and max-loss rules.
    </p>
  `;
}

/* TRADE APPROVAL */

function renderPendingTrade() {
  const trade = pendingTrades[currentPendingIndex];

  if (!trade) {
    return;
  }

  setText("approvalTicker", trade.ticker);
  setText("approvalDescription", trade.description);
}

function handleTradeApproval(status) {
  const trade = pendingTrades[currentPendingIndex];

  if (!trade) {
    return;
  }

  const record = {
    ticker: trade.ticker,
    description: trade.description,
    status,
    date: new Date().toLocaleString()
  };

  approvalHistory.unshift(record);

  saveToStorage(STORAGE_KEYS.approvals, approvalHistory);

  currentPendingIndex = (currentPendingIndex + 1) % pendingTrades.length;

  renderPendingTrade();
  renderApprovalHistory();
}

function renderApprovalHistory() {
  const approvalHistoryBox = document.getElementById("approvalHistory");

  if (!approvalHistoryBox) {
    return;
  }

  if (!approvalHistory.length) {
    approvalHistoryBox.innerHTML = `
      <p class="muted">No approval history yet.</p>
    `;
    return;
  }

  approvalHistoryBox.innerHTML = approvalHistory.slice(0, 8).map((item) => {
    const itemClass = item.status === "Approved" ? "positive" : "negative";

    return `
      <div class="approval-item">
        <strong>${item.ticker}</strong>
        <p>${item.description}</p>
        <p class="${itemClass}">${item.status}</p>
        <small class="muted">${item.date}</small>
      </div>
    `;
  }).join("");
}

/* JOURNAL */

function saveJournalEntry() {
  const tickerInput = document.getElementById("journalTicker");
  const strategyInput = document.getElementById("journalStrategy");
  const resultInput = document.getElementById("journalResult");

  const ticker = normalizeTicker(tickerInput.value);
  const strategy = strategyInput.value.trim();
  const result = resultInput.value.trim();

  if (!ticker || !strategy || !result) {
    alert("Fill out ticker, strategy, and result first.");
    return;
  }

  const entry = {
    id: Date.now(),
    ticker,
    strategy,
    result,
    date: new Date().toLocaleString()
  };

  tradeJournal.unshift(entry);
  saveToStorage(STORAGE_KEYS.journal, tradeJournal);

  tickerInput.value = "";
  strategyInput.value = "";
  resultInput.value = "";

  renderJournalEntries();
}

function renderJournalEntries() {
  const journalEntries = document.getElementById("journalEntries");

  if (!journalEntries) {
    return;
  }

  if (!tradeJournal.length) {
    journalEntries.innerHTML = `
      <p class="muted">No journal entries yet.</p>
    `;
    return;
  }

  journalEntries.innerHTML = tradeJournal.map((entry) => {
    return `
      <article class="journal-entry">
        <h4>${entry.ticker}</h4>
        <p><strong>Strategy:</strong> ${entry.strategy}</p>
        <p><strong>Result:</strong> ${entry.result}</p>
        <small class="muted">${entry.date}</small>
        <br />
        <button onclick="deleteJournalEntry(${entry.id})">Delete</button>
      </article>
    `;
  }).join("");
}

function deleteJournalEntry(id) {
  tradeJournal = tradeJournal.filter((entry) => {
    return entry.id !== id;
  });

  saveToStorage(STORAGE_KEYS.journal, tradeJournal);
  renderJournalEntries();
}

/* SETTINGS */

function savePortfolioGoal() {
  const goalInput = document.getElementById("goalInput");

  if (!goalInput) {
    return;
  }

  const goal = Number(goalInput.value);

  if (!goal) {
    alert("Enter a portfolio goal first.");
    return;
  }

  saveToStorage(STORAGE_KEYS.goal, goal);
  alert(`Portfolio goal saved: ${formatCurrency(goal)}`);
}

function renderGoal() {
  const goalInput = document.getElementById("goalInput");

  if (!goalInput) {
    return;
  }

  const savedGoal = loadFromStorage(STORAGE_KEYS.goal, "");
  goalInput.value = savedGoal || "";
}

/* BACKEND */

async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/quotes?symbols=AAPL`);

    if (!response.ok) {
      throw new Error("Backend health failed");
    }

    setBackendStatus("Live", true);
    setText("backendHealthStatus", "Backend is live.");
  } catch (error) {
    console.error("Backend health check failed:", error);
    setBackendStatus("Offline", false);
    setText("backendHealthStatus", "Backend is offline or blocked.");
  }
}

function setBackendStatus(status, isLive) {
  const backendStatus = document.getElementById("backendStatus");

  if (backendStatus) {
    backendStatus.textContent = status;
    backendStatus.className = isLive ? "positive" : "negative";
  }
}

/* NOTIFICATIONS */

function enableNotifications() {
  if (!("Notification" in window)) {
    alert("This browser does not support notifications.");
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      alert("Notifications enabled.");
    } else {
      alert("Notifications were not enabled.");
    }
  });
}

function sendTestNotification() {
  if (!("Notification" in window)) {
    alert("Test alert is working.");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("Trading Dashboard Alert", {
      body: "Test alert is working."
    });
  } else {
    alert("Enable notifications first.");
  }
}

/* HELPERS */

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

window.addEventListener("load", () => {
  document.getElementById("portfolioValue").textContent = "$52,341.87";
  document.getElementById("buyingPower").textContent = "$3,241.56";
  document.getElementById("dailyPL").textContent = "$412.34";
  document.getElementById("dailyPercent").textContent = "0.79%";
  document.getElementById("openPositions").textContent = "4";
});










