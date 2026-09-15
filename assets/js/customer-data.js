/* Customer app - hardcoded sample data (from the Customer App design).
   Exposes a single global: CustomerData */

(function () {
  "use strict";

  var TENANTS = {
    senja: {
      key: "senja", name: "Senja Coffee", business: "Specialty coffee bar", brand: "#C2603E", art: "#F6EFE6", ink: "#1F1B2A", motif: "sun", gateway: "DuitNow QR",
      designs: [
        { name: "Sunrise", type: "fixed", validity: "12 months" },
        { name: "Two Cups", type: "voucher", item: "One flat white", price: 16, validity: "6 months" },
        { name: "Golden Hour", type: "open", validity: "12 months" }
      ]
    },
    lumi: {
      key: "lumi", name: "Lumi Spa", business: "Wellness and massage", brand: "#7FA68C", art: "#EEF3EF", ink: "#1F1B2A", motif: "mist", gateway: "Billplz",
      designs: [
        { name: "Calm Hour", type: "voucher", item: "60-min massage", price: 190, validity: "12 months" },
        { name: "Slow Sunday", type: "fixed", validity: "12 months" },
        { name: "Deep Breath", type: "open", validity: "12 months" }
      ]
    },
    page: {
      key: "page", name: "Page & Ink", business: "Independent bookshop", brand: "#1E2A4A", art: "#F3EDE0", ink: "#1E2A4A", motif: "frame", gateway: "ToyyibPay",
      designs: [
        { name: "First Edition", type: "open", validity: "18 months" },
        { name: "Marginalia", type: "fixed", validity: "18 months" },
        { name: "Late Fees", type: "voucher", item: "One paperback", price: 45, validity: "12 months" }
      ]
    }
  };

  var CARDS = [
    { id: 1, client: "senja", name: "Sunrise", type: "fixed", balance: 62.5, number: "4021 8830 1194 7702", expiry: "Mar 2027", status: "active" },
    { id: 2, client: "lumi", name: "Calm Hour", type: "voucher", item: "60-min massage", balance: 1, number: "7710 2205 8831 0046", expiry: "Dec 2026", status: "active" },
    { id: 3, client: "page", name: "First Edition", type: "open", balance: 35, number: "5583 0917 4420 6619", expiry: "Jun 2027", status: "active" },
    { id: 4, client: "senja", name: "Two Cups", type: "voucher", item: "One flat white", balance: 0, number: "4021 6611 0093 2280", expiry: "Feb 2027", status: "redeemed" }
  ];

  var PENDING_GIFTS = [
    {
      id: "g1", from: "Wei Ling Tan", received: "Today, 11:55", expiresIn: "71 h",
      message: "Happy birthday, Aisyah! Coffee on me for the rest of the month.",
      card: { client: "senja", name: "Sunrise", type: "fixed", balance: 100, number: "4021 9902 3311 5508", expiry: "Sep 2027" }
    }
  ];

  var HISTORY = [
    { kind: "spend", client: "senja", title: "Paid at Senja Coffee", sub: "Sunrise · Fixed", amount: "− RM 18.00", date: "13 Sep" },
    { kind: "redeem", client: "senja", title: "Redeemed Two Cups", sub: "One flat white", amount: "Voucher", date: "9 Sep" },
    { kind: "spend", client: "page", title: "Paid at Page & Ink", sub: "First Edition · Open", amount: "− RM 42.00", date: "6 Sep" },
    { kind: "purchase", client: "senja", title: "Bought Sunrise", sub: "DuitNow QR", amount: "RM 100.00", date: "2 Sep" },
    { kind: "purchase", client: "lumi", title: "Bought Calm Hour", sub: "Billplz", amount: "RM 190.00", date: "24 Aug" }
  ];

  var GIFTS = [
    { dir: "received", client: "page", title: "First Edition from Daniel Lee", sub: "“For the next rainy weekend.”", amount: "Received", date: "30 Aug" },
    { dir: "sent", client: "senja", title: "Two Cups to Nur Farah", sub: "Accepted in 2 h", amount: "Sent", date: "21 Aug" }
  ];

  var SCAN_TARGETS = [
    { client: "senja", label: "Senja Coffee · Static QR", sub: "You enter the amount", amount: null },
    { client: "senja", label: "Senja Coffee · Amount QR", sub: "Counter asks for RM 18.00", amount: 18 },
    { client: "lumi", label: "Lumi Spa · Static QR", sub: "You hold a voucher here", amount: null },
    { client: "page", label: "Page & Ink · Amount QR", sub: "Counter asks for RM 48.00 · balance is short", amount: 48 }
  ];

  var PROFILE_NOTIFICATIONS = [
    { name: "Gift received", desc: "Push when someone sends you a card", on: true },
    { name: "Payment receipts", desc: "Push after every spend", on: true },
    { name: "Expiry reminders", desc: "30 days before a card expires", on: false }
  ];

  var CONTACT_PHONE = "019-244 1183";
  var PHONE_PATTERN = /^01\d-?\d{3,4}\s?\d{4}$/;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* Gift card view model for a wallet card. */
  function cardView(card) {
    var t = TENANTS[card.client];
    var label;
    if (card.type === "voucher") label = card.status === "redeemed" ? "Redeemed" : card.item;
    else label = UI.formatRM(card.balance);
    return {
      tenant: t.name, name: card.name, type: card.type, motif: t.motif, art: t.art, ink: t.ink, brand: t.brand,
      expiry: card.expiry, number: card.number, balanceLabel: label
    };
  }

  function designCard(tenantKey, design, balanceLabel, number) {
    var t = TENANTS[tenantKey];
    return {
      tenant: t.name, name: design.name, type: design.type, motif: t.motif, art: t.art, ink: t.ink, brand: t.brand,
      expiry: "Sep 2027", number: number || "•••• •••• •••• ••••", balanceLabel: balanceLabel
    };
  }

  window.CustomerData = {
    TENANTS: TENANTS,
    SCAN_TARGETS: SCAN_TARGETS,
    CONTACT_PHONE: CONTACT_PHONE,
    PHONE_PATTERN: PHONE_PATTERN,
    initialCards: function () { return clone(CARDS); },
    initialPending: function () { return clone(PENDING_GIFTS); },
    initialHistory: function () { return clone(HISTORY); },
    initialGifts: function () { return clone(GIFTS); },
    initialNotifications: function () { return clone(PROFILE_NOTIFICATIONS); },
    cardView: cardView,
    designCard: designCard
  };
})();
