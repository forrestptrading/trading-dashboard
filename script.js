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
