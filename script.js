const STORAGE_KEY = "tradingDashboardData_v3";

const defaultData = {
  settings: {
    startingBalance: 10000,
    goal: 100000,
    cash: 3241.56,
    dailyPL: 412.34,
    notes: "Rules: protect capital, avoid revenge trading, size small, journal every trade."
  },

  positions: [
    { id: crypto.randomUUID(), symbol: "TSLA", shares: 2, avgCost: 242.17, current: 248.65 },
    { id: crypto.randomUUID(), symbol: "NVDA", shares: 1, avgCost: 875.39, current: 891.22 },
    { id: crypto.randomUUID(), symbol: "QQQ", shares: 2, avgCost: 436.19, current: 441.08 }
  ],

  options: [
    {
      id: crypto.randomUUID(),
      ticker: "AGQ",
      type: "CALL",
      strike: 125,
      expiration: "2026-05-29",
      contracts: 1,
      avg: 0.18,
      current: 0.38,
      status: "Open"
    },
    {
      id: crypto.randomUUID(),
      ticker: "IWM",
      type: "CALL",
      strike: 286,
      expiration: "2026-06-19",
      contracts: 2,
      avg: 0.09,
      current: 0.11,
      status: "Open"
    }
  ],

  watchlist: [
    { id: crypto.randomUUID(), symbol: "SPY", price: 512.87, change: 0.46 },
    { id: crypto.randomUUID(), symbol: "AAPL", price: 213.44, change: -0.22 },
    { id: crypto.randomUUID(), symbol: "META", price: 487.23, change: 1.76 },
    { id: crypto.randomUUID(), symbol: "SPCE", price: 8.42, change: 3.15 }
  ],

  journal: [
    {
      id: crypto.randomUUID(),
      symbol: "AGQ",
      setup: "Momentum call",
      result: "Win",
      profit: 110,
      notes: "Good entry. Took profit instead of holding too long.",
      date: "2026-05-29"
    },
    {
      id: crypto.randomUUID(),
      symbol: "SOXS",
      setup: "Cheap put lotto",
      result: "Loss",
      profit: -8,
      notes: "Too risky. Contract was too cheap and low probability.",
      date: "2026-05-29"
    }
  ]
};

let data = loadData();

const pageInfo = {
  overview: {
    title: "Overview",
    subtitle: "Portfolio summary and daily trading snapshot"
  },
  positions: {
    title: "Positions",
    subtitle: "Track shares, average cost, current value, and open P/L"
  },
  options: {
    title: "Options",
    subtitle: "Track contracts, current value, risk, and expiration"
  },
  watchlist: {
    title: "Watchlist",
    subtitle: "Follow tickers you are watching"
  },
  journal: {
    title: "Trade Journal",
    subtitle: "Log wins, losses, setups, and lessons"
  },
  analytics: {
    title: "Analytics",
    subtitle: "Review win rate, trade performance, and account health"
  },
  settings: {
    title: "Settings",
    subtitle: "Edit portfolio values, goals, and trading notes"
  }
};

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultData);

    const parsed = JSON.parse(saved);

    return {
      settings: { ...defaultData.settings, ...(parsed.settings || {}) },
      positions: parsed.positions || defaultData.positions,
      options: parsed.options || defaultData.options,
      watchlist: parsed.watchlist || defaultData.watchlist,
      journal: parsed.journal || defaultData.journal
    };
  } catch (error) {
    console.error("Load failed:", error);
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  flashSaveButton();
}

function flashSaveButton() {
  const btn = document.getElementById("saveAllBtn");
  if (!btn) return;

  const original = btn.textContent;
  btn.textContent = "Saved ✓";

  setTimeout(() => {
    btn.textContent = original;
  }, 900);
}

function money(value) {
  const number = Number(value) || 0;

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD"
  });
}

function percent(value) {
  const number = Number(value) || 0;
  return `${number.toFixed(2)}%`;
}

