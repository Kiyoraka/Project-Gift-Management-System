/* Login page - hardcoded demo sign in (any email + any password). Requires ui.js and auth.js. */

(function () {
  "use strict";

  var ROLE_INTRO = {
    admin: "Platform admin for all three clients.",
    client: "Merchant console for one tenant.",
    customer: "The gift wallet on your phone."
  };

  var FAN_CARDS = [
    { tenant: "Lumi Spa", name: "Calm Hour", type: "voucher", balanceLabel: "60-min massage", number: "7710 2205 8831 0046", expiry: "Dec 2026" },
    { tenant: "Senja Coffee", name: "Sunrise", type: "fixed", balanceLabel: "RM 100", number: "4021 8830 1194 7702", expiry: "Mar 2027" },
    { tenant: "Page & Ink", name: "First Edition", type: "open", balanceLabel: "RM 35.00", number: "5583 0917 4420 6619", expiry: "Jun 2027" }
  ];

  var params = new URLSearchParams(window.location.search);

  var state = {
    role: Auth.normalizeRole(params.get("role")),
    tenant: Auth.normalizeTenant(params.get("tenant")),
    next: params.get("next"),
    emailEdited: false,
    submitting: false
  };

  var els = {
    form: document.getElementById("loginForm"),
    roleTabs: document.getElementById("roleTabs"),
    tenantField: document.getElementById("tenantField"),
    tenantSelect: document.getElementById("tenantSelect"),
    email: document.getElementById("emailInput"),
    password: document.getElementById("passwordInput"),
    error: document.getElementById("loginError"),
    submit: document.getElementById("submitBtn"),
    intro: document.getElementById("loginIntro"),
    fan: document.getElementById("cardFan"),
    eye: document.querySelector("[data-action='togglePassword']")
  };

  function renderFan() {
    els.fan.innerHTML = FAN_CARDS.map(function (card) {
      return '<div class="fan-card">' + UI.renderGiftCard(card, { noBack: true }) + "</div>";
    }).join("");
  }

  function fillDemoEmail() {
    if (state.emailEdited) return;
    var account = Auth.demoAccount(state.role, state.tenant);
    els.email.value = account ? account.email : "";
  }

  function renderRole() {
    Array.prototype.forEach.call(els.roleTabs.querySelectorAll("button"), function (btn) {
      var active = btn.getAttribute("data-role") === state.role;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    els.tenantField.hidden = state.role !== "client";
    els.tenantSelect.value = state.tenant;
    els.intro.textContent = ROLE_INTRO[state.role];
    fillDemoEmail();
  }

  function renderEye() {
    els.eye.innerHTML = UI.icon("eye", 18);
    var shown = els.password.type === "text";
    els.eye.classList.toggle("is-on", shown);
    els.eye.setAttribute("aria-pressed", shown ? "true" : "false");
    els.eye.setAttribute("aria-label", shown ? "Hide password" : "Show password");
  }

  function destination() {
    var page = Auth.ROLE_PAGES[state.role];
    var next = Auth.safeNext(state.next, state.role);
    if (next !== page) next = page;
    if (state.role === "client") next += "?tenant=" + encodeURIComponent(state.tenant);
    return next;
  }

  function setSubmitting(on) {
    state.submitting = on;
    els.submit.disabled = on;
    els.submit.innerHTML = on ? '<span class="spinner" aria-hidden="true"></span> Signing in&hellip;' : "Sign in";
  }

  UI.delegate(document, {
    setRole: function (el) {
      state.role = Auth.normalizeRole(el.getAttribute("data-role"));
      state.emailEdited = false;
      els.error.hidden = true;
      renderRole();
    },
    setTenant: function (el) {
      state.tenant = Auth.normalizeTenant(el.value);
      state.emailEdited = false;
      renderRole();
    },
    editEmail: function () {
      state.emailEdited = true;
      els.error.hidden = true;
    },
    togglePassword: function () {
      els.password.type = els.password.type === "password" ? "text" : "password";
      renderEye();
    }
  });

  els.password.addEventListener("input", function () {
    els.error.hidden = true;
  });

  els.form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (state.submitting) return;
    var email = els.email.value.trim();
    var password = els.password.value;
    if (!email || !password) {
      els.error.hidden = false;
      (email ? els.password : els.email).focus();
      return;
    }
    els.error.hidden = true;
    setSubmitting(true);
    window.setTimeout(function () {
      Auth.signIn({ role: state.role, tenant: state.tenant, email: email });
      window.location.href = destination();
    }, 600);
  });

  els.password.value = Auth.DEMO_PASSWORD;
  renderFan();
  renderRole();
  renderEye();
})();
