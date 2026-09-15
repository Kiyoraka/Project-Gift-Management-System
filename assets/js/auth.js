/* Gift Management System - hardcoded demo authentication.
   Any email and any password signs in. Nothing is verified; this exists so testers can reach each app quickly.
   One session per role is kept in localStorage so the demo switcher can jump between apps.
   Exposes a single global: Auth */

(function () {
  "use strict";

  var STORAGE_PREFIX = "gms.session.";
  var ROLES = ["admin", "client", "customer"];
  var ROLE_PAGES = { admin: "admin.html", client: "client.html", customer: "customer.html" };
  var TENANT_KEYS = ["senja", "lumi", "page"];

  var DEMO_ACCOUNTS = {
    admin: { email: "alice@giftwell.my", name: "Alice Kwan", title: "Super admin" },
    customer: { email: "aisyah.r@gmail.com", name: "Aisyah Rahman", title: "Customer" },
    client: {
      senja: { email: "farid@senjacoffee.my", name: "Farid Senja", title: "Owner" },
      lumi: { email: "clara@lumispa.my", name: "Clara Wong", title: "Owner" },
      page: { email: "jonas@pageandink.my", name: "Jonas Lim", title: "Owner" }
    }
  };

  var DEMO_PASSWORD = "demo1234";

  function normalizeRole(role) {
    return ROLES.indexOf(role) >= 0 ? role : "admin";
  }

  function normalizeTenant(tenant) {
    return TENANT_KEYS.indexOf(tenant) >= 0 ? tenant : "senja";
  }

  function demoAccount(role, tenant) {
    var r = normalizeRole(role);
    if (r === "client") return DEMO_ACCOUNTS.client[normalizeTenant(tenant)];
    return DEMO_ACCOUNTS[r];
  }

  function readSession(role) {
    try {
      var raw = window.localStorage.getItem(STORAGE_PREFIX + role);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return undefined;
    }
  }

  function writeSession(role, session) {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + role, JSON.stringify(session));
      return true;
    } catch (err) {
      return false;
    }
  }

  function clearSession(role) {
    try {
      window.localStorage.removeItem(STORAGE_PREFIX + role);
    } catch (err) {
      /* storage blocked - nothing to clear */
    }
  }

  function titleCase(word) {
    return word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : "";
  }

  /* Known demo email -> its sample name; any other email -> a readable name from the local part. */
  function nameFromEmail(email, role, tenant) {
    var value = String(email || "").trim().toLowerCase();
    var known = demoAccount(role, tenant);
    if (known && known.email === value) return known.name;
    var local = value.split("@")[0] || "Demo user";
    var name = local
      .split(/[._\-+]+/)
      .filter(Boolean)
      .map(titleCase)
      .join(" ");
    return name || "Demo user";
  }

  function safeNext(next, role) {
    var pages = Object.keys(ROLE_PAGES).map(function (k) { return ROLE_PAGES[k]; });
    return pages.indexOf(next) >= 0 ? next : ROLE_PAGES[normalizeRole(role)];
  }

  function loginUrl(role, next, tenant) {
    var params = "role=" + encodeURIComponent(role) + "&next=" + encodeURIComponent(next || ROLE_PAGES[role]);
    if (role === "client" && tenant) params += "&tenant=" + encodeURIComponent(tenant);
    return "login.html?" + params;
  }

  /* Accepts ANY non-empty email and password (hardcoded demo). */
  function signIn(details) {
    var role = normalizeRole(details.role);
    var tenant = role === "client" ? normalizeTenant(details.tenant) : null;
    var email = String(details.email || "").trim();
    var account = demoAccount(role, tenant);
    var session = {
      role: role,
      email: email,
      name: nameFromEmail(email, role, tenant),
      title: account ? account.title : "",
      tenant: tenant,
      signedInAt: new Date().toISOString()
    };
    writeSession(role, session);
    return session;
  }

  /* Returns the session for this role, or redirects to login and returns null.
     If storage is blocked (private mode, file:// restrictions) the page renders with the demo account instead of looping. */
  function requireSession(role, page) {
    var r = normalizeRole(role);
    var session = readSession(r);
    if (session === undefined) {
      var fallback = demoAccount(r, "senja");
      return { role: r, email: fallback.email, name: fallback.name, title: fallback.title, tenant: r === "client" ? "senja" : null, fallback: true };
    }
    if (!session || session.role !== r) {
      var tenantParam = null;
      if (r === "client") {
        var params = new URLSearchParams(window.location.search);
        tenantParam = params.get("tenant");
      }
      window.location.replace(loginUrl(r, page || ROLE_PAGES[r], tenantParam));
      return null;
    }
    return session;
  }

  function updateSession(role, changes) {
    var r = normalizeRole(role);
    var session = readSession(r);
    if (!session) return;
    Object.keys(changes).forEach(function (k) { session[k] = changes[k]; });
    writeSession(r, session);
  }

  function signOut(role) {
    var r = normalizeRole(role);
    clearSession(r);
    window.location.href = loginUrl(r, ROLE_PAGES[r]);
  }

  window.Auth = {
    ROLES: ROLES,
    ROLE_PAGES: ROLE_PAGES,
    DEMO_PASSWORD: DEMO_PASSWORD,
    demoAccount: demoAccount,
    normalizeRole: normalizeRole,
    normalizeTenant: normalizeTenant,
    safeNext: safeNext,
    loginUrl: loginUrl,
    signIn: signIn,
    requireSession: requireSession,
    updateSession: updateSession,
    signOut: signOut,
    nameFromEmail: nameFromEmail
  };
})();
