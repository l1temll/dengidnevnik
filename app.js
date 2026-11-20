/*
 * ФПИ Банк — Личный финансовый дневник (Solo Edition)
 * Local-first PWA + Firebase Firestore Sync + 3 кастомные карты + Радиальная аналитика и Календарь
 */

// Конфигурация Firebase (solo-fpi-bank)
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
const THEME_KEY = "solo_fpi_theme_v1";
const SURFACE_KEY = "solo_fpi_surface_v1";
const DESIGN_KEY = "solo_fpi_design_v1";
const PATTERN_KEY = "solo_fpi_pattern_v1";
const DEFAULT_PERIOD_KEY = "solo_fpi_default_period_v1";
const APP_CUSTOM_BG_KEY = "solo_fpi_custom_bg_v1";
const GROUP_ID = "solo_fpi_v1";

const CATEGORIES = {
  food:      { label: "Еда",         emoji: "🍔", color: "#a855f7" },
  groceries: { label: "Продукты",    emoji: "🛒", color: "#22c55e" },
  cafe:      { label: "Кафе",        emoji: "☕", color: "#f97316" },
  transport: { label: "Транспорт",   emoji: "🚕", color: "#38bdf8" },
  shopping:  { label: "Покупки",     emoji: "🛍️", color: "#ec4899" },
  home:      { label: "Дом",         emoji: "🏠", color: "#6366f1" },
  subs:      { label: "Подписки",    emoji: "💎", color: "#14b8a6" },
  fun:       { label: "Развлечения", emoji: "🎮", color: "#eab308" },
  health:    { label: "Аптека",      emoji: "💊", color: "#f43f5e" },
  beauty:    { label: "Уход",        emoji: "✨", color: "#d946ef" },
  transfer:  { label: "Переводы",    emoji: "💸", color: "#64748b" },
  other:     { label: "Другое",      emoji: "•••", color: "#94a3b8" }
};

function getDefaultCards() {
  return [
    {
      id: "card_1",
      slot: 0,
      name: "Основная ФПИ",
      bank: "ФПИ БАНК",
      subtitle: "Финансово-Пакостный Институт",
      digits: "2004",
      balance: 142800,
      skin: "fpi-purple",
      customBg: "",
      updatedAt: 0
    },
    {
      id: "card_2",
      slot: 1,
      name: "Повседневная",
      bank: "ФПИ BLACK",
      subtitle: "LIQUID GLASS EDITION",
      digits: "7741",
      balance: 28450,
      skin: "liquid-glass",
      customBg: "",
      updatedAt: 0
    },
    {
      id: "card_3",
      slot: 2,
      name: "Накопительная",
      bank: "ФПИ ПРАЙМ",
      subtitle: "HOLO SAVINGS VAULT",
      digits: "9012",
      balance: 310000,
      skin: "holo",
      customBg: "",
      updatedAt: 0
    }
  ];
}

function localISODate(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

const defaultPeriodPref = localStorage.getItem(DEFAULT_PERIOD_KEY) === "28days" ? "28days" : "month";

const state = {
  cards: getDefaultCards(),
  expenses: [],
  theme: localStorage.getItem(THEME_KEY) || "dark",
  surface: localStorage.getItem(SURFACE_KEY) || "liquid",
  design: localStorage.getItem(DESIGN_KEY) || "liquid",
  pattern: localStorage.getItem(PATTERN_KEY) || "bold",
  appCustomBg: localStorage.getItem(APP_CUSTOM_BG_KEY) || "",
  defaultPeriod: defaultPeriodPref,
  periodMode: defaultPeriodPref,
  analyticsMonth: localISODate().slice(0, 7),
  analyticsCardId: "all",
  selectedAnalyticsCategory: null,
  selectedCalendarDate: localISODate(),
  activeCardSlot: 0,
  editingCardSlot: 0,
  editingCardSkin: "fpi-purple",
  editingCardCustomBg: "",
  filterCardId: "all",
  txType: "expense",
  txCardId: "card_1",
  txCategory: "food",
  editingExpenseId: null,
  firebaseReady: false,
  unsubscribers: []
};

let firestore = null;
let firebaseFns = null;
let toastTimer = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function getActiveFirebaseConfig() {
  if (typeof FIREBASE_CONFIG !== "undefined" && FIREBASE_CONFIG) return FIREBASE_CONFIG;
  if (typeof firebaseConfig !== "undefined" && firebaseConfig) return firebaseConfig;
  return null;
}

function isFirebaseConfigured() {
  const cfg = getActiveFirebaseConfig();
  return Boolean(
    cfg &&
    cfg.apiKey &&
    !String(cfg.apiKey).startsWith("PASTE_") &&
    !String(cfg.apiKey).startsWith("ВСТАВЬ_") &&
    cfg.projectId &&
    !String(cfg.projectId).startsWith("PASTE_") &&
    !String(cfg.projectId).startsWith("ВСТАВЬ_") &&
    cfg.appId &&
    !String(cfg.appId).startsWith("PASTE_") &&
    !String(cfg.appId).startsWith("ВСТАВЬ_")
  );
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function money(value) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(value) || 0) + " ₽";
}

