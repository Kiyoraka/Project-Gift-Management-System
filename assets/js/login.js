/* Login page - single sign-in with demo account buttons. Requires ui.js and auth.js.
   Demo buttons sign in instantly; the form accepts any email + any password and routes by email domain. */

(function () {
  "use strict";

  var SIGN_IN_DELAY = 600;

  var FAN_CARDS = [
    { tenant: "Lumi Spa", name: "Calm Hour", type: "voucher", balanceLabel: "60-min massage", number: "7710 2205 8831 0046", expiry: "Dec 2026" },
    { tenant: "Senja Coffee", name: "Sunrise", type: "fixed", balanceLabel: "RM 100", number: "4021 8830 1194 7702", expiry: "Mar 2027" },
    { tenant: "Page & Ink", name: "First Edition", type: "open", balanceLabel: "RM 35.00", number: "5583 0917 4420 6619", expiry: "Jun 2027" }
  ];

  var submitting = false;

  var els = {
    form: document.getElementById("loginForm"),
    email: document.getElementById("emailInput"),
    password: document.getElementById("passwordInput"),
    error: document.getElementById("loginError"),
    submit: document.getElementById("submitBtn"),
    hint: document.getElementById("routeHint"),
    fan: document.getElementById("cardFan"),
    accounts: document.getElementById("demoAccounts"),
    eye: document.querySelector("[data-action='togglePassword']")
  };

  function renderFan() {
    els.fan.innerHTML = FAN_CARDS.map(function (card) {
      return '<div class="fan-card">' + UI.renderGiftCard(card, { noBack: true }) + "</div>";
    }).join("");
  }

  function accountMark(account) {
    if (account.mark) {
      return '<span class="brand-mark" style="--size:38px;--mark:' + account.color + '">' + UI.escapeHtml(account.mark) + "</span>";
    }
    return '<span class="avatar" style="--size:38px;font-size:13px">' + UI.escapeHtml(UI.initials(account.name)) + "</span>";
  }

  function renderAccounts() {
    els.accounts.innerHTML = Auth.ACCOUNT_ORDER.map(function (key) {
      var a = Auth.ACCOUNTS[key];
      return (
        '<button type="button" class="demo-account" data-action="demoSignIn" data-account="' + key + '" aria-label="Sign in as ' +
        UI.escapeHtml(a.label + ", " + a.sub) + '">' + accountMark(a) +
        '<span class="demo-account-text"><span class="demo-account-label">' + UI.escapeHtml(a.label) + "</span>" +
        '<span class="demo-account-sub">' + UI.escapeHtml(a.sub) + "</span></span></button>"
      );
    }).join("");
  }

  function renderEye() {
    var shown = els.password.type === "text";
    els.eye.innerHTML = UI.icon("eye", 18);
    els.eye.classList.toggle("is-on", shown);
    els.eye.setAttribute("aria-pressed", shown ? "true" : "false");
    els.eye.setAttribute("aria-label", shown ? "Hide password" : "Show password");
  }

  function renderHint() {
    var value = els.email.value.trim();
    els.hint.textContent = value.indexOf("@") > 0
      ? "Opens: " + Auth.resolveEmail(value).label
      : "Opens the app that matches your email";
  }

  function setBusy(trigger) {
    submitting = true;
    els.submit.disabled = true;
    Array.prototype.forEach.call(els.accounts.querySelectorAll("button"), function (b) { b.disabled = true; });
    if (trigger === els.submit) {
      els.submit.innerHTML = '<span class="spinner" aria-hidden="true"></span> Signing in&hellip;';
    } else {
      trigger.classList.add("is-loading");
      trigger.querySelector(".demo-account-sub").innerHTML = '<span class="spinner spinner-sm" aria-hidden="true"></span> Signing in&hellip;';
    }
  }

  function finish(session) {
    window.location.href = Auth.destinationFor(session);
  }

  UI.delegate(document, {
    demoSignIn: function (el) {
      if (submitting) return;
      els.error.hidden = true;
      setBusy(el);
      var key = el.getAttribute("data-account");
      window.setTimeout(function () {
        finish(Auth.signInWithAccount(key));
      }, SIGN_IN_DELAY);
    },
    editEmail: function () {
      els.error.hidden = true;
      renderHint();
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
    if (submitting) return;
    var email = els.email.value.trim();
    if (!email || !els.password.value) {
      els.error.hidden = false;
      (email ? els.password : els.email).focus();
      return;
    }
    els.error.hidden = true;
    setBusy(els.submit);
    window.setTimeout(function () {
      finish(Auth.signIn({ email: email }));
    }, SIGN_IN_DELAY);
  });

  renderFan();
  renderAccounts();
  renderEye();
})();
