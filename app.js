/*
 * ФПИ Банк — Личный финансовый дневник (Apple Minimalist Redesign)
 * Local-first PWA + Firebase Firestore Sync + Stacked Card Deck + Fixed Commute Math
 */

const firebaseConfig = {
  apiKey: "AIzaSyBkJMhoEC18iK_khQA_ax03TvEobKHa5WY",
  authDomain: "solo-fpi-bank.firebaseapp.com",
  projectId: "solo-fpi-bank",
  storageBucket: "solo-fpi-bank.firebasestorage.app",
  messagingSenderId: "60894842735",
  appId: "1:60894842735:web:5d2f6755834e7e6136e29a"
};
const FIREBASE_CONFIG = firebaseConfig;

const FIREBASE_VERSION = "10.13.1";
const STORAGE_KEY = "solo_fpi_state_v1";
const THEME_KEY = "solo_fpi_theme_v2";
const PLANNER_KEY = "solo_fpi_planner_v2";
const GROUP_ID = "solo_fpi_v1";

/* Единый набор векторных SVG-иконок (1.75px stroke, без эмодзи) */
const ICONS = {
  food:      `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
  groceries: `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  cafe:      `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2M14 2v2M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h12a4 4 0 1 1 0 8h-1"/></svg>`,
  transport: `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>`,
  shopping:  `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>`,
  home:      `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  subs:      `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  fun:       `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M15 13h.01M18 11h.01"/></svg>`,
  health:    `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  beauty:    `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`,
  transfer:  `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"/></svg>`,
  other:     `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`
};

const CATEGORIES = {
  food:      { label: "Еда",         color: "#a855f7" },
  groceries: { label: "Продукты",    color: "#34d399" },
  cafe:      { label: "Кафе",        color: "#fb923c" },
  transport: { label: "Транспорт",   color: "#38bdf8" },
  shopping:  { label: "Покупки",     color: "#f472b6" },
  home:      { label: "Дом",         color: "#818cf8" },
  subs:      { label: "Подписки",    color: "#2dd4bf" },
  fun:       { label: "Развлечения", color: "#facc15" },
  health:    { label: "Аптека",      color: "#fb7185" },
  beauty:    { label: "Уход",        color: "#e879f9" },
  transfer:  { label: "Переводы",    color: "#94a3b8" },
  other:     { label: "Другое",      color: "#64748b" }
};

function getDefaultPlanner() {
  try {
    const saved = JSON.parse(localStorage.getItem(PLANNER_KEY) || "{}");
    return {
      busPrice: Number.isFinite(Number(saved.busPrice)) ? Number(saved.busPrice) : 42,
      homeTicketPrice: Number.isFinite(Number(saved.homeTicketPrice)) ? Number(saved.homeTicketPrice) : 175,
      creditLimit: Number.isFinite(Number(saved.creditLimit)) && Number(saved.creditLimit) > 0 ? Number(saved.creditLimit) : 10000,
      autoResetCredit: saved.autoResetCredit !== false,
      lastResetMonth: String(saved.lastResetMonth || "")
    };
  } catch (_) {
    return { busPrice: 42, homeTicketPrice: 175, creditLimit: 10000, autoResetCredit: true, lastResetMonth: "" };
  }
}

function getDefaultCards() {
  return [
    { id: "card_1", slot: 0, name: "Кредитка ФПИ", bank: "ФПИ БАНК", digits: "2004", balance: 10000, skin: "fpi-obsidian", customBg: "", updatedAt: 0 },
    { id: "card_2", slot: 1, name: "Повседневная", bank: "ФПИ BLACK", digits: "7741", balance: 0, skin: "titanium-dark", customBg: "", updatedAt: 0 },
    { id: "card_3", slot: 2, name: "Накопительная", bank: "ФПИ ПРАЙМ", digits: "9012", balance: 0, skin: "pacific-blue", customBg: "", updatedAt: 0 }
  ];
}