function compactMoney(value) {
  const num = Math.abs(Number(value) || 0);
  if (num === 0) return "";
  if (num >= 10000) return `${Math.round(num / 1000)}к`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(".0", "")}к`;
  return `${Math.round(num)}`;
}

function dateLabel(isoDate) {
  if (!isoDate) return "";
  const date = new Date(`${isoDate}T12:00:00`);
  const today = localISODate();
  const yesterday = localISODate(new Date(Date.now() - 86400000));
  if (isoDate === today) return "Сегодня";
  if (isoDate === yesterday) return "Вчера";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function shortDate(isoDate) {
  if (!isoDate) return "";
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function setSyncStatus(mode, label) {
  const pill = $("#sync-pill");
  const lbl = $("#sync-label");
  if (pill) {
    pill.classList.remove("online", "busy");
    if (mode === "online") pill.classList.add("online");
    if (mode === "busy") pill.classList.add("busy");
  }
  if (lbl) lbl.textContent = label;
}

/* ================= ЛОКАЛЬНОЕ ХРАНИЛИЩЕ ================= */

function normalizeCards(rawCards) {
  const defaults = getDefaultCards();
  if (!Array.isArray(rawCards) || !rawCards.length) return defaults;
  return defaults.map((def, idx) => {
    const found = rawCards.find(c => c && (c.id === def.id || Number(c.slot) === idx)) || {};
    return {
      id: def.id,
      slot: idx,
      name: String(found.name || def.name).slice(0, 28),
      bank: String(found.bank || def.bank).slice(0, 22),
      subtitle: String(found.subtitle || def.subtitle).slice(0, 32),
      digits: String(found.digits || def.digits).replace(/\D/g, "").slice(-4) || def.digits,
      balance: Number.isFinite(Number(found.balance)) ? roundMoney(Number(found.balance)) : def.balance,
      skin: String(found.skin || def.skin),
      customBg: String(found.customBg || ""),
      updatedAt: Number(found.updatedAt) || 0
    };
  });
}

function readLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    state.cards = normalizeCards(parsed.cards);
    state.expenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
  } catch (_) {
    state.cards = getDefaultCards();
    state.expenses = [];
  }
}

function writeLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cards: state.cards,
      expenses: state.expenses
    }));
  } catch (error) {
    console.warn("Ошибка сохранения в localStorage:", error);
  }
}

/* ================= ТЕМЫ, ПОВЕРХНОСТИ И УЗОРЫ ФОНА ================= */

function isDarkLikeTheme(theme) {
  return !["light", "latte", "nord", "bw"].includes(theme);
}

function setTheme(theme) {
  if (theme === "bw" && state.theme === "bw") theme = "wb";
  const valid = ["dark", "ocean", "emerald", "rose", "obsidian", "amoled", "light", "latte", "nord", "bw", "wb"];
  state.theme = valid.includes(theme) ? theme : "dark";
  const darkLike = isDarkLikeTheme(state.theme);

  const root = document.documentElement;
  root.dataset.theme = state.theme;
  root.style.colorScheme = darkLike ? "dark" : "light";
  document.body?.setAttribute("data-theme", state.theme);

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    const colorMap = {
      dark: "#0c0b14",
      ocean: "#071018",
      emerald: "#06120e",
      rose: "#14080e",
      obsidian: "#110e0a",
      amoled: "#000000",
      light: "#f4f3f9",
      latte: "#f6f3ec",
      nord: "#ecf2f8",
      bw: "#ffffff",
      wb: "#000000"
    };
    themeColor.content = colorMap[state.theme] || "#0c0b14";
  }

  const toggle = $("#theme-toggle");
  if (toggle) {
    toggle.innerHTML = darkLike
      ? '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z"/></svg>';
  }

  const bwBtn = $("#bw-wb-choice-btn");
  if (bwBtn) {
    bwBtn.textContent = state.theme === "wb" ? "◑ БЧ (Активна)" : state.theme === "bw" ? "◐ ЧБ (Активна)" : "◐ ЧБ / ◑ БЧ";
  }

  $$("[data-theme-choice]").forEach(btn => {
    const choice = btn.dataset.themeChoice;
    const isSelected = choice === state.theme || (choice === "bw" && state.theme === "wb");
    btn.classList.toggle("selected", isSelected);
  });

  updateBrandTexts();
  try { localStorage.setItem(THEME_KEY, state.theme); } catch (_) {}
}

function setSurface(surface) {
  const valid = ["liquid", "matte", "frosted", "brutal", "glossy", "outline"];
  state.surface = valid.includes(surface) ? surface : "liquid";
  document.documentElement.dataset.surface = state.surface;
  document.body?.setAttribute("data-surface", state.surface);

  $$("[data-surface-choice]").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.surfaceChoice === state.surface);
  });

  try { localStorage.setItem(SURFACE_KEY, state.surface); } catch (_) {}
}

function cycleThemeQuick() {
  const order = ["dark", "ocean", "emerald", "rose", "obsidian", "amoled", "light", "latte", "nord", "bw", "wb"];
  const next = order[(order.indexOf(state.theme) + 1) % order.length];
  setTheme(next);
  const labels = {
    dark: "🔮 ФПИ Ночь",
    ocean: "🌊 Океан Cyan",
    emerald: "🌲 Изумруд",
    rose: "🍷 Бархат Роза",
    obsidian: "🔥 Обсидиан Gold",
    amoled: "🌑 Amoled 0%",
    light: "☀️ Снежный iOS",
    latte: "🍵 Матча Латте",
    nord: "❄️ Норд Арктика",
    bw: "◐ Монохром ЧБ",
    wb: "◑ Контраст БЧ"
  };
  showToast(labels[next] || "Палитра изменена");
}

function applyCustomAppBg() {
  if (state.appCustomBg) {
    document.documentElement.style.setProperty("--custom-bg-image", `url("${state.appCustomBg.replace(/"/g, '\\"')}")`);
  } else {
    document.documentElement.style.setProperty("--custom-bg-image", "none");
  }
}

function setDesign(design) {
  const valid = ["liquid", "cats", "zolo", "topo", "dots", "waves", "cyber", "clean", "custom"];
  state.design = valid.includes(design) ? design : "liquid";
  document.documentElement.dataset.design = state.design;
  document.body?.setAttribute("data-design", state.design);

  $$("[data-design-choice]").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.designChoice === state.design);
  });

  const customWrap = $("#app-custom-bg-wrap");
  if (customWrap) {
    customWrap.classList.toggle("hidden", state.design !== "custom");
  }

  applyCustomAppBg();
  updateBrandTexts();
  try { localStorage.setItem(DESIGN_KEY, state.design); } catch (_) {}
}

function setPatternDensity(mode) {
  state.pattern = mode === "soft" ? "soft" : "bold";
  document.documentElement.dataset.pattern = state.pattern;
  $$("[data-pattern-choice]").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.patternChoice === state.pattern);
  });
  try { localStorage.setItem(PATTERN_KEY, state.pattern); } catch (_) {}
}

function setDefaultPeriod(mode) {
  state.defaultPeriod = mode === "28days" ? "28days" : "month";
  $$("[data-default-period]").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.defaultPeriod === state.defaultPeriod);
  });
  try { localStorage.setItem(DEFAULT_PERIOD_KEY, state.defaultPeriod); } catch (_) {}
  setPeriodMode(state.defaultPeriod);
}

function updateBrandTexts() {
  const brandMark = $("#brand-mark");
  const brandSub = $("#brand-sub");
  const darkLike = isDarkLikeTheme(state.theme);

  if (state.design === "cats") {
    if (brandMark) brandMark.textContent = darkLike ? "🐱" : "🐈‍⬛";
    if (brandSub) brandSub.textContent = "маркерные котики · ФПИ";
  } else if (state.design === "zolo") {
    if (brandMark) brandMark.textContent = "👑";
    if (brandSub) brandSub.textContent = "золотой резерв 2004";
  } else if (state.design === "cyber") {
    if (brandMark) brandMark.textContent = "⚡";
    if (brandSub) brandSub.textContent = "cyber ledger v2.6";
  } else {
    if (brandMark) brandMark.textContent = "ФПИ";
    if (brandSub) brandSub.textContent = "личный финансовый дневник";
  }
}

/* ================= КАРУСЕЛЬ 3 БАНКОВСКИХ КАРТ ================= */

function getCardMonthOutflow(cardId) {
  const monthPrefix = localISODate().slice(0, 7);
  return roundMoney(
    state.expenses
      .filter(tx => tx.cardId === cardId && tx.type !== "income" && String(tx.date || "").startsWith(monthPrefix))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  );
}

