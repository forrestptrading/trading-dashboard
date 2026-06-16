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
        optionConfidence: "82%"
    },
    {
        symbol: "SPCX",
        name: "SPCX",
        signal: "Market Bias: Space Sector Watch<br>Top Watch: SPCX<br>Confidence: 68%<br>Risk Level: High",
        optionConfidence: "68%"
    },
    {
        symbol: "TSLA",
        name: "TSLA",
        signal: "Market Bias: Momentum Building<br>Top Watch: TSLA<br>Confidence: 76%<br>Risk Level: Moderate",
        optionConfidence: "76%"
    },
    {
        symbol: "NVDA",
        name: "NVDA",
        signal: "Market Bias: AI Leadership<br>Top Watch: NVDA<br>Confidence: 86%<br>Risk Level: Moderate",
        optionConfidence: "86%"
    },
    {
        symbol: "IWM",
        name: "IWM",
        signal: "Market Bias: Small Caps Improving<br>Top Watch: IWM<br>Confidence: 71%<br>Risk Level: Moderate",
        optionConfidence: "71%"
    }
];

let signalIndex = 0;

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
    setText("portfolio-value", money(portfolio.value));
    setText("daily-pl", profitMoney(portfolio.dailyPL));
    setText("buying-power", money(portfolio.buyingPower));
    setText("options-contracts", portfolio.optionsContracts);

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

    if (
        isWeekend ||
        currentMinutes >= marketClose ||
        currentMinutes < marketOpen
    ) {
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

    signalIndex = (signalIndex + 1) % aiSignals.length;
}

updatePortfolio();
updateRobinhoodStatus();
updateMarketStatus();

rotateAISignals();
setInterval(rotateAISignals, 8000);