function signedMoney(value) {
  const number = Number(value) || 0;
  const prefix = number > 0 ? "+" : "";
  return `${prefix}${money(number)}`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setClassByValue(element, value) {
  if (!element) return;

  element.classList.remove("positive", "negative");

  if (Number(value) > 0) {
    element.classList.add("positive");
  }

  if (Number(value) < 0) {
    element.classList.add("negative");
  }
}

function positionValue(position) {
  return Number(position.shares) * Number(position.current);
}

function positionCost(position) {
  return Number(position.shares) * Number(position.avgCost);
}

function positionPL(position) {
  return positionValue(position) - positionCost(position);
}

function optionCost(option) {
  return Number(option.contracts) * Number(option.avg) * 100;
}

function optionValue(option) {
  return Number(option.contracts) * Number(option.current) * 100;
}

function optionPL(option) {
  return optionValue(option) - optionCost(option);
}

function portfolioInvestedValue() {
  return data.positions.reduce((sum, position) => {
    return sum + positionValue(position);
  }, 0);
}

function optionsCurrentValue() {
  return data.options.reduce((sum, option) => {
    if (option.status !== "Open") return sum;
    return sum + optionValue(option);
  }, 0);
}

function portfolioTotalValue() {
  return Number(data.settings.cash) + portfolioInvestedValue() + optionsCurrentValue();
}

function portfolioReturnValue() {
  return portfolioTotalValue() - Number(data.settings.startingBalance);
}

function closedTrades() {
  return data.journal.filter(trade => trade.result === "Win" || trade.result === "Loss");
}

function winningTrades() {
  return closedTrades().filter(trade => trade.result === "Win");
}

function losingTrades() {
  return closedTrades().filter(trade => trade.result === "Loss");
}

function winRateValue() {
  const closed = closedTrades();

  if (closed.length === 0) return 0;

  return (winningTrades().length / closed.length) * 100;
}

function setupNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".page-section");

  navButtons.forEach(button => {
    button.addEventListener("click", () => {
      const target = button.dataset.section;

      navButtons.forEach(btn => btn.classList.remove("active"));
      sections.forEach(section => section.classList.remove("active"));

      button.classList.add("active");

      const targetSection = document.getElementById(target);
      if (targetSection) targetSection.classList.add("active");

      setText("pageTitle", pageInfo[target].title);
      setText("pageSubtitle", pageInfo[target].subtitle);
    });
  });
}

function renderOverview() {
  const totalValue = portfolioTotalValue();
  const totalReturn = portfolioReturnValue();
  const daily = Number(data.settings.dailyPL) || 0;
  const dailyPercent = totalValue ? (daily / totalValue) * 100 : 0;
  const goal = Number(data.settings.goal) || 1;
  const goalPercentValue = Math.min((totalValue / goal) * 100, 100);

  setText("dailyPL", signedMoney(daily));
  setText("dailyPLPercent", percent(dailyPercent));
  setText("buyingPower", money(data.settings.cash));
  setText("portfolioValue", money(totalValue));
  setText("portfolioReturn", `Total return: ${signedMoney(totalReturn)}`);
  setText("openPositions", data.positions.length);
  setText("optionsContracts", data.options.reduce((sum, option) => sum + Number(option.contracts || 0), 0));
  setText("winRate", `${winRateValue().toFixed(0)}%`);

  setText("goalCurrent", money(totalValue));
  setText("goalTarget", money(goal));
  setText("goalPercent", `${goalPercentValue.toFixed(1)}% complete`);

  const progress = document.getElementById("goalProgress");
  if (progress) progress.style.width = `${goalPercentValue}%`;

  setClassByValue(document.getElementById("dailyPL"), daily);
  setClassByValue(document.getElementById("dailyPLPercent"), daily);
  setClassByValue(document.getElementById("portfolioReturn"), totalReturn);
}

function renderPositions() {
  const table = document.getElementById("positionsTable");
  if (!table) return;

  table.innerHTML = "";

  if (data.positions.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="7" class="muted">No positions added yet.</td>
      </tr>
    `;
    return;
  }

  data.positions.forEach(position => {
    const pl = positionPL(position);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${position.symbol}</strong></td>
      <td>${position.shares}</td>
      <td>${money(position.avgCost)}</td>
      <td>${money(position.current)}</td>
      <td>${money(positionValue(position))}</td>
      <td class="${pl >= 0 ? "positive" : "negative"}">${signedMoney(pl)}</td>
      <td>
        <button class="danger-btn" onclick="deletePosition('${position.id}')">Delete</button>
      </td>
    `;

    table.appendChild(row);
  });
}

