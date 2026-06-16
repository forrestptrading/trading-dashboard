const portfolio = {
    value: 10000,
    dailyPL: 250,
    buyingPower: 3500,
    openPositions: 4,
    optionsContracts: 7
};

const robinhood = {
    connected: false,
    lastSync: "Waiting",
    lastUpdate: "Never"
};

const aiSignals = [
    {
        symbol: "AGQ",
        name: "AGQ",
        signal: "Market Bias: Silver Bullish<br>Top Watch: AGQ<br>Confidence: 82%<br>Risk Level: High",
        optionConfidence: "82%",
        tradeIdea: "AGQ Call",
        tradeConfidence: "82%",
        tradeRisk: "High"
    },
    {
        symbol: "SPCX",
        name: "SPCX",
        signal: "Market Bias: Space Sector Watch<br>Top Watch: SPCX<br>Confidence: 68%<br>Risk Level: High",
        optionConfidence: "68%",
        tradeIdea: "SPCX Call",
        tradeConfidence: "68%",
        tradeRisk: "Moderate"
    },
    {
        symbol: "TSLA",
        name: "TSLA",
        signal: "Market Bias: Momentum Building<br>Top Watch: TSLA<br>Confidence: 76%<br>Risk Level: Moderate",
        optionConfidence: "76%",
        tradeIdea: "TSLA 350 Call",
        tradeConfidence: "76%",
        tradeRisk: "Moderate"
    },
    {
        symbol: "NVDA",
        name: "NVDA",
        signal: "Market Bias: AI Leadership<br>Top Watch: NVDA<br>Confidence: 86%<br>Risk Level: Moderate",
        optionConfidence: "86%",
        tradeIdea: "NVDA 185 Call",
        tradeConfidence: "86%",
        tradeRisk: "Moderate"    
    },
    {
        symbol: "IWM",
        name: "IWM",
        signal: "Market Bias: Small Caps Improving<br>Top Watch: IWM<br>Confidence: 71%<br>Risk Level: Moderate",
        optionConfidence: "71%",
        tradeIdea: "IWM 286 Call",
        tradeConfidence: "79%",
        tradeRisk: "Moderate"
}
];

let signalIndex = 0;
let currentTradeSymbol = "AGQ";

let tradeJournal = JSON.parse(
    localStorage.getItem("tradeJournal")
) || [];

