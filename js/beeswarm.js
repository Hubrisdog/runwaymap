// dots go on x-axis by value, then get pushed up/down to avoid overlap

class Beeswarm {
  constructor(width, height, padding = 20, isMobile = false) {
    this.width = width;
    this.height = height;
    this.padding = padding;
    this.centerY = height / 2;
    this.isMobile = isMobile;
  }

  layout(items) {
    if (!items.length) return [];

    // process cheap items first - they cluster on the left and this
    // gives a more balanced distribution when we push dots up/down
    const sorted = [...items].sort((a, b) => a.cost - b.cost);

    const costs = sorted.map(d => d.cost);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);

    // fewer pixels to work with on mobile, so smaller dots
    const maxRadius = this.isMobile ? 24 : 36;
    const minRadius = this.isMobile ? 14 : 20;
    const spacing = this.isMobile ? 2.5 : 2.0;

    const baseRadius = Math.min(
      maxRadius,
      Math.max(minRadius, (this.width - this.padding * 2) / (items.length * spacing))
    );

    const xScale = (cost) => {
      if (maxCost === minCost) return this.width / 2;
      const ratio = (cost - minCost) / (maxCost - minCost);
      return this.padding + baseRadius + ratio * (this.width - this.padding * 2 - baseRadius * 2);
    };

    const placed = [];

    const positioned = sorted.map(item => {
      const x = xScale(item.cost);
      const y = this._findYPosition(x, baseRadius, placed);

      const result = { ...item, x, y, radius: baseRadius };
      placed.push(result);
      return result;
    });

    return this._normalizeY(positioned);
  }

  _findYPosition(x, radius, placed) {
    let y = this.centerY;
    let offset = 0;
    let direction = 1;
    const step = radius * 0.8;

    while (this._hasCollision(x, y, radius, placed)) {
      offset += step;
      y = this.centerY + offset * direction;
      direction *= -1;

      if (offset > this.height) break;
    }

    return y;
  }

  _hasCollision(x, y, radius, placed) {
    const minDistance = radius * 1.8;

    for (const item of placed) {
      const dx = x - item.x;
      const dy = y - item.y;
      if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
        return true;
      }
    }
    return false;
  }

  _normalizeY(items) {
    if (!items.length) return items;

    const ys = items.map(d => d.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeY = maxY - minY;

    // Use a vertical padding of 60px to leave room at the bottom for axis labels
    const paddingY = 60;
    const availableHeight = this.height - paddingY * 2;
    const scale = rangeY > 0 ? Math.min(1, availableHeight / rangeY) : 1;
    const centerCurrent = (minY + maxY) / 2;

    return items.map(item => ({
      ...item,
      y: this.centerY + (item.y - centerCurrent) * scale,
    }));
  }
}

