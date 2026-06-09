let csvData = [];
let csvHeaders = [];
let detectedSubs = [];
let otherTransactions = [];
let otherExpanded = false;

const bankBackdrop = document.getElementById("bank-import-backdrop");
const bankPanel = document.getElementById("bank-import-panel");
const bankInner = bankPanel ? bankPanel.querySelector("div") : null;

function openBankImport() {
  document.getElementById("bank-step-1").classList.remove("hidden");
  document.getElementById("bank-step-2").classList.add("hidden");
  document.getElementById("bank-step-3").classList.add("hidden");
  document.getElementById("bank-csv-input").value = "";

  csvData = [];
  csvHeaders = [];
  detectedSubs = [];
  otherTransactions = [];
  otherExpanded = false;

  if (bankBackdrop) bankBackdrop.classList.remove("hidden");
  if (bankPanel) bankPanel.classList.remove("hidden");

  requestAnimationFrame(function() {
    if (bankBackdrop) bankBackdrop.classList.remove("opacity-0");
    if (bankInner) {
      bankInner.classList.remove("translate-y-full", "sm:scale-95", "opacity-0");
      bankInner.classList.add("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
    }
  });
}

function closeBankImport() {
  if (bankBackdrop) bankBackdrop.classList.add("opacity-0");

  if (bankInner) {
    bankInner.classList.remove("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
    bankInner.classList.add("translate-y-full", "sm:scale-95", "opacity-0");
  }

  setTimeout(function() {
    if (bankBackdrop) bankBackdrop.classList.add("hidden");
    if (bankPanel) bankPanel.classList.add("hidden");
  }, 300);
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  function parseLine(line) {
    const fields = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];

      if (ch === '"') {
        insideQuotes = !insideQuotes;
      } else if (ch === "," && !insideQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    const hasData = row.some(cell => cell !== "");
    if (hasData) rows.push(row);
  }

  return { headers: headers, rows: rows };
}

function handleBankCSV(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    const parsed = parseCSV(e.target.result);
    const headers = parsed.headers;
    const rows = parsed.rows;

    if (headers.length < 3 || rows.length < 1) {
      showToast("Invalid CSV file. Make sure it has headers and transaction data.", "error");
      return;
    }

    csvHeaders = headers;
    csvData = rows;

    let optionsHtml = "";
    for (let i = 0; i < headers.length; i++) {
      optionsHtml += '<option value="' + i + '">' + headers[i] + '</option>';
    }

    const dateSelect = document.getElementById("map-date");
    const descSelect = document.getElementById("map-description");
    const amountSelect = document.getElementById("map-amount");

    dateSelect.innerHTML = optionsHtml;
    descSelect.innerHTML = optionsHtml;
    amountSelect.innerHTML = optionsHtml;

    const lowerHeaders = headers.map(h => h.toLowerCase());

    let dateIdx = -1;
    let descIdx = -1;
    let amountIdx = -1;

    for (let i = 0; i < lowerHeaders.length; i++) {
      const h = lowerHeaders[i];
      if (dateIdx < 0 && (h.includes("date") || h.includes("posted") || h.includes("time"))) {
        dateIdx = i;
      }
      if (descIdx < 0 && (h.includes("description") || h.includes("payee") || h.includes("merchant") || h.includes("name") || h.includes("memo") || h.includes("details"))) {
        descIdx = i;
      }
      if (amountIdx < 0 && (h.includes("amount") || h.includes("debit") || h.includes("withdrawal") || h.includes("charge") || h.includes("payment"))) {
        amountIdx = i;
      }
    }

    if (dateIdx >= 0) dateSelect.value = dateIdx;
    if (descIdx >= 0) descSelect.value = descIdx;
    if (amountIdx >= 0) amountSelect.value = amountIdx;

    updateCSVPreview();

    dateSelect.onchange = updateCSVPreview;
    descSelect.onchange = updateCSVPreview;
    amountSelect.onchange = updateCSVPreview;

    document.getElementById("csv-row-count").textContent = rows.length;
    document.getElementById("bank-step-1").classList.add("hidden");
    document.getElementById("bank-step-2").classList.remove("hidden");
  };

  reader.readAsText(file);
}

function updateCSVPreview() {
  const dateCol = parseInt(document.getElementById("map-date").value);
  const descCol = parseInt(document.getElementById("map-description").value);
  const amtCol = parseInt(document.getElementById("map-amount").value);

  const previewEl = document.getElementById("csv-preview");

  let html = "";
  const sampleRows = csvData.slice(0, 3);

  for (let i = 0; i < sampleRows.length; i++) {
    const row = sampleRows[i];
    html += '<div class="flex justify-between py-1 border-b border-white/5 last:border-0">';
    html += '<span class="text-slate-500 w-20 shrink-0">' + (row[dateCol] || "-") + '</span>';
    html += '<span class="flex-1 truncate px-2 text-slate-300">' + (row[descCol] || "-") + '</span>';
    html += '<span class="text-slate-100 font-medium">' + (row[amtCol] || "-") + '</span>';
    html += '</div>';
  }

  previewEl.innerHTML = html;
}

function detectRecurring() {
  const dateCol = parseInt(document.getElementById("map-date").value);
  const descCol = parseInt(document.getElementById("map-description").value);
  const amtCol = parseInt(document.getElementById("map-amount").value);

  const transactions = [];
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const rawAmt = row[amtCol] ? row[amtCol].replace(/[^0-9.-]/g, "") : "0";
    const amount = Math.abs(parseFloat(rawAmt));
    const date = new Date(row[dateCol]);
    const desc = row[descCol] ? row[descCol].trim() : "";

    if (!desc || isNaN(amount) || amount <= 0 || isNaN(date.getTime())) continue;

    transactions.push({ date: date, description: desc, amount: amount });
  }

  function normalizeDesc(str) {
    return str
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b(INC|LLC|LTD|CORP|CO|PAYMENT|PURCHASE|POS|ACH|DEBIT)\b/g, "")
      .trim()
      .split(" ")
      .slice(0, 3)
      .join(" ");
  }

  const groups = {};
  for (let i = 0; i < transactions.length; i++) {
    const txn = transactions[i];
    const key = normalizeDesc(txn.description);
    if (!key) continue;

    if (!groups[key]) {
      groups[key] = { txns: [], names: new Set() };
    }
    groups[key].txns.push(txn);
    groups[key].names.add(txn.description);
  }

  const recurring = [];
  const groupKeys = Object.keys(groups);

  for (let g = 0; g < groupKeys.length; g++) {
    const key = groupKeys[g];
    const group = groups[key];

    if (group.txns.length < 2) continue;

    group.txns.sort(function(a, b) { return a.date - b.date; });

    let totalDays = 0;
    for (let i = 1; i < group.txns.length; i++) {
      const daysBetween = Math.round((group.txns[i].date - group.txns[i-1].date) / (1000 * 60 * 60 * 24));
      totalDays += daysBetween;
    }
    const avgDays = totalDays / (group.txns.length - 1);

    let cycle = null;
    if (avgDays >= 6 && avgDays <= 8) cycle = "Weekly";
    else if (avgDays >= 13 && avgDays <= 16) cycle = "Biweekly";
    else if (avgDays >= 25 && avgDays <= 35) cycle = "Monthly";
    else if (avgDays >= 85 && avgDays <= 100) cycle = "Quarterly";
    else if (avgDays >= 355 && avgDays <= 375) cycle = "Yearly";

    if (!cycle) continue;

    let totalAmount = 0;
    for (let i = 0; i < group.txns.length; i++) {
      totalAmount += group.txns[i].amount;
    }
    const avgAmt = totalAmount / group.txns.length;

    let isConsistent = true;
    for (let i = 0; i < group.txns.length; i++) {
      const variance = Math.abs(group.txns[i].amount - avgAmt) / avgAmt;
      if (variance >= 0.2) {
        isConsistent = false;
        break;
      }
    }
    if (!isConsistent) continue;

    const nameCount = {};
    for (const name of group.names) {
      nameCount[name] = (nameCount[name] || 0) + 1;
    }
    let bestName = "";
    let bestCount = 0;
    for (const name in nameCount) {
      if (nameCount[name] > bestCount) {
        bestCount = nameCount[name];
        bestName = name;
      }
    }

    recurring.push({
      name: bestName,
      price: Math.round(avgAmt * 100) / 100,
      cycle: (cycle === "Biweekly" || cycle === "Quarterly") ? "Monthly" : cycle,
      count: group.txns.length,
      selected: true
    });
  }

  recurring.sort(function(a, b) {
    if (b.count !== a.count) return b.count - a.count;
    return b.price - a.price;
  });

  const detectedNames = new Set();
  for (let i = 0; i < recurring.length; i++) {
    detectedNames.add(recurring[i].name.toUpperCase());
  }

  const otherMap = {};
  for (let i = 0; i < transactions.length; i++) {
    const txn = transactions[i];
    if (detectedNames.has(txn.description.toUpperCase())) continue;

    if (!otherMap[txn.description]) {
      otherMap[txn.description] = { name: txn.description, price: txn.amount, count: 0 };
    }
    otherMap[txn.description].count++;
    otherMap[txn.description].price = txn.amount;
  }

  const otherList = [];
  for (const key in otherMap) {
    const item = otherMap[key];
    if (item.price > 0 && item.price < 500) {
      otherList.push(item);
    }
  }
  otherList.sort(function(a, b) {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  detectedSubs = recurring;
  otherTransactions = otherList;
  otherExpanded = false;

  renderDetectedList();
  renderOtherTransactions();

  document.getElementById("bank-step-2").classList.add("hidden");
  document.getElementById("bank-step-3").classList.remove("hidden");
}

function renderDetectedList() {
  const listEl = document.getElementById("detected-list");
  const noResultsEl = document.getElementById("no-detected");
  const addBtn = document.getElementById("add-selected-btn");

  document.getElementById("detected-count").textContent = detectedSubs.length;

  if (detectedSubs.length === 0) {
    listEl.classList.add("hidden");
    noResultsEl.classList.remove("hidden");
    addBtn.classList.add("hidden");
    return;
  }

  listEl.classList.remove("hidden");
  noResultsEl.classList.add("hidden");
  addBtn.classList.remove("hidden");

  let html = "";
  for (let i = 0; i < detectedSubs.length; i++) {
    const sub = detectedSubs[i];
    const ringClass = sub.selected ? " ring-1 ring-purple-500 border-purple-500/50" : "";
    const checked = sub.selected ? " checked" : "";

    html += '<label class="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-3 cursor-pointer hover:bg-slate-900 transition-colors text-slate-200' + ringClass + '">';
    html += '<input type="checkbox"' + checked + ' onchange="toggleDetectedSub(' + i + ')" class="h-5 w-5 rounded border-white/10 bg-slate-950 text-purple-600 focus:ring-purple-500">';
    html += '<div class="flex-1 min-w-0">';
    html += '<div class="font-semibold text-slate-100 text-xs truncate">' + sub.name + '</div>';
    html += '<div class="text-[10px] text-slate-500">' + sub.cycle + ' · Found ' + sub.count + 'x</div>';
    html += '</div>';
    html += '<div class="text-xs font-bold text-slate-200">$' + sub.price.toFixed(2) + '</div>';
    html += '</label>';
  }

  listEl.innerHTML = html;
  updateAddButtonText();
}

function toggleDetectedSub(idx) {
  detectedSubs[idx].selected = !detectedSubs[idx].selected;
  renderDetectedList();
}

function toggleOtherTransactions() {
  otherExpanded = !otherExpanded;

  var container = document.getElementById("other-transactions");
  var caret = document.getElementById("other-caret");

  if (otherExpanded) {
    container.classList.remove("hidden");
    caret.style.transform = "rotate(180deg)";
  } else {
    container.classList.add("hidden");
    caret.style.transform = "";
  }
}

function renderOtherTransactions(searchFilter) {
  const listEl = document.getElementById("other-list");
  document.getElementById("other-count").textContent = otherTransactions.length;

  let filtered = otherTransactions;
  if (searchFilter && searchFilter.length > 0) {
    const q = searchFilter.toLowerCase();
    filtered = otherTransactions.filter(function(t) {
      return t.name.toLowerCase().includes(q);
    });
  }

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="text-[10px] text-slate-500 text-center py-3">No transactions found</div>';
    return;
  }

  let html = "";
  const limit = Math.min(filtered.length, 50);

  for (let i = 0; i < limit; i++) {
    const txn = filtered[i];
    const origIdx = otherTransactions.indexOf(txn);

    html += '<button onclick="addFromOther(' + origIdx + ')" class="flex w-full items-center justify-between rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2 text-left text-xs transition-colors hover:border-purple-500/20 hover:bg-slate-900">';
    html += '<div class="flex-1 min-w-0">';
    html += '<div class="font-bold text-slate-300 truncate">' + txn.name + '</div>';
    html += '<div class="text-[10px] text-slate-500">' + txn.count + 'x in statement</div>';
    html += '</div>';
    html += '<div class="flex items-center gap-2">';
    html += '<span class="font-bold text-slate-100">$' + txn.price.toFixed(2) + '</span>';
    html += '<span class="iconify h-4 w-4 text-purple-400" data-icon="ph:plus-circle-bold"></span>';
    html += '</div></button>';
  }

  listEl.innerHTML = html;
}