function localISODate(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

const state = {
  cards: getDefaultCards(),
  expenses: [],
  planner: getDefaultPlanner(),
  theme: localStorage.getItem(THEME_KEY) || "dark",
  activeCardSlot: 0,
  filterCardId: "all",
  analyticsCardId: "all",
  periodMode: "month",
  analyticsMonth: localISODate().slice(0, 7),
  selectedAnalyticsCategory: null,
  selectedCalendarDate: localISODate(),
  editingCardSlot: 0,
  editingCardSkin: "fpi-obsidian",
  txType: "expense",
  txCardId: "card_1",
  txCategory: "food",
  editingExpenseId: null,
  unsubscribers: []
};

let firestore = null;
let firebaseFns = null;
let toastTimer = null;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function roundMoney(v) { return Math.round((Number(v) + Number.EPSILON) * 100) / 100; }
function money(v) { return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(v) || 0) + " ₽"; }
function compactMoney(v) {
  const n = Math.abs(Number(v) || 0);
  if (!n) return "";
  if (n >= 10000) return `${Math.round(n / 1000)}к`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}к`;
  return `${Math.round(n)}`;
}
function escapeHTML(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
function dateLabel(iso) {
  if (!iso) return "";
  const today = localISODate();
  const yesterday = localISODate(new Date(Date.now() - 86400000));
  if (iso === today) return "Сегодня";
  if (iso === yesterday) return "Вчера";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}
function shortDate(iso) {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
function showToast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
function setSyncStatus(mode) {
  const dot = $("#sync-dot");
  if (!dot) return;
  dot.classList.remove("online", "busy");
  if (mode === "online") dot.classList.add("online");
  if (mode === "busy") dot.classList.add("busy");
}

/* ================= ХРАНИЛИЩЕ ================= */

function mapLegacySkin(skin) {
  const valid = ["fpi-obsidian", "titanium-dark", "pacific-blue", "alpine-green", "natural-titanium", "crimson-noir", "custom"];
  if (valid.includes(skin)) return skin;
  if (skin === "fpi-purple" || skin === "cyber") return "fpi-obsidian";
  if (skin === "emerald") return "alpine-green";
  if (skin === "ruby") return "crimson-noir";
  if (skin === "gold") return "natural-titanium";
  if (skin === "holo" || skin === "liquid-glass") return "pacific-blue";
  return "titanium-dark";
}

function normalizeCards(raw) {
  const defs = getDefaultCards();
  if (!Array.isArray(raw) || !raw.length) return defs;
  return defs.map((def, idx) => {
    const f = raw.find(c => c && (c.id === def.id || Number(c.slot) === idx)) || {};
    return {
      id: def.id,
      slot: idx,
      name: String(f.name || def.name).slice(0, 28),
      bank: String(f.bank || def.bank).slice(0, 20),
      digits: String(f.digits || def.digits).replace(/\D/g, "").slice(-4) || def.digits,
      balance: Number.isFinite(Number(f.balance)) ? roundMoney(Number(f.balance)) : def.balance,
      skin: mapLegacySkin(f.skin || def.skin),
      customBg: String(f.customBg || ""),
      updatedAt: Number(f.updatedAt) || 0
    };
  });
}

function readLocal() {
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    state.cards = normalizeCards(p.cards);
    state.expenses = Array.isArray(p.expenses) ? p.expenses : [];
  } catch (_) {
    state.cards = getDefaultCards();
    state.expenses = [];
  }
}

function writeLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cards: state.cards, expenses: state.expenses }));
  } catch (_) {}
}

function savePlanner() {
  try { localStorage.setItem(PLANNER_KEY, JSON.stringify(state.planner)); } catch (_) {}
}

function setTheme(theme) {
  state.theme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.style.colorScheme = state.theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = state.theme === "light" ? "#f5f5f7" : "#07070b";
  $$("[data-theme-choice]").forEach(b => b.classList.toggle("active", b.dataset.themeChoice === state.theme));
  try { localStorage.setItem(THEME_KEY, state.theme); } catch (_) {}
}

/* ================= СТОПКА КАРТ (АНИМАЦИЯ ЛИСТАНИЯ ДРУГ ИЗ-ПОД ДРУГА) ================= */

function renderCardDeck() {
  const deck = $("#card-deck");
  if (!deck) return;

  deck.innerHTML = state.cards.map((card, idx) => {
    const pos = (idx - state.activeCardSlot + 3) % 3;
    const customStyle = card.skin === "custom" && card.customBg
      ? `style="--card-custom-img: url('${escapeHTML(card.customBg)}')"`
      : "";

    return `
      <article class="bank-card" data-slot="${idx}" data-pos="${pos}" data-skin="${escapeHTML(card.skin)}" ${customStyle}>
        <svg class="card-wave-svg" viewBox="0 0 340 214" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 165 Q110 85 210 135 T340 35 L340 214 L0 214 Z" fill="rgba(255,255,255,0.12)"/>
        </svg>
        <div class="card-top-row">
          <span class="card-bank-name">${escapeHTML(card.bank || "ФПИ БАНК")}</span>
          <button class="card-edit-trigger" type="button" data-edit-card="${idx}" aria-label="Настроить карту">
            <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
        </div>
        <div class="card-mid-row">
          <div class="emv-chip"></div>
          <svg class="nfc-icon" viewBox="0 0 24 24" stroke-linecap="round">
            <path d="M8.5 14.5A4 4 0 0 0 8.5 9.5M12 17a7.5 7.5 0 0 0 0-10M15.5 19.5a11 11 0 0 0 0-15"/>
          </svg>
        </div>
        <div class="card-bottom-row">
          <div>
            <div class="card-name-sub">${escapeHTML(card.name)}</div>
            <div class="card-balance">${money(card.balance)}</div>
          </div>
          <div class="card-digits">•••• ${escapeHTML(card.digits || "2004")}</div>
        </div>
      </article>
    `;
  }).join("");

  $$("[data-deck-dot]").forEach((dot, i) => dot.classList.toggle("active", i === state.activeCardSlot));

  state.cards.forEach((c, i) => {
    const anPill = $(`#an-pill-${i}`);
    if (anPill) anPill.textContent = c.name;
    const selBtn = $(`#expense-card-selector [data-select-card="${c.id}"]`);
    if (selBtn) selBtn.textContent = c.name;
  });
}

function cycleCard(dir = 1) {
  const deck = $("#card-deck");
  const front = deck?.querySelector('.bank-card[data-pos="0"]');
  if (front) {
    front.classList.add(dir > 0 ? "exit-left" : "exit-right");
  }
  setTimeout(() => {
    state.activeCardSlot = (state.activeCardSlot + dir + 3) % 3;
    renderCardDeck();
  }, 160);
}

