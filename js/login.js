// ============================================================
// LOGIN SIMPLE DE DEMOSTRACION
// ============================================================
const ADMIN_APELLIDO = "Admin";
const ADMIN_DNI = "123456789";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  form?.addEventListener("submit", e => {
    e.preventDefault();
    const apellido = document.getElementById("apellido").value.trim();
    const dni = document.getElementById("dni").value.trim();
    if (apellido === ADMIN_APELLIDO && dni === ADMIN_DNI) {
      sessionStorage.setItem("yms_token", "authenticated_" + Date.now());
      sessionStorage.setItem("yms_user", apellido);
      document.getElementById("loginContainer").style.display = "none";
      document.getElementById("mainContainer").style.display = "block";
    } else document.getElementById("loginError").textContent = "Credenciales inválidas.";
  });
  document.getElementById("btnLogout")?.addEventListener("click", () => { sessionStorage.clear(); location.reload(); });
  if (sessionStorage.getItem("yms_token")) {
    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("mainContainer").style.display = "block";
  }
});
