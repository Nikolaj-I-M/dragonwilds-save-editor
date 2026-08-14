/* Dragonwilds Save Editor — cliente web (vanilla JS, sem dependências). */
"use strict";

// ---------------------------------------------------------------------------
// Estado global
// ---------------------------------------------------------------------------

const state = {
  catalog: [],        // itens canônicos (EN)
  byId: new Map(),
  sections: [],
  locales: {},
  lang: localStorage.getItem("dw-lang") || "pt-BR",
  save: { loaded: false },
  selectedSlot: null,
  selectedItem: null,
  category: null,     // null = todas
  search: "",
};

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

function t(key, vars = {}) {
  const locale = state.locales[state.lang] || {};
  let text = (locale.ui && locale.ui[key]) || key;
  for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, v);
  return text;
}

function itemName(item) {
  const locale = state.locales[state.lang] || {};
  return (locale.items && locale.items[item.id]) || item.name;
}

function categoryName(category) {
  const locale = state.locales[state.lang] || {};
  return (locale.categories && locale.categories[category]) || category;
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  $("search").placeholder = t("search_placeholder");
  $("dirty-dot").title = t("unsaved_changes");
  document.title = t("app_title");
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

async function api(route, body) {
  const options = body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : undefined;
  const response = await fetch(route, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || t("error_generic"));
  return data;
}

// ---------------------------------------------------------------------------
// Toasts e tooltip
// ---------------------------------------------------------------------------

function toast(message, type = "", sub = "") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  if (sub) {
    const small = document.createElement("small");
    small.textContent = sub;
    el.appendChild(small);
  }
  $("toasts").appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, 4200);
}

const tooltip = $("tooltip");

function showTooltip(event, name, sub) {
  tooltip.innerHTML = "";
  const line = document.createElement("div");
  line.className = "tt-name";
  line.textContent = name;
  tooltip.appendChild(line);
  if (sub) {
    const subEl = document.createElement("div");
    subEl.className = "tt-sub";
    subEl.textContent = sub;
    tooltip.appendChild(subEl);
  }
  tooltip.hidden = false;
  moveTooltip(event);
}