function initDeckGestures() {
  const deck = $("#card-deck");
  if (!deck) return;

  let startX = 0;
  let currentX = 0;
  let dragging = false;
  let activeEl = null;

  deck.addEventListener("pointerdown", e => {
    if (e.target.closest("[data-edit-card]")) return;
    const card = e.target.closest(".bank-card");
    if (!card) return;
    if (card.dataset.pos !== "0") {
      state.activeCardSlot = Number(card.dataset.slot);
      renderCardDeck();
      return;
    }
    dragging = true;
    activeEl = card;
    startX = e.clientX;
    currentX = 0;
    activeEl.classList.add("dragging");
    activeEl.setPointerCapture?.(e.pointerId);
  });

  deck.addEventListener("pointermove", e => {
    if (!dragging || !activeEl) return;
    currentX = e.clientX - startX;
    const rot = Math.max(-8, Math.min(8, currentX * 0.03));
    activeEl.style.transform = `translate3d(${currentX}px, 0, 0) rotate(${rot}deg)`;
  });

  const finishDrag = () => {
    if (!dragging || !activeEl) return;
    dragging = false;
    activeEl.classList.remove("dragging");
    if (Math.abs(currentX) > 55) {
      const dir = currentX < 0 ? 1 : -1;
      activeEl.style.transform = "";
      cycleCard(dir);
    } else {
      activeEl.style.transform = "";
    }
    activeEl = null;
  };

  deck.addEventListener("pointerup", finishDrag);
  deck.addEventListener("pointercancel", finishDrag);

  deck.addEventListener("click", e => {
    const editBtn = e.target.closest("[data-edit-card]");
    if (editBtn) {
      e.stopPropagation();
      openCardModal(Number(editBtn.dataset.editCard));
    }
  });
}

/* ================= ИСПРАВЛЕННЫЙ РАСЧЁТ ДНЕВНОГО ЛИМИТА КРЕДИТКИ ================= */

function calculateCreditMath() {
  const card = state.cards[0] || getDefaultCards()[0];
  const balance = roundMoney(Number(card.balance) || 0);
  const limit = roundMoney(Number(state.planner.creditLimit) || 10000);
  const busPrice = roundMoney(Number(state.planner.busPrice) || 42);
  const homePrice = roundMoney(Number(state.planner.homeTicketPrice) || 175);
  const dailyCommuteCost = roundMoney(busPrice + homePrice);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const todayISO = localISODate(now);

  const daysLeft = Math.max(1, lastDay - todayDate + 1);
  let futureWeekdays = 0;
  for (let d = todayDate + 1; d <= lastDay; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow >= 1 && dow <= 5) futureWeekdays++;
  }
  const todayDow = now.getDay();
  const isTodayWeekday = todayDow >= 1 && todayDow <= 5;
  const totalWeekdaysLeft = futureWeekdays + (isTodayWeekday ? 1 : 0);

  const todayTxs = state.expenses.filter(
    tx => tx.cardId === "card_1" && tx.type !== "income" && tx.date === todayISO
  );

  // Считаем траты на транспорт и остальные траты за сегодня
  const todayTotalSpent = roundMoney(todayTxs.reduce((s, tx) => s + (Number(tx.amount) || 0), 0));
  const todayTransportSpent = roundMoney(
    todayTxs
      .filter(tx => tx.category === "transport" || /автобус|билет|проезд|вокзал/i.test(String(tx.description || "")))
      .reduce((s, tx) => s + (Number(tx.amount) || 0), 0)
  );

  // Бронь покрывает только обязательный будний проезд (до dailyCommuteCost).
  // Любой обычный проезд сверх 217 ₽ (или любой проезд в выходные) вычитается из свободного дневного лимита!
  const todayCommuteCovered = isTodayWeekday ? Math.min(todayTransportSpent, dailyCommuteCost) : 0;
  const todayNonCommuteSpent = roundMoney(todayTotalSpent - todayCommuteCovered);
  const todayRemainingCommute = isTodayWeekday ? roundMoney(Math.max(0, dailyCommuteCost - todayCommuteCovered)) : 0;

  const reservedForCommute = roundMoney(futureWeekdays * dailyCommuteCost + todayRemainingCommute);
  const freeBalance = roundMoney(Math.max(0, balance - reservedForCommute));

  const dailyFreeAllowance = roundMoney(Math.max(0, (freeBalance + todayNonCommuteSpent) / daysLeft));
  const todayFreeLeft = roundMoney(dailyFreeAllowance - todayNonCommuteSpent);

  // Полный расчёт без вычета дороги (учитывает ВСЕ сегодняшние траты, включая обычный проезд)
  const dailyFullAllowance = roundMoney(Math.max(0, (balance + todayTotalSpent) / daysLeft));
  const todayFullLeft = roundMoney(dailyFullAllowance - todayTotalSpent);

  const base = Math.max(limit, balance, 1);
  const spentPct = Math.min(100, Math.max(0, ((base - balance) / base) * 100));
  const reservedPct = Math.min(100 - spentPct, Math.max(0, (reservedForCommute / base) * 100));
  const freePct = Math.max(0, 100 - spentPct - reservedPct);

  return {
    balance, limit, busPrice, homePrice, dailyCommuteCost,
    daysLeft, totalWeekdaysLeft, reservedForCommute, freeBalance,
    dailyFreeAllowance, todayFreeLeft, dailyFullAllowance, todayFullLeft,
    spentPct, reservedPct, freePct
  };
}

