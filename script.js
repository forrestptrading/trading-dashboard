const portfolio = {
    value: 10000,
    dailyPL: 250,
    openPositions: 4,
    optionsContracts: 7
};

document.getElementById("portfolio-value").textContent =
    `$${portfolio.value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
document.getElementById("daily-pl").textContent =
    `${portfolio.dailyPL >= 0 ? "+" : ""}$${portfolio.dailyPL.toFixed(2)}`;

document.getElementById("open-positions").textContent =
    portfolio.openPositions;

document.getElementById("options-contracts").textContent =
    portfolio.optionsContracts;
