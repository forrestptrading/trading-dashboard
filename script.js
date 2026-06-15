const portfolio = {
    value: 10000,
    dailyPL: 250,
    openPositions: 4,
    optionsContracts: 7,
    buyingPower: 3500
};

function money(amount) {
    return "$" + amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function profitMoney(amount) {
    return (amount >= 0 ? "+$" : "-$") + Math.abs(amount).toFixed(2);
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

setText("portfolio-value", money(portfolio.value));
setText("daily-pl", profitMoney(portfolio.dailyPL));
setText("options-contracts", portfolio.optionsContracts);
setText("buying-power", money(portfolio.buyingPower));

setText("summary-portfolio", money(portfolio.value));
setText("summary-daily-pl", profitMoney(portfolio.dailyPL));
setText("summary-buying-power", money(portfolio.buyingPower));
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

    if (isWeekend || currentMinutes >= marketClose || currentMinutes < marketOpen) {
        setText("market-status", "🔴 CLOSED");
    } else {
        setText("market-status", "🟢 OPEN");
    }
}

updateMarketStatus();