function renderCreditPlanner() {
  const info = calculateCreditMath();

  $("#home-daily-free").innerHTML = `${money(info.dailyFreeAllowance)} <span>/ день</span>`;
  $("#home-daily-full").textContent = money(info.dailyFullAllowance);

  $("#bar-spent").style.width = `${info.spentPct}%`;
  $("#bar-reserved").style.width = `${info.reservedPct}%`;
  $("#bar-free").style.width = `${info.freePct}%`;

  const detFree = $("#det-today-free");
  detFree.textContent = info.todayFreeLeft >= 0 ? money(info.todayFreeLeft) : `−${money(Math.abs(info.todayFreeLeft))}`;
  detFree.style.color = info.todayFreeLeft >= 0 ? "var(--green)" : "var(--red)";

  const detFull = $("#det-today-full");
  detFull.textContent = info.todayFullLeft >= 0 ? money(info.todayFullLeft) : `−${money(Math.abs(info.todayFullLeft))}`;
  detFull.style.color = info.todayFullLeft >= 0 ? "var(--text)" : "var(--red)";

  $("#det-reserved").textContent = `${money(info.reservedForCommute)} (${info.totalWeekdaysLeft} будн.)`;
  $("#det-free-bal").textContent = money(info.freeBalance);

  // Аналитика
  $("#an-daily-free").textContent = `${money(info.dailyFreeAllowance)}/д`;
  $("#an-daily-full").textContent = `${money(info.dailyFullAllowance)}/д`;
  $("#an-reserve-line").textContent = `Бронь Пн–Пт: ${money(info.reservedForCommute)} (${info.totalWeekdaysLeft} будн.)`;
  $("#an-days-line").textContent = `Осталось ${info.daysLeft} дн.`;
  $("#an-bar-spent").style.width = `${info.spentPct}%`;
  $("#an-bar-reserved").style.width = `${info.reservedPct}%`;
  $("#an-bar-free").style.width = `${info.freePct}%`;

  // Кнопки быстрого ввода и настройки
  $("#preset-bus-price").textContent = money(info.busPrice);
  $("#preset-home-price").textContent = money(info.homePrice);
  $("#preset-both-price").textContent = money(info.dailyCommuteCost);

  if (document.activeElement !== $("#setting-bus-price")) $("#setting-bus-price").value = String(info.busPrice);
  if (document.activeElement !== $("#setting-home-price")) $("#setting-home-price").value = String(info.homePrice);
  if (document.activeElement !== $("#setting-credit-limit")) $("#setting-credit-limit").value = String(info.limit);

  $$("[data-auto-reset]").forEach(b => b.classList.toggle("active", (b.dataset.autoReset === "true") === state.planner.autoResetCredit));
  $("#settings-reset-credit-now").textContent = `Выставить баланс ${money(info.limit)} сейчас`;
}

async function checkMonthlyCreditReset() {
  const curMonth = localISODate().slice(0, 7);
  if (!state.planner.autoResetCredit) return;
  if (!state.planner.lastResetMonth) {
    state.planner.lastResetMonth = curMonth;
    savePlanner();
    return;
  }
  if (state.planner.lastResetMonth !== curMonth) {
    state.planner.lastResetMonth = curMonth;
    savePlanner();
    const lim = roundMoney(state.planner.creditLimit || 10000);
    if (state.cards[0]) {
      state.cards[0].balance = lim;
      state.cards[0].updatedAt = Date.now();
      writeLocal();
      renderAll();
      showToast(`1-е число: баланс Кредитки обновлён до ${money(lim)}`);
      await syncCardToCloud(state.cards[0]);
    }
  }
}

/* ================= ЛЕНТА ОПЕРАЦИЙ (БЕЗ ПЛИТОК) ================= */

function renderHomeExpenses() {
  const list = $("#expense-list");
  if (!list) return;

  const filtered = state.expenses.filter(tx => state.filterCardId === "all" || tx.cardId === state.filterCardId);
  const sorted = [...filtered].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")) || Number(b.createdAt || 0) - Number(a.createdAt || 0));

  const cardObj = state.cards.find(c => c.id === state.filterCardId);
  $("#home-filter-label").textContent = cardObj ? cardObj.name : "Все операции";
  $("#home-filter-cycle").classList.toggle("active", state.filterCardId !== "all");

  if (!sorted.length) {
    list.innerHTML = `<div class="empty-block">Пока нет операций. Нажми «+» внизу, чтобы записать первую трату.</div>`;
    return;
  }

  const todayISO = localISODate();
  let lastDate = "";
  const html = [];
  let idx = 0;

  for (const tx of sorted) {
    const d = tx.date || "";
    if (d !== lastDate) {
      if (d !== todayISO || lastDate !== "") {
        const daySum = roundMoney(sorted.filter(x => x.date === d && x.type !== "income").reduce((s, x) => s + (Number(x.amount) || 0), 0));
        html.push(`<div class="tx-group-label"><span>${escapeHTML(dateLabel(d))}</span><span>${daySum > 0 ? `−${money(daySum)}` : ""}</span></div>`);
      }
      lastDate = d;
    }

    const cat = CATEGORIES[tx.category] || CATEGORIES.other;
    const iconSvg = ICONS[tx.category] || ICONS.other;
    const cObj = state.cards.find(c => c.id === tx.cardId) || state.cards[0];
    const isInc = tx.type === "income";

    html.push(`
      <button class="tx-row" style="--i:${Math.min(idx++, 10)}" type="button" data-expense-id="${escapeHTML(tx.id)}">
        <span class="tx-icon">${iconSvg}</span>
        <span class="tx-copy">
          <div class="tx-name">${escapeHTML(tx.description || cat.label)}</div>
          <div class="tx-sub">${escapeHTML(cObj?.name || "ФПИ")} · ${escapeHTML(cat.label)}</div>
        </span>
        <span class="tx-amount ${isInc ? "income" : ""}">${isInc ? "+" : "−"}${money(tx.amount)}</span>
      </button>
    `);
  }

  list.innerHTML = html.join("");
}

/* ================= АНАЛИТИКА ================= */

