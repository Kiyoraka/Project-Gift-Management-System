/* Client Console - state, router, tenant switch and event delegation.
   Requires ui.js, auth.js, client-data.js, client-screens.js, client-overlays.js. */

(function () {
  "use strict";

  var session = Auth.requireSession("client", "client.html");
  if (!session) return;

  var params = new URLSearchParams(window.location.search);

  var NAV = [["main", "Main", "main"], ["analysis", "Analysis", "analysis"], ["customers", "Customer List", "customers"], ["setting", "Setting", "setting"]];

  var state = {
    tenantKey: Auth.normalizeTenant(params.get("tenant") || session.tenant),
    screen: "main",
    tab: "Sales",
    range: "Month",
    settingTab: "Card Designs",
    custSearch: "",
    expanded: "Aisyah Rahman",
    designs: ClientData.initialDesigns(),
    gateways: ClientData.initialGateways(),
    notifs: ClientData.initialNotifications(),
    design: blankDesign(),
    designError: false,
    overlay: null
  };

  function blankDesign() {
    return { name: "", type: "fixed", denom: 100, item: "", validity: 12, art: false };
  }

  var els = {
    shell: document.getElementById("shell"),
    nav: document.getElementById("nav"),
    main: document.getElementById("main"),
    overlay: document.getElementById("overlay")
  };

  function tenant() {
    return ClientData.TENANTS[state.tenantKey];
  }

  function ctx() {
    return {
      state: state,
      session: session,
      tenant: tenant(),
      designs: state.designs[state.tenantKey],
      gateways: state.gateways[state.tenantKey],
      notifs: state.notifs
    };
  }

  /* ---------- Rendering ---------- */

  function renderNav() {
    els.nav.innerHTML = NAV.map(function (n) {
      var active = state.screen === n[0];
      return (
        '<button type="button" class="nav-item' + (active ? " is-active" : "") + '" data-action="go" data-screen="' + n[0] + '"' +
        (active ? ' aria-current="page"' : "") + ' title="' + n[1] + '"><span class="nav-icon">' + UI.icon(n[2]) + '</span><span class="nav-label">' + n[1] + "</span></button>"
      );
    }).join("");
  }

  function renderMain() {
    els.main.innerHTML = ClientScreens[state.screen](ctx());
  }

  function renderOverlay() {
    els.overlay.innerHTML = state.overlay ? ClientOverlays.render(ctx()) : "";
    document.body.style.overflow = state.overlay ? "hidden" : "";
    if (state.overlay) ClientOverlays.afterRender(ctx(), els.overlay);
  }

  function render() {
    renderNav();
    renderMain();
    renderOverlay();
  }

  function renderCustomerRows() {
    var body = document.getElementById("customerRows");
    if (body) body.innerHTML = ClientScreens.customerRows(ctx());
  }

  function renderDemoSwitch() {
    var dots = Object.keys(ClientData.TENANTS).map(function (key) {
      var t = ClientData.TENANTS[key];
      return (
        '<button type="button" class="demo-dot' + (key === state.tenantKey ? " is-current" : "") + '" style="--dot:' + t.brand +
        '" data-action="switchTenant" data-tenant="' + key + '" title="' + UI.escapeHtml(t.name) + '" aria-label="Switch to ' + UI.escapeHtml(t.name) + '"></button>'
      );
    }).join("");
    var wasOpen = !!document.querySelector("[data-demo-switch].is-open");
    document.getElementById("demoSwitch").innerHTML =
      UI.renderDemoSwitcher("client", '<span class="demo-sep"></span><span class="demo-dots row" style="--gap:6px">' + dots + "</span>");
    if (wasOpen) document.querySelector("[data-demo-switch]").classList.add("is-open");
  }

  /* Tenant brand, names and signed-in staff member in the chrome around the screens. */
  function applyTenant() {
    var t = tenant();
    var initial = t.name.charAt(0);
    document.documentElement.style.setProperty("--brand", t.brand);
    ["topbarMark", "sidebarMark"].forEach(function (id) {
      var el = document.getElementById(id);
      el.textContent = initial;
      el.style.setProperty("--mark", t.brand);
    });
    document.getElementById("topbarName").textContent = t.name;
    document.getElementById("sidebarName").textContent = t.name;
    document.getElementById("sidebarBusiness").textContent = t.business;
    document.title = t.name + " - Client Console - Giftwell";

    var initials = UI.initials(session.name);
    document.getElementById("topbarAvatar").textContent = initials;
    document.getElementById("footAvatar").textContent = initials;
    document.getElementById("footName").textContent = session.name;
    document.getElementById("footTitle").textContent = session.title || "Owner";
    renderDemoSwitch();
  }

  function renderChromeIcons() {
    document.querySelector("[data-action='openNav']").innerHTML = UI.icon("menu", 18, 2);
    document.querySelector("[data-action='signOut']").innerHTML = UI.icon("logout", 18);
    document.getElementById("sidebarQr").innerHTML = UI.icon("qr", 16) + '<span class="sidebar-cta-label">Show Payment QR</span>';
  }

  function setNavOpen(open) {
    els.shell.classList.toggle("nav-open", open);
  }

  function renderDesignPreview() {
    var host = document.getElementById("designPreview");
    if (host) host.innerHTML = UI.renderGiftCard(ClientScreens.previewCard(ctx()));
  }

  function showDesignError() {
    var el = document.getElementById("designError");
    if (el) el.hidden = false;
  }

  function designMeta(d) {
    if (d.type === "fixed") return "Fixed · RM " + d.denom + " · " + (d.validity || 12) + " mo";
    if (d.type === "open") return "Open · RM 10–1,000";
    return "Voucher · " + (d.item.trim() || tenant().voucherHint.replace("e.g. ", ""));
  }

  function closeOverlay() {
    state.overlay = null;
    ClientOverlays.onClose(ctx());
    renderOverlay();
  }

  /* ---------- Actions ---------- */

  var actions = {
    openNav: function () { setNavOpen(true); },
    closeNav: function () { setNavOpen(false); },
    go: function (el) {
      state.screen = el.getAttribute("data-screen");
      setNavOpen(false);
      render();
      window.scrollTo(0, 0);
      els.main.focus({ preventScroll: true });
    },
    goDesigns: function () {
      state.screen = "setting";
      state.settingTab = "Card Designs";
      render();
      window.scrollTo(0, 0);
    },
    setTab: function (el) { state.tab = el.getAttribute("data-tab"); renderMain(); },
    setRange: function (el) { state.range = el.getAttribute("data-range"); renderMain(); },
    custSearch: function (el) { state.custSearch = el.value; renderCustomerRows(); },
    toggleCustomer: function (el) {
      var name = el.getAttribute("data-name");
      state.expanded = state.expanded === name ? null : name;
      renderCustomerRows();
    },
    exportCsv: function () {
      UI.showToast("customers-" + state.tenantKey + "-2026-09-15.csv downloading", "info");
    },
    switchTenant: function (el) {
      var key = Auth.normalizeTenant(el.getAttribute("data-tenant"));
      if (key === state.tenantKey) return;
      state.tenantKey = key;
      state.expanded = "Aisyah Rahman";
      state.custSearch = "";
      Auth.updateSession("client", { tenant: key });
      if (window.history && window.history.replaceState) window.history.replaceState(null, "", "client.html?tenant=" + key);
      applyTenant();
      render();
      UI.showToast("Switched to " + tenant().name, "info");
    },
    setSettingTab: function (el) {
      state.settingTab = el.getAttribute("data-tab");
      state.designError = false;
      renderMain();
    },
    saveProfile: function () { UI.showToast("Business profile saved"); },
    replaceLogo: function () { UI.showToast("Logo upload opens here in the live system", "info"); },

    uploadArt: function () {
      state.design.art = true;
      state.designError = false;
      renderMain();
      UI.showToast("Artwork uploaded · preview updated", "info");
    },
    designName: function (el) {
      state.design.name = el.value;
      renderDesignPreview();
    },
    designItem: function (el) {
      state.design.item = el.value;
      renderDesignPreview();
    },
    designValidity: function (el) { state.design.validity = el.value; },
    designType: function (el) {
      state.design.type = el.getAttribute("data-type");
      renderMain();
    },
    designDenom: function (el) {
      state.design.denom = Number(el.getAttribute("data-value"));
      renderMain();
    },
    saveDraft: function () {
      var d = state.design;
      if (!d.name.trim()) {
        state.designError = true;
        showDesignError();
        return;
      }
      state.designs[state.tenantKey].push({ name: d.name.trim(), type: d.type, meta: designMeta(d), status: "Draft", sold: 0 });
      UI.showToast("“" + d.name.trim() + "” saved as draft", "info");
      state.design = blankDesign();
      state.designError = false;
      renderMain();
    },
    publishDesign: function () {
      var d = state.design;
      if (!d.name.trim() || !d.art) {
        state.designError = true;
        showDesignError();
        return;
      }
      state.designs[state.tenantKey].unshift({ name: d.name.trim(), type: d.type, meta: designMeta(d), status: "Active", sold: 0 });
      UI.showToast("“" + d.name.trim() + "” is live in your catalogue");
      state.design = blankDesign();
      state.designError = false;
      renderMain();
    },

    makeDefault: function (el) {
      var list = state.gateways[state.tenantKey];
      var target = list[Number(el.getAttribute("data-index"))];
      if (!target) return;
      list.forEach(function (g) { g.isDefault = g === target; });
      renderMain();
      UI.showToast(target.provider + " is now the default gateway");
    },
    toggleGateway: function (el) {
      var g = state.gateways[state.tenantKey][Number(el.getAttribute("data-index"))];
      if (!g) return;
      var disabled = g.status === "Disabled";
      if (g.isDefault && !disabled) {
        UI.showToast("Set another gateway as default first", "warning");
        return;
      }
      g.status = disabled ? "Active" : "Disabled";
      renderMain();
      UI.showToast(disabled ? g.provider + " enabled" : g.provider + " disabled", disabled ? "success" : "danger");
    },
    openGateway: function () {
      state.overlay = "gateway";
      ClientOverlays.onOpen(ctx(), "gateway");
      renderOverlay();
    },

    inviteStaff: function () { UI.showToast("Staff invite link copied", "info"); },
    toggleNotif: function (el) {
      var n = state.notifs[Number(el.getAttribute("data-index"))];
      if (!n) return;
      n.on = !n.on;
      el.classList.toggle("is-on", n.on);
      el.setAttribute("aria-checked", n.on ? "true" : "false");
    },

    openQr: function () {
      state.overlay = "qr";
      setNavOpen(false);
      ClientOverlays.onOpen(ctx(), "qr");
      renderOverlay();
    },
    closeOverlay: function (el, event) {
      if (el.classList.contains("modal-scrim") && event.target !== el) return;
      closeOverlay();
    },
    signOut: function () { Auth.signOut("client"); },
    toggleDemoSwitch: UI.toggleDemoSwitch
  };

  var api = {
    state: state,
    ctx: ctx,
    render: render,
    renderMain: renderMain,
    renderOverlay: renderOverlay,
    closeOverlay: closeOverlay
  };

  var extra = ClientOverlays.createActions(api);
  Object.keys(extra).forEach(function (k) { actions[k] = extra[k]; });

  UI.delegate(document, actions);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (state.overlay) closeOverlay();
    else setNavOpen(false);
  });

  if (state.tenantKey !== session.tenant) Auth.updateSession("client", { tenant: state.tenantKey });

  renderChromeIcons();
  applyTenant();
  render();
})();