function moveTooltip(event) {
  const pad = 14;
  let x = event.clientX + pad;
  let y = event.clientY + pad;
  const rect = tooltip.getBoundingClientRect();
  if (x + rect.width > innerWidth - 8) x = event.clientX - rect.width - pad;
  if (y + rect.height > innerHeight - 8) y = event.clientY - rect.height - pad;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideTooltip() {
  tooltip.hidden = true;
}

// ---------------------------------------------------------------------------
// Inventário
// ---------------------------------------------------------------------------

const SECTION_ICONS = {
  action_bar: "assets/theme/T_Icon_Items_Highlight.png",
  backpack: "assets/theme/T_Icon_Items_Normal.png",
  runes: "assets/theme/T_Icon_Runes_Normal.png",
  quest: "assets/theme/T_Icon_Quests_Normal.png",
  special: "assets/theme/T_Inventory_EquipmentTrinket.png",
};

function buildInventory() {
  const root = $("inventory");
  root.innerHTML = "";
  for (const section of state.sections) {
    const panel = document.createElement("div");
    panel.className = "panel inv-section";

    const head = document.createElement("div");
    head.className = "inv-section-head";
    const icon = document.createElement("img");
    icon.src = SECTION_ICONS[section.key] || SECTION_ICONS.backpack;
    icon.alt = "";
    const title = document.createElement("h2");
    title.dataset.i18n = `section_${section.key}`;
    title.textContent = t(`section_${section.key}`);
    const range = document.createElement("span");
    range.className = "slot-range";
    range.textContent = `${section.start}–${section.end}`;
    head.append(icon, title, range);

    const grid = document.createElement("div");
    grid.className = "slot-grid";
    grid.style.setProperty("--cols", section.columns);

    for (let slot = section.start; slot <= section.end; slot++) {
      const button = document.createElement("button");
      button.className = "slot";
      button.dataset.slot = slot;
      button.addEventListener("click", () => selectSlot(slot));
      button.addEventListener("mousemove", moveTooltip);
      button.addEventListener("mouseenter", (e) => slotTooltip(e, slot));
      button.addEventListener("mouseleave", hideTooltip);
      grid.appendChild(button);
    }
    panel.append(head, grid);
    root.appendChild(panel);
  }
}

function slotEntry(slot) {
  return state.save.loaded ? state.save.inventory[String(slot)] : undefined;
}

function slotTooltip(event, slot) {
  const entry = slotEntry(slot);
  if (!entry) {
    showTooltip(event, `${t("slot")} ${slot}`, t("empty"));
    return;
  }
  const item = state.byId.get(entry.ItemData);
  const name = item ? itemName(item) : entry.ItemData;
  const parts = [];
  if (entry.Count) parts.push(`×${entry.Count}`);
  if (entry.Durability) parts.push(`${t("durability")}: ${entry.Durability}`);
  showTooltip(event, name, `${t("slot")} ${slot}${parts.length ? " • " + parts.join(" • ") : ""}`);
}

function renderSlot(slot) {
  const button = document.querySelector(`.slot[data-slot="${slot}"]`);
  if (!button) return;
  const entry = slotEntry(slot);
  button.innerHTML = "";
  button.classList.toggle("filled", Boolean(entry));
  button.classList.toggle("selected", state.selectedSlot === slot);

  const num = document.createElement("span");
  num.className = "slot-num";
  num.textContent = slot;
  button.appendChild(num);

  if (!entry) return;
  const item = state.byId.get(entry.ItemData);
  if (item && item.icon) {
    const img = document.createElement("img");
    img.src = `assets/icons/${item.icon}`;
    img.alt = itemName(item);
    button.appendChild(img);
  } else {
    const emoji = document.createElement("span");
    emoji.className = "slot-emoji";
    emoji.textContent = item ? item.emoji : "❓";
    button.appendChild(emoji);
  }
  if (entry.Count > 1) {
    const count = document.createElement("span");
    count.className = "count";
    count.textContent = entry.Count;
    button.appendChild(count);
  }
  if (entry.Durability && item && item.durability) {
    const bar = document.createElement("span");
    bar.className = "dur";
    const fill = document.createElement("i");
    fill.style.width = `${Math.min(100, (entry.Durability / item.durability) * 100)}%`;
    bar.appendChild(fill);
    button.appendChild(bar);
  }
}

function renderAllSlots() {
  document.querySelectorAll(".slot").forEach((el) => renderSlot(Number(el.dataset.slot)));
}

function selectSlot(slot) {
  const previous = state.selectedSlot;
  state.selectedSlot = slot;
  if (previous !== null) renderSlot(previous);
  renderSlot(slot);
  updateActions();
}

function flashSlot(slot) {
  const button = document.querySelector(`.slot[data-slot="${slot}"]`);
  if (!button) return;
  button.classList.remove("flash");
  void button.offsetWidth; // reinicia a animação
  button.classList.add("flash");
}

// ---------------------------------------------------------------------------
// Browser de itens
// ---------------------------------------------------------------------------

function filteredItems() {
  const query = state.search.trim().toLowerCase();
  return state.catalog.filter((item) => {
    if (state.category && item.category !== state.category) return false;
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      itemName(item).toLowerCase().includes(query) ||
      categoryName(item.category).toLowerCase().includes(query)
    );
  });
}

function buildChips() {
  const chips = $("chips");
  chips.innerHTML = "";
  const categories = [...new Set(state.catalog.map((i) => i.category))]
    .sort((a, b) => categoryName(a).localeCompare(categoryName(b)));

  const all = document.createElement("button");
  all.className = "chip" + (state.category === null ? " active" : "");
  all.textContent = t("all_categories");
  all.addEventListener("click", () => {
    state.category = null;
    buildChips();
    renderItemGrid();
  });
  chips.appendChild(all);

  for (const category of categories) {
    const chip = document.createElement("button");
    chip.className = "chip" + (state.category === category ? " active" : "");
    chip.textContent = categoryName(category);
    chip.addEventListener("click", () => {
      state.category = state.category === category ? null : category;
      buildChips();
      renderItemGrid();
    });
    chips.appendChild(chip);
  }
}

function renderItemGrid() {
  const grid = $("item-grid");
  grid.innerHTML = "";
  const items = filteredItems();
  $("items-count").textContent = t("items_count", { n: items.length });

  items.forEach((item, index) => {
    const cell = document.createElement("button");
    cell.className = "item-cell" + (state.selectedItem === item ? " active" : "");
    cell.setAttribute("role", "option");
    if (index < 40) cell.style.animationDelay = `${index * 12}ms`;
    else cell.style.animation = "none";

    if (item.icon) {
      const img = document.createElement("img");
      img.src = `assets/icons/${item.icon}`;
      img.alt = itemName(item);
      img.loading = "lazy";
      cell.appendChild(img);
    } else {
      const emoji = document.createElement("span");
      emoji.className = "cell-emoji";
      emoji.textContent = item.emoji;
      cell.appendChild(emoji);
    }
    cell.addEventListener("click", () => selectItem(item));
    cell.addEventListener("mousemove", moveTooltip);
    cell.addEventListener("mouseenter", (e) =>
      showTooltip(e, itemName(item), categoryName(item.category))
    );
    cell.addEventListener("mouseleave", hideTooltip);
    grid.appendChild(cell);
  });
}

