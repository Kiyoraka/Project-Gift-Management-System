/* Gift Management System - shared UI helpers (vanilla, no build step).
   Exposes a single global: UI */

(function () {
  "use strict";

  var TODAY_LABEL = "Tuesday, 15 September 2026";

  var TYPE_LABELS = { fixed: "Fixed", open: "Open Value", voucher: "Voucher" };
  var TYPE_LABELS_LONG = { fixed: "Fixed Value", open: "Open Value", voucher: "Voucher" };

  var TENANT_STYLE = {
    "Senja Coffee": { art: "#F6EFE6", ink: "#1F1B2A", brand: "#C2603E", motif: "sun" },
    "Lumi Spa": { art: "#EEF3EF", ink: "#1F1B2A", brand: "#7FA68C", motif: "mist" },
    "Page & Ink": { art: "#F3EDE0", ink: "#1E2A4A", brand: "#1E2A4A", motif: "frame" }
  };

  var PILL_CLASS = {
    Active: "pill-success",
    Paid: "pill-success",
    Accepted: "pill-success",
    Pending: "pill-warning",
    Onboarding: "pill-warning",
    Suspended: "pill-danger",
    Declined: "pill-danger",
    Draft: "pill-neutral",
    Archived: "pill-neutral",
    Disabled: "pill-neutral",
    Expired: "pill-neutral",
    Redeemed: "pill-primary",
    Default: "pill-gold"
  };

  var TOAST_COLORS = {
    success: "#2E9E6B",
    warning: "#D98A2B",
    danger: "#D64545",
    info: "#3E7CB1"
  };

  var ICON_PATHS = {
    main: { vb: 18, d: "M3 3h5v5H3zM10 3h5v5h-5zM3 10h5v5H3zM10 10h5v5h-5z" },
    analysis: { vb: 18, d: "M3 15V9M8 15V4M13 15v-6" },
    user: { vb: 18, d: "M9 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 16a6.5 6.5 0 0 1 13 0" },
    customers: { vb: 18, d: "M7 8.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM1.5 15.5a5.5 5.5 0 0 1 11 0M12 3a3 3 0 0 1 0 5.5M16.5 15.5a5 5 0 0 0-3-4.6" },
    setting: { vb: 18, d: "M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" },
    menu: { vb: 18, d: "M2 4h14M2 9h14M2 14h14" },
    qr: { vb: 16, d: "M2 2h4v4H2zM10 2h4v4h-4zM2 10h4v4H2zM10 10h2v2h-2zM13 13h1v1h-1zM10 13h1v1h-1zM13 10h1v1h-1z" },
    logout: { vb: 18, d: "M7 3H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M12 13l4-4-4-4M16 9H7" },
    upload: { vb: 28, d: "M14 19V7M8 13l6-6 6 6M5 21h18" },
    gift: { vb: 18, d: "M2 7h14v9H2zM2 7l7 4 7-4M9 7V16M4 4.5C4 3 5.3 2 6.5 2c1.4 0 2.5 2.2 2.5 5 0-2.8 1.1-5 2.5-5C12.7 2 14 3 14 4.5S12.8 7 11.5 7h-5C5.2 7 4 6 4 4.5z" },
    wallet: { vb: 24, d: "M3 7h18v12H3zM3 7l2-3h14l2 3M15 13h3" },
    send: { vb: 24, d: "M4 12l16-8-5 16-3-6-8-2z" },
    scan: { vb: 24, d: "M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M7 12h10" },
    profile: { vb: 24, d: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" },
    shop: { vb: 24, d: "M5 8h14l-1.2 12H6.2L5 8zM9 8V6.5a3 3 0 0 1 6 0V8" },
    eye: { vb: 18, d: "M1.5 9S4.5 3.5 9 3.5 16.5 9 16.5 9 13.5 14.5 9 14.5 1.5 9 1.5 9zM9 11.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z" },
    check: { vb: 18, d: "M3.5 9.5l3.5 3.5 7.5-8" },
    arrowLeft: { vb: 18, d: "M11 4L6 9l5 5" },
    chevronRight: { vb: 18, d: "M7 4l5 5-5 5" },
    chevronDown: { vb: 18, d: "M4 7l5 5 5-5" }
  };

  var LEAVES_SVG =
    '<svg class="gc-leaves" viewBox="0 0 100 60" fill="none" stroke="#5E8A6C" stroke-width=".9" aria-hidden="true">' +
    '<path d="M10 55 C 30 20, 60 10, 92 6"/><path d="M40 28 c -10 -6 -14 -14 -12 -22 c 8 2 14 10 12 22z"/>' +
    '<path d="M62 16 c -2 -10 4 -16 12 -18 c 2 8 -2 16 -12 18z"/><path d="M24 45 c -10 -2 -16 -8 -18 -16 c 8 0 16 6 18 16z"/></svg>';

  var BOW_SVG =
    '<svg viewBox="0 0 64 44" aria-hidden="true">' +
    '<path d="M32 22 C 20 4, 2 8, 6 20 C 9 30, 24 26, 32 22 Z" fill="#E4B85C" stroke="#B8862B" stroke-width="1.5"/>' +
    '<path d="M32 22 C 44 4, 62 8, 58 20 C 55 30, 40 26, 32 22 Z" fill="#E4B85C" stroke="#B8862B" stroke-width="1.5"/>' +
    '<path d="M32 22 L 22 42 M32 22 L 42 42" stroke="#B8862B" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="32" cy="22" r="5" fill="#B8862B"/></svg>';

  /* ---------- Text and number helpers ---------- */

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function attr(value) {
    return escapeHtml(value);
  }

  function formatRM(value) {
    var n = Number(value) || 0;
    return "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatRMWhole(value) {
    return "RM " + (Number(value) || 0).toLocaleString("en-MY");
  }

  function initials(name) {
    return String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .map(function (w) { return w.charAt(0); })
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function pillClass(status) {
    return PILL_CLASS[status] || "pill-neutral";
  }

  function pill(status, extraClass) {
    return '<span class="pill ' + pillClass(status) + (extraClass ? " " + extraClass : "") + '">' + escapeHtml(status) + "</span>";
  }

  function typeLabel(type) {
    return TYPE_LABELS[type] || type;
  }

  function typeLabelLong(type) {
    return TYPE_LABELS_LONG[type] || type;
  }

  /* ---------- Icons ---------- */

  function icon(name, size, strokeWidth) {
    var p = ICON_PATHS[name];
    if (!p) return "";
    var s = size || p.vb;
    return (
      '<svg width="' + s + '" height="' + s + '" viewBox="0 0 ' + p.vb + " " + p.vb + '" fill="none" stroke="currentColor" stroke-width="' +
      (strokeWidth || 1.6) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + p.d + '"/></svg>'
    );
  }

  function sparkline(points, color) {
    return (
      '<svg class="sparkline" viewBox="0 0 80 40" width="72" height="36" fill="none" stroke="' + (color || "#5B2A86") +
      '" stroke-width="2" aria-hidden="true"><polyline points="' + points + '"/></svg>'
    );
  }

  /* ---------- QR (deterministic look-alike, not a scannable code) ---------- */

  function qrSvg(seed, options) {
    var opts = options || {};
    var n = opts.size || 25;
    var hole = !!opts.hole;
    var color = opts.color || "#1F1B2A";
    var h = 7;
    var text = String(seed);
    for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    var s = h || 1;
    function rnd() {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967296;
    }
    var holeStart = Math.floor(n / 2) - 4;
    var holeEnd = holeStart + 9;
    var rects = [];
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var finder = (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
        if (finder) continue;
        if (hole && x >= holeStart && x < holeEnd && y >= holeStart && y < holeEnd) continue;
        if (rnd() < 0.46) rects.push('<rect x="' + x + '" y="' + y + '" width="1" height="1"/>');
      }
    }
    [[0, 0], [n - 7, 0], [0, n - 7]].forEach(function (f) {
      rects.push('<rect x="' + f[0] + '" y="' + f[1] + '" width="7" height="7"/>');
      rects.push('<rect x="' + (f[0] + 1) + '" y="' + (f[1] + 1) + '" width="5" height="5" fill="#fff"/>');
      rects.push('<rect x="' + (f[0] + 2) + '" y="' + (f[1] + 2) + '" width="3" height="3"/>');
    });
    return (
      '<svg viewBox="0 0 ' + n + " " + n + '" width="100%" height="100%" fill="' + color +
      '" shape-rendering="crispEdges" role="img" aria-label="Payment QR code">' + rects.join("") + "</svg>"
    );
  }

  /* ---------- Gift card ---------- */

  function tenantStyle(tenantName) {
    return TENANT_STYLE[tenantName] || TENANT_STYLE["Senja Coffee"];
  }

  function motifHtml(motif) {
    if (motif === "sun") return '<div class="gc-sun"></div><div class="gc-grain"></div>';
    if (motif === "mist") return '<div class="gc-mist-a"></div><div class="gc-mist-b"></div>' + LEAVES_SVG;
    if (motif === "frame") return '<div class="gc-frame-outer"></div><div class="gc-frame-inner"></div><div class="gc-stamp">EX&middot;LIBRIS</div>';
    if (motif === "none") return '<div class="gc-blank"></div>';
    return "";
  }

  /* card: { tenant, name, type, balanceLabel, number, expiry, motif?, art?, ink?, brand? }
     opts: { flipped, action, id, className, flat, dim, ariaLabel } */
  function renderGiftCard(card, options) {
    var c = card || {};
    var opts = options || {};
    var base = tenantStyle(c.tenant);
    var art = c.art || base.art;
    var ink = c.ink || base.ink;
    var brand = c.brand || base.brand;
    var motif = c.motif || base.motif;
    var classes = ["gift-card"];
    if (opts.flipped) classes.push("is-flipped");
    if (opts.flat) classes.push("is-flat");
    if (opts.dim) classes.push("is-dim");
    if (opts.className) classes.push(opts.className);
    var label = typeLabel(c.type);
    var actionAttrs = "";
    if (opts.action) {
      actionAttrs =
        ' data-action="' + attr(opts.action) + '"' + (opts.id != null ? ' data-id="' + attr(opts.id) + '"' : "") +
        ' role="button" tabindex="0" aria-label="' + attr(opts.ariaLabel || (c.tenant + " " + c.name + " card")) + '"';
    }
    var back = opts.noBack
      ? ""
      : '<div class="gc-face gc-back" aria-hidden="' + (opts.flipped ? "false" : "true") + '">' +
        '<div class="gc-back-info">' +
        '<div><div class="gc-back-label">Balance</div><div class="gc-back-balance">' + escapeHtml(c.balanceLabel) + "</div></div>" +
        '<div class="gc-back-number">' + escapeHtml(c.number) + "</div>" +
        '<div class="gc-back-meta"><span class="gc-back-badge">' + escapeHtml(label) + '</span><span class="gc-back-expiry">Expires ' + escapeHtml(c.expiry) + "</span></div>" +
        "</div>" +
        '<div class="gc-qr">' + (opts.flipped || opts.eagerQr ? qrSvg(c.number || "card") : "") + "</div>" +
        "</div>";
    return (
      '<div class="' + classes.join(" ") + '"' + actionAttrs +
      ' style="--card-art:' + attr(art) + ";--card-ink:" + attr(ink) + ";--card-brand:" + attr(brand) + '">' +
      '<div class="gc-inner">' +
      '<div class="gc-face gc-front">' +
      motifHtml(motif) +
      '<div class="gc-top"><div class="gc-tenant"><span class="gc-logo">' + escapeHtml(String(c.tenant || "S").charAt(0)) +
      '</span><span class="gc-tenant-name">' + escapeHtml(c.tenant) + '</span></div><span class="gc-badge">' + escapeHtml(label) + "</span></div>" +
      '<div class="gc-safe"><div class="gc-name">' + escapeHtml(c.name) + '</div><div class="gc-bottom"><div class="gc-balance">' +
      escapeHtml(c.balanceLabel) + '</div><div class="gc-number">' + escapeHtml(c.number) + "</div></div></div>" +
      "</div>" +
      back +
      "</div></div>"
    );
  }

  function renderGiftWrap(cardHtml, mini) {
    if (mini) return '<div class="gift-wrap">' + cardHtml + '<span class="gift-ribbon-mini"></span></div>';
    return (
      '<div class="gift-wrap">' + cardHtml +
      '<div class="gift-ribbon-v"></div><div class="gift-ribbon-h"></div><div class="gift-bow">' + BOW_SVG + "</div></div>"
    );
  }

  /* ---------- Toast ---------- */

  var toastTimer = null;
  var toastHost = null;

  function setToastHost(el) {
    toastHost = el;
  }

  function showToast(message, tone) {
    var host = toastHost || document.body;
    var el = host.querySelector(":scope > .toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      host.appendChild(el);
    }
    var color = TOAST_COLORS[tone] || tone || TOAST_COLORS.success;
    el.style.setProperty("--toast-color", color);
    el.textContent = message;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.hidden = true;
    }, 2700);
  }

  /* ---------- Motion ---------- */

  function animateBalance(el, from, to, duration) {
    if (!el) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ms = reduce ? 1 : duration || 400;
    var start = null;
    var done = false;
    function step(now) {
      if (done) return;
      if (start === null) start = now;
      var k = Math.min(1, (now - start) / ms);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = formatRM(from + (to - from) * eased);
      if (k < 1) requestAnimationFrame(step);
      else done = true;
    }
    requestAnimationFrame(step);
    /* Animation frames pause in background tabs; always land on the final balance. */
    setTimeout(function () {
      if (done) return;
      done = true;
      el.textContent = formatRM(to);
    }, ms + 80);
  }

  /* ---------- Event delegation ----------
     Elements declare data-action="name" (click), data-input="name" (input), data-change="name" (change).
     Handlers receive (element, event). */

  function delegate(root, handlers) {
    var scope = root || document;
    scope.addEventListener("click", function (event) {
      var el = event.target.closest("[data-action]");
      if (!el || !scope.contains(el)) return;
      var fn = handlers[el.getAttribute("data-action")];
      if (!fn) return;
      if (el.tagName === "A") event.preventDefault();
      fn(el, event);
    });
    scope.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      var el = event.target;
      if (!el.matches || !el.matches('[data-action][role="button"]')) return;
      event.preventDefault();
      el.click();
    });
    scope.addEventListener("input", function (event) {
      var el = event.target.closest("[data-input]");
      if (!el) return;
      var fn = handlers[el.getAttribute("data-input")];
      if (fn) fn(el, event);
    });
    scope.addEventListener("change", function (event) {
      var el = event.target.closest("[data-change]");
      if (!el) return;
      var fn = handlers[el.getAttribute("data-change")];
      if (fn) fn(el, event);
    });
  }

  /* ---------- Demo switcher (prototype chrome) ---------- */

  function renderDemoSwitcher(current, extraHtml) {
    var links = [
      ["index.html", "Home", "home"],
      ["foundation.html", "Foundation", "foundation"],
      ["admin.html", "Admin", "admin"],
      ["client.html", "Client", "client"],
      ["customer.html", "Customer", "customer"]
    ];
    var items = links
      .map(function (l) {
        if (l[2] === current) return '<span class="demo-switch-link is-current" aria-current="page">' + l[1] + "</span>";
        return '<a class="demo-switch-link" href="' + l[0] + '">' + l[1] + "</a>";
      })
      .join("");
    return (
      '<div class="demo-switch" data-demo-switch>' +
      '<button type="button" class="demo-switch-toggle" data-action="toggleDemoSwitch" aria-label="Switch demo view">' +
      '<span aria-hidden="true">&#8644;</span></button>' +
      '<div class="demo-switch-menu">' + items + (extraHtml || "") + "</div></div>"
    );
  }

  function toggleDemoSwitch(el) {
    var box = el.closest("[data-demo-switch]");
    if (box) box.classList.toggle("is-open");
  }

  window.UI = {
    TODAY_LABEL: TODAY_LABEL,
    escapeHtml: escapeHtml,
    attr: attr,
    formatRM: formatRM,
    formatRMWhole: formatRMWhole,
    initials: initials,
    pillClass: pillClass,
    pill: pill,
    typeLabel: typeLabel,
    typeLabelLong: typeLabelLong,
    icon: icon,
    sparkline: sparkline,
    qrSvg: qrSvg,
    tenantStyle: tenantStyle,
    renderGiftCard: renderGiftCard,
    renderGiftWrap: renderGiftWrap,
    setToastHost: setToastHost,
    showToast: showToast,
    animateBalance: animateBalance,
    delegate: delegate,
    renderDemoSwitcher: renderDemoSwitcher,
    toggleDemoSwitch: toggleDemoSwitch
  };
})();
