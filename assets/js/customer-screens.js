/* Customer app - screens (Wallet, Send, Profile, Inbox).
   Placeholder contract until the Wallet and Send tasks land. Exposes a single global: CustomerScreens */

(function () {
  "use strict";

  function placeholder(title) {
    return '<div class="stack"><h1 class="app-title">' + title + '</h1><div class="note-box">This screen is being prepared.</div></div>';
  }

  window.CustomerScreens = {
    wallet: function () { return placeholder("Wallet"); },
    send: function () { return placeholder("Send a gift"); },
    profile: function () { return placeholder("Profile"); },
    inbox: function () { return ""; },
    createActions: function () { return {}; }
  };
})();
