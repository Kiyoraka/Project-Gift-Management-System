/* Customer app - screens: Wallet, Gifts (inbox, Send a gift, history), Profile and the opened-gift sheet.
   Each renderer takes ctx { state, session } and returns HTML; createActions(api) returns the screen actions.
   Requires ui.js and customer-data.js. Exposes a single global: CustomerScreens */

(function () {
  "use strict";

  var esc = UI.escapeHtml;
  var FILTERS = ["All", "Senja Coffee", "Lumi Spa", "Page & Ink"];

  function tenantOf(card) {
    return CustomerData.TENANTS[card.client];
  }

  function findCard(state, id) {
    return state.cards.filter(function (c) { return String(c.id) === String(id); })[0];
  }

  function giftCardView(gift) {
    return CustomerData.cardView({
      client: gift.card.client, name: gift.card.name, type: gift.card.type, item: gift.card.item,
      balance: gift.card.balance, number: gift.card.number, expiry: gift.card.expiry, status: "active"
    });
  }

  /* ---------- Wallet ---------- */

  function wallet(ctx) {
    var s = ctx.state;
    var active = s.cards.filter(function (c) { return c.status === "active"; });
    var spendable = active
      .filter(function (c) { return c.type !== "voucher"; })
      .reduce(function (sum, c) { return sum + c.balance; }, 0);
    var visible = s.cards.filter(function (c) { return s.filter === "All" || tenantOf(c).name === s.filter; });

    var chips = FILTERS.map(function (f) {
      return '<button type="button" class="chip' + (s.filter === f ? " is-active" : "") + '" data-action="walletFilter" data-filter="' + esc(f) + '">' + esc(f) + "</button>";
    }).join("");

    var cards = visible.map(function (c) {
      var flipped = s.flipped === c.id;
      var redeemed = c.status === "redeemed";
      return (
        '<div' + (s.newId === c.id ? ' class="anim-slide"' : "") + ">" +
        UI.renderGiftCard(CustomerData.cardView(c), {
          flipped: flipped,
          dim: redeemed,
          action: "flipCard",
          id: c.id,
          ariaLabel: tenantOf(c).name + " " + c.name + (flipped ? ", showing balance and QR" : ", tap to flip")
        }) +
        (flipped
          ? '<div class="wallet-card-actions">' +
            (redeemed || c.balance <= 0 ? "" : '<button type="button" class="btn btn-outline" data-action="sendFromWallet" data-id="' + c.id + '">Send as gift</button>') +
            '<button type="button" class="btn btn-outline" data-action="historyFromWallet">History</button></div>'
          : "") +
        (redeemed ? '<div class="caption" style="text-align:center;margin-top:6px">Redeemed 9 Sep · kept for your records</div>' : "") +
        "</div>"
      );
    }).join("");

    var empty =
      '<div class="empty-wallet">' +
      '<span class="avatar" style="--size:56px;font-family:var(--font-display);font-size:26px">&#10022;</span>' +
      '<div class="section-title" style="font-size:20px">No cards here yet</div>' +
      '<div class="muted">Buy a gift card for yourself or send one to someone who deserves it.</div>' +
      '<button type="button" class="btn btn-primary" style="margin-top:6px;border-radius:12px;padding:12px 20px" data-action="goShop">Browse the shop</button></div>';

    return (
      '<div class="stack">' +
      '<div class="spread" style="align-items:flex-end"><h1 class="app-title">Wallet</h1><span class="caption">' + active.length + " cards · " + UI.formatRM(spendable) + " to spend</span></div>" +
      '<div class="chip-scroll" role="toolbar" aria-label="Filter by merchant">' + chips + "</div>" +
      (visible.length ? '<div class="stack" style="--gap:14px">' + cards + "</div>" : empty) +
      (visible.length ? '<button type="button" class="btn btn-outline btn-app" data-action="goShop">' + UI.icon("shop", 18) + "<span>Buy another card</span></button>" : "") +
      "</div>"
    );
  }

  /* ---------- Opened gift (sheet) ---------- */

  function inbox(ctx) {
    var s = ctx.state;
    var gift = s.pending.filter(function (g) { return g.id === s.giftId; })[0];
    if (!gift) return "";
    var view = giftCardView(gift);

    return (
      '<div class="sheet-scrim" data-action="closeOverlay">' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="giftTitle">' +
      '<div class="spread"><div class="section-title" id="giftTitle">A gift for you</div>' +
      '<button type="button" class="icon-btn" data-action="closeOverlay" aria-label="Close">&times;</button></div>' +
      '<div style="padding-top:8px">' + UI.renderGiftWrap(UI.renderGiftCard(view, { noBack: true })) +
      '<div class="message-bubble"><div class="message-text">“' + esc(gift.message) + '”</div>' +
      '<div class="caption" style="margin-top:8px">— ' + esc(gift.from) + " · " + esc(gift.received) + "</div></div></div>" +
      '<div class="caption" style="text-align:center">Accept within ' + esc(gift.expiresIn) + " or it returns to " + esc(gift.from) + ".</div>" +
      '<div class="row" style="--gap:10px">' +
      '<button type="button" class="btn btn-outline btn-app" style="flex:1;color:var(--danger)" data-action="declineGift">Decline</button>' +
      '<button type="button" class="btn btn-primary btn-app" style="flex:2" data-action="acceptGift">Accept gift</button></div>' +
      "</div></div>"
    );
  }

  /* ---------- Gifts tab ---------- */

  function historyColor(row) {
    if (row.kind === "spend") return "var(--ink)";
    if (row.kind === "purchase") return "var(--success)";
    if (row.dir === "received") return "var(--pill-gold-fg)";
    return "var(--primary)";
  }

  function historyRows(rows, emptyText) {
    if (!rows.length) return '<div class="muted" style="padding:16px 0;text-align:center">' + esc(emptyText) + "</div>";
    return rows.map(function (h) {
      var t = CustomerData.TENANTS[h.client];
      return (
        '<div class="list-row" style="padding:12px 0"><span class="brand-mark" style="--size:34px;--mark:' + t.brand + '">' + esc(t.name.charAt(0)) + "</span>" +
        '<div class="grow"><div class="row-title">' + esc(h.title) + '</div><div class="row-sub" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(h.sub) + "</div></div>" +
        '<div style="text-align:right"><div class="row-title" style="white-space:nowrap;color:' + historyColor(h) + '">' + esc(h.amount) + '</div><div class="caption" style="font-size:11px">' + esc(h.date) + "</div></div></div>"
      );
    }).join("");
  }

  function gifts(ctx) {
    var s = ctx.state;
    if (s.send.step !== "idle") return send(ctx);

    var waiting = s.pending.length
      ? s.pending.map(function (g) {
          var view = giftCardView(g);
          return (
            '<button type="button" class="choice-btn" data-action="openGift" data-id="' + esc(g.id) + '">' +
            '<span class="choice-thumb">' + UI.renderGiftWrap(UI.renderGiftCard(view, { noBack: true, flat: true }), true) + "</span>" +
            '<span style="flex:1;min-width:0"><span style="display:block;font-weight:600">From ' + esc(g.from) + '</span><span class="caption">' +
            esc(view.tenant) + " · " + esc(view.name) + " · " + esc(g.received) + "</span></span>" +
            '<span class="muted">' + UI.icon("chevronRight", 18) + "</span></button>"
          );
        }).join("")
      : '<div class="note-box">No gifts waiting right now.</div>';

    var giftable = s.cards.filter(function (c) { return c.status === "active" && c.balance > 0; }).length;
    var list = s.gifts.filter(function (g) { return g.dir === s.giftsTab; });

    return (
      '<div class="stack" style="--gap:18px">' +
      '<div class="spread" style="align-items:flex-end"><h1 class="app-title">Gifts</h1>' +
      (s.pending.length ? '<span class="pill pill-gold pill-sm">' + s.pending.length + " waiting</span>" : "") + "</div>" +
      '<div class="stack" style="--gap:10px"><div class="stat-label">Waiting for you</div>' + waiting + "</div>" +
      '<button type="button" class="btn btn-primary btn-app" data-action="startSend"' + (giftable ? "" : " disabled") + ">" +
      UI.icon("send", 18) + "<span>Send a gift</span></button>" +
      (giftable ? "" : '<div class="caption" style="text-align:center;margin-top:-8px">Buy a card first, then you can send it.</div>') +
      '<div class="segmented" style="border-radius:12px" role="tablist" aria-label="Gift history">' +
      '<button type="button" role="tab" class="' + (s.giftsTab === "received" ? "is-active" : "") + '" aria-selected="' + (s.giftsTab === "received") + '" data-action="giftsTab" data-tab="received">Received</button>' +
      '<button type="button" role="tab" class="' + (s.giftsTab === "sent" ? "is-active" : "") + '" aria-selected="' + (s.giftsTab === "sent") + '" data-action="giftsTab" data-tab="sent">Sent</button></div>' +
      '<div class="soft-panel soft-panel-pad">' + historyRows(list, s.giftsTab === "received" ? "No gifts received yet." : "No gifts sent yet.") + "</div>" +
      "</div>"
    );
  }

  /* ---------- Send a gift (runs inside the Gifts tab) ---------- */

  var SEND_TITLES = { pick: "Send a gift", details: "Who is it for?", preview: "Preview", done: "Sent" };
  var DEFAULT_MESSAGE = "A little something, just because.";

  function firstName(ctx) {
    return String(ctx.session.name || "Aisyah").split(" ")[0];
  }

  function whenLabel(sd) {
    return sd.when === "now" ? "delivered now" : "scheduled 20 Sep, 09:00";
  }

  function send(ctx) {
    var s = ctx.state;
    var sd = s.send;
    var card = findCard(s, sd.cardId);
    var step = (sd.step === "details" || sd.step === "preview") && !card ? "pick" : sd.step;
    var body = "";

    if (step === "pick") {
      var giftable = s.cards.filter(function (c) { return c.status === "active" && c.balance > 0; });
      body = '<div class="muted">Choose a card from your wallet. Only cards with value left can be gifted.</div>' +
        (giftable.length
          ? '<div class="stack" style="--gap:12px">' + giftable.map(function (c) {
              return UI.renderGiftCard(CustomerData.cardView(c), { action: "sendPick", id: c.id, noBack: true, ariaLabel: "Gift " + c.name });
            }).join("") + "</div>"
          : '<div class="note-box">No cards with value left. Buy one first, then send it.</div>');
    } else if (step === "details") {
      var count = sd.message.length;
      body =
        '<div style="width:60%;align-self:center">' + UI.renderGiftCard(CustomerData.cardView(card), { noBack: true }) + "</div>" +
        '<label class="field">Recipient phone<span class="row" style="--gap:8px">' +
        '<input class="input input-plain mono" id="sendPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01X-XXX XXXX" data-input="sendPhone" value="' + esc(sd.phone) + '" style="flex:1;font-size:15px;padding:12px 14px;border-radius:12px">' +
        '<button type="button" class="btn btn-outline" style="border-radius:12px" data-action="sendContacts">Contacts</button></span></label>' +
        '<label class="field"><span class="spread">Message<span id="msgCount" style="font-weight:500;color:' + (count >= 130 ? "var(--warning)" : "var(--ink-muted)") + '">' + count + "/140</span></span>" +
        '<textarea class="textarea input-plain" rows="3" maxlength="140" placeholder="Something warm…" data-input="sendMessage" style="padding:12px 14px;border-radius:12px">' + esc(sd.message) + "</textarea></label>" +
        '<div class="field">Deliver<div class="segmented" style="border-radius:12px">' +
        '<button type="button" class="' + (sd.when === "now" ? "is-active" : "") + '" data-action="sendWhen" data-when="now">Now</button>' +
        '<button type="button" class="' + (sd.when === "later" ? "is-active" : "") + '" data-action="sendWhen" data-when="later">Schedule</button></div>' +
        (sd.when === "later" ? '<input class="input input-plain" type="datetime-local" value="2026-09-20T09:00" aria-label="Delivery time" style="padding:12px 14px;border-radius:12px">' : "") +
        "</div>" +
        '<div class="form-error" id="sendError" role="alert"' + (sd.error ? "" : " hidden") + ">Enter a Malaysian mobile number (01X-XXX XXXX).</div>" +
        '<button type="button" class="btn btn-primary btn-app" data-action="sendPreview">Preview gift</button>';
    } else if (step === "preview") {
      body =
        '<div style="padding:16px 0 8px">' + UI.renderGiftWrap(UI.renderGiftCard(CustomerData.cardView(card), { noBack: true })) +
        '<div class="message-bubble"><div class="message-text">“' + esc(sd.message.trim() || DEFAULT_MESSAGE) + '”</div>' +
        '<div class="caption" style="margin-top:8px">— ' + esc(firstName(ctx)) + " · to " + esc(sd.phone) + " · " + whenLabel(sd) + "</div></div></div>" +
        '<div class="note-box">The card leaves your wallet now and waits for ' + esc(sd.phone) + ". If they don’t accept within 72 hours it comes back.</div>" +
        '<button type="button" class="btn btn-primary btn-app" data-action="sendConfirm">Send gift</button>';
    } else if (step === "done") {
      var sent = sd.sentCard || {};
      body =
        '<div class="center-stack anim-pop" style="padding:32px 12px">' +
        '<div class="success-icon is-gold">' + UI.icon("check", 30, 2.4) + "</div>" +
        '<div class="section-title" style="font-size:24px">Gift on its way</div>' +
        '<div class="muted">' + esc(sent.name) + " from " + esc(sent.tenant) + " is waiting for " + esc(sd.phone) + ". We’ll tell you when they open it.</div>" +
        '<button type="button" class="btn btn-outline" style="margin-top:10px;border-radius:12px;padding:12px 20px" data-action="sendReset">Back to gifts</button></div>';
    }

    var canBack = step === "pick" || step === "details" || step === "preview";

    return (
      '<div class="stack">' +
      '<div class="title-row">' +
      (canBack ? '<button type="button" class="back-btn" data-action="sendBack" aria-label="Back">' + UI.icon("arrowLeft", 18, 2) + "</button>" : "") +
      '<h1 class="app-title">' + SEND_TITLES[step] + "</h1></div>" +
      body +
      "</div>"
    );
  }

  /* ---------- Profile ---------- */

  function profile(ctx) {
    var s = ctx.state;

    var notifs = s.notifs.map(function (n, i) {
      return (
        '<div class="list-row" style="padding:12px 0"><div class="grow"><div class="row-title">' + esc(n.name) + '</div><div class="row-sub">' + esc(n.desc) + "</div></div>" +
        '<button type="button" class="switch' + (n.on ? " is-on" : "") + '" role="switch" aria-checked="' + n.on + '" aria-label="' + esc(n.name) +
        '" data-action="profileNotif" data-index="' + i + '"></button></div>'
      );
    }).join("");

    return (
      '<div class="stack" style="--gap:18px">' +
      '<h1 class="app-title">Profile</h1>' +
      '<div class="soft-panel row" style="padding:16px;--gap:14px">' +
      '<span class="avatar" style="--size:52px;font-size:16px">' + esc(UI.initials(ctx.session.name)) + "</span>" +
      '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(ctx.session.name) + "</div>" +
      '<div class="mono caption" style="font-size:13px;margin-top:2px">' + esc(s.account.phone) + "</div></div>" +
      '<button type="button" class="btn btn-outline btn-sm" data-action="editProfile">Edit</button></div>' +
      '<div class="soft-panel soft-panel-pad">' + notifs + "</div>" +
      '<div class="stat-label">Transactions</div>' +
      '<div class="soft-panel soft-panel-pad" style="margin-top:-8px">' + historyRows(s.history, "Nothing here yet.") + "</div>" +
      '<button type="button" class="btn btn-danger-outline btn-app" data-action="signOut">' + UI.icon("logout", 18) + "<span>Sign out</span></button>" +
      "</div>"
    );
  }

  /* ---------- Actions ---------- */

  function createActions(api) {
    var state = api.state;

    function currentGift() {
      return state.pending.filter(function (g) { return g.id === state.giftId; })[0];
    }

    return {
      walletFilter: function (el) {
        state.filter = el.getAttribute("data-filter");
        state.flipped = null;
        api.renderMain();
      },
      flipCard: function (el) {
        var id = Number(el.getAttribute("data-id"));
        state.flipped = state.flipped === id ? null : id;
        state.newId = null;
        api.renderMain();
      },
      goShop: function () {
        api.goTab("shop");
      },
      sendFromWallet: function (el) {
        var card = findCard(state, el.getAttribute("data-id"));
        if (!card) return;
        state.send = api.blankSend();
        state.send.step = "details";
        state.send.cardId = card.id;
        api.goTab("gifts");
      },
      historyFromWallet: function () {
        api.goTab("profile");
      },

      openGift: function (el) {
        state.giftId = el.getAttribute("data-id");
        state.overlay = "inbox";
        api.renderOverlay();
      },
      acceptGift: function () {
        var gift = currentGift();
        if (!gift) return;
        var id = Date.now();
        state.cards.unshift({
          id: id, client: gift.card.client, name: gift.card.name, type: gift.card.type, item: gift.card.item,
          balance: gift.card.balance, number: gift.card.number, expiry: gift.card.expiry, status: "active"
        });
        state.pending = state.pending.filter(function (g) { return g.id !== gift.id; });
        state.gifts.unshift({
          dir: "received", client: gift.card.client, title: gift.card.name + " from " + gift.from,
          sub: "“" + gift.message + "”", amount: "Received", date: "15 Sep"
        });
        state.overlay = null;
        state.giftId = null;
        state.filter = "All";
        state.newId = id;
        api.goTab("wallet");
        UI.showToast(gift.card.name + " added to your wallet");
      },
      declineGift: function () {
        var gift = currentGift();
        if (!gift) return;
        state.pending = state.pending.filter(function (g) { return g.id !== gift.id; });
        state.overlay = null;
        state.giftId = null;
        api.render();
        UI.showToast("Declined · card returned to " + gift.from, "danger");
      },
      giftsTab: function (el) {
        state.giftsTab = el.getAttribute("data-tab");
        api.renderMain();
      },

      startSend: function () {
        state.send = api.blankSend();
        state.send.step = "pick";
        api.renderMain();
        api.goTab("gifts");
      },
      sendPick: function (el) {
        var card = findCard(state, el.getAttribute("data-id"));
        if (!card) return;
        state.send.cardId = card.id;
        state.send.step = "details";
        state.send.error = false;
        api.renderMain();
      },
      sendBack: function () {
        var step = state.send.step;
        if (step === "preview") state.send.step = "details";
        else if (step === "details") state.send.step = "pick";
        else state.send = api.blankSend();
        api.renderMain();
      },
      sendPhone: function (el) {
        state.send.phone = el.value;
        if (state.send.error) {
          state.send.error = false;
          var err = document.getElementById("sendError");
          if (err) err.hidden = true;
        }
      },
      sendContacts: function () {
        state.send.phone = state.account.contactPhone;
        state.send.error = false;
        var input = document.getElementById("sendPhone");
        if (input) input.value = state.send.phone;
        var err = document.getElementById("sendError");
        if (err) err.hidden = true;
      },
      sendMessage: function (el) {
        state.send.message = el.value.slice(0, 140);
        var counter = document.getElementById("msgCount");
        if (counter) {
          counter.textContent = state.send.message.length + "/140";
          counter.style.color = state.send.message.length >= 130 ? "var(--warning)" : "var(--ink-muted)";
        }
      },
      sendWhen: function (el) {
        state.send.when = el.getAttribute("data-when");
        api.renderMain();
      },
      sendPreview: function () {
        if (!CustomerData.PHONE_PATTERN.test(state.send.phone.trim())) {
          state.send.error = true;
          var err = document.getElementById("sendError");
          if (err) err.hidden = false;
          var input = document.getElementById("sendPhone");
          if (input) input.focus();
          return;
        }
        state.send.phone = state.send.phone.trim();
        state.send.step = "preview";
        api.renderMain();
      },
      sendConfirm: function () {
        var card = findCard(state, state.send.cardId);
        if (!card) return;
        var view = CustomerData.cardView(card);
        state.cards = state.cards.filter(function (c) { return c.id !== card.id; });
        state.gifts.unshift({
          dir: "sent", client: card.client, title: card.name + " to " + state.send.phone,
          sub: state.send.when === "now" ? "Waiting to be accepted" : "Scheduled 20 Sep", amount: "Sent", date: "15 Sep"
        });
        state.send.sentCard = { name: view.name, tenant: view.tenant };
        state.send.step = "done";
        state.giftsTab = "sent";
        api.renderMain();
      },
      sendReset: function () {
        state.send = api.blankSend();
        api.goTab("gifts");
      },

      profileNotif: function (el) {
        var n = state.notifs[Number(el.getAttribute("data-index"))];
        if (!n) return;
        n.on = !n.on;
        el.classList.toggle("is-on", n.on);
        el.setAttribute("aria-checked", n.on ? "true" : "false");
      },
      editProfile: function () {
        UI.showToast("Profile editing opens here in the live app", "info");
      }
    };
  }

  window.CustomerScreens = {
    wallet: wallet,
    gifts: gifts,
    profile: profile,
    inbox: inbox,
    createActions: createActions
  };
})();
