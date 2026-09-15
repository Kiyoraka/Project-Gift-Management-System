/* Client Console - screen renderers (Main, Analysis, Customer List, Setting).
   Each renderer takes a context { state, tenant, designs, gateways, notifs, session } and returns HTML.
   Requires ui.js and client-data.js. Exposes a single global: ClientScreens */

(function () {
  "use strict";

  var esc = UI.escapeHtml;

  var SALES_PATH = "M0 120 L43 108 L86 114 L129 96 L172 100 L215 84 L258 92 L301 70 L344 78 L387 58 L430 66 L473 44 L516 52 L560 30";

  /* ---------- Shared bits ---------- */

  function pageHead(title, sub, rightHtml) {
    return (
      '<div class="page-head"><div><h1 class="page-title">' + esc(title) + "</h1>" +
      (sub ? '<div class="muted" style="margin-top:6px">' + sub + "</div>" : "") + "</div>" + (rightHtml || "") + "</div>"
    );
  }

  function qrButton(extraClass) {
    return (
      '<button type="button" class="btn btn-brand' + (extraClass ? " " + extraClass : "") + '" data-action="openQr">' +
      UI.icon("qr", 16) + "<span>Show Payment QR</span></button>"
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
    var names = ["Fixed Value", "Open Value", "Voucher"];
    return (
      '<div class="donut-wrap">' +
      '<svg viewBox="0 0 120 120" width="140" height="140" style="flex-shrink:0" role="img" aria-label="Card type split">' +
      '<circle cx="60" cy="60" r="46" fill="none" stroke="#F1EDF6" stroke-width="18"/>' + arcs +
      '<text x="60" y="57" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="20" fill="#1F1B2A">' + esc(total) + "</text>" +
      '<text x="60" y="73" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="10" fill="#6B647A">' + esc(caption) + "</text></svg>" +
      '<div class="legend">' +
      split.map(function (p, i) {
        return '<div class="legend-item"><span class="swatch" style="background:' + colors[i] + '"></span><span class="muted">' + names[i] +
          "</span><strong>" + Math.round(p * 100) + "%</strong></div>";
      }).join("") +
      "</div></div>"
    );
  }

  function firstName(ctx) {
    return String(ctx.session.name || ctx.tenant.staffFirst).split(" ")[0];
  }

  /* ---------- Main ---------- */

  function main(ctx) {
    var t = ctx.tenant;
    var stats = [
      { label: "Cards sold today", value: t.stats[0], delta: "+3 vs yesterday", tone: "pill-success", spark: "0,30 16,26 32,28 48,18 64,20 80,8" },
      { label: "Revenue this month", value: t.stats[1], delta: "+12.4%", tone: "pill-success", spark: "0,34 16,28 32,30 48,22 64,18 80,10" },
      { label: "Outstanding gift balance", value: t.stats[2], delta: "Liability", tone: "pill-neutral", spark: "0,20 16,22 32,18 48,20 64,16 80,14" },
      { label: "Redemptions today", value: t.stats[3], delta: "2 vouchers", tone: "pill-primary", spark: "0,30 16,24 32,26 48,16 64,20 80,12" }
    ];

    var tiles = stats.map(function (s) {
      return (
        '<div class="stat-tile"><div><div class="stat-label">' + esc(s.label) + '</div><div class="stat-value">' + esc(s.value) +
        '</div><span class="delta ' + s.tone + '">' + esc(s.delta) + "</span></div>" + UI.sparkline(s.spark) + "</div>"
      );
    }).join("");

    var transactions = ClientData.transactionsFor(t, ctx.designs).map(function (tx) {
      return (
        '<div class="list-row"><span class="avatar" style="background:' + tx.bg + ";color:" + tx.fg + '">' + esc(UI.initials(tx.name)) + "</span>" +
        '<div class="grow"><div class="row-title">' + esc(tx.name) + '</div><div class="row-sub">' + esc(tx.detail) + "</div></div>" +
        '<div style="text-align:right"><div class="row-title" style="white-space:nowrap">' + esc(tx.amount) + '</div><div class="caption" style="font-size:11px">' + esc(tx.when) + "</div></div></div>"
      );
    }).join("");

    var published = ctx.designs
      .map(function (d, i) { return { design: d, index: i }; })
      .filter(function (item) { return item.design.status === "Active"; });

    var catalogue = published.map(function (item) {
      var card = ClientData.cardFromDesign(t, item.design, item.index);
      return (
        '<div style="flex:0 0 min(232px, 72vw)">' + UI.renderGiftCard(card) +
        '<div class="spread caption" style="margin-top:8px"><span>' + item.design.sold + " sold</span><span>" + esc(item.design.meta) + "</span></div></div>"
      );
    }).join("");

    var chart =
      '<svg class="line-chart" viewBox="0 0 560 160" role="img" aria-label="Sales over the last 14 days, trending up">' +
      '<path d="' + SALES_PATH + ' L560 150 L0 150Z" fill="#EEE4F7" opacity=".7"/>' +
      '<path d="' + SALES_PATH + '" fill="none" stroke="#5B2A86" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<circle cx="560" cy="30" r="4" fill="#5B2A86"/></svg>' +
      '<div class="axis-labels"><span>1 Sep</span><span>8 Sep</span><span>15 Sep</span></div>';

    return (
      '<div class="screen">' +
      pageHead("Main", "Good afternoon, " + esc(firstName(ctx)) + " · " + esc(UI.TODAY_LABEL), qrButton()) +
      '<div class="stat-grid">' + tiles + "</div>" +
      '<div class="panel-row">' +
      '<div class="panel" style="flex:1.4 1 400px"><div class="panel-head"><div class="panel-title">Sales · last 14 days</div><div class="caption">' + esc(t.salesTotal) + " total</div></div>" + chart + "</div>" +
      '<div class="panel" style="flex:1 1 300px"><div class="panel-head"><div class="panel-title">Latest transactions</div>' +
      '<a href="#customers" class="btn-link" data-action="go" data-screen="customers">All customers</a></div><div style="margin-top:6px">' + transactions + "</div></div>" +
      "</div>" +
      '<div class="panel"><div class="panel-head"><div class="panel-title">Card catalogue · ' + published.length + " published</div>" +
      '<a href="#designs" class="btn-link" data-action="goDesigns">Manage designs</a></div>' +
      '<div style="display:flex;gap:16px;overflow-x:auto;padding:14px 2px 6px">' + (catalogue || '<div class="empty-state">No published designs yet.</div>') + "</div></div>" +
      "</div>"
    );
  }

  /* ---------- Analysis ---------- */

  function analysis(ctx) {
    var s = ctx.state;
    var t = ctx.tenant;
    var values = ClientData.WEEK_VALUES[s.tab];
    var max = Math.max.apply(null, values);
    var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    var bars = values.map(function (v, i) {
      var label = s.tab === "Sales" ? "RM " + v.toLocaleString("en-MY") : String(v);
      return (
        '<div class="bar-col"><div class="bar-value">' + esc(label) + '</div><div class="bar" style="height:' + Math.round(v / max * 100) +
        "%;background:" + (i === 5 ? t.brand : "var(--primary)") + '"></div></div>'
      );
    }).join("");

    var tabs = Object.keys(ClientData.WEEK_VALUES).map(function (name) {
      return '<button type="button" class="tab' + (s.tab === name ? " is-active" : "") + '" data-action="setTab" data-tab="' + name + '">' + name + "</button>";
    }).join("");

    var ranges = Object.keys(ClientData.RANGE_LABELS).map(function (r) {
      return '<button type="button" class="chip' + (s.range === r ? " is-active" : "") + '" data-action="setRange" data-range="' + r + '">' + r + "</button>";
    }).join("");

    var rows = ClientData.performanceFor(t, ctx.designs).map(function (r) {
      return (
        '<tr><td><div class="user-cell"><span style="width:38px;height:24px;border-radius:5px;flex-shrink:0;background:' + r.art +
        ';border:1px solid var(--line)"></span><span style="font-weight:600">' + esc(r.name) + "</span></div></td>" +
        '<td><span class="type-tag">' + esc(r.typeLabel) + "</span></td>" +
        '<td class="num">' + r.sold + '</td><td class="num">' + r.redeemed + '</td><td class="num" style="font-weight:600">' + esc(r.outstanding) + "</td>" +
        '<td style="min-width:150px"><div class="row" style="--gap:8px"><div class="progress"><span style="width:' + r.pct + '%"></span></div>' +
        '<span class="caption" style="width:36px">' + r.pct + "%</span></div></td></tr>"
      );
    }).join("");

    return (
      '<div class="screen screen-tight">' +
      '<h1 class="page-title">Analysis</h1>' +
      '<div class="spread" style="flex-wrap:wrap;gap:16px"><div class="tabs" role="tablist">' + tabs + '</div><div class="row-wrap" style="--gap:8px">' + ranges + "</div></div>" +
      '<div class="panel-row">' +
      '<div class="panel" style="flex:2 1 400px"><div class="panel-head"><div class="panel-title">' + esc(ClientData.BAR_TITLES[s.tab]) +
      '</div><div class="caption">' + esc(ClientData.RANGE_LABELS[s.range]) + "</div></div>" +
      '<div class="bar-chart" style="--bars:7">' + bars + '</div><div class="bar-labels" style="--bars:7">' +
      days.map(function (d) { return "<div>" + d + "</div>"; }).join("") + "</div></div>" +
      '<div class="panel" style="flex:1 1 260px"><div class="panel-title">Card type split</div>' + donutSvg(t.split, t.sold, "cards sold") + "</div>" +
      "</div>" +
      '<div class="panel panel-flush"><div class="panel-head panel-head-bar"><div class="panel-title">Card Performance</div><div class="caption">Each design · lifetime</div></div>' +
      '<div class="table-wrap"><table class="table" style="min-width:640px"><thead><tr><th>Design</th><th>Type</th><th class="num">Sold</th><th class="num">Redeemed</th>' +
      '<th class="num">Outstanding balance</th><th>Redemption</th></tr></thead><tbody>' + rows + "</tbody></table></div></div>" +
      "</div>"
    );
  }

  /* ---------- Customer List ---------- */

  function filteredCustomers(ctx) {
    var q = ctx.state.custSearch.trim().toLowerCase();
    return ClientData.customersFor(ctx.tenant, ctx.designs).filter(function (c) {
      return (c.name + " " + c.phone).toLowerCase().indexOf(q) >= 0;
    });
  }

  function customerRows(ctx) {
    var list = filteredCustomers(ctx);
    if (!list.length) return '<tr><td colspan="6"><div class="empty-state">No customers match.</div></td></tr>';
    return list.map(function (c) {
      var open = ctx.state.expanded === c.name;
      var row =
        '<tr data-action="toggleCustomer" data-name="' + esc(c.name) + '" role="button" tabindex="0" aria-expanded="' + open + '" style="cursor:pointer' +
        (open ? ";background:var(--bg)" : "") + '">' +
        '<td><div class="user-cell"><span class="avatar">' + esc(UI.initials(c.name)) + '</span><span style="font-weight:600;white-space:nowrap">' + esc(c.name) + "</span></div></td>" +
        '<td class="mono muted" style="font-size:12px;white-space:nowrap">' + esc(c.phone) + "</td>" +
        "<td>" + c.cards.length + '</td><td style="font-weight:600;white-space:nowrap">' + esc(c.spent) + '</td><td class="muted" style="white-space:nowrap">' + esc(c.last) + "</td>" +
        '<td class="num"><span class="muted" style="display:inline-flex;transition:transform 150ms;transform:rotate(' + (open ? 180 : 0) + 'deg)">' + UI.icon("chevronDown", 16) + "</span></td></tr>";

      if (!open) return row;

      var cards = c.cards.map(function (k) {
        return '<div class="list-row" style="padding:8px 0"><span class="grow row-title">' + esc(k.name) + '</span><span class="muted" style="font-size:13px">' +
          esc(k.type) + '</span><span class="row-title" style="min-width:80px;text-align:right">' + esc(k.balance) + "</span></div>";
      }).join("");

      var history = c.history.map(function (h) {
        return '<div class="list-row" style="padding:8px 0;align-items:flex-start"><span class="muted" style="width:56px;flex-shrink:0;font-size:13px">' + esc(h.date) +
          '</span><span class="grow" style="font-size:13px">' + esc(h.what) + '</span><span class="row-title" style="white-space:nowrap;color:' + h.color + '">' + esc(h.amount) + "</span></div>";
      }).join("");

      return (
        row +
        '<tr style="background:var(--bg)"><td colspan="6" style="padding:6px 24px 20px">' +
        '<div class="row-wrap" style="--gap:24px;align-items:flex-start">' +
        '<div style="flex:1 1 240px;min-width:0"><div class="stat-label" style="margin-bottom:6px">Cards</div>' + cards + "</div>" +
        '<div style="flex:1.4 1 280px;min-width:0"><div class="stat-label" style="margin-bottom:6px">Transaction history</div>' + history + "</div>" +
        "</div></td></tr>"
      );
    }).join("");
  }

  function customers(ctx) {
    var count = ClientData.customersFor(ctx.tenant, ctx.designs).length;
    return (
      '<div class="screen screen-tight">' +
      pageHead("Customer List", count + " customers hold your cards", '<button type="button" class="btn btn-soft" data-action="exportCsv">Export CSV</button>') +
      '<input class="input input-plain" type="search" style="max-width:360px" placeholder="Search name or phone" aria-label="Search customers" data-input="custSearch" value="' +
      esc(ctx.state.custSearch) + '">' +
      '<div class="panel panel-flush"><div class="table-wrap"><table class="table" style="min-width:680px">' +
      '<thead><tr><th>Name</th><th>Phone</th><th>Cards held</th><th>Total spent</th><th>Last visit</th><th class="num"><span class="sr-only">Expand</span></th></tr></thead>' +
      '<tbody id="customerRows">' + customerRows(ctx) + "</tbody></table></div></div>" +
      "</div>"
    );
  }

  /* ---------- Setting (tabs filled in by the settings task) ---------- */

  function setting() {
    return '<div class="screen">' + pageHead("Setting", "") + '<div class="panel empty-state">Business settings are being prepared.</div></div>';
  }

  window.ClientScreens = {
    qrButton: qrButton,
    main: main,
    analysis: analysis,
    customers: customers,
    customerRows: customerRows,
    setting: setting
  };
})();