function renderOptions() {
  const table = document.getElementById("optionsTable");
  if (!table) return;

  table.innerHTML = "";

  if (data.options.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="10" class="muted">No options added yet.</td>
      </tr>
    `;
    renderOptionsSummary();
    return;
  }

  data.options.forEach(option => {
    const pl = optionPL(option);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${option.ticker}</strong></td>
      <td>${option.type}</td>
      <td>${money(option.strike)}</td>
      <td>${option.expiration}</td>
      <td>${option.contracts}</td>
      <td>${money(option.avg)}</td>
      <td>${money(option.current)}</td>
      <td class="${pl >= 0 ? "positive" : "negative"}">${signedMoney(pl)}</td>
      <td>${option.status}</td>
      <td>
        <button class="danger-btn" onclick="deleteOption('${option.id}')">Delete</button>
      </td>
    `;

    table.appendChild(row);
  });

  renderOptionsSummary();
}

function renderOptionsSummary() {
  const openOptions = data.options.filter(option => option.status === "Open");

  const totalCost = openOptions.reduce((sum, option) => sum + optionCost(option), 0);
  const totalValue = openOptions.reduce((sum, option) => sum + optionValue(option), 0);
  const totalPL = totalValue - totalCost;

  setText("optionsCost", money(totalCost));
  setText("optionsValue", money(totalValue));
  setText("optionsPL", signedMoney(totalPL));

  setClassByValue(document.getElementById("optionsPL"), totalPL);

  const riskSummary = document.getElementById("riskSummary");

  if (riskSummary) {
    if (openOptions.length === 0) {
      riskSummary.textContent = "No open options risk right now.";
    } else if (totalCost > portfolioTotalValue() * 0.15) {
      riskSummary.textContent = "High options exposure. Consider reducing contract size or taking profit.";
    } else {
      riskSummary.textContent = "Options exposure is controlled based on current dashboard values.";
    }
  }
}

function renderWatchlist() {
  const grid = document.getElementById("watchlistGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (data.watchlist.length === 0) {
    grid.innerHTML = `<p class="muted">No watchlist tickers added yet.</p>`;
    return;
  }

  data.watchlist.forEach(item => {
    const card = document.createElement("div");
    card.className = "watch-card";

    card.innerHTML = `
      <h4>${item.symbol}</h4>
      <strong>${money(item.price)}</strong>
      <p class="${Number(item.change) >= 0 ? "positive" : "negative"}">
        ${Number(item.change) >= 0 ? "+" : ""}${percent(item.change)}
      </p>
      <button class="danger-btn" onclick="deleteWatch('${item.id}')">Delete</button>
    `;

    grid.appendChild(card);
  });
}

function renderJournal() {
  const list = document.getElementById("journalList");
  if (!list) return;

  list.innerHTML = "";

  if (data.journal.length === 0) {
    list.innerHTML = `<p class="muted">No journal entries yet.</p>`;
    return;
  }

  data.journal.forEach(trade => {
    const card = document.createElement("div");
    card.className = "journal-card";

    card.innerHTML = `
      <h4>${trade.symbol} — ${trade.result}</h4>
      <p><strong>Setup:</strong> ${trade.setup}</p>
      <p class="${Number(trade.profit) >= 0 ? "positive" : "negative"}">
        <strong>P/L:</strong> ${signedMoney(trade.profit)}
      </p>
      <p><strong>Date:</strong> ${trade.date}</p>
      <p class="muted">${trade.notes}</p>
      <button class="danger-btn" onclick="deleteJournal('${trade.id}')">Delete</button>
    `;

    list.appendChild(card);
  });
}

