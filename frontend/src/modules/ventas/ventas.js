// ventas.js - Módulo de punto de venta (POS)
import './ventas.css';
import { createCarritoItem } from './CarritoItem.js';
import { createButton } from '../../components/Button.js';
import { showModal } from '../../components/Modal.js';
import { createInput } from '../../components/Input.js';
import { obtenerProductosActivos } from '../../services/productosService.js';
import { registrarVenta } from '../../services/ventasService.js';
import { formatCurrency } from '../../utils/formatters.js';

let productos = [];
let carrito = [];
let unsubscribe = null;

// Renderizar vista de ventas
export function renderVentas(container) {
    container.innerHTML = '';
    container.className = 'app-content';

    const ventasContainer = document.createElement('div');
    ventasContainer.className = 'ventas-container';

    // Panel izquierdo: Productos
    const productosPanel = crearPanelProductos();

    // Panel derecho: Carrito
    const carritoPanel = crearPanelCarrito();

    ventasContainer.appendChild(productosPanel);
    ventasContainer.appendChild(carritoPanel);
    container.appendChild(ventasContainer);

    // Cargar productos
    cargarProductos();
}

// Crear panel de productos
function crearPanelProductos() {
    const panel = document.createElement('div');
    panel.className = 'ventas-productos';

    // Búsqueda
    const searchContainer = document.createElement('div');
    searchContainer.className = 'ventas-search';
    searchContainer.innerHTML = `
    <div class="ventas-search-icon">🔍</div>
    <input type="text" id="search-ventas" placeholder="Buscar productos..." />
  `;

    // Lista de productos
    const lista = document.createElement('div');
    lista.className = 'productos-list';
    lista.id = 'productos-ventas-list';

    panel.appendChild(searchContainer);
    panel.appendChild(lista);

    // Event listener para búsqueda
    searchContainer.querySelector('#search-ventas').addEventListener('input', (e) => {
        filtrarYRenderizarProductos(e.target.value);
    });

    return panel;
}

// Crear panel de carrito
function crearPanelCarrito() {
    const panel = document.createElement('div');
    panel.className = 'ventas-carrito';

    // Header
    const header = document.createElement('div');
    header.className = 'carrito-header';
    header.innerHTML = '<h2 class="carrito-title">🛒 Carrito</h2>';

    // Items
    const items = document.createElement('div');
    items.className = 'carrito-items';
    items.id = 'carrito-items';

    // Resumen
    const resumen = document.createElement('div');
    resumen.className = 'carrito-resumen';
    resumen.id = 'carrito-resumen';

    // Pago
    const pago = document.createElement('div');
    pago.className = 'carrito-pago';
    pago.id = 'carrito-pago';

    panel.appendChild(header);
    panel.appendChild(items);
    panel.appendChild(resumen);
    panel.appendChild(pago);

    return panel;
}

// Cargar productos desde Firebase
async function cargarProductos() {
    productos = await obtenerProductosActivos();
    filtrarYRenderizarProductos('');
}