function renderBeeswarm() {
  const container = document.getElementById("beeswarm-container");
  if (!container || !subs.length) {
    if (container) {
      container.innerHTML = `
        <div class="flex items-center justify-center h-full text-slate-500 text-xs">
          <p>Add SaaS expenses to see the beeswarm plot</p>
        </div>
      `;
    }
    return;
  }

  // Clear non-beeswarm elements like text nodes
  const firstChild = container.firstElementChild;
  if (firstChild && !firstChild.classList.contains("beeswarm-dot") && !firstChild.classList.contains("beeswarm-axis-line")) {
    container.innerHTML = "";
  }

  const rect = container.getBoundingClientRect();
  const width = rect.width || 800;
  const height = rect.height || 600;
  const isMobile = width < 500;
  const padding = isMobile ? 20 : 40;

  const items = subs.map(sub => ({ ...sub, cost: toMonthly(sub) }));
  const beeswarm = new Beeswarm(width, height, padding, isMobile);
  const positioned = beeswarm.layout(items);

  const costs = positioned.map(d => d.cost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);

  // Render static background components once
  let axisLine = container.querySelector(".beeswarm-axis-line");
  let axisMin = container.querySelector(".beeswarm-axis-min");
  if (axisMin && !axisMin.classList.contains("bottom-2")) {
    container.innerHTML = "";
    axisLine = null;
  }

  if (!axisLine) {
    container.innerHTML = `
      <div class="beeswarm-axis-line absolute left-4 right-4 sm:left-10 sm:right-10 top-1/2 h-px -translate-y-1/2 pointer-events-none"></div>
      <div class="beeswarm-axis-min absolute left-4 sm:left-10 bottom-2 text-[10px] text-slate-500 font-bold pointer-events-none font-mono"></div>
      <div class="beeswarm-axis-max absolute right-4 sm:right-10 bottom-2 text-[10px] text-slate-500 font-bold pointer-events-none text-right font-mono"></div>
      <div class="absolute left-1/2 -translate-x-1/2 bottom-2 text-[9px] text-slate-600 font-extrabold uppercase tracking-widest pointer-events-none">
        SaaS Monthly Burn
      </div>
    `;
  }

  container.querySelector(".beeswarm-axis-min").innerText = "Min: " + formatCurrencyShort(minCost);
  container.querySelector(".beeswarm-axis-max").innerText = "Max: " + formatCurrencyShort(maxCost);

  // Update theme styles inline to prevent CSS caching issues
  const axisLineEl = container.querySelector(".beeswarm-axis-line");
  const axisMinEl = container.querySelector(".beeswarm-axis-min");
  const axisMaxEl = container.querySelector(".beeswarm-axis-max");
  
  if (axisLineEl && axisMinEl && axisMaxEl) {
    let lineColor = "rgba(255, 255, 255, 0.18)";
    let textColor = "#94a3b8";
    
    if (currentTheme === "light") {
      lineColor = "rgba(15, 23, 42, 0.18)";
      textColor = "#64748b";
    } else if (currentTheme === "claude") {
      lineColor = "rgba(60, 50, 40, 0.28)";
      textColor = "#7c6e62";
    }
    
    axisLineEl.style.backgroundColor = lineColor;
    axisLineEl.style.height = "1px";
    
    axisMinEl.style.color = textColor;
    axisMaxEl.style.color = textColor;
  }

  const activeIds = new Set();
  let activeTooltip = null;

  positioned.forEach(item => {
    activeIds.add(item.id);
    const color = getSubColor(item);
    const size = item.radius * 2;
    const domain = extractDomain(item.url);
    const logoUrl = domain
      ? `https://img.logo.dev/${domain}?token=pk_KuI_oR-IQ1-fqpAfz3FPEw&size=100&retina=true&format=png`
      : null;

    const dotInnerHtml = `
      <div
        class="w-full h-full rounded-full shadow-lg flex items-center justify-center overflow-hidden transition-all duration-200 border"
        style="background-color: var(--bg-card); border-color: ${color.accent}; box-shadow: 0 0 10px color-mix(in srgb, ${color.accent} 15%, transparent);"
      >
        ${logoUrl
          ? `<img src="${logoUrl}" alt="${item.name}" class="w-3/4 h-3/4 object-contain rounded-md" crossorigin="anonymous" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><span class="text-[9px] sm:text-xs font-black hidden items-center justify-center text-slate-200">${item.name.charAt(0)}</span>`
          : `<span class="text-[9px] sm:text-xs font-black text-slate-200">${item.name.charAt(0)}</span>`
        }
      </div>
      <div class="beeswarm-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div class="bg-slate-950 border border-white/10 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-2xl">
          <div class="font-bold">${item.name}</div>
          <div class="text-slate-400 text-[10px]">${item.category}</div>
          <div class="font-black text-purple-400 mt-1">${formatCurrency(item.cost)}/mo</div>
        </div>
        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950"></div>
      </div>
    `;

    let dotEl = container.querySelector(`.beeswarm-dot[data-id="${item.id}"]`);

    if (!dotEl) {
      dotEl = document.createElement("div");
      dotEl.className = "beeswarm-dot absolute cursor-pointer group";
      dotEl.setAttribute("data-id", item.id);
      
      dotEl.style.opacity = "0";
      dotEl.style.left = item.x + "px";
      dotEl.style.top = item.y + "px";
      dotEl.style.width = size + "px";
      dotEl.style.height = size + "px";
      dotEl.style.transform = "translate(-50%, -50%) scale(0.9)";
      dotEl.style.setProperty("--cell-color", color.accent);
      dotEl.innerHTML = dotInnerHtml;

      dotEl.addEventListener("click", e => {
        if (window.innerWidth >= 500) {
          editSub(item.id);
        }
      });

      // Mobile tooltip support
      let tapCount = 0;
      let tapTimer = null;
      dotEl.addEventListener("click", e => {
        if (window.innerWidth < 500) {
          e.stopPropagation();
          tapCount++;
          if (tapCount === 1) {
            if (activeTooltip && activeTooltip !== dotEl) {
              activeTooltip.classList.remove("active");
            }
            dotEl.classList.add("active");
            activeTooltip = dotEl;
            tapTimer = setTimeout(() => { tapCount = 0; }, 300);
          } else {
            clearTimeout(tapTimer);
            tapCount = 0;
            editSub(item.id);
          }
        }
      });

      container.appendChild(dotEl);

      requestAnimationFrame(() => {
        dotEl.style.opacity = "1";
        dotEl.style.transform = "translate(-50%, -50%) scale(1)";
      });
    } else {
      dotEl.style.left = item.x + "px";
      dotEl.style.top = item.y + "px";
      dotEl.style.width = size + "px";
      dotEl.style.height = size + "px";
      dotEl.style.transform = "translate(-50%, -50%) scale(1)";
      dotEl.style.setProperty("--cell-color", color.accent);
      dotEl.innerHTML = dotInnerHtml;
    }
  });

  // Remove old dots
  const existingDots = container.querySelectorAll(".beeswarm-dot");
  existingDots.forEach(dot => {
    const id = dot.getAttribute("data-id");
    if (!activeIds.has(id)) {
      dot.style.opacity = "0";
      dot.style.transform = "translate(-50%, -50%) scale(0.8)";
      dot.style.pointerEvents = "none";
      setTimeout(() => {
        dot.remove();
      }, 350);
    }
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".beeswarm-dot") && activeTooltip) {
      activeTooltip.classList.remove("active");
      activeTooltip = null;
    }
  });
}

function extractDomain(url) {
  if (!url) return "";
  try {
    if (!url.startsWith("http")) url = "https://" + url;
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url.replace("www.", "");
  }
}