function filterOtherTransactions(q) {
  renderOtherTransactions(q);
}

function addFromOther(idx) {
  const txn = otherTransactions[idx];
  if (!txn) return;

  detectedSubs.push({
    name: txn.name,
    price: txn.price,
    cycle: "Monthly",
    count: txn.count,
    selected: true
  });

  otherTransactions.splice(idx, 1);
  renderDetectedList();
  renderOtherTransactions();
}

function updateAddButtonText() {
  let selectedCount = 0;
  for (let i = 0; i < detectedSubs.length; i++) {
    if (detectedSubs[i].selected) selectedCount++;
  }

  const btn = document.getElementById("add-selected-btn");

  if (selectedCount > 0) {
    const plural = selectedCount > 1 ? "s" : "";
    btn.textContent = "Add " + selectedCount + " SaaS Item" + plural;
    btn.disabled = false;
    btn.classList.remove("opacity-50", "cursor-not-allowed");
  } else {
    btn.textContent = "Add Selected";
    btn.disabled = true;
    btn.classList.add("opacity-50", "cursor-not-allowed");
  }
}

const classificationRules = [
  { match: ["aws", "amazon web", "ec2"], category: "Infrastructure", url: "aws.amazon.com", color: "cyan" },
  { match: ["vercel", "netlify", "heroku", "github", "gitlab"], category: "Dev Tools", url: "github.com", color: "purple" },
  { match: ["openai", "chatgpt", "anthropic", "claude", "midjourney", "pinecone", "supabase"], category: "AI / API", url: "openai.com", color: "orange" },
  { match: ["slack", "zoom", "figma", "notion", "google", "workspace", "gsuite"], category: "Collaboration", url: "slack.com", color: "pink" },
  { match: ["sentry", "cloudflare", "datadog", "auth0", "1password"], category: "Security / Ops", url: "sentry.io", color: "rose" },
  { match: ["hubspot", "mailchimp", "stripe", "salesforce", "activecampaign"], category: "Marketing / Sales", url: "hubspot.com", color: "green" }
];

