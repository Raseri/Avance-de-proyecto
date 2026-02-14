// App.js - Componente principal de la aplicación
import './styles/main.css';
import './styles/themes.css';
import { renderProductos, cleanupProductos } from './modules/productos/productos.js';
import { renderVentas, cleanupVentas } from './modules/ventas/ventas.js';
import { renderReportes, cleanupReportes } from './modules/reportes/reportes.js';
import { renderDatabase, cleanupDatabase } from './modules/database/database.js';
import { renderLogin } from './modules/auth/Login.js';
import { getCurrentUser, isAuthenticated, logout, isAdmin, isVendedor } from './services/authService.js';

// Estado de la aplicación
const state = {
  currentModule: 'ventas',
  cleanup: null,
  user: null
};

// Renderizar aplicación
export function renderApp() {
  console.log('🚀 Iniciando Tienda Manager V2...');

  try {
    // Verificar autenticación
    if (!isAuthenticated()) {
      renderLoginPage();
      return;
    }

    // Obtener usuario y aplicar tema
    state.user = getCurrentUser();
    applyTheme(state.user.rol);

    // Renderizar app principal
    renderMainApp();
  } catch (error) {
    console.error('❌ Error al renderizar:', error);
    renderError(error.message);
  }
}

// Renderizar página de login
function renderLoginPage() {
  const app = document.querySelector('#app');
  renderLogin(app, () => {
    // Callback cuando login es exitoso
    console.log('✅ Login exitoso, recargando app...');
    renderApp();
  });
}

// Aplicar tema según rol
function applyTheme(rol) {
  document.documentElement.setAttribute('data-theme', rol);
  console.log('🎨 Tema aplicado:', rol);
}

// Renderizar error
function renderError(message) {
  const app = document.querySelector('#app');
  app.innerHTML = `
    <div style="padding: 40px; text-align: center; color: white; background: #1e293b; min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column;">
      <h2 style="color: #ef4444; margin-bottom: 16px;">Error al cargar la aplicación</h2>
      <p style="color: #94a3b8; margin-bottom: 24px;">${message}</p>
      <button onclick="location.reload()" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
        Recargar
      </button>
    </div>
  `;
}

// Renderizar aplicación principal
function renderMainApp() {
  const app = document.querySelector('#app');
  const user = state.user;

  // Determinar módulos disponibles según rol
  const modules = getAvailableModules(user.rol);

  app.innerHTML = `
    <div class="app-layout">
      <!-- Sidebar -->
      <aside class="app-sidebar">
        <div class="app-sidebar-header">
          <h1 class="app-logo">🏪 Tienda Manager</h1>
          <p style="font-size: 12px; color: rgba(255,255,255,0.7); text-align: center; margin-top: 8px;">
            Versión 2.0 Pro
            <span class="role-badge ${user.rol}" style="display: block; margin-top: 8px; padding: 4px 12px; border-radius: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${user.rol === 'admin' ? '👑 Administrador' : '🛍️ Vendedor'}
            </span>
          </p>
        </div>
        
        <nav class="app-nav" id="app-nav">
          ${modules.map(module => `
            <div class="nav-item ${module.id === state.currentModule ? 'active' : ''}" data-module="${module.id}">
              ${module.icon}
              <span>${module.label}</span>
            </div>
          `).join('')}
        </nav>
        
        <div class="app-sidebar-footer" style="margin-top: auto; padding: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px;">
              ${user.avatar || user.nombre.charAt(0)}
            </div>
            <div style="flex: 1; overflow: hidden;">
              <div style="font-weight: 600; color: #ffffff; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${user.nombre}
              </div>
              <div style="font-size: 12px; color: rgba(255,255,255,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${user.email}
              </div>
            </div>
          </div>
          <button id="logout-btn" style="width: 100%; padding: 10px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #fca5a5; font-size: 14px; cursor: pointer; transition: all 0.3s ease;">
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>
      
      <!-- Main content -->
      <main class="app-main">
        <header class="app-header">
          <div class="app-header-content">
            <h2 class="page-title" id="page-title">Punto de Venta</h2>
          </div>
        </header>
        
        <div class="app-content" id="app-content">
          <div style="padding: 40px; text-align: center;">
            <p>Cargando...</p>
          </div>
        </div>
      </main>
    </div>
  `;

  // Configurar navegación
  setupNavigation();

  // Configurar logout
  const logoutBtn = document.querySelector('#logout-btn');
  logoutBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      logout();
    }
  });

  logoutBtn.addEventListener('mouseenter', (e) => {
    e.target.style.background = 'rgba(239, 68, 68, 0.2)';
    e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
  });

  logoutBtn.addEventListener('mouseleave', (e) => {
    e.target.style.background = 'rgba(239, 68, 68, 0.1)';
    e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
  });

  // Cargar módulo inicial
  setTimeout(() => {
    // Si es vendedor, empezar en ventas; si es admin, en reportes
    const initialModule = user.rol === 'vendedor' ? 'ventas' : 'reportes';
    navigateTo(initialModule);
  }, 100);

  console.log('✅ Aplicación renderizada para:', user.nombre, `(${user.rol})`);
}

