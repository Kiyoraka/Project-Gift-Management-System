/* Landing page - hero card fan, merchant and card-type showcases, mobile menu, signed-in shortcut.
   Requires ui.js and auth.js. */

(function () {
  "use strict";

  var HERO_CARDS = [
    { tenant: "Lumi Spa", name: "Calm Hour", type: "voucher", balanceLabel: "60-min massage", number: "7710 2205 8831 0046", expiry: "Dec 2026" },
    { tenant: "Senja Coffee", name: "Sunrise", type: "fixed", balanceLabel: "RM 100", number: "4021 8830 1194 7702", expiry: "Mar 2027" },
    { tenant: "Page & Ink", name: "First Edition", type: "open", balanceLabel: "RM 35.00", number: "5583 0917 4420 6619", expiry: "Jun 2027" }
  ];

  var CARD_TYPES = [
    { card: { tenant: "Senja Coffee", name: "Sunrise", type: "fixed", balanceLabel: "RM 100", number: "4021 8830 1194 7702", expiry: "Mar 2027" },
      title: "Fixed Value", text: "A preset amount like RM 50, 100 or 200. The counter enters what you spend and the balance counts down." },
    { card: { tenant: "Page & Ink", name: "First Edition", type: "open", balanceLabel: "RM 35.00", number: "5583 0917 4420 6619", expiry: "Jun 2027" },
      title: "Open Value", text: "Any amount from RM 10 to RM 1,000. Short at the counter? Top up through the merchant's gateway and pay." },
    { card: { tenant: "Lumi Spa", name: "Calm Hour", type: "voucher", balanceLabel: "60-min massage", number: "7710 2205 8831 0046", expiry: "Dec 2026" },
      title: "Voucher", text: "One specific item or service. No amount to type, a single tap redeems it at the counter." }
  ];

  function renderHeroCards() {
    var host = document.getElementById("heroCards");
    if (!host) return;
    host.innerHTML = HERO_CARDS.map(function (card) {
      return '<div class="hero-card">' + UI.renderGiftCard(card, { noBack: true }) + "</div>";
    }).join("");
  }

  function renderCardTypes() {
    var host = document.getElementById("cardTypes");
    if (!host) return;
    host.innerHTML = CARD_TYPES.map(function (t, i) {
      return (
        '<article class="type-card">' +
        UI.renderGiftCard(t.card, { action: "flipType", id: i, ariaLabel: t.title + " example card, tap to flip" }) +
        "<h3>" + UI.escapeHtml(t.title) + "</h3><p>" + UI.escapeHtml(t.text) + "</p></article>"
      );
    }).join("");
  }

  function renderIcons() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-icon]"), function (el) {
      el.innerHTML = UI.icon(el.getAttribute("data-icon"), Number(el.getAttribute("data-size")) || 22, 1.8);
    });
  }

  /* If a demo session already exists, offer a direct way back into that app. */
  function renderSessionShortcut() {
    var session = Auth.getSession();
    if (!session) return;
    var names = { admin: "Admin console", client: "Client console", customer: "Customer app" };
    ["openAppLink", "openAppMenuLink"].forEach(function (id) {
      var link = document.getElementById(id);
      if (!link) return;
      link.href = Auth.destinationFor(session);
      link.textContent = "Open " + (names[session.role] || "app");
      link.hidden = false;
    });
  }

  function setMenuOpen(open) {
    var menu = document.getElementById("mobileMenu");
    var toggle = document.querySelector("[data-action='toggleMenu']");
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.innerHTML = open ? '<span aria-hidden="true" style="font-size:20px;line-height:1">&times;</span>' : UI.icon("menu", 18, 2);
  }

  UI.delegate(document, {
    toggleMenu: function () {
      setMenuOpen(!document.getElementById("mobileMenu").classList.contains("is-open"));
    },
    closeMenu: function () {
      setMenuOpen(false);
    },
    flipType: function (el) {
      el.classList.toggle("is-flipped");
      var qr = el.querySelector(".gc-qr");
      if (qr && !qr.innerHTML) qr.innerHTML = UI.qrSvg(el.querySelector(".gc-number").textContent);
    }
  });

  var header = document.getElementById("siteHeader");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  renderHeroCards();
  renderCardTypes();
  renderIcons();
  renderSessionShortcut();
  setMenuOpen(false);
  onScroll();
})();
