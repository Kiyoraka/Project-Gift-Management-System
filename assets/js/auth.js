/* Gift Management System - hardcoded demo authentication (single sign-in).
   One session for the whole prototype. Sign in with a demo account button, or type any email and any password:
   @giftwell.my -> Admin, @senjacoffee.my / @lumispa.my / @pageandink.my -> that merchant's Client console,
   any other email -> Customer app. Nothing is verified; this exists so testers can reach each app quickly.
   Exposes a single global: Auth */

(function () {
  "use strict";

  var STORAGE_KEY = "gms.session";
  var LEGACY_KEYS = ["gms.session.admin", "gms.session.client", "gms.session.customer"];
  var ROLES = ["admin", "client", "customer"];
  var ROLE_PAGES = { admin: "admin.html", client: "client.html", customer: "customer.html" };
  var TENANT_KEYS = ["senja", "lumi", "page"];
  var DEMO_PASSWORD = "demo1234";

  var TENANT_DOMAINS = { "senjacoffee.my": "senja", "lumispa.my": "lumi", "pageandink.my": "page" };
  var ADMIN_DOMAIN = "giftwell.my";

  var ACCOUNTS = {
    admin: { key: "admin", label: "Admin", sub: "Giftwell platform", role: "admin", email: "alice@giftwell.my", name: "Alice Kwan", title: "Super admin", mark: "G", color: "#5B2A86" },
    client: { key: "client", label: "Client", sub: "Senja Coffee", role: "client", tenant: "senja", email: "farid@senjacoffee.my", name: "Farid Senja", title: "Owner", mark: "S", color: "#C2603E" },
    customer1: { key: "customer1", label: "Customer 1", sub: "Aisyah Rahman", role: "customer", customer: "aisyah", email: "aisyah.r@gmail.com", name: "Aisyah Rahman", title: "Customer" },
    customer2: { key: "customer2", label: "Customer 2", sub: "Wei Ling Tan", role: "customer", customer: "weiling", email: "weiling.tan@gmail.com", name: "Wei Ling Tan", title: "Customer" }
  };

  var ACCOUNT_ORDER = ["admin", "client", "customer1", "customer2"];

  var KNOWN_PEOPLE = {
    "alice@giftwell.my": { name: "Alice Kwan", title: "Super admin" },
    "marcus@giftwell.my": { name: "Marcus Tan", title: "Admin" },
    "farid@senjacoffee.my": { name: "Farid Senja", title: "Owner" },
    "clara@lumispa.my": { name: "Clara Wong", title: "Owner" },
    "jonas@pageandink.my": { name: "Jonas Lim", title: "Owner" },
    "aisyah.r@gmail.com": { name: "Aisyah Rahman", title: "Customer" },
    "weiling.tan@gmail.com": { name: "Wei Ling Tan", title: "Customer" }
  };

  var TENANT_NAMES = { senja: "Senja Coffee", lumi: "Lumi Spa", page: "Page & Ink" };

  function normalizeRole(role) {
    return ROLES.indexOf(role) >= 0 ? role : "customer";
  }

  function normalizeTenant(tenant) {
    return TENANT_KEYS.indexOf(tenant) >= 0 ? tenant : "senja";
  }

  /* ---------- Storage (localStorage, wrapped so blocked storage never breaks the demo) ---------- */

  function readSession() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return undefined;
    }
  }

  function writeSession(session) {
    try {
      LEGACY_KEYS.forEach(function (k) { window.localStorage.removeItem(k); });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return true;
    } catch (err) {
      return false;
    }
  }

  function clearSession() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      LEGACY_KEYS.forEach(function (k) { window.localStorage.removeItem(k); });
    } catch (err) {
      /* storage blocked - nothing to clear */
    }
  }

  /* ---------- Email routing ---------- */

  function titleCase(word) {
    return word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : "";
  }

  function nameFromEmail(email) {
    var value = String(email || "").trim().toLowerCase();
    if (KNOWN_PEOPLE[value]) return KNOWN_PEOPLE[value].name;
    var local = value.split("@")[0] || "";
    var name = local.split(/[._\-+]+/).filter(Boolean).map(titleCase).join(" ");
    return name || "Demo user";
  }

  /* Decides where a typed email goes. */
  function resolveEmail(email) {
    var value = String(email || "").trim().toLowerCase();
    var domain = value.indexOf("@") >= 0 ? value.split("@").pop() : "";
    if (domain === ADMIN_DOMAIN) return { role: "admin", label: "Admin console" };
    if (TENANT_DOMAINS[domain]) {
      var tenant = TENANT_DOMAINS[domain];
      return { role: "client", tenant: tenant, label: "Client console · " + TENANT_NAMES[tenant] };
    }
    var customer = value === ACCOUNTS.customer2.email ? "weiling" : "aisyah";
    return { role: "customer", customer: customer, label: "Customer app" + (customer === "weiling" ? " · Wei Ling’s wallet" : "") };
  }

  function buildSession(email, route) {
    var value = String(email || "").trim();
    var known = KNOWN_PEOPLE[value.toLowerCase()];
    var fallbackTitle = { admin: "Admin", client: "Staff", customer: "Customer" }[route.role];
    return {
      role: route.role,
      email: value,
      name: nameFromEmail(value),
      title: known ? known.title : fallbackTitle,
      tenant: route.role === "client" ? normalizeTenant(route.tenant) : null,
      customer: route.role === "customer" ? route.customer || "aisyah" : null,
      signedInAt: new Date().toISOString()
    };
  }

  function sessionFromAccount(account) {
    return {
      role: account.role,
      email: account.email,
      name: account.name,
      title: account.title,
      tenant: account.tenant || null,
      customer: account.customer || null,
      signedInAt: new Date().toISOString()
    };
  }

  /* ---------- Public API ---------- */

  /* Accepts ANY non-empty email and password (hardcoded demo). */
  function signIn(details) {
    var session = buildSession(details.email, resolveEmail(details.email));
    writeSession(session);
    return session;
  }

  function signInWithAccount(key) {
    var account = ACCOUNTS[key] || ACCOUNTS.customer1;
    var session = sessionFromAccount(account);
    writeSession(session);
    return session;
  }

  function destinationFor(session) {
    var page = ROLE_PAGES[normalizeRole(session.role)];
    if (session.role === "client") page += "?tenant=" + encodeURIComponent(normalizeTenant(session.tenant));
    return page;
  }

  function getSession() {
    return readSession() || null;
  }

  /* Returns the session when it belongs to this app, otherwise sends the tester to the single sign-in page.
     If storage is blocked the page renders with that app's demo account instead of looping. */
  function requireSession(role, page) {
    var r = normalizeRole(role);
    var session = readSession();
    if (session === undefined) {
      var key = r === "customer" ? "customer1" : r;
      var fallback = sessionFromAccount(ACCOUNTS[key]);
      fallback.fallback = true;
      return fallback;
    }
    if (!session || session.role !== r) {
      window.location.replace("login.html?next=" + encodeURIComponent(page || ROLE_PAGES[r]));
      return null;
    }
    return session;
  }

  function updateSession(role, changes) {
    var session = readSession();
    if (!session || session.role !== normalizeRole(role)) return;
    Object.keys(changes).forEach(function (k) { session[k] = changes[k]; });
    writeSession(session);
  }

  function signOut() {
    clearSession();
    window.location.href = "login.html";
  }

  window.Auth = {
    ROLES: ROLES,
    ROLE_PAGES: ROLE_PAGES,
    ACCOUNTS: ACCOUNTS,
    ACCOUNT_ORDER: ACCOUNT_ORDER,
    DEMO_PASSWORD: DEMO_PASSWORD,
    normalizeRole: normalizeRole,
    normalizeTenant: normalizeTenant,
    nameFromEmail: nameFromEmail,
    resolveEmail: resolveEmail,
    signIn: signIn,
    signInWithAccount: signInWithAccount,
    destinationFor: destinationFor,
    getSession: getSession,
    requireSession: requireSession,
    updateSession: updateSession,
    signOut: signOut
  };
})();