// Obtener módulos disponibles según rol
function getAvailableModules(rol) {
  const allModules = [
    {
      id: 'ventas',
      label: 'Punto de Venta',
      icon: `<svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>`,
      roles: ['admin', 'vendedor']
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: `<svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z"/>
      </svg>`,
      roles: ['admin', 'vendedor']
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: `<svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
      </svg>`,
      roles: ['admin'] // Solo admin
    },
    {
      id: 'database',
      label: 'Base de Datos',
      icon: `<svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zM4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4zm0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4z"/>
      </svg>`,
      roles: ['admin'] // Solo admin
    }
  ];

  // Filtrar módulos según rol
  return allModules.filter(module => module.roles.includes(rol));
}

// Configurar navegación
function setupNavigation() {
  const nav = document.querySelector('#app-nav');
  if (!nav) return;

  nav.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const module = item.dataset.module;
      navigateTo(module);
    });
  });
}

// Navegar a un módulo
function navigateTo(module) {
  console.log('📍 Navegando a:', module);

  // Verificar permisos
  if (module === 'reportes' && !isAdmin()) {
    console.warn('⚠️ Acceso denegado a reportes (solo admin)');
    return;
  }

  // Cleanup del módulo anterior
  if (state.cleanup) {
    try {
      state.cleanup();
    } catch (error) {
      console.error('Error en cleanup:', error);
    }
    state.cleanup = null;
  }

  // Actualizar estado
  state.currentModule = module;

  // Actualizar UI de navegación
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.dataset.module === module) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Obtener contenedor
  const container = document.querySelector('#app-content');
  const pageTitle = document.querySelector('#page-title');

  if (!container || !pageTitle) {
    console.error('❌ No se encontraron contenedores');
    return;
  }

  // Renderizar módulo
  try {
    switch (module) {
      case 'productos':
        pageTitle.textContent = '📦 Gestión de Productos';
        renderProductos(container);
        state.cleanup = cleanupProductos;
        break;

      case 'ventas':
        pageTitle.textContent = '🛒 Punto de Venta';
        renderVentas(container);
        state.cleanup = cleanupVentas;
        break;

      case 'reportes':
        pageTitle.textContent = '📊 Reportes y Estadísticas';
        renderReportes(container);
        state.cleanup = cleanupReportes;
        break;

      case 'database':
        pageTitle.textContent = '🗄️ Base de Datos';
        renderDatabase(container);
        state.cleanup = cleanupDatabase;
        break;

      default:
        pageTitle.textContent = 'Tienda Manager';
        container.innerHTML = '<p style="padding: 40px; text-align: center;">Módulo no encontrado</p>';
    }
    console.log('✅ Módulo cargado:', module);
  } catch (error) {
    console.error('❌ Error al renderizar módulo:', error);
    container.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h3 style="color: #ef4444; margin-bottom: 16px;">Error al cargar el módulo</h3>
        <p style="color: #94a3b8;">${error.message}</p>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 12px 24px; background: var(--primary-color); color: white; border: none; border-radius: 8px; cursor: pointer;">
          Recargar Página
        </button>
      </div>
    `;
  }
}
