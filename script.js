document.addEventListener("DOMContentLoaded", () => {
  loadMetrics();
  loadTradeStatus();
  loadJournal();
  loadOptions();

  setupMetricInputs();

  const approveBtn = document.getElementById("approve-btn");
  const rejectBtn = document.getElementById("reject-btn");

  if (approveBtn) {
    approveBtn.addEventListener("click", approveTrade);
  }

  if (rejectBtn) {
    rejectBtn.addEventListener("click", rejectTrade);
  }
});

function formatMoney(value) {
  const number = Number(value) || 0;
  return "$" + number.toLocaleString();
}

function setupMetricInputs() {
  const portfolioInput = document.getElementById("portfolio-input");
  const dailyInput = document.getElementById("daily-input");
  const buyingInput = document.getElementById("buying-input");

  if (portfolioInput) {
    portfolioInput.addEventListener("input", () => {
      localStorage.setItem("portfolioValue", portfolioInput.value);
      document.getElementById("portfolio-value").textContent = formatMoney(portfolioInput.value);
    });
  }

  if (dailyInput) {
    dailyInput.addEventListener("input", () => {
      localStorage.setItem("dailyPL", dailyInput.value);
      const dailyPL = document.getElementById("daily-pl");
      const value = Number(dailyInput.value) || 0;
      dailyPL.textContent = value >= 0 ? "+$" + value.toLocaleString() : "-$" + Math.abs(value).toLocaleString();
      dailyPL.className = value >= 0 ? "profit" : "loss";
    });
  }

  if (buyingInput) {
    buyingInput.addEventListener("input", () => {
      localStorage.setItem("buyingPower", buyingInput.value);
      document.getElementById("buying-power").textContent = formatMoney(buyingInput.value);
    });
  }
}

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

  if (document.getElementById("portfolio-value")) {
    document.getElementById("portfolio-value").textContent = formatMoney(portfolio);
  }

  if (document.getElementById("buying-power")) {
    document.getElementById("buying-power").textContent = formatMoney(buying);
  }

  const dailyPL = document.getElementById("daily-pl");
  const dailyValue = Number(daily) || 0;

  if (dailyPL) {
    dailyPL.textContent =
      dailyValue >= 0
        ? "+$" + dailyValue.toLocaleString()
        : "-$" + Math.abs(dailyValue).toLocaleString();

    dailyPL.className = dailyValue >= 0 ? "profit" : "loss";
  }
}

function approveTrade() {
  updateTradeStatus("Approved");
  addJournalEntry("APPROVED");
}

function rejectTrade() {
  updateTradeStatus("Rejected");
  addJournalEntry("REJECTED");
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
    document.getElementById("pending-trade-idea")?.textContent || "Unknown Trade";

  const entry = {
    action: action,
    trade: tradeIdea,
    time: new Date().toLocaleString()
  };

  const journal = JSON.parse(localStorage.getItem("tradeJournal")) || [];
  journal.unshift(entry);
  localStorage.setItem("tradeJournal", JSON.stringify(journal));

  renderJournal();
}

function loadJournal() {
  renderJournal();
}

function renderJournal() {
  const journalBox = document.getElementById("trade-journal-list");
  if (!journalBox) return;

  const journal = JSON.parse(localStorage.getItem("tradeJournal")) || [];

  if (journal.length === 0) {
    journalBox.innerHTML = "<p>No trades recorded yet.</p>";
    return;
  }

  journalBox.innerHTML = "";

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

  const options = JSON.parse(localStorage.getItem("optionsTracker")) || [];
  options.unshift(option);
  localStorage.setItem("optionsTracker", JSON.stringify(options));

  clearOptionInputs();
  renderOptions();
}

function clearOptionInputs() {
  ["ticker", "strike", "expiration", "cost", "current"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
}

function loadOptions() {
  renderOptions();
}

function renderOptions() {
  const list = document.getElementById("options-list");
  if (!list) return;

  const options = JSON.parse(localStorage.getItem("optionsTracker")) || [];

  if (options.length === 0) {
    list.innerHTML = "";
    return;
  }

  list.innerHTML = "";

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
  const options = JSON.parse(localStorage.getItem("optionsTracker")) || [];
  options.splice(index, 1);
  localStorage.setItem("optionsTracker", JSON.stringify(options));
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

  if (optionContracts) optionContracts.textContent = contracts;
  if (optionCost) optionCost.textContent = "$" + totalCost.toFixed(2);
}

window.approveTrade = approveTrade;
window.rejectTrade = rejectTrade;
window.clearJournal = clearJournal;
window.addOption = addOption;
window.deleteOption = deleteOption;
