const BACKEND_URL = "https://trade-dashboard-api--forrestpbusines.replit.app";

const WATCHLIST_SYMBOLS = ["AAPL", "SPY", "TSLA", "NVDA", "QQQ", "IWM", "AGQ"];

let liveQuotes = {};
let currentPendingIndex = 0;

let holdings = JSON.parse(localStorage.getItem("holdings")) || [
  { ticker: "AAPL", shares: 2, avgCost: 213.44 },
  { ticker: "SPY", shares: 1, avgCost: 512.87 },
  { ticker: "TSLA", shares: 2, avgCost: 242.17 },
  { ticker: "NVDA", shares: 1, avgCost: 875.39 },
];

let options = JSON.parse(localStorage.getItem("options")) || [
  ["IWM", "CALL", "286", "6/19", 0.09, 0.14],
  ["NVDA", "CALL", "232.5", "6/1", 0.14, 0.22],
  ["SPCE", "CALL", "8", "6/18", 2.54, 3.35],
];

let pendingTrades = [
  {
    action: "BUY",
    ticker: "NVDA",
    type: "CALL",
    strike: "900",
    exp: "6/21",
    cost: "$245.00",
  },
  {
    action: "SELL",
    ticker: "TSLA",
    type: "SHARES",
    strike: "-",
    exp: "-",
    cost: "$1,277.10",
  },
];

let activity = JSON.parse(localStorage.getItem("activityLog")) || [
  ["BUY", "MSFT", "-$2,044.55", "PENDING"],
  ["WITHDRAWAL", "Bank of America ****1234", "$1,500.00", "PENDING"],
  ["BUY", "NVDA", "-$3,328.56", "COMPLETED"],
  ["SELL", "TSLA", "+$1,277.10", "COMPLETED"],
];

let aiAlerts = JSON.parse(localStorage.getItem("aiAlerts")) || [
  {
    ticker: "TSLA",
    direction: "Bullish",
    contract: "TSLA 6/21 $250 CALL",
    strike: "$250",
    avg: "$1.35",
    breakeven: "$251.35",
    stockMove: "+4.21% in 1 hour",
    callVolume: "18,420",
    openInterest: "6,300",
    volumeOi: "2.9x",
    reason: "Breakout above hourly resistance with unusual call volume.",
  },
];

function $(id) {
  return document.getElementById(id);
}

