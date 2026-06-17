document.addEventListener("DOMContentLoaded", () => {
  loadMetrics();
  setupMetricInputs();

  loadTradeStatus();
  setupTradeButtons();

  renderJournal();
  renderOptions();
});

/* =========================
   HELPERS
========================= */

function formatMoney(value) {
  const number = Number(value) || 0;
  return "$" + number.toLocaleString();
}

function getSavedArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function saveArray(key, array) {
  localStorage.setItem(key, JSON.stringify(array));
}

/* =========================
   DASHBOARD METRICS
========================= */

function loadMetrics() {
  const portfolio = localStorage.getItem("portfolioValue") || "10000";
  const daily = localStorage.getItem("dailyPL") || "250";
  const buying = localStorage.getItem("buyingPower") || "3500";

  const portfolioInput = document.getElementById("portfolio-input");
  const dailyInput = document.getElementById("daily-input");
  const buyingInput = document.getElementById("buying-input");

  if (portfolioInput) portfolioInput.value = portfolio;
  if (dailyInput) dailyInput.value = daily;
  if (buyingInput) buyingInput.value = buying;

  const portfolioBox = document.getElementById("portfolio-value");
  const dailyBox = document.getElementById("daily-pl");
  const buyingBox = document.getElementById("buying-power");

  if (portfolioBox) portfolioBox.textContent = formatMoney(portfolio);

  if (dailyBox) {
    const dailyNumber = Number(daily) || 0;
    dailyBox.textContent =
      dailyNumber >= 0
        ? "+$" + dailyNumber.toLocaleString()
        : "-$" + Math.abs(dailyNumber).toLocaleString();
    dailyBox.className = dailyNumber >= 0 ? "profit" : "loss";
  }

  if (buyingBox) buyingBox.textContent = formatMoney(buying);
}

function setupMetricInputs() {
  const portfolioInput = document.getElementById("portfolio-input");
  const dailyInput = document.getElementById("daily-input");
  const buyingInput = document.getElementById("buying-input");

  if (portfolioInput) {
    portfolioInput.addEventListener("input", () => {
      localStorage.setItem("portfolioValue", portfolioInput.value);
      loadMetrics();
    });
  }

  if (dailyInput) {
    dailyInput.addEventListener("input", () => {
      localStorage.setItem("dailyPL", dailyInput.value);
      loadMetrics();
    });
  }

  if (buyingInput) {
    buyingInput.addEventListener("input", () => {
      localStorage.setItem("buyingPower", buyingInput.value);
      loadMetrics();
    });
  }
}

/* =========================
   PENDING TRADE APPROVAL
========================= */

function setupTradeButtons() {
  const approveBtn = document.getElementById("approve-btn");
  const rejectBtn = document.getElementById("reject-btn");

  if (approveBtn) {
    approveBtn.onclick = () => addJournalEntry("Approved");
  }

  if (rejectBtn) {
    rejectBtn.onclick = () => addJournalEntry("Rejected");
  }
}

function updateTradeStatus(statusText) {
  const status = document.getElementById("trade-status");
  if (!status) return;

  status.textContent = statusText;
  status.className = statusText === "Approved" ? "profit" : "loss";

  localStorage.setItem("pendingTradeStatus", statusText);
}

function loadTradeStatus() {
  const savedStatus = localStorage.getItem("pendingTradeStatus");
  const status = document.getElementById("trade-status");

  if (!savedStatus || !status) return;

  status.textContent = savedStatus;
  status.className = savedStatus === "Approved" ? "profit" : "loss";
}

function addJournalEntry(action) {
  const tradeIdea =
    document.getElementById("pending-trade-idea")?.textContent || "Unknown trade";

  const entry = {
    action: action,
    trade: tradeIdea,
    time: new Date().toLocaleString()
  };

  const journal = getSavedArray("tradeJournal");
  journal.unshift(entry);
  saveArray("tradeJournal", journal);

  updateTradeStatus(action);
  renderJournal();
}

/* =========================
   TRADE JOURNAL
========================= */

function renderJournal() {
  const journalBox = document.getElementById("trade-journal-list");
  if (!journalBox) return;

  const journal = getSavedArray("tradeJournal");

  journalBox.innerHTML = "";

  if (journal.length === 0) {
    journalBox.innerHTML = "<p>No trades recorded yet.</p>";
    return;
  }

  journal.forEach((item) => {
    const div = document.createElement("div");
    div.className = "journal-entry";
    div.innerHTML = `
      <strong>${item.action}</strong>: ${item.trade}<br>
      <small>${item.time}</small>
    `;
    journalBox.appendChild(div);
  });
}

function clearJournal() {
  localStorage.removeItem("tradeJournal");
  renderJournal();
}

/* =========================
   OPTIONS TRACKER
========================= */

function addOption() {
  const ticker = document.getElementById("ticker")?.value.trim();
  const strike = document.getElementById("strike")?.value.trim();
  const type = document.getElementById("type")?.value;
  const expiration = document.getElementById("expiration")?.value.trim();
  const cost = document.getElementById("cost")?.value.trim();
  const current = document.getElementById("current")?.value.trim();

  if (!ticker || !strike || !expiration || !cost) {
    alert("Fill in ticker, strike, expiration, and cost.");
    return;
  }

  const option = {
    ticker,
    strike,
    type,
    expiration,
    cost,
    current: current || cost,
    time: new Date().toLocaleString()
  };

  const options = getSavedArray("optionsTracker");
  options.unshift(option);
  saveArray("optionsTracker", options);

  clearOptionInputs();
  renderOptions();
}

function clearOptionInputs() {
  ["ticker", "strike", "expiration", "cost", "current"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
}

function renderOptions() {
  const list = document.getElementById("options-list");
  if (!list) return;

  const options = getSavedArray("optionsTracker");

  list.innerHTML = "";

  if (options.length === 0) {
    list.innerHTML = "<p>No options tracked yet.</p>";
    updateOptionsSummary(options);
    return;
  }

  options.forEach((option, index) => {
    const div = document.createElement("div");
    div.className = "journal-entry";

    div.innerHTML = `
      <strong>${option.ticker} ${option.strike} ${option.type}</strong><br>
      Exp: ${option.expiration}<br>
      Cost: $${option.cost} | Current: $${option.current}<br>
      <small>${option.time}</small><br>
      <button onclick="deleteOption(${index})">Delete</button>
    `;

    list.appendChild(div);
  });

  updateOptionsSummary(options);
}

function deleteOption(index) {
  const options = getSavedArray("optionsTracker");
  options.splice(index, 1);
  saveArray("optionsTracker", options);
  renderOptions();
}

function updateOptionsSummary(options) {
  const contracts = options.length;
  let totalCost = 0;
  let totalCurrent = 0;

  options.forEach((option) => {
    totalCost += Number(option.cost) || 0;
    totalCurrent += Number(option.current) || 0;
  });

  const optionContracts = document.getElementById("option-contracts");
  const optionCost = document.getElementById("option-cost");
  const optionCurrent = document.getElementById("option-current");
  const optionPL = document.getElementById("option-pl");

  if (optionContracts) optionContracts.textContent = contracts;
  if (optionCost) optionCost.textContent = "$" + totalCost.toFixed(2);
  if (optionCurrent) optionCurrent.textContent = "$" + totalCurrent.toFixed(2);

  if (optionPL) {
    const pl = totalCurrent - totalCost;
    optionPL.textContent =
      pl >= 0 ? "+$" + pl.toFixed(2) : "-$" + Math.abs(pl).toFixed(2);
    optionPL.className = pl >= 0 ? "profit" : "loss";
  }
}
