function selectItem(item) {
  state.selectedItem = item;
  document.querySelectorAll(".item-cell.active").forEach((el) => el.classList.remove("active"));
  renderItemGrid();
  renderDetail();
  updateActions();
}

function renderDetail() {
  const item = state.selectedItem;
  $("detail-hint").hidden = Boolean(item);
  $("detail").hidden = !item;
  if (!item) return;

  const icon = $("detail-icon");
  const emoji = $("detail-emoji");
  if (item.icon) {
    icon.src = `assets/icons/${item.icon}`;
    icon.hidden = false;
    emoji.hidden = true;
  } else {
    icon.hidden = true;
    emoji.textContent = item.emoji;
    emoji.hidden = false;
  }

  const power = $("detail-power");
  if (item.power_level >= 1 && item.power_level <= 4) {
    power.src = `assets/theme/PowerLevel${item.power_level}.png`;
    power.hidden = false;
  } else {
    power.hidden = true;
  }

  $("detail-name").textContent = itemName(item);
  $("detail-cat").textContent = categoryName(item.category);

  const stats = $("detail-stats");
  stats.innerHTML = "";
  const rows = [
    [t("stack"), item.max_stack],
    [t("durability"), item.durability],
    [t("weight"), item.weight],
    [t("power_level"), item.power_level],
  ];
  for (const [label, value] of rows) {
    if (value === null || value === undefined) continue;
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    stats.append(dt, dd);
  }

  const qty = $("qty");
  qty.max = item.max_stack;
  qty.value = item.max_stack;
  $("qty-max-n").textContent = item.max_stack;
}

function clampQty() {
  const item = state.selectedItem;
  const qty = $("qty");
  const max = item ? item.max_stack : 1;
  qty.value = Math.max(1, Math.min(Number(qty.value) || 1, max));
}

// ---------------------------------------------------------------------------
// Ações / estado geral
// ---------------------------------------------------------------------------

function updateActions() {
  const canAdd = state.save.loaded && state.selectedSlot !== null && state.selectedItem;
  const btnAdd = $("btn-add");
  btnAdd.disabled = !canAdd;
  btnAdd.textContent =
    state.selectedSlot !== null
      ? `➕ ${t("add_to_slot", { slot: state.selectedSlot })}`
      : `➕ ${t("select_slot_hint")}`;
  $("btn-clear").disabled = !(state.save.loaded && state.selectedSlot !== null);
  $("btn-save").disabled = !state.save.loaded;
  $("dirty-dot").hidden = !(state.save.loaded && state.save.dirty);
}

function applySaveState(save) {
  state.save = save;
  const loaded = save.loaded;
  $("layout").hidden = !loaded;
  $("hero").hidden = loaded;
  $("char-badge").hidden = !loaded;
  if (loaded) {
    $("char-name").textContent = save.character_name;
    $("char-file").textContent = save.file_name;
    $("attr-health").value = Math.round(save.health);
    $("attr-stamina").value = Math.round(save.stamina);
    // barras ilustrativas (escala de 0–200, típico dos atributos do jogo)
    $("bar-health").style.width = `${Math.min(100, (save.health / 200) * 100)}%`;
    $("bar-stamina").style.width = `${Math.min(100, (save.stamina / 200) * 100)}%`;
    renderAllSlots();
  } else {
    loadRecents();
  }
  updateActions();
}

// ---------------------------------------------------------------------------
// Fluxos
// ---------------------------------------------------------------------------

async function openViaDialog() {
  if (state.save.loaded && state.save.dirty && !confirm(t("confirm_discard"))) return;
  try {
    const result = await api("/api/browse", {});
    if (result.cancelled) return;
    applySaveState(result);
    toast(t("toast_opened", { name: result.character_name }), "success");
  } catch (err) {
    toast(err.message, "error");
  }
}

async function openPath(path) {
  if (state.save.loaded && state.save.dirty && !confirm(t("confirm_discard"))) return;
  try {
    const result = await api("/api/open", { path });
    applySaveState(result);
    toast(t("toast_opened", { name: result.character_name }), "success");
  } catch (err) {
    toast(err.message, "error");
  }
}

async function writeSave() {
  try {
    const result = await api("/api/write", {});
    applySaveState(result);
    toast(t("toast_saved", { backup: result.backup }), "success", t("toast_saved_warning"));
  } catch (err) {
    toast(err.message, "error");
  }
}

