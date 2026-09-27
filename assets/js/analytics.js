(function () {
  var VISITOR_KEY = "magazin-visitor-id";
  var LAST_VISIT_KEY = "magazin-last-visit";
  var SESSION_KEY = "magazin-session";

  function getVisitorId() {
    try {
      var id = localStorage.getItem(VISITOR_KEY);
      if (id) return id;
      id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(VISITOR_KEY, id);
      return id;
    } catch (_) {
      return "anon_" + Math.random().toString(36).slice(2, 8);
    }
  }

  function isReturning() {
    try {
      return !!localStorage.getItem(LAST_VISIT_KEY);
    } catch (_) {
      return false;
    }
  }

  function markVisited() {
    try {
      localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
    } catch (_) {}
  }

  function getSessionId() {
    try {
      var s = sessionStorage.getItem(SESSION_KEY);
      if (s) return s;
      s = "s_" + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, s);
      return s;
    } catch (_) {
      return "s_" + Date.now().toString(36);
    }
  }

  function getSource() {
    var ref = document.referrer || "";
    if (!ref) return "direct";
    if (ref.indexOf("t.me") !== -1 || ref.indexOf("telegram") !== -1) return "telegram";
    if (ref.indexOf("google") !== -1) return "google";
    if (ref.indexOf("facebook") !== -1 || ref.indexOf("fb.com") !== -1) return "facebook";
    if (ref.indexOf("instagram") !== -1) return "instagram";
    if (ref.indexOf("vse-v-morozilke") !== -1) return "internal";
    try {
      var hostname = new URL(ref).hostname;
      return hostname || "other";
    } catch (_) {
      return "other";
    }
  }

  async function sendPageview() {
    try {
      var cfg = {};
      try {
        var raw = sessionStorage.getItem("magazin-site-config");
        if (raw) cfg = JSON.parse(raw);
      } catch (_) {}
      var url = cfg.googleWebAppUrl;
      // catalog.js пишет magazin-site-config асинхронно, поэтому на первой загрузке
      // вкладки конфига в sessionStorage ещё нет и pageview молча терялся.
      // Читаем config.json напрямую как запасной вариант.
      if (!url) {
        try {
          var res = await fetch("assets/data/config.json", { cache: "no-store" });
          if (res && res.ok) {
            cfg = await res.json();
            url = cfg.googleWebAppUrl;
            try {
              sessionStorage.setItem("magazin-site-config", JSON.stringify(cfg));
            } catch (_) {}
          }
        } catch (_) {}
      }
      if (!url) return;

      var page = location.pathname + location.search;
      var returning = isReturning();
      var payload = JSON.stringify({
        action: "trackPageview",
        visitor_id: getVisitorId(),
        session_id: getSessionId(),
        page: page,
        referrer: document.referrer || "",
        source: getSource(),
        returning: returning,
        ua: navigator.userAgent || "",
        screen: screen.width + "x" + screen.height
      });

      markVisited();

      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: "POST",
          mode: "cors",
          redirect: "follow",
          body: payload,
          headers: { "Content-Type": "text/plain;charset=utf-8" }
        }).catch(function () {});
      }
    } catch (_) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sendPageview);
  } else {
    sendPageview();
  }
})();