function money(value) {
    return "$" + value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function profitMoney(value) {
    return (value >= 0 ? "+$" : "-$") + Math.abs(value).toFixed(2);
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function updatePortfolio() {
    setText("summary-portfolio", money(portfolio.value));
    setText("summary-daily-pl", profitMoney(portfolio.dailyPL));
    setText("summary-buying-power", money(portfolio.buyingPower));
}

function updateRobinhoodStatus() {
    setText("rh-status", robinhood.connected ? "Connected" : "Disconnected");
    setText("rh-sync", robinhood.lastSync);
    setText("rh-update", robinhood.lastUpdate);

    const status = document.getElementById("rh-status");

    if (status) {
        status.className = robinhood.connected ? "connected" : "disconnected";
    }
}

function updateMarketStatus() {
    const now = new Date();

    const options = {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        weekday: "short"
    };

    const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(now);

    const day = parts.find(part => part.type === "weekday").value;
    const hour = Number(parts.find(part => part.type === "hour").value);
    const minute = Number(parts.find(part => part.type === "minute").value);

    const currentMinutes = hour * 60 + minute;
    const marketOpen = 9 * 60 + 30;
    const marketClose = 16 * 60;
    const isWeekend = day === "Sat" || day === "Sun";

    const status = document.getElementById("market-status");

    if (!status) return;

    if (isWeekend || currentMinutes >= marketClose || currentMinutes < marketOpen) {
        status.textContent = "🔴 CLOSED";
        status.className = "closed";
    } else {
        status.textContent = "🟢 OPEN";
        status.className = "profit";
    }
}

function loadChart(symbol, name) {
    const chartBox = document.getElementById("live-chart");
    const chartTitle = document.getElementById("chart-title");

    if (!chartBox || !chartTitle) return;

    chartTitle.textContent = "📊 Live Chart: " + name;
    chartBox.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;

    script.innerHTML = JSON.stringify({
        symbol: symbol,
        width: "100%",
        height: "100%",
        locale: "en",
        dateRange: "1D",
        colorTheme: "dark",
        isTransparent: true,
        autosize: true
    });

    chartBox.appendChild(script);
}

function rotateAISignals() {
    const current = aiSignals[signalIndex];
    currentTradeSymbol = current.name;
    
    const aiAnalysis = document.getElementById("ai-analysis");
    const optionIdea = document.getElementById("option-idea");

    if (aiAnalysis) {
        aiAnalysis.innerHTML = current.signal;
    }

    if (optionIdea) {
        optionIdea.innerHTML = `
            <div class="position-row">
                <span>${current.name} Call Idea</span>
                <span class="profit">${current.optionConfidence}</span>
            </div>
            <p style="margin-top: 15px; opacity: 0.8;">
                Demo setup rotating with the live chart. Real contract data will come later.
            </p>
        `;
    }

    loadChart(current.symbol, current.name);

    const tradeIdea = document.getElementById("pending-trade-idea");
    const tradeConfidence = document.getElementById("pending-confidence");
    const tradeRisk = document.getElementById("pending-risk");
    
    if (tradeIdea) {
    tradeIdea.textContent = current.tradeIdea;
}

    if (tradeConfidence) {
        tradeConfidence.textContent = current.tradeConfidence;
}

    if (tradeRisk) {
    tradeRisk.textContent = current.tradeRisk;
}
    loadSavedTradeStatus();
    
    signalIndex = (signalIndex + 1) % aiSignals.length;
}

function approveTrade() {
    const status = document.getElementById("trade-status");

    if (status) {
        status.textContent = "Approved";
        status.className = "approved";
    }

    localStorage.setItem("tradeStatus_" + currentTradeSymbol, "Approved");

    tradeJournal.unshift({
        date: new Date().toLocaleDateString(),
        symbol: currentTradeSymbol,
        idea: document.getElementById("pending-trade-idea").textContent,
        confidence: document.getElementById("pending-confidence").textContent,
        risk: document.getElementById("pending-risk").textContent,
        status: "Approved"
    });

    localStorage.setItem(
        "tradeJournal",
        JSON.stringify(tradeJournal)
    );
    renderTradeJournal();
}

function rejectTrade() {
    const status = document.getElementById("trade-status");

    if (status) {
        status.textContent = "Rejected";
        status.className = "rejected";
    }

    localStorage.setItem("tradeStatus_" + currentTradeSymbol, "Rejected");

    tradeJournal = tradeJournal.filter(
        trade => trade.symbol !== currentTradeSymbol
    );

    localStorage.setItem(
        "tradeJournal",
        JSON.stringify(tradeJournal)
    );

    renderTradeJournal();
}

function renderTradeJournal() {
    const list = document.getElementById("trade-journal-list");
    if (!list) return;

    if (tradeJournal.length === 0) {
        list.innerHTML = "No trades recorded yet.";
        return;
    }

    list.innerHTML = "";

    tradeJournal.forEach((trade) => {
        list.innerHTML += `
            <div class="position-row">
                <span>${trade.date} — ${trade.idea}</span>
                <span class="${trade.status === "Approved" ? "profit" : "loss"}">${trade.status}</span>
            </div>
        `;
    });
}
function loadSavedTradeStatus() {
    const savedStatus = localStorage.getItem(
    "tradeStatus_" + currentTradeSymbol
);
    const status = document.getElementById("trade-status");

    if (!status || !savedStatus) return;

    status.textContent = savedStatus;
    status.className = savedStatus === "Approved" ? "approved" : "rejected";
}
function loadPortfolioInputs() {
    const portfolioInput = document.getElementById("input-portfolio");
    const dailyInput = document.getElementById("input-daily-pl");
    const buyingPowerInput = document.getElementById("input-buying-power");

    const portfolioDisplay = document.getElementById("summary-portfolio");
    const dailyDisplay = document.getElementById("summary-daily-pl");
    const buyingPowerDisplay = document.getElementById("summary-buying-power");

    const savedPortfolio = localStorage.getItem("portfolioValue");
    const savedDaily = localStorage.getItem("dailyPL");
    const savedBuyingPower = localStorage.getItem("buyingPower");

    if (savedPortfolio) portfolioInput.value = savedPortfolio;
    if (savedDaily) dailyInput.value = savedDaily;
    if (savedBuyingPower) buyingPowerInput.value = savedBuyingPower;

    function updateValues() {
        portfolioDisplay.textContent = "$" + Number(portfolioInput.value).toLocaleString();
        dailyDisplay.textContent = "$" + Number(dailyInput.value).toLocaleString();
        buyingPowerDisplay.textContent = "$" + Number(buyingPowerInput.value).toLocaleString();

        localStorage.setItem("portfolioValue", portfolioInput.value);
        localStorage.setItem("dailyPL", dailyInput.value);
        localStorage.setItem("buyingPower", buyingPowerInput.value);
    }

    portfolioInput.addEventListener("input", updateValues);
    dailyInput.addEventListener("input", updateValues);
    buyingPowerInput.addEventListener("input", updateValues);

    updateValues();
}

let savedOptions = JSON.parse(localStorage.getItem("optionsTracker")) || [];

function saveOptions() {
    localStorage.setItem("optionsTracker", JSON.stringify(savedOptions));
}

function renderOptions() {
    const list = document.getElementById("options-list");
    if (!list) return;

    list.innerHTML = "";

    savedOptions.forEach((option, index) => {
        const cost = Number(option.cost);
        const current = Number(option.current);

        const profitLoss = (current - cost) * 100;
        const returnPercent = cost > 0 ? ((current - cost) / cost) * 100 : 0;
        const plClass = profitLoss >= 0 ? "profit" : "loss";
        const sign = profitLoss >= 0 ? "+" : "-";

        list.innerHTML += `
            <div class="option-card">
                <div class="position-row">
                    <span>${option.symbol} ${option.strike} ${option.type} ${option.expiration}</span>
                    <span class="${plClass}">${sign}$${Math.abs(profitLoss).toFixed(2)}</span>
                </div>

                <div class="position-row">
                    <span>Cost</span>
                    <span>$${cost.toFixed(2)}</span>
                </div>

                <div class="position-row">
                    <span>Current</span>
                    <span>$${current.toFixed(2)}</span>
                </div>

                <div class="position-row">
                    <span>Return</span>
                    <span class="${plClass}">${sign}${Math.abs(returnPercent).toFixed(1)}%</span>
                </div>

                <button type="button" onclick="deleteOption(${index})">Delete</button>
            </div>
        `;
    });
}

function addOption() {
    const symbol = document.getElementById("option-symbol").value;
    const strike = document.getElementById("option-strike").value;
    const type = document.getElementById("option-type").value;
    const expiration = document.getElementById("option-expiration").value;
    const cost = Number(document.getElementById("option-cost").value);
    const current = Number(document.getElementById("option-current").value);

    savedOptions.push({
        symbol,
        strike,
        type,
        expiration,
        cost,
        current
    });

    saveOptions();
    renderOptions();
}

function deleteOption(index) {
    savedOptions.splice(index, 1);
    saveOptions();
    renderOptions();
}

updatePortfolio();
updateRobinhoodStatus();
updateMarketStatus();
loadSavedTradeStatus();
rotateAISignals();
loadPortfolioInputs();
renderOptions();
renderTradeJournal();

setInterval(rotateAISignals, 8000);