function renderCardsCarousel() {
  const track = $("#cards-track");
  if (!track) return;

  const networth = roundMoney(state.cards.reduce((sum, c) => sum + (Number(c.balance) || 0), 0));
  const networthEl = $("#total-networth");
  if (networthEl) networthEl.textContent = money(networth);

  track.innerHTML = state.cards.map((card, idx) => {
    const outflow = getCardMonthOutflow(card.id);
    const customStyle = card.skin === "custom" && card.customBg
      ? `style="--card-custom-img: url('${escapeHTML(card.customBg)}')"`
      : "";
    const logoText = (card.bank || "ФПИ").trim().slice(0, 3).toUpperCase();

    return `
      <article class="bank-card" data-card-index="${idx}" data-skin="${escapeHTML(card.skin)}" ${customStyle}>
        <div class="fpi-card-top">
          <div class="fpi-brand-wrap">
            <div class="fpi-logo-shield">${escapeHTML(logoText)}</div>
            <div>
              <div class="fpi-bank-title">${escapeHTML(card.bank || "ФПИ БАНК")}</div>
              <div class="fpi-bank-subtitle">${escapeHTML(card.subtitle || "PERSONAL VIP CARD")}</div>
            </div>
          </div>
          <div class="card-top-actions">
            <button class="card-action-pill" type="button" data-customize-card="${idx}" title="Настроить дизайн и счёт">
              🎨 Дизайн и счёт
            </button>
          </div>
        </div>

        <div class="fpi-chip-row">
          <div class="fpi-emv-chip" aria-hidden="true"></div>
          <div class="fpi-card-number">2204 •••• •••• ${escapeHTML(card.digits || "2004")}</div>
        </div>

        <div class="card-MainBottom">
          <div class="card-balance-block">
            <div class="card-balance-caption">
              <span>${escapeHTML(card.name)}</span>
            </div>
            <div class="card-balance-row" data-edit-balance="${idx}" title="Нажмите, чтобы вписать баланс">
              <span class="card-balance-amount">${money(card.balance)}</span>
              <span class="card-edit-badge">✎</span>
            </div>
          </div>
          <div class="card-month-Outflow">
            <div>Траты за мес.</div>
            <strong>−${money(outflow)}</strong>
          </div>
        </div>
      </article>
    `;
  }).join("");

  state.cards.forEach((card, idx) => {
    const pill = $(`#filter-pill-${idx}`);
    if (pill) pill.textContent = card.name;
    const analyticsPill = $(`#analytics-pill-${idx}`);
    if (analyticsPill) analyticsPill.textContent = card.name;
  });

  $$("#expense-card-selector [data-select-card]").forEach((btn, idx) => {
    if (state.cards[idx]) {
      btn.textContent = state.cards[idx].name;
    }
  });

  updateCarouselIndicators(state.activeCardSlot);
}

function updateCarouselIndicators(slot) {
  const index = Math.max(0, Math.min(2, Number(slot) || 0));
  state.activeCardSlot = index;

  $$("#carousel-dots [data-card-dot]").forEach((dot, idx) => {
    dot.classList.toggle("active", idx === index);
  });

  const indicator = $("#active-card-indicator");
  if (indicator && state.cards[index]) {
    indicator.textContent = `${state.cards[index].name} (${index + 1} из 3) · свайп ›`;
  }
}

function scrollToCardSlot(slot) {
  const track = $("#cards-track");
  const cardEl = track?.querySelector(`[data-card-index="${slot}"]`);
  if (cardEl && track) {
    track.scrollTo({ left: cardEl.offsetLeft - 18, behavior: "smooth" });
    updateCarouselIndicators(slot);
  }
}

/* ================= ОКНО КАСТОМИЗАЦИИ КАРТЫ И БАЛАНСА ================= */

function loadCardIntoCustomizer(slot) {
  const idx = Math.max(0, Math.min(2, Number(slot) || 0));
  state.editingCardSlot = idx;
  const card = state.cards[idx] || getDefaultCards()[idx];

  state.editingCardSkin = card.skin || "fpi-purple";
  state.editingCardCustomBg = card.customBg || "";

  $$("[data-edit-card-slot]").forEach(btn => {
    btn.classList.toggle("selected", Number(btn.dataset.editCardSlot) === idx);
    const c = state.cards[Number(btn.dataset.editCardSlot)];
    if (c) btn.textContent = c.name;
  });

  const balInput = $("#card-balance-input");
  const nameInput = $("#card-name-input");
  const bankInput = $("#card-bank-input");
  const digitsInput = $("#card-digits-input");
  const bgUrlInput = $("#card-bg-url");

  if (balInput) balInput.value = String(card.balance);
  if (nameInput) nameInput.value = card.name;
  if (bankInput) bankInput.value = card.bank;
  if (digitsInput) digitsInput.value = card.digits;
  if (bgUrlInput) bgUrlInput.value = card.customBg.startsWith("data:") ? "" : card.customBg;

  selectCardSkinInModal(state.editingCardSkin);
  updateCardPreviewInModal();
}

function selectCardSkinInModal(skin) {
  state.editingCardSkin = skin;
  $$("#card-skins-grid [data-card-skin]").forEach(tile => {
    tile.classList.toggle("selected", tile.dataset.cardSkin === skin);
  });
  const customWrap = $("#card-custom-image-wrap");
  if (customWrap) {
    customWrap.classList.toggle("hidden", skin !== "custom");
  }
  updateCardPreviewInModal();
}

function updateCardPreviewInModal() {
  const preview = $("#card-preview-box");
  if (!preview) return;

  const name = ($("#card-name-input")?.value || "Моя карта").trim();
  const bank = ($("#card-bank-input")?.value || "ФПИ БАНК").trim();
  const digits = ($("#card-digits-input")?.value || "2004").replace(/\D/g, "").slice(-4) || "2004";
  const balance = Number($("#card-balance-input")?.value) || 0;

  preview.dataset.skin = state.editingCardSkin;
  if (state.editingCardSkin === "custom" && state.editingCardCustomBg) {
    preview.style.setProperty("--card-custom-img", `url("${state.editingCardCustomBg.replace(/"/g, '\\"')}")`);
  } else {
    preview.style.removeProperty("--card-custom-img");
  }

  const logoEl = $("#preview-card-logo");
  const bankEl = $("#preview-card-bank");
  const digitsEl = $("#preview-card-digits");
  const nameEl = $("#preview-card-name");
  const balEl = $("#preview-card-balance");

  if (logoEl) logoEl.textContent = bank.slice(0, 3).toUpperCase();
  if (bankEl) bankEl.textContent = bank.toUpperCase();
  if (digitsEl) digitsEl.textContent = `2204 •••• •••• ${digits}`;
  if (nameEl) nameEl.textContent = name;
  if (balEl) balEl.textContent = money(balance);
}