async function addItem() {
  const { selectedSlot: slot, selectedItem: item } = state;
  if (slot === null || !item) return;
  clampQty();
  try {
    const result = await api("/api/slot", {
      slot,
      item_id: item.id,
      count: Number($("qty").value),
    });
    applySaveState(result);
    flashSlot(slot);
    toast(t("toast_item_added", { item: itemName(item), count: $("qty").value, slot }), "success");
  } catch (err) {
    toast(err.message, "error");
  }
}

async function clearSlot() {
  if (state.selectedSlot === null) return;
  try {
    const result = await api("/api/clear", { slot: state.selectedSlot });
    applySaveState(result);
    toast(t("toast_slot_cleared", { slot: state.selectedSlot }));
  } catch (err) {
    toast(err.message, "error");
  }
}

async function applyAttributes() {
  try {
    const result = await api("/api/attributes", {
      health: Number($("attr-health").value),
      stamina: Number($("attr-stamina").value),
    });
    applySaveState(result);
    toast(t("toast_attributes"), "success");
  } catch (err) {
    toast(err.message, "error");
  }
}

async function loadRecents() {
  try {
    const { recents } = await api("/api/recents");
    $("recents").hidden = recents.length === 0;
    const list = $("recents-list");
    list.innerHTML = "";
    for (const path of recents) {
      const li = document.createElement("li");
      const button = document.createElement("button");
      const name = path.split("/").pop();
      const strong = document.createElement("strong");
      strong.textContent = name;
      button.appendChild(strong);
      button.appendChild(document.createTextNode(path));
      button.title = path;
      button.addEventListener("click", () => openPath(path));
      li.appendChild(button);
      list.appendChild(li);
    }
  } catch {
    /* recentes são opcionais */
  }
}

// ---------------------------------------------------------------------------
// Partículas (brasas)
// ---------------------------------------------------------------------------

function startEmbers() {
  const canvas = $("embers");
  const ctx = canvas.getContext("2d");
  let embers = [];

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  resize();
  addEventListener("resize", resize);

  const COUNT = Math.min(46, Math.floor(innerWidth / 30));

  function spawn(randomY = false) {
    return {
      x: Math.random() * canvas.width,
      y: randomY ? Math.random() * canvas.height : canvas.height + 8,
      r: 0.6 + Math.random() * 1.8,
      vy: 0.15 + Math.random() * 0.45,
      vx: (Math.random() - 0.5) * 0.22,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.15 + Math.random() * 0.4,
    };
  }
  for (let i = 0; i < COUNT; i++) embers.push(spawn(true));

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  (function frame(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      e.y -= e.vy;
      e.x += e.vx + Math.sin(time / 1800 + e.phase) * 0.12;
      if (e.y < -10) embers[i] = spawn();
      const flicker = 0.75 + 0.25 * Math.sin(time / 300 + e.phase * 3);
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(226, 183, 78, ${e.alpha * flicker})`;
      ctx.fill();
    }
    requestAnimationFrame(frame);
  })(0);
}

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------

function bindEvents() {
  $("btn-open").addEventListener("click", openViaDialog);
  $("btn-hero-open").addEventListener("click", openViaDialog);
  $("btn-save").addEventListener("click", writeSave);
  $("btn-add").addEventListener("click", addItem);
  $("btn-clear").addEventListener("click", clearSlot);
  $("btn-attrs").addEventListener("click", applyAttributes);

  $("search").addEventListener("input", (e) => {
    state.search = e.target.value;
    renderItemGrid();
  });

  $("qty").addEventListener("change", clampQty);
  $("qty-minus").addEventListener("click", () => {
    $("qty").value = Number($("qty").value) - 1;
    clampQty();
  });
  $("qty-plus").addEventListener("click", () => {
    $("qty").value = Number($("qty").value) + 1;
    clampQty();
  });
  $("qty-max").addEventListener("click", () => {
    if (state.selectedItem) $("qty").value = state.selectedItem.max_stack;
  });

  $("lang-select").value = state.lang;
  $("lang-select").addEventListener("change", (e) => {
    state.lang = e.target.value;
    localStorage.setItem("dw-lang", state.lang);
    document.documentElement.lang = state.lang;
    applyStaticI18n();
    buildChips();
    renderItemGrid();
    renderDetail();
    renderAllSlots();
    updateActions();
  });

  addEventListener("beforeunload", (e) => {
    if (state.save.loaded && state.save.dirty) e.preventDefault();
  });
}

async function init() {
  startEmbers();
  bindEvents();

  const catalog = await api("/api/catalog");
  state.catalog = catalog.items;
  state.byId = new Map(catalog.items.map((item) => [item.id, item]));
  state.sections = catalog.sections;
  state.locales = catalog.locales;

  applyStaticI18n();
  buildInventory();
  buildChips();
  renderItemGrid();

  const save = await api("/api/state");
  applySaveState(save);
}

init().catch((err) => toast(err.message, "error"));
