let subs = [];
let step = 2; // Always in dashboard view in RunwayMap
let selectedCurrency = "USD";
let currentView = "treemap";
let currentRole = "cfo"; // 'cfo', 'ceo', or 'engineer'
let activeInsights = [];

// Modeling variables
let startingCash = 50000;
let teamScale = 0; // +N employees
let surgeScale = 1.0; // 1.0x to 2.5x API/Infra surge
let cashInjections = 0;
let projectedHires = 0;
let averageSalary = 5000;

// Scorecard Animation Trackers
let lastTotalBurn = 0;
let lastBaseBurn = 0;
let lastARR = 0;
let lastRunway = 0;

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "ph:check-circle-bold";
  if (type === "warning") icon = "ph:warning-bold";
  if (type === "error") icon = "ph:x-circle-bold";
  if (type === "info") icon = "ph:info-bold";
  
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span class="iconify text-sm shrink-0" data-icon="${icon}"></span>
      <span class="text-xs font-bold text-slate-200">${message}</span>
    </div>
    <button class="text-slate-500 hover:text-slate-300 ml-2" onclick="this.parentElement.remove()">
      <span class="iconify" data-icon="ph:x-bold"></span>
    </button>
  `;
  
  container.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.classList.add("show");
  });
  
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

function animateValue(element, start, end, duration, formatFn) {
  if (!element) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const current = start + progress * (end - start);
    element.innerText = formatFn(current);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.innerText = formatFn(end);
    }
  };
  window.requestAnimationFrame(step);
}

window.currencies = {
  USD: { symbol: "$", name: "US Dollar", rate: 1 },
  EUR: { symbol: "€", name: "Euro", rate: 0.92 },
  GBP: { symbol: "£", name: "British Pound", rate: 0.79 },
  JPY: { symbol: "¥", name: "Japanese Yen", rate: 149.5 },
  CNY: { symbol: "¥", name: "Chinese Yuan", rate: 7.24 },
  KRW: { symbol: "₩", name: "South Korean Won", rate: 1320 },
  INR: { symbol: "₹", name: "Indian Rupee", rate: 83.12 },
  CAD: { symbol: "C$", name: "Canadian Dollar", rate: 1.36 },
  AUD: { symbol: "A$", name: "Australian Dollar", rate: 1.53 },
  CHF: { symbol: "CHF", name: "Swiss Franc", rate: 0.88 },
  HKD: { symbol: "HK$", name: "Hong Kong Dollar", rate: 7.82 },
  SGD: { symbol: "S$", name: "Singapore Dollar", rate: 1.34 },
  SEK: { symbol: "kr", name: "Swedish Krona", rate: 10.42 },
  NOK: { symbol: "kr", name: "Norwegian Krone", rate: 10.85 },
  DKK: { symbol: "kr", name: "Danish Krone", rate: 6.87 },
  NZD: { symbol: "NZ$", name: "New Zealand Dollar", rate: 1.64 },
  MXN: { symbol: "MX$", name: "Mexican Peso", rate: 17.15 },
  BRL: { symbol: "R$", name: "Brazilian Real", rate: 4.97 },
  ZAR: { symbol: "R", name: "South African Rand", rate: 18.65 },
  RUB: { symbol: "₽", name: "Russian Ruble", rate: 92.5 },
  TRY: { symbol: "₺", name: "Turkish Lira", rate: 29.2 },
  PLN: { symbol: "zł", name: "Polish Zloty", rate: 3.98 },
  THB: { symbol: "฿", name: "Thai Baht", rate: 35.2 },
  IDR: { symbol: "Rp", name: "Indonesian Rupiah", rate: 15650 },
  MYR: { symbol: "RM", name: "Malaysian Ringgit", rate: 4.72 },
  PHP: { symbol: "₱", name: "Philippine Peso", rate: 55.8 },
  VND: { symbol: "₫", name: "Vietnamese Dong", rate: 24500 },
  TWD: { symbol: "NT$", name: "Taiwan Dollar", rate: 31.5 },
  AED: { symbol: "د.إ", name: "UAE Dirham", rate: 3.67 },
  SAR: { symbol: "﷼", name: "Saudi Riyal", rate: 3.75 },
  ILS: { symbol: "₪", name: "Israeli Shekel", rate: 3.68 },
};

// tailwind colors for developer dark mode (mapped to CSS variables for dynamic themes)
const colors = [
  { id: "cyan", bg: "var(--border-color)", accent: "var(--color-cyan)" },
  { id: "orange", bg: "var(--border-color)", accent: "var(--color-orange)" },
  { id: "purple", bg: "var(--border-color)", accent: "var(--color-purple)" },
  { id: "pink", bg: "var(--border-color)", accent: "var(--color-pink)" },
  { id: "rose", bg: "var(--border-color)", accent: "var(--color-rose)" },
  { id: "green", bg: "var(--border-color)", accent: "var(--color-green)" },
  { id: "yellow", bg: "var(--border-color)", accent: "var(--color-orange)" },
  { id: "blue", bg: "var(--border-color)", accent: "var(--color-cyan)" },
  { id: "indigo", bg: "var(--border-color)", accent: "var(--color-purple)" },
  { id: "slate", bg: "var(--border-color)", accent: "var(--text-muted)" },
];

const randColor = () => colors[Math.floor(Math.random() * colors.length)];

function getColor(colorId) {
  const found = colors.find(c => c.id === colorId);
  return found ? found : randColor();
}

const categoryColors = {
  "Infrastructure": "cyan",
  "AI / API": "orange",
  "Dev Tools": "purple",
  "Collaboration": "pink",
  "Security / Ops": "rose",
  "Marketing / Sales": "green"
};

function getSubColor(sub) {
  if (sub.color) {
    return getColor(sub.color);
  }
  const colorId = categoryColors[sub.category] || "slate";
  return getColor(colorId);
}

const currencyLocales = {
  USD: "en-US", EUR: "de-DE", GBP: "en-GB", JPY: "ja-JP", CNY: "zh-CN",
  KRW: "ko-KR", INR: "en-IN", CAD: "en-CA", AUD: "en-AU", CHF: "de-CH",
  HKD: "zh-HK", SGD: "en-SG", SEK: "sv-SE", NOK: "nb-NO", DKK: "da-DK",
  NZD: "en-NZ", MXN: "es-MX", BRL: "pt-BR", ZAR: "en-ZA", RUB: "ru-RU",
  TRY: "tr-TR", PLN: "pl-PL", THB: "th-TH", IDR: "id-ID", MYR: "ms-MY",
  PHP: "en-PH", VND: "vi-VN", TWD: "zh-TW", AED: "ar-AE", SAR: "ar-SA",
  ILS: "he-IL"
};

function convertToBase(amount, fromCurrency) {
  const from = currencies[fromCurrency] || currencies.USD;
  const to = currencies[selectedCurrency];
  const usdAmount = amount / from.rate;
  return usdAmount * to.rate;
}

function formatNum(amount, decimals, currencyCode) {
  const locale = currencyLocales[currencyCode] || "en-US";
  return amount.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatCurrency(baseAmount, decimals = 2) {
  const curr = currencies[selectedCurrency];
  const dec = curr.rate > 100 ? 0 : decimals;
  return curr.symbol + formatNum(baseAmount, dec, selectedCurrency);
}

function formatCurrencyShort(baseAmount) {
  const curr = currencies[selectedCurrency];
  if (baseAmount >= 1_000_000) return curr.symbol + (baseAmount / 1_000_000).toFixed(1) + "M";
  if (baseAmount >= 10_000) return curr.symbol + (baseAmount / 1_000).toFixed(0) + "k";
  if (curr.rate > 100) return curr.symbol + formatNum(Math.round(baseAmount), 0, selectedCurrency);
  return curr.symbol + formatNum(baseAmount, 0, selectedCurrency);
}

function formatOriginalPrice(sub) {
  const code = sub.currency || selectedCurrency || "USD";
  const curr = currencies[code] || currencies.USD;
  const dec = curr.rate > 100 ? 0 : 2;
  return curr.symbol + formatNum(sub.price, dec, code);
}

function toMonthly(sub) {
  const subCurrency = sub.currency || selectedCurrency || "USD";
  let monthly = sub.price;
  
  if (sub.cycle === "Yearly") monthly = sub.price / 12;
  if (sub.cycle === "Weekly") monthly = sub.price * 4.33;

  // Apply Team scaling slider if seat-based
  if (sub.isSeatBased) {
    monthly = monthly * (1 + teamScale);
  }

  // Apply API/Infra surge simulator
  if (sub.category === "AI / API" || sub.category === "Infrastructure") {
    monthly = monthly * surgeScale;
  }

  return convertToBase(monthly, subCurrency);
}

function toMonthlyUnscaled(sub) {
  const subCurrency = sub.currency || selectedCurrency || "USD";
  let monthly = sub.price;
  
  if (sub.cycle === "Yearly") monthly = sub.price / 12;
  if (sub.cycle === "Weekly") monthly = sub.price * 4.33;

  return convertToBase(monthly, subCurrency);
}

function iconHtml(sub, className) {
  if (!sub.url) {
    return '<span class="iconify ' + className + ' text-slate-600 shrink-0" data-icon="ph:cube-bold"></span>';
  }

  const domain = sub.url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  const logoUrl = "https://img.logo.dev/" + domain + "?token=pk_KuI_oR-IQ1-fqpAfz3FPEw&size=100&retina=true&format=png";
  return '<img src="' + logoUrl + '" class="' + className + ' object-contain rounded-lg shrink-0" crossorigin="anonymous" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'inline-block\';"><span class="iconify ' + className + ' text-slate-600 shrink-0 hidden" data-icon="ph:cube-bold"></span>';
}

// Sliders and Inputs Management
function updateStartingCash(value) {
  const parsed = parseFloat(value);
  startingCash = isNaN(parsed) || parsed < 0 ? 0 : parsed;
  const cashDisplay = document.getElementById("cash-display");
  if (cashDisplay) cashDisplay.innerText = formatCurrency(startingCash, 0);
  recalculateAnalytics();
}

function updateCashInjections(value) {
  const parsed = parseFloat(value);
  cashInjections = isNaN(parsed) || parsed < 0 ? 0 : parsed;
  recalculateAnalytics();
}

function updateTeamScale(value) {
  teamScale = parseInt(value);
  const teamVal = document.getElementById("team-value");
  if (teamVal) teamVal.innerText = "+" + teamScale + " seat" + (teamScale === 1 ? "" : "s");
  recalculateAnalytics();
  renderActiveView();
}

function updateProjectedHires(value) {
  projectedHires = parseInt(value) || 0;
  const display = document.getElementById("hires-value");
  if (display) display.innerText = "+" + projectedHires;
  recalculateAnalytics();
}

function updateAverageSalary(value) {
  const parsed = parseFloat(value);
  averageSalary = isNaN(parsed) || parsed < 0 ? 0 : parsed;
  recalculateAnalytics();
}

function updateSurgeScale(value) {
  surgeScale = parseFloat(value);
  const surgeVal = document.getElementById("surge-value");
  if (surgeVal) surgeVal.innerText = surgeScale.toFixed(1) + "x" + (surgeScale === 1.0 ? " (Normal)" : " (Surge)");
  recalculateAnalytics();
  renderActiveView();
}

function calculateHealthScore() {
  const totalCash = startingCash + cashInjections;
  let activeSaaS = 0;
  subs.forEach(s => {
    activeSaaS += toMonthly(s);
  });
  const payrollBurn = projectedHires * averageSalary;
  const totalBurn = activeSaaS + payrollBurn;
  const activeRunway = totalBurn > 0 ? (totalCash / totalBurn) : Infinity;

  // 1. Runway Component (Max 35 points)
  let runwayScore = 0;
  if (activeRunway === Infinity || totalBurn === 0) {
    runwayScore = 35;
  } else if (activeRunway >= 18) {
    runwayScore = 35;
  } else if (activeRunway >= 12) {
    runwayScore = 28;
  } else if (activeRunway >= 6) {
    runwayScore = 18;
  } else if (activeRunway >= 3) {
    runwayScore = 8;
  } else {
    runwayScore = 0;
  }

  // 2. Vendor Concentration (Max 20 points)
  let concentrationScore = 20;
  let highestCost = 0;
  let highestSub = null;
  subs.forEach(s => {
    const cost = toMonthly(s);
    if (cost > highestCost) {
      highestCost = cost;
      highestSub = s;
    }
  });
  if (activeSaaS > 0) {
    const maxPct = highestCost / activeSaaS;
    if (maxPct > 0.50) {
      concentrationScore = 5;
    } else if (maxPct > 0.35) {
      concentrationScore = 10;
    } else if (maxPct > 0.20) {
      concentrationScore = 15;
    } else {
      concentrationScore = 20;
    }
  }

  // 3. Renewal Clustering Risk (Max 15 points)
  let renewalClusteringScore = 15;
  let renewalsNext7Days = 0;
  subs.forEach(sub => {
    if (typeof getDaysUntilRenewal === "function") {
      const renewal = getDaysUntilRenewal(sub);
      if (renewal && renewal.days >= 0 && renewal.days <= 7) {
        renewalsNext7Days++;
      }
    }
  });
  if (renewalsNext7Days >= 3) {
    renewalClusteringScore = 5;
  } else if (renewalsNext7Days === 2) {
    renewalClusteringScore = 9;
  } else if (renewalsNext7Days === 1) {
    renewalClusteringScore = 12;
  } else {
    renewalClusteringScore = 15;
  }

  // 4. Department Budget Governance (Max 15 points)
  let departmentScore = 15;
  let overBudgetCount = 0;
  const deptCosts = {};
  subs.forEach(sub => {
    const cost = toMonthly(sub);
    const dept = sub.department || "Operations";
    deptCosts[dept] = (deptCosts[dept] || 0) + cost;
  });
  
  if (typeof deptBudgets !== "undefined") {
    for (const dept in deptBudgets) {
      const limit = deptBudgets[dept] || 0;
      const spent = deptCosts[dept] || 0;
      if (spent > limit) {
        overBudgetCount++;
      }
    }
  }
  if (overBudgetCount >= 3) {
    departmentScore = 3;
  } else if (overBudgetCount === 2) {
    departmentScore = 7;
  } else if (overBudgetCount === 1) {
    departmentScore = 11;
  } else {
    departmentScore = 15;
  }

  // 5. Growth Assumptions & Capital Buffer (Max 15 points)
  let growthScore = 15;
  if (totalBurn > 0) {
    const bufferMonths = totalCash / totalBurn;
    if (bufferMonths < 3) {
      growthScore = 3;
    } else if (bufferMonths < 6) {
      growthScore = 7;
    } else if (bufferMonths < 12) {
      growthScore = 11;
    } else {
      growthScore = 15;
    }
  }
  // Subtract points if we have aggressive hires but low cash buffer
  if (projectedHires >= 3 && totalCash < 30000) {
    growthScore = Math.max(0, growthScore - 5);
  }

  const score = runwayScore + concentrationScore + renewalClusteringScore + departmentScore + growthScore;

  return {
    score: Math.min(100, Math.max(0, score)),
    runwayScore,
    concentrationScore,
    renewalClusteringScore,
    departmentScore,
    growthScore,
    renewalsNext7Days,
    overBudgetCount,
    highestSub,
    highestCost
  };
}

function recalculateAnalytics() {
  let scaledSaaS = 0;
  let baseSaaS = 0;

  for (let i = 0; i < subs.length; i++) {
    scaledSaaS += toMonthly(subs[i]);
    baseSaaS += toMonthlyUnscaled(subs[i]);
  }

  const payrollBurn = projectedHires * averageSalary;
  const totalBurn = scaledSaaS + payrollBurn;
  const baseBurn = baseSaaS;

  // Monthly Burn (Animated)
  const totalBurnEl = document.getElementById("step-2-total");
  animateValue(totalBurnEl, lastTotalBurn, totalBurn, 350, (val) => formatCurrency(val));
  lastTotalBurn = totalBurn;

  const baseBurnEl = document.getElementById("base-burn-subtext");
  animateValue(baseBurnEl, lastBaseBurn, baseBurn, 350, (val) => "Base SaaS: " + formatCurrency(val) + "/mo");
  lastBaseBurn = baseBurn;

  // Runway (Animated)
  const runwayEl = document.getElementById("runway-display");
  const totalCash = startingCash + cashInjections;
  let activeRunway = 0;
  
  if (totalBurn === 0) {
    if (runwayEl) runwayEl.innerText = "Infinite";
    lastRunway = 0;
    activeRunway = Infinity;
  } else {
    const runwayMonths = totalCash / totalBurn;
    activeRunway = runwayMonths;
    if (runwayMonths >= 120) {
      if (runwayEl) runwayEl.innerText = "Infinite";
      lastRunway = 0;
    } else {
      const startMonths = (lastRunway === 0 || isNaN(lastRunway)) ? 0 : lastRunway;
      animateValue(runwayEl, startMonths, runwayMonths, 350, (val) => val.toFixed(1) + " mo");
      lastRunway = runwayMonths;
    }
  }

  // Cost Concentration Lock-In check (>35% of total burn)
  const riskContainer = document.getElementById("risk-alert-container");
  let highestSub = null;
  let highestCost = 0;

  for (let i = 0; i < subs.length; i++) {
    const cost = toMonthly(subs[i]);
    if (cost > highestCost) {
      highestCost = cost;
      highestSub = subs[i];
    }
  }

  let concPct = 0;
  if (scaledSaaS > 0 && highestSub) {
    concPct = Math.round((highestCost / scaledSaaS) * 100);
  }

  if (scaledSaaS > 0 && highestSub && (highestCost / scaledSaaS) > 0.35) {
    riskContainer.innerHTML = `
      <div class="rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-red-200 flex items-center justify-between text-xs sm:text-sm">
        <div class="flex items-center gap-2">
          <span class="iconify h-5 w-5 text-red-400 shrink-0" data-icon="ph:warning-circle-bold"></span>
          <div>
            <span class="font-extrabold text-red-400">High Vendor Concentration Lock-in:</span> 
            <span class="font-bold text-white">${highestSub.name}</span> accounts for <span class="font-black text-white">${concPct}%</span> of your monthly SaaS burn.
          </div>
        </div>
        <div class="text-[9px] uppercase font-black tracking-wider bg-red-900/30 px-2 py-0.5 rounded border border-red-500/30">Risk Warning</div>
      </div>
    `;
    riskContainer.classList.remove("hidden");
  } else {
    riskContainer.innerHTML = "";
    riskContainer.classList.add("hidden");
  }

  // 1. Calculate Consequence Delta Badges
  // Team Seats Delta
  let tempScaledSaaS_team = 0;
  for (let i = 0; i < subs.length; i++) {
    let monthly = toMonthlyUnscaled(subs[i]);
    if (subs[i].category === "AI / API" || subs[i].category === "Infrastructure") {
      monthly = monthly * surgeScale;
    }
    tempScaledSaaS_team += convertToBase(monthly, subs[i].currency || "USD");
  }
  let tempTotalBurn_team = tempScaledSaaS_team + payrollBurn;
  let tempRunway_team = tempTotalBurn_team > 0 ? totalCash / tempTotalBurn_team : Infinity;
  let teamRunwayDelta = activeRunway - tempRunway_team;
  let teamBurnDelta = scaledSaaS - tempScaledSaaS_team;
  showConsequenceBadge("team-consequence", teamRunwayDelta, teamBurnDelta);

  // Surge Delta
  let tempScaledSaaS_surge = 0;
  for (let i = 0; i < subs.length; i++) {
    let monthly = toMonthlyUnscaled(subs[i]);
    if (subs[i].isSeatBased) {
      monthly = monthly * (1 + teamScale);
    }
    tempScaledSaaS_surge += convertToBase(monthly, subs[i].currency || "USD");
  }
  let tempTotalBurn_surge = tempScaledSaaS_surge + payrollBurn;
  let tempRunway_surge = tempTotalBurn_surge > 0 ? totalCash / tempTotalBurn_surge : Infinity;
  let surgeRunwayDelta = activeRunway - tempRunway_surge;
  let surgeBurnDelta = scaledSaaS - tempScaledSaaS_surge;
  showConsequenceBadge("surge-consequence", surgeRunwayDelta, surgeBurnDelta);

  // Hiring Delta
  let tempTotalBurn_hiring = scaledSaaS;
  let tempRunway_hiring = tempTotalBurn_hiring > 0 ? totalCash / tempTotalBurn_hiring : Infinity;
  let hiringRunwayDelta = activeRunway - tempRunway_hiring;
  let hiringBurnDelta = payrollBurn;
  showConsequenceBadge("hiring-consequence", hiringRunwayDelta, hiringBurnDelta);

  // Cash Injections Delta
  let tempRunway_inject = totalBurn > 0 ? startingCash / totalBurn : Infinity;
  let injectRunwayDelta = activeRunway - tempRunway_inject;
  showConsequenceBadge("injection-consequence", injectRunwayDelta, cashInjections);

  // 2. Calculate Financial Health Score (0-100)
  const health = calculateHealthScore();
  const healthVal = health.score;

  // Update Health scorecard UI
  const riskDisplay = document.getElementById("risk-score-display");
  const riskSubtext = document.getElementById("risk-score-subtext");
  if (riskDisplay && riskSubtext) {
    riskDisplay.innerText = `${healthVal}/100`;
    
    if (healthVal >= 80) {
      riskSubtext.innerText = "Optimal";
      riskDisplay.className = "text-xl sm:text-2xl font-black text-emerald-400 mt-2 truncate font-mono";
      riskSubtext.className = "text-[10px] text-emerald-400/80 mt-1 font-bold";
    } else if (healthVal >= 60) {
      riskSubtext.innerText = "Moderate";
      riskDisplay.className = "text-xl sm:text-2xl font-black text-yellow-400 mt-2 truncate font-mono";
      riskSubtext.className = "text-[10px] text-yellow-400/80 mt-1 font-bold";
    } else if (healthVal >= 40) {
      riskSubtext.innerText = "Warning";
      riskDisplay.className = "text-xl sm:text-2xl font-black text-amber-500 mt-2 truncate font-mono";
      riskSubtext.className = "text-[10px] text-amber-500/80 mt-1 font-bold";
    } else {
      riskSubtext.innerText = "High Alert";
      riskDisplay.className = "text-xl sm:text-2xl font-black text-red-500 mt-2 truncate font-mono animate-pulse";
      riskSubtext.className = "text-[10px] text-red-500/80 mt-1 font-bold";
    }
  }

  // 3. Top 3 Cost Drivers list rendering
  const driversDisplay = document.getElementById("top-drivers-display");
  const driversSubtext = document.getElementById("top-drivers-subtext");
  if (driversDisplay && driversSubtext) {
    const sortedSubs = [...subs].sort((a, b) => toMonthly(b) - toMonthly(a));
    const drivers = sortedSubs.slice(0, 3);
    
    if (drivers.length > 0) {
      let driversHtml = "";
      drivers.forEach((d, idx) => {
        const cost = toMonthly(d);
        driversHtml += `<div class="truncate">${idx + 1}. ${d.name} (${formatCurrencyShort(cost)}/mo)</div>`;
      });
      driversDisplay.innerHTML = driversHtml;
    } else {
      driversDisplay.innerText = "No active costs";
    }
    driversSubtext.innerText = "ARR: " + formatCurrency(totalBurn * 12, 0);
  }

  // 4. Claude Monospace Analyst Math Traces
  document.querySelectorAll(".math-trace").forEach(e => e.remove());
  if (currentTheme === "claude") {
    const card1 = document.getElementById("step-2-total")?.parentElement;
    const card2 = document.getElementById("runway-display")?.parentElement;
    const card3 = document.getElementById("risk-score-display")?.parentElement;
    const card4 = document.getElementById("top-drivers-display")?.parentElement;

    if (card1) {
      const t1 = document.createElement("div");
      t1.className = "math-trace";
      t1.innerText = `[Burn = SaaS (${formatCurrency(scaledSaaS, 0)}) + Payroll (${formatCurrency(payrollBurn, 0)}) = ${formatCurrency(totalBurn, 0)}]`;
      card1.appendChild(t1);
    }
    if (card2) {
      const t2 = document.createElement("div");
      t2.className = "math-trace";
      t2.innerText = `[Runway = (Cash ${formatCurrency(startingCash, 0)} + Inj ${formatCurrency(cashInjections, 0)}) / Burn ${formatCurrency(totalBurn, 0)} = ${activeRunway === Infinity ? "Inf" : activeRunway.toFixed(1)} mo]`;
      card2.appendChild(t2);
    }
    if (card3) {
      const t3 = document.createElement("div");
      t3.className = "math-trace";
      t3.innerText = `[Health = RunW (${health.runwayScore}) + Conc (${health.concentrationScore}) + Renew (${health.renewalClusteringScore}) + Dept (${health.departmentScore}) + Growth (${health.growthScore}) = ${healthVal}/100]`;
      card3.appendChild(t3);
    }
    if (card4) {
      const t4 = document.createElement("div");
      t4.className = "math-trace";
      t4.innerText = `[ARR = Burn (${formatCurrency(totalBurn, 0)}) * 12 = ${formatCurrency(totalBurn * 12, 0)}]`;
      card4.appendChild(t4);
    }
  }

  updateUrgentRenewalsWidget();
  updateHubAnalytics();

  if (typeof renderCashFlowChart === "function") renderCashFlowChart();
  if (typeof auditSaaSStack === "function") auditSaaSStack();
  if (currentTheme === "claude" && typeof updateAnalystCommentary === "function") {
    updateAnalystCommentary();
  }
}

function showConsequenceBadge(elementId, runwayDelta, costDelta) {
  const badge = document.getElementById(elementId);
  if (!badge) return;

  if (elementId === "injection-consequence") {
    if (costDelta > 0 && runwayDelta !== Infinity && !isNaN(runwayDelta)) {
      badge.innerText = `+${runwayDelta.toFixed(1)} mo`;
      badge.className = "text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono";
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
    return;
  }

  if (Math.abs(costDelta) < 0.01) {
    badge.classList.add("hidden");
    return;
  }

  badge.classList.remove("hidden");
  if (runwayDelta < 0 && runwayDelta !== -Infinity && !isNaN(runwayDelta)) {
    badge.innerText = `${runwayDelta.toFixed(1)} mo`;
    badge.className = "text-[8px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded font-mono animate-pulse";
  } else if (runwayDelta > 0 && runwayDelta !== Infinity && !isNaN(runwayDelta)) {
    badge.innerText = `+${runwayDelta.toFixed(1)} mo`;
    badge.className = "text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono";
  } else {
    // If runway is infinite or runway change is 0, show cost delta
    if (costDelta > 0) {
      badge.innerText = `+$${Math.round(costDelta)}/mo`;
      badge.className = "text-[8px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded font-mono";
    } else if (costDelta < 0) {
      badge.innerText = `-$${Math.round(Math.abs(costDelta))}/mo`;
      badge.className = "text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono";
    } else {
      badge.classList.add("hidden");
    }
  }
}

function getDaysUntilRenewal(sub) {
  const startDateStr = sub.date || new Date().toISOString().split("T")[0];
  const cycle = sub.cycle || "Monthly";
  
  const start = new Date(startDateStr);
  const today = new Date();
  
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  if (isNaN(start.getTime())) return { days: 999, nextDate: today };
  
  let nextDate = new Date(start);
  
  if (cycle === "Weekly") {
    while (nextDate < today) {
      nextDate.setDate(nextDate.getDate() + 7);
    }
  } else if (cycle === "Monthly") {
    while (nextDate < today) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
  } else if (cycle === "Yearly") {
    while (nextDate < today) {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
  }
  
  const diffTime = nextDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return { days: diffDays, nextDate: nextDate };
}

function updateUrgentRenewalsWidget() {
  const card = document.getElementById("urgent-renewals-card");
  const list = document.getElementById("urgent-renewals-list");
  const msg = document.getElementById("urgent-renewals-msg");
  
  if (!card || !list || !msg) return;

  const urgent = [];
  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i];
    const renewal = getDaysUntilRenewal(sub);
    if (renewal.days <= 1) {
      urgent.push({ sub, renewal });
    }
  }

  if (urgent.length === 0) {
    card.classList.add("hidden");
    return;
  }

  card.classList.remove("hidden");
  msg.innerHTML = `You have <span class="font-black text-amber-400">${urgent.length}</span> SaaS subscription${urgent.length > 1 ? 's' : ''} that need immediate attention.`;

  let html = "";
  for (let i = 0; i < urgent.length; i++) {
    const item = urgent[i];
    const daysText = item.renewal.days === 0 ? "Today" : "Tomorrow";
    const daysColor = item.renewal.days === 0 ? "text-red-500 animate-pulse font-black" : "text-amber-500 font-bold";
    
    html += `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/30 border border-white/5 text-xs">
        <div class="flex items-center gap-2 min-w-0">
          ${iconHtml(item.sub, "h-6 w-6")}
          <div class="min-w-0">
            <div class="font-bold text-slate-200 truncate">${item.sub.name}</div>
            <div class="text-[9px] text-slate-500">${item.sub.category} · <span class="${daysColor}">${daysText}</span></div>
          </div>
        </div>
        <div class="text-right shrink-0">
          <div class="font-black text-slate-200">${formatCurrencyShort(toMonthly(item.sub))}</div>
        </div>
      </div>
    `;
  }
  
  list.innerHTML = html;
}

function loadStack(stackKey) {
  const stack = stacks[stackKey];
  if (!stack) return;

  if (subs.length > 0) {
    const replace = confirm("Load stack '" + stack.name + "'? This will replace your current active SaaS items.");
    if (!replace) return;
  }

  // Reset sliders to normal configuration on stack load
  document.getElementById("team-slider").value = 0;
  teamScale = 0;
  document.getElementById("team-value").innerText = "+0 employees";

  document.getElementById("surge-slider").value = 1.0;
  surgeScale = 1.0;
  document.getElementById("surge-value").innerText = "1.0x (Normal)";

  subs = stack.subscriptions.map((s, idx) => ({
    id: Date.now().toString() + idx + Math.random().toString(36).slice(2),
    name: s.name,
    price: s.price,
    isSeatBased: !!s.isSeatBased,
    currency: s.currency || "USD",
    cycle: s.cycle || "Monthly",
    url: s.domain,
    color: s.color,
    category: s.category,
    date: s.date || new Date(Date.now() + idx * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // stagger date for demo stack
    owner: s.owner || (idx % 2 === 0 ? "CTO / Vu Nguyen" : "CEO / Sarah"),
    funding: s.funding || (idx % 3 === 0 ? "Brex Corporate Card" : "Silicon Valley Bank")
  }));

  save();
  showToast("Loaded stack: " + stack.name, "success");
}

function setView(view) {
  currentView = view;

  // Update button active states
  const views = ["treemap", "circlepack", "beeswarm"];
  views.forEach(v => {
    const btn = document.getElementById("view-" + v);
    if (btn) {
      if (v === view) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
  });

  // Toggle visualizer blocks
  const treemapContainer = document.getElementById("bento-grid");
  const beeswarmContainer = document.getElementById("beeswarm-container");
  const circlepackContainer = document.getElementById("circlepack-container");

  treemapContainer.classList.add("hidden");
  beeswarmContainer.classList.add("hidden");
  circlepackContainer.classList.add("hidden");

  treemapContainer.classList.remove("chart-fade");
  beeswarmContainer.classList.remove("chart-fade");
  circlepackContainer.classList.remove("chart-fade");

  if (view === "treemap") {
    treemapContainer.classList.remove("hidden");
    treemapContainer.classList.add("chart-fade");
  } else if (view === "beeswarm") {
    beeswarmContainer.classList.remove("hidden");
    beeswarmContainer.classList.add("chart-fade");
  } else if (view === "circlepack") {
    circlepackContainer.classList.remove("hidden");
    circlepackContainer.classList.add("chart-fade");
  }

  renderActiveView();
}

function renderActiveView() {
  if (currentView === "treemap") {
    renderGrid();
  } else if (currentView === "beeswarm") {
    renderBeeswarm();
  } else if (currentView === "circlepack") {
    renderCirclePack();
  }
}

function renderList() {
  const listContainer = document.getElementById("sub-list-container");
  if (!listContainer) return;

  if (subs.length === 0) {
    listContainer.innerHTML = `
      <div class="text-center py-6 text-slate-500 text-xs">
        No active SaaS items. Click templates or Add Item.
      </div>
    `;
    recalculateAnalytics();
    renderActiveView();
    return;
  }

  let html = "";
  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i];
    const color = getSubColor(sub);
    const seatIndicator = sub.isSeatBased ? '<span class="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded ml-1.5">Seat</span>' : '';
    const delay = i * 40; // 40ms stagger delay

    // Calculate renewal days
    const renewal = getDaysUntilRenewal(sub);
    let renewalPill = '';
    if (renewal.days === 0) {
      renewalPill = '<span class="text-[9px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded animate-pulse">RENEWS TODAY</span>';
    } else if (renewal.days === 1) {
      renewalPill = '<span class="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">Renews tomorrow</span>';
    } else if (renewal.days <= 3) {
      renewalPill = '<span class="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Renews in ' + renewal.days + 'd</span>';
    } else {
      renewalPill = '<span class="text-[9px] font-semibold text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded">In ' + renewal.days + 'd</span>';
    }

    const ownerText = sub.owner ? `<span class="opacity-75 font-semibold inline-flex items-center gap-0.5"><span class="iconify" data-icon="ph:user-bold" style="display:inline-block; width:12px; height:12px; margin-right: 2px;"></span>${sub.owner}</span>` : '';
    const fundingText = sub.funding ? `<span class="opacity-75 font-semibold inline-flex items-center gap-0.5"><span class="iconify" data-icon="ph:credit-card-bold" style="display:inline-block; width:12px; height:12px; margin-right: 2px;"></span>${sub.funding}</span>` : '';
    const metaSpacer = (ownerText && fundingText) ? ' · ' : '';

    html += '<div class="sub-item-fade flex items-center justify-between p-3 bg-slate-950/20 border border-white/5 border-l-2 rounded-xl hover:border-white/10 hover:translate-x-1 transition-all duration-200" style="border-left-color: ' + color.accent + '; animation-delay: ' + delay + 'ms">';
    html += '<div class="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer" onclick="editSub(\'' + sub.id + '\')">';
    html += iconHtml(sub, "w-8 h-8");
    html += '<div class="min-w-0 flex-1">';
    html += '<div class="font-bold text-sm text-slate-200 truncate flex items-center justify-between pr-2">';
    html += '<span>' + sub.name + seatIndicator + '</span>';
    html += renewalPill;
    html += '</div>';
    html += '<div class="text-[10px] text-slate-500 flex justify-between pr-2 mt-0.5">';
    html += '<span>' + formatOriginalPrice(sub) + ' · ' + sub.category + '</span>';
    html += '</div>';
    if (ownerText || fundingText) {
      html += '<div class="text-[9px] text-slate-500 mt-1.5 flex items-center gap-1.5 truncate">';
      html += ownerText + metaSpacer + fundingText;
      html += '</div>';
    }
    html += '</div></div>';
    if (typeof currentRole !== 'undefined' && currentRole !== 'ceo') {
      html += '<div class="flex items-center gap-1">';
      html += '<button onclick="editSub(\'' + sub.id + '\')" class="text-slate-500 hover:text-purple-400 p-1.5 transition-colors"><span class="iconify" data-icon="ph:pencil-simple-bold"></span></button>';
      html += '<button onclick="removeSub(\'' + sub.id + '\')" class="text-slate-500 hover:text-red-400 p-1.5 transition-colors"><span class="iconify" data-icon="ph:trash-bold"></span></button>';
      html += '</div>';
    }
    html += '</div>';
  }

  listContainer.innerHTML = html;
  recalculateAnalytics();
  renderActiveView();
}

function renderPresets() {
  const grid = document.getElementById("presets-grid");
  if (!grid) return;

  const popular = presets.filter(p => p.popular);

  let html = "";
  for (let i = 0; i < popular.length; i++) {
    const preset = popular[i];
    const presetIndex = presets.indexOf(preset);
    const logo = "https://img.logo.dev/" + preset.domain + "?token=pk_KuI_oR-IQ1-fqpAfz3FPEw&size=100&retina=true&format=png";

    html += '<button onclick="openModalWithPreset(' + presetIndex + ')" ';
    html += 'class="flex flex-col items-center gap-1 rounded-xl border border-white/5 bg-slate-900/40 p-2 hover:bg-slate-900 transition-colors active:scale-95">';
    html += '<img src="' + logo + '" class="h-6 w-6 rounded object-contain" crossorigin="anonymous" alt="' + preset.name + '" onerror="this.src=\'\'">';
    html += '<span class="text-[9px] font-bold text-slate-400 truncate w-full text-center">' + preset.name + '</span>';
    html += '</button>';
  }
  grid.innerHTML = html;
}

function removeSub(subId) {
  const sub = subs.find(s => s.id === subId);
  const name = sub ? sub.name : "SaaS item";
  subs = subs.filter(s => s.id !== subId);
  save();
  showToast("Removed " + name, "info");
}

function clearAllSubs() {
  if (!confirm("Are you sure you want to clear your current dashboard?")) return;
  subs = [];
  save();
  showToast("Dashboard reset successfully", "warning");
}

function editSub(subId) {
  const sub = subs.find(s => s.id === subId);
  if (!sub) return;

  document.getElementById("entry-id").value = sub.id;
  document.getElementById("name").value = sub.name;
  document.getElementById("price").value = sub.price;
  document.getElementById("sub-currency").value = sub.currency || selectedCurrency;
  document.getElementById("category").value = sub.category || "Infrastructure";
  document.getElementById("is-seat-based").checked = !!sub.isSeatBased;
  document.getElementById("url").value = sub.url || "";
  document.getElementById("cycle").value = sub.cycle || "Monthly";
  document.getElementById("date").value = sub.date ? sub.date.split("T")[0] : new Date().toISOString().split("T")[0];
  document.getElementById("owner").value = sub.owner || "";
  document.getElementById("department").value = sub.department || "Engineering";
  document.getElementById("funding").value = sub.funding || "";

  updateFavicon(sub.url || "");
  pickColor(sub.color || randColor().id);

  document.getElementById("modal-title").innerText = "Edit SaaS Expense";
  document.querySelector("#sub-form button[type='submit']").innerText = "Save Changes";

  showModal();
}

function initColorPicker() {
  const container = document.getElementById("color-selector");
  let html = "";
  for (const color of colors) {
    html += '<div onclick="pickColor(\'' + color.id + '\')" ';
    html += 'class="color-option cursor-pointer rounded-lg h-8 border border-white/5 transition-transform hover:scale-105" ';
    html += 'data-val="' + color.id + '" ';
    html += 'style="background:' + color.accent + '"></div>';
  }
  container.innerHTML = html;
}

function pickColor(colorId) {
  document.getElementById("selected-color").value = colorId;

  const options = document.querySelectorAll(".color-option");
  for (const opt of options) {
    if (opt.dataset.val === colorId) {
      opt.classList.add("ring-2", "ring-purple-500", "ring-offset-2", "ring-offset-slate-900");
    } else {
      opt.classList.remove("ring-2", "ring-purple-500", "ring-offset-2", "ring-offset-slate-900");
    }
  }
}

let faviconDebounce = null;

function updateFavicon(urlInput) {
  clearTimeout(faviconDebounce);

  faviconDebounce = setTimeout(function() {
    const preview = document.getElementById("favicon-preview");

    if (!urlInput) {
      preview.innerHTML = '<span class="iconify text-slate-600 w-5 h-5" data-icon="ph:globe-simple"></span>';
      return;
    }

    const domain = urlInput.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

    if (domain.length > 3) {
      const logoUrl = "https://img.logo.dev/" + domain + "?token=pk_KuI_oR-IQ1-fqpAfz3FPEw&size=100&retina=true&format=png";
      preview.innerHTML = '<img src="' + logoUrl + '" class="w-full h-full object-cover" crossorigin="anonymous" onerror="this.parentElement.innerHTML=\'<span class=\\\x27iconify text-slate-600 w-5 h-5\\\x27 data-icon=\\\x27ph:globe-simple\\\x27></span>\';">';
    }
  }, 400);
}

function initCurrencySelector() {
  const dropdown = document.getElementById("currency-selector");
  if (!dropdown) return;

  let html = "";
  const currencyCodes = Object.keys(currencies);

  for (let i = 0; i < currencyCodes.length; i++) {
    const code = currencyCodes[i];
    const curr = currencies[code];
    const selected = (code === selectedCurrency) ? " selected" : "";
    html += '<option value="' + code + '"' + selected + '>' + curr.symbol + ' ' + code + ' - ' + curr.name + '</option>';
  }

  dropdown.innerHTML = html;
  dropdown.addEventListener("change", function(e) {
    saveCurrency(e.target.value);
  });
}

function initFormCurrencySelector() {
  const dropdown = document.getElementById("sub-currency");
  if (!dropdown) return;

  let html = "";
  const currencyCodes = Object.keys(currencies);

  for (let i = 0; i < currencyCodes.length; i++) {
    const code = currencyCodes[i];
    const curr = currencies[code];
    html += '<option value="' + code + '">' + curr.symbol + ' ' + code + '</option>';
  }

  dropdown.innerHTML = html;
  dropdown.value = selectedCurrency;
}

function handleFormSubmit(evt) {
  evt.preventDefault();

  const existingId = document.getElementById("entry-id").value;
  const name = document.getElementById("name").value;

  const subData = {
    id: existingId || Date.now().toString(),
    name: name,
    price: parseFloat(document.getElementById("price").value),
    isSeatBased: document.getElementById("is-seat-based").checked,
    currency: document.getElementById("sub-currency").value,
    cycle: document.getElementById("cycle").value || "Monthly",
    url: document.getElementById("url").value,
    color: document.getElementById("selected-color").value || randColor().id,
    category: document.getElementById("category").value,
    date: document.getElementById("date").value || new Date().toISOString().split("T")[0],
    owner: document.getElementById("owner").value || "",
    department: document.getElementById("department").value || "Engineering",
    funding: document.getElementById("funding").value || ""
  };

  if (existingId) {
    const index = subs.findIndex(s => s.id === existingId);
    if (index !== -1) {
      subs[index] = subData;
    }
    showToast(`Updated expense: ${name}`, "success");
  } else {
    subs.push(subData);
    showToast(`Added expense: ${name}`, "success");
  }

  save();
  hideModal();
}

function saveCurrency(code) {
  selectedCurrency = code;
  localStorage.setItem(CURRENCY_KEY, code);
  
  // Update UI indicators
  const indicator = document.getElementById("active-currency-indicator");
  if (indicator) {
    const curr = currencies[code];
    indicator.innerText = code + " (" + curr.symbol + ")";
  }

  renderList();
  renderActiveView();
}

// Theme Mode Switcher Management
function toggleThemeMenu() {
  const menu = document.getElementById("theme-menu");
  if (!menu) return;
  menu.classList.toggle("hidden");
}

let currentTheme = "dark";

function setTheme(theme) {
  currentTheme = theme;
  const html = document.documentElement;
  
  html.classList.remove("theme-dark", "theme-light", "theme-claude");
  
  const label = document.getElementById("current-theme-label");
  const commentaryCard = document.getElementById("analyst-commentary-card");
  
  if (theme === "dark") {
    html.classList.add("theme-dark");
    if (label) label.innerText = "Obsidian";
    if (commentaryCard) commentaryCard.classList.add("hidden");
  } else if (theme === "light") {
    html.classList.add("theme-light");
    if (label) label.innerText = "Alabaster";
    if (commentaryCard) commentaryCard.classList.add("hidden");
  } else if (theme === "claude") {
    html.classList.add("theme-claude");
    if (label) label.innerText = "Analyst Mode";
    if (commentaryCard) {
      commentaryCard.classList.remove("hidden");
      updateAnalystCommentary();
    }
  }
  
  localStorage.setItem("runwaymap_theme", theme);
  
  // Close menu
  const menu = document.getElementById("theme-menu");
  if (menu) menu.classList.add("hidden");
  
  // Re-render views to update color mappings if necessary
  renderList();
  renderActiveView();
}

function loadTheme() {
  const saved = localStorage.getItem("runwaymap_theme") || "dark";
  setTheme(saved);
}

// Close theme menu if clicked outside
document.addEventListener("click", (e) => {
  const btn = document.getElementById("theme-btn");
  const menu = document.getElementById("theme-menu");
  if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.add("hidden");
  }
});

// Operations & Analytics Hub Logic
let hubBudget = 1000;
let calendarDate = new Date(2026, 5, 9); // June 9, 2026
let simChannel = "email";

function setHubTab(tab) {
  const tabs = ["analytics", "calendar", "alerts", "departments"];
  tabs.forEach(t => {
    const btn = document.getElementById("tab-btn-" + t);
    const content = document.getElementById("hub-content-" + t);
    if (btn) {
      if (t === tab) {
        btn.classList.add("bg-purple-600", "text-white");
        btn.classList.remove("text-slate-400", "hover:text-slate-200");
      } else {
        btn.classList.remove("bg-purple-600", "text-white");
        btn.classList.add("text-slate-400", "hover:text-slate-200");
      }
    }
    if (content) {
      if (t === tab) {
        content.classList.remove("hidden");
      } else {
        content.classList.add("hidden");
      }
    }
  });

  if (tab === "calendar") {
    renderCalendar();
  } else if (tab === "alerts") {
    renderAlertSim();
  } else if (tab === "departments") {
    updateHubAnalytics();
  }
}

function updateHubBudget(value) {
  hubBudget = parseFloat(value);
  const valEl = document.getElementById("hub-budget-value");
  if (valEl) {
    valEl.innerText = formatCurrency(hubBudget, 0);
  }
  updateHubAnalytics();
}

function isSubRenewingOnDate(sub, checkDate) {
  const startDateStr = sub.date;
  if (!startDateStr) return false;
  
  const start = new Date(startDateStr);
  start.setHours(0, 0, 0, 0);
  
  const check = new Date(checkDate);
  check.setHours(0, 0, 0, 0);
  
  if (isNaN(start.getTime())) return false;
  if (start > check) return false;
  
  const cycle = sub.cycle || "Monthly";
  
  if (cycle === "Weekly") {
    const diffTime = check - start;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays % 7 === 0;
  }
  
  if (cycle === "Monthly") {
    const startDay = start.getDate();
    const checkDay = check.getDate();
    
    if (startDay === checkDay) return true;
    
    const lastDayOfCheckMonth = new Date(check.getFullYear(), check.getMonth() + 1, 0).getDate();
    if (startDay > lastDayOfCheckMonth && checkDay === lastDayOfCheckMonth) return true;
    
    return false;
  }
  
  if (cycle === "Yearly") {
    const startDay = start.getDate();
    const startMonth = start.getMonth();
    const checkDay = check.getDate();
    const checkMonth = check.getMonth();
    
    if (startDay === checkDay && startMonth === checkMonth) return true;
    
    const lastDayOfCheckMonth = new Date(check.getFullYear(), check.getMonth() + 1, 0).getDate();
    if (startMonth === checkMonth && startDay > lastDayOfCheckMonth && checkDay === lastDayOfCheckMonth) return true;
    
    return false;
  }
  
  return false;
}

function updateHubAnalytics() {
  let totalBurn = 0;
  const catSums = {};
  const deptSums = {};
  
  const categoriesList = ["Infrastructure", "AI / API", "Dev Tools", "Collaboration", "Security / Ops", "Marketing / Sales"];
  categoriesList.forEach(c => catSums[c] = 0);
  
  const departmentsList = ["Engineering", "Product", "Marketing", "Sales", "Ops"];
  departmentsList.forEach(d => deptSums[d] = 0);
  
  subs.forEach(sub => {
    const cost = toMonthly(sub);
    totalBurn += cost;
    
    const cat = sub.category || "Other";
    catSums[cat] = (catSums[cat] || 0) + cost;
    
    const dept = sub.department || "Engineering";
    deptSums[dept] = (deptSums[dept] || 0) + cost;
  });

  // 1. Budget UI
  const progressEl = document.getElementById("hub-budget-progress");
  const spentEl = document.getElementById("hub-budget-spent");
  const warningEl = document.getElementById("hub-budget-warning");
  
  if (spentEl) {
    spentEl.innerText = formatCurrency(totalBurn) + " used";
  }
  
  if (progressEl) {
    const pct = hubBudget > 0 ? Math.min((totalBurn / hubBudget) * 100, 100) : 100;
    progressEl.style.width = pct + "%";
    
    if (pct >= 90) {
      progressEl.className = "bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-300";
    } else if (pct >= 70) {
      progressEl.className = "bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-300";
    } else {
      progressEl.className = "bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full transition-all duration-300";
    }
  }
  
  if (warningEl) {
    if (totalBurn > hubBudget) {
      warningEl.classList.remove("hidden");
    } else {
      warningEl.classList.add("hidden");
    }
  }

  // 2. Savings detection (Optimization Engine)
  const savingsValEl = document.getElementById("hub-savings-value");
  const savingsTipEl = document.getElementById("hub-savings-tip");
  
  let potentialSavings = 0;
  let overlappingCategories = [];
  categoriesList.forEach(cat => {
    const catSubs = subs.filter(s => s.category === cat);
    if (catSubs.length > 1) {
      catSubs.sort((a, b) => toMonthly(b) - toMonthly(a));
      for (let i = 1; i < catSubs.length; i++) {
        potentialSavings += toMonthly(catSubs[i]) * 12 * 0.25;
      }
      overlappingCategories.push(cat);
    }
  });
  
  if (potentialSavings > 0) {
    if (savingsValEl) savingsValEl.innerText = formatCurrency(potentialSavings, 0) + "/year";
    if (savingsTipEl) {
      let suggestionsHtml = "";
      overlappingCategories.forEach(cat => {
        const catSubs = subs.filter(s => s.category === cat);
        if (catSubs.length > 1) {
          catSubs.sort((a, b) => toMonthly(b) - toMonthly(a));
          const cheaperNames = catSubs.slice(1).map(s => s.name).join(" and ");
          const cheaperCost = catSubs.slice(1).reduce((sum, s) => sum + toMonthly(s), 0);
          suggestionsHtml += `
            <div class="flex items-start gap-1.5 text-[10px] text-slate-400 leading-snug">
              <span class="iconify text-amber-500 shrink-0 mt-0.5" data-icon="ph:arrow-right-bold"></span>
              <span>Consolidating or negotiating seats on <span class="font-extrabold text-slate-200">${cheaperNames}</span> in ${cat} could save <span class="text-emerald-400 font-extrabold font-mono">${formatCurrency(cheaperCost * 12 * 0.25, 0)}/yr</span> (25% optimization).</span>
            </div>
          `;
        }
      });
      savingsTipEl.innerHTML = `<div class="space-y-1.5">${suggestionsHtml}</div>`;
    }
  } else {
    if (savingsValEl) savingsValEl.innerText = "$0/year";
    if (savingsTipEl) {
      savingsTipEl.innerText = "No duplicate tools detected. Keep monitoring subscriptions to find optimization opportunities.";
    }
  }

  // 3. Category Breakdown list
  const catListEl = document.getElementById("hub-category-list");
  if (catListEl) {
    let catHtml = "";
    const sortedCats = Object.keys(catSums).map(cat => ({
      name: cat,
      cost: catSums[cat],
      pct: totalBurn > 0 ? (catSums[cat] / totalBurn) * 100 : 0
    })).sort((a, b) => b.cost - a.cost);
    
    sortedCats.forEach(item => {
      if (item.cost > 0) {
        const color = categoryColors[item.name] || "slate";
        const themeColor = getColor(color).accent;
        catHtml += `
          <div class="space-y-1">
            <div class="flex justify-between text-[10px] font-bold">
              <span class="text-slate-300">${item.name}</span>
              <span class="text-slate-400 font-mono">${formatCurrencyShort(item.cost)}/mo (${Math.round(item.pct)}%)</span>
            </div>
            <div class="w-full bg-slate-950/40 rounded-full h-1.5 border border-white/5 overflow-hidden">
              <div class="h-full rounded-full" style="width: ${item.pct}%; background-color: ${themeColor}"></div>
            </div>
          </div>
        `;
      }
    });
    
    if (catHtml === "") {
      catHtml = `<div class="text-center py-4 text-slate-500 text-[10px]">No active categories.</div>`;
    }
    catListEl.innerHTML = catHtml;
  }

  // 4. Department list
  const deptListEl = document.getElementById("hub-department-list");
  const deptInsightEl = document.getElementById("hub-department-insight");
  
  if (deptListEl) {
    let deptHtml = "";
    const sortedDepts = Object.keys(deptSums).map(dept => ({
      name: dept,
      cost: deptSums[dept],
      pct: totalBurn > 0 ? (deptSums[dept] / totalBurn) * 100 : 0
    })).sort((a, b) => b.cost - a.cost);
    
    sortedDepts.forEach(item => {
      if (item.cost > 0) {
        const cap = deptBudgets[item.name] || 1000;
        const isOver = item.cost > cap;
        const capPct = cap > 0 ? Math.min((item.cost / cap) * 100, 100) : 100;
        const barClass = isOver ? "dept-over-budget-bar" : "bg-purple-500";
        const textClass = isOver ? "dept-over-budget-text" : "text-slate-400";
        
        deptHtml += `
          <div class="space-y-1 p-2 rounded-lg bg-slate-950/10 border border-white/5">
            <div class="flex justify-between text-[10px] font-bold">
              <span class="text-slate-300">${item.name}</span>
              <span class="${textClass} font-mono">${formatCurrencyShort(item.cost)}/mo (${Math.round(item.pct)}%)</span>
            </div>
            <div class="w-full bg-slate-950/40 rounded-full h-1.5 border border-white/5 overflow-hidden">
              <div class="h-full rounded-full ${barClass}" style="width: ${capPct}%"></div>
            </div>
            <div class="flex justify-between text-[8px] text-slate-500 font-bold font-mono">
              <span>Cap: ${formatCurrency(cap, 0)}</span>
              ${isOver ? '<span class="text-red-400 animate-pulse font-sans">OVER BUDGET!</span>' : `<span>${Math.round(capPct)}% used</span>`}
            </div>
          </div>
        `;
      }
    });
    
    if (deptHtml === "") {
      deptHtml = `<div class="text-center py-4 text-slate-500 text-[10px]">No departments assigned. Edit a subscription to set its department.</div>`;
    }
    deptListEl.innerHTML = deptHtml;
    
    if (deptInsightEl) {
      if (sortedDepts.length > 0 && sortedDepts[0].cost > 0) {
        deptInsightEl.innerHTML = `<span class="text-purple-400 font-extrabold">${sortedDepts[0].name}</span> is currently the highest spending department at <span class="font-extrabold text-white font-mono">${formatCurrency(sortedDepts[0].cost, 0)}/mo</span> (${Math.round(sortedDepts[0].pct)}% of total burn).`;
      } else {
        deptInsightEl.innerText = "No department data available. Set department tags to see insights.";
      }
    }
  }
}

function changeCalendarMonth(direction) {
  calendarDate.setMonth(calendarDate.getMonth() + direction);
  renderCalendar();
}

function renderCalendar() {
  const monthYearEl = document.getElementById("calendar-month-year");
  const daysEl = document.getElementById("calendar-days");
  if (!monthYearEl || !daysEl) return;
  
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  monthYearEl.innerText = `${monthNames[month]} ${year}`;
  daysEl.innerHTML = "";
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  for (let i = 0; i < firstDayIndex; i++) {
    const empty = document.createElement("div");
    empty.className = "h-8 rounded-lg bg-slate-950/10 border border-transparent";
    daysEl.appendChild(empty);
  }
  
  for (let d = 1; d <= totalDays; d++) {
    const dayBtn = document.createElement("button");
    dayBtn.type = "button";
    dayBtn.className = "h-8 rounded-lg flex flex-col items-center justify-between p-1 bg-slate-900/40 border border-white/5 hover:bg-slate-900/80 transition-all text-[10px] font-bold text-slate-300 relative";
    
    if (d === calendarDate.getDate()) {
      dayBtn.classList.add("ring-2", "ring-purple-500", "border-purple-500/50", "text-white");
    }
    
    const checkDate = new Date(year, month, d);
    const dayRenewals = subs.filter(sub => isSubRenewingOnDate(sub, checkDate));
    
    // Risk Heatmap Intensity Class
    const dayCost = dayRenewals.reduce((sum, s) => sum + toMonthly(s), 0);
    let intensityClass = "calendar-day-intensity-0";
    if (dayCost > 0) {
      if (dayCost <= 50) intensityClass = "calendar-day-intensity-1";
      else if (dayCost <= 200) intensityClass = "calendar-day-intensity-2";
      else intensityClass = "calendar-day-intensity-3";
    }
    dayBtn.classList.add(intensityClass);
    
    // Collision Warning: multiple renewals land on same day
    if (dayRenewals.length > 1) {
      dayBtn.classList.add("calendar-collision");
    }
    
    const dayNumSpan = document.createElement("span");
    dayNumSpan.innerText = d.toString();
    dayBtn.appendChild(dayNumSpan);
    
    if (dayRenewals.length > 0) {
      const dotsContainer = document.createElement("div");
      dotsContainer.className = "flex gap-0.5 justify-center w-full mt-0.5 overflow-hidden max-w-full";
      
      dayRenewals.slice(0, 3).forEach(sub => {
        const dot = document.createElement("span");
        const color = getSubColor(sub);
        dot.className = "h-1.5 w-1.5 rounded-full shrink-0";
        dot.style.backgroundColor = color.accent;
        dotsContainer.appendChild(dot);
      });
      
      if (dayRenewals.length > 3) {
        const plusDot = document.createElement("span");
        plusDot.className = "text-[6px] text-slate-400 font-extrabold leading-none -mt-0.5";
        plusDot.innerText = "+";
        dotsContainer.appendChild(plusDot);
      }
      
      dayBtn.appendChild(dotsContainer);
    }
    
    dayBtn.onclick = () => selectCalendarDay(d);
    daysEl.appendChild(dayBtn);
  }
  
  updateCalendarDayEvents();
}

function selectCalendarDay(dayNum) {
  calendarDate.setDate(dayNum);
  renderCalendar();
}

function updateCalendarDayEvents() {
  const titleEl = document.getElementById("calendar-day-title");
  const eventsEl = document.getElementById("calendar-day-events");
  if (!titleEl || !eventsEl) return;
  
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const day = calendarDate.getDate();
  
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  titleEl.innerText = `Renewals on ${monthNames[month]} ${day}, ${year}`;
  
  const checkDate = new Date(year, month, day);
  const dayRenewals = subs.filter(sub => isSubRenewingOnDate(sub, checkDate));
  
  if (dayRenewals.length === 0) {
    eventsEl.innerHTML = `
      <div class="text-[10px] text-slate-500 text-center py-6">
        No subscription renewals scheduled for this day.
      </div>
    `;
    return;
  }
  
  let html = "";
  if (dayRenewals.length > 1) {
    const totalDayCost = dayRenewals.reduce((sum, s) => sum + toMonthly(s), 0);
    html += `
      <div class="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 text-red-200 text-[10px] flex items-start gap-1.5 mb-2 leading-snug">
        <span class="iconify text-red-400 text-sm shrink-0 mt-0.5" data-icon="ph:warning-bold"></span>
        <div>
          <span class="font-extrabold text-red-400">Collision Warning:</span>
          Multiple (${dayRenewals.length}) SaaS items renew on this day. Total outflow: <span class="font-black text-white font-mono">${formatCurrency(totalDayCost)}</span>. Check card balance.
        </div>
      </div>
    `;
  }
  
  dayRenewals.forEach(sub => {
    const color = getSubColor(sub);
    html += `
      <div class="flex items-center justify-between p-2 rounded-lg bg-slate-950/20 border border-white/5 border-l-2 text-[10px]" style="border-left-color: ${color.accent}">
        <div class="flex items-center gap-1.5 min-w-0">
          ${iconHtml(sub, "h-5 w-5")}
          <div class="min-w-0">
            <div class="font-bold text-slate-200 truncate">${sub.name}</div>
            <div class="text-[8px] text-slate-500">${sub.category} · ${sub.cycle}</div>
          </div>
        </div>
        <div class="text-right shrink-0">
          <div class="font-black text-slate-200 font-mono">${formatCurrencyShort(toMonthly(sub))}</div>
        </div>
      </div>
    `;
  });
  
  eventsEl.innerHTML = html;
}

function setAlertSimChannel(channel) {
  simChannel = channel;
  
  const channels = ["email", "push", "slack"];
  channels.forEach(ch => {
    const btn = document.getElementById("sim-btn-" + ch);
    if (btn) {
      if (ch === channel) {
        btn.classList.add("text-purple-400", "border-purple-500/30");
        btn.classList.remove("text-slate-400");
      } else {
        btn.classList.remove("text-purple-400", "border-purple-500/30");
        btn.classList.add("text-slate-400");
      }
    }
  });
  
  renderAlertSim();
}

function renderAlertSim() {
  const container = document.getElementById("sim-display-container");
  if (!container) return;

  let alertSubs = subs.filter(sub => {
    const renewal = getDaysUntilRenewal(sub);
    return renewal.days <= 2;
  });

  if (alertSubs.length === 0) {
    if (subs.length > 0) {
      alertSubs = subs.slice(0, 3);
    } else {
      alertSubs = [
        { name: "ChatGPT Plus", price: 20.00, cycle: "Monthly", category: "AI / API", currency: "USD", url: "openai.com" },
        { name: "Netflix", price: 17.99, cycle: "Monthly", category: "Collaboration", currency: "USD", url: "netflix.com" },
        { name: "Disney+", price: 15.99, cycle: "Monthly", category: "Collaboration", currency: "USD", url: "disneyplus.com" }
      ];
    }
  }

  // Render dynamic B2B alert metrics/consequences
  const metricsEl = document.getElementById("alerts-sim-metrics");
  if (metricsEl) {
    let simulationMetricsHtml = "";
    
    // Sort subscriptions to find top vendor
    const sortedSubs = [...subs].sort((a, b) => toMonthly(b) - toMonthly(a));
    
    if (sortedSubs.length > 0) {
      // 1. Top vendor price shock calculation
      const topVendor = sortedSubs[0];
      const addedCost = toMonthly(topVendor) * 0.2;
      
      let currentHubBurn = 0;
      subs.forEach(s => currentHubBurn += toMonthly(s));
      const currentPayroll = projectedHires * averageSalary;
      const activeHubBurnTotal = currentHubBurn + currentPayroll;
      
      const newTotalBurn = activeHubBurnTotal + addedCost;
      const totalCash = startingCash + cashInjections;
      const currentRunway = activeHubBurnTotal > 0 ? totalCash / activeHubBurnTotal : Infinity;
      const newRunway = newTotalBurn > 0 ? totalCash / newTotalBurn : Infinity;
      const runwayDelta = currentRunway !== Infinity && newRunway !== Infinity ? currentRunway - newRunway : 0;
      
      let topVendorShockText = "";
      if (runwayDelta > 0.05) {
        topVendorShockText = `If <span class="font-black text-slate-200">${topVendor.name}</span> prices spike 20% &rarr; runway decreases by <span class="text-red-400 font-extrabold font-mono">${runwayDelta.toFixed(1)} mo</span> (Burn +${formatCurrency(addedCost)}/mo)`;
      } else {
        topVendorShockText = `If <span class="font-black text-slate-200">${topVendor.name}</span> prices spike 20% &rarr; monthly burn rises by <span class="text-red-400 font-extrabold font-mono">${formatCurrency(addedCost)}/mo</span>`;
      }
      
      simulationMetricsHtml += `
        <div class="p-2 rounded-lg bg-slate-950/40 border border-white/5 text-[9px] text-slate-400 flex items-start gap-1.5 leading-snug">
          <span class="iconify text-orange-400 shrink-0 mt-0.5" data-icon="ph:chart-line-up-bold"></span>
          <span>${topVendorShockText}</span>
        </div>
      `;
      
      // 2. Efficiency calculation for deactivating 2 cheapest tools
      if (sortedSubs.length >= 2) {
        const t1 = sortedSubs[sortedSubs.length - 1];
        const t2 = sortedSubs[sortedSubs.length - 2];
        const savedCost = toMonthly(t1) + toMonthly(t2);
        
        const newTotalBurnReduced = Math.max(0, activeHubBurnTotal - savedCost);
        const newRunwayReduced = newTotalBurnReduced > 0 ? totalCash / newTotalBurnReduced : Infinity;
        const runwayDeltaReduced = currentRunway !== Infinity && newRunwayReduced !== Infinity ? newRunwayReduced - currentRunway : 0;
        const efficiency = currentRunway > 0 && currentRunway !== Infinity ? (runwayDeltaReduced / currentRunway) * 100 : 0;
        
        let reductionText = "";
        if (runwayDeltaReduced > 0.05) {
          reductionText = `Removing <span class="font-black text-slate-200">${t1.name} and ${t2.name}</span> &rarr; +<span class="text-emerald-400 font-extrabold font-mono">${Math.round(efficiency)}%</span> runway efficiency (+${runwayDeltaReduced.toFixed(1)} mo)`;
        } else {
          reductionText = `Removing <span class="font-black text-slate-200">${t1.name} and ${t2.name}</span> &rarr; saves <span class="text-emerald-400 font-extrabold font-mono">${formatCurrency(savedCost)}/mo</span>`;
        }
        
        simulationMetricsHtml += `
          <div class="p-2 rounded-lg bg-slate-950/40 border border-white/5 text-[9px] text-slate-400 flex items-start gap-1.5 leading-snug">
            <span class="iconify text-emerald-400 shrink-0 mt-0.5" data-icon="ph:sparkle-bold"></span>
            <span>${reductionText}</span>
          </div>
        `;
      }
    } else {
      simulationMetricsHtml = `<div class="p-2 rounded-lg bg-slate-950/40 border border-white/5 text-[9px] text-slate-400 flex items-start gap-1.5 leading-snug">No active simulation data. Set presets above.</div>`;
    }
    
    metricsEl.innerHTML = simulationMetricsHtml;
  }

  let html = "";
  if (simChannel === "email") {
    let itemsHtml = "";
    alertSubs.forEach(sub => {
      const monthlyPrice = toMonthly(sub);
      itemsHtml += `
        <div class="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/5">
          <div class="flex items-center gap-3.5 min-w-0">
            <div class="h-8 w-8 shrink-0">${iconHtml(sub, "w-full h-full")}</div>
            <div class="min-w-0">
              <div class="text-xs font-black text-slate-200 truncate">${sub.name}</div>
              <div class="text-[9px] text-slate-500 font-bold mt-0.5">Renewing tomorrow</div>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-xs font-black text-slate-200 font-mono">${formatCurrencyShort(monthlyPrice)}</div>
          </div>
        </div>
      `;
    });

    html = `
      <div class="w-full max-w-md mx-auto bg-slate-900/60 rounded-xl border border-white/10 overflow-hidden text-left shadow-2xl">
        <div class="bg-purple-950/20 p-3 border-b border-white/5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="h-6 w-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-black text-white">V</div>
            <div>
              <div class="text-[10px] font-black text-slate-200 leading-none">notifications@vexly.app</div>
              <div class="text-[8px] text-slate-500 mt-0.5">To: workspace-owner@company.com</div>
            </div>
          </div>
          <div class="text-[8px] text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded">2 days before</div>
        </div>
        <div class="p-4 space-y-3">
          <div>
            <h2 class="text-xs font-black text-white flex items-center gap-1.5">
              Renewal Alert: ${alertSubs.length} subscriptions renewing soon
            </h2>
            <p class="text-[9px] text-slate-400 mt-1 leading-normal">
              Never miss a renewal. We found these upcoming charges scheduled for the next 2 days:
            </p>
          </div>
          <div class="space-y-2">
            ${itemsHtml}
          </div>
          <div class="border-t border-white/5 pt-3 flex justify-between items-center flex-wrap gap-2">
            <span class="text-[9px] text-slate-500">Managed via <span class="font-extrabold text-purple-400">RunwayMap</span></span>
            <button onclick="openModal()" class="bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black px-2.5 py-1 rounded-lg transition-colors">
              Manage Subscriptions
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (simChannel === "push") {
    const subNames = alertSubs.map(s => s.name).join(", ");
    let totalCostVal = 0;
    alertSubs.forEach(s => totalCostVal += toMonthly(s));
    
    html = `
      <div class="w-full max-w-sm mx-auto bg-slate-900/90 backdrop-blur rounded-2xl border border-white/10 p-3.5 text-left shadow-2xl">
        <div class="flex items-start gap-3">
          <div class="h-9 w-9 rounded-xl bg-purple-600 border border-purple-500/30 flex items-center justify-center shrink-0">
            <span class="iconify text-white text-lg" data-icon="ph:cube-bold"></span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex justify-between items-baseline">
              <span class="text-xs font-black text-slate-200">RunwayMap Alert</span>
              <span class="text-[9px] text-slate-500 font-bold">now</span>
            </div>
            <p class="text-[10px] font-bold text-slate-300 mt-0.5 leading-snug">
              ${alertSubs.length} SaaS renewals in 2 days: ${subNames}. Total charge: ${formatCurrencyShort(totalCostVal)}.
            </p>
            <div class="flex gap-2 mt-2.5">
              <button class="bg-white/5 hover:bg-white/10 text-slate-300 text-[9px] font-bold px-2.5 py-1 rounded border border-white/5 transition-colors">Snooze</button>
              <button onclick="openModal()" class="bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black px-2.5 py-1 rounded transition-colors">View Details</button>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (simChannel === "slack") {
    let slackItemsHtml = "";
    alertSubs.forEach(sub => {
      const cost = toMonthly(sub);
      slackItemsHtml += `
        <div class="pl-2 border-l-2 border-white/10 font-mono text-[9px]">
          &bull; <span class="font-extrabold text-slate-200">${sub.name}</span> (${sub.category}) &mdash; <span class="text-purple-400 font-extrabold font-mono">${formatCurrencyShort(cost)}</span> renewing soon
        </div>
      `;
    });

    html = `
      <div class="w-full max-w-md mx-auto bg-[#1b1d21] rounded-lg border border-[#35373b] p-4 text-left shadow-2xl font-sans text-xs">
        <div class="flex items-start gap-2.5">
          <div class="h-8 w-8 rounded bg-purple-800 border border-white/10 flex items-center justify-center shrink-0 text-white font-extrabold text-sm">
            RM
          </div>
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex items-baseline gap-1.5">
              <span class="font-extrabold text-slate-200">RunwayMap Bot</span>
              <span class="text-[8px] font-bold text-slate-500 bg-[#35373b] px-1 rounded">APP</span>
              <span class="text-[8px] text-slate-500">12:34 PM</span>
            </div>
            <div class="border-l-4 border-amber-500 pl-3 py-0.5 space-y-1.5">
              <div class="font-black text-slate-200 text-[11px] flex items-center gap-1 font-sans">
                ${alertSubs.length} Subscriptions Renewing Soon (2-day notice)
              </div>
              <p class="text-slate-400 text-[10px] leading-normal font-sans">
                We detected upcoming charges on your linked cards. Make sure balance is sufficient:
              </p>
              <div class="space-y-1">
                ${slackItemsHtml}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// Scenarios State Management
let savedScenarios = {};

function saveCurrentScenario() {
  const nameInput = document.getElementById("scenario-name-input");
  const name = nameInput ? nameInput.value.trim() : "";
  
  if (!name) {
    showToast("Please enter a scenario name.", "error");
    return;
  }

  savedScenarios[name] = {
    startingCash: startingCash,
    cashInjections: cashInjections,
    teamScale: teamScale,
    projectedHires: projectedHires,
    averageSalary: averageSalary,
    surgeScale: surgeScale,
    subs: JSON.parse(JSON.stringify(subs))
  };

  localStorage.setItem("runwaymap_scenarios", JSON.stringify(savedScenarios));
  if (nameInput) nameInput.value = "";
  
  showToast(`Scenario '${name}' saved successfully!`, "success");
  updateScenarioSelector();
}

function loadScenario(name) {
  if (!name) return;
  const scenario = savedScenarios[name];
  if (!scenario) return;

  startingCash = scenario.startingCash || 50000;
  cashInjections = scenario.cashInjections || 0;
  teamScale = scenario.teamScale || 0;
  projectedHires = scenario.projectedHires || 0;
  averageSalary = scenario.averageSalary || 5000;
  surgeScale = scenario.surgeScale || 1.0;
  subs = JSON.parse(JSON.stringify(scenario.subs || []));

  document.getElementById("starting-cash").value = startingCash;
  document.getElementById("cash-injections").value = cashInjections;
  
  document.getElementById("team-slider").value = teamScale;
  document.getElementById("team-value").innerText = "+" + teamScale + " seat" + (teamScale === 1 ? "" : "s");

  document.getElementById("projected-hires").value = projectedHires;
  document.getElementById("hires-value").innerText = "+" + projectedHires;

  document.getElementById("average-salary").value = averageSalary;

  document.getElementById("surge-slider").value = surgeScale;
  document.getElementById("surge-value").innerText = surgeScale.toFixed(1) + "x" + (surgeScale === 1.0 ? " (Normal)" : " (Surge)");

  save();
  showToast(`Loaded scenario: '${name}'`, "success");
  recalculateAnalytics();
  renderList();
  renderActiveView();
}

function deleteSelectedScenario() {
  const selector = document.getElementById("scenario-selector");
  const name = selector ? selector.value : "";
  
  if (!name) {
    showToast("Please select a scenario to delete.", "error");
    return;
  }

  delete savedScenarios[name];
  localStorage.setItem("runwaymap_scenarios", JSON.stringify(savedScenarios));
  showToast(`Deleted scenario: '${name}'`, "info");
  updateScenarioSelector();
}

function updateScenarioSelector() {
  const selector = document.getElementById("scenario-selector");
  if (!selector) return;

  let html = '<option value="">-- Load Scenario --</option>';
  for (const name in savedScenarios) {
    html += `<option value="${name}">${name}</option>`;
  }
  selector.innerHTML = html;
}

function loadScenariosFromStorage() {
  const saved = localStorage.getItem("runwaymap_scenarios");
  if (saved) {
    try {
      savedScenarios = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse scenarios:", e);
      savedScenarios = {};
    }
  }
  updateScenarioSelector();
}

window.renderCompareMatrix = function() {
  const body = document.getElementById("compare-matrix-body");
  if (!body) return;

  const scenarioNames = Object.keys(savedScenarios);

  const tableHeader = document.querySelector("#compare-panel table thead tr");
  if (tableHeader) {
    tableHeader.innerHTML = `
      <th class="p-3">Metric</th>
      <th class="p-3 bg-purple-500/10">Active (Current)</th>
    `;
    scenarioNames.forEach(name => {
      tableHeader.innerHTML += `<th class="p-3 border-l border-white/5">${name}</th>`;
    });
  }

  let activeSaaS = 0;
  for (let i = 0; i < subs.length; i++) {
    activeSaaS += toMonthly(subs[i]);
  }
  const activePayroll = projectedHires * averageSalary;
  const activeBurn = activeSaaS + activePayroll;
  const activeCashTotal = startingCash + cashInjections;
  const activeRunway = activeBurn > 0 ? (activeCashTotal / activeBurn) : Infinity;

  const rows = [
    { label: "Starting Cash", valFn: () => formatCurrency(startingCash, 0), scenFn: (sc) => formatCurrency(sc.startingCash || 0, 0) },
    { label: "Cash Injection", valFn: () => formatCurrency(cashInjections, 0), scenFn: (sc) => formatCurrency(sc.cashInjections || 0, 0) },
    { label: "Scale Team Seats", valFn: () => `+${teamScale} seats`, scenFn: (sc) => `+${sc.teamScale || 0} seats` },
    { label: "Hiring Pipeline", valFn: () => `+${projectedHires} hires`, scenFn: (sc) => `+${sc.projectedHires || 0} hires` },
    { label: "Avg Salary/mo", valFn: () => formatCurrency(averageSalary, 0), scenFn: (sc) => formatCurrency(sc.averageSalary || 0, 0) },
    { label: "API/Infra Surge", valFn: () => `${surgeScale.toFixed(1)}x`, scenFn: (sc) => `${(sc.surgeScale || 1.0).toFixed(1)}x` },
    { label: "Total Monthly Burn", valFn: () => formatCurrency(activeBurn, 0), scenFn: (sc) => formatCurrency(getScenarioBurn(sc), 0) },
    { label: "Runway Remaining", valFn: () => activeBurn > 0 ? `${activeRunway.toFixed(1)} mo` : "Infinite", scenFn: (sc) => {
        const burn = getScenarioBurn(sc);
        const cash = (sc.startingCash || 0) + (sc.cashInjections || 0);
        return burn > 0 ? `${(cash / burn).toFixed(1)} mo` : "Infinite";
      }
    },
    { label: "Δ Runway vs Active", valFn: () => "0.0 mo (Base)", scenFn: (sc) => {
        const burn = getScenarioBurn(sc);
        const cash = (sc.startingCash || 0) + (sc.cashInjections || 0);
        const scRunway = burn > 0 ? (cash / burn) : Infinity;
        if (activeRunway === Infinity && scRunway === Infinity) return "0.0 mo";
        if (activeRunway === Infinity) return "-Inf";
        if (scRunway === Infinity) return "+Inf";
        const delta = scRunway - activeRunway;
        return (delta >= 0 ? "+" : "") + delta.toFixed(1) + " mo";
      }
    },
    { label: "Δ Burn vs Active", valFn: () => "$0/mo (Base)", scenFn: (sc) => {
        const scBurn = getScenarioBurn(sc);
        const delta = scBurn - activeBurn;
        return (delta >= 0 ? "+" : "") + formatCurrency(delta, 0) + "/mo";
      }
    },
    { label: "Capital Efficiency", valFn: () => activeBurn > 0 ? (activeCashTotal / (activeBurn * 12)).toFixed(2) + " yrs" : "Infinite", scenFn: (sc) => {
        const burn = getScenarioBurn(sc);
        const cash = (sc.startingCash || 0) + (sc.cashInjections || 0);
        const arr = burn * 12;
        return arr > 0 ? (cash / arr).toFixed(2) + " yrs" : "Infinite";
      }
    }
  ];

  let html = "";
  rows.forEach(r => {
    html += `<tr class="border-b border-white/5 hover:bg-white/5 transition-colors">`;
    html += `<td class="p-3 font-sans font-bold text-slate-400">${r.label}</td>`;
    html += `<td class="p-3 bg-purple-500/5 font-black text-purple-300">${r.valFn()}</td>`;
    scenarioNames.forEach(name => {
      const sc = savedScenarios[name];
      html += `<td class="p-3 border-l border-white/5">${r.scenFn(sc)}</td>`;
    });
    html += `</tr>`;
  });

  body.innerHTML = html;
}

// Department Budgets Cap Management
let deptBudgets = {
  Engineering: 1000,
  Product: 1000,
  Marketing: 1000,
  Operations: 1000,
  Sales: 1000
};

function loadDeptBudgets() {
  const saved = localStorage.getItem("runwaymap_dept_budgets");
  if (saved) {
    try {
      deptBudgets = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse department budgets:", e);
    }
  }
}

function saveDeptBudgets() {
  localStorage.setItem("runwaymap_dept_budgets", JSON.stringify(deptBudgets));
}

function updateDeptBudgetCap(dept, value) {
  const parsed = parseFloat(value);
  deptBudgets[dept] = isNaN(parsed) || parsed < 0 ? 0 : parsed;
  saveDeptBudgets();
  recalculateAnalytics();
}

function renderDeptBudgetsEditor() {
  const container = document.getElementById("hub-department-caps-inputs");
  if (!container) return;

  const departmentsList = ["Engineering", "Product", "Marketing", "Operations", "Sales"];
  let html = "";
  
  departmentsList.forEach(dept => {
    const capVal = deptBudgets[dept] || 1000;
    html += `
      <div class="space-y-1">
        <div class="flex justify-between items-center text-[9px] font-bold">
          <span class="text-slate-400 font-sans">${dept} Cap</span>
          <div class="flex items-center gap-1">
            <span class="text-slate-500 font-extrabold">$</span>
            <input 
              type="number" 
              value="${capVal}" 
              oninput="updateDeptBudgetCap('${dept}', this.value)"
              class="w-16 rounded border border-white/5 bg-slate-950/50 px-1 py-0.5 text-right font-mono text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
            />
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// CFO PDF Print Report Generation
function triggerCFOPrint() {
  const dateEl = document.getElementById("print-date");
  if (dateEl) {
    const today = new Date();
    dateEl.innerText = today.toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
  }

  let scaledSaaS = 0;
  for (let i = 0; i < subs.length; i++) {
    scaledSaaS += toMonthly(subs[i]);
  }
  const payrollBurn = projectedHires * averageSalary;
  const totalBurn = scaledSaaS + payrollBurn;
  const totalCash = startingCash + cashInjections;
  const activeRunway = totalBurn > 0 ? (totalCash / totalBurn) : Infinity;

  let riskVal = 0;
  let highestSub = null;
  let highestCost = 0;
  for (let i = 0; i < subs.length; i++) {
    const cost = toMonthly(subs[i]);
    if (cost > highestCost) {
      highestCost = cost;
      highestSub = subs[i];
    }
  }
  if (activeRunway < 3) riskVal += 50;
  else if (activeRunway < 6) riskVal += 35;
  else if (activeRunway < 12) riskVal += 15;
  else if (activeRunway < 18) riskVal += 5;
  
  if (scaledSaaS > 0 && highestSub) {
    const maxPct = highestCost / scaledSaaS;
    if (maxPct > 0.50) riskVal += 25;
    else if (maxPct > 0.35) riskVal += 15;
  }
  const categoriesList = ["Infrastructure", "AI / API", "Dev Tools", "Collaboration", "Security / Ops", "Marketing / Sales"];
  let overlapCount = 0;
  categoriesList.forEach(cat => {
    if (subs.filter(s => s.category === cat).length > 1) overlapCount++;
  });
  riskVal += Math.min(overlapCount * 5, 20);
  if (startingCash < 10000 && totalBurn > 0) riskVal += 10;
  riskVal = Math.min(riskVal, 100);

  document.getElementById("print-burn").innerText = formatCurrency(totalBurn, 0);
  document.getElementById("print-runway").innerText = totalBurn > 0 ? `${activeRunway.toFixed(1)} mo` : "Infinite";
  document.getElementById("print-risk").innerText = `${riskVal}%`;
  document.getElementById("print-cash").innerText = formatCurrency(totalCash, 0);

  const sortedSubs = [...subs].sort((a, b) => toMonthly(b) - toMonthly(a));
  const driversListEl = document.getElementById("print-drivers");
  if (driversListEl) {
    let driversHtml = "";
    sortedSubs.slice(0, 5).forEach((d, idx) => {
      driversHtml += `<div class="py-1 border-b border-slate-100 flex justify-between"><span>${idx + 1}. ${d.name} (${d.category})</span><span class="font-bold">${formatCurrency(toMonthly(d), 0)}/mo</span></div>`;
    });
    if (driversHtml === "") driversHtml = "<div>No active expenses</div>";
    driversListEl.innerHTML = driversHtml;
  }

  const deptListEl = document.getElementById("print-departments");
  if (deptListEl) {
    const deptSums = {};
    const departmentsList = ["Engineering", "Product", "Marketing", "Sales", "Ops"];
    departmentsList.forEach(d => deptSums[d] = 0);
    subs.forEach(s => {
      const cost = toMonthly(s);
      const dept = s.department || "Engineering";
      deptSums[dept] = (deptSums[dept] || 0) + cost;
    });

    let deptHtml = "";
    departmentsList.forEach(d => {
      if (deptSums[d] > 0) {
        const pct = totalBurn > 0 ? Math.round((deptSums[d] / totalBurn) * 100) : 0;
        deptHtml += `<div class="py-1 border-b border-slate-100 flex justify-between"><span>${d}</span><span class="font-bold">${formatCurrency(deptSums[d], 0)}/mo (${pct}%)</span></div>`;
      }
    });
    if (deptHtml === "") deptHtml = "<div>No department allocations</div>";
    deptListEl.innerHTML = deptHtml;
  }

  const scenariosBodyEl = document.getElementById("print-scenarios-body");
  if (scenariosBodyEl) {
    let scenHtml = "";
    scenHtml += `
      <tr class="bg-slate-50 font-bold">
        <td class="p-2">Current (Active)</td>
        <td class="p-2">${formatCurrency(totalBurn, 0)}</td>
        <td class="p-2">${totalBurn > 0 ? activeRunway.toFixed(1) + " mo" : "Infinite"}</td>
        <td class="p-2">${formatCurrency(cashInjections, 0)}</td>
        <td class="p-2">+${projectedHires} hires</td>
        <td class="p-2">${riskVal}%</td>
      </tr>
    `;

    function getScenarioBurn(scenario) {
      let saasBurn = 0;
      const tempSubs = scenario.subs || [];
      for (let i = 0; i < tempSubs.length; i++) {
        const sub = tempSubs[i];
        const subCurrency = sub.currency || selectedCurrency || "USD";
        let monthly = sub.price;
        if (sub.cycle === "Yearly") monthly = sub.price / 12;
        if (sub.cycle === "Weekly") monthly = sub.price * 4.33;
        if (sub.isSeatBased) monthly = monthly * (1 + (scenario.teamScale || 0));
        if (sub.category === "AI / API" || sub.category === "Infrastructure") monthly = monthly * (scenario.surgeScale || 1.0);
        saasBurn += convertToBase(monthly, subCurrency);
      }
      const payroll = (scenario.projectedHires || 0) * (scenario.averageSalary || 5000);
      return saasBurn + payroll;
    }

    for (const name in savedScenarios) {
      const sc = savedScenarios[name];
      const scBurn = getScenarioBurn(sc);
      const scCash = (sc.startingCash || 0) + (sc.cashInjections || 0);
      const scRunway = scBurn > 0 ? (scCash / scBurn) : Infinity;

      let scRisk = 0;
      if (scRunway < 3) scRisk += 50;
      else if (scRunway < 6) scRisk += 35;
      else if (scRunway < 12) scRisk += 15;
      const scSaaSLen = (sc.subs || []).length;
      scRisk = Math.min(scRisk + (scSaaSLen > 5 ? 20 : 10), 100);

      scenHtml += `
        <tr>
          <td class="p-2 font-sans">${name}</td>
          <td class="p-2">${formatCurrency(scBurn, 0)}</td>
          <td class="p-2">${scBurn > 0 ? scRunway.toFixed(1) + " mo" : "Infinite"}</td>
          <td class="p-2">${formatCurrency(sc.cashInjections || 0, 0)}</td>
          <td class="p-2">+${sc.projectedHires || 0} hires</td>
          <td class="p-2">${scRisk}%</td>
        </tr>
      `;
    }
    scenariosBodyEl.innerHTML = scenHtml;
  }

  const matrixBodyEl = document.getElementById("print-matrix-body");
  if (matrixBodyEl) {
    let matrixHtml = "";
    subs.forEach(s => {
      matrixHtml += `
        <tr>
          <td class="p-2 font-bold">${s.name}</td>
          <td class="p-2">${s.category}</td>
          <td class="p-2">${s.owner || "-"}</td>
          <td class="p-2">${s.department || "Engineering"}</td>
          <td class="p-2">${s.cycle}</td>
          <td class="p-2 text-right font-mono">${formatCurrency(toMonthly(s), 2)}</td>
        </tr>
      `;
    });
    if (matrixHtml === "") matrixHtml = "<tr><td colspan='6' class='p-3 text-center'>No SaaS expenses in stack</td></tr>";
    matrixBodyEl.innerHTML = matrixHtml;
  }

  window.print();
}

// Global scenario burn calculator helper
function getScenarioBurn(scenario) {
  let saasBurn = 0;
  const tempSubs = scenario.subs || [];
  for (let i = 0; i < tempSubs.length; i++) {
    const sub = tempSubs[i];
    const subCurrency = sub.currency || selectedCurrency || "USD";
    let monthly = sub.price;
    if (sub.cycle === "Yearly") monthly = sub.price / 12;
    if (sub.cycle === "Weekly") monthly = sub.price * 4.33;
    if (sub.isSeatBased) monthly = monthly * (1 + (scenario.teamScale || 0));
    if (sub.category === "AI / API" || sub.category === "Infrastructure") monthly = monthly * (scenario.surgeScale || 1.0);
    saasBurn += convertToBase(monthly, subCurrency);
  }
  const payroll = (scenario.projectedHires || 0) * (scenario.averageSalary || 5000);
  return saasBurn + payroll;
}

// Visual Runway Cash Flow Chart Renderer
function renderCashFlowChart() {
  const container = document.getElementById("cash-flow-svg-container");
  if (!container) return;

  const width = container.clientWidth || 600;
  const height = 220;
  
  let scaledSaaS = 0;
  for (let i = 0; i < subs.length; i++) {
    scaledSaaS += toMonthly(subs[i]);
  }
  const payrollBurn = projectedHires * averageSalary;
  const activeBurn = scaledSaaS + payrollBurn;
  const activeStartCash = startingCash + cashInjections;

  const activePoints = [];
  for (let m = 0; m <= 12; m++) {
    const cash = Math.max(0, activeStartCash - m * activeBurn);
    activePoints.push(cash);
  }

  let globalMaxCash = Math.max(10000, activeStartCash);
  for (const name in savedScenarios) {
    const sc = savedScenarios[name];
    globalMaxCash = Math.max(globalMaxCash, (sc.startingCash || 0) + (sc.cashInjections || 0));
  }

  const marginL = 50;
  const marginR = 20;
  const marginT = 20;
  const marginB = 30;
  const plotW = width - marginL - marginR;
  const plotH = height - marginT - marginB;

  function getX(m) {
    return marginL + (m / 12) * plotW;
  }
  function getY(cash) {
    return marginT + plotH - (cash / globalMaxCash) * plotH;
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const startMonthIdx = 5; // June
  const monthLabels = [];
  for (let m = 0; m <= 12; m++) {
    monthLabels.push(months[(startMonthIdx + m) % 12]);
  }

  let svg = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">`;
  svg += `
    <defs>
      <linearGradient id="chart-gradient-active" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--color-purple, #8b5cf6)" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="var(--color-purple, #8b5cf6)" stop-opacity="0.0"/>
      </linearGradient>
    </defs>
  `;

  const gridLevels = [0, 0.25, 0.5, 0.75, 1.0];
  gridLevels.forEach(lvl => {
    const cashVal = lvl * globalMaxCash;
    const y = getY(cashVal);
    svg += `<line x1="${marginL}" y1="${y}" x2="${width - marginR}" y2="${y}" class="chart-grid-line" />`;
    svg += `<text x="${marginL - 8}" y="${y + 3}" text-anchor="end" class="chart-axis-text">${formatOriginalCurrencyFormat(cashVal)}</text>`;
  });

  const zeroY = getY(0);
  svg += `<line x1="${marginL}" y1="${zeroY}" x2="${width - marginR}" y2="${zeroY}" class="chart-line-zero" />`;

  let hasSaved = false;
  for (const name in savedScenarios) {
    hasSaved = true;
    const sc = savedScenarios[name];
    const scBurn = getScenarioBurn(sc);
    const scStartCash = (sc.startingCash || 0) + (sc.cashInjections || 0);
    
    let pathD = "";
    for (let m = 0; m <= 12; m++) {
      const cash = Math.max(0, scStartCash - m * scBurn);
      const x = getX(m);
      const y = getY(cash);
      pathD += (m === 0 ? "M " : " L ") + x + " " + y;
    }
    svg += `<path d="${pathD}" class="chart-line-saved" />`;
  }

  const legendEl = document.getElementById("chart-saved-legend");
  if (legendEl) {
    if (hasSaved) legendEl.classList.remove("hidden");
    else legendEl.classList.add("hidden");
  }

  let areaD = `M ${getX(0)} ${getY(activePoints[0])}`;
  for (let m = 1; m <= 12; m++) {
    areaD += ` L ${getX(m)} ${getY(activePoints[m])}`;
  }
  areaD += ` L ${getX(12)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`;
  svg += `<path d="${areaD}" class="chart-area-gradient" />`;

  let lineD = `M ${getX(0)} ${getY(activePoints[0])}`;
  for (let m = 1; m <= 12; m++) {
    lineD += ` L ${getX(m)} ${getY(activePoints[m])}`;
  }
  svg += `<path d="${lineD}" class="chart-line-active" />`;
  svg += `<line x1="${marginL}" y1="${zeroY}" x2="${width - marginR}" y2="${zeroY}" class="chart-axis-line" />`;

  for (let m = 0; m <= 12; m++) {
    const x = getX(m);
    const y = getY(activePoints[m]);
    svg += `<circle cx="${x}" cy="${y}" r="4.5" class="chart-point-active"><title>Month ${m} (${monthLabels[m]}): ${formatCurrency(activePoints[m], 0)} cash</title></circle>`;
    if (m % 2 === 0 || m === 12) {
      svg += `<text x="${x}" y="${height - 8}" text-anchor="middle" class="chart-axis-text">${monthLabels[m]}</text>`;
    }
  }

  svg += `</svg>`;
  container.innerHTML = svg;
}

function formatOriginalCurrencyFormat(amount) {
  const curr = currencies[selectedCurrency];
  if (amount >= 1_000_000) return curr.symbol + (amount / 1_000_000).toFixed(1) + "M";
  if (amount >= 1_000) return curr.symbol + (amount / 1_000).toFixed(0) + "k";
  return curr.symbol + amount.toFixed(0);
}

// Cost-Saving Insights Engine Auditor
function auditSaaSStack() {
  const container = document.getElementById("hub-savings-tip");
  const valueEl = document.getElementById("hub-savings-value");
  const optListEl = document.getElementById("optimization-recommendations-list");
  const optValEl = document.getElementById("optimization-savings-value");

  activeInsights = [];

  // Rule 1: Redundancy Detection
  const collabTools = subs.filter(s => s.category === "Collaboration");
  if (collabTools.length > 1) {
    const slack = collabTools.find(s => s.name.toLowerCase().includes("slack"));
    const teams = collabTools.find(s => s.name.toLowerCase().includes("teams") || s.name.toLowerCase().includes("microsoft"));
    
    if (slack && teams) {
      const cheaper = toMonthly(slack) < toMonthly(teams) ? slack : teams;
      const keeping = cheaper === slack ? teams : slack;
      activeInsights.push({
        type: "redundancy",
        title: "Duplicate Chat Software",
        desc: `Having both **${slack.name}** and **${teams.name}** is redundant. Consolidate to save ARR.`,
        saving: toMonthly(cheaper),
        targetId: cheaper.id,
        actionLabel: `Keep ${keeping.name} only`
      });
    }
  }

  // General redundancies in any categories (if >=3 tools in same category)
  const categoriesList = ["Infrastructure", "AI / API", "Dev Tools", "Collaboration", "Security / Ops", "Marketing / Sales"];
  categoriesList.forEach(cat => {
    const catSubs = subs.filter(s => s.category === cat);
    if (catSubs.length >= 3) {
      const sorted = [...catSubs].sort((a, b) => toMonthly(a) - toMonthly(b));
      const cheapest = sorted[0];
      const alreadyAdded = activeInsights.some(ins => ins.targetId === cheapest.id);
      if (!alreadyAdded) {
        activeInsights.push({
          type: "redundancy",
          title: `Redundancy: ${cat}`,
          desc: `You have ${catSubs.length} services under **${cat}**. Consolidating **${cheapest.name}** saves monthly outflow.`,
          saving: toMonthly(cheapest),
          targetId: cheapest.id,
          actionLabel: `Deactivate ${cheapest.name}`
        });
      }
    }
  });

  // Rule 2: Billing cycle optimization
  subs.forEach(sub => {
    if (sub.cycle === "Monthly" && toMonthly(sub) >= 20.00) {
      const monthlyCost = toMonthly(sub);
      const annualSaving = monthlyCost * 0.20;
      activeInsights.push({
        type: "billing",
        title: `Yearly Discount: ${sub.name}`,
        desc: `Switch **${sub.name}** to an annual contract to unlock a 20% B2B discount.`,
        saving: annualSaving,
        targetId: sub.id,
        actionLabel: "Convert to Yearly"
      });
    }
  });

  // Rule 3: Missing Metadata Hygiene
  subs.forEach(sub => {
    if (!sub.owner || !sub.funding) {
      activeInsights.push({
        type: "hygiene",
        title: `Assign Metadata: ${sub.name}`,
        desc: `**${sub.name}** is missing an assigned owner or funding card source.`,
        saving: 0,
        targetId: sub.id,
        actionLabel: "Auto-Secure"
      });
    }
  });

  if (activeInsights.length === 0) {
    const emptyMsg = "No SaaS optimization alerts active. Your stack is lean and secure.";
    if (container) container.innerHTML = emptyMsg;
    if (valueEl) valueEl.innerText = "$0/year";
    if (optListEl) optListEl.innerHTML = `<div class="text-[10px] text-slate-500 text-center py-4">${emptyMsg}</div>`;
    if (optValEl) optValEl.innerText = "$0/year";
    if (typeof updateAnalystCommentary === "function" && currentTheme === "claude") {
      updateAnalystCommentary();
    }
    return;
  }

  const totalSaving = activeInsights.reduce((sum, ins) => sum + ins.saving * 12, 0);
  const formattedSavings = formatCurrency(totalSaving, 0) + "/year";
  if (valueEl) valueEl.innerText = formattedSavings;
  if (optValEl) optValEl.innerText = formattedSavings;

  let html = `<div class="space-y-2 mt-2 max-h-[170px] overflow-y-auto pr-1">`;
  activeInsights.forEach((ins, idx) => {
    const savingLabel = ins.saving > 0 
      ? `<span class="text-emerald-400 font-extrabold font-mono shrink-0">+${formatCurrencyShort(ins.saving)}/mo</span>` 
      : '<span class="text-slate-500 font-extrabold shrink-0">Hygiene</span>';
    
    let icon = "ph:lightbulb-bold";
    if (ins.type === "redundancy") icon = "ph:arrows-merge-bold";
    if (ins.type === "billing") icon = "ph:calendar-arrow-down-bold";
    if (ins.type === "hygiene") icon = "ph:clipboard-text-bold";

    html += `
      <div class="p-2.5 rounded-xl border border-white/5 bg-slate-950/40 hover:bg-slate-950/60 transition-all text-[10px] space-y-1.5 font-sans">
        <div class="flex items-center justify-between gap-1">
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="iconify text-purple-400 shrink-0 text-sm" data-icon="${icon}"></span>
            <span class="font-black text-slate-200 truncate">${ins.title}</span>
          </div>
          ${savingLabel}
        </div>
        <p class="text-[9px] text-slate-400 leading-snug">${ins.desc}</p>
        <div class="flex justify-end">
          <button onclick="applyInsightOptimization(${idx})" class="px-2 py-0.5 rounded bg-purple-600/20 border border-purple-500/20 hover:bg-purple-600 text-purple-200 hover:text-white transition-all text-[8px] font-black uppercase tracking-wider">
            ${ins.actionLabel}
          </button>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  
  if (container) container.innerHTML = html;
  if (optListEl) optListEl.innerHTML = html;

  if (typeof updateAnalystCommentary === "function" && currentTheme === "claude") {
    updateAnalystCommentary();
  }
}

function applyInsightOptimization(idx) {
  const ins = activeInsights[idx];
  if (!ins) return;

  const sub = subs.find(s => s.id === ins.targetId);
  
  if (ins.type === "redundancy") {
    subs = subs.filter(s => s.id !== ins.targetId);
    showToast(`Removed duplicate SaaS vendor: ${sub ? sub.name : 'Item'}`, "success");
  } else if (ins.type === "billing") {
    if (sub) {
      sub.cycle = "Yearly";
      sub.price = sub.price * 0.8;
      showToast(`Optimized ${sub.name}: switched to Yearly (20% discount applied)`, "success");
    }
  } else if (ins.type === "hygiene") {
    if (sub) {
      if (!sub.owner) sub.owner = "Sarah / CEO";
      if (!sub.funding) sub.funding = "Brex Corporate Card";
      showToast(`Secured ${sub.name}: Default owner & card assigned`, "success");
    }
  }

  save();
  recalculateAnalytics();
  renderList();
  renderActiveView();
}

// Role-Based Views Management
function toggleRoleMenu() {
  const menu = document.getElementById("role-menu");
  if (!menu) return;
  menu.classList.toggle("hidden");
}

function setRole(role) {
  currentRole = role;
  
  document.body.classList.remove("role-ceo", "role-cfo", "role-engineer");
  document.body.classList.add("role-" + role);
  
  const label = document.getElementById("current-role-label");
  if (label) {
    if (role === "ceo") label.innerText = "CEO View";
    else if (role === "engineer") label.innerText = "Eng Lead";
    else label.innerText = "CFO Cockpit";
  }
  
  localStorage.setItem("runwaymap_role", role);
  
  const menu = document.getElementById("role-menu");
  if (menu) menu.classList.add("hidden");
  
  toggleRoleInputRestrictions();

  renderList();
  renderActiveView();
  recalculateAnalytics();
}

function loadRole() {
  const saved = localStorage.getItem("runwaymap_role") || "cfo";
  setRole(saved);
}

function toggleRoleInputRestrictions() {
  // Disable inputs that engineers/CEOs shouldn't directly override
  const inputsToDisableForCeo = ["owner", "funding", "average-salary"];
  inputsToDisableForCeo.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (currentRole === "ceo") {
        el.setAttribute("disabled", "true");
        el.classList.add("ceo-read-only");
      } else {
        el.removeAttribute("disabled");
        el.classList.remove("ceo-read-only");
      }
    }
  });

  const inputsToDisableForEngineer = ["starting-cash", "cash-injections", "projected-hires", "average-salary"];
  inputsToDisableForEngineer.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (currentRole === "engineer") {
        el.setAttribute("disabled", "true");
      } else {
        el.removeAttribute("disabled");
      }
    }
  });
}

// Expose triggers globally
window.setRole = setRole;
window.toggleRoleMenu = toggleRoleMenu;
window.applyInsightOptimization = applyInsightOptimization;

// Close menus on click outside
document.addEventListener("click", (e) => {
  const roleBtn = document.getElementById("role-btn");
  const roleMenu = document.getElementById("role-menu");
  if (roleBtn && roleMenu && !roleBtn.contains(e.target) && !roleMenu.contains(e.target)) {
    roleMenu.classList.add("hidden");
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  loadTheme();
  loadRole();
  await window.initRates();
  load();
  loadCurrency();
  loadScenariosFromStorage();
  loadDeptBudgets();
  renderDeptBudgetsEditor();
  initColorPicker();
  initCurrencySelector();
  initFormCurrencySelector();
  renderPresets();
  setHubTab("analytics");

  // Restore collapsed states for cards from localStorage
  const collapsibleCards = [
    "modeling-sliders-card",
    "startup-templates-card",
    "active-saas-sidebar-card",
    "export-container",
    "cash-flow-chart-card",
    "operations-hub-card",
    "optimization-recommendations-card"
  ];
  collapsibleCards.forEach(cardId => {
    const card = document.getElementById(cardId);
    if (card) {
      card.classList.add("no-transition");
      toggleCardCollapse(cardId, true);
      setTimeout(() => {
        if (card) card.classList.remove("no-transition");
      }, 50);
    }
  });

  window.addEventListener("resize", renderCashFlowChart);

  const categorySelect = document.getElementById("category");
  if (categorySelect) {
    categorySelect.addEventListener("change", function(e) {
      const defaultColor = categoryColors[e.target.value] || "slate";
      pickColor(defaultColor);
    });
  }
  
  const indicator = document.getElementById("active-currency-indicator");
  if (indicator) {
    const curr = currencies[selectedCurrency];
    indicator.innerText = selectedCurrency + " (" + curr.symbol + ")";
  }
  
  const cashDisplay = document.getElementById("cash-display");
  if (cashDisplay) cashDisplay.innerText = formatCurrency(startingCash, 0);

  if (subs.length === 0) {
    loadStack('ai');
  } else {
    renderList();
    setView(currentView);
  }

  // Restore dashboard mode from localStorage
  const savedMode = localStorage.getItem("runwaymap_mode") || "basic";
  setDashboardMode(savedMode, true);

  // Initialize dynamic card reordering
  initCardReordering();
});

// Helper function to toggle card collapse and save state in localStorage
function toggleCardCollapse(cardId, isInitialLoad = false) {
  const card = document.getElementById(cardId);
  if (!card) return;

  let isCollapsed;
  if (isInitialLoad) {
    const savedState = localStorage.getItem("collapsed_" + cardId);
    isCollapsed = savedState === "true";
  } else {
    card.classList.toggle("collapsed");
    isCollapsed = card.classList.contains("collapsed");
    localStorage.setItem("collapsed_" + cardId, isCollapsed);
  }

  if (isCollapsed) {
    card.classList.add("collapsed");
  } else {
    card.classList.remove("collapsed");
  }

  // Update minus/plus icon inside the button
  const icon = document.getElementById("collapse-icon-" + cardId);
  if (icon) {
    icon.outerHTML = `<span class="iconify h-4 w-4" data-icon="${isCollapsed ? 'ph:plus-bold' : 'ph:minus-bold'}" id="collapse-icon-${cardId}"></span>`;
    // Re-trigger Iconify scan if loaded
    if (window.Iconify && typeof window.Iconify.scan === "function") {
      window.Iconify.scan();
    }
  }

  // If expanding, re-render charts and elements that rely on container width
  if (!isCollapsed && !isInitialLoad) {
    if (cardId === "cash-flow-chart-card") {
      if (typeof renderCashFlowChart === "function") {
        renderCashFlowChart();
        setTimeout(renderCashFlowChart, 100);
        setTimeout(renderCashFlowChart, 360); // fire again when transition finishes
      }
    } else if (cardId === "export-container") {
      if (typeof renderActiveView === "function") {
        renderActiveView();
        setTimeout(renderActiveView, 100);
        setTimeout(renderActiveView, 360);
      }
    }
  }
}

// Expose dashboard mode controllers globally
window.setDashboardMode = setDashboardMode;
window.updateAnalystCommentary = updateAnalystCommentary;

function setDashboardMode(mode, isInitialLoad = false) {
  document.body.classList.remove("mode-basic", "mode-pro");
  if (mode === "basic") {
    document.body.classList.add("mode-basic");
    if (typeof setView === "function") setView("treemap");
    if (typeof setRole === "function") setRole("cfo");
  } else {
    document.body.classList.add("mode-pro");
  }

  const btnBasic = document.getElementById("mode-btn-basic");
  const btnPro = document.getElementById("mode-btn-pro");
  if (btnBasic && btnPro) {
    if (mode === "basic") {
      btnBasic.classList.add("active");
      btnPro.classList.remove("active");
    } else {
      btnPro.classList.add("active");
      btnBasic.classList.remove("active");
    }
  }

  localStorage.setItem("runwaymap_mode", mode);

  if (!isInitialLoad) {
    if (typeof renderCashFlowChart === "function") renderCashFlowChart();
    if (typeof renderActiveView === "function") renderActiveView();
  }
}

function updateAnalystCommentary() {
  const contentEl = document.getElementById("analyst-commentary-content");
  if (!contentEl) return;

  let totalSaaSBurn = 0;
  let baseSaaSBurn = 0;
  const categoryCosts = {};

  subs.forEach(s => {
    const monthly = toMonthly(s);
    const baseMonthly = toMonthlyUnscaled(s);
    totalSaaSBurn += monthly;
    baseSaaSBurn += baseMonthly;
    categoryCosts[s.category] = (categoryCosts[s.category] || 0) + monthly;
  });

  const payrollBurn = projectedHires * averageSalary;
  const totalBurn = totalSaaSBurn + payrollBurn;
  const totalCash = startingCash + cashInjections;
  const runwayMonths = totalBurn > 0 ? (totalCash / totalBurn) : Infinity;

  const costDistribution = [];
  if (payrollBurn > 0) {
    costDistribution.push({ name: "Payroll & Headcount", cost: payrollBurn });
  }
  for (const cat in categoryCosts) {
    if (categoryCosts[cat] > 0) {
      costDistribution.push({ name: "SaaS: " + cat, cost: categoryCosts[cat] });
    }
  }
  costDistribution.sort((a, b) => b.cost - a.cost);

  let distributionLines = "";
  costDistribution.forEach(item => {
    const pct = totalBurn > 0 ? Math.round((item.cost / totalBurn) * 100) : 0;
    distributionLines += `   * ${item.name.padEnd(28)} : ${pct}% (${formatCurrency(item.cost, 0)}/mo)\n`;
  });
  if (!distributionLines) {
    distributionLines = "   * No active expenses detected.\n";
  }

  let largestSub = null;
  let largestCost = 0;
  subs.forEach(s => {
    const cost = toMonthly(s);
    if (cost > largestCost) {
      largestCost = cost;
      largestSub = s;
    }
  });

  // Health Score Calculation
  const health = calculateHealthScore();

  let riskSection = "";
  if (largestSub) {
    const concPct = totalSaaSBurn > 0 ? Math.round((largestCost / totalSaaSBurn) * 100) : 0;
    const shockCost = largestCost * 0.20;
    const simulatedBurn = totalBurn + shockCost;
    const simulatedRunway = simulatedBurn > 0 ? (totalCash / simulatedBurn) : Infinity;
    const runwayLoss = (runwayMonths !== Infinity && simulatedRunway !== Infinity) 
      ? (runwayMonths - simulatedRunway).toFixed(1) 
      : "0.0";

    riskSection = `* Largest Vendor: <span>${largestSub.name}</span> (${formatCurrency(largestCost, 0)}/mo)
   * Concentration : <span>${concPct}%</span> of total SaaS burn
   * Shock Scenario: If ${largestSub.name} cost spikes 20% (+${formatCurrency(shockCost, 0)}/mo):
     - Simulated Burn rises to <span>${formatCurrency(simulatedBurn, 0)}</span>/mo
     - Runway drops to <span>${simulatedRunway === Infinity ? 'Infinite' : simulatedRunway.toFixed(1) + ' months'}</span> (-${runwayLoss} mo)`;
  } else {
    riskSection = `* Largest Vendor: None
   * Concentration : 0%
   * Shock Scenario: No vendors to simulate price shock.`;
  }

  const totalSaving = activeInsights.reduce((sum, ins) => sum + ins.saving * 12, 0);
  const redundancyCount = activeInsights.filter(ins => ins.type === "redundancy").length;
  const billingCount = activeInsights.filter(ins => ins.type === "billing").length;
  const hygieneCount = activeInsights.filter(ins => ins.type === "hygiene").length;

  let recommendationsHtml = "";
  if (activeInsights.length > 0) {
    recommendationsHtml = `* Potential ARR Savings: <span>${formatCurrency(totalSaving, 0)}/year</span>
   * Summary of optimization opportunities:
     - ${redundancyCount} Redundant vendor overlaps detected
     - ${billingCount} Monthly-to-yearly discount opportunities
     - ${hygieneCount} Data hygiene flags (missing metadata)`;
  } else {
    recommendationsHtml = `* Potential ARR Savings: <span>$0/year</span>
   * Summary of optimization opportunities:
     - Stack is lean. All checks green.`;
  }

  const reportText = `--------------------------------------------------
[FINANCIAL ANALYSIS & STRESS TEST REPORT]
--------------------------------------------------
1. CAPITAL & RUNWAY OVERVIEW
   * Available Liquidity (Cash + Inj) : <span>${formatCurrency(totalCash, 0)}</span>
   * Monthly Operating Outflow        : <span>${formatCurrency(totalBurn, 0)}/mo</span> (SaaS: ${formatCurrency(totalSaaSBurn, 0)} | Payroll: ${formatCurrency(payrollBurn, 0)})
   * Net Runway Projection            : <span>${runwayMonths === Infinity ? 'Infinite' : runwayMonths.toFixed(1) + ' months'}</span>

2. SHARE OF TOTAL OUTFLOW
${distributionLines}
3. FINANCIAL HEALTH SCORE: <span>${health.score}/100</span>
   * Runway Score Durability    : ${health.runwayScore}/35
   * Vendor Concentration       : ${health.concentrationScore}/20 (Largest: ${largestSub ? largestSub.name : 'None'})
   * Renewal Clustering Risk    : ${health.renewalClusteringScore}/15 (${health.renewalsNext7Days} renewing in 7 days)
   * Department Budget Caps     : ${health.departmentScore}/15 (${health.overBudgetCount} over budget)
   * Capital Growth & Buffer    : ${health.growthScore}/15

4. VENDOR CONCENTRATION & SHOCK ANALYSIS
   ${riskSection}

5. OPERATIONAL EFFICIENCY RECOMMENDATIONS
   ${recommendationsHtml}
--------------------------------------------------`;

  contentEl.innerHTML = `<pre class="whitespace-pre-wrap leading-relaxed">${reportText}</pre>`;
}

// Dynamic Card Reordering System
function initCardReordering() {
  const container = document.getElementById("dashboard-cards-container");
  if (!container) return;

  const cards = container.querySelectorAll(".glass-card[id]");
  
  cards.forEach(card => {
    const header = card.querySelector("h3");
    if (!header) return;

    // Find or create the drag handle inside the action group
    const actionGroup = header.querySelector(".flex.items-center.gap-2");
    if (actionGroup && !actionGroup.querySelector(".drag-handle")) {
      const handle = document.createElement("div");
      handle.className = "drag-handle cursor-grab text-slate-500 hover:text-slate-300 p-1 rounded transition-colors flex items-center justify-center";
      handle.title = "Drag to Reorder";
      handle.innerHTML = '<span class="iconify h-4 w-4" data-icon="ph:dots-six-vertical-bold"></span>';
      
      // Toggle draggable state on mouse down/up on the handle to prevent accidental selection/input drag issues
      handle.addEventListener("mousedown", () => {
        card.setAttribute("draggable", "true");
      });
      handle.addEventListener("mouseup", () => {
        card.setAttribute("draggable", "false");
      });
      
      // Prepend to action buttons group
      actionGroup.insertBefore(handle, actionGroup.firstChild);
    }

    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", card.id);
      card.classList.add("opacity-50");
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("opacity-50");
      card.setAttribute("draggable", "false");
      saveCardOrder();
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingCard = container.querySelector(".opacity-50");
      if (!draggingCard || draggingCard === card) return;

      const bounding = card.getBoundingClientRect();
      const offset = e.clientY - bounding.top - (bounding.height / 2);
      
      if (offset > 0) {
        card.after(draggingCard);
      } else {
        card.before(draggingCard);
      }
    });
  });

  loadCardOrder();
}

function saveCardOrder() {
  const container = document.getElementById("dashboard-cards-container");
  if (!container) return;
  const cards = container.querySelectorAll(".glass-card[id]");
  const order = Array.from(cards).map(c => c.id);
  localStorage.setItem("runwaymap_card_order", JSON.stringify(order));
}

function loadCardOrder() {
  const container = document.getElementById("dashboard-cards-container");
  if (!container) return;
  const saved = localStorage.getItem("runwaymap_card_order");
  if (!saved) return;
  try {
    const order = JSON.parse(saved);
    order.forEach(id => {
      const card = document.getElementById(id);
      if (card && card.parentElement === container) {
        container.appendChild(card);
      }
    });
  } catch (e) {
    console.error("Failed to load card order:", e);
  }
}