function openCardCustomizer(slot = state.activeCardSlot, focusBalance = false) {
  loadCardIntoCustomizer(slot);
  const dlg = $("#card-dialog");
  if (dlg && !dlg.open) dlg.showModal();
  if (focusBalance) {
    setTimeout(() => {
      const inp = $("#card-balance-input");
      if (inp) {
        inp.focus();
        inp.select();
      }
    }, 70);
  }
}

async function saveCardCustomization(event) {
  event.preventDefault();
  const idx = state.editingCardSlot;
  const current = state.cards[idx];
  if (!current) return;

  const balance = roundMoney(Number($("#card-balance-input")?.value) || 0);
  const name = ($("#card-name-input")?.value || "").trim() || current.name;
  const bank = ($("#card-bank-input")?.value || "").trim() || "ФПИ БАНК";
  const digits = ($("#card-digits-input")?.value || "").replace(/\D/g, "").slice(-4) || "2004";
  const urlVal = ($("#card-bg-url")?.value || "").trim();
  const customBg = urlVal || state.editingCardCustomBg || "";

  const updatedCard = {
    ...current,
    name,
    bank,
    digits,
    balance,
    skin: state.editingCardSkin,
    customBg,
    updatedAt: Date.now()
  };

  state.cards[idx] = updatedCard;
  writeLocal();
  renderAll();
  $("#card-dialog")?.close();
  scrollToCardSlot(idx);
  showToast(`Карта «${name}» обновлена`);

  await syncCardToCloud(updatedCard);
}

async function syncCardToCloud(card) {
  if (!firestore || !firebaseFns) return;
  try {
    setSyncStatus("busy", "Сохраняю…");
    await firebaseFns.setDoc(firebaseFns.doc(firestore, "groups", GROUP_ID, "cards", card.id), card);
    setSyncStatus("online", "Онлайн");
  } catch (err) {
    console.warn("Не удалось синхронизировать карту:", err);
  }
}

async function adjustCardBalanceByDelta(cardId, delta) {
  const idx = state.cards.findIndex(c => c.id === cardId);
  if (idx === -1 || !delta) return;
  state.cards[idx] = {
    ...state.cards[idx],
    balance: roundMoney((Number(state.cards[idx].balance) || 0) + delta),
    updatedAt: Date.now()
  };
  writeLocal();
  await syncCardToCloud(state.cards[idx]);
}

/* ================= СПИСОК РАСХОДОВ НА ГЛАВНОМ ЭКРАНЕ ================= */

