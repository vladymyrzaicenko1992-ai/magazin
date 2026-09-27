(function () {
  const ADMIN_SESSION = "magazin-admin-ok";
  const SECRET_KEY = "magazin-admin-secret";

  const loginEl = document.getElementById("adminLogin");
  const appEl = document.getElementById("adminApp");
  const form = document.getElementById("adminLoginForm");
  const passInput = document.getElementById("adminPassword");
  const errEl = document.getElementById("adminLoginError");
  const logoutBtn = document.getElementById("adminLogoutBtn");

  function showLogin() {
    if (loginEl) loginEl.hidden = false;
    if (appEl) appEl.hidden = true;
  }

  function showApp() {
    if (loginEl) loginEl.hidden = true;
    if (appEl) appEl.hidden = false;
  }

  function isAuthed() {
    try {
      return sessionStorage.getItem(ADMIN_SESSION) === "1";
    } catch (_) {
      return false;
    }
  }

  function setAuthed(ok) {
    try {
      if (ok) sessionStorage.setItem(ADMIN_SESSION, "1");
      else sessionStorage.removeItem(ADMIN_SESSION);
    } catch (_) {}
  }

  async function apiUrl() {
    try {
      const res = await fetch("assets/data/config.json", { cache: "no-store" });
      const cfg = await res.json();
      return cfg.googleWebAppUrl || "";
    } catch (_) {
      return "";
    }
  }

  // Ключ проверяет СЕРВЕР — самого ключа в коде сайта нет.
  // Тот же ключ нужен для записи каталога, поэтому запоминаем его в браузере.
  async function checkSecret(secret) {
    const url = await apiUrl();
    if (!url) return { ok: false, error: "Не налаштовано адресу сервера (config.json)" };
    try {
      const res = await fetch(
        url + (url.includes("?") ? "&" : "?") + "action=check-secret&secret=" + encodeURIComponent(secret),
        { cache: "no-store" }
      );
      return await res.json();
    } catch (err) {
      return { ok: false, error: "Немає звʼязку з сервером" };
    }
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pass = passInput ? passInput.value.trim() : "";
      const btn = form.querySelector("button");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Перевіряємо…";
      }
      const data = await checkSecret(pass);
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Увійти";
      }
      if (data && data.ok) {
        setAuthed(true);
        try {
          localStorage.setItem(SECRET_KEY, pass);
        } catch (_) {}
        if (errEl) errEl.textContent = "";
        if (passInput) passInput.value = "";
        showApp();
        window.dispatchEvent(new Event("magazin-admin-ready"));
        return;
      }
      if (errEl) errEl.textContent = (data && data.error) || "Невірний ключ";
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      setAuthed(false);
      showLogin();
    });
  }

  if (isAuthed()) showApp();
  else showLogin();
})();