function getPeriodRange() {
  if (state.periodMode === "28days") {
    const end = new Date();
    const start = new Date(Date.now() - 27 * 86400000);
    const startISO = localISODate(start);
    const endISO = localISODate(end);
    return { startISO, endISO, daysCount: 28, label: `${shortDate(startISO)} — ${shortDate(endISO)}` };
  }
  const [y, m] = state.analyticsMonth.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0);
  const raw = first.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  return {
    startISO: localISODate(first),
    endISO: localISODate(last),
    daysCount: last.getDate(),
    label: raw.charAt(0).toUpperCase() + raw.slice(1),
    year: y, month: m
  };
}

function renderAnalytics() {
  const range = getPeriodRange();
  $("#analytics-period-label").textContent = range.label;
  $("#month-prev").style.visibility = state.periodMode === "28days" ? "hidden" : "visible";
  $("#month-next").style.visibility = state.periodMode === "28days" ? "hidden" : "visible";

  const txs = state.expenses.filter(tx => {
    if (tx.type === "income") return false;
    if (state.analyticsCardId !== "all" && tx.cardId !== state.analyticsCardId) return false;
    return String(tx.date || "") >= range.startISO && String(tx.date || "") <= range.endISO;
  });

  const total = roundMoney(txs.reduce((s, t) => s + (Number(t.amount) || 0), 0));

  // Donut + Legend
  const byCat = {};
  for (const t of txs) {
    const k = CATEGORIES[t.category] ? t.category : "other";
    byCat[k] = roundMoney((byCat[k] || 0) + (Number(t.amount) || 0));
  }
  const entries = Object.entries(byCat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);

  const segGroup = $("#radial-segments");
  const legend = $("#radial-legend");
  const r = 54;
  const circ = 2 * Math.PI * r;

  if (!entries.length || total <= 0) {
    segGroup.innerHTML = "";
    legend.innerHTML = `<div style="font-size:12px; color:var(--muted);">Нет трат за период</div>`;
    $("#radial-center-amount").textContent = "0 ₽";
    $("#radial-center-sub").textContent = "Потрачено";
  } else {
    let cum = 0;
    const gap = entries.length > 1 ? 5 : 0;
    segGroup.innerHTML = entries.map(([k, v]) => {
      const frac = v / total;
      const len = Math.max(3, frac * circ - gap);
      const offset = -(cum * circ);
      cum += frac;
      return `<circle class="donut-seg ${state.selectedAnalyticsCategory === k ? "active" : ""}" cx="70" cy="70" r="${r}" stroke="${CATEGORIES[k].color}" stroke-dasharray="${len} ${circ}" stroke-dashoffset="${offset}" data-radial-cat="${k}"/>`;
    }).join("");

    legend.innerHTML = entries.slice(0, 5).map(([k, v]) => `
      <button class="legend-item" type="button" data-radial-cat="${k}">
        <span class="legend-left">
          <span class="legend-dot" style="background:${CATEGORIES[k].color}"></span>
          <span class="legend-name">${CATEGORIES[k].label}</span>
        </span>
        <span class="legend-val">${money(v)}</span>
      </button>
    `).join("");

    const sel = state.selectedAnalyticsCategory;
    if (sel && byCat[sel]) {
      $("#radial-center-amount").textContent = money(byCat[sel]);
      $("#radial-center-sub").textContent = CATEGORIES[sel].label;
    } else {
      $("#radial-center-amount").textContent = money(total);
      $("#radial-center-sub").textContent = "Потрачено";
    }
  }

  // Calendar
  const byDate = {};
  for (const t of txs) {
    if (!t.date) continue;
    if (!byDate[t.date]) byDate[t.date] = { sum: 0, items: [] };
    byDate[t.date].sum = roundMoney(byDate[t.date].sum + (Number(t.amount) || 0));
    byDate[t.date].items.push(t);
  }

  const todayISO = localISODate();
  const cells = [];
  if (state.periodMode === "28days") {
    const startObj = new Date(`${range.startISO}T12:00:00`);
    const pad = (startObj.getDay() + 6) % 7;
    for (let i = 0; i < pad; i++) cells.push(`<div class="cal-cell empty"></div>`);
    for (let i = 0; i < 28; i++) {
      const cur = new Date(startObj.getTime() + i * 86400000);
      const iso = localISODate(cur);
      const info = byDate[iso];
      cells.push(`<button class="cal-cell ${iso === todayISO ? "today" : ""} ${iso === state.selectedCalendarDate ? "selected" : ""}" type="button" data-cal-date="${iso}"><span class="cal-num">${cur.getDate()}</span><span class="cal-sum">${info ? compactMoney(info.sum) : ""}</span></button>`);
    }
  } else {
    const firstObj = new Date(range.year, range.month - 1, 1);
    const pad = (firstObj.getDay() + 6) % 7;
    for (let i = 0; i < pad; i++) cells.push(`<div class="cal-cell empty"></div>`);
    for (let d = 1; d <= range.daysCount; d++) {
      const iso = `${state.analyticsMonth}-${String(d).padStart(2, "0")}`;
      const info = byDate[iso];
      cells.push(`<button class="cal-cell ${iso === todayISO ? "today" : ""} ${iso === state.selectedCalendarDate ? "selected" : ""}" type="button" data-cal-date="${iso}"><span class="cal-num">${d}</span><span class="cal-sum">${info ? compactMoney(info.sum) : ""}</span></button>`);
    }
  }
  $("#calendar-grid").innerHTML = cells.join("");

  const detBox = $("#calendar-day-details");
  const dayData = byDate[state.selectedCalendarDate];
  if (!state.selectedCalendarDate) {
    detBox.classList.add("hidden");
  } else {
    detBox.classList.remove("hidden");
    $("#cal-selected-date").textContent = dateLabel(state.selectedCalendarDate);
    $("#cal-selected-total").textContent = dayData ? `−${money(dayData.sum)}` : "0 ₽";
    $("#cal-detail-list").innerHTML = dayData?.items.length
      ? dayData.items.map(t => `
          <button class="tx-row" type="button" data-expense-id="${escapeHTML(t.id)}" style="padding:9px 0;">
            <span class="tx-icon" style="width:28px;height:28px;">${ICONS[t.category] || ICONS.other}</span>
            <span class="tx-copy"><div class="tx-name" style="font-size:13px;">${escapeHTML(t.description || (CATEGORIES[t.category]?.label || "Другое"))}</div></span>
            <span class="tx-amount" style="font-size:13px;">−${money(t.amount)}</span>
          </button>`).join("")
      : `<div style="font-size:12px; color:var(--muted); padding:6px 0;">Расходов не было</div>`;
  }
}