function renderAnalytics() {
  const total = closedTrades().length;
  const wins = winningTrades().length;
  const losses = losingTrades().length;
  const winRate = winRateValue();
  const totalValue = portfolioTotalValue();
  const cash = Number(data.settings.cash) || 0;
  const cashPercent = totalValue ? (cash / totalValue) * 100 : 0;

  setText("totalTrades", total);
  setText("winningTrades", wins);
  setText("losingTrades", losses);

  const accountHealth = document.getElementById("accountHealth");

  if (!accountHealth) return;

  if (cashPercent < 5) {
    accountHealth.textContent = "Cash is low. Avoid overtrading and keep buying power available.";
  } else if (winRate < 40 && total >= 5) {
    accountHealth.textContent = "Win rate is weak. Review journal notes before adding more risk.";
  } else if (winRate >= 60 && total >= 5) {
    accountHealth.textContent = "Account discipline looks solid based on current journal stats.";
  } else {
    accountHealth.textContent = "Keep tracking trades. More journal data will improve this reading.";
  }
}

function renderSettings() {
  const startingBalanceInput = document.getElementById("startingBalanceInput");
  const goalInput = document.getElementById("goalInput");
  const cashInput = document.getElementById("cashInput");
  const dailyInput = document.getElementById("dailyInput");
  const notesInput = document.getElementById("notesInput");

  if (startingBalanceInput) startingBalanceInput.value = data.settings.startingBalance;
  if (goalInput) goalInput.value = data.settings.goal;
  if (cashInput) cashInput.value = data.settings.cash;
  if (dailyInput) dailyInput.value = data.settings.dailyPL;
  if (notesInput) notesInput.value = data.settings.notes || "";
}

function renderAll() {
  renderOverview();
  renderPositions();
  renderOptions();
  renderWatchlist();
  renderJournal();
  renderAnalytics();
  renderSettings();
}

function openModal(title, fields, onSubmit) {
  const backdrop = document.getElementById("modalBackdrop");
  const modalTitle = document.getElementById("modalTitle");
  const form = document.getElementById("modalForm");

  if (!backdrop || !modalTitle || !form) return;

  modalTitle.textContent = title;
  form.innerHTML = "";

  fields.forEach(field => {
    const label = document.createElement("label");
    label.textContent = field.label;

    let input;

    if (field.type === "select") {
      input = document.createElement("select");

      field.options.forEach(option => {
        const optionElement = document.createElement("option");
        optionElement.value = option;
        optionElement.textContent = option;
        input.appendChild(optionElement);
      });
    } else if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 4;
    } else {
      input = document.createElement("input");
      input.type = field.type || "text";
    }

    input.name = field.name;
    input.required = field.required !== false;

    if (field.value !== undefined) {
      input.value = field.value;
    }

    label.appendChild(input);
    form.appendChild(label);
  });

  const submitButton = document.createElement("button");
  submitButton.className = "primary-btn full-btn";
  submitButton.type = "submit";
  submitButton.textContent = "Save";

  form.appendChild(submitButton);

  form.onsubmit = event => {
    event.preventDefault();

    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    onSubmit(values);

    closeModal();
    saveData();
    renderAll();
  };

  backdrop.classList.add("show");
}

function closeModal() {
  const backdrop = document.getElementById("modalBackdrop");
  if (backdrop) backdrop.classList.remove("show");
}

function addPosition() {
  openModal(
    "Add Position",
    [
      { label: "Symbol", name: "symbol", type: "text" },
      { label: "Shares", name: "shares", type: "number" },
      { label: "Average Cost", name: "avgCost", type: "number" },
      { label: "Current Price", name: "current", type: "number" }
    ],
    values => {
      data.positions.push({
        id: crypto.randomUUID(),
        symbol: values.symbol.toUpperCase(),
        shares: Number(values.shares),
        avgCost: Number(values.avgCost),
        current: Number(values.current)
      });
    }
  );
}

function addOption() {
  openModal(
    "Add Option",
    [
      { label: "Ticker", name: "ticker", type: "text" },
      { label: "Type", name: "type", type: "select", options: ["CALL", "PUT"] },
      { label: "Strike", name: "strike", type: "number" },
      { label: "Expiration", name: "expiration", type: "date" },
      { label: "Contracts", name: "contracts", type: "number" },
      { label: "Average Price", name: "avg", type: "number" },
      { label: "Current Price", name: "current", type: "number" },
      { label: "Status", name: "status", type: "select", options: ["Open", "Closed"] }
    ],
    values => {
      data.options.push({
        id: crypto.randomUUID(),
        ticker: values.ticker.toUpperCase(),
        type: values.type,
        strike: Number(values.strike),
        expiration: values.expiration,
        contracts: Number(values.contracts),
        avg: Number(values.avg),
        current: Number(values.current),
        status: values.status
      });
    }
  );
}