// Filtrar y renderizar productos
function filtrarYRenderizarProductos(query) {
    const q = query.toLowerCase().trim();
    const productosFiltrados = productos.filter(p =>
        p.stock > 0 && (
            !q ||
            p.nombre.toLowerCase().includes(q) ||
            (p.codigo && p.codigo.toLowerCase().includes(q))
        )
    );

    const lista = document.querySelector('#productos-ventas-list');
    lista.innerHTML = '';

    if (productosFiltrados.length === 0) {
        lista.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: var(--spacing-8); color: var(--text-tertiary);">
        ${q ? 'No se encontraron productos' : 'No hay productos disponibles'}
      </div>
    `;
        return;
    }

    productosFiltrados.forEach(producto => {
        const item = document.createElement('div');
        item.className = 'producto-item';
        item.innerHTML = `
      <div class="producto-item-nombre">${producto.nombre}</div>
      <div class="producto-item-precio">${formatCurrency(producto.precio)}</div>
      <div class="producto-item-stock">Stock: ${producto.stock}</div>
    `;

        item.addEventListener('click', () => agregarAlCarrito(producto));
        lista.appendChild(item);
    });
}

// Agregar producto al carrito
function agregarAlCarrito(producto) {
    const itemExistente = carrito.find(item => item.productoId === producto.id);

    if (itemExistente) {
        // Verificar stock disponible
        if (itemExistente.cantidad < producto.stock) {
            itemExistente.cantidad++;
        } else {
            alert('⚠️ No hay suficiente stock disponible');
            return;
        }
    } else {
        carrito.push({
            productoId: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            stockDisponible: producto.stock
        });
    }

    renderCarrito();
}

// Cambiar cantidad de un item
function cambiarCantidad(productoId, nuevaCantidad) {
    const item = carrito.find(i => i.productoId === productoId);
    if (item) {
        item.cantidad = nuevaCantidad;
        renderCarrito();
    }
}

// Remover item del carrito
function removerItem(productoId) {
    carrito = carrito.filter(i => i.productoId !== productoId);
    renderCarrito();
}

// Renderizar carrito
function renderCarrito() {
    const itemsContainer = document.querySelector('#carrito-items');
    const resumenContainer = document.querySelector('#carrito-resumen');
    const pagoContainer = document.querySelector('#carrito-pago');

    if (carrito.length === 0) {
        itemsContainer.innerHTML = `
      <div class="carrito-empty">
        <div class="carrito-empty-icon">🛒</div>
        <p>El carrito está vacío</p>
        <p style="font-size: var(--font-size-sm);">Selecciona productos para agregar</p>
      </div>
    `;
        resumenContainer.innerHTML = '';
        pagoContainer.innerHTML = '';
        return;
    }

    // Renderizar items
    itemsContainer.innerHTML = '';
    carrito.forEach(item => {
        const itemEl = createCarritoItem(item, {
            onCambiarCantidad: cambiarCantidad,
            onRemover: removerItem
        });
        itemsContainer.appendChild(itemEl);
    });

    // Calcular totales
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const cantidadItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    // Renderizar resumen
    resumenContainer.innerHTML = `
    <div class="resumen-linea">
      <span>Subtotal (${cantidadItems} items):</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    <div class="resumen-total">
      <span>Total:</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
  `;

    // Botones de pago
    pagoContainer.innerHTML = '';

    const btnLimpiar = createButton({
        text: 'Limpiar',
        variant: 'secondary',
        onClick: limpiarCarrito
    });

    const btnCobrar = createButton({
        text: `Cobrar ${formatCurrency(subtotal)}`,
        variant: 'success',
        fullWidth: false,
        onClick: () => mostrarModalCobro(subtotal)
    });

    pagoContainer.appendChild(btnLimpiar);
    pagoContainer.appendChild(btnCobrar);
}

// Limpiar carrito
function limpiarCarrito() {
    if (carrito.length === 0) return;

    if (confirm('¿Limpiar el carrito?')) {
        carrito = [];
        renderCarrito();
    }
}

// Mostrar modal de cobro
function mostrarModalCobro(total) {
    const formContainer = document.createElement('div');
    formContainer.style.display = 'flex';
    formContainer.style.flexDirection = 'column';
    formContainer.style.gap = 'var(--spacing-4)';

    // Mostrar total
    const totalDiv = document.createElement('div');
    totalDiv.style.textAlign = 'center';
    totalDiv.style.padding = 'var(--spacing-4)';
    totalDiv.style.background = 'var(--bg-tertiary)';
    totalDiv.style.borderRadius = 'var(--radius-lg)';
    totalDiv.innerHTML = `
    <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--spacing-2);">Total a cobrar</div>
    <div style="font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold); color: var(--color-success);">
      ${formatCurrency(total)}
    </div>
  `;

    // Input de pago recibido
    const inputPago = createInput({
        label: 'Pago recibido',
        name: 'pago',
        type: 'number',
        placeholder: '0.00',
        required: true
    });

    // Cambio
    const cambioDiv = document.createElement('div');
    cambioDiv.style.display = 'none';
    cambioDiv.style.textAlign = 'center';
    cambioDiv.style.padding = 'var(--spacing-4)';
    cambioDiv.style.background = 'var(--color-primary-light)';
    cambioDiv.style.borderRadius = 'var(--radius-lg)';
    cambioDiv.id = 'cambio-display';

    // Calcular cambio en tiempo real
    inputPago.querySelector('input').addEventListener('input', (e) => {
        const pago = Number(e.target.value);
        if (pago >= total) {
            const cambio = pago - total;
            cambioDiv.style.display = 'block';
            cambioDiv.innerHTML = `
        <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--spacing-2);">Cambio</div>
        <div style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--color-primary);">
          ${formatCurrency(cambio)}
        </div>
      `;
        } else {
            cambioDiv.style.display = 'none';
        }
    });

    formContainer.appendChild(totalDiv);
    formContainer.appendChild(inputPago);
    formContainer.appendChild(cambioDiv);

    // Acciones
    const actions = document.createElement('div');
    actions.className = 'form-actions';

    const btnCancelar = createButton({
        text: 'Cancelar',
        variant: 'secondary',
        onClick: () => modal.remove()
    });

    const btnConfirmar = createButton({
        text: 'Confirmar Venta',
        variant: 'success',
        onClick: () => confirmarVenta(total)
    });

    actions.appendChild(btnCancelar);
    actions.appendChild(btnConfirmar);
    formContainer.appendChild(actions);

    const modal = showModal({
        title: '💰 Completar Venta',
        content: formContainer
    });

    // Enfocar input
    setTimeout(() => inputPago.querySelector('input').focus(), 100);

    // Función para confirmar venta
    async function confirmarVenta(total) {
        const pagoInput = formContainer.querySelector('[name="pago"]');
        const pago = Number(pagoInput.value);

        if (!pago || pago < total) {
            alert('⚠️ El pago recibido debe ser mayor o igual al total');
            pagoInput.focus();
            return;
        }

        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'Procesando...';

        // Preparar datos de venta
        const venta = {
            items: carrito.map(item => ({
                productoId: item.productoId,
                nombre: item.nombre,
                precio: item.precio,
                cantidad: item.cantidad,
                subtotal: item.precio * item.cantidad,
                stockRestante: item.stockDisponible - item.cantidad
            })),
            subtotal: total,
            total: total,
            pagoRecibido: pago,
            cambio: pago - total
        };

        // Registrar en Firebase
        const resultado = await registrarVenta(venta);

        if (resultado.success) {
            modal.remove();
            alert(`✅ Venta completada\n\nTotal: ${formatCurrency(total)}\nPago: ${formatCurrency(pago)}\nCambio: ${formatCurrency(pago - total)}`);

            // Limpiar carrito y recargar productos
            carrito = [];
            renderCarrito();
            cargarProductos();
        } else {
            alert('❌ Error al registrar venta: ' + resultado.error);
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = 'Confirmar Venta';
        }
    }
}

// Cleanup
export function cleanupVentas() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
    carrito = [];
}
