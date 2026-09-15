/* Admin Console - Main, Analysis, User, Setting. Requires ui.js and auth.js. */

(function () {
  "use strict";

  var session = Auth.requireSession("admin", "admin.html");
  if (!session) return;

  var esc = UI.escapeHtml;

  /* ---------- Sample data (from the Admin Console design) ---------- */

  var CLIENTS = [
    { name: "Senja Coffee", business: "Specialty coffee bar", brand: "#C2603E", designs: 12, sold: "1,240", outstanding: "RM 48,900" },
    { name: "Lumi Spa", business: "Wellness and massage", brand: "#7FA68C", designs: 6, sold: "380", outstanding: "RM 61,200" },
    { name: "Page & Ink", business: "Independent bookshop", brand: "#1E2A4A", designs: 9, sold: "715", outstanding: "RM 22,150" }
  ];

  var STATS = [
    { label: "Total clients", value: "3", delta: "+1 this quarter", tone: "pill-success", spark: "0,30 16,30 32,20 48,20 64,20 80,10" },
    { label: "Active cards", value: "2,335", delta: "+6.4%", tone: "pill-success", spark: "0,34 16,28 32,30 48,22 64,18 80,10" },
    { label: "Gift value in circulation", value: "RM 132,250", delta: "+8.2%", tone: "pill-success", spark: "0,32 16,26 32,28 48,18 64,20 80,8" },
    { label: "Platform revenue this month", value: "RM 4,620", delta: "−1.1%", tone: "pill-warning", spark: "0,14 16,18 32,12 48,22 64,20 80,24" }
  ];

  var ACTIVITY = [
    { text: "Senja Coffee published “Sunrise” Fixed RM 100", when: "12 min ago", dot: "#5B2A86" },
    { text: "Lumi Spa added Billplz as a gateway", when: "1 h ago", dot: "#3E7CB1" },
    { text: "Page & Ink onboarded · awaiting first gateway", when: "Yesterday, 16:40", dot: "#D98A2B" },
    { text: "RM 1,020 platform fee settled for August", when: "Yesterday, 09:00", dot: "#2E9E6B" },
    { text: "Senja Coffee archived “Monsoon” voucher", when: "3 days ago", dot: "#6B647A" }
  ];

  var TAB_DATA = {
    Sales: { title: "Sales per client", l1: "This period", l2: "Previous", unit: "RM ", vals: [[48900, 41200], [61200, 52800], [22150, 24600]] },
    Cards: { title: "Cards sold per client", l1: "Sold", l2: "Redeemed", unit: "", vals: [[1240, 890], [380, 210], [715, 540]] },
    Customers: { title: "Customers per client", l1: "Active", l2: "New", unit: "", vals: [[860, 120], [290, 44], [510, 71]] },
    Gateways: { title: "Gateway volume per client", l1: "Succeeded", l2: "Failed", unit: "", vals: [[1180, 22], [365, 9], [690, 14]] }
  };

  var RANGE_LABELS = { Day: "Today", Month: "September 2026", Year: "2026 to date", Custom: "1 Aug – 15 Sep 2026" };

  var TOP_CARDS = [
    { card: "Sunrise", client: "Senja Coffee", type: "Fixed", sold: 512, redeemed: 388, revenue: "RM 51,200" },
    { card: "Calm Hour", client: "Lumi Spa", type: "Voucher", sold: 214, redeemed: 131, revenue: "RM 40,660" },
    { card: "First Edition", client: "Page & Ink", type: "Open", sold: 330, redeemed: 260, revenue: "RM 18,900" },
    { card: "Two Cups", client: "Senja Coffee", type: "Voucher", sold: 402, redeemed: 371, revenue: "RM 6,432" },
    { card: "Slow Sunday", client: "Lumi Spa", type: "Fixed", sold: 96, redeemed: 40, revenue: "RM 19,200" }
  ];

  var NAV = [["main", "Main"], ["analysis", "Analysis"], ["user", "User"], ["setting", "Setting"]];

  /* ---------- State ---------- */

  var state = {
    screen: "main",
    tab: "Sales",
    range: "Month",
    userSearch: "",
    roleFilter: "All",
    statusFilter: "All",
    clientStatus: { "Senja Coffee": "Active", "Lumi Spa": "Active", "Page & Ink": "Onboarding" },
    overlay: null
  };

  var els = {
    shell: document.getElementById("shell"),
    nav: document.getElementById("nav"),
    main: document.getElementById("main"),
    overlay: document.getElementById("overlay")
  };

  /* ---------- Shared bits ---------- */

  function pageHead(title, sub, rightHtml) {
    return (
      '<div class="page-head"><div><h1 class="page-title">' + esc(title) + "</h1>" +
      (sub ? '<div class="muted" style="margin-top:6px">' + sub + "</div>" : "") + "</div>" + (rightHtml || "") + "</div>"
    );
  }

  function statTiles(stats) {
    return (
      '<div class="stat-grid">' +
      stats.map(function (s) {
        return (
          '<div class="stat-tile"><div><div class="stat-label">' + esc(s.label) + '</div><div class="stat-value">' + esc(s.value) +
          '</div><span class="delta ' + s.tone + '">' + esc(s.delta) + "</span></div>" + UI.sparkline(s.spark) + "</div>"
        );
      }).join("") +
      "</div>"
    );
  }

  function donutSvg(split, total, caption) {
    var C = 2 * Math.PI * 46;
    var colors = ["#5B2A86", "#D9A441", "#3E7CB1"];
    var offset = 0;
    var arcs = split.map(function (p, i) {
      var arc = '<circle cx="60" cy="60" r="46" fill="none" stroke="' + colors[i] + '" stroke-width="18" stroke-dasharray="' +
        (C * p).toFixed(2) + " " + C.toFixed(2) + '" stroke-dashoffset="' + (-offset).toFixed(2) + '" transform="rotate(-90 60 60)"/>';
      offset += C * p;
      return arc;
    }).join("");
    return (
      '<svg viewBox="0 0 120 120" width="140" height="140" style="flex-shrink:0" role="img" aria-label="Card type split">' +
      '<circle cx="60" cy="60" r="46" fill="none" stroke="#F1EDF6" stroke-width="18"/>' + arcs +
      '<text x="60" y="57" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="20" fill="#1F1B2A">' + esc(total) + "</text>" +
      '<text x="60" y="73" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" fill="#6B647A">' + esc(caption) + "</text></svg>"
    );
  }

  function donutLegend(split) {
    var names = ["Fixed Value", "Open Value", "Voucher"];
    var colors = ["#5B2A86", "#D9A441", "#3E7CB1"];
    return (
      '<div class="legend">' +
      split.map(function (p, i) {
        return '<div class="legend-item"><span class="swatch" style="background:' + colors[i] + '"></span><span class="muted">' + names[i] +
          "</span><strong>" + Math.round(p * 100) + "%</strong></div>";
      }).join("") +
      "</div>"
    );
  }

  /* ---------- Screens ---------- */

  function renderMainScreen() {
    var revenuePath = "M60 170 L80 160 L100 165 L120 150 L140 155 L160 140 L180 148 L200 130 L220 138 L240 120 L260 128 L280 110 L300 118 L320 100 L340 108 L360 96 L380 104 L400 88 L420 98 L440 80 L460 90 L480 72 L500 84 L520 66 L540 78 L560 60 L580 70 L600 52";
    var chart =
      '<svg class="line-chart" viewBox="0 0 600 220" role="img" aria-label="Platform revenue, last 30 days, rising to about RM 270 a day">' +
      '<g stroke="#E4DEEC" stroke-width="1"><line x1="0" y1="40" x2="600" y2="40"/><line x1="0" y1="90" x2="600" y2="90"/><line x1="0" y1="140" x2="600" y2="140"/><line x1="0" y1="190" x2="600" y2="190"/></g>' +
      '<g fill="#6B647A" font-size="11" font-family="Inter, system-ui, sans-serif"><text x="0" y="36">RM 300</text><text x="0" y="86">RM 200</text><text x="0" y="136">RM 100</text><text x="0" y="186">0</text></g>' +
      '<path d="' + revenuePath + ' L600 190 L60 190 Z" fill="#EEE4F7" opacity=".7"/>' +
      '<path d="' + revenuePath + '" fill="none" stroke="#5B2A86" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<circle cx="600" cy="52" r="4" fill="#5B2A86"/>' +
      '<g fill="#6B647A" font-size="11" font-family="Inter, system-ui, sans-serif"><text x="60" y="212">17 Aug</text><text x="300" y="212" text-anchor="middle">31 Aug</text><text x="600" y="212" text-anchor="end">15 Sep</text></g></svg>';

    var activity = ACTIVITY.map(function (a) {
      return '<div class="activity-row"><span class="dot" style="color:' + a.dot + '"></span><div style="min-width:0"><div style="font-size:13px">' +
        esc(a.text) + '</div><div class="caption" style="margin-top:2px">' + esc(a.when) + "</div></div></div>";
    }).join("");

    var health = CLIENTS.map(function (c) {
      var status = state.clientStatus[c.name];
      return (
        '<div class="health-row">' +
        '<div class="health-client"><div class="user-cell"><span class="brand-mark" style="--size:30px;--mark:' + c.brand + ';border-radius:8px">' + esc(c.name.charAt(0)) +
        '</span><div style="min-width:0"><div class="row-title">' + esc(c.name) + '</div><div class="row-sub">' + esc(c.business) + "</div></div></div></div>" +
        '<div class="health-metric"><span class="caption">Designs</span><strong>' + c.designs + "</strong></div>" +
        '<div class="health-metric"><span class="caption">Sold</span><strong>' + esc(c.sold) + "</strong></div>" +
        '<div class="health-metric"><span class="caption">Outstanding</span><strong>' + esc(c.outstanding) + "</strong></div>" +
        '<div class="health-status">' + UI.pill(status) + "</div>" +
        "</div>"
      );
    }).join("");

    return (
      '<div class="screen">' +
      pageHead("Main", esc(UI.TODAY_LABEL) + " · 3 clients live", '<span class="pill pill-success" style="padding:6px 12px">All systems operational</span>') +
      statTiles(STATS) +
      '<div class="panel-row">' +
      '<div class="panel" style="flex:2 1 460px"><div class="panel-head"><div class="panel-title">Platform revenue · last 30 days</div><div class="caption">Fee 3.5% on card sales</div></div>' + chart + "</div>" +
      '<div class="panel" style="flex:1 1 280px"><div class="panel-title">Recent activity</div><div style="margin-top:8px">' + activity + "</div></div>" +
      "</div>" +
      '<div class="panel"><div class="panel-head"><div class="panel-title">Client health</div><a href="#analysis" class="btn-link" data-action="go" data-screen="analysis">Open analysis</a></div>' +
      '<div style="margin-top:8px">' + health + "</div></div>" +
      "</div>"
    );
  }

  function renderAnalysisScreen() {
    var data = TAB_DATA[state.tab];
    var max = Math.max.apply(null, data.vals.reduce(function (a, v) { return a.concat(v); }, []));
    var names = CLIENTS.map(function (c) { return c.name; });

    var bars = names.map(function (label, i) {
      var v = data.vals[i];
      return (
        '<div class="grouped-col"><div style="font-size:12px;font-weight:600;white-space:nowrap">' + esc(data.unit + v[0].toLocaleString("en-MY")) + "</div>" +
        '<div class="grouped-pair"><span style="background:#5B2A86;height:' + Math.round(v[0] / max * 100) + '%" title="' + esc(data.l1) + '"></span>' +
        '<span style="background:#D9A441;height:' + Math.round(v[1] / max * 100) + '%" title="' + esc(data.l2) + '"></span></div></div>'
      );
    }).join("");

    var tabs = Object.keys(TAB_DATA).map(function (t) {
      return '<button type="button" class="tab' + (state.tab === t ? " is-active" : "") + '" data-action="setTab" data-tab="' + t + '">' + t + "</button>";
    }).join("");

    var ranges = Object.keys(RANGE_LABELS).map(function (r) {
      return '<button type="button" class="chip' + (state.range === r ? " is-active" : "") + '" data-action="setRange" data-range="' + r + '">' + r + "</button>";
    }).join("");

    var rows = TOP_CARDS.map(function (r) {
      return (
        "<tr><td style=\"font-weight:600\">" + esc(r.card) + "</td><td>" + esc(r.client) + '</td><td><span class="type-tag">' + esc(r.type) +
        '</span></td><td class="num">' + r.sold + '</td><td class="num">' + r.redeemed + '</td><td class="num" style="font-weight:600">' + esc(r.revenue) + "</td></tr>"
      );
    }).join("");

    return (
      '<div class="screen screen-tight">' +
      '<h1 class="page-title">Analysis</h1>' +
      '<div class="spread" style="flex-wrap:wrap;gap:16px"><div class="tabs" role="tablist">' + tabs + '</div><div class="row-wrap" style="--gap:8px">' + ranges + "</div></div>" +
      '<div class="panel-row">' +
      '<div class="panel" style="flex:2 1 420px"><div class="panel-head"><div class="panel-title">' + esc(data.title) + '</div><div class="caption">' + esc(RANGE_LABELS[state.range]) + "</div></div>" +
      '<div class="grouped-bars">' + bars + "</div>" +
      '<div class="grouped-bars-labels" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:10px;font-size:12px;color:var(--ink-muted);text-align:center">' +
      names.map(function (n) { return "<div>" + esc(n) + "</div>"; }).join("") + "</div>" +
      '<div class="row-wrap" style="--gap:16px;margin-top:14px;font-size:12px;color:var(--ink-muted)"><span class="row" style="--gap:6px"><span class="swatch" style="background:#5B2A86"></span>' +
      esc(data.l1) + '</span><span class="row" style="--gap:6px"><span class="swatch" style="background:#D9A441"></span>' + esc(data.l2) + "</span></div></div>" +
      '<div class="panel" style="flex:1 1 260px"><div class="panel-title">Card type split</div><div class="donut-wrap">' + donutSvg([0.52, 0.31, 0.17], "2,335", "cards") + donutLegend([0.52, 0.31, 0.17]) + "</div></div>" +
      "</div>" +
      '<div class="panel panel-flush"><div class="panel-head-bar panel-title">Top cards</div><div class="table-wrap"><table class="table" style="min-width:640px">' +
      '<thead><tr><th>Card</th><th>Client</th><th>Type</th><th class="num">Sold</th><th class="num">Redeemed</th><th class="num">Revenue</th></tr></thead><tbody>' + rows + "</tbody></table></div></div>" +
      "</div>"
    );
  }

  function renderUserScreen() {
    return '<div class="screen">' + pageHead("User", "Users across all roles") + '<div class="panel empty-state">User management is being prepared.</div></div>';
  }

  function renderSettingScreen() {
    return '<div class="screen">' + pageHead("Setting", "Platform settings") + '<div class="panel empty-state">Platform settings are being prepared.</div></div>';
  }

  var SCREENS = { main: renderMainScreen, analysis: renderAnalysisScreen, user: renderUserScreen, setting: renderSettingScreen };

  /* ---------- Rendering ---------- */

  function renderNav() {
    els.nav.innerHTML = NAV.map(function (n) {
      var active = state.screen === n[0];
      return (
        '<button type="button" class="nav-item' + (active ? " is-active" : "") + '" data-action="go" data-screen="' + n[0] + '"' +
        (active ? ' aria-current="page"' : "") + ' title="' + n[1] + '"><span class="nav-icon">' + UI.icon(n[0]) + '</span><span class="nav-label">' + n[1] + "</span></button>"
      );
    }).join("");
  }

  function renderMain() {
    els.main.innerHTML = SCREENS[state.screen]();
  }

  function renderOverlay() {
    els.overlay.innerHTML = "";
  }

  function render() {
    renderNav();
    renderMain();
    renderOverlay();
  }

  function renderChrome() {
    var initials = UI.initials(session.name);
    document.getElementById("topbarAvatar").textContent = initials;
    document.getElementById("footAvatar").textContent = initials;
    document.getElementById("footName").textContent = session.name;
    document.getElementById("footTitle").textContent = session.title || "Admin";
    document.querySelector("[data-action='openNav']").innerHTML = UI.icon("menu", 18, 2);
    document.querySelector("[data-action='signOut']").innerHTML = UI.icon("logout", 18);
    document.getElementById("demoSwitch").innerHTML = UI.renderDemoSwitcher("admin");
  }

  function setNavOpen(open) {
    els.shell.classList.toggle("nav-open", open);
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
    setTab: function (el) { state.tab = el.getAttribute("data-tab"); renderMain(); },
    setRange: function (el) { state.range = el.getAttribute("data-range"); renderMain(); },
    signOut: function () { Auth.signOut("admin"); },
    toggleDemoSwitch: UI.toggleDemoSwitch
  };

  UI.delegate(document, actions);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (state.overlay) {
      state.overlay = null;
      renderOverlay();
    } else {
      setNavOpen(false);
    }
  });

  renderChrome();
  render();
})();