function renderHomeExpenses() {
  const list = $("#expense-list");
  if (!list) return;

  const filtered = state.expenses.filter(item => {
    if (state.filterCardId === "all") return true;
    return item.cardId === state.filterCardId;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dateCmp = String(b.date || "").localeCompare(String(a.date || ""));
    return dateCmp || Number(b.createdAt || 0) - Number(a.createdAt || 0);
  });

  const monthPrefix = localISODate().slice(0, 7);
  const monthSpent = roundMoney(
    filtered
      .filter(tx => tx.type !== "income" && String(tx.date || "").startsWith(monthPrefix))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
  );

  const totalEl = $("#home-period-total");
  if (totalEl) totalEl.textContent = `−${money(monthSpent)} за месяц`;

  const titleEl = $("#expenses-list-title");
  if (titleEl) {
    const cardObj = state.cards.find(c => c.id === state.filterCardId);
    titleEl.textContent = cardObj ? `Операции · ${cardObj.name}` : "Все операции";
  }

  if (!sorted.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-symbol">💳</div>
        <div class="empty-title">Пока нет операций</div>
        <div class="empty-text">Нажми «+» внизу экрана, чтобы записать расход или пополнение карты.</div>
      </div>`;
    return;
  }

  let lastDate = "";
  const html = [];
  let idx = 0;

  for (const item of sorted) {
    const date = item.date || "";
    if (date !== lastDate) {
      const daySum = roundMoney(
        sorted
          .filter(x => x.date === date && x.type !== "income")
          .reduce((s, x) => s + (Number(x.amount) || 0), 0)
      );
      html.push(`
        <div class="day-label">
          <span>${escapeHTML(dateLabel(date))}</span>
          <span>${daySum > 0 ? `−${money(daySum)}` : ""}</span>
        </div>
      `);
      lastDate = date;
    }

    const cat = CATEGORIES[item.category] || CATEGORIES.other;
    const cardObj = state.cards.find(c => c.id === item.cardId) || state.cards[0];
    const isIncome = item.type === "income";
    const sign = isIncome ? "+" : "−";
    const delayIdx = Math.min(idx++, 12);

    html.push(`
      <button class="expense-row" style="--i:${delayIdx}" type="button" data-expense-id="${escapeHTML(item.id)}">
        <span class="category-icon" style="background: color-mix(in srgb, ${cat.color} 18%, var(--surface-2));">${cat.emoji}</span>
        <span class="expense-copy">
          <span class="expense-title">${escapeHTML(item.description || cat.label)}</span>
          <span class="expense-meta">
            <span class="expense-card-tag">${escapeHTML(cardObj?.name || "ФПИ")}</span>
            <span>${escapeHTML(cat.label)}</span>
          </span>
        </span>
        <span class="expense-right">
          <span class="expense-amount ${isIncome ? "income" : ""}">${sign}${money(item.amount)}</span>
          <span class="expense-date">${escapeHTML(shortDate(date))}</span>
        </span>
      </button>
    `);
  }

  list.innerHTML = html.join("");
}

/* ================= ДОБАВЛЕНИЕ / РЕДАКТИРОВАНИЕ ОПЕРАЦИИ ================= */

function setTxType(type) {
  state.txType = type === "income" ? "income" : "expense";
  $$("[data-tx-type]").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.txType === state.txType);
  });
}

function setTxCard(cardId) {
  state.txCardId = cardId;
  $$("[data-select-card]").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.selectCard === cardId);
  });
}

function setTxCategory(cat) {
  state.txCategory = CATEGORIES[cat] ? cat : "other";
  $$("#category-grid [data-category]").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.category === state.txCategory);
  });
}

function openNewExpense() {
  state.editingExpenseId = null;
  $("#expense-form")?.reset();
  $("#expense-id").value = "";
  $("#expense-date").value = localISODate();
  $("#expense-dialog-title").textContent = "Новая операция";
  $("#expense-save").textContent = "Сохранить";
  $("#expense-delete")?.classList.add("hidden");
  $("#expense-error").textContent = "";

  setTxType("expense");
  const defaultCardId = state.filterCardId !== "all"
    ? state.filterCardId
    : (state.cards[state.activeCardSlot]?.id || "card_1");
  setTxCard(defaultCardId);
  setTxCategory("food");

  $("#expense-dialog")?.showModal();
  setTimeout(() => $("#expense-amount")?.focus(), 70);
}

function openEditExpense(id) {
  const item = state.expenses.find(e => e.id === id);
  if (!item) return;

  state.editingExpenseId = item.id;
  $("#expense-id").value = item.id;
  $("#expense-amount").value = String(item.amount);
  $("#expense-description").value = item.description || "";
  $("#expense-date").value = item.date || localISODate();
  $("#expense-dialog-title").textContent = "Редактировать операцию";
  $("#expense-save").textContent = "Сохранить изменения";
  $("#expense-delete")?.classList.remove("hidden");
  $("#expense-error").textContent = "";

  setTxType(item.type === "income" ? "income" : "expense");
  setTxCard(item.cardId || "card_1");
  setTxCategory(item.category || "other");

  $("#expense-dialog")?.showModal();
}

async function saveExpense(event) {
  event.preventDefault();
  const amount = roundMoney(Number($("#expense-amount")?.value));
  const date = $("#expense-date")?.value;
  const errEl = $("#expense-error");

  if (!Number.isFinite(amount) || amount <= 0) {
    if (errEl) errEl.textContent = "Введите сумму больше нуля.";
    return;
  }
  if (!date) {
    if (errEl) errEl.textContent = "Укажите дату операции.";
    return;
  }

  const id = $("#expense-id")?.value || (crypto.randomUUID ? crypto.randomUUID() : `tx_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`);
  const existing = state.expenses.find(item => item.id === id);
  const timestamp = Date.now();

  const newTx = {
    id,
    type: state.txType,
    amount,
    cardId: state.txCardId,
    category: state.txCategory,
    description: ($("#expense-description")?.value || "").trim(),
    date,
    createdAt: existing ? Number(existing.createdAt) : timestamp,
    updatedAt: timestamp
  };

  if (existing) {
    const oldDelta = existing.type === "income" ? -existing.amount : existing.amount;
    await adjustCardBalanceByDelta(existing.cardId, oldDelta);
  }
  const newDelta = newTx.type === "income" ? newTx.amount : -newTx.amount;
  await adjustCardBalanceByDelta(newTx.cardId, newDelta);

  try {
    if (firestore && firebaseFns) {
      setSyncStatus("busy", "Сохраняю…");
      await firebaseFns.setDoc(firebaseFns.doc(firestore, "groups", GROUP_ID, "expenses", id), newTx);
    } else {
      if (existing) {
        state.expenses = state.expenses.map(row => row.id === id ? newTx : row);
      } else {
        state.expenses.push(newTx);
      }
      writeLocal();
    }
    renderAll();
    $("#expense-dialog")?.close();
    showToast(existing ? "Операция обновлена" : (newTx.type === "income" ? "Баланс пополнен" : "Расход записан"));
    setSyncStatus("online", "Онлайн");
  } catch (error) {
    console.error(error);
    if (errEl) errEl.textContent = "Ошибка сохранения в облако.";
  }
}

async function deleteCurrentExpense() {
  const id = $("#expense-id")?.value;
  if (!id) return;
  const existing = state.expenses.find(item => item.id === id);
  if (!existing) return;
  if (!confirm("Удалить эту операцию? Баланс карты будет восстановлен.")) return;

  const restoreDelta = existing.type === "income" ? -existing.amount : existing.amount;
  await adjustCardBalanceByDelta(existing.cardId, restoreDelta);

  try {
    if (firestore && firebaseFns) {
      setSyncStatus("busy", "Удаляю…");
      await firebaseFns.deleteDoc(firebaseFns.doc(firestore, "groups", GROUP_ID, "expenses", id));
    } else {
      state.expenses = state.expenses.filter(item => item.id !== id);
      writeLocal();
    }
    renderAll();
    $("#expense-dialog")?.close();
    showToast("Операция удалена");
    setSyncStatus("online", "Онлайн");
  } catch (_) {
    showToast("Не удалось удалить операцию");
  }
}

/* ================= ВКЛАДКА 2: АНАЛИТИКА (РАДИАЛЬНОЕ МЕНЮ + КАЛЕНДАРЬ + 28 ДНЕЙ) ================= */

function setPeriodMode(mode) {
  state.periodMode = mode === "28days" ? "28days" : "month";
  state.selectedAnalyticsCategory = null;

  $$("[data-period-mode]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.periodMode === state.periodMode);
  });

  const prevBtn = $("#month-prev");
  const nextBtn = $("#month-next");
  if (prevBtn && nextBtn) {
    const hideArrows = state.periodMode === "28days";
    prevBtn.style.visibility = hideArrows ? "hidden" : "visible";
    nextBtn.style.visibility = hideArrows ? "hidden" : "visible";
  }

  renderAnalytics();
}

function shiftAnalyticsMonth(delta) {
  const [y, m] = state.analyticsMonth.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  state.analyticsMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  state.selectedAnalyticsCategory = null;
  renderAnalytics();
}

function getPeriodRange() {
  if (state.periodMode === "28days") {
    const end = new Date();
    const start = new Date(Date.now() - 27 * 86400000);
    const startISO = localISODate(start);
    const endISO = localISODate(end);
    const label = `Последние 28 дней (${shortDate(startISO)} — ${shortDate(endISO)})`;
    return { startISO, endISO, daysCount: 28, label };
  }

  const [y, m] = state.analyticsMonth.split("-").map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0);
  const startISO = localISODate(firstDay);
  const endISO = localISODate(lastDay);
  const rawName = firstDay.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  const label = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  return { startISO, endISO, daysCount: lastDay.getDate(), label, year: y, month: m };
}

function getPeriodExpenses() {
  const { startISO, endISO } = getPeriodRange();
  return state.expenses.filter(tx => {
    if (tx.type === "income") return false;
    if (state.analyticsCardId !== "all" && tx.cardId !== state.analyticsCardId) return false;
    const d = String(tx.date || "");
    return d >= startISO && d <= endISO;
  });
}

function renderRadialChart(periodExpenses, totalSpent) {
  const segGroup = $("#radial-segments");
  const chipsWrap = $("#radial-chips");
  const centerTitle = $("#radial-center-title");
  const centerAmount = $("#radial-center-amount");
  const centerSub = $("#radial-center-sub");
  if (!segGroup || !chipsWrap) return;

  const radius = 84;
  const circumference = 2 * Math.PI * radius;

  const byCat = {};
  for (const tx of periodExpenses) {
    const key = CATEGORIES[tx.category] ? tx.category : "other";
    byCat[key] = roundMoney((byCat[key] || 0) + (Number(tx.amount) || 0));
  }

  const entries = Object.entries(byCat)
    .filter(([, sum]) => sum > 0)
    .sort((a, b) => b[1] - a[1]);

  const selectedCardObj = state.cards.find(c => c.id === state.analyticsCardId);
  const cardScopeLabel = selectedCardObj ? selectedCardObj.name : "Все карты";

  if (!entries.length || totalSpent <= 0) {
    segGroup.innerHTML = "";
    chipsWrap.innerHTML = `<span style="font-size:11px; color:var(--muted);">Нет трат за выбранный период</span>`;
    if (centerTitle) centerTitle.textContent = selectedCardObj ? `Траты · ${selectedCardObj.name}` : "Потрачено";
    if (centerAmount) centerAmount.textContent = "0 ₽";
    if (centerSub) centerSub.textContent = state.periodMode === "28days" ? `${cardScopeLabel} · 28 дней` : `${cardScopeLabel} · за месяц`;
    return;
  }

  let cumulativeFraction = 0;
  const gapPx = entries.length > 1 ? 6 : 0;

  segGroup.innerHTML = entries.map(([catKey, sum]) => {
    const cat = CATEGORIES[catKey] || CATEGORIES.other;
    const fraction = sum / totalSpent;
    const arcLen = Math.max(4, fraction * circumference - gapPx);
    const dashArray = `${arcLen} ${circumference}`;
    const dashOffset = -(cumulativeFraction * circumference);
    cumulativeFraction += fraction;
    const isSelected = state.selectedAnalyticsCategory === catKey;

    return `
      <circle
        class="radial-segment ${isSelected ? "active" : ""}"
        cx="110"
        cy="110"
        r="${radius}"
        stroke="${cat.color}"
        stroke-dasharray="${dashArray}"
        stroke-dashoffset="${dashOffset}"
        data-radial-cat="${catKey}"
      />
    `;
  }).join("");

  chipsWrap.innerHTML = entries.map(([catKey, sum]) => {
    const cat = CATEGORIES[catKey] || CATEGORIES.other;
    const pct = Math.round((sum / totalSpent) * 100);
    const isSelected = state.selectedAnalyticsCategory === catKey;
    return `
      <button class="radial-chip ${isSelected ? "active" : ""}" type="button" data-radial-cat="${catKey}">
        <span class="radial-chip-dot" style="background:${cat.color}"></span>
        <span>${cat.emoji} ${escapeHTML(cat.label)} ${pct}%</span>
      </button>
    `;
  }).join("");

  const activeKey = state.selectedAnalyticsCategory;
  if (activeKey && byCat[activeKey]) {
    const cat = CATEGORIES[activeKey] || CATEGORIES.other;
    const pct = Math.round((byCat[activeKey] / totalSpent) * 100);
    if (centerTitle) centerTitle.textContent = `${cat.emoji} ${cat.label}`;
    if (centerAmount) centerAmount.textContent = money(byCat[activeKey]);
    if (centerSub) centerSub.textContent = `${pct}% · ${cardScopeLabel}`;
  } else {
    if (centerTitle) centerTitle.textContent = selectedCardObj ? `Траты · ${selectedCardObj.name}` : "Всего потрачено";
    if (centerAmount) centerAmount.textContent = money(totalSpent);
    if (centerSub) centerSub.textContent = state.periodMode === "28days" ? `${cardScopeLabel} · 28 дней` : `${cardScopeLabel} · за месяц`;
  }
}

function renderCalendar(periodExpenses) {
  const grid = $("#calendar-grid");
  if (!grid) return;

  const range = getPeriodRange();
  const todayISO = localISODate();

  const byDate = {};
  for (const tx of periodExpenses) {
    const d = tx.date;
    if (!d) continue;
    if (!byDate[d]) byDate[d] = { sum: 0, colors: [], items: [] };
    byDate[d].sum = roundMoney(byDate[d].sum + (Number(tx.amount) || 0));
    const color = (CATEGORIES[tx.category] || CATEGORIES.other).color;
    if (byDate[d].colors.length < 4 && !byDate[d].colors.includes(color)) {
      byDate[d].colors.push(color);
    }
    byDate[d].items.push(tx);
  }

  const cells = [];

  if (state.periodMode === "28days") {
    const startObj = new Date(`${range.startISO}T12:00:00`);
    const startWeekday = (startObj.getDay() + 6) % 7;
    for (let i = 0; i < startWeekday; i++) {
      cells.push(`<div class="cal-day empty"></div>`);
    }
    for (let i = 0; i < 28; i++) {
      const cur = new Date(startObj.getTime() + i * 86400000);
      const iso = localISODate(cur);
      const dayNum = cur.getDate();
      const info = byDate[iso];
      const isToday = iso === todayISO;
      const isSelected = iso === state.selectedCalendarDate;
      const dotsHTML = info
        ? info.colors.map(c => `<span class="cal-dot" style="background:${c}"></span>`).join("")
        : "";

      cells.push(`
        <button class="cal-day ${info ? "has-spend" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}" type="button" data-cal-date="${iso}">
          <span class="cal-day-num">${dayNum}</span>
          <span class="cal-day-sum">${info ? compactMoney(info.sum) : "·"}</span>
          <span class="cal-dots">${dotsHTML}</span>
        </button>
      `);
    }
  } else {
    const firstObj = new Date(range.year, range.month - 1, 1);
    const startWeekday = (firstObj.getDay() + 6) % 7;
    for (let i = 0; i < startWeekday; i++) {
      cells.push(`<div class="cal-day empty"></div>`);
    }
    for (let day = 1; day <= range.daysCount; day++) {
      const iso = `${state.analyticsMonth}-${String(day).padStart(2, "0")}`;
      const info = byDate[iso];
      const isToday = iso === todayISO;
      const isSelected = iso === state.selectedCalendarDate;
      const dotsHTML = info
        ? info.colors.map(c => `<span class="cal-dot" style="background:${c}"></span>`).join("")
        : "";

      cells.push(`
        <button class="cal-day ${info ? "has-spend" : ""} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}" type="button" data-cal-date="${iso}">
          <span class="cal-day-num">${day}</span>
          <span class="cal-day-sum">${info ? compactMoney(info.sum) : "·"}</span>
          <span class="cal-dots">${dotsHTML}</span>
        </button>
      `);
    }
  }

  grid.innerHTML = cells.join("");
  renderSelectedCalendarDay(byDate);
}

function renderSelectedCalendarDay(byDateMap) {
  const box = $("#calendar-day-details");
  const dateEl = $("#cal-selected-date");
  const totalEl = $("#cal-selected-total");
  const listEl = $("#cal-detail-list");
  if (!box || !dateEl || !totalEl || !listEl) return;

  const iso = state.selectedCalendarDate;
  if (!iso) {
    box.classList.add("hidden");
    return;
  }

  box.classList.remove("hidden");
  dateEl.textContent = dateLabel(iso);

  const dayData = byDateMap?.[iso] || {
    sum: 0,
    items: state.expenses.filter(tx =>
      tx.date === iso &&
      tx.type !== "income" &&
      (state.analyticsCardId === "all" || tx.cardId === state.analyticsCardId)
    )
  };
  const sum = roundMoney(dayData.items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0));
  totalEl.textContent = sum > 0 ? `−${money(sum)}` : "0 ₽";

  if (!dayData.items.length) {
    listEl.innerHTML = `<div style="font-size:11px; color:var(--muted);">В этот день расходов не было</div>`;
    return;
  }

  listEl.innerHTML = dayData.items.map(tx => {
    const cat = CATEGORIES[tx.category] || CATEGORIES.other;
    const card = state.cards.find(c => c.id === tx.cardId);
    return `
      <div class="cal-detail-item" data-expense-id="${escapeHTML(tx.id)}" style="cursor:pointer;">
        <span>${cat.emoji} ${escapeHTML(tx.description || cat.label)} <small style="color:var(--muted);">· ${escapeHTML(card?.name || "ФПИ")}</small></span>
        <strong>−${money(tx.amount)}</strong>
      </div>
    `;
  }).join("");
}

function renderCategoryBars(periodExpenses, totalSpent, daysCount) {
  const listEl = $("#category-bars-list");
  const avgEl = $("#avg-daily-spend");
  if (!listEl) return;

  const avg = daysCount > 0 ? roundMoney(totalSpent / daysCount) : 0;
  if (avgEl) avgEl.textContent = `В среднем ${money(avg)} / день`;

  const byCat = {};
  for (const tx of periodExpenses) {
    const key = CATEGORIES[tx.category] ? tx.category : "other";
    byCat[key] = roundMoney((byCat[key] || 0) + (Number(tx.amount) || 0));
  }

  const entries = Object.entries(byCat)
    .filter(([, sum]) => sum > 0)
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    listEl.innerHTML = `<div style="font-size:12px; color:var(--muted); text-align:center; padding:10px 0;">Категории появятся после добавления расходов</div>`;
    return;
  }

  listEl.innerHTML = entries.map(([catKey, sum]) => {
    const cat = CATEGORIES[catKey] || CATEGORIES.other;
    const pct = totalSpent > 0 ? Math.round((sum / totalSpent) * 100) : 0;
    return `
      <div class="cat-bar-row">
        <div class="cat-bar-top">
          <span>${cat.emoji} ${escapeHTML(cat.label)} <small style="color:var(--muted);">(${pct}%)</small></span>
          <strong>${money(sum)}</strong>
        </div>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width:${pct}%; background:${cat.color};"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderAnalytics() {
  const range = getPeriodRange();
  const labelEl = $("#analytics-period-label");
  if (labelEl) labelEl.textContent = range.label;

  const periodExpenses = getPeriodExpenses();
  const totalSpent = roundMoney(periodExpenses.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0));

  renderRadialChart(periodExpenses, totalSpent);
  renderCalendar(periodExpenses);
  renderCategoryBars(periodExpenses, totalSpent, range.daysCount);
}