function classifyMerchant(rawName) {
  const name = rawName.toLowerCase();
  for (const rule of classificationRules) {
    for (const phrase of rule.match) {
      if (name.includes(phrase)) {
        return { category: rule.category, url: rule.url, color: rule.color };
      }
    }
  }
  return { category: "Infrastructure", url: "", color: randColor().id };
}

function addSelectedSubscriptions() {
  const toAdd = detectedSubs.filter(function(s) { return s.selected; });
  if (toAdd.length === 0) return;

  for (let i = 0; i < toAdd.length; i++) {
    const sub = toAdd[i];
    const cleanedName = cleanSubscriptionName(sub.name);
    const classification = classifyMerchant(cleanedName);
    subs.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2) + i,
      name: cleanedName,
      price: sub.price,
      isSeatBased: false,
      currency: selectedCurrency,
      cycle: sub.cycle,
      url: classification.url,
      color: classification.color,
      category: classification.category
    });
  }

  save();
  closeBankImport();

  const plural = toAdd.length > 1 ? "s" : "";
  showToast("Added " + toAdd.length + " SaaS item" + plural + " from statement!", "success");
}

function cleanSubscriptionName(rawName) {
  let name = rawName
    .replace(/\*+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b(PURCHASE|POS|ACH|DEBIT|RECURRING|PAYMENT)\b/gi, "")
    .trim();

  const words = name.split(" ");
  for (let i = 0; i < words.length; i++) {
    if (words[i].length > 0) {
      words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
    }
  }

  return words.join(" ").substring(0, 30);
}