function addWatch() {
  openModal(
    "Add Watchlist Ticker",

    
    [
      { label: "Symbol", name: "symbol", type: "text" },
      { label: "Price", name: "price", type: "number" },
      { label: "Change %", name: "change", type: "number" }
    ],
    values => {
      data.watchlist.push({
        id: crypto.randomUUID(),
        symbol: values.symbol.toUpperCase(),
        price: Number(values.price),
        change: Number(values.change)
      });
    }
  );
}

function addJournal() {
  openModal(
    "Add Journal Trade",
    [
      { label: "Symbol", name: "symbol", type: "text" },
      { label: "Setup", name: "setup", type: "text" },
      { label: "Result", name: "result", type: "select", options: ["Win", "Loss", "Open", "Break Even"] },
      { label: "Profit / Loss", name: "profit", type: "number" },
      { label: "Date", name: "date", type: "date" },
      { label: "Notes", name: "notes", type: "textarea" }
    ],
    values => {
      data.journal.unshift({
        id: crypto.randomUUID(),
        symbol: values.symbol.toUpperCase(),
        setup: values.setup,
        result: values.result,
        profit: Number(values.profit),
        notes: values.notes,
        date: values.date
      });
    }
  );
}

function deletePosition(id) {
  data.positions = data.positions.filter(position => position.id !== id);
  saveData();
  renderAll();
}

function deleteOption(id) {
  data.options = data.options.filter(option => option.id !== id);
  saveData();
  renderAll();
}

function deleteWatch(id) {
  data.watchlist = data.watchlist.filter(item => item.id !== id);
  saveData();
  renderAll();
}

function deleteJournal(id) {
  data.journal = data.journal.filter(trade => trade.id !== id);
  saveData();
  renderAll();
}

function saveSettings() {
  data.settings.startingBalance = Number(document.getElementById("startingBalanceInput").value) || 0;
  data.settings.goal = Number(document.getElementById("goalInput").value) || 0;
  data.settings.cash = Number(document.getElementById("cashInput").value) || 0;
  data.settings.dailyPL = Number(document.getElementById("dailyInput").value) || 0;

  saveData();
  renderAll();
}

function saveNotes() {
  const notesInput = document.getElementById("notesInput");
  data.settings.notes = notesInput ? notesInput.value : "";

  saveData();
  renderAll();
}

function resetDemo() {
  if (!confirm("Reset dashboard back to demo data? This will erase saved local dashboard data.")) {
    return;
  }

  data = structuredClone(defaultData);
  saveData();
  renderAll();
}

function wireButtons() {
  const saveAllBtn = document.getElementById("saveAllBtn");
  const resetDemoBtn = document.getElementById("resetDemoBtn");
  const addPositionBtn = document.getElementById("addPositionBtn");
  const addOptionBtn = document.getElementById("addOptionBtn");
  const addWatchBtn = document.getElementById("addWatchBtn");
  const addJournalBtn = document.getElementById("addJournalBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const saveNotesBtn = document.getElementById("saveNotesBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalBackdrop = document.getElementById("modalBackdrop");

  if (saveAllBtn) saveAllBtn.addEventListener("click", saveData);
  if (resetDemoBtn) resetDemoBtn.addEventListener("click", resetDemo);
  if (addPositionBtn) addPositionBtn.addEventListener("click", addPosition);
  if (addOptionBtn) addOptionBtn.addEventListener("click", addOption);
  if (addWatchBtn) addWatchBtn.addEventListener("click", addWatch);
  if (addJournalBtn) addJournalBtn.addEventListener("click", addJournal);
  if (saveSettingsBtn) saveSettingsBtn.addEventListener("click", saveSettings);
  if (saveNotesBtn) saveNotesBtn.addEventListener("click", saveNotes);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", event => {
      if (event.target === modalBackdrop) {
        closeModal();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  wireButtons();
  renderAll();
});
