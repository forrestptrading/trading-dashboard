document.addEventListener("DOMContentLoaded", () => {
  loadMetrics();
  setupMetricInputs();

  setupTradeButtons();
  loadTradeStatus();
  renderJournal();

  renderOptions();
});

/* HELPERS */

function getArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  const num = Number(value) || 0;
  return "$" + num.toLocaleString();
}

/* METRICS */

function loadMetrics() {
  const portfolio = localStorage.getItem("portfolioValue") || "500";
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

  if (portfolioBox) portfolioBox.textContent = money(portfolio);

  if (dailyBox) {
    const dailyNum = Number(daily) || 0;
    dailyBox.textContent =
      dailyNum >= 0
        ? "+$" + dailyNum.toLocaleString()
        : "-$" + Math.abs(dailyNum).toLocaleString();

    dailyBox.className = dailyNum >= 0 ? "profit" : "loss";
  }

  if (buyingBox) buyingBox.textContent = money(buying);
}

function setupMetricInputs() {
  const portfolioInput = document.getElementById("portfolio-input");
  const dailyInput = document.getElementById("daily-input");
  const buyingInput = document.getElementById("buying-input");

  if (portfolioInput) {
    portfolioInput.oninput = () => {
      localStorage.setItem("portfolioValue", portfolioInput.value);
      loadMetrics();
    };
  }

  if (dailyInput) {
    dailyInput.oninput = () => {
      localStorage.setItem("dailyPL", dailyInput.value);
      loadMetrics();
    };
  }

  if (buyingInput) {
    buyingInput.oninput = () => {
      localStorage.setItem("buyingPower", buyingInput.value);
      loadMetrics();
    };
  }
}

/* TRADE APPROVAL */

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
  const saved = localStorage.getItem("pendingTradeStatus");
  const status = document.getElementById("trade-status");

  if (!saved || !status) return;

  status.textContent = saved;
  status.className = saved === "Approved" ? "profit" : "loss";
}

function addJournalEntry(action) {
  const trade =
    document.getElementById("pending-trade-idea")?.textContent || "Unknown trade";

  const entry = {
    action,
    trade,
    time: new Date().toLocaleString()
  };

  const journal = getArray("tradeJournal");
  journal.unshift(entry);
  saveArray("tradeJournal", journal);

  updateTradeStatus(action);
  renderJournal();
}

/* TRADE JOURNAL */

function renderJournal() {
  const box = document.getElementById("trade-journal-list");
  if (!box) return;

  const journal = getArray("tradeJournal");

  box.innerHTML = "";

  if (journal.length === 0) {
    box.innerHTML = "<p>No trades recorded yet.</p>";
    return;
  }

  journal.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "journal-entry";

    div.innerHTML = `
      <strong>${item.action}</strong>: ${item.trade}<br>
      <small>${item.time}</small><br>
      <button onclick="deleteJournalEntry(${index})">Delete</button>
    `;

    box.appendChild(div);
  });
}

function deleteJournalEntry(index) {
  const journal = getArray("tradeJournal");
  journal.splice(index, 1);
  saveArray("tradeJournal", journal);
  renderJournal();
}

function clearJournal() {
  localStorage.removeItem("tradeJournal");
  renderJournal();
}

/* OPTIONS TRACKER */

function addOption() {
  const ticker = document.getElementById("ticker")?.value.trim().toUpperCase();
  const strike = document.getElementById("strike")?.value.trim();
  const type = document.getElementById("type")?.value || "Call";
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

  const options = getArray("optionsTracker");
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
  const options = getArray("optionsTracker");

  if (list) {
    list.innerHTML = "";

    if (options.length === 0) {
      list.innerHTML = "<p>No options tracked yet.</p>";
    } else {
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
    }
  }

  updateOptionsSummary(options);
}

function deleteOption(index) {
  const options = getArray("optionsTracker");
  options.splice(index, 1);
  saveArray("optionsTracker", options);
  renderOptions();
}

function updateOptionsSummary(options) {
  const contracts = options.length;
  let totalCost = 0;
  let totalCurrent = 0;
  let calls = 0;
  let puts = 0;

  options.forEach((option) => {
    totalCost += Number(option.cost) || 0;
    totalCurrent += Number(option.current) || 0;

    if ((option.type || "").toLowerCase().includes("put")) {
      puts++;
    } else {
      calls++;
    }
  });

  const pl = totalCurrent - totalCost;
  const returnPercent = totalCost > 0 ? (pl / totalCost) * 100 : 0;

  setText("option-contracts", contracts);
  setText("option-cost", "$" + totalCost.toFixed(2));
  setText("option-current", "$" + totalCurrent.toFixed(2));
  setText("option-pl", pl >= 0 ? "+$" + pl.toFixed(2) : "-$" + Math.abs(pl).toFixed(2));
  setText("option-return", returnPercent.toFixed(1) + "%");

  setText("risk-total-contracts", contracts);
  setText("risk-calls", calls);
  setText("risk-puts", puts);
  setText("risk-exposure", "$" + (totalCost * 100).toFixed(2));
  setText("risk-level", contracts >= 3 ? "High" : contracts >= 1 ? "Moderate" : "Low");

  const optionPL = document.getElementById("option-pl");
  if (optionPL) optionPL.className = pl >= 0 ? "profit" : "loss";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}






















