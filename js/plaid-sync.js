// Plaid Bank Feeds Synchronizer Controller

let selectedPlaidBankId = null;

function openPlaidSync() {
  // Reset steps
  document.getElementById("plaid-step-1").classList.remove("hidden");
  document.getElementById("plaid-step-2").classList.add("hidden");
  document.getElementById("plaid-step-3").classList.add("hidden");

  document.getElementById("plaid-username").value = "";
  document.getElementById("plaid-password").value = "";

  const backdrop = document.getElementById("plaid-backdrop");
  const panel = document.getElementById("plaid-panel");
  const inner = panel ? panel.querySelector("div") : null;

  if (backdrop) backdrop.classList.remove("hidden");
  if (panel) panel.classList.remove("hidden");

  requestAnimationFrame(() => {
    if (backdrop) backdrop.classList.remove("opacity-0");
    if (inner) {
      inner.classList.remove("translate-y-full", "sm:scale-95", "opacity-0");
      inner.classList.add("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
    }
  });
}

function closePlaidSync() {
  const backdrop = document.getElementById("plaid-backdrop");
  const panel = document.getElementById("plaid-panel");
  const inner = panel ? panel.querySelector("div") : null;

  if (backdrop) backdrop.classList.add("opacity-0");
  if (inner) {
    inner.classList.remove("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
    inner.classList.add("translate-y-full", "sm:scale-95", "opacity-0");
  }

  setTimeout(() => {
    if (backdrop) backdrop.classList.add("hidden");
    if (panel) panel.classList.add("hidden");
  }, 300);
}

function selectPlaidBank(bankName, bankId) {
  selectedPlaidBankId = bankId;
  
  // Set details inside credentials form
  const nameEl = document.getElementById("plaid-selected-name");
  const iconEl = document.getElementById("plaid-selected-icon");

  if (nameEl) nameEl.innerText = bankName;

  if (iconEl) {
    iconEl.innerText = bankName.split(" ").map(w => w[0]).join("").slice(0, 2);
    if (bankId === "svb") {
      iconEl.className = "h-7 w-7 rounded flex items-center justify-center font-black text-white text-xs shrink-0 bg-blue-600";
    } else if (bankId === "mercury") {
      iconEl.className = "h-7 w-7 rounded flex items-center justify-center font-black text-white text-xs shrink-0 bg-black border border-white/10";
    } else if (bankId === "brex") {
      iconEl.className = "h-7 w-7 rounded flex items-center justify-center font-black text-white text-xs shrink-0 bg-orange-600";
    }
  }

  // Switch steps
  document.getElementById("plaid-step-1").classList.add("hidden");
  document.getElementById("plaid-step-2").classList.remove("hidden");
}

function submitPlaidConnect() {
  const user = document.getElementById("plaid-username").value.trim();
  const pass = document.getElementById("plaid-password").value;

  if (!user || !pass) {
    if (typeof showToast === "function") {
      showToast("Please enter connection credentials", "error");
    }
    return;
  }

  // Switch to loading animation
  document.getElementById("plaid-step-2").classList.add("hidden");
  document.getElementById("plaid-step-3").classList.remove("hidden");

  // Simulate Plaid transaction fetching (2 seconds delay)
  setTimeout(() => {
    let mockName = "Bank Feed";
    let mockAccount = "Primary Treasury";
    let mockCards = "Operations Card";
    
    if (selectedPlaidBankId === "svb") {
      mockName = "Silicon Valley Bank";
      mockAccount = "SVB Venture Debt checking";
      mockCards = "SVB Master Card";
    } else if (selectedPlaidBankId === "mercury") {
      mockName = "Mercury Bank";
      mockAccount = "Mercury Checking";
      mockCards = "Mercury Corporate Card";
    } else if (selectedPlaidBankId === "brex") {
      mockName = "Brex Card";
      mockAccount = "Brex Cash Reserve";
      mockCards = "Brex Card Rewards";
    }

    const mockTransactions = [
      {
        name: "Notion Premium",
        price: 36.00,
        cycle: "Monthly",
        category: "Collaboration",
        url: "notion.so",
        owner: "Product Team / Sarah",
        funding: mockCards,
        date: "2026-06-05",
        color: "slate",
        department: "Product"
      },
      {
        name: "Figma Team Plan",
        price: 90.00,
        cycle: "Monthly",
        category: "Collaboration",
        url: "figma.com",
        owner: "Design / Sarah",
        funding: mockCards,
        date: "2026-06-08",
        color: "pink",
        department: "Product"
      },
      {
        name: "Snowflake Cloud",
        price: 450.00,
        cycle: "Monthly",
        category: "Infrastructure",
        url: "snowflake.com",
        owner: "Data Infra / Vu Nguyen",
        funding: mockCards,
        date: "2026-06-01",
        color: "cyan",
        department: "Engineering"
      }
    ];

    let addedCount = 0;
    mockTransactions.forEach((txn, idx) => {
      // Check if already in active stack to prevent infinite duplicate stacks
      const exists = subs.some(s => s.name.toLowerCase() === txn.name.toLowerCase());
      if (!exists) {
        txn.id = Date.now().toString() + idx + Math.random().toString(36).slice(2);
        txn.currency = "USD";
        txn.isSeatBased = false;
        subs.push(txn);
        addedCount++;
      }
    });

    closePlaidSync();

    if (typeof showToast === "function") {
      if (addedCount > 0) {
        showToast(`Linked ${mockName}: Imported ${addedCount} active subscriptions!`, "success");
      } else {
        showToast(`Linked ${mockName}: Feeds synchronized (no new items)`, "info");
      }
    }

    // Save and re-render dashboard
    if (typeof save === "function") save();
    if (typeof recalculateAnalytics === "function") recalculateAnalytics();
    if (typeof renderList === "function") renderList();
    if (typeof renderActiveView === "function") renderActiveView();

  }, 2000);
}

document.addEventListener("DOMContentLoaded", () => {
  const backdrop = document.getElementById("plaid-backdrop");
  const panel = document.getElementById("plaid-panel");
  const inner = panel ? panel.querySelector("div") : null;

  if (backdrop) backdrop.addEventListener("click", closePlaidSync);
  if (panel) {
    panel.addEventListener("click", closePlaidSync);
    if (inner) inner.addEventListener("click", (e) => e.stopPropagation());
  }
});
