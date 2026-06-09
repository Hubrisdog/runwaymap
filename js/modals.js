const backdrop = document.getElementById("modal-backdrop");
const panel = document.getElementById("modal-panel");
const modalInner = panel ? panel.querySelector("div") : null;

function showModal() {
  backdrop.classList.remove("hidden");
  panel.classList.remove("hidden");

  requestAnimationFrame(function() {
    backdrop.classList.remove("opacity-0");
    if (modalInner) {
      modalInner.classList.remove("translate-y-full", "sm:scale-95", "opacity-0");
      modalInner.classList.add("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
    }
  });
}

function hideModal() {
  backdrop.classList.add("opacity-0");

  if (modalInner) {
    modalInner.classList.remove("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
    modalInner.classList.add("translate-y-full", "sm:scale-95", "opacity-0");
  }

  setTimeout(function() {
    backdrop.classList.add("hidden");
    panel.classList.add("hidden");
  }, 300);
}

function openModal() {
  document.getElementById("sub-form").reset();
  document.getElementById("entry-id").value = "";
  document.getElementById("sub-currency").value = selectedCurrency;
  document.getElementById("is-seat-based").checked = false;
  document.getElementById("category").value = "Infrastructure";
  document.getElementById("cycle").value = "Monthly";
  document.getElementById("date").value = new Date().toISOString().split("T")[0];
  document.getElementById("owner").value = "";
  document.getElementById("department").value = "Engineering";
  document.getElementById("funding").value = "";
  updateFavicon("");
  pickColor(randColor().id);

  document.getElementById("modal-title").innerText = "Add SaaS Expense";
  document.querySelector("#sub-form button[type='submit']").innerText = "Save Item";

  showModal();
}

function closeModal() {
  hideModal();
}

function openModalWithPreset(presetIdx) {
  const preset = presets[presetIdx];
  if (!preset) return;

  document.getElementById("sub-form").reset();
  document.getElementById("entry-id").value = "";
  document.getElementById("sub-currency").value = selectedCurrency;
  document.getElementById("name").value = preset.name;
  document.getElementById("price").value = preset.price;
  document.getElementById("category").value = preset.category || "Infrastructure";
  document.getElementById("is-seat-based").checked = !!preset.isSeatBased;
  document.getElementById("url").value = preset.domain;
  document.getElementById("cycle").value = preset.cycle || "Monthly";
  document.getElementById("date").value = new Date().toISOString().split("T")[0];
  document.getElementById("owner").value = "";
  document.getElementById("department").value = preset.department || "Engineering";
  document.getElementById("funding").value = "";

  updateFavicon(preset.domain);
  pickColor(preset.color);

  document.getElementById("modal-title").innerText = "Add SaaS Expense";
  document.querySelector("#sub-form button[type='submit']").innerText = "Save Item";

  showModal();
}

const settingsBackdrop = document.getElementById("settings-backdrop");
const settingsPanel = document.getElementById("settings-panel");
const settingsInner = settingsPanel ? settingsPanel.querySelector("div") : null;

function openSettings() {
  settingsBackdrop.classList.remove("hidden");
  settingsPanel.classList.remove("hidden");

  requestAnimationFrame(function() {
    settingsBackdrop.classList.remove("opacity-0");
    if (settingsInner) {
      settingsInner.classList.remove("translate-y-full", "sm:scale-95", "opacity-0");
      settingsInner.classList.add("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
    }
  });
}

function closeSettings() {
  settingsBackdrop.classList.add("opacity-0");

  if (settingsInner) {
    settingsInner.classList.remove("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
    settingsInner.classList.add("translate-y-full", "sm:scale-95", "opacity-0");
  }

  setTimeout(function() {
    settingsBackdrop.classList.add("hidden");
    settingsPanel.classList.add("hidden");
  }, 300);
}

let selectedCategory = null;

const presetsBackdrop = document.getElementById("presets-backdrop");
const presetsPanel = document.getElementById("presets-panel");
const presetsInner = presetsPanel ? presetsPanel.querySelector("div") : null;

function openPresetsBrowser() {
  selectedCategory = null;
  document.getElementById("presets-search").value = "";

  renderCategoryFilters();
  renderPresetsBrowserList();

  if (presetsBackdrop) presetsBackdrop.classList.remove("hidden");
  if (presetsPanel) presetsPanel.classList.remove("hidden");

  requestAnimationFrame(function() {
    if (presetsBackdrop) presetsBackdrop.classList.remove("opacity-0");
    if (presetsInner) {
      presetsInner.classList.remove("translate-y-full", "sm:scale-95", "opacity-0");
      presetsInner.classList.add("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
    }
  });
}

function closePresetsBrowser() {
  if (presetsBackdrop) presetsBackdrop.classList.add("opacity-0");

  if (presetsInner) {
    presetsInner.classList.remove("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
    presetsInner.classList.add("translate-y-full", "sm:scale-95", "opacity-0");
  }

  setTimeout(function() {
    if (presetsBackdrop) presetsBackdrop.classList.add("hidden");
    if (presetsPanel) presetsPanel.classList.add("hidden");
  }, 300);
}

function renderCategoryFilters() {
  const filtersEl = document.getElementById("category-filters");
  if (!filtersEl) return;

  const cats = getCategories();
  let html = '<button onclick="selectCategory(null)" class="category-filter-btn px-3 py-1 rounded-full text-xs font-bold transition-all';
  if (!selectedCategory) html += ' active';
  html += '">All</button>';

  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    const isActive = (selectedCategory === cat);
    html += '<button onclick="selectCategory(\'' + cat + '\')" class="category-filter-btn px-3 py-1 rounded-full text-xs font-bold transition-all';
    if (isActive) html += ' active';
    html += '">' + cat + '</button>';
  }

  filtersEl.innerHTML = html;
}

function selectCategory(cat) {
  selectedCategory = cat;
  renderCategoryFilters();

  const searchInput = document.getElementById("presets-search");
  const query = searchInput ? searchInput.value : "";
  filterPresets(query);
}

function filterPresets(searchQuery) {
  const q = searchQuery.toLowerCase().trim();
  let results = presets;

  if (selectedCategory) {
    results = results.filter(function(p) {
      return p.category === selectedCategory;
    });
  }

  if (q.length > 0) {
    results = results.filter(function(p) {
      return p.name.toLowerCase().includes(q) ||
             p.category.toLowerCase().includes(q) ||
             p.domain.toLowerCase().includes(q);
    });
  }

  renderPresetsBrowserList(results);
}

function renderPresetsBrowserList(presetsToShow) {
  if (!presetsToShow) presetsToShow = presets;

  const container = document.getElementById("presets-browser-list");
  if (!container) return;

  if (presetsToShow.length === 0) {
    container.innerHTML = '<div class="text-center text-slate-500 py-8 text-xs">No matching SaaS vendors found</div>';
    return;
  }

  const byCategory = {};
  for (let i = 0; i < presetsToShow.length; i++) {
    const p = presetsToShow[i];
    if (!byCategory[p.category]) {
      byCategory[p.category] = [];
    }
    byCategory[p.category].push(p);
  }

  let html = "";
  const categoryNames = Object.keys(byCategory);

  for (let c = 0; c < categoryNames.length; c++) {
    const catName = categoryNames[c];
    const items = byCategory[catName];

    html += '<div class="mb-5">';
    html += '<h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">' + catName + '</h4>';
    html += '<div class="grid grid-cols-2 gap-2">';

    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      const idx = presets.indexOf(p);
      const logo = "https://img.logo.dev/" + p.domain + "?token=pk_KuI_oR-IQ1-fqpAfz3FPEw&size=100&retina=true&format=png";

      html += '<button onclick="selectPresetFromBrowser(' + idx + ')" ';
      html += 'class="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-3 text-left transition-all hover:border-white/10 hover:bg-slate-900 active:scale-[0.98]">';
      html += '<img src="' + logo + '" class="h-8 w-8 rounded object-contain shrink-0" crossorigin="anonymous" alt="' + p.name + '" onerror="this.src=\'\'">';
      html += '<div class="min-w-0 flex-1">';
      html += '<div class="font-bold text-slate-200 text-xs truncate">' + p.name + '</div>';
      html += '<div class="text-[10px] text-slate-500">$' + p.price + '/mo' + (p.isSeatBased ? ' per seat' : '') + '</div>';
      html += '</div></button>';
    }

    html += '</div></div>';
  }

  container.innerHTML = html;
}

function selectPresetFromBrowser(idx) {
  closePresetsBrowser();
  setTimeout(function() {
    openModalWithPreset(idx);
  }, 300);
}

const compareBackdrop = document.getElementById("compare-backdrop");
const comparePanel = document.getElementById("compare-panel");
const compareInner = comparePanel ? comparePanel.querySelector("div") : null;

function toggleCompareDrawer() {
  if (!comparePanel) return;
  if (comparePanel.classList.contains("hidden")) {
    openCompareDrawer();
  } else {
    closeCompareDrawer();
  }
}

function openCompareDrawer() {
  if (typeof window.renderCompareMatrix === "function") {
    window.renderCompareMatrix();
  }

  compareBackdrop.classList.remove("hidden");
  comparePanel.classList.remove("hidden");

  requestAnimationFrame(function() {
    compareBackdrop.classList.remove("opacity-0");
    if (compareInner) {
      compareInner.classList.remove("translate-y-full", "sm:scale-95", "opacity-0");
      compareInner.classList.add("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
    }
  });
}

function closeCompareDrawer() {
  compareBackdrop.classList.add("opacity-0");

  if (compareInner) {
    compareInner.classList.remove("translate-y-0", "sm:translate-y-0", "sm:scale-100", "opacity-100");
    compareInner.classList.add("translate-y-full", "sm:scale-95", "opacity-0");
  }

  setTimeout(function() {
    compareBackdrop.classList.add("hidden");
    comparePanel.classList.add("hidden");
  }, 300);
}

document.addEventListener("DOMContentLoaded", function() {
  if (backdrop) backdrop.addEventListener("click", closeModal);
  if (panel) {
    panel.addEventListener("click", closeModal);
    if (modalInner) modalInner.addEventListener("click", function(e) { e.stopPropagation(); });
  }

  if (settingsBackdrop) settingsBackdrop.addEventListener("click", closeSettings);
  if (settingsPanel) {
    settingsPanel.addEventListener("click", closeSettings);
    if (settingsInner) settingsInner.addEventListener("click", function(e) { e.stopPropagation(); });
  }

  if (presetsBackdrop) presetsBackdrop.addEventListener("click", closePresetsBrowser);
  if (presetsPanel) {
    presetsPanel.addEventListener("click", closePresetsBrowser);
    if (presetsInner) presetsInner.addEventListener("click", function(e) { e.stopPropagation(); });
  }

  const bankBackdrop = document.getElementById("bank-import-backdrop");
  const bankPanel = document.getElementById("bank-import-panel");
  const bankInner = bankPanel ? bankPanel.querySelector("div") : null;

  if (bankBackdrop) bankBackdrop.addEventListener("click", closeBankImport);
  if (bankPanel) {
    bankPanel.addEventListener("click", closeBankImport);
    if (bankInner) bankInner.addEventListener("click", function(e) { e.stopPropagation(); });
  }

  if (compareBackdrop) compareBackdrop.addEventListener("click", closeCompareDrawer);
  if (comparePanel) {
    comparePanel.addEventListener("click", closeCompareDrawer);
    if (compareInner) compareInner.addEventListener("click", function(e) { e.stopPropagation(); });
  }
});
