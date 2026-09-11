// ============================================
// MÓDULO LOGIN
// ============================================

const ADMIN_APELLIDO = "Admin";
const ADMIN_DNI = "123456789";

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const apellido = document.getElementById('apellido').value.trim();
    const dni = document.getElementById('dni').value.trim();
    const errorDiv = document.getElementById('loginError');
    
    if (apellido === ADMIN_APELLIDO && dni === ADMIN_DNI) {
        sessionStorage.setItem('yms_token', 'authenticated_' + Date.now());
        sessionStorage.setItem('yms_user', apellido);
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'flex';
        errorDiv.textContent = '';
        initializeApp();
    } else {
        errorDiv.textContent = 'Credenciales inválidas. Pruebe: Admin / 123456789';
    }
});

// Verificar si ya hay sesión activa
function checkSession() {
    const token = sessionStorage.getItem('yms_token');
    if (token) {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'flex';
        initializeApp();
        return true;
    }
    return false;
}

// Logout
document.getElementById('btnLogout').addEventListener('click', function() {
    sessionStorage.removeItem('yms_token');
    sessionStorage.removeItem('yms_user');
    location.reload();
});

// Verificar sesión al cargar
window.addEventListener('load', function() {
    if (!checkSession()) {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('mainContainer').style.display = 'none';
    }
});
