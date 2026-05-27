(function () {
  const ADMIN_SESSION = "magazin-admin-ok";
  const ADMIN_PASS = "1304";

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

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const pass = passInput ? passInput.value : "";
      if (pass === ADMIN_PASS) {
        setAuthed(true);
        if (errEl) errEl.textContent = "";
        if (passInput) passInput.value = "";
        showApp();
        window.dispatchEvent(new Event("magazin-admin-ready"));
        return;
      }
      if (errEl) errEl.textContent = "Невірний пароль";
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
