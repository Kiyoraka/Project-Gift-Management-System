/* Client Console - hardcoded sample data (from the Client Console design).
   Exposes a single global: ClientData */

(function () {
  "use strict";

  var TENANTS = {
    senja: {
      key: "senja", name: "Senja Coffee", business: "Specialty coffee bar",
      brand: "#C2603E", art: "#F6EFE6", ink: "#1F1B2A", motif: "sun",
      staff: "Farid Senja", staffFirst: "Farid", phone: "012-338 9021",
      address: "14 Jalan Telawi 3, Bangsar, 59100 Kuala Lumpur",
      voucherHint: "e.g. one flat white", gateway: "DuitNow QR", gateway2: "Billplz",
      sold: "1,240", outstanding: "RM 48,900", salesTotal: "RM 12,480",
      stats: ["14", "RM 12,480", "RM 48,900", "9"], split: [0.5, 0.26, 0.24],
      staffList: [
        { name: "Mei Chen", role: "Manager", perm: "Sales, customers" },
        { name: "Arif Rosli", role: "Barista", perm: "Payment QR only" }
      ]
    },
    lumi: {
      key: "lumi", name: "Lumi Spa", business: "Wellness and massage",
      brand: "#7FA68C", art: "#EEF3EF", ink: "#1F1B2A", motif: "mist",
      staff: "Clara Wong", staffFirst: "Clara", phone: "017-204 5580",
      address: "3-1 Plaza Damansara, 50490 Kuala Lumpur",
      voucherHint: "e.g. 60-min massage", gateway: "Billplz", gateway2: "Billplz",
      sold: "380", outstanding: "RM 61,200", salesTotal: "RM 9,860",
      stats: ["3", "RM 9,860", "RM 61,200", "4"], split: [0.25, 0.18, 0.57],
      staffList: [
        { name: "Mei Chen", role: "Manager", perm: "Sales, customers" },
        { name: "Siti Aminah", role: "Therapist", perm: "Payment QR only" }
      ]
    },
    page: {
      key: "page", name: "Page & Ink", business: "Independent bookshop",
      brand: "#1E2A4A", art: "#F3EDE0", ink: "#1E2A4A", motif: "frame",
      staff: "Jonas Lim", staffFirst: "Jonas", phone: "011-5622 7710",
      address: "27 Lorong Panggung, 50000 Kuala Lumpur",
      voucherHint: "e.g. one paperback", gateway: "ToyyibPay", gateway2: "ToyyibPay",
      sold: "715", outstanding: "RM 22,150", salesTotal: "RM 5,310",
      stats: ["7", "RM 5,310", "RM 22,150", "5"], split: [0.4, 0.46, 0.14],
      staffList: [
        { name: "Mei Chen", role: "Manager", perm: "Sales, customers" },
        { name: "Hana Idris", role: "Bookseller", perm: "Payment QR only" }
      ]
    }
  };

  var DESIGNS = {
    senja: [
      { name: "Sunrise", type: "fixed", meta: "Fixed · RM 100 · 12 mo", status: "Active", sold: 512 },
      { name: "Two Cups", type: "voucher", meta: "Voucher · one flat white", status: "Active", sold: 402 },
      { name: "Golden Hour", type: "open", meta: "Open · RM 10–1,000", status: "Active", sold: 326 },
      { name: "Monsoon", type: "voucher", meta: "Voucher · pour-over", status: "Archived", sold: 0 }
    ],
    lumi: [
      { name: "Calm Hour", type: "voucher", meta: "Voucher · 60-min massage", status: "Active", sold: 214 },
      { name: "Slow Sunday", type: "fixed", meta: "Fixed · RM 200 · 12 mo", status: "Active", sold: 96 },
      { name: "Deep Breath", type: "open", meta: "Open · RM 50–1,000", status: "Active", sold: 70 },
      { name: "Steam & Salt", type: "voucher", meta: "Voucher · sauna pass", status: "Draft", sold: 0 }
    ],
    page: [
      { name: "First Edition", type: "open", meta: "Open · RM 10–500", status: "Active", sold: 330 },
      { name: "Marginalia", type: "fixed", meta: "Fixed · RM 50 · 18 mo", status: "Active", sold: 285 },
      { name: "Late Fees", type: "voucher", meta: "Voucher · one paperback", status: "Active", sold: 100 },
      { name: "Dust Jacket", type: "fixed", meta: "Fixed · RM 200 · 12 mo", status: "Draft", sold: 0 }
    ]
  };

  var GATEWAYS = {
    senja: [
      { provider: "DuitNow QR", detail: "Merchant ID ••• 4471", status: "Active", isDefault: true },
      { provider: "Billplz", detail: "Collection senja-gifts", status: "Active", isDefault: false },
      { provider: "Stripe", detail: "acct_••• 9Kd2 · KYC pending", status: "Pending", isDefault: false }
    ],
    lumi: [
      { provider: "Billplz", detail: "Collection lumi-gifts", status: "Active", isDefault: true },
      { provider: "DuitNow QR", detail: "Merchant ID ••• 2208", status: "Active", isDefault: false }
    ],
    page: [
      { provider: "ToyyibPay", detail: "Category pageink-gifts", status: "Active", isDefault: true },
      { provider: "Manual bank transfer", detail: "Maybank ••• 5678", status: "Disabled", isDefault: false }
    ]
  };

  var PROVIDERS = {
    "DuitNow QR": { logo: "DN", bg: "#E8318A", fields: [["Merchant ID", "MYDN••••••••", "text"], ["API key", "sk_live_…", "password"]] },
    "Billplz": { logo: "BZ", bg: "#1E88E5", fields: [["API secret key", "xxxxxxxx-xxxx-xxxx", "password"], ["Collection ID", "senja-gifts", "text"]] },
    "ToyyibPay": { logo: "TP", bg: "#00A36C", fields: [["User secret key", "…", "password"], ["Category code", "…", "text"]] },
    "Stripe": { logo: "S", bg: "#635BFF", fields: [["Publishable key", "pk_live_…", "text"], ["Secret key", "sk_live_…", "password"]] },
    "Manual bank transfer": { logo: "MB", bg: "#6B647A", fields: [["Bank", "Maybank", "text"], ["Account number", "5140 1234 5678", "text"], ["Account holder", "{tenant} Sdn Bhd", "text"]] }
  };

  var NOTIFICATIONS = [
    { name: "Payment received", desc: "Live toast on the dashboard when a card is spent at your QR", on: true },
    { name: "Voucher redeemed", desc: "Toast when a voucher is marked used", on: true },
    { name: "Daily sales summary", desc: "Email at 22:00 with cards sold and redemptions", on: false },
    { name: "Low gateway balance", desc: "Warn when the default gateway needs attention", on: true },
    { name: "New customer", desc: "When someone holds your card for the first time", on: false }
  ];

  var WEEK_VALUES = {
    Sales: [820, 1140, 960, 1380, 1720, 2410, 2050],
    Cards: [8, 11, 9, 14, 18, 26, 22],
    Customers: [5, 7, 6, 9, 12, 19, 15],
    Gateways: [8, 11, 9, 14, 17, 25, 22]
  };

  var BAR_TITLES = {
    Sales: "Sales by day",
    Cards: "Cards sold by day",
    Customers: "Buying customers by day",
    Gateways: "Gateway settlements by day"
  };

  var RANGE_LABELS = { Day: "Today, by hour", Month: "Week of 8 Sep", Year: "2026 to date", Custom: "1 Aug – 15 Sep" };

  var REDEEM_RATIOS = [0.76, 0.92, 0.6, 0.4];

  var QUICK_AMOUNTS = [12, 18, 25, 50];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* Picks the live Fixed / Voucher / Open designs so customers and transactions mention real card names. */
  function liveDesigns(designs) {
    var live = designs.filter(function (d) { return d.status !== "Draft" && d.status !== "Archived"; });
    if (!live.length) live = designs;
    function find(type) {
      return live.filter(function (d) { return d.type === type; })[0] || live[0];
    }
    var fixed = find("fixed");
    var voucher = find("voucher");
    var open = find("open");
    var fixedAmount = (fixed.meta.match(/RM \d+/) || ["RM 100"])[0];
    var voucherItem = voucher.meta.split("· ")[1] || "item";
    return { fixed: fixed, voucher: voucher, open: open, fixedAmount: fixedAmount, voucherItem: voucherItem };
  }

  function customersFor(tenant, designs) {
    var d = liveDesigns(designs);
    var FX = d.fixed.name, VC = d.voucher.name, OP = d.open.name, amt = d.fixedAmount, item = d.voucherItem;
    var gw = tenant.gateway, gw2 = tenant.gateway2;
    var ink = "#1F1B2A", plum = "#5B2A86", green = "#2E9E6B", gold = "#9A6F1C";
    return [
      { name: "Aisyah Rahman", phone: "012-338 9021", spent: "RM 412.50", last: "2 days ago",
        cards: [{ name: FX, type: "Fixed " + amt, balance: "RM 62.50" }, { name: VC, type: "Voucher", balance: "Redeemed" }],
        history: [
          { date: "13 Sep", what: "Paid at counter · " + FX, amount: "− RM 18.00", color: ink },
          { date: "9 Sep", what: "Redeemed " + VC + " · " + item, amount: "Voucher", color: plum },
          { date: "2 Sep", what: "Bought " + FX + " · " + gw, amount: "+ " + amt + ".00", color: green }
        ] },
      { name: "Daniel Lee", phone: "016-770 2245", spent: "RM 265.00", last: "5 days ago",
        cards: [{ name: OP, type: "Open Value", balance: "RM 140.00" }],
        history: [
          { date: "10 Sep", what: "Paid at counter · " + OP, amount: "− RM 24.00", color: ink },
          { date: "28 Aug", what: "Top-up · " + gw2, amount: "+ RM 100.00", color: green }
        ] },
      { name: "Nur Farah", phone: "019-244 1183", spent: "RM 88.00", last: "Yesterday",
        cards: [{ name: FX, type: "Fixed " + amt, balance: "RM 12.00" }],
        history: [
          { date: "14 Sep", what: "Paid at counter · " + FX, amount: "− RM 31.00", color: ink },
          { date: "6 Sep", what: "Received as gift from Wei Ling", amount: "Gift", color: gold }
        ] },
      { name: "Wei Ling Tan", phone: "012-905 6634", spent: "RM 620.00", last: "Today",
        cards: [{ name: FX, type: "Fixed " + amt, balance: amt + ".00" }, { name: OP, type: "Open Value", balance: "RM 55.00" }],
        history: [
          { date: "15 Sep", what: "Bought " + FX + " · sent to Nur Farah", amount: "+ " + amt + ".00", color: green },
          { date: "12 Sep", what: "Paid at counter · " + OP, amount: "− RM 45.00", color: ink }
        ] },
      { name: "Hafiz Omar", phone: "013-661 0972", spent: "RM 32.00", last: "12 days ago",
        cards: [{ name: VC, type: "Voucher", balance: "Unused" }],
        history: [{ date: "3 Sep", what: "Bought " + VC + " · " + gw, amount: "+ RM 16.00", color: green }] }
    ];
  }

  function transactionsFor(tenant, designs) {
    var d = liveDesigns(designs);
    return [
      { name: "Aisyah Rahman", detail: "Paid with " + d.fixed.name + " · Fixed", amount: "− RM 18.00", when: "12:40", bg: "#EEE4F7", fg: "#5B2A86" },
      { name: "Wei Ling Tan", detail: "Bought " + d.fixed.name + " · gifted", amount: "+ " + d.fixedAmount + ".00", when: "11:55", bg: "#E6F4EC", fg: "#2E9E6B" },
      { name: "Nur Farah", detail: "Paid with " + d.fixed.name + " · Fixed", amount: "− RM 31.00", when: "10:20", bg: "#EEE4F7", fg: "#5B2A86" },
      { name: "Hafiz Omar", detail: "Redeemed " + d.voucher.name + " · " + d.voucherItem, amount: "Voucher", when: "09:48", bg: "#FBF3DF", fg: "#9A6F1C" },
      { name: "Daniel Lee", detail: "Top-up " + d.open.name + " via " + tenant.gateway2, amount: "+ RM 100.00", when: "Yesterday", bg: "#E6F4EC", fg: "#2E9E6B" }
    ];
  }

  /* Gift card view model for a catalogue design. */
  function cardFromDesign(tenant, design, index) {
    var label = "Any amount";
    if (design.type === "fixed" || design.type === "voucher") label = design.meta.split("· ")[1] || design.meta;
    return {
      tenant: tenant.name, name: design.name, type: design.type,
      motif: tenant.motif, art: tenant.art, ink: tenant.ink, brand: tenant.brand,
      expiry: "Sep 2027",
      number: (4021 + index * 37) + " 8830 " + (1194 + index * 11) + " " + (7702 - index * 13),
      balanceLabel: label
    };
  }

  function performanceFor(tenant, designs) {
    return designs
      .filter(function (d) { return d.status !== "Draft"; })
      .map(function (d, i) {
        var redeemed = Math.round(d.sold * REDEEM_RATIOS[i % REDEEM_RATIOS.length]);
        var outstanding = d.type === "voucher"
          ? (d.sold - redeemed) + " unused"
          : "RM " + ((d.sold - redeemed) * (d.type === "fixed" ? 100 : 62)).toLocaleString("en-MY");
        return {
          name: d.name, art: tenant.art, typeLabel: d.type === "open" ? "Open" : d.type,
          sold: d.sold, redeemed: redeemed, outstanding: outstanding,
          pct: d.sold ? Math.round(redeemed / d.sold * 100) : 0
        };
      });
  }

  window.ClientData = {
    TENANTS: TENANTS,
    PROVIDERS: PROVIDERS,
    WEEK_VALUES: WEEK_VALUES,
    BAR_TITLES: BAR_TITLES,
    RANGE_LABELS: RANGE_LABELS,
    QUICK_AMOUNTS: QUICK_AMOUNTS,
    initialDesigns: function () { return clone(DESIGNS); },
    initialGateways: function () { return clone(GATEWAYS); },
    initialNotifications: function () { return clone(NOTIFICATIONS); },
    liveDesigns: liveDesigns,
    customersFor: customersFor,
    transactionsFor: transactionsFor,
    cardFromDesign: cardFromDesign,
    performanceFor: performanceFor
  };
})();
