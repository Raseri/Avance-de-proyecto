// Login.js - Componente de inicio de sesión
import './login.css';
import { login } from '../../services/authService.js';

export function renderLogin(container, onLoginSuccess) {
  container.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">🏪</div>
          <h1 class="auth-title">Tienda Manager</h1>
          <p class="auth-subtitle">Inicia sesión para continuar</p>
        </div>

        <form class="auth-form" id="login-form">
          <div id="error-message" style="display: none;"></div>

          <div class="form-group">
            <label class="form-label" for="email">
              Correo Electrónico
              <span class="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              class="form-input"
              placeholder="tu@email.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">
              Contraseña
              <span class="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              class="form-input"
              placeholder="••••••••"
              required
              autocomplete="current-password"
            />
          </div>

          <div class="form-options">
            <label class="form-checkbox">
              <input type="checkbox" id="remember" />
              <span>Recordarme</span>
            </label>
            <a href="#" class="form-link" id="forgot-password">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" class="btn-auth" id="login-btn">
            Iniciar Sesión
          </button>

          <div class="auth-divider">O</div>

          <button type="button" class="btn-auth btn-auth-secondary" id="demo-admin-btn">
            Acceso Rápido Admin
          </button>

          <button type="button" class="btn-auth btn-auth-secondary" id="demo-vendedor-btn">
            Acceso Rápido Vendedor
          </button>
        </form>

        <div class="auth-footer">
          ¿No tienes cuenta?
          <a href="#" id="goto-register">Regístrate aquí</a>
        </div>

        <div style="margin-top: 32px; padding: 20px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 12px; font-size: 12px; color: #94a3b8; font-weight: 600;">
            🔐 FORMA DE ACCEDER
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="text-align: center; padding: 12px; background: rgba(102, 126, 234, 0.1); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 8px;">
              <div style="font-size: 11px; color: #a5b4fc; margin-bottom: 8px; font-weight: 600;">👑 ADMINISTRADOR</div>
              <div style="font-size: 12px; color: #e2e8f0; margin-bottom: 4px;">📧 admin@tienda.com</div>
              <div style="font-size: 12px; color: #e2e8f0;">🔑 admin123</div>
            </div>
            <div style="text-align: center; padding: 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px;">
              <div style="font-size: 11px; color: #6ee7b7; margin-bottom: 8px; font-weight: 600;">🛍️ VENDEDOR</div>
              <div style="font-size: 12px; color: #e2e8f0; margin-bottom: 4px;">📧 vendedor@tienda.com</div>
              <div style="font-size: 12px; color: #e2e8f0;">🔑 vendedor123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Elementos del formulario
  const form = container.querySelector('#login-form');
  const emailInput = container.querySelector('#email');
  const passwordInput = container.querySelector('#password');
  const rememberCheckbox = container.querySelector('#remember');
  const loginBtn = container.querySelector('#login-btn');
  const errorMessage = container.querySelector('#error-message');
  const gotoRegister = container.querySelector('#goto-register');
  const demoAdminBtn = container.querySelector('#demo-admin-btn');
  const demoVendedorBtn = container.querySelector('#demo-vendedor-btn');
  const forgotPassword = container.querySelector('#forgot-password');

  // Función para mostrar error
  function showError(message) {
    errorMessage.innerHTML = `
      <div class="form-error">
        <span>❌</span>
        <span>${message}</span>
      </div>
    `;
    errorMessage.style.display = 'block';
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 5000);
  }

  // Función para mostrar loading
  function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.innerHTML = isLoading
      ? '<span class="spinner"></span> Iniciando sesión...'
      : 'Iniciar Sesión';
  }

  // Handle login submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const remember = rememberCheckbox.checked;

    if (!email || !password) {
      showError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      // Llamada real a la API usando authService
      const result = await login(email, password, remember);

      if (result.success) {
        // Success
        onLoginSuccess();
      } else {
        showError(result.error || 'Error al iniciar sesión');
        setLoading(false);
      }
    } catch (error) {
      showError(error.message || 'Error al iniciar sesión');
      setLoading(false);
    }
  });

  // Demo buttons
  demoAdminBtn.addEventListener('click', async () => {
    emailInput.value = 'admin@tienda.com';
    passwordInput.value = 'admin123';
    form.dispatchEvent(new Event('submit'));
  });

  demoVendedorBtn.addEventListener('click', async () => {
    emailInput.value = 'vendedor@tienda.com';
    passwordInput.value = 'vendedor123';
    form.dispatchEvent(new Event('submit'));
  });

  // Forgot password
  forgotPassword.addEventListener('click', (e) => {
    e.preventDefault();
    showError('Funcionalidad en desarrollo. Contacta al administrador.');
  });

  // Go to register
  gotoRegister.addEventListener('click', (e) => {
    e.preventDefault();
    // Import and render register
    import('./Register.js').then(({ renderRegister }) => {
      renderRegister(container, onLoginSuccess);
    });
  });
}

// Cleanup
export function cleanupLogin() {
  // No hay listeners globales que limpiar
}