function renderAll() {
  renderCardsCarousel();
  renderHomeExpenses();
  renderAnalytics();
}

function switchTab(tab) {
  const isAnalytics = tab === "analytics";
  $("#screen-home")?.classList.toggle("active", !isAnalytics);
  $("#screen-analytics")?.classList.toggle("active", isAnalytics);

  $$(".nav-item").forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle("active", active);
    if (active) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  });

  if (isAnalytics) renderAnalytics();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ================= ЗАГРУЗКА СВОИХ КАРТИНОК (СЖАТИЕ ЧЕРЕЗ CANVAS) ================= */

function compressImageFile(file, maxWidth = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ================= ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ FIREBASE ================= */

async function initFirebase() {
  const helpEl = $("#firebase-help");
  const cfg = getActiveFirebaseConfig();

  if (!isFirebaseConfigured()) {
    setSyncStatus("", "Локально");
    if (helpEl) {
      helpEl.innerHTML = "<strong>Локальный режим:</strong> вставь свои ключи <code>apiKey</code>, <code>messagingSenderId</code> и <code>appId</code> в <code>FIREBASE_CONFIG</code> в начале файла <code>app.js</code>.";
    }
    return;
  }

  try {
    setSyncStatus("busy", "Подключаю…");
    const [appModule, firestoreModule] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
    ]);
    const app = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(cfg);
    firestore = firestoreModule.getFirestore(app);
    firebaseFns = {
      collection: firestoreModule.collection,
      doc: firestoreModule.doc,
      onSnapshot: firestoreModule.onSnapshot,
      setDoc: firestoreModule.setDoc,
      deleteDoc: firestoreModule.deleteDoc
    };
    state.firebaseReady = true;
    setSyncStatus("online", "Онлайн");
    if (helpEl) {
      helpEl.innerHTML = `<strong>Облако ФПИ Банк подключено (${escapeHTML(cfg.projectId)}):</strong> все 3 карты, скины и расходы синхронизируются автоматически.`;
    }
    attachCloudListeners();
  } catch (error) {
    console.warn("Firebase init error:", error);
    setSyncStatus("", "Офлайн");
    if (helpEl) {
      helpEl.innerHTML = "<strong>Офлайн-режим:</strong> не удалось подключиться к Firestore. Проверь интернет и Rules в консоли Firebase.";
    }
  }
}