function money(num) {
  return Number(num || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function percent(num) {
  return `${num >= 0 ? "+" : ""}${Number(num || 0).toFixed(2)}%`;
}

function saveHoldings() {
  localStorage.setItem("holdings", JSON.stringify(holdings));
}

function saveActivity() {
  localStorage.setItem("activityLog", JSON.stringify(activity));
}

function saveAiAlerts() {
  localStorage.setItem("aiAlerts", JSON.stringify(aiAlerts));
}

function getQuote(symbol) {
  return liveQuotes[symbol] || null;
}

function getLivePrice(symbol, fallback = 0) {
  const quote = getQuote(symbol);
  return quote?.price || quote?.last || fallback;
}

function getLiveChange(symbol) {
  const quote = getQuote(symbol);
  return quote?.percentChange || quote?.changePercent || quote?.change_percent || 0;
}

async function fetchLiveQuotes() {
  try {
    const symbols = [...new Set([...WATCHLIST_SYMBOLS, ...holdings.map(h => h.ticker)])].join(",");
    const response = await fetch(`${BACKEND_URL}/api/quotes?symbols=${symbols}`);
    const data = await response.json();

    if (data.quotes) {
      liveQuotes = data.quotes;
    } else if (data.data) {
      liveQuotes = data.data;
    }

    const lastUpdated = $("lastUpdated");
    if (lastUpdated) {
      lastUpdated.textContent = `Last Updated: ${new Date().toLocaleTimeString()}`;
    }

    refreshDashboard();
  } catch (error) {
    console.log("Live quotes failed:", error);
  }
}

function calculatePortfolio() {
  let invested = 0;
  let totalValue = 0;

  holdings.forEach(h => {
    const current = getLivePrice(h.ticker, h.avgCost);
    invested += h.shares * h.avgCost;
    totalValue += h.shares * current;
  });

  const totalReturn = totalValue - invested;
  const dailyChange = holdings.reduce((sum, h) => {
    const quote = getQuote(h.ticker);
    const change = quote?.change || quote?.priceChange || 0;
    return sum + change * h.shares;
  }, 0);

  const dailyPercent = totalValue > 0 ? (dailyChange / totalValue) * 100 : 0;

  return {
    totalValue,
    invested,
    cash: 3241.56,
    buyingPower: 3241.56,
    totalReturn,
    dailyChange,
    dailyPercent,
  };
}

function loadOverview() {
  const portfolio = calculatePortfolio();

  if ($("totalValue")) $("totalValue").textContent = money(portfolio.totalValue);
  if ($("dailyChange")) {
    $("dailyChange").textContent = `${money(portfolio.dailyChange)} (${percent(portfolio.dailyPercent)})`;
    $("dailyChange").className = portfolio.dailyChange >= 0 ? "positive" : "negative";
  }
  if ($("cashValue")) $("cashValue").textContent = money(portfolio.cash);
  if ($("investedValue")) $("investedValue").textContent = money(portfolio.invested);
  if ($("buyingPower")) $("buyingPower").textContent = money(portfolio.buyingPower);
  if ($("totalReturn")) {
    $("totalReturn").textContent = money(portfolio.totalReturn);
    $("totalReturn").className = portfolio.totalReturn >= 0 ? "positive" : "negative";
  }
}

function loadTickerBar() {
  const tickerBar = $("tickerBar");
  if (!tickerBar) return;

  tickerBar.innerHTML = WATCHLIST_SYMBOLS.map(symbol => {
    const price = getLivePrice(symbol, 0);
    const change = getLiveChange(symbol);
    const cls = change >= 0 ? "positive" : "negative";

    return `<span>${symbol} ${money(price)} <b class="${cls}">${percent(change)}</b></span>`;
  }).join("");
}

function loadWatchlist() {
  const watchlistGrid = $("watchlistGrid");
  if (!watchlistGrid) return;

  watchlistGrid.innerHTML = WATCHLIST_SYMBOLS.map(symbol => {
    const price = getLivePrice(symbol, 0);
    const change = getLiveChange(symbol);
    const cls = change >= 0 ? "positive" : "negative";

    return `
      <div class="watch-card">
        <strong>${symbol}</strong>
        <span>${money(price)}</span>
        <span class="${cls}">${percent(change)}</span>
      </div>
    `;
  }).join("");
}

function loadMarketStatus() {
  const marketStatusList = $("marketStatusList");
  if (!marketStatusList) return;

  marketStatusList.innerHTML = WATCHLIST_SYMBOLS.slice(0, 5).map(symbol => {
    const price = getLivePrice(symbol, 0);
    const change = getLiveChange(symbol);
    const cls = change >= 0 ? "positive" : "negative";

    return `
      <div class="market-row">
        <span>${symbol}</span>
        <span>${money(price)}</span>
        <span class="${cls}">${percent(change)}</span>
      </div>
    `;
  }).join("");
}

function loadMovers() {
  const gainersList = $("gainersList");
  const losersList = $("losersList");
  if (!gainersList || !losersList) return;

  const sorted = WATCHLIST_SYMBOLS.map(symbol => ({
    symbol,
    change: getLiveChange(symbol),
  })).sort((a, b) => b.change - a.change);

  gainersList.innerHTML = sorted
    .filter(x => x.change >= 0)
    .slice(0, 3)
    .map(x => `<div class="mover-row"><span>${x.symbol}</span><span class="positive">${percent(x.change)}</span></div>`)
    .join("");

  losersList.innerHTML = sorted
    .filter(x => x.change < 0)
    .slice(0, 3)
    .map(x => `<div class="mover-row"><span>${x.symbol}</span><span class="negative">${percent(x.change)}</span></div>`)
    .join("");
}

function loadPositions() {
  const positionsTable = $("positionsTable");
  if (!positionsTable) return;

  positionsTable.innerHTML = holdings.map((h, index) => {
    const current = getLivePrice(h.ticker, h.avgCost);
    const value = h.shares * current;
    const cost = h.shares * h.avgCost;
    const pl = value - cost;
    const plPercent = cost > 0 ? (pl / cost) * 100 : 0;
    const cls = pl >= 0 ? "positive" : "negative";

    return `
      <tr>
        <td>${h.ticker}</td>
        <td>${h.shares}</td>
        <td>${money(h.avgCost)}</td>
        <td>${money(current)}</td>
        <td>${money(value)}</td>
        <td class="${cls}">${money(pl)}</td>
        <td class="${cls}">${percent(plPercent)}</td>
        <td><button class="reject" onclick="deleteHolding(${index})">Delete</button></td>
      </tr>
    `;
  }).join("");
}

function addHolding() {
  const tickerInput = $("holdingTicker");
  const sharesInput = $("holdingShares");
  const avgInput = $("holdingAvg");

  if (!tickerInput || !sharesInput || !avgInput) return;

  const ticker = tickerInput.value.trim().toUpperCase();
  const shares = Number(sharesInput.value);
  const avgCost = Number(avgInput.value);

  if (!ticker || shares <= 0 || avgCost <= 0) {
    alert("Enter ticker, shares, and average cost.");
    return;
  }

  holdings.push({ ticker, shares, avgCost });
  saveHoldings();

  tickerInput.value = "";
  sharesInput.value = "";
  avgInput.value = "";

 async function fetchLiveQuotes() {
  try {
    const symbols = [...new Set([...WATCHLIST_SYMBOLS, ...holdings.map(h => h.ticker)])].join(",");
    const response = await fetch(`${BACKEND_URL}/api/quotes?symbols=${symbols}`);
    const data = await response.json();

    if (Array.isArray(data.data)) {
      liveQuotes = {};
      data.data.forEach(q => {
        liveQuotes[q.symbol] = q;
      });
    }

    const lastUpdated = $("lastUpdated");
    if (lastUpdated) {
      lastUpdated.textContent = `Last Updated: ${new Date().toLocaleTimeString()}`;
    }

    refreshDashboard();
  } catch (error) {
    console.log("Live quotes failed:", error);
  }
}

function deleteHolding(index) {
  holdings.splice(index, 1);
  saveHoldings();
  refreshDashboard();
}

function loadOptions() {
  const optionsTable = $("optionsTable");
  if (!optionsTable) return;

  optionsTable.innerHTML = options.map(([ticker, type, strike, exp, avg, current]) => {
    const pl = (current - avg) * 100;
    const cls = pl >= 0 ? "positive" : "negative";

    return `
      <tr>
        <td>${ticker}</td>
        <td>${type}</td>
        <td>${strike}</td>
        <td>${exp}</td>
        <td>$${avg.toFixed(2)}</td>
        <td>$${current.toFixed(2)}</td>
        <td class="${cls}">${money(pl)}</td>
      </tr>
    `;
  }).join("");
}

function loadPendingTrade() {
  const pendingTrade = $("pendingTrade");
  if (!pendingTrade) return;

  const trade = pendingTrades[currentPendingIndex];

  pendingTrade.innerHTML = `
    <h3>${trade.action} ${trade.ticker}</h3>
    <p>Type: ${trade.type}</p>
    <p>Strike: ${trade.strike}</p>
    <p>Expiration: ${trade.exp}</p>
    <p>Estimated Cost: ${trade.cost}</p>
  `;
}

function approveTrade() {
  const trade = pendingTrades[currentPendingIndex];
  activity.unshift([trade.action, trade.ticker, trade.cost, "APPROVED"]);
  saveActivity();
  nextPendingTrade();
  loadActivity();
  loadRecentActivity();
}

function rejectTrade() {
  const trade = pendingTrades[currentPendingIndex];
  activity.unshift([trade.action, trade.ticker, trade.cost, "REJECTED"]);
  saveActivity();
  nextPendingTrade();
  loadActivity();
  loadRecentActivity();
}

function nextPendingTrade() {
  currentPendingIndex = (currentPendingIndex + 1) % pendingTrades.length;
  loadPendingTrade();
}

function loadRiskBox() {
  const riskBox = $("riskBox");
  if (!riskBox) return;

  riskBox.innerHTML = `
    <p>Open contracts: ${options.length}</p>
    <p>Open stock holdings: ${holdings.length}</p>
    <p>Highest risk: Short expiration options</p>
    <p>Suggested max risk per trade: 1% - 3%</p>
    <p class="negative">Warning: Same-week options can lose value fast.</p>
  `;
}

function statusIcon(status) {
  if (status === "COMPLETED" || status === "APPROVED") return "✅";
  if (status === "PENDING") return "⏳";
  if (status === "REJECTED") return "❌";
  return "•";
}

function loadActivity() {
  const activityLog = $("activityLog");
  if (!activityLog) return;

  activityLog.innerHTML = activity.map((item, index) => {
    const [type, name, amount, status] = item;
    const cls = amount.includes("+") ? "positive" : amount.includes("-") ? "negative" : "";

    return `
      <div class="activity-row">
        <span>${statusIcon(status)} ${type} <b>${name}</b></span>
        <span class="${cls}">${amount}</span>
        <span class="badge">${status}</span>
        <button onclick="deleteActivity(${index})" class="reject">Delete</button>
      </div>
    `;
  }).join("");
}

function loadRecentActivity() {
  const recentActivity = $("recentActivity");
  if (!recentActivity) return;

  recentActivity.innerHTML = activity.slice(0, 4).map(([type, name, amount, status]) => {
    const cls = amount.includes("+") ? "positive" : amount.includes("-") ? "negative" : "";

    return `
      <div class="activity-row">
        <span>${statusIcon(status)} ${type} <b>${name}</b></span>
        <span class="${cls}">${amount}</span>
        <span class="badge">${status}</span>
      </div>
    `;
  }).join("");
}

function deleteActivity(index) {
  activity.splice(index, 1);
  saveActivity();
  loadActivity();
  loadRecentActivity();
}

function enableNotifications() {
  if ("Notification" in window) {
    Notification.requestPermission();
  }
}

function sendTradeAlert(alert) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(`AI Trade Alert: ${alert.ticker}`, {
      body: `${alert.contract} | Avg ${alert.avg} | Move ${alert.stockMove}`,
    });
  }
}

function loadAiAlerts() {
  const box = $("aiAlerts");
  if (!box) return;

  if (aiAlerts.length === 0) {
    box.innerHTML = `<p>No AI alerts detected.</p>`;
    return;
  }

  box.innerHTML = aiAlerts.map(alert => {
    return `
      <div class="activity-row">
        <span>
          <b class="positive">AI ALERT: ${alert.ticker}</b><br>
          ${alert.direction} — ${alert.contract}<br>
          Strike: ${alert.strike} | Avg: ${alert.avg} | Breakeven: ${alert.breakeven}<br>
          Move: ${alert.stockMove}<br>
          Call Volume: ${alert.callVolume} | OI: ${alert.openInterest} | Vol/OI: ${alert.volumeOi}<br>
          <small>${alert.reason}</small>
        </span>
      </div>
    `;
  }).join("");
}

function testAiAlert() {
  const alert = {
    ticker: "NVDA",
    direction: "Bullish",
    contract: "NVDA 6/21 $900 CALL",
    strike: "$900",
    avg: "$2.45",
    breakeven: "$902.45",
    stockMove: "+4.08% in 1 hour",
    callVolume: "12,880",
    openInterest: "4,210",
    volumeOi: "3.1x",
    reason: "Stock triggered breakout rule with elevated call volume.",
  };

  aiAlerts.unshift(alert);
  saveAiAlerts();
  loadAiAlerts();
  sendTradeAlert(alert);
}

function drawPortfolioChart() {
  const canvas = $("portfolioChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const portfolio = calculatePortfolio();
  const base = portfolio.invested || 10000;
  const end = portfolio.totalValue || base;
  const data = [
    base * 0.97,
    base * 0.985,
    base * 0.975,
    base * 1.01,
    base * 0.995,
    base * 1.015,
    end,
  ];

  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = 130;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "#00f5ff";
  ctx.lineWidth = 3;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  ctx.beginPath();

  data.forEach((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 10) + 5;

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

async function checkBackend() {
  const backendStatus = $("backendStatus");
  if (!backendStatus) return;

  try {
    const response = await fetch(BACKEND_URL);

    if (response.ok) {
      backendStatus.textContent = "🟢 Backend Connected";
    } else {
      backendStatus.textContent = "🟡 Backend Found";
    }
  } catch {
    backendStatus.textContent = "🔴 Backend Offline";
  }
}

function setupNavigation() {
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));

      button.classList.add("active");

      const page = document.getElementById(button.dataset.page);
      if (page) page.classList.add("active");

      if (button.dataset.page === "overview") {
        setTimeout(drawPortfolioChart, 100);
      }
    });
  });
}

function setupButtons() {
  const approveBtn = $("approveBtn");
  const rejectBtn = $("rejectBtn");
  const addHoldingBtn = $("addHoldingBtn");

  if (approveBtn) approveBtn.addEventListener("click", approveTrade);
  if (rejectBtn) rejectBtn.addEventListener("click", rejectTrade);
  if (addHoldingBtn) addHoldingBtn.addEventListener("click", addHolding);
}

function refreshDashboard() {
  loadOverview();
  loadTickerBar();
  loadMarketStatus();
  loadMovers();
  loadPositions();
  loadOptions();
  loadPendingTrade();
  loadRiskBox();
  loadWatchlist();
  loadActivity();
  loadRecentActivity();
  loadAiAlerts();
  drawPortfolioChart();
}

setupButtons();
setupNavigation();
refreshDashboard();
checkBackend();
fetchLiveQuotes();

setInterval(fetchLiveQuotes, 60000);



