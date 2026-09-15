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

  var TEMPLATES = [
    { name: "Gift received", preview: "Someone sent you a {{card}} from {{client}} — open the gift app to accept." },
    { name: "Payment receipt", preview: "You paid RM {{amount}} at {{client}}. Remaining balance RM {{balance}}." },
    { name: "Card expiring soon", preview: "Your {{card}} expires in 30 days. RM {{balance}} left to spend." },
    { name: "Gateway status change", preview: "{{provider}} is now {{status}} for {{client}}." }
  ];

  var ADMINS = [
    { name: "Alice Kwan", email: "alice@giftwell.my", role: "Super admin" },
    { name: "Marcus Tan", email: "marcus@giftwell.my", role: "Admin" },
    { name: "Priya Nair", email: "priya@giftwell.my", role: "Finance" }
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
    users: [
      { name: "Alice Kwan", email: "alice@giftwell.my", role: "Admin", tenant: "—", last: "2 min ago", status: "Active" },
      { name: "Marcus Tan", email: "marcus@giftwell.my", role: "Admin", tenant: "—", last: "Yesterday", status: "Active" },
      { name: "Farid Senja", email: "farid@senjacoffee.my", role: "Client staff", tenant: "Senja Coffee", last: "14 min ago", status: "Active" },
      { name: "Clara Wong", email: "clara@lumispa.my", role: "Client staff", tenant: "Lumi Spa", last: "1 h ago", status: "Active" },
      { name: "Jonas Lim", email: "jonas@pageandink.my", role: "Client staff", tenant: "Page & Ink", last: "3 days ago", status: "Pending" },
      { name: "Aisyah Rahman", email: "aisyah.r@gmail.com", role: "Customer", tenant: "—", last: "Today", status: "Active" },
      { name: "Daniel Lee", email: "daniel.lee@outlook.com", role: "Customer", tenant: "—", last: "4 days ago", status: "Active" },
      { name: "Hafiz Omar", email: "hafiz.o@gmail.com", role: "Customer", tenant: "—", last: "2 weeks ago", status: "Suspended" }
    ],
    invite: { name: "", email: "", role: "Admin", tenant: "Senja Coffee" },
    suspendTarget: "Senja Coffee",
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

  function filteredUsers() {
    var q = state.userSearch.trim().toLowerCase();
    return state.users
      .map(function (u, i) { return { user: u, index: i }; })
      .filter(function (item) {
        var u = item.user;
        return (u.name + " " + u.email).toLowerCase().indexOf(q) >= 0 &&
          (state.roleFilter === "All" || u.role === state.roleFilter) &&
          (state.statusFilter === "All" || u.status === state.statusFilter);
      });
  }

  function userRowsHtml(list) {
    return list.map(function (item) {
      var u = item.user;
      var suspended = u.status === "Suspended";
      return (
        "<tr>" +
        '<td><div class="user-cell"><span class="avatar" style="--size:30px">' + esc(UI.initials(u.name)) + '</span><div style="min-width:0"><div style="font-weight:600">' +
        esc(u.name) + '</div><div class="row-sub">' + esc(u.email) + "</div></div></div></td>" +
        "<td>" + esc(u.role) + '</td><td class="muted">' + esc(u.tenant) + '</td><td class="muted">' + esc(u.last) + "</td>" +
        "<td>" + UI.pill(u.status) + "</td>" +
        '<td><div class="row-actions">' +
        '<button type="button" class="btn btn-outline btn-sm" data-action="viewUser" data-id="' + item.index + '">View</button>' +
        '<button type="button" class="btn btn-outline btn-sm" data-action="toggleUser" data-id="' + item.index + '" style="color:' + (suspended ? "var(--success)" : "var(--danger)") + '">' +
        (suspended ? "Reinstate" : "Suspend") + "</button>" +
        '<button type="button" class="btn btn-outline btn-sm" data-action="resetUser" data-id="' + item.index + '">Reset password</button>' +
        "</div></td></tr>"
      );
    }).join("");
  }

  function renderUserResults() {
    var list = filteredUsers();
    var body = document.getElementById("userRows");
    if (!body) return;
    body.innerHTML = userRowsHtml(list);
    document.getElementById("userEmpty").hidden = list.length > 0;
    document.getElementById("userCount").textContent = state.users.length;
  }

  function selectHtml(action, value, options) {
    return (
      '<select class="select" data-change="' + action + '">' +
      options.map(function (o) {
        return '<option value="' + esc(o[0]) + '"' + (o[0] === value ? " selected" : "") + ">" + esc(o[1]) + "</option>";
      }).join("") +
      "</select>"
    );
  }

  function renderUserScreen() {
    var list = filteredUsers();
    return (
      '<div class="screen screen-tight">' +
      pageHead("User", '<span id="userCount">' + state.users.length + "</span> users across all roles",
        '<button type="button" class="btn btn-primary" data-action="openInvite">Invite user</button>') +
      '<div class="filters">' +
      '<input class="input grow" type="search" placeholder="Search name or email" aria-label="Search users" data-input="userSearch" value="' + esc(state.userSearch) + '">' +
      selectHtml("roleFilter", state.roleFilter, [["All", "All roles"], ["Admin", "Admin"], ["Client staff", "Client staff"], ["Customer", "Customer"]]) +
      selectHtml("statusFilter", state.statusFilter, [["All", "All statuses"], ["Active", "Active"], ["Suspended", "Suspended"], ["Pending", "Pending"]]) +
      "</div>" +
      '<div class="panel panel-flush"><div class="table-wrap"><table class="table" style="min-width:760px">' +
      '<thead><tr><th>Name</th><th>Role</th><th>Tenant</th><th>Last active</th><th>Status</th><th class="num">Actions</th></tr></thead>' +
      '<tbody id="userRows">' + userRowsHtml(list) + "</tbody></table></div>" +
      '<div class="empty-state" id="userEmpty"' + (list.length ? " hidden" : "") + ">No users match these filters.</div></div>" +
      "</div>"
    );
  }

  function renderSettingScreen() {
    var templates = TEMPLATES.map(function (t) {
      return (
        '<div class="list-row"><div class="grow"><div class="row-title">' + esc(t.name) +
        '</div><div class="row-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(t.preview) + "</div></div>" +
        '<button type="button" class="btn btn-outline btn-sm" data-action="editTemplate" data-name="' + esc(t.name) + '">Edit</button></div>'
      );
    }).join("");

    var admins = ADMINS.map(function (a) {
      return (
        '<div class="list-row"><span class="avatar" style="--size:30px">' + esc(UI.initials(a.name)) + '</span><div class="grow"><div class="row-title">' +
        esc(a.name) + '</div><div class="row-sub">' + esc(a.email) + '</div></div><span class="caption">' + esc(a.role) + "</span></div>"
      );
    }).join("");

    var clientOptions = CLIENTS.map(function (c) { return [c.name, c.name]; });

    return (
      '<div class="screen screen-tight">' +
      pageHead("Setting", "", '<button type="button" class="btn btn-primary" data-action="saveSettings">Save changes</button>') +
      '<div class="settings-grid">' +

      '<div class="panel settings-card"><div class="panel-title">Platform</div>' +
      '<div class="row" style="--gap:14px"><span class="brand-mark" style="--size:56px;border-radius:14px">G</span>' +
      '<button type="button" class="btn btn-outline btn-sm" data-action="replaceLogo">Replace logo</button></div>' +
      '<label class="field">Platform name<input class="input" value="Giftwell"></label>' +
      '<div class="two-col">' +
      '<label class="field">Default card validity<span class="input-group"><input type="number" value="12" min="1" aria-label="Default card validity in months"><span class="affix">months</span></span></label>' +
      '<label class="field">Platform fee<span class="input-group"><input type="number" value="3.5" step="0.1" min="0" aria-label="Platform fee percent"><span class="affix">%</span></span></label>' +
      "</div></div>" +

      '<div class="panel settings-card"><div class="panel-title">Notification templates</div><div>' + templates + "</div></div>" +

      '<div class="panel settings-card"><div class="spread"><div class="panel-title">Admin accounts</div>' +
      '<button type="button" class="btn btn-outline btn-sm" data-action="openInvite" data-role="Admin">Add admin</button></div><div>' + admins + "</div></div>" +

      '<div class="panel settings-card danger-card"><div class="panel-title text-danger">Danger zone</div>' +
      '<div class="muted" style="font-size:13px">Suspending a client freezes card sales and QR payments. Existing balances stay intact.</div>' +
      '<div class="row-wrap" style="--gap:10px"><div style="flex:1 1 160px">' + selectHtml("suspendTarget", state.suspendTarget, clientOptions) + "</div>" +
      '<button type="button" class="btn btn-danger-outline" data-action="askSuspend">Suspend client</button></div></div>' +

      "</div></div>"
    );
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

  function inviteDrawerHtml() {
    var inv = state.invite;
    var tenantOptions = CLIENTS.map(function (c) { return [c.name, c.name]; });
    return (
      '<div class="overlay-scrim" data-action="closeOverlay"></div>' +
      '<div class="drawer" role="dialog" aria-modal="true" aria-labelledby="inviteTitle">' +
      '<div class="drawer-head"><div class="drawer-title" id="inviteTitle">Invite user</div>' +
      '<button type="button" class="icon-btn" data-action="closeOverlay" aria-label="Close">&times;</button></div>' +
      '<div class="drawer-body">' +
      '<label class="field">Full name<input class="input" id="inviteName" data-input="inviteName" placeholder="e.g. Mei Chen" value="' + esc(inv.name) + '"></label>' +
      '<label class="field">Email<input class="input" type="email" inputmode="email" data-input="inviteEmail" placeholder="name@company.com" value="' + esc(inv.email) + '"></label>' +
      '<label class="field">Role' + selectHtml("inviteRole", inv.role, [["Admin", "Admin"], ["Client staff", "Client staff"]]) + "</label>" +
      '<label class="field" id="inviteTenantField"' + (inv.role === "Client staff" ? "" : " hidden") + ">Tenant" + selectHtml("inviteTenant", inv.tenant, tenantOptions) + "</label>" +
      '<div class="form-error" id="inviteError" role="alert" hidden>Name and a valid email are required.</div>' +
      "</div>" +
      '<div class="drawer-foot"><button type="button" class="btn btn-outline" data-action="closeOverlay">Cancel</button>' +
      '<button type="button" class="btn btn-primary" data-action="sendInvite">Send invite</button></div>' +
      "</div>"
    );
  }

  function suspendModalHtml() {
    return (
      '<div class="modal-scrim" data-action="closeOverlay">' +
      '<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="suspendTitle">' +
      '<div class="modal-title" id="suspendTitle">Suspend ' + esc(state.suspendTarget) + "?</div>" +
      '<p class="muted" style="margin:0">Their sales and payment QR stop immediately. Customers keep their balances. You can reinstate at any time.</p>' +
      '<div class="modal-actions"><button type="button" class="btn btn-outline" data-action="closeOverlay">Keep active</button>' +
      '<button type="button" class="btn btn-danger" data-action="confirmSuspend">Suspend</button></div>' +
      "</div></div>"
    );
  }

  function renderOverlay() {
    if (state.overlay === "invite") {
      els.overlay.innerHTML = inviteDrawerHtml();
      var first = document.getElementById("inviteName");
      if (first) first.focus();
    } else if (state.overlay === "suspend") {
      els.overlay.innerHTML = suspendModalHtml();
      var confirmBtn = els.overlay.querySelector("[data-action='confirmSuspend']");
      if (confirmBtn) confirmBtn.focus();
    } else {
      els.overlay.innerHTML = "";
    }
    document.body.style.overflow = state.overlay ? "hidden" : "";
    document.body.classList.toggle("has-overlay", !!state.overlay);
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

    userSearch: function (el) { state.userSearch = el.value; renderUserResults(); },
    roleFilter: function (el) { state.roleFilter = el.value; renderUserResults(); },
    statusFilter: function (el) { state.statusFilter = el.value; renderUserResults(); },
    viewUser: function (el) {
      var u = state.users[Number(el.getAttribute("data-id"))];
      if (u) UI.showToast("Opening " + u.name + "’s profile", "info");
    },
    resetUser: function (el) {
      var u = state.users[Number(el.getAttribute("data-id"))];
      if (u) UI.showToast("Password reset link sent to " + u.email, "info");
    },
    toggleUser: function (el) {
      var u = state.users[Number(el.getAttribute("data-id"))];
      if (!u) return;
      var wasSuspended = u.status === "Suspended";
      u.status = wasSuspended ? "Active" : "Suspended";
      renderUserResults();
      UI.showToast(wasSuspended ? u.name + " reinstated" : u.name + " suspended", wasSuspended ? "success" : "danger");
    },

    openInvite: function (el) {
      state.invite = { name: "", email: "", role: el.getAttribute("data-role") || "Admin", tenant: "Senja Coffee" };
      state.overlay = "invite";
      setNavOpen(false);
      renderOverlay();
    },
    inviteName: function (el) { state.invite.name = el.value; },
    inviteEmail: function (el) { state.invite.email = el.value; },
    inviteRole: function (el) {
      state.invite.role = el.value;
      document.getElementById("inviteTenantField").hidden = el.value !== "Client staff";
    },
    inviteTenant: function (el) { state.invite.tenant = el.value; },
    sendInvite: function () {
      var inv = state.invite;
      var name = inv.name.trim();
      var email = inv.email.trim();
      if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
        document.getElementById("inviteError").hidden = false;
        return;
      }
      state.users.unshift({
        name: name,
        email: email,
        role: inv.role,
        tenant: inv.role === "Client staff" ? inv.tenant : "—",
        last: "Never",
        status: "Pending"
      });
      state.overlay = null;
      state.screen = "user";
      state.userSearch = "";
      state.roleFilter = "All";
      state.statusFilter = "All";
      render();
      UI.showToast("Invite sent to " + email);
    },

    closeOverlay: function (el, event) {
      if (el.classList.contains("modal-scrim") && event.target !== el) return;
      state.overlay = null;
      renderOverlay();
    },
    suspendTarget: function (el) { state.suspendTarget = el.value; },
    askSuspend: function () { state.overlay = "suspend"; renderOverlay(); },
    confirmSuspend: function () {
      state.clientStatus[state.suspendTarget] = "Suspended";
      state.overlay = null;
      renderOverlay();
      UI.showToast(state.suspendTarget + " suspended", "danger");
    },
    saveSettings: function () { UI.showToast("Platform settings saved"); },
    replaceLogo: function () { UI.showToast("Logo upload opens here in the live system", "info"); },
    editTemplate: function (el) { UI.showToast("Editing “" + el.getAttribute("data-name") + "” template", "info"); },

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
