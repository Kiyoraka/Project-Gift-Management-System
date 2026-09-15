/* Customer app - state, five-tab router and event delegation.
   Tabs: Wallet · Shop · Scan (raised, centre) · Gifts · Profile.
   Screens live in customer-screens.js (Wallet, Gifts + Send, Profile, gift sheet); flows in customer-flows.js (Shop, Scan, Pay, Buy).
   Requires ui.js, auth.js, customer-data.js, customer-screens.js, customer-flows.js. */

(function () {
  "use strict";

  var session = Auth.requireSession("customer", "customer.html");
  if (!session) return;

  var TABS = [
    { key: "wallet", label: "Wallet", icon: "wallet" },
    { key: "shop", label: "Shop", icon: "shop" },
    { key: "scan", label: "Scan", icon: "scan" },
    { key: "gifts", label: "Gifts", icon: "gift" },
    { key: "profile", label: "Profile", icon: "profile" }
  ];

  /* Customer 1 (Aisyah) and Customer 2 (Wei Ling) each open their own demo wallet. */
  var wallet = CustomerData.account(CustomerData.accountKeyFor(session));

  var state = {
    tab: "wallet",
    filter: "All",
    shopFilter: "All",
    giftsTab: "received",
    flipped: null,
    newId: null,
    account: { key: wallet.key, name: wallet.name, phone: wallet.phone, contactPhone: wallet.contactPhone },
    cards: wallet.cards,
    pending: wallet.pending,
    history: wallet.history,
    gifts: wallet.gifts,
    notifs: CustomerData.initialNotifications(),
    send: blankSend(),
    overlay: null,
    giftId: null,
    pay: null,
    buy: null
  };

  /* step "idle" shows the Gifts home; pick / details / preview / done run the send flow inside the Gifts tab. */
  function blankSend() {
    return { step: "idle", cardId: null, phone: "", message: "", when: "now", error: false };
  }

  var els = {
    app: document.getElementById("app"),
    main: document.getElementById("appMain"),
    scan: document.getElementById("appScan"),
    overlay: document.getElementById("appOverlay"),
    tabbar: document.getElementById("tabbar")
  };

  function ctx() {
    return { state: state, session: session };
  }

  /* ---------- Rendering ---------- */

  function renderTabs() {
    var waiting = state.pending.length;
    els.tabbar.innerHTML = TABS.map(function (t) {
      var active = state.tab === t.key;
      var iconHtml = t.key === "scan"
        ? '<span class="tab-raised">' + UI.icon("scan", 24, 1.8) + "</span>"
        : '<span class="tab-icon">' + UI.icon(t.icon, 24, 1.8) +
          (t.key === "gifts" && waiting ? '<span class="tab-badge">' + waiting + "</span>" : "") + "</span>";
      var label = t.label + (t.key === "gifts" && waiting ? ", " + waiting + " waiting" : "");
      return (
        '<button type="button" class="tab-btn' + (active ? " is-active" : "") + '" data-action="goTab" data-tab="' + t.key + '"' +
        (active ? ' aria-current="page"' : "") + ' aria-label="' + label + '">' + iconHtml + '<span aria-hidden="true">' + t.label + "</span></button>"
      );
    }).join("");
  }

  function renderMain() {
    var screens = {
      wallet: CustomerScreens.wallet,
      shop: CustomerFlows.shop,
      scan: CustomerScreens.wallet,
      gifts: CustomerScreens.gifts,
      profile: CustomerScreens.profile
    };
    els.main.innerHTML = screens[state.tab](ctx());
  }

  function renderScan() {
    var showScan = state.tab === "scan" && state.overlay !== "buy" && state.overlay !== "inbox";
    els.scan.innerHTML = showScan ? CustomerFlows.scan(ctx()) : "";
  }

  function renderOverlay() {
    if (state.overlay === "inbox") els.overlay.innerHTML = CustomerScreens.inbox(ctx());
    else if (state.overlay) els.overlay.innerHTML = CustomerFlows.overlay(ctx());
    else els.overlay.innerHTML = "";
    renderScan();
    document.body.classList.toggle("has-overlay", !!state.overlay || state.tab === "scan");
  }

  function render() {
    renderTabs();
    renderMain();
    renderOverlay();
  }

  function renderChrome() {
    document.getElementById("customerAvatar").textContent = UI.initials(session.name);
    document.getElementById("customerName").textContent = session.name;
    document.getElementById("demoSwitch").innerHTML = UI.renderDemoSwitcher("customer");
    UI.setToastHost(els.app);
  }

  /* ---------- Actions ---------- */

  var api = {
    state: state,
    ctx: ctx,
    render: render,
    renderMain: renderMain,
    renderTabs: renderTabs,
    renderOverlay: renderOverlay,
    blankSend: blankSend,
    goTab: function (tab) {
      state.tab = tab;
      state.flipped = null;
      if (tab === "gifts" && state.send.step === "done") state.send = blankSend();
      render();
      els.main.scrollTop = 0;
    }
  };

  var actions = {
    goTab: function (el) {
      state.overlay = null;
      state.giftId = null;
      api.goTab(el.getAttribute("data-tab"));
    },
    closeOverlay: function (el, event) {
      if (el.classList.contains("sheet-scrim") && event.target !== el) return;
      state.overlay = null;
      state.giftId = null;
      renderOverlay();
    },
    signOut: function () { Auth.signOut(); },
    toggleDemoSwitch: UI.toggleDemoSwitch
  };

  [CustomerScreens.createActions(api), CustomerFlows.createActions(api)].forEach(function (extra) {
    Object.keys(extra).forEach(function (k) { actions[k] = extra[k]; });
  });

  UI.delegate(document, actions);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !state.overlay) return;
    state.overlay = null;
    state.giftId = null;
    renderOverlay();
  });

  renderChrome();
  render();
})();