function attachCloudListeners() {
  if (!firestore || !firebaseFns) return;

  const cardsRef = firebaseFns.collection(firestore, "groups", GROUP_ID, "cards");
  const expensesRef = firebaseFns.collection(firestore, "groups", GROUP_ID, "expenses");

  state.unsubscribers.push(
    firebaseFns.onSnapshot(cardsRef, snapshot => {
      if (!snapshot.empty) {
        const cloudCards = snapshot.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id }));
        state.cards = normalizeCards(cloudCards);
        writeLocal();
        renderAll();
      } else {
        state.cards.forEach(c => syncCardToCloud(c));
      }
      setSyncStatus("online", "Онлайн");
    }, err => { console.warn("Firestore snapshot error:", err); setSyncStatus("", "Нет доступа"); })
  );

  state.unsubscribers.push(
    firebaseFns.onSnapshot(expensesRef, snapshot => {
      state.expenses = snapshot.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id }));
      writeLocal();
      renderAll();
      setSyncStatus("online", "Онлайн");
    }, err => { console.warn("Firestore snapshot error:", err); setSyncStatus("", "Нет доступа"); })
  );
}

/* ================= ПРИВЯЗКА СОБЫТИЙ ================= */

function bindEvents() {
  $$("[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  $("#theme-toggle")?.addEventListener("click", cycleThemeQuick);
  $("#settings-open")?.addEventListener("click", () => $("#settings-dialog")?.showModal());
  $("#open-card-customizer-top")?.addEventListener("click", () => openCardCustomizer(state.activeCardSlot, false));
  $("#settings-open-cards")?.addEventListener("click", () => {
    $("#settings-dialog")?.close();
    openCardCustomizer(state.activeCardSlot, false);
  });

  const track = $("#cards-track");
  if (track) {
    let scrollTimer = null;
    track.addEventListener("scroll", () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const width = track.clientWidth || 1;
        const slot = Math.round(track.scrollLeft / width);
        updateCarouselIndicators(slot);
      }, 50);
    }, { passive: true });

    track.addEventListener("click", event => {
      const editBalBtn = event.target.closest("[data-edit-balance]");
      if (editBalBtn) {
        openCardCustomizer(Number(editBalBtn.dataset.editBalance), true);
        return;
      }
      const custBtn = event.target.closest("[data-customize-card]");
      if (custBtn) {
        openCardCustomizer(Number(custBtn.dataset.customizeCard), false);
      }
    });
  }

  $$("#carousel-dots [data-card-dot]").forEach(dot => {
    dot.addEventListener("click", () => scrollToCardSlot(Number(dot.dataset.cardDot)));
  });

  $("#card-filter-pills")?.addEventListener("click", event => {
    const pill = event.target.closest("[data-filter-card]");
    if (!pill) return;
    state.filterCardId = pill.dataset.filterCard;
    $$("#card-filter-pills [data-filter-card]").forEach(p => {
      p.classList.toggle("active", p.dataset.filterCard === state.filterCardId);
    });
    renderHomeExpenses();
  });

  $$("[data-edit-card-slot]").forEach(btn => {
    btn.addEventListener("click", () => loadCardIntoCustomizer(Number(btn.dataset.editCardSlot)));
  });

  $$("[data-balance-delta]").forEach(chip => {
    chip.addEventListener("click", () => {
      const inp = $("#card-balance-input");
      if (!inp) return;
      const delta = Number(chip.dataset.balanceDelta) || 0;
      inp.value = String(roundMoney((Number(inp.value) || 0) + delta));
      updateCardPreviewInModal();
    });
  });

  ["#card-balance-input", "#card-name-input", "#card-bank-input", "#card-digits-input"].forEach(sel => {
    $(sel)?.addEventListener("input", updateCardPreviewInModal);
  });

  $("#card-skins-grid")?.addEventListener("click", event => {
    const tile = event.target.closest("[data-card-skin]");
    if (tile) selectCardSkinInModal(tile.dataset.cardSkin);
  });

  $("#card-bg-url")?.addEventListener("input", event => {
    state.editingCardCustomBg = event.target.value.trim();
    updateCardPreviewInModal();
  });

  $("#card-bg-file")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      state.editingCardCustomBg = await compressImageFile(file, 800, 0.78);
      updateCardPreviewInModal();
      showToast("Фото карты загружено");
    } catch (_) {
      showToast("Не удалось обработать фото");
    }
  });

  $("#card-custom-form")?.addEventListener("submit", saveCardCustomization);

  $("#add-open")?.addEventListener("click", openNewExpense);

  $$("[data-tx-type]").forEach(btn => {
    btn.addEventListener("click", () => setTxType(btn.dataset.txType));
  });

  $$("#expense-card-selector [data-select-card]").forEach(btn => {
    btn.addEventListener("click", () => setTxCard(btn.dataset.selectCard));
  });

  $("#category-grid")?.addEventListener("click", event => {
    const btn = event.target.closest("[data-category]");
    if (btn) setTxCategory(btn.dataset.category);
  });

  $("#expense-form")?.addEventListener("submit", saveExpense);
  $("#expense-delete")?.addEventListener("click", deleteCurrentExpense);

  $("#expense-list")?.addEventListener("click", event => {
    const row = event.target.closest("[data-expense-id]");
    if (row) openEditExpense(row.dataset.expenseId);
  });

  $("#analytics-card-pills")?.addEventListener("click", event => {
    const pill = event.target.closest("[data-analytics-card]");
    if (!pill) return;
    state.analyticsCardId = pill.dataset.analyticsCard;
    state.selectedAnalyticsCategory = null;
    $$("#analytics-card-pills [data-analytics-card]").forEach(p => {
      p.classList.toggle("active", p.dataset.analyticsCard === state.analyticsCardId);
    });
    renderAnalytics();
  });

  $$("[data-period-mode]").forEach(btn => {
    btn.addEventListener("click", () => setPeriodMode(btn.dataset.periodMode));
  });

  $("#month-prev")?.addEventListener("click", () => shiftAnalyticsMonth(-1));
  $("#month-next")?.addEventListener("click", () => shiftAnalyticsMonth(1));

  const toggleRadialCat = event => {
    const target = event.target.closest("[data-radial-cat]");
    if (!target) return;
    const cat = target.dataset.radialCat;
    state.selectedAnalyticsCategory = state.selectedAnalyticsCategory === cat ? null : cat;
    renderAnalytics();
  };
  $("#radial-svg")?.addEventListener("click", toggleRadialCat);
  $("#radial-chips")?.addEventListener("click", toggleRadialCat);

  $("#calendar-grid")?.addEventListener("click", event => {
    const dayBtn = event.target.closest("[data-cal-date]");
    if (!dayBtn) return;
    state.selectedCalendarDate = dayBtn.dataset.calDate;
    renderAnalytics();
  });

  $("#cal-detail-list")?.addEventListener("click", event => {
    const item = event.target.closest("[data-expense-id]");
    if (item) openEditExpense(item.dataset.expenseId);
  });

  $$("[data-surface-choice]").forEach(btn => {
    btn.addEventListener("click", () => setSurface(btn.dataset.surfaceChoice));
  });

  $$("[data-theme-choice]").forEach(btn => {
    btn.addEventListener("click", () => setTheme(btn.dataset.themeChoice));
  });

  $$("[data-design-choice]").forEach(btn => {
    btn.addEventListener("click", () => setDesign(btn.dataset.designChoice));
  });

  $$("[data-pattern-choice]").forEach(btn => {
    btn.addEventListener("click", () => setPatternDensity(btn.dataset.patternChoice));
  });

  $$("[data-default-period]").forEach(btn => {
    btn.addEventListener("click", () => setDefaultPeriod(btn.dataset.defaultPeriod));
  });

  $("#app-bg-url")?.addEventListener("input", event => {
    state.appCustomBg = event.target.value.trim();
    applyCustomAppBg();
    try { localStorage.setItem(APP_CUSTOM_BG_KEY, state.appCustomBg); } catch (_) {}
  });

  $("#app-bg-file")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      state.appCustomBg = await compressImageFile(file, 1080, 0.76);
      applyCustomAppBg();
      try { localStorage.setItem(APP_CUSTOM_BG_KEY, state.appCustomBg); } catch (_) {}
      showToast("Фон приложения установлен");
    } catch (_) {
      showToast("Ошибка загрузки фона");
    }
  });

  $$("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => $(`#${btn.dataset.close}`)?.close());
  });

  ["#card-dialog", "#expense-dialog", "#settings-dialog"].forEach(sel => {
    const dlg = $(sel);
    dlg?.addEventListener("click", event => {
      if (event.target === dlg) dlg.close();
    });
  });
}

function bootstrap() {
  readLocal();
  setTheme(state.theme);
  setSurface(state.surface);
  setDesign(state.design);
  setPatternDensity(state.pattern);
  setDefaultPeriod(state.defaultPeriod);
  if (state.appCustomBg && !state.appCustomBg.startsWith("data:") && $("#app-bg-url")) {
    $("#app-bg-url").value = state.appCustomBg;
  }
  renderAll();
  bindEvents();
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