/* ================= МОДАЛКИ: ОПЕРАЦИИ И КАРТЫ ================= */

function buildCategoryGrid() {
  const grid = $("#category-grid");
  if (!grid) return;
  grid.innerHTML = Object.entries(CATEGORIES).map(([k, v]) => `
    <button class="cat-btn ${k === state.txCategory ? "selected" : ""}" type="button" data-category="${k}">
      ${ICONS[k] || ICONS.other}
      <span>${v.label}</span>
    </button>
  `).join("");
}

function setTxType(t) {
  state.txType = t === "income" ? "income" : "expense";
  $$("[data-tx-type]").forEach(b => b.classList.toggle("active", b.dataset.txType === state.txType));
}
function setTxCard(id) {
  state.txCardId = id;
  $$("[data-select-card]").forEach(b => b.classList.toggle("active", b.dataset.selectCard === id));
}
function setTxCategory(c) {
  state.txCategory = CATEGORIES[c] ? c : "other";
  $$("#category-grid [data-category]").forEach(b => b.classList.toggle("selected", b.dataset.category === state.txCategory));
}

function openNewExpense() {
  state.editingExpenseId = null;
  $("#expense-form").reset();
  $("#expense-id").value = "";
  $("#expense-date").value = localISODate();
  $("#expense-dialog-title").textContent = "Новая операция";
  $("#expense-delete").classList.add("hidden");
  $("#expense-error").textContent = "";
  setTxType("expense");
  setTxCard(state.cards[state.activeCardSlot]?.id || "card_1");
  setTxCategory("food");
  $("#expense-dialog").showModal();
  setTimeout(() => $("#expense-amount").focus(), 60);
}

function openEditExpense(id) {
  const item = state.expenses.find(e => e.id === id);
  if (!item) return;
  state.editingExpenseId = id;
  $("#expense-id").value = id;
  $("#expense-amount").value = String(item.amount);
  $("#expense-description").value = item.description || "";
  $("#expense-date").value = item.date || localISODate();
  $("#expense-dialog-title").textContent = "Редактировать";
  $("#expense-delete").classList.remove("hidden");
  $("#expense-error").textContent = "";
  setTxType(item.type);
  setTxCard(item.cardId || "card_1");
  setTxCategory(item.category || "other");
  $("#expense-dialog").showModal();
}

function applyQuickPreset(type) {
  const bus = roundMoney(state.planner.busPrice || 42);
  const home = roundMoney(state.planner.homeTicketPrice || 175);
  setTxType("expense");
  setTxCard("card_1");
  setTxCategory("transport");
  if (type === "bus") {
    $("#expense-amount").value = String(bus);
    $("#expense-description").value = "Автобус";
  } else if (type === "home") {
    $("#expense-amount").value = String(home);
    $("#expense-description").value = "Билет домой";
  } else {
    $("#expense-amount").value = String(roundMoney(bus + home));
    $("#expense-description").value = "Автобус + Билет домой";
  }
}

async function saveExpense(e) {
  e.preventDefault();
  const amount = roundMoney(Number($("#expense-amount").value));
  const date = $("#expense-date").value;
  if (!Number.isFinite(amount) || amount <= 0) {
    $("#expense-error").textContent = "Введите сумму больше нуля";
    return;
  }
  const id = $("#expense-id").value || (crypto.randomUUID ? crypto.randomUUID() : `tx_${Date.now()}`);
  const existing = state.expenses.find(x => x.id === id);
  const tx = {
    id, type: state.txType, amount, cardId: state.txCardId, category: state.txCategory,
    description: ($("#expense-description").value || "").trim(),
    date, createdAt: existing ? Number(existing.createdAt) : Date.now(), updatedAt: Date.now()
  };

  if (existing) {
    await adjustCardBalance(existing.cardId, existing.type === "income" ? -existing.amount : existing.amount);
  }
  await adjustCardBalance(tx.cardId, tx.type === "income" ? tx.amount : -tx.amount);

  if (firestore && firebaseFns) {
    setSyncStatus("busy");
    await firebaseFns.setDoc(firebaseFns.doc(firestore, "groups", GROUP_ID, "expenses", id), tx);
    setSyncStatus("online");
  } else {
    state.expenses = existing ? state.expenses.map(r => r.id === id ? tx : r) : [...state.expenses, tx];
    writeLocal();
  }
  renderAll();
  $("#expense-dialog").close();
  showToast(existing ? "Обновлено" : "Сохранено");
}

