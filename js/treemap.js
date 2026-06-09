/*
 * squarified treemap layout
 * based on the bruls et al. algorithm
 * https://www.win.tue.nl/~vanwijk/stm.pdf
 */
class Treemap {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cellGap = 4; // gap between cells in px
  }

  layout(items) {
    if (items.length === 0) return [];

    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += items[i].val;
    }

    const normalized = [];
    const totalArea = this.width * this.height;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      normalized.push({
        id: item.id,
        name: item.name,
        url: item.url,
        color: item.color,
        price: item.price,
        currency: item.currency,
        cycle: item.cycle,
        cost: item.cost,
        val: item.val,
        idx: item.idx,
        area: (item.val / total) * totalArea
      });
    }

    const rectangles = [];
    this._squarify(normalized, [], 0, 0, this.width, this.height, rectangles);
    return rectangles;
  }

  // recursive squarification - tries to make cells as square as possible
  _squarify(remaining, currentRow, x, y, w, h, output) {
    if (remaining.length === 0) {
      this._layoutRow(currentRow, x, y, w, h, output);
      return;
    }

    const next = remaining[0];
    const withNext = currentRow.concat([next]);

    if (currentRow.length === 0 || this._worstRatio(currentRow, w, h) >= this._worstRatio(withNext, w, h)) {
      this._squarify(remaining.slice(1), withNext, x, y, w, h, output);
    } else {
      const bounds = this._layoutRow(currentRow, x, y, w, h, output);
      this._squarify(remaining, [], bounds.nx, bounds.ny, bounds.nw, bounds.nh, output);
    }
  }

  _worstRatio(row, w, h) {
    if (row.length === 0) return Infinity;

    let areaSum = 0;
    for (let i = 0; i < row.length; i++) {
      areaSum += row[i].area;
    }

    const shortSide = Math.min(w, h);
    const rowThickness = areaSum / shortSide;

    let worstRatio = 0;
    for (let i = 0; i < row.length; i++) {
      const itemLength = row[i].area / rowThickness;
      const ratio = Math.max(rowThickness / itemLength, itemLength / rowThickness);
      if (ratio > worstRatio) {
        worstRatio = ratio;
      }
    }

    return worstRatio;
  }

  _layoutRow(row, x, y, w, h, output) {
    if (row.length === 0) {
      return { nx: x, ny: y, nw: w, nh: h };
    }

    let areaSum = 0;
    for (let i = 0; i < row.length; i++) {
      areaSum += row[i].area;
    }

    const horizontal = (w >= h);
    const shortSide = horizontal ? h : w;
    const thickness = areaSum / shortSide;
    const gap = this.cellGap;

    let offset = 0;

    for (let i = 0; i < row.length; i++) {
      const item = row[i];
      const length = item.area / thickness;

      if (horizontal) {
        output.push({
          id: item.id,
          name: item.name,
          url: item.url,
          color: item.color,
          price: item.price,
          currency: item.currency,
          cycle: item.cycle,
          cost: item.cost,
          val: item.val,
          idx: item.idx,
          area: item.area,
          x: x + gap / 2,
          y: y + offset + gap / 2,
          w: thickness - gap,
          h: length - gap
        });
      } else {
        output.push({
          id: item.id,
          name: item.name,
          url: item.url,
          color: item.color,
          price: item.price,
          currency: item.currency,
          cycle: item.cycle,
          cost: item.cost,
          val: item.val,
          idx: item.idx,
          area: item.area,
          x: x + offset + gap / 2,
          y: y + gap / 2,
          w: length - gap,
          h: thickness - gap
        });
      }

      offset += length;
    }

    if (horizontal) {
      return { nx: x + thickness, ny: y, nw: w - thickness, nh: h };
    } else {
      return { nx: x, ny: y + thickness, nw: w, nh: h - thickness };
    }
  }
}

