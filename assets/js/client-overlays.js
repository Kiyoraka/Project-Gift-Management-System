/* Client Console - overlays (Payment QR popup, Add Gateway drawer).
   Placeholder contract until the overlays task lands. Exposes a single global: ClientOverlays */

(function () {
  "use strict";

  window.ClientOverlays = {
    render: function () { return ""; },
    afterRender: function () {},
    onOpen: function () {
      UI.showToast("Payment QR popup is being prepared", "info");
    },
    onClose: function () {},
    createActions: function () { return {}; }
  };
})();
