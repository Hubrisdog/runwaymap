// RunwayMap Interactive Cockpit Onboarding Tour Guide

const basicTourSteps = [
  {
    title: "Welcome to RunwayMap (Basic Mode)!",
    text: "Before you hire, subscribe, or cut costs, see exactly how it affects your runway. RunwayMap is an interactive financial cockpit that helps you predict how spending decisions affect your runway. Let's take a quick walkthrough of the core features.",
    target: null,
    position: "center",
    action: () => {}
  },
  {
    title: "Theme & Currency Switcher",
    text: "Adjust your workspace settings:<ul><li><b>Theme Switcher:</b> Toggle between Space Obsidian, Alabaster Light, and Analyst Mode.</li><li><b>Currency Selector:</b> Convert all metrics dynamically.</li></ul>",
    target: "#theme-btn",
    position: "bottom",
    action: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  {
    title: "Core KPI Scorecards",
    text: "Monitor your primary metrics:<ul><li><b>Monthly Burn:</b> Combined SaaS and payroll expenses.</li><li><b>Runway Remaining:</b> Months of cash runway.</li><li><b>Financial Health Score:</b> Multi-factor health status rating.</li><li><b>Top Cost Drivers:</b> Quick list of your highest expenses.</li></ul>",
    target: "#scorecards-grid",
    position: "bottom",
    action: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  {
    title: "What-If Simulation Engine",
    text: "Test capital decisions in real-time:<ul><li><b>Starting Cash:</b> Set your runway capital baseline.</li><li><b>Scale Team Seats:</b> Simulates scaling seat-based SaaS subscriptions as your team grows.</li></ul>",
    target: "#modeling-sliders-card",
    position: "right",
    action: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  {
    title: "Startup Stack Templates",
    text: "Load baseline SaaS configurations instantly (Solo Founder, AI Startup, Dev Agency templates).",
    target: "#startup-templates-card",
    position: "right",
    action: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  {
    title: "Active SaaS Stacks",
    text: "This sidebar displays your active SaaS costs with live renewal countdown pills. Click **Add Item** or any listed item to edit its billing cycle, renewal date, and owner.",
    target: "#active-saas-sidebar-card",
    position: "right",
    action: () => {
      document.getElementById("active-saas-sidebar-card").scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  {
    title: "Add or Edit SaaS Expense",
    text: "Customize individual tools, prices, billing cycles (Weekly, Monthly, Yearly), and toggle seat-based scaling.",
    target: "#modal-panel > div",
    position: "right",
    action: () => {
      if (typeof openModal === "function") openModal();
    }
  },
  {
    title: "SaaS Catalog Browser",
    text: "Browse through pre-loaded industry standards. Click any vendor (like Slack, GitHub, or Snowflake) to pre-populate name, logo, category, and color in the editor.",
    target: "#presets-panel > div",
    position: "right",
    action: () => {
      if (typeof closeModal === "function") closeModal();
      if (typeof openPresetsBrowser === "function") openPresetsBrowser();
    }
  },
  {
    title: "Operations Hub: Budget & Analytics",
    text: "In the **Analytics** tab:<ul><li><b>Burn Budget Limit:</b> Drag the slider to set a global monthly threshold.</li><li><b>Category Share:</b> Displays breakdown of your SaaS spend.</li></ul>",
    target: "#operations-hub-card",
    position: "top",
    action: () => {
      if (typeof closePresetsBrowser === "function") closePresetsBrowser();
      if (typeof setHubTab === "function") setHubTab("analytics");
      document.getElementById("operations-hub-card").scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  {
    title: "Export High-Fidelity Reports",
    text: "Export your cockpit summaries:<ul><li><b>Export Chart:</b> Download the active Treemap as a PNG.</li><li><b>Export CFO PDF:</b> Generate a clean, boardroom-ready vector PDF report.</li></ul>",
    target: "#theme-btn",
    position: "bottom",
    action: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  {
    title: "Basic Tour Complete!",
    text: "You've completed the Basic Mode walkthrough. Toggle **Pro Mode** in the header anytime to unlock scenario saves, A/B comparison matrixes, Plaid bank syncs, renewal calendars, Slack webhook simulators, and department budget caps!",
    target: null,
    position: "center",
    action: () => {}
  }
];

const proTourSteps = [
  {
    title: "Welcome to RunwayMap (Pro Mode)!",
    text: "Before you hire, subscribe, or cut costs, see exactly how it affects your runway. RunwayMap is an interactive financial cockpit that helps you predict how spending decisions affect your runway. Let's explore the advanced forecasting tools.",
    target: null,
    position: "center",
    action: () => {}
  },
  {
    title: "Theme & Currency Switcher",
    text: "Use these controls to adjust theme layouts (Obsidian, Alabaster, and monospaced Analyst Mode) and dynamically convert currencies.",
    target: "#theme-btn",
    position: "bottom",
    action: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  {
    title: "Core KPI Scorecards",
    text: "Monitor monthly burn, runway, Financial Health (out of 100), and top cost drivers. Monospace math traces are displayed here under Analyst Mode.",
    target: "#scorecards-grid",
    position: "bottom",
    action: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  {
    title: "What-If Simulation Engine",
    text: "Model capital decisions in real-time. Adjust **Starting Cash**, **Scale Team Seats**, **Hiring Pipelines**, and **API / Infrastructure usage surges** to see direct runway months gains or losses.",
    target: "#modeling-sliders-card",
    position: "right",
    action: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  {
    title: "A/B Simulation Scenarios",
    text: "Save scenario slider states (e.g. 'Lean Survival Model' or 'Venture Expansion') to compare different business strategies.",
    target: "#scenario-name-input",
    position: "right",
    action: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  {
    title: "Scenario Comparison Matrix",
    text: "Clicking <b>Compare Matrix</b> opens a detailed table comparing starting cash, seats, hiring, surges, and positive/negative deltas for runway, burn, and capital efficiency.",
    target: "#compare-panel > div",
    position: "left",
    action: () => {
      if (typeof openCompareDrawer === "function") openCompareDrawer();
    }
  },
  {
    title: "Startup Stack Templates",
    text: "Load baseline SaaS configurations instantly (Solo Founder, AI Startup, Dev Agency templates).",
    target: "#startup-templates-card",
    position: "right",
    action: () => {
      if (typeof closeCompareDrawer === "function") closeCompareDrawer();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  {
    title: "Active SaaS Stacks",
    text: "This sidebar displays active SaaS costs with owner tags, renewal countdown pills, card sources, and Plaid statements sync buttons.",
    target: "#active-saas-sidebar-card",
    position: "right",
    action: () => {
      document.getElementById("active-saas-sidebar-card").scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  {
    title: "Add or Edit SaaS Expense",
    text: "Add custom tools. Assign specific owners, corporate credit cards, departments, billing cycles, and toggle seat-based scaling.",
    target: "#modal-panel > div",
    position: "right",
    action: () => {
      if (typeof openModal === "function") openModal();
    }
  },
  {
    title: "Automated Bank CSV Importer",
    text: "Drag and drop bank statements. RunwayMap runs transactions through a pattern matching classifier (e.g. 'AMZN' &rarr; AWS) to auto-fill categories, domains, and colors.",
    target: "#bank-import-panel > div",
    position: "right",
    action: () => {
      if (typeof closeModal === "function") closeModal();
      if (typeof openBankImport === "function") openBankImport();
    }
  },
  {
    title: "Operations Hub: Burn Limit & Analytics",
    text: "Set a global monthly burn threshold, review spent warning triggers, and explore spent share by category.",
    target: "#operations-hub-card",
    position: "top",
    action: () => {
      if (typeof closeBankImport === "function") closeBankImport();
      if (typeof setHubTab === "function") setHubTab("analytics");
      document.getElementById("operations-hub-card").scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  {
    title: "Operations Hub: Renewal Calendar",
    text: "In the **Calendar** tab, view a visual renewal heatmap. Highlights calendar cash flow collisions if multiple renewals land on the same day.",
    target: "#operations-hub-card",
    position: "top",
    action: () => {
      if (typeof setHubTab === "function") setHubTab("calendar");
      document.getElementById("operations-hub-card").scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  {
    title: "Operations Hub: Smart Alerts Simulator",
    text: "Preview automated notifications (Email, Mobile Push, and Slack Webhook layouts) sent 2 days before charge dates.",
    target: "#operations-hub-card",
    position: "top",
    action: () => {
      if (typeof setHubTab === "function") setHubTab("alerts");
      document.getElementById("operations-hub-card").scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  {
    title: "Operations Hub: Department Budget Caps",
    text: "Set budget caps for each department (Engineering, Product, Marketing, Sales, Operations). Red progress bars indicate budget cap overruns.",
    target: "#operations-hub-card",
    position: "top",
    action: () => {
      if (typeof setHubTab === "function") setHubTab("departments");
      document.getElementById("operations-hub-card").scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  {
    title: "SaaS Catalog Browser",
    text: "Quick-add SaaS presets from a searchable catalog (Slack, GitHub, Snowflake, etc.).",
    target: "#presets-panel > div",
    position: "right",
    action: () => {
      if (typeof openPresetsBrowser === "function") openPresetsBrowser();
    }
  },
  {
    title: "Export High-Fidelity Reports",
    text: "Export active visualizations (Treemap, Circlepack, Beeswarm) as PNGs, or generate a high-fidelity vector PDF print report.",
    target: "#theme-btn",
    position: "bottom",
    action: () => {
      if (typeof closePresetsBrowser === "function") closePresetsBrowser();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  {
    title: "You're Ready to Roll!",
    text: "That's it! You have walked through every advanced section of the cockpit. Go ahead and simulate spending decisions to protect your startup's runway!",
    target: null,
    position: "center",
    action: () => {}
  }
];

let activeTourSteps = [];
let currentTourStep = 0;
let tourSpotlight = null;
let tourPopup = null;
let tourOverlayBackdrop = null;

function startTour() {
  const mode = localStorage.getItem("runwaymap_mode") || "basic";
  activeTourSteps = mode === "pro" ? proTourSteps : basicTourSteps;
  currentTourStep = 0;
  createTourElements();
  showTourStep(0);
}

function createTourElements() {
  // Remove existing tour elements if any
  removeTourElements();

  // Full-screen dark overlay backdrop
  tourOverlayBackdrop = document.createElement("div");
  tourOverlayBackdrop.id = "tour-overlay-backdrop";
  tourOverlayBackdrop.className = "fixed inset-0 z-[44] bg-slate-950/70 backdrop-blur-[1px] transition-opacity duration-300";
  document.body.appendChild(tourOverlayBackdrop);

  // Spotlight helper (shadow trick)
  tourSpotlight = document.createElement("div");
  tourSpotlight.id = "tour-spotlight";
  tourSpotlight.className = "absolute z-[45] pointer-events-none rounded-xl transition-all duration-300";
  tourSpotlight.style.boxShadow = "0 0 0 9999px rgba(8, 10, 16, 0.78)";
  tourSpotlight.style.border = "2px solid var(--border-active)";
  document.body.appendChild(tourSpotlight);

  // Floating Tour Popup
  tourPopup = document.createElement("div");
  tourPopup.id = "tour-popup";
  tourPopup.className = "absolute z-[50] w-[90%] max-w-[400px] p-5 rounded-2xl border shadow-2xl transition-all duration-300 text-left pointer-events-auto flex flex-col justify-between";
  tourPopup.style.backdropFilter = "blur(12px)";
  tourPopup.style.webkitBackdropFilter = "blur(12px)";
  tourPopup.style.backgroundColor = "var(--bg-card)";
  tourPopup.style.borderColor = "var(--border-active)";
  tourPopup.style.color = "var(--text-main)";
  document.body.appendChild(tourPopup);

  // Handle resizing/scrolling
  window.addEventListener("resize", positionTourElements);
  window.addEventListener("scroll", positionTourElements);
}

function removeTourElements() {
  if (tourOverlayBackdrop) tourOverlayBackdrop.remove();
  if (tourSpotlight) tourSpotlight.remove();
  if (tourPopup) tourPopup.remove();

  tourOverlayBackdrop = null;
  tourSpotlight = null;
  tourPopup = null;

  window.removeEventListener("resize", positionTourElements);
  window.removeEventListener("scroll", positionTourElements);
}

function showTourStep(index) {
  if (index < 0 || index >= activeTourSteps.length) {
    endTour();
    return;
  }

  // Self-cleaning for modal panels depending on target step
  const modalPanel = document.getElementById("modal-panel");
  if (modalPanel && !modalPanel.classList.contains("hidden") && activeTourSteps[index].target !== "#modal-panel > div") {
    if (typeof closeModal === "function") closeModal();
  }

  const bankPanel = document.getElementById("bank-import-panel");
  if (bankPanel && !bankPanel.classList.contains("hidden") && activeTourSteps[index].target !== "#bank-import-panel > div") {
    if (typeof closeBankImport === "function") closeBankImport();
  }

  const presetsPanel = document.getElementById("presets-panel");
  if (presetsPanel && !presetsPanel.classList.contains("hidden") && activeTourSteps[index].target !== "#presets-panel > div") {
    if (typeof closePresetsBrowser === "function") closePresetsBrowser();
  }

  const comparePanel = document.getElementById("compare-panel");
  if (comparePanel && !comparePanel.classList.contains("hidden") && activeTourSteps[index].target !== "#compare-panel > div") {
    if (typeof closeCompareDrawer === "function") closeCompareDrawer();
  }

  currentTourStep = index;
  const step = activeTourSteps[index];

  // Run target custom trigger action
  if (typeof step.action === "function") {
    step.action();
  }

  // Build Popup Content
  const isFirst = index === 0;
  const isLast = index === activeTourSteps.length - 1;

  tourPopup.innerHTML = `
    <div>
      <div class="flex justify-between items-start mb-2.5">
        <h4 class="text-xs font-black uppercase tracking-wider font-sans" style="color: var(--text-main)">${step.title}</h4>
        <button onclick="endTour()" class="hover:opacity-80 p-0.5 rounded transition-colors" style="color: var(--text-muted)" title="Skip Tour">
          <span class="iconify h-4 w-4" data-icon="ph:x-bold"></span>
        </button>
      </div>
      <div class="text-[11px] leading-relaxed font-sans font-medium mb-5" style="color: var(--text-muted)">
        ${step.text}
      </div>
    </div>
    <div class="flex justify-between items-center border-t border-white/5 pt-3 mt-1 shrink-0 font-sans">
      <span class="text-[9px] font-black uppercase tracking-widest font-mono" style="color: var(--text-muted); opacity: 0.6">Step ${index + 1} of ${activeTourSteps.length}</span>
      <div class="flex gap-2">
        ${!isFirst ? `<button onclick="prevTourStep()" class="px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition-colors" style="background: rgba(255, 255, 255, 0.05); border-color: var(--border-color); color: var(--text-main)">Back</button>` : ''}
        <button onclick="nextTourStep()" class="px-3.5 py-1.5 rounded-lg text-white text-[10px] font-black transition-colors shadow-md" style="background: var(--color-purple, #8b5cf6); border: none; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25)">
          ${isLast ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  `;

  // Position Spotlight and Popup (delay slightly to let scrolling/modal rendering settle)
  setTimeout(positionTourElements, 150);
}

function nextTourStep() {
  showTourStep(currentTourStep + 1);
}

function prevTourStep() {
  showTourStep(currentTourStep - 1);
}

function endTour() {
  // Ensure we close any modals that were programmatically left open
  if (typeof closeModal === "function") closeModal();
  if (typeof closeBankImport === "function") closeBankImport();
  if (typeof closePresetsBrowser === "function") closePresetsBrowser();
  if (typeof closeCompareDrawer === "function") closeCompareDrawer();
  
  removeTourElements();
  showToast("Cockpit onboarding tour complete!", "success");
}

function positionTourElements() {
  if (!tourPopup || currentTourStep >= activeTourSteps.length) return;

  const step = activeTourSteps[currentTourStep];
  
  if (!step.target) {
    // Center Modal Mode (First/Last Step)
    if (tourSpotlight) {
      tourSpotlight.style.opacity = "0";
      tourSpotlight.style.width = "0px";
      tourSpotlight.style.height = "0px";
    }

    tourPopup.style.position = "fixed";
    tourPopup.style.left = "50%";
    tourPopup.style.top = "50%";
    tourPopup.style.transform = "translate(-50%, -50%)";
    tourPopup.style.margin = "0";
    return;
  }

  const targetEl = document.querySelector(step.target);
  if (!targetEl) {
    // Target missing, fall back to center modal positioning
    tourPopup.style.position = "fixed";
    tourPopup.style.left = "50%";
    tourPopup.style.top = "50%";
    tourPopup.style.transform = "translate(-50%, -50%)";
    return;
  }

  // Get target dimensions
  const rect = targetEl.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;

  const targetLeft = rect.left + scrollX;
  const targetTop = rect.top + scrollY;
  const targetWidth = rect.width;
  const targetHeight = rect.height;

  // Update Spotlight position
  if (tourSpotlight) {
    const buffer = 6;
    tourSpotlight.style.opacity = "1";
    tourSpotlight.style.left = (targetLeft - buffer) + "px";
    tourSpotlight.style.top = (targetTop - buffer) + "px";
    tourSpotlight.style.width = (targetWidth + buffer * 2) + "px";
    tourSpotlight.style.height = (targetHeight + buffer * 2) + "px";
    
    // Adapt spotlight border radius
    const targetRadius = window.getComputedStyle(targetEl).borderRadius;
    tourSpotlight.style.borderRadius = targetRadius || "12px";
  }

  // Calculate popup positions
  tourPopup.style.position = "absolute";
  tourPopup.style.transform = "none";

  const popupWidth = tourPopup.offsetWidth || 380;
  const popupHeight = tourPopup.offsetHeight || 200;
  const gap = 14;

  let popupLeft = 0;
  let popupTop = 0;

  // Decide position dynamically
  const pos = step.position;

  if (pos === "right") {
    popupLeft = targetLeft + targetWidth + gap;
    popupTop = targetTop + targetHeight / 2 - popupHeight / 2;
    // Bounds check right edge
    if (popupLeft + popupWidth > window.innerWidth) {
      // Fallback below
      popupLeft = targetLeft + targetWidth / 2 - popupWidth / 2;
      popupTop = targetTop + targetHeight + gap;
    }
  } else if (pos === "left") {
    popupLeft = targetLeft - popupWidth - gap;
    popupTop = targetTop + targetHeight / 2 - popupHeight / 2;
    // Bounds check left edge
    if (popupLeft < 0) {
      popupLeft = targetLeft + targetWidth / 2 - popupWidth / 2;
      popupTop = targetTop + targetHeight + gap;
    }
  } else if (pos === "top") {
    popupLeft = targetLeft + targetWidth / 2 - popupWidth / 2;
    popupTop = targetTop - popupHeight - gap;
    // Bounds check top edge
    if (popupTop < scrollY) {
      popupTop = targetTop + targetHeight + gap;
    }
  } else {
    // Default to "bottom"
    popupLeft = targetLeft + targetWidth / 2 - popupWidth / 2;
    popupTop = targetTop + targetHeight + gap;
    // Bounds check bottom edge
    if (popupTop + popupHeight > scrollY + window.innerHeight) {
      popupTop = targetTop - popupHeight - gap;
    }
  }

  // Make sure popup stays inside the horizontal window margins
  const margin = 10;
  if (popupLeft < margin) popupLeft = margin;
  if (popupLeft + popupWidth > window.innerWidth - margin) {
    popupLeft = window.innerWidth - popupWidth - margin;
  }

  // Make sure popup stays inside the vertical window margins (no cut-off at top or bottom)
  if (popupTop < scrollY + margin) popupTop = scrollY + margin;
  if (popupTop + popupHeight > scrollY + window.innerHeight - margin) {
    popupTop = scrollY + window.innerHeight - popupHeight - margin;
  }

  tourPopup.style.left = popupLeft + "px";
  tourPopup.style.top = popupTop + "px";
}