function renderGrid() {
  const gridEl = document.getElementById("bento-grid");
  if (!gridEl) return;

  const items = [];

  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i];
    const monthlyCost = toMonthly(sub);

    items.push({
      id: sub.id,
      name: sub.name,
      url: sub.url,
      color: sub.color,
      price: sub.price,
      currency: sub.currency,
      cycle: sub.cycle,
      cost: monthlyCost
    });
  }

  items.sort(function(a, b) { return b.cost - a.cost; });

  if (items.length === 0) {
    gridEl.innerHTML = '<div class="flex items-center justify-center h-full text-slate-500 text-xs">Add SaaS expenses to see RunwayMap grid</div>';
    return;
  }

  // Clear any single text nodes or initial message divs if we are switching to active items
  const firstChild = gridEl.firstElementChild;
  if (firstChild && !firstChild.classList.contains("treemap-cell")) {
    gridEl.innerHTML = "";
  }

  const bounds = gridEl.getBoundingClientRect();
  const gridWidth = bounds.width || 600;
  const gridHeight = bounds.height || 450;

  const treemapData = [];
  for (let i = 0; i < items.length; i++) {
    treemapData.push({
      id: items[i].id,
      name: items[i].name,
      url: items[i].url,
      color: items[i].color,
      price: items[i].price,
      currency: items[i].currency,
      cycle: items[i].cycle,
      cost: items[i].cost,
      val: items[i].cost,
      idx: i
    });
  }

  const treemap = new Treemap(gridWidth, gridHeight);
  const cells = treemap.layout(treemapData);
  let totalMonthlyBurn = 0;
  for(let i=0; i<items.length; i++) totalMonthlyBurn += items[i].cost;

  // Track currently active cell IDs
  const activeIds = new Set();

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    activeIds.add(cell.id);
    const percent = (cell.cost / totalMonthlyBurn) * 100;
    const colorPalette = getSubColor(cell);

    const minDim = Math.min(cell.w, cell.h);
    const clampedPct = Math.max(3, Math.min(60, percent));

    const padding = Math.round(Math.max(6, Math.min(minDim * 0.08, 14)) + (clampedPct / 60) * 6);
    const borderRadius = Math.round(Math.max(6, Math.min(minDim * 0.12, 16)) + (clampedPct / 60) * 4);

    const innerWidth = cell.w - padding * 2;
    const innerHeight = cell.h - padding * 2;

    // font sizes adjustments for legibility
    const maxPriceFont = Math.min(Math.floor(innerWidth * 0.18), Math.floor(innerHeight * 0.3));
    const priceFont = Math.max(10, Math.min(12 + (clampedPct / 60) * 28, maxPriceFont, 36));
    const titleFont = Math.max(8, Math.min(9 + (clampedPct / 60) * 12, priceFont * 0.6, 18));
    const iconSize = Math.max(12, Math.min(16 + (clampedPct / 60) * 24, innerHeight * 0.35, innerWidth * 0.35, 36));

    const isMicro = minDim < 36 || (cell.w < 44 && cell.h < 44);
    const isTiny = minDim < 50 || (cell.w < 60 && cell.h < 60);
    const isSmall = minDim < 80 || cell.w < 90;

    let cellContent = "";

    if (isMicro) {
      const sz = Math.max(10, Math.min(iconSize, minDim * 0.5));
      cellContent = '<div class="flex items-center justify-center h-full w-full"><div style="width: ' + sz + 'px; height: ' + sz + 'px;" class="shrink-0 flex items-center justify-center">' + iconHtml(cell, "w-full h-full") + '</div></div>';

    } else if (isTiny) {
      const sz = Math.max(12, Math.min(iconSize, minDim * 0.4));
      const ps = Math.max(8, Math.min(priceFont, 12, innerWidth * 0.16));
      cellContent = '<div class="flex flex-col items-center justify-center h-full w-full gap-0.5">';
      cellContent += '<div style="width: ' + sz + 'px; height: ' + sz + 'px;" class="shrink-0 flex items-center justify-center">' + iconHtml(cell, "w-full h-full") + '</div>';
      cellContent += '<div class="font-bold text-slate-100" style="font-size:' + ps + 'px">' + formatCurrencyShort(cell.cost) + '</div>';
      cellContent += '</div>';

    } else if (isSmall) {
      const sz = Math.max(14, Math.min(iconSize, innerWidth * 0.35, innerHeight * 0.25));
      const ts = Math.max(8, Math.min(titleFont, 10, innerWidth * 0.12));
      const ps = Math.max(10, Math.min(priceFont, 14, innerWidth * 0.18));

      cellContent = '<div class="flex flex-col items-center justify-center h-full w-full gap-0.5 text-center">';
      cellContent += '<div style="width: ' + sz + 'px; height: ' + sz + 'px;" class="shrink-0 flex items-center justify-center">' + iconHtml(cell, "w-full h-full") + '</div>';
      cellContent += '<div class="min-w-0 w-full">';
      cellContent += '<div class="font-semibold text-slate-200 treemap-cell-name" style="font-size:' + ts + 'px">' + cell.name + '</div>';
      cellContent += '<div class="font-black text-slate-100" style="font-size:' + ps + 'px">' + formatCurrencyShort(cell.cost) + '</div>';
      cellContent += '</div></div>';

      cellContent += `<button onclick="event.stopPropagation(); removeSub('${cell.id}');" class="treemap-delete-btn" title="Delete ${cell.name}"><span class="iconify" data-icon="ph:trash-bold" style="width: 12px; height: 12px;"></span></button>`;

    } else {
      const showPercentBadge = cell.w > 70 && cell.h > 60;
      const showYearly = cell.h > 95 && cell.w > 80;
      const yearlyHtml = showYearly ? '<div class="text-[10px] text-slate-500 font-bold mt-1 opacity-75 font-sans">~' + formatCurrency(cell.cost * 12, 0) + '/yr</div>' : '';

      cellContent = '<div class="flex justify-between items-start">';
      cellContent += '<div style="width: ' + iconSize + 'px; height: ' + iconSize + 'px;" class="shrink-0 flex items-center justify-center">' + iconHtml(cell, "w-full h-full") + '</div>';
      if (showPercentBadge) {
        cellContent += '<span class="text-[9px] font-bold bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full text-slate-300 mr-7">' + Math.round(percent) + '%</span>';
      }
      cellContent += '</div>';
      cellContent += '<div class="mt-auto min-w-0">';
      cellContent += '<div class="font-bold text-slate-300 treemap-cell-name" style="font-size:' + titleFont + 'px">' + cell.name + '</div>';
      cellContent += '<div class="font-black text-slate-100 tracking-tight leading-none" style="font-size:' + priceFont + 'px">' + formatCurrency(cell.cost) + '</div>';
      cellContent += yearlyHtml;
      cellContent += '</div>';

      cellContent += `<button onclick="event.stopPropagation(); removeSub('${cell.id}');" class="treemap-delete-btn" title="Delete ${cell.name}"><span class="iconify" data-icon="ph:trash-bold" style="width: 14px; height: 14px;"></span></button>`;
    }

    const borderStyle = 'border-color: color-mix(in srgb, ' + colorPalette.accent + ' 15%, transparent); border-top: 3.5px solid ' + colorPalette.accent + ';';

    // Check if DOM element already exists
    let cellEl = gridEl.querySelector(`.treemap-cell[data-id="${cell.id}"]`);

    if (!cellEl) {
      cellEl = document.createElement("div");
      cellEl.className = "treemap-cell";
      cellEl.setAttribute("data-id", cell.id);
      cellEl.onclick = function() { editSub(cell.id); };

      // Start transparent for fade-in transition
      cellEl.style.opacity = "0";
      cellEl.style.left = cell.x + "px";
      cellEl.style.top = cell.y + "px";
      cellEl.style.width = cell.w + "px";
      cellEl.style.height = cell.h + "px";
      cellEl.style.borderRadius = borderRadius + "px";
      cellEl.style.setProperty("--cell-color", colorPalette.accent);

      cellEl.innerHTML = `<div class="treemap-cell-inner" style="padding:${padding}px; border-radius:${Math.max(4, borderRadius - 3)}px; ${borderStyle}">${cellContent}</div>`;

      gridEl.appendChild(cellEl);

      // Trigger transition
      requestAnimationFrame(() => {
        cellEl.style.opacity = "1";
      });
    } else {
      // Element exists - update layout and content
      cellEl.style.left = cell.x + "px";
      cellEl.style.top = cell.y + "px";
      cellEl.style.width = cell.w + "px";
      cellEl.style.height = cell.h + "px";
      cellEl.style.borderRadius = borderRadius + "px";
      cellEl.style.setProperty("--cell-color", colorPalette.accent);

      const innerEl = cellEl.querySelector(".treemap-cell-inner");
      if (innerEl) {
        innerEl.style.padding = padding + "px";
        innerEl.style.borderRadius = Math.max(4, borderRadius - 3) + "px";
        innerEl.style.borderColor = 'color-mix(in srgb, ' + colorPalette.accent + ' 15%, transparent)';
        innerEl.style.borderTop = "3.5px solid " + colorPalette.accent;
        innerEl.innerHTML = cellContent;
      }
    }
  }

  // Remove cells that are no longer active
  const existingCells = gridEl.querySelectorAll(".treemap-cell");
  existingCells.forEach(cell => {
    const id = cell.getAttribute("data-id");
    if (!activeIds.has(id)) {
      cell.style.opacity = "0";
      cell.style.pointerEvents = "none";
      setTimeout(() => {
        cell.remove();
      }, 350);
    }
  });
}

