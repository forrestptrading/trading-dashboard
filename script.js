const portfolio = {
    value: 0,
    dailyPL: 125.43,
    openPositions: 0,
    optionsContracts: 0
};

document.getElementById("portfolio-value").textContent =
    `$${portfolio.value.toFixed(2)}`;

document.getElementById("daily-pl").textContent =
    `${portfolio.dailyPL >= 0 ? "+" : ""}$${portfolio.dailyPL.toFixed(2)}`;

document.getElementById("open-positions").textContent =
    portfolio.openPositions;

document.getElementById("options-contracts").textContent =
    portfolio.optionsContracts;
