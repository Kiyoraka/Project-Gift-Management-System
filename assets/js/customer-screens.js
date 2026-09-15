/* Customer app - screens: Wallet, Send, Profile and the Gift inbox sheet.
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
      '<button type="button" class="btn btn-primary" style="margin-top:6px;border-radius:12px;padding:12px 20px" data-action="startBuy">Buy a card</button></div>';

    return (
      '<div class="stack">' +
      '<div class="spread" style="align-items:flex-end"><h1 class="app-title">Wallet</h1><span class="caption">' + active.length + " cards · " + UI.formatRM(spendable) + " to spend</span></div>" +
      '<div class="chip-scroll" role="toolbar" aria-label="Filter by merchant">' + chips + "</div>" +
      (visible.length ? '<div class="stack" style="--gap:14px">' + cards + "</div>" : empty) +
      (visible.length ? '<button type="button" class="btn btn-primary btn-app" data-action="startBuy">Buy a card</button>' : "") +
      "</div>"
    );
  }

  /* ---------- Gift inbox (sheet) ---------- */

  function inbox(ctx) {
    var s = ctx.state;
    var gift = s.pending.filter(function (g) { return g.id === s.giftId; })[0];
    var body;

    if (gift) {
      var view = CustomerData.cardView({ client: gift.card.client, name: gift.card.name, type: gift.card.type, balance: gift.card.balance, number: gift.card.number, expiry: gift.card.expiry, status: "active" });
      body =
        '<div style="padding-top:8px">' + UI.renderGiftWrap(UI.renderGiftCard(view, { noBack: true })) +
        '<div class="message-bubble"><div class="message-text">“' + esc(gift.message) + '”</div>' +
        '<div class="caption" style="margin-top:8px">— ' + esc(gift.from) + " · " + esc(gift.received) + "</div></div></div>" +
        '<div class="caption" style="text-align:center">Accept within ' + esc(gift.expiresIn) + " or it returns to " + esc(gift.from) + ".</div>" +
        '<div class="row" style="--gap:10px">' +
        '<button type="button" class="btn btn-outline btn-app" style="flex:1;color:var(--danger)" data-action="declineGift">Decline</button>' +
        '<button type="button" class="btn btn-primary btn-app" style="flex:2" data-action="acceptGift">Accept gift</button></div>';
    } else if (!s.pending.length) {
      body = '<div class="muted" style="text-align:center;padding:24px">No gifts waiting. Sent and received gifts live in Profile › Gifts.</div>';
    } else {
      body = s.pending.map(function (g) {
        var view = CustomerData.cardView({ client: g.card.client, name: g.card.name, type: g.card.type, balance: g.card.balance, number: g.card.number, expiry: g.card.expiry, status: "active" });
        return (
          '<button type="button" class="choice-btn" data-action="openGift" data-id="' + esc(g.id) + '">' +
          '<span class="choice-thumb">' + UI.renderGiftWrap(UI.renderGiftCard(view, { noBack: true, flat: true }), true) + "</span>" +
          '<span class="grow" style="flex:1;min-width:0"><span style="display:block;font-weight:600">From ' + esc(g.from) + '</span><span class="caption">' +
          esc(view.tenant) + " · " + esc(view.name) + " · " + esc(g.received) + "</span></span>" +
          '<span class="muted">' + UI.icon("chevronRight", 18) + "</span></button>"
        );
      }).join("");
    }

    return (
      '<div class="sheet-scrim" data-action="closeOverlay">' +
      '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="inboxTitle">' +
      '<div class="spread"><div class="section-title" id="inboxTitle">' + (gift ? "A gift for you" : "Gift inbox") + "</div>" +
      '<button type="button" class="icon-btn" data-action="closeOverlay" aria-label="Close">&times;</button></div>' +
      body +
      "</div></div>"
    );
  }

  /* ---------- Send and Profile (filled in by the Send + Profile task) ---------- */

  function placeholder(title) {
    return '<div class="stack"><h1 class="app-title">' + title + '</h1><div class="note-box">This screen is being prepared.</div></div>';
  }

  function send() {
    return placeholder("Send a gift");
  }

  function profile() {
    return placeholder("Profile");
  }

  /* ---------- Actions ---------- */

  function createActions(api) {
    var state = api.state;

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
      sendFromWallet: function (el) {
        var card = findCard(state, el.getAttribute("data-id"));
        if (!card) return;
        state.send = api.blankSend();
        state.send.step = "details";
        state.send.cardId = card.id;
        api.goTab("send");
      },
      historyFromWallet: function () {
        state.histTab = "tx";
        api.goTab("profile");
      },
      openGift: function (el) {
        state.giftId = el.getAttribute("data-id");
        api.renderOverlay();
      },
      acceptGift: function () {
        var gift = state.pending.filter(function (g) { return g.id === state.giftId; })[0];
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
        var gift = state.pending.filter(function (g) { return g.id === state.giftId; })[0];
        if (!gift) return;
        state.pending = state.pending.filter(function (g) { return g.id !== gift.id; });
        state.overlay = null;
        state.giftId = null;
        api.render();
        UI.showToast("Declined · card returned to " + gift.from, "danger");
      }
    };
  }

  window.CustomerScreens = {
    wallet: wallet,
    send: send,
    profile: profile,
    inbox: inbox,
    createActions: createActions
  };
})();
