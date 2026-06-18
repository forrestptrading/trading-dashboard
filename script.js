const BACKEND_URL = "https://trade-dashboard-api--forrestpbusines.replit.app";

const portfolio = {
  totalValue: 52341.87,
  dailyChange: 412.34,
  dailyPercent: 0.79,
  cash: 3241.56,
  invested: 49100.31,
  buyingPower: 3241.56,
  totalReturn: 7241.87,
};

const tickers = [
  ["TSLA", 242.17, -2.15],
  ["NVDA", 875.39, 2.63],
  ["META", 487.23, 1.76],
  ["SPY", 512.87, 0.46],
  ["QQQ", 436.19, 0.8],
  ["AAPL", 213.44, 0.34],
];

const positions = [
  ["NVDA", 4, 735.22, 875.39],
  ["TSLA", 8, 216.44, 242.17],
  ["MSFT", 5, 404.12, 408.91],
  ["AAPL", 10, 198.55, 213.44],
];

const options = [
  ["IWM", "CALL", "286", "6/19", 0.09, 0.14],
  ["NVDA", "CALL", "232.5", "6/1", 0.14, 0.22],
  ["SPCE", "CALL", "8", "6/18", 2.54, 3.35],
];

const pendingTrades = [
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

let currentPendingIndex = 0;

const activity = JSON.parse(localStorage.getItem("activityLog")) || [
  ["BUY", "MSFT", "-$2,044.55", "PENDING"],
  ["WITHDRAWAL", "Bank of America ****1234", "$1,500.00", "PENDING"],
  ["BUY", "NVDA", "-$3,328.56", "COMPLETED"],
  ["SELL", "TSLA", "+$1,277.10", "COMPLETED"],
];

function money(num) {
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function percent(num) {
  return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;
}

function saveActivity() {
  localStorage.setItem("activityLog", JSON.stringify(activity));
}

function loadOverview() {
  document.getElementById("totalValue").textContent = money(portfolio.totalValue);
  document.getElementById("dailyChange").textContent =
    `${portfolio.dailyChange > 0 ? "+" : ""}${money(portfolio.dailyChange)} (${percent(portfolio.dailyPercent)})`;
  document.getElementById("cashValue").textContent = money(portfolio.cash);
  document.getElementById("investedValue").textContent = money(portfolio.invested);
  document.getElementById("buyingPower").textContent = money(portfolio.buyingPower);
  document.getElementById("totalReturn").textContent = `+${money(portfolio.totalReturn)}`;
}

function loadTickerBar() {
  const bar = document.getElementById("tickerBar");
  bar.innerHTML = tickers
    .map(([symbol, price, change]) => {
      const cls = change >= 0 ? "positive" : "negative";
      return `<span>${symbol} ${price.toFixed(2)} <b class="${cls}">${percent(change)}</b></span>`;
    })
    .join("");
}

function loadMarketStatus() {
  document.getElementById("marketStatusList").innerHTML = tickers
    .slice(3)
    .map(([symbol, price, change]) => {
      const cls = change >= 0 ? "positive" : "negative";
      return `
        <div class="market-row">
          <span>${symbol}</span>
          <span>${price.toFixed(2)}</span>
          <span class="${cls}">${percent(change)}</span>
        </div>
      `;
    })
    .join("");
}

function loadMovers() {
  const gainers = tickers.filter(t => t[2] > 0).slice(0, 3);
  const losers = tickers.filter(t => t[2] < 0).slice(0, 3);

  document.getElementById("gainersList").innerHTML = gainers
    .map(t => `<div class="mover-row"><span>${t[0]}</span><span class="positive">${percent(t[2])}</span></div>`)
    .join("");

  document.getElementById("losersList").innerHTML = losers
    .map(t => `<div class="mover-row"><span>${t[0]}</span><span class="negative">${percent(t[2])}</span></div>`)
    .join("");
}

function loadPositions() {
  document.getElementById("positionsTable").innerHTML = positions
    .map(([ticker, shares, avg, current]) => {
      const value = shares * current;
      const cost = shares * avg;
      const pl = value - cost;
      const plPercent = (pl / cost) * 100;
      const cls = pl >= 0 ? "positive" : "negative";

      return `
        <tr>
          <td>${ticker}</td>
          <td>${shares}</td>
          <td>${money(avg)}</td>
          <td>${money(current)}</td>
          <td>${money(value)}</td>
          <td class="${cls}">${money(pl)}</td>
          <td class="${cls}">${percent(plPercent)}</td>
        </tr>
      `;
    })
    .join("");
}

function loadOptions() {
  document.getElementById("optionsTable").innerHTML = options
    .map(([ticker, type, strike, exp, avg, current]) => {
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
    })
    .join("");
}

function loadPendingTrade() {
  const trade = pendingTrades[currentPendingIndex];

  document.getElementById("pendingTrade").innerHTML = `
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
  document.getElementById("riskBox").innerHTML = `
    <p>Open contracts: ${options.length}</p>
    <p>Highest risk: Short expiration calls</p>
    <p>Suggested max risk per trade: 1% - 3%</p>
    <p class="negative">Warning: Same-week options can lose value fast.</p>
  `;
}

function loadWatchlist() {
  document.getElementById("watchlistGrid").innerHTML = tickers
    .map(([symbol, price, change]) => {
      const cls = change >= 0 ? "positive" : "negative";

      return `
        <div class="watch-card">
          <strong>${symbol}</strong>
          <span>${money(price)}</span>
          <span class="${cls}">${percent(change)}</span>
        </div>
      `;
    })
    .join("");
}

function statusIcon(status) {
  if (status === "COMPLETED" || status === "APPROVED") return "✅";
  if (status === "PENDING") return "⏳";
  if (status === "REJECTED") return "❌";
  return "•";
}

function loadActivity() {
  document.getElementById("activityLog").innerHTML = activity
    .map((item, index) => {
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
    })
    .join("");
}

function loadRecentActivity() {
  document.getElementById("recentActivity").innerHTML = activity
    .slice(0, 4)
    .map(([type, name, amount, status]) => {
      const cls = amount.includes("+") ? "positive" : amount.includes("-") ? "negative" : "";

      return `
        <div class="activity-row">
          <span>${statusIcon(status)} ${type} <b>${name}</b></span>
          <span class="${cls}">${amount}</span>
          <span class="badge">${status}</span>
        </div>
      `;
    })
    .join("");
}

function deleteActivity(index) {
  activity.splice(index, 1);
  saveActivity();
  loadActivity();
  loadRecentActivity();
}

function drawPortfolioChart() {
  const canvas = document.getElementById("portfolioChart");
  const ctx = canvas.getContext("2d");

  const data = [50000, 50600, 50250, 51400, 50900, 51800, 52341];
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = 130;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = "#00f5ff";
  ctx.lineWidth = 3;

  const min = Math.min(...data);
  const max = Math.max(...data);

  ctx.beginPath();

  data.forEach((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / (max - min)) * height + 5;

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}

async function checkBackend() {
  try {
    const response = await fetch(BACKEND_URL);
    if (response.ok) {
      document.getElementById("backendStatus").textContent = "🟢 Backend Connected";
    } else {
      document.getElementById("backendStatus").textContent = "🟡 Backend Found";
    }
  } catch {
    document.getElementById("backendStatus").textContent = "🔴 Backend Offline";
  }
}

function setupNavigation() {
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(button.dataset.page).classList.add("active");

      if (button.dataset.page === "overview") {
        drawPortfolioChart();
      }
    });
  });
}

document.getElementById("approveBtn").addEventListener("click", approveTrade);
document.getElementById("rejectBtn").addEventListener("click", rejectTrade);

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
setupNavigation();
drawPortfolioChart();
checkBackend();