async function deleteExpense() {
  const id = $("#expense-id").value;
  const ex = state.expenses.find(x => x.id === id);
  if (!ex || !confirm("Удалить операцию?")) return;
  await adjustCardBalance(ex.cardId, ex.type === "income" ? -ex.amount : ex.amount);
  if (firestore && firebaseFns) {
    setSyncStatus("busy");
    await firebaseFns.deleteDoc(firebaseFns.doc(firestore, "groups", GROUP_ID, "expenses", id));
    setSyncStatus("online");
  } else {
    state.expenses = state.expenses.filter(x => x.id !== id);
    writeLocal();
  }
  renderAll();
  $("#expense-dialog").close();
  showToast("Удалено");
}

function openCardModal(slot = state.activeCardSlot) {
  state.editingCardSlot = slot;
  const c = state.cards[slot] || getDefaultCards()[slot];
  state.editingCardSkin = c.skin;
  $$("[data-edit-card-slot]").forEach(b => {
    const i = Number(b.dataset.editCardSlot);
    b.classList.toggle("active", i === slot);
    b.textContent = state.cards[i]?.name || `Карта ${i + 1}`;
  });
  $("#card-balance-input").value = String(c.balance);
  $("#card-name-input").value = c.name;
  $("#card-bank-input").value = c.bank;
  $("#card-digits-input").value = c.digits;
  $$("[data-card-skin]").forEach(b => b.classList.toggle("selected", b.dataset.cardSkin === c.skin));
  if (!$("#card-dialog").open) $("#card-dialog").showModal();
}

async function saveCard(e) {
  e.preventDefault();
  const idx = state.editingCardSlot;
  const cur = state.cards[idx];
  const updated = {
    ...cur,
    balance: roundMoney(Number($("#card-balance-input").value) || 0),
    name: ($("#card-name-input").value || "").trim() || cur.name,
    bank: ($("#card-bank-input").value || "").trim() || "ФПИ БАНК",
    digits: ($("#card-digits-input").value || "").replace(/\D/g, "").slice(-4) || "2004",
    skin: state.editingCardSkin,
    updatedAt: Date.now()
  };
  state.cards[idx] = updated;
  writeLocal();
  renderAll();
  $("#card-dialog").close();
  showToast("Карта обновлена");
  await syncCardToCloud(updated);
}

async function adjustCardBalance(cardId, delta) {
  const i = state.cards.findIndex(c => c.id === cardId);
  if (i === -1 || !delta) return;
  state.cards[i] = { ...state.cards[i], balance: roundMoney((Number(state.cards[i].balance) || 0) + delta), updatedAt: Date.now() };
  writeLocal();
  await syncCardToCloud(state.cards[i]);
}

async function syncCardToCloud(card) {
  if (!firestore || !firebaseFns) return;
  try {
    setSyncStatus("busy");
    await firebaseFns.setDoc(firebaseFns.doc(firestore, "groups", GROUP_ID, "cards", card.id), card);
    setSyncStatus("online");
  } catch (_) {}
}

/* ================= FIREBASE ================= */

async function initFirebase() {
  const help = $("#firebase-help");
  try {
    setSyncStatus("busy");
    const [appMod, fsMod] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
    ]);
    const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(FIREBASE_CONFIG);
    firestore = fsMod.getFirestore(app);
    firebaseFns = { collection: fsMod.collection, doc: fsMod.doc, onSnapshot: fsMod.onSnapshot, setDoc: fsMod.setDoc, deleteDoc: fsMod.deleteDoc };
    setSyncStatus("online");
    if (help) help.innerHTML = `<strong>Облако подключено (${FIREBASE_CONFIG.projectId}):</strong> все карты и траты синхронизируются автоматически.`;

    firebaseFns.onSnapshot(firebaseFns.collection(firestore, "groups", GROUP_ID, "cards"), snap => {
      if (!snap.empty) {
        state.cards = normalizeCards(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        writeLocal();
        renderAll();
      } else {
        state.cards.forEach(c => syncCardToCloud(c));
      }
      setSyncStatus("online");
    });

    firebaseFns.onSnapshot(firebaseFns.collection(firestore, "groups", GROUP_ID, "expenses"), snap => {
      state.expenses = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      writeLocal();
      renderAll();
      setSyncStatus("online");
    });
  } catch (err) {
    console.warn("Firebase offline:", err);
    setSyncStatus("");
    if (help) help.innerHTML = "<strong>Локальный режим:</strong> нет связи с облаком.";
  }
}

/* ================= СОБЫТИЯ И ЗАПУСК ================= */

function renderAll() {
  renderCardDeck();
  renderCreditPlanner();
  renderHomeExpenses();
  renderAnalytics();
}

