/* Customer app - state, tab router and event delegation.
   Screens live in customer-screens.js (Wallet, Send, Profile, Inbox); flows in customer-flows.js (Scan, Pay, Buy).
   Requires ui.js, auth.js, customer-data.js, customer-screens.js, customer-flows.js. */

(function () {
  "use strict";

  var session = Auth.requireSession("customer", "customer.html");
  if (!session) return;

  var TABS = [["wallet", "Wallet"], ["send", "Send"], ["scan", "Scan"], ["profile", "Profile"]];

  var state = {
    tab: "wallet",
    filter: "All",
    flipped: null,
    newId: null,
    cards: CustomerData.initialCards(),
    pending: CustomerData.initialPending(),
    history: CustomerData.initialHistory(),
    gifts: CustomerData.initialGifts(),
    notifs: CustomerData.initialNotifications(),
    histTab: "tx",
    send: blankSend(),
    overlay: null,
    giftId: null,
    pay: null,
    buy: null
  };

  function blankSend() {
    return { step: "pick", cardId: null, phone: "", message: "", when: "now", error: false };
  }

  var els = {
    app: document.getElementById("app"),
    main: document.getElementById("appMain"),
    scan: document.getElementById("appScan"),
    overlay: document.getElementById("appOverlay"),
    tabbar: document.getElementById("tabbar"),
    inbox: document.getElementById("inboxBtn")
  };

  function ctx() {
    return { state: state, session: session };
  }

  /* ---------- Rendering ---------- */

  function renderTabs() {
    els.tabbar.innerHTML = TABS.map(function (t) {
      var active = state.tab === t[0];
      var iconHtml = t[0] === "scan"
        ? '<span class="tab-raised">' + UI.icon("scan", 24, 1.8) + "</span>"
        : '<span style="display:inline-flex;width:24px;height:24px">' + UI.icon(t[0], 24, 1.8) + "</span>";
      return (
        '<button type="button" class="tab-btn' + (active ? " is-active" : "") + '" data-action="goTab" data-tab="' + t[0] + '"' +
        (active ? ' aria-current="page"' : "") + ">" + iconHtml + "<span>" + t[1] + "</span></button>"
      );
    }).join("");
  }

  function renderInboxButton() {
    var count = state.pending.length;
    els.inbox.innerHTML = UI.icon("gift", 18) + (count ? '<span class="inbox-badge">' + count + "</span>" : "");
    els.inbox.setAttribute("aria-label", count ? "Gift inbox, " + count + " waiting" : "Gift inbox");
  }

  function renderMain() {
    var screen = state.tab === "scan" ? "wallet" : state.tab;
    els.main.innerHTML = CustomerScreens[screen](ctx());
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
    renderInboxButton();
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
    renderOverlay: renderOverlay,
    renderInboxButton: renderInboxButton,
    blankSend: blankSend,
    goTab: function (tab) {
      state.tab = tab;
      state.flipped = null;
      if (tab === "send" && state.send.step === "done") state.send = blankSend();
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
    openInbox: function () {
      state.overlay = "inbox";
      state.giftId = null;
      renderOverlay();
    },
    closeOverlay: function (el, event) {
      if (el.classList.contains("sheet-scrim") && event.target !== el) return;
      state.overlay = null;
      state.giftId = null;
      renderOverlay();
    },
    signOut: function () { Auth.signOut("customer"); },
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
