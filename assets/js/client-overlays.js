/* Client Console - overlays: Payment QR popup and Add Gateway drawer.
   Contract used by client.js: render(ctx), afterRender(ctx, host), onOpen(ctx, kind), onClose(ctx), createActions(api).
   Requires ui.js and client-data.js. Exposes a single global: ClientOverlays */

(function () {
  "use strict";

  var esc = UI.escapeHtml;
  var QR_SECONDS = 300;

  var qr = { mode: "static", amount: "", generated: false, timeLeft: QR_SECONDS };
  var timer = null;

  /* ---------- Payment QR ---------- */

  function resetQr() {
    clearInterval(timer);
    timer = null;
    qr = { mode: "static", amount: "", generated: false, timeLeft: QR_SECONDS };
  }

  function amountValue() {
    return parseFloat(qr.amount) || 0;
  }

  function timerText() {
    if (qr.timeLeft <= 0) return "Expired · generate a new QR";
    var m = Math.floor(qr.timeLeft / 60);
    var s = String(qr.timeLeft % 60);
    return "Expires in " + m + ":" + (s.length < 2 ? "0" + s : s);
  }

  function timerClass() {
    return qr.timeLeft > 60 ? "pill pill-primary" : "pill pill-danger";
  }

  function updateTimerPill() {
    var pill = document.getElementById("qrTimer");
    if (!pill) return;
    pill.className = timerClass();
    pill.lastChild.textContent = timerText();
  }

  function startTimer() {
    clearInterval(timer);
    qr.timeLeft = QR_SECONDS;
    timer = setInterval(function () {
      qr.timeLeft = Math.max(0, qr.timeLeft - 1);
      updateTimerPill();
      if (qr.timeLeft <= 0) clearInterval(timer);
    }, 1000);
  }

  function qrHtml(ctx) {
    var t = ctx.tenant;
    var amountMode = qr.mode === "amount";
    var needsAmount = amountMode && !qr.generated;
    var body;

    if (needsAmount) {
      var quick = ClientData.QUICK_AMOUNTS.map(function (v) {
        return '<button type="button" class="chip" data-action="qrQuick" data-amount="' + v + '">RM ' + v + "</button>";
      }).join("");
      body =
        '<div class="stack" style="--gap:10px">' +
        '<label class="sr-only" for="qrAmountInput">Amount in ringgit</label>' +
        '<div class="input-group amount-input" style="background:var(--surface-2)"><span class="affix">RM</span>' +
        '<input id="qrAmountInput" type="number" min="1" step="0.01" inputmode="decimal" placeholder="0.00" data-input="qrAmount" value="' + esc(qr.amount) + '"></div>' +
        '<div class="row-wrap" style="--gap:8px">' + quick + "</div>" +
        '<button type="button" class="btn btn-brand btn-block" data-action="generateQr">Generate QR</button>' +
        "</div>";
    } else {
      var seed = t.key + (amountMode ? ":" + amountValue().toFixed(2) : ":static");
      var caption = amountMode ? "Pay " + UI.formatRM(amountValue()) + " · scan with the gift app" : "Scan with the gift app to pay";
      body =
        '<div style="position:relative;width:280px;max-width:100%;aspect-ratio:1;align-self:center;padding:12px;background:#fff;border-radius:16px;border:1px solid var(--line)">' +
        UI.qrSvg(seed, { size: 29, hole: true }) +
        '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:21%;aspect-ratio:1;border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center">' +
        '<span class="brand-mark" style="--size:80%;width:80%;height:80%;--mark:' + t.brand + ';border-radius:12px;font-size:24px">' + esc(t.name.charAt(0)) + "</span></div></div>" +
        '<div style="text-align:center"><div class="section-title">' + esc(t.name) + '</div><div class="muted" style="margin-top:4px">' + esc(caption) + "</div>" +
        (amountMode
          ? '<div style="margin-top:10px"><span id="qrTimer" class="' + timerClass() + '" style="padding:6px 12px;font-size:13px"><span class="dot"></span><span>' + timerText() + "</span></span></div>"
          : "") +
        "</div>" +
        '<div class="row-wrap" style="--gap:10px;justify-content:center">' +
        '<button type="button" class="btn btn-outline" data-action="copyQrLink">Copy link</button>' +
        '<button type="button" class="btn btn-outline" data-action="downloadQr">Download PNG</button>' +
        (amountMode ? '<button type="button" class="btn btn-outline" data-action="qrMode" data-mode="amount">New amount</button>' : "") +
        "</div>" +
        '<button type="button" class="btn-link" style="align-self:center;color:var(--ink-muted);font-weight:500;font-size:12px;text-decoration:underline dotted" data-action="simulateScan">Prototype: simulate a customer scan</button>';
    }

    return (
      '<div class="modal-scrim" data-action="closeOverlay">' +
      '<div class="modal" role="dialog" aria-modal="true" aria-label="Payment QR for ' + esc(t.name) + '">' +
      '<button type="button" class="icon-btn modal-close" data-action="closeOverlay" aria-label="Close">&times;</button>' +
      '<div class="segmented segmented-pill" style="align-self:center" role="tablist" aria-label="QR type">' +
      '<button type="button" role="tab" class="' + (amountMode ? "" : "is-active") + '" aria-selected="' + !amountMode + '" data-action="qrMode" data-mode="static">Static QR</button>' +
      '<button type="button" role="tab" class="' + (amountMode ? "is-active" : "") + '" aria-selected="' + amountMode + '" data-action="qrMode" data-mode="amount">Amount QR</button>' +
      "</div>" +
      body +
      "</div></div>"
    );
  }

  /* ---------- Add Gateway drawer ---------- */

  var gw = { provider: "DuitNow QR", isDefault: false, test: "idle" };
  var testTimer = null;

  function resetGateway() {
    clearTimeout(testTimer);
    testTimer = null;
    gw = { provider: "DuitNow QR", isDefault: false, test: "idle" };
  }

  function gatewayHtml(ctx) {
    var t = ctx.tenant;
    var providers = Object.keys(ClientData.PROVIDERS).map(function (name) {
      var p = ClientData.PROVIDERS[name];
      var selected = gw.provider === name;
      return (
        '<button type="button" data-action="gwProvider" data-provider="' + esc(name) + '" aria-pressed="' + selected + '" ' +
        'style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;text-align:left;background:var(--surface);border:1px solid ' +
        (selected ? "var(--primary);box-shadow:0 0 0 1px var(--primary)" : "var(--line)") + '">' +
        '<span class="brand-mark" style="--size:28px;--mark:' + p.bg + ';border-radius:8px;font-family:var(--font-body);font-size:11px">' + esc(p.logo) + "</span>" +
        '<span style="font-size:13px;font-weight:600">' + esc(name) + "</span></button>"
      );
    }).join("");

    var fields = ClientData.PROVIDERS[gw.provider].fields.map(function (f) {
      var placeholder = f[1].replace("{tenant}", t.name);
      return (
        '<label class="field">' + esc(f[0]) + '<input class="input mono" type="' + f[2] + '" autocomplete="off" placeholder="' + esc(placeholder) + '"></label>'
      );
    }).join("");

    var testBox;
    if (gw.test === "testing") {
      testBox = '<span class="spinner spinner-sm"></span><span class="muted" style="font-size:13px">Contacting ' + esc(gw.provider) + "…</span>";
    } else if (gw.test === "ok") {
      testBox = '<span class="avatar" style="--size:20px;background:var(--success);color:#fff">' + UI.icon("check", 12, 2.4) +
        '</span><span style="font-size:13px;font-weight:600;color:var(--success)">Connected · webhook verified · 312 ms</span>';
    } else {
      testBox = '<span class="muted" style="flex:1;font-size:13px">Run a test charge of RM 1.00 (refunded instantly).</span>' +
        '<button type="button" class="btn btn-outline btn-sm" data-action="gwTest">Test connection</button>';
    }

    var ok = gw.test === "ok";

    return (
      '<div class="overlay-scrim" data-action="closeOverlay"></div>' +
      '<div class="drawer" style="--drawer-width:460px" role="dialog" aria-modal="true" aria-labelledby="gatewayTitle">' +
      '<div class="drawer-head"><div class="drawer-title" id="gatewayTitle">Add Gateway</div>' +
      '<button type="button" class="icon-btn" data-action="closeOverlay" aria-label="Close">&times;</button></div>' +
      '<div class="drawer-body" style="gap:18px">' +
      '<div class="field">Provider<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px">' + providers + "</div></div>" +
      fields +
      '<label class="checkbox-row"><input type="checkbox" data-change="gwDefault"' + (gw.isDefault ? " checked" : "") + ">Make this the default gateway for card purchases</label>" +
      '<div role="status" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;border:1px solid ' +
      (ok ? "var(--success);background:var(--pill-success-bg)" : "var(--line);background:var(--bg)") + '">' + testBox + "</div>" +
      "</div>" +
      '<div class="drawer-foot"><button type="button" class="btn btn-outline" data-action="closeOverlay">Cancel</button>' +
      '<button type="button" class="btn ' + (ok ? "btn-primary" : "btn-soft") + '" data-action="saveGateway">' + (ok ? "Save gateway" : "Save as pending") + "</button></div>" +
      "</div>"
    );
  }

  /* ---------- Contract ---------- */

  function render(ctx) {
    if (ctx.state.overlay === "qr") return qrHtml(ctx);
    if (ctx.state.overlay === "gateway") return gatewayHtml(ctx);
    return "";
  }

  function afterRender(ctx, host) {
    var input = host.querySelector("#qrAmountInput");
    if (input) {
      input.focus();
      return;
    }
    var close = host.querySelector(".modal-close, .drawer .icon-btn");
    if (close) close.focus({ preventScroll: true });
  }

  function onOpen(ctx, kind) {
    if (kind === "qr") resetQr();
    if (kind === "gateway") resetGateway();
  }

  function onClose() {
    resetQr();
    resetGateway();
  }

  function createActions(api) {
    return {
      qrMode: function (el) {
        clearInterval(timer);
        qr.mode = el.getAttribute("data-mode");
        qr.generated = false;
        qr.timeLeft = QR_SECONDS;
        api.renderOverlay();
      },
      qrAmount: function (el) {
        qr.amount = el.value;
      },
      qrQuick: function (el) {
        qr.amount = el.getAttribute("data-amount");
        var input = document.getElementById("qrAmountInput");
        if (input) input.value = qr.amount;
      },
      generateQr: function () {
        if (!(amountValue() > 0)) {
          UI.showToast("Enter an amount first", "warning");
          var input = document.getElementById("qrAmountInput");
          if (input) input.focus();
          return;
        }
        qr.generated = true;
        startTimer();
        api.renderOverlay();
      },
      copyQrLink: function () {
        UI.showToast("Payment link copied", "info");
      },
      downloadQr: function () {
        UI.showToast(api.ctx().tenant.key + "-payment-qr.png downloading", "info");
      },
      simulateScan: function () {
        var d = ClientData.liveDesigns(api.ctx().designs);
        if (qr.mode === "amount") UI.showToast("Payment received · " + UI.formatRM(amountValue()) + " from Aisyah R.");
        else UI.showToast("Payment received · RM 18.00 from Aisyah R. · " + d.fixed.name);
      },

      gwProvider: function (el) {
        clearTimeout(testTimer);
        gw.provider = el.getAttribute("data-provider");
        gw.test = "idle";
        api.renderOverlay();
      },
      gwDefault: function (el) {
        gw.isDefault = el.checked;
      },
      gwTest: function () {
        gw.test = "testing";
        api.renderOverlay();
        clearTimeout(testTimer);
        testTimer = setTimeout(function () {
          if (api.state.overlay !== "gateway") return;
          gw.test = "ok";
          api.renderOverlay();
        }, 1400);
      },
      saveGateway: function () {
        var ok = gw.test === "ok";
        var list = api.state.gateways[api.state.tenantKey];
        var entry = {
          provider: gw.provider,
          detail: ok ? "Connected just now" : "Awaiting verification",
          status: ok ? "Active" : "Pending",
          isDefault: ok && gw.isDefault
        };
        if (entry.isDefault) list.forEach(function (g) { g.isDefault = false; });
        list.push(entry);
        var message = ok
          ? entry.provider + " connected" + (entry.isDefault ? " and set as default" : "")
          : entry.provider + " saved · pending verification";
        api.closeOverlay();
        api.renderMain();
        UI.showToast(message, ok ? "success" : "warning");
      }
    };
  }

  window.ClientOverlays = {
    render: render,
    afterRender: afterRender,
    onOpen: onOpen,
    onClose: onClose,
    createActions: createActions
  };
})();