async function exportAsImage() {
  const exportContainer = document.getElementById("export-container");
  if (!exportContainer) return;

  const btn = event.target.closest("button");
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span class="iconify h-5 w-5 animate-spin" data-icon="ph:spinner-bold"></span> Exporting...';
  btn.disabled = true;

  showToast("Generating PNG report...", "info");

  try {
    const pngUrl = await modernScreenshot.domToPng(exportContainer, {
      scale: 2,
      backgroundColor: "#070a13",
      style: {
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        borderRadius: "1.5rem",
        overflow: "hidden"
      },
      onCloneNode: function(node) {
        if (node.style) {
          node.style.fontFamily = "system-ui, -apple-system, sans-serif";
        }
        if (node.querySelectorAll) {
          var elements = node.querySelectorAll("*");
          for (var i = 0; i < elements.length; i++) {
            if (elements[i].style) {
              elements[i].style.fontFamily = "system-ui, -apple-system, sans-serif";
            }
          }
        }
        return node;
      },
      fetch: { bypassingCache: true }
    });

    var downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "runwaymap-" + new Date().toISOString().split("T")[0] + ".png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    showToast("PNG report saved successfully!", "success");

  } catch (err) {
    console.error("export failed:", err);
    showToast("Export failed: " + err.message, "error");
  }

  btn.innerHTML = originalHtml;
  btn.disabled = false;
}
