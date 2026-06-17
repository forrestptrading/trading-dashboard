// ===== Helpers =====
function $(id) {
  return document.getElementById(id);
}

function money(value) {
  return "$" + Number(value || 0).toLocaleString();
}

function money2(value) {
  return "$" + Number(value || 0).toFixed(2);
}


// ===== Top Summary Cards =====
const inputPortfolio = $("input-portfolio");
const inputDailyPL = $("input-daily-pl");
const inputBuyingPower = $("input-buying-power");

function updateTopCards() {
  if ($("summary-portfolio") && inputPortfolio) {
    $("summary-portfolio").textContent = money(inputPortfolio.value);
  }

  if ($("summary-daily-pl") && inputDailyPL) {
    $("summary-daily-pl").textContent = "+$" + Number(inputDailyPL.value || 0).toLocaleString();
  }

  if ($("summary-buying-power") && inputBuyingPower) {
    $("summary-buying-power").textContent = money(inputBuyingPower.value);
  }
}

if (inputPortfolio) inputPortfolio.addEventListener("input", updateTopCards);
if (inputDailyPL) inputDailyPL.addEventListener("input", updateTopCards);
if (inputBuyingPower) inputBuyingPower.addEventListener("input", updateTopCards);

updateTopCards();


// ===== AI Analysis =====
if ($("ai-analysis")) {
  $("ai-analysis").innerHTML = `
    Market Bias: Space Sector Watch<br>
    Top Watch: SPCX<br>
    Confidence: 68%<br>
    Risk Level: High
  `;
}


// ===== AI Options Idea =====
const ideas = [
  ["TSLA Call Idea", "76%"],
  ["NVDA Call Idea", "86%"],
  ["SPY Momentum Idea", "72%"]
];

let ideaIndex = 0;

function updateIdea() {
  if (!$("option-idea")) return;

  const idea = ideas[ideaIndex];

  $("option-idea").innerHTML = `
    <div class="position-row">
      <span><strong>${idea[0]}</strong></span>
      <strong class="profit">${idea[1]}</strong>
    </div>
    <p>Demo setup rotating with the live chart. Real contract data will come later.</p>
  `;

  ideaIndex = (ideaIndex + 1) % ideas.length;
}

updateIdea();
setInterval(updateIdea, 5000);


// ===== Options Portfolio =====
function updateOptionsPortfolio() {
  const contracts = 1;
  const totalCost = 9;
  const currentValue = 25;
  const profit = currentValue - totalCost;
  const returnPercent = ((profit / totalCost) * 100).toFixed(1);

  if ($("options-contracts")) $("options-contracts").textContent = contracts;
  if ($("options-total-cost")) $("options-total-cost").textContent = money2(totalCost);
  if ($("options-current-value")) $("options-current-value").textContent = money2(currentValue);
  if ($("options-pl")) $("options-pl").textContent = "+$" + profit.toFixed(2);
  if ($("options-return")) $("options-return").textContent = returnPercent + "%";

  if ($("risk-contracts")) $("risk-contracts").textContent = contracts;
  if ($("risk-calls")) $("risk-calls").textContent = "1";
  if ($("risk-puts")) $("risk-puts").textContent = "0";
  if ($("risk-exposure")) $("risk-exposure").textContent = money2(totalCost);
  if ($("risk-level")) $("risk-level").textContent = "High";
}

updateOptionsPortfolio();


// ===== Robinhood Integration =====
if ($("rh-status")) {
  $("rh-status").textContent = "Connected";
  $("rh-status").className = "connected";
}

if ($("rh-sync")) $("rh-sync").textContent = "Waiting";
if ($("rh-update")) $("rh-update").textContent = "Never";
if ($("rh-mode")) $("rh-mode").textContent = "Confirmation Required";
if ($("rh-source")) $("rh-source").textContent = "Demo Mode";
if ($("rh-backend")) $("rh-backend").textContent = "Not Connected";
if ($("rh-orders")) $("rh-orders").textContent = "Approval Only";

if ($("rh-account-value")) $("rh-account-value").textContent = "$0.00";
if ($("rh-buying-power")) $("rh-buying-power").textContent = "$0.00";
if ($("rh-day-pl")) $("rh-day-pl").textContent = "$0.00";


// ===== Options Tracker =====
let options = [];

function renderOptions() {
  const list = $("options-list");
  if (!list) return;

  list.innerHTML = "";

  options.forEach((option, index) => {
    const row = document.createElement("div");
    row.className = "position-row";
    row.innerHTML = `
      <span>${option.symbol} ${option.strike}${option.type} ${option.expiration}</span>
      <strong>${money2(option.current)}</strong>
      <button type="button" onclick="deleteOption(${index})">Delete</button>
    `;
    list.appendChild(row);
  });
}

function addOption() {
  const symbol = $("option-symbol")?.value || "";
  const strike = $("option-strike")?.value || "";
  const type = $("option-type")?.value || "Call";
  const expiration = $("option-expiration")?.value || "";
  const cost = Number($("option-cost")?.value || 0);
  const current = Number($("option-current")?.value || 0);

  if (!symbol || !strike) return;

  options.push({ symbol, strike, type, expiration, cost, current });
  renderOptions();
}

function deleteOption(index) {
  options.splice(index, 1);
  renderOptions();
}

window.addOption = addOption;
window.deleteOption = deleteOption;

function approveTrade() {
  const status = document.getElementById("trade-status");

  if (!status) {
    alert("Could not find trade-status.");
    return;
  }

  status.textContent = "Approved";
  status.style.color = "#00ff88";
}

function rejectTrade() {
  const status = document.getElementById("trade-status");

  if (!status) {
    alert("Could not find trade-status.");
    return;
  }

  status.textContent = "Rejected";
  status.style.color = "#ff4d4d";
}

function deleteTrade(button) {
  const card = button.closest(".trade-card");
  if (card) card.remove();
}

window.approveTrade = approveTrade;
window.rejectTrade = rejectTrade;
window.deleteTrade = deleteTrade;