function switchTab(tab) {
  const isAn = tab === "analytics";
  $("#screen-home").classList.toggle("active", !isAn);
  $("#screen-analytics").classList.toggle("active", isAn);
  $("#screen-heading").textContent = isAn ? "Аналитика" : "ФПИ Банк";
  $$("[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  if (isAn) renderAnalytics();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindEvents() {
  $$("[data-tab]").forEach(b => b.addEventListener("click", () => switchTab(b.dataset.tab)));
  $("#settings-open").addEventListener("click", () => $("#settings-dialog").showModal());
  $("#add-open").addEventListener("click", openNewExpense);

  $$("[data-deck-dot]").forEach(d => d.addEventListener("click", () => {
    state.activeCardSlot = Number(d.dataset.deckDot);
    renderCardDeck();
  }));

  $("#limit-strip-toggle").addEventListener("click", () => $("#limit-strip").classList.toggle("expanded"));

  $("#home-filter-cycle").addEventListener("click", () => {
    const order = ["all", "card_1", "card_2", "card_3"];
    state.filterCardId = order[(order.indexOf(state.filterCardId) + 1) % order.length];
    renderHomeExpenses();
  });

  $("#expense-list").addEventListener("click", e => {
    const row = e.target.closest("[data-expense-id]");
    if (row) openEditExpense(row.dataset.expenseId);
  });

  $("#cal-detail-list").addEventListener("click", e => {
    const row = e.target.closest("[data-expense-id]");
    if (row) openEditExpense(row.dataset.expenseId);
  });

  $("#quick-expense-presets").addEventListener("click", e => {
    const b = e.target.closest("[data-quick-preset]");
    if (b) applyQuickPreset(b.dataset.quickPreset);
  });

  $$("[data-tx-type]").forEach(b => b.addEventListener("click", () => setTxType(b.dataset.txType)));
  $$("[data-select-card]").forEach(b => b.addEventListener("click", () => setTxCard(b.dataset.selectCard)));
  $("#category-grid").addEventListener("click", e => {
    const b = e.target.closest("[data-category]");
    if (b) setTxCategory(b.dataset.category);
  });
  $("#expense-form").addEventListener("submit", saveExpense);
  $("#expense-delete").addEventListener("click", deleteExpense);

  $$("[data-edit-card-slot]").forEach(b => b.addEventListener("click", () => openCardModal(Number(b.dataset.editCardSlot))));
  $("#card-skins-grid").addEventListener("click", e => {
    const b = e.target.closest("[data-card-skin]");
    if (!b) return;
    state.editingCardSkin = b.dataset.cardSkin;
    $$("[data-card-skin]").forEach(x => x.classList.toggle("selected", x === b));
  });
  $("#card-custom-form").addEventListener("submit", saveCard);

  $("#analytics-card-pills").addEventListener("click", e => {
    const b = e.target.closest("[data-analytics-card]");
    if (!b) return;
    state.analyticsCardId = b.dataset.analyticsCard;
    state.selectedAnalyticsCategory = null;
    $$("[data-analytics-card]").forEach(x => x.classList.toggle("active", x === b));
    renderAnalytics();
  });

  $$("[data-period-mode]").forEach(b => b.addEventListener("click", () => {
    state.periodMode = b.dataset.periodMode;
    $$("[data-period-mode]").forEach(x => x.classList.toggle("active", x === b));
    renderAnalytics();
  }));

  $("#month-prev").addEventListener("click", () => {
    const [y, m] = state.analyticsMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    state.analyticsMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    renderAnalytics();
  });
  $("#month-next").addEventListener("click", () => {
    const [y, m] = state.analyticsMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    state.analyticsMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    renderAnalytics();
  });

  const toggleCat = e => {
    const t = e.target.closest("[data-radial-cat]");
    if (!t) return;
    state.selectedAnalyticsCategory = state.selectedAnalyticsCategory === t.dataset.radialCat ? null : t.dataset.radialCat;
    renderAnalytics();
  };
  $("#radial-svg").addEventListener("click", toggleCat);
  $("#radial-legend").addEventListener("click", toggleCat);

  $("#calendar-grid").addEventListener("click", e => {
    const c = e.target.closest("[data-cal-date]");
    if (!c) return;
    state.selectedCalendarDate = c.dataset.calDate;
    renderAnalytics();
  });

  $$("[data-theme-choice]").forEach(b => b.addEventListener("click", () => setTheme(b.dataset.themeChoice)));

  const onPlannerChange = () => {
    const b = Number($("#setting-bus-price").value);
    const h = Number($("#setting-home-price").value);
    const l = Number($("#setting-credit-limit").value);
    if (Number.isFinite(b) && b >= 0) state.planner.busPrice = roundMoney(b);
    if (Number.isFinite(h) && h >= 0) state.planner.homeTicketPrice = roundMoney(h);
    if (Number.isFinite(l) && l > 0) state.planner.creditLimit = roundMoney(l);
    savePlanner();
    renderCreditPlanner();
  };
  ["#setting-bus-price", "#setting-home-price", "#setting-credit-limit"].forEach(s => $(s).addEventListener("input", onPlannerChange));

  $$("[data-auto-reset]").forEach(b => b.addEventListener("click", () => {
    state.planner.autoResetCredit = b.dataset.autoReset === "true";
    savePlanner();
    renderCreditPlanner();
  }));

  $("#settings-reset-credit-now").addEventListener("click", async () => {
    const lim = roundMoney(state.planner.creditLimit || 10000);
    if (!confirm(`Выставить баланс Кредитки на ${money(lim)}?`)) return;
    state.cards[0].balance = lim;
    state.cards[0].updatedAt = Date.now();
    writeLocal();
    renderAll();
    showToast(`Баланс обновлён: ${money(lim)}`);
    await syncCardToCloud(state.cards[0]);
  });

  $("#settings-open-cards").addEventListener("click", () => {
    $("#settings-dialog").close();
    openCardModal(state.activeCardSlot);
  });

  $$("[data-close]").forEach(b => b.addEventListener("click", () => $(`#${b.dataset.close}`)?.close()));
  ["#expense-dialog", "#card-dialog", "#settings-dialog"].forEach(s => {
    const d = $(s);
    d?.addEventListener("click", e => { if (e.target === d) d.close(); });
  });
}

function bootstrap() {
  readLocal();
  setTheme(state.theme);
  buildCategoryGrid();
  renderAll();
  initDeckGestures();
  bindEvents();
  checkMonthlyCreditReset();
  initFirebase();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js", { scope: "./", updateViaCache: "none" }).catch(() => {});
    }, { once: true });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
