/* Customer app - flows: Scan and Pay (card type decides the branch) and Buy a card.
   Contract used by customer.js: scan(ctx), overlay(ctx), createActions(api).
   Balance is only ever changed by the simulated platform step, never by the amount typed on the phone.
   Requires ui.js and customer-data.js. Exposes a single global: CustomerFlows */

(function () {
  "use strict";

  var esc = UI.escapeHtml;
  var timer = null;

  function tenant(key) {
    return CustomerData.TENANTS[key];
  }

  function findCard(state, id) {
    return state.cards.filter(function (c) { return String(c.id) === String(id); })[0];
  }

  function movementId() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function checkIcon() {
    return UI.icon("check", 30, 2.4);
  }

  /* ---------- Scan screen ---------- */

  function scan() {
    var targets = CustomerData.SCAN_TARGETS.map(function (t, i) {
      var tn = tenant(t.client);
      return (
        '<button type="button" class="scan-target" data-action="scanTarget" data-index="' + i + '">' +
        '<span class="brand-mark" style="--size:32px;--mark:' + tn.brand + ';border-radius:8px">' + esc(tn.name.charAt(0)) + "</span>" +
        '<span style="flex:1;min-width:0"><span style="display:block;font-weight:600;font-size:13px">' + esc(t.label) + '</span><span style="font-size:12px;color:#A59DB5">' +
        esc(t.sub) + '</span></span><span style="color:#A59DB5">' + UI.icon("chevronRight", 18) + "</span></button>"
      );
    }).join("");

    return (
      '<section class="scan-screen" aria-label="Scan and Pay">' +
      '<div class="scan-head"><span>Scan and Pay</span><button type="button" class="dark-icon-btn" data-action="torch" aria-label="Torch">&#9889;</button></div>' +
      '<div class="scan-body">' +
      '<div class="scan-frame" aria-hidden="true"><span class="scan-corner tl"></span><span class="scan-corner tr"></span><span class="scan-corner bl"></span><span class="scan-corner br"></span><span class="scan-line"></span></div>' +
      '<div style="text-align:center;color:#A59DB5">Point at the merchant’s payment QR. Your matching cards appear automatically.</div>' +
      '<div class="stack" style="--gap:8px;width:100%">' +
      '<div class="eyebrow" style="text-align:center;font-size:11px">Prototype · simulate a scan</div>' + targets + "</div>" +
      "</div></section>"
    );
  }

  /* ---------- Pay sheet ---------- */

  function payNumbers(state) {
    var p = state.pay;
    var card = findCard(state, p.cardId);
    var amount = parseFloat(p.amount) || 0;
    var short = !!card && amount > card.balance;
    return { card: card, amount: amount, short: short, after: card ? card.balance - amount : 0 };
  }

  function payAmountExtras(state) {
    var p = state.pay;
    var n = payNumbers(state);
    var t = tenant(p.target.client);
    var html = "";
    if (n.short) {
      var topUp = Math.ceil(-n.after / 10) * 10;
      html += '<div class="warn-box">' + (n.card.type === "open"
        ? "This Open Value card can be topped up through " + esc(t.name) + "’s gateway, then the payment retries."
        : "Fixed Value cards cannot be topped up. Pay the difference at the counter or use another card.") + "</div>";
      if (n.card.type === "open") {
        html += '<button type="button" class="btn btn-gold btn-app" data-action="payTopUp">Top up ' + UI.formatRM(topUp) + " via " + esc(t.gateway) + "</button>";
      }
    } else if (n.amount > 0) {
      html += '<button type="button" class="btn btn-app" style="background:' + t.brand + ';color:#fff" data-action="payConfirm">Pay ' + UI.formatRM(n.amount) + "</button>";
    }
    return html;
  }

  function afterLabel(state) {
    var n = payNumbers(state);
    if (!n.card) return "";
    return n.short ? "Short by " + UI.formatRM(-n.after) : UI.formatRM(n.after);
  }

  function paySheet(ctx) {
    var s = ctx.state;
    var p = s.pay;
    var t = tenant(p.target.client);
    var qrLabel = p.qrAmount != null ? "Amount QR · " + UI.formatRM(p.qrAmount) + " requested" : "Static QR · enter the amount";
    var card = findCard(s, p.cardId);
    var body = "";

    if (p.step === "pick") {
      var matching = s.cards.filter(function (c) { return c.client === t.key && c.status === "active"; });
      body = '<div class="section-title">' + (matching.length ? "Pay with which card?" : "No matching card") + "</div>";
      if (!matching.length) {
        body += '<div class="soft-panel muted" style="padding:20px;text-align:center">You don’t hold a ' + esc(t.name) + ' card yet.' +
          '<button type="button" class="btn btn-primary" style="display:flex;margin:14px auto 0;border-radius:12px;padding:12px 18px" data-action="buyForClient">Buy one now</button></div>';
      }
      body += matching.map(function (c) {
        var view = CustomerData.cardView(c);
        return (
          '<button type="button" class="choice-btn" data-action="payPick" data-id="' + c.id + '">' +
          '<span class="choice-thumb">' + UI.renderGiftCard(view, { noBack: true, flat: true }) + "</span>" +
          '<span style="flex:1;min-width:0"><span style="display:block;font-weight:600">' + esc(c.name) + '</span><span class="caption">' +
          esc(UI.typeLabelLong(c.type)) + " · " + esc(view.balanceLabel) + "</span></span>" +
          '<span class="muted">' + UI.icon("chevronRight", 18) + "</span></button>"
        );
      }).join("");
    } else if (p.step === "amount" && card) {
      body =
        '<div style="width:62%;align-self:center">' + UI.renderGiftCard(CustomerData.cardView(card), { noBack: true }) + "</div>" +
        '<label class="field">' + (p.qrAmount != null ? "Amount from the counter" : "Amount to pay") +
        '<span class="input-group amount-input" id="payAmountGroup"><span class="affix">RM</span><input id="payAmountInput" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" data-input="payAmount" value="' +
        esc(p.amount) + '"' + (p.qrAmount != null ? " readonly" : "") + "></span></label>" +
        '<div class="spread" style="font-size:13px"><span class="muted">Card balance</span><strong>' + UI.formatRM(card.balance) + "</strong></div>" +
        '<div class="spread" style="font-size:13px"><span class="muted">After payment</span><strong id="payAfter">' + esc(afterLabel(s)) + "</strong></div>" +
        '<div class="stack" style="--gap:12px" id="payExtras">' + payAmountExtras(s) + "</div>" +
        '<div class="caption" style="text-align:center">Balance is checked and written by the platform, never on this phone.</div>';
    } else if (p.step === "voucher" && card) {
      body =
        '<div style="width:62%;align-self:center">' + UI.renderGiftCard(CustomerData.cardView(card), { noBack: true }) + "</div>" +
        '<div style="text-align:center"><div class="section-title">' + esc(card.item) + '</div><div class="muted" style="margin-top:4px">One redemption. Show this screen to staff, then confirm.</div></div>' +
        '<button type="button" class="btn btn-app" style="background:' + t.brand + ';color:#fff;padding:16px;font-size:15px" data-action="payRedeem">Redeem now</button>';
    } else if (p.step === "processing") {
      body = '<div class="center-stack" style="padding:40px 12px"><span class="spinner"></span><div class="muted">Locking card · checking balance…</div></div>';
    } else if ((p.step === "success" || p.step === "redeemed") && card) {
      var redeemed = p.step === "redeemed";
      body =
        '<div class="center-stack anim-pop" style="padding-top:12px">' +
        '<div class="success-icon">' + checkIcon() + "</div>" +
        '<div class="section-title" style="font-size:24px">' + (redeemed ? "Redeemed" : "Paid") + "</div>" +
        '<div class="muted">' + (redeemed ? esc(card.item) + " · enjoy" : UI.formatRM(p.paid) + " to " + esc(t.name)) + "</div>" +
        (redeemed ? "" :
          '<div class="soft-panel" style="padding:16px 24px;min-width:220px"><div class="stat-label">Remaining balance</div>' +
          '<div class="display" id="payBalance" style="font-size:36px;line-height:1.1;margin-top:4px;font-variant-numeric:tabular-nums">' + UI.formatRM(p.from) + "</div>" +
          '<div class="mono caption" style="letter-spacing:.12em;margin-top:6px">' + esc(card.number) + "</div></div>") +
        '<div class="caption">' + esc(t.name) + " has been notified · movement #MV-" + esc(p.movementId) + "</div>" +
        '<button type="button" class="btn btn-primary" style="border-radius:12px;padding:12px 20px" data-action="payDone">Done</button></div>';
    }

    return (
      '<div class="sheet-scrim">' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-label="Pay at ' + esc(t.name) + '">' +
      '<div class="row" style="--gap:12px"><span class="brand-mark" style="--size:40px;--mark:' + t.brand + ';border-radius:12px">' + esc(t.name.charAt(0)) + "</span>" +
      '<div style="flex:1;min-width:0"><div style="font-weight:600">' + esc(t.name) + '</div><div class="caption">' + esc(qrLabel) + "</div></div>" +
      '<button type="button" class="icon-btn" data-action="closeFlow" aria-label="Close">&times;</button></div>' +
      body +
      "</div></div>"
    );
  }

  function updatePayAmountUI(state) {
    var after = document.getElementById("payAfter");
    var extras = document.getElementById("payExtras");
    var group = document.getElementById("payAmountGroup");
    if (after) {
      after.textContent = afterLabel(state);
      after.style.color = payNumbers(state).short ? "var(--warning)" : "";
    }
    if (group) group.style.borderColor = payNumbers(state).short ? "var(--warning)" : "";
    if (extras) extras.innerHTML = payAmountExtras(state);
  }

  /* ---------- Buy flow ---------- */

  function buyDesign(state) {
    var b = state.buy;
    return b.client && b.designIndex != null ? tenant(b.client).designs[b.designIndex] : null;
  }

  function buyUnitAmount(state) {
    var d = buyDesign(state);
    if (!d) return 0;
    if (d.type === "fixed") return state.buy.denom;
    if (d.type === "open") return parseFloat(state.buy.amount) || 0;
    return d.price;
  }

  function buyPreviewCard(state) {
    var d = buyDesign(state);
    return CustomerData.designCard(state.buy.client, d, d.type === "voucher" ? d.item : UI.formatRM(buyUnitAmount(state)), "•••• •••• •••• NEW");
  }

  function buyScreen(ctx) {
    var s = ctx.state;
    var b = s.buy;
    var steps = ["client", "design", "amount", "paying", "done"];
    var t = b.client ? tenant(b.client) : null;
    var d = buyDesign(s);
    var title = { client: "Buy a card", design: t ? t.name : "", amount: d ? d.name : "", paying: "Paying", done: "Done" }[b.step];
    var dots = [0, 1, 2].map(function (i) {
      return '<span class="' + (steps.indexOf(b.step) >= i ? "is-on" : "") + '"></span>';
    }).join("");
    var body = "";

    if (b.step === "client") {
      body = Object.keys(CustomerData.TENANTS).map(function (key) {
        var tn = tenant(key);
        return (
          '<button type="button" class="choice-btn" style="padding:14px;gap:14px" data-action="buyClient" data-client="' + key + '">' +
          '<span class="brand-mark" style="--size:44px;--mark:' + tn.brand + ';border-radius:12px">' + esc(tn.name.charAt(0)) + "</span>" +
          '<span style="flex:1;min-width:0"><span style="display:block;font-weight:600">' + esc(tn.name) + '</span><span class="caption">' + esc(tn.business) + " · " +
          tn.designs.length + ' designs</span></span><span class="muted">' + UI.icon("chevronRight", 18) + "</span></button>"
        );
      }).join("");
    } else if (b.step === "design") {
      body = t.designs.map(function (design, i) {
        var label = design.type === "fixed" ? "RM 50 · 100 · 200" : design.type === "open" ? "RM 10 – 1,000" : design.item;
        return (
          "<div>" + UI.renderGiftCard(CustomerData.designCard(b.client, design, label), { action: "buyDesign", id: i, noBack: true, ariaLabel: "Choose " + design.name }) +
          '<div class="spread caption" style="margin-top:8px"><span>' + esc(UI.typeLabelLong(design.type)) + "</span><span>" +
          (design.type === "voucher" ? UI.formatRM(design.price) : "Valid " + esc(design.validity)) + "</span></div></div>"
        );
      }).join("");
    } else if (b.step === "amount") {
      var typeBlock;
      if (d.type === "fixed") {
        typeBlock = '<div class="stat-label">Denomination</div><div class="denom-row">' +
          [50, 100, 200].map(function (v) {
            return '<button type="button" class="chip' + (b.denom === v ? " is-active" : "") + '" data-action="buyDenom" data-value="' + v + '">RM ' + v + "</button>";
          }).join("") + "</div>";
      } else if (d.type === "open") {
        typeBlock = '<label class="field">Amount · RM 10 to RM 1,000<span class="input-group amount-input"><span class="affix">RM</span>' +
          '<input id="buyAmountInput" type="number" min="10" max="1000" step="1" inputmode="decimal" data-input="buyAmount" value="' + esc(b.amount) + '"></span></label>';
      } else {
        typeBlock = '<div class="soft-panel spread" style="padding:14px 16px"><div><div style="font-weight:600">' + esc(d.item) + '</div><div class="caption">Single redemption · valid ' +
          esc(d.validity) + '</div></div><div class="display" style="font-size:20px">' + UI.formatRM(d.price) + "</div></div>";
      }
      body =
        '<div style="width:70%;align-self:center" id="buyPreview">' + UI.renderGiftCard(buyPreviewCard(s), { noBack: true }) + "</div>" +
        typeBlock +
        '<div class="soft-panel spread" style="padding:10px 14px"><span style="font-weight:600">Quantity</span><div class="qty">' +
        '<button type="button" data-action="buyQty" data-delta="-1" aria-label="Fewer">−</button><output aria-live="polite">' + b.qty + "</output>" +
        '<button type="button" data-action="buyQty" data-delta="1" aria-label="More">+</button></div></div>' +
        '<div class="spread" style="font-size:13px;padding:0 4px"><span class="muted">Pay with ' + esc(t.gateway) + '</span><strong id="buyTotal">' + UI.formatRM(buyUnitAmount(s) * b.qty) + "</strong></div>" +
        '<div class="form-error" id="buyError"' + (b.error ? "" : " hidden") + ">Amount must be between RM 10 and RM 1,000.</div>" +
        '<button type="button" class="btn btn-app" style="background:' + t.brand + ';color:#fff;padding:16px;font-size:15px" data-action="buyPay" id="buyPayBtn">Pay ' + UI.formatRM(buyUnitAmount(s) * b.qty) + "</button>";
    } else if (b.step === "paying") {
      body = '<div class="center-stack" style="padding:60px 12px"><span class="spinner"></span><div class="muted">Waiting for ' + esc(t.gateway) + "…</div></div>";
    } else if (b.step === "done") {
      body =
        '<div class="center-stack anim-pop" style="padding:20px 8px">' +
        '<div class="success-icon">' + checkIcon() + "</div>" +
        '<div class="section-title" style="font-size:24px">It’s in your wallet</div>' +
        '<div class="muted">' + (b.qty > 1 ? b.qty + " × " : "") + esc(d.name) + " from " + esc(t.name) + " · paid " + UI.formatRM(b.total) + " via " + esc(t.gateway) + "</div>" +
        '<div class="anim-slide" style="width:80%;margin-top:8px">' + UI.renderGiftCard(buyPreviewCard(s), { noBack: true }) + "</div>" +
        '<div class="row-wrap" style="--gap:10px;justify-content:center;margin-top:8px">' +
        '<button type="button" class="btn btn-outline" style="border-radius:12px;padding:12px 18px" data-action="buyToSend">Send as gift</button>' +
        '<button type="button" class="btn btn-primary" style="border-radius:12px;padding:12px 18px" data-action="buyClose">Open wallet</button></div></div>';
    }

    var backable = b.step === "client" || b.step === "design" || b.step === "amount";

    return (
      '<section class="fullscreen" aria-label="Buy a card">' +
      '<div class="fullscreen-head">' +
      (backable ? '<button type="button" class="back-btn" data-action="buyBack" aria-label="Back">' + UI.icon("arrowLeft", 18, 2) + "</button>" : "") +
      "<h1>" + esc(title) + '</h1><div class="dots" aria-hidden="true">' + dots + "</div></div>" +
      '<div class="fullscreen-body">' + body + "</div></section>"
    );
  }

  function updateBuyUI(state) {
    var total = UI.formatRM(buyUnitAmount(state) * state.buy.qty);
    var totalEl = document.getElementById("buyTotal");
    var btn = document.getElementById("buyPayBtn");
    var preview = document.getElementById("buyPreview");
    var error = document.getElementById("buyError");
    if (totalEl) totalEl.textContent = total;
    if (btn) btn.textContent = "Pay " + total;
    if (preview) preview.innerHTML = UI.renderGiftCard(buyPreviewCard(state), { noBack: true });
    if (error) error.hidden = !state.buy.error;
  }

  /* ---------- Shop tab ---------- */

  var SHOP_FILTERS = ["All", "senja", "lumi", "page"];

  function shop(ctx) {
    var s = ctx.state;
    var chips = SHOP_FILTERS.map(function (key) {
      var label = key === "All" ? "All" : tenant(key).name;
      return '<button type="button" class="chip' + (s.shopFilter === key ? " is-active" : "") + '" data-action="shopFilter" data-filter="' + key + '">' + esc(label) + "</button>";
    }).join("");

    var keys = Object.keys(CustomerData.TENANTS).filter(function (key) { return s.shopFilter === "All" || s.shopFilter === key; });

    var sections = keys.map(function (key) {
      var tn = tenant(key);
      var designs = tn.designs.map(function (design, i) {
        var label = design.type === "fixed" ? "RM 50 · 100 · 200" : design.type === "open" ? "RM 10 – 1,000" : design.item;
        return (
          "<div>" + UI.renderGiftCard(CustomerData.designCard(key, design, label), { action: "shopDesign", id: key + ":" + i, noBack: true, ariaLabel: "Buy " + design.name + " from " + tn.name }) +
          '<div class="spread caption" style="margin-top:8px"><span>' + esc(UI.typeLabelLong(design.type)) + "</span><span>" +
          (design.type === "voucher" ? UI.formatRM(design.price) : "Valid " + esc(design.validity)) + "</span></div></div>"
        );
      }).join("");
      return (
        '<section class="stack" style="--gap:12px" aria-label="' + esc(tn.name) + '">' +
        '<div class="row" style="--gap:12px"><span class="brand-mark" style="--size:40px;--mark:' + tn.brand + ';border-radius:12px">' + esc(tn.name.charAt(0)) + "</span>" +
        '<div style="flex:1;min-width:0"><div style="font-weight:600">' + esc(tn.name) + '</div><div class="caption">' + esc(tn.business) + " · pay with " + esc(tn.gateway) + "</div></div></div>" +
        '<div class="stack" style="--gap:14px">' + designs + "</div></section>"
      );
    }).join("");

    return (
      '<div class="stack" style="--gap:18px">' +
      '<div class="spread" style="align-items:flex-end"><h1 class="app-title">Shop</h1><span class="caption">3 merchants · tap a card to buy</span></div>' +
      '<div class="chip-scroll" role="toolbar" aria-label="Filter by merchant">' + chips + "</div>" +
      sections +
      "</div>"
    );
  }

  /* ---------- Contract ---------- */

  function overlay(ctx) {
    if (ctx.state.overlay === "pay" && ctx.state.pay) return paySheet(ctx);
    if (ctx.state.overlay === "buy" && ctx.state.buy) return buyScreen(ctx);
    return "";
  }

  function createActions(api) {
    var state = api.state;

    function after(ms, kind, fn) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (state.overlay !== kind) return;
        fn();
      }, ms);
    }

    function openBuy(clientKey) {
      state.buy = { step: clientKey ? "design" : "client", client: clientKey || null, designIndex: null, denom: 100, amount: "50", qty: 1, error: false, total: 0, newId: null };
      state.overlay = "buy";
      api.renderOverlay();
    }

    function focusInput(id) {
      var el = document.getElementById(id);
      if (el && !el.readOnly) el.focus();
    }

    return {
      torch: function () { UI.showToast("Torch on", "info"); },

      scanTarget: function (el) {
        var target = CustomerData.SCAN_TARGETS[Number(el.getAttribute("data-index"))];
        state.pay = { target: target, step: "pick", cardId: null, amount: "", qrAmount: target.amount, movementId: "", from: 0, to: 0, paid: 0 };
        state.overlay = "pay";
        api.renderOverlay();
      },
      payPick: function (el) {
        var card = findCard(state, el.getAttribute("data-id"));
        if (!card) return;
        state.pay.cardId = card.id;
        state.pay.step = card.type === "voucher" ? "voucher" : "amount";
        state.pay.amount = state.pay.qrAmount != null ? String(state.pay.qrAmount) : "";
        api.renderOverlay();
        focusInput("payAmountInput");
      },
      payAmount: function (el) {
        state.pay.amount = el.value;
        updatePayAmountUI(state);
      },
      payConfirm: function () {
        var n = payNumbers(state);
        if (!n.card || n.short || n.amount <= 0) return;
        state.pay.step = "processing";
        api.renderOverlay();
        after(1100, "pay", function () {
          var card = findCard(state, state.pay.cardId);
          var from = card.balance;
          var to = Math.max(0, Math.round((from - n.amount) * 100) / 100);
          card.balance = to;
          if (to === 0) card.status = "exhausted";
          state.history.unshift({
            kind: "spend", client: card.client, title: "Paid at " + tenant(card.client).name,
            sub: card.name + " · " + (card.type === "fixed" ? "Fixed" : "Open"), amount: "− " + UI.formatRM(n.amount), date: "15 Sep"
          });
          state.pay.step = "success";
          state.pay.movementId = movementId();
          state.pay.from = from;
          state.pay.to = to;
          state.pay.paid = n.amount;
          api.renderOverlay();
          UI.animateBalance(document.getElementById("payBalance"), from, to, 400);
        });
      },
      payTopUp: function () {
        var n = payNumbers(state);
        if (!n.card || n.card.type !== "open") return;
        var add = Math.ceil(-n.after / 10) * 10;
        var gateway = tenant(n.card.client).gateway;
        state.pay.step = "processing";
        api.renderOverlay();
        after(1500, "pay", function () {
          var card = findCard(state, state.pay.cardId);
          var from = card.balance + add;
          var to = Math.max(0, Math.round((from - n.amount) * 100) / 100);
          card.balance = to;
          state.history.unshift(
            { kind: "spend", client: card.client, title: "Paid at " + tenant(card.client).name, sub: card.name + " · Open", amount: "− " + UI.formatRM(n.amount), date: "15 Sep" },
            { kind: "purchase", client: card.client, title: "Top-up " + card.name, sub: gateway, amount: UI.formatRM(add), date: "15 Sep" }
          );
          state.pay.step = "success";
          state.pay.movementId = movementId();
          state.pay.from = from;
          state.pay.to = to;
          state.pay.paid = n.amount;
          api.renderOverlay();
          UI.animateBalance(document.getElementById("payBalance"), from, to, 400);
          UI.showToast("Topped up " + UI.formatRM(add) + " via " + gateway, "info");
        });
      },
      payRedeem: function () {
        state.pay.step = "processing";
        api.renderOverlay();
        after(1100, "pay", function () {
          var card = findCard(state, state.pay.cardId);
          card.status = "redeemed";
          card.balance = 0;
          state.history.unshift({ kind: "redeem", client: card.client, title: "Redeemed " + card.name, sub: card.item, amount: "Voucher", date: "15 Sep" });
          state.pay.step = "redeemed";
          state.pay.movementId = movementId();
          api.renderOverlay();
        });
      },
      payDone: function () {
        var cardId = state.pay ? state.pay.cardId : null;
        clearTimeout(timer);
        state.overlay = null;
        state.pay = null;
        state.filter = "All";
        api.goTab("wallet");
        state.flipped = cardId;
        api.renderMain();
      },
      buyForClient: function () {
        var clientKey = state.pay.target.client;
        state.pay = null;
        openBuy(clientKey);
      },
      closeFlow: function () {
        clearTimeout(timer);
        state.overlay = null;
        state.pay = null;
        state.buy = null;
        api.renderOverlay();
      },

      startBuy: function () { openBuy(null); },
      shopFilter: function (el) {
        state.shopFilter = el.getAttribute("data-filter");
        api.renderMain();
      },
      shopDesign: function (el) {
        var parts = String(el.getAttribute("data-id")).split(":");
        openBuy(parts[0]);
        state.buy.designIndex = Number(parts[1]);
        state.buy.step = "amount";
        state.buy.fromShop = true;
        api.renderOverlay();
      },
      buyClient: function (el) {
        state.buy.client = el.getAttribute("data-client");
        state.buy.step = "design";
        api.renderOverlay();
      },
      buyDesign: function (el) {
        state.buy.designIndex = Number(el.getAttribute("data-id"));
        state.buy.step = "amount";
        state.buy.error = false;
        api.renderOverlay();
      },
      buyDenom: function (el) {
        state.buy.denom = Number(el.getAttribute("data-value"));
        api.renderOverlay();
      },
      buyAmount: function (el) {
        state.buy.amount = el.value;
        state.buy.error = false;
        updateBuyUI(state);
      },
      buyQty: function (el) {
        var next = state.buy.qty + Number(el.getAttribute("data-delta"));
        state.buy.qty = Math.min(10, Math.max(1, next));
        api.renderOverlay();
      },
      buyBack: function () {
        var b = state.buy;
        if (b.step === "amount" && !b.fromShop) b.step = "design";
        else if (b.step === "design") b.step = "client";
        else {
          state.overlay = null;
          state.buy = null;
        }
        api.renderOverlay();
      },
      buyPay: function () {
        var d = buyDesign(state);
        var unit = buyUnitAmount(state);
        if (d.type === "open" && (unit < 10 || unit > 1000)) {
          state.buy.error = true;
          updateBuyUI(state);
          return;
        }
        state.buy.total = unit * state.buy.qty;
        state.buy.step = "paying";
        api.renderOverlay();
        after(1400, "buy", function () {
          var b = state.buy;
          var base = Date.now();
          var created = [];
          for (var i = 0; i < b.qty; i++) {
            var id = base + i;
            var tail = String(id);
            created.push({
              id: id, client: b.client, name: d.name, type: d.type, item: d.item,
              balance: d.type === "voucher" ? 1 : unit,
              number: (5500 + i) + " " + tail.slice(-4) + " " + tail.slice(-8, -4) + " " + (1000 + i * 7),
              expiry: "Sep 2027", status: "active"
            });
          }
          state.cards = created.concat(state.cards);
          state.history.unshift({
            kind: "purchase", client: b.client, title: "Bought " + d.name + (b.qty > 1 ? " × " + b.qty : ""),
            sub: tenant(b.client).gateway, amount: UI.formatRM(b.total), date: "15 Sep"
          });
          b.newId = base;
          b.step = "done";
          api.renderOverlay();
        });
      },
      buyToSend: function () {
        var id = state.buy.newId;
        state.overlay = null;
        state.buy = null;
        state.send = api.blankSend();
        state.send.step = "details";
        state.send.cardId = id;
        api.goTab("gifts");
      },
      buyClose: function () {
        var id = state.buy.newId;
        state.overlay = null;
        state.buy = null;
        state.filter = "All";
        state.newId = id;
        api.goTab("wallet");
      }
    };
  }

  window.CustomerFlows = {
    shop: shop,
    scan: scan,
    overlay: overlay,
    createActions: createActions
  };
})();
