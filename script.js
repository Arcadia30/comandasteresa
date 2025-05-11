// Configuración de Firebase
const firebaseConfig = {
  databaseURL: "https://comanda-21d7d-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Variables globales
let productoSeleccionado = '';
let precioBase = 0;
let categoriaActual = '';
let esProductoEspecial = false;
let comandaActual = '';
let itemActual = null;
let productos = [];

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar productos desde Firebase
  await cargarProductos();
  
  // Configurar modo oscuro
  configurarModoOscuro();
  
  // Cargar comandas existentes
  cargarComandas();
  
  // Event listeners
  document.getElementById('cantidadInput').addEventListener('input', calcularTotal);
  document.getElementById('toggleDarkMode').addEventListener('click', toggleModoOscuro);
});

// Cargar productos desde Firebase
async function cargarProductos() {
  try {
    const snapshot = await database.ref('productos').once('value');
    productos = snapshot.val() || [];
    
    // Si no hay productos en Firebase, usa los hardcodeados
    if (productos.length === 0) {
      productos = [
        // Tus productos actuales aquí...
      ];
      await database.ref('productos').set(productos);
    }
    
    renderizarProductos();
  } catch (error) {
    console.error("Error cargando productos:", error);
    showToast("Error cargando productos", "error");
  }
}

// Renderizar productos en la UI
function renderizarProductos() {
  const container = document.getElementById('productosContainer');
  container.innerHTML = '';
  
  productos.forEach(producto => {
    const div = document.createElement('div');
    div.className = `producto fade-in ${producto.categoria === 'Teresa' ? 'hidden' : ''}`;
    div.dataset.categoria = producto.categoria;
    
    div.innerHTML = `
      <div class="bg-white dark:bg-gray-700 rounded-2xl shadow-md overflow-hidden h-full">
        <img src="${producto.imagen}" alt="${producto.nombre}" class="w-full h-40 object-cover">
        <div class="p-4">
          <h3 class="text-lg font-bold dark:text-white">${producto.nombre}</h3>
          <p class="text-gray-600 dark:text-gray-300">${producto.descripcion}</p>
          <p class="text-lime-600 font-bold mt-2">$${producto.precio.toFixed(2)}</p>
          <button onclick="openModal('${producto.nombre}', '${producto.categoria}', ${JSON.stringify(producto.extras)}, ${producto.precio}, ${producto.esEspecial || false})" 
            class="mt-2 bg-lime-500 text-white px-4 py-2 rounded-full btn-hover btn-active">
            Ver más
          </button>
        </div>
      </div>
    `;
    
    container.appendChild(div);
  });
}

// Modo oscuro
function configurarModoOscuro() {
  if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
    document.getElementById('darkIcon').classList.add('hidden');
    document.getElementById('lightIcon').classList.remove('hidden');
  }
}

function toggleModoOscuro() {
  document.documentElement.classList.toggle('dark');
  document.getElementById('darkIcon').classList.toggle('hidden');
  document.getElementById('lightIcon').classList.toggle('hidden');
  
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('darkMode', isDark);
}

// Comandas con Firebase
async function cargarComandas() {
  try {
    database.ref('comandas').on('value', (snapshot) => {
      const comandas = snapshot.val() || {};
      renderizarComandas(comandas);
    });
  } catch (error) {
    console.error("Error cargando comandas:", error);
    showToast("Error cargando comandas", "error");
  }
}

function renderizarComandas(comandas) {
  const container = document.getElementById('comandasContainer');
  container.innerHTML = '';
  
  Object.keys(comandas).forEach(key => {
    const comanda = comandas[key];
    const total = comanda.items.reduce((sum, item) => sum + item.precio, 0);
    
    const comandaDiv = document.createElement('div');
    comandaDiv.id = `comanda-${key}`;
    comandaDiv.className = 'bg-white dark:bg-gray-700 p-4 rounded-xl shadow fade-in';
    comandaDiv.innerHTML = `
      <h3 class="text-lg font-bold mb-2 dark:text-white">${key}</h3>
      <ul id="lista-${key}" class="list-disc pl-5 dark:text-gray-300"></ul>
      <div class="mt-2 font-bold dark:text-white">Total: <span id="total-${key}">$${total.toFixed(2)}</span></div>
      <div class="flex gap-2 mt-4">
        <button onclick="mostrarOpcionesImpresion('${key}')" class="bg-blue-500 text-white px-4 py-2 rounded-full btn-hover btn-active flex-1">Imprimir</button>
        <button onclick="finalizarComanda('${key}')" class="bg-red-500 text-white px-4 py-2 rounded-full btn-hover btn-active flex-1">Finalizar</button>
      </div>
    `;
    
    const ul = comandaDiv.querySelector(`#lista-${key}`);
    comanda.items.forEach((item, index) => {
      const li = document.createElement('li');
      li.textContent = item.descripcion;
      li.dataset.precio = item.precio;
      li.dataset.index = index;
      li.className = 'cursor-pointer hover:underline';
      li.onclick = () => editarItemComanda(key, item, index);
      ul.appendChild(li);
    });
    
    container.appendChild(comandaDiv);
  });
}

// Funciones para editar comandas
function editarItemComanda(comandaId, item, index) {
  comandaActual = comandaId;
  itemActual = { ...item, index };
  
  // Parsear la descripción para extraer datos
  const match = item.descripcion.match(/(\d+)x (.+?)(?: \((.+?)\))?(?: con (.+))?$/);
  
  if (match) {
    const [, cantidad, nombre, carne, extras] = match;
    const producto = productos.find(p => p.nombre === nombre);
    
    if (producto) {
      document.getElementById('addButton').classList.add('hidden');
      document.getElementById('updateButton').classList.remove('hidden');
      
      openModal(
        producto.nombre,
        producto.categoria,
        producto.extras,
        producto.precio,
        producto.esEspecial
      );
      
      document.getElementById('cantidadInput').value = cantidad;
      document.getElementById('comandaSelect').value = comandaId;
      
      if (carne) {
        document.getElementById('carneSelect').value = carne;
      }
      
      if (extras) {
        extras.split(', ').forEach(extra => {
          const checkbox = document.querySelector(`#extrasContainer input[value^="${extra}"]`);
          if (checkbox) checkbox.checked = true;
        });
      }
      
      calcularTotal();
    }
  }
}

async function actualizarItemComanda() {
  try {
    const comandaRef = database.ref(`comandas/${comandaActual}`);
    const snapshot = await comandaRef.once('value');
    const comanda = snapshot.val();
    
    // Crear nuevo item
    const nuevoItem = crearItemComanda();
    
    // Reemplazar item
    comanda.items[itemActual.index] = nuevoItem;
    
    // Actualizar en Firebase
    await comandaRef.set(comanda);
    
    closeModal();
    showToast("Item actualizado correctamente");
  } catch (error) {
    console.error("Error actualizando item:", error);
    showToast("Error actualizando item", "error");
  }
}

function crearItemComanda() {
  const cantidad = document.getElementById('cantidadInput').value;
  const extras = Array.from(document.querySelectorAll('#extrasContainer input[type="checkbox"]:checked'))
                    .map(checkbox => checkbox.value.replace(/\(\+\$\d+\)/g, '').trim());
  
  let carne = '';
  if (esProductoEspecial) {
    carne = document.getElementById('carneSelect').value;
  }
  
  const precioItem = calcularTotal();
  
  // Construir descripción del item
  let descripcion = `${cantidad}x ${productoSeleccionado}`;
  if (carne) {
    descripcion += ` (${carne})`;
  }
  if (extras.length > 0) {
    descripcion += ` con ${extras.join(', ')}`;
  }
  
  return {
    descripcion,
    precio: precioItem,
    producto: productoSeleccionado,
    cantidad: parseInt(cantidad),
    extras,
    carne
  };
}

async function agregarAComanda() {
  try {
    const comanda = document.getElementById('comandaSelect').value;
    const nuevoItem = crearItemComanda();
    
    // Obtener comanda actual
    const comandaRef = database.ref(`comandas/${comanda}`);
    const snapshot = await comandaRef.once('value');
    const comandaData = snapshot.val() || { items: [] };
    
    // Añadir nuevo item
    comandaData.items = comandaData.items || [];
    comandaData.items.push(nuevoItem);
    
    // Guardar en Firebase
    await comandaRef.set(comandaData);
    
    closeModal();
    showToast("Producto añadido a la comanda");
  } catch (error) {
    console.error("Error añadiendo a comanda:", error);
    showToast("Error añadiendo a comanda", "error");
  }
}

async function finalizarComanda(comandaId) {
  try {
    // Primero imprimir
    await imprimirComanda(comandaId);
    
    // Luego eliminar
    await database.ref(`comandas/${comandaId}`).remove();
    
    showToast("Comanda finalizada");
  } catch (error) {
    console.error("Error finalizando comanda:", error);
    showToast("Error finalizando comanda", "error");
  }
}

// Impresión mejorada
function mostrarOpcionesImpresion(comandaId) {
  document.getElementById('printModal').dataset.comanda = comandaId;
  document.getElementById('printModal').classList.remove('hidden');
}

async function imprimirComanda(comandaId, desdeModal = false) {
  try {
    const format = desdeModal ? document.getElementById('printFormat').value : 'ticket';
    const snapshot = await database.ref(`comandas/${comandaId}`).once('value');
    const comanda = snapshot.val();
    
    if (!comanda) {
      showToast("Comanda no encontrada", "error");
      return;
    }
    
    const items = comanda.items.map(item => item.descripcion);
    const total = comanda.items.reduce((sum, item) => sum + item.precio, 0);
    
    // Crear ticket HTML según formato
    const ticketTemplate = document.getElementById('ticketTemplate');
    
    if (format === 'ticket') {
      ticketTemplate.innerHTML = `
        <div class="ticket-header">Ticket de ${comandaId}</div>
        <div class="ticket-date">${new Date().toLocaleString()}</div>
        <hr class="my-2">
        ${items.map(item => `<div class="ticket-item">${item}</div>`).join('')}
        <hr class="my-2">
        <div class="ticket-total">Total: $${total.toFixed(2)}</div>
      `;
    } else if (format === 'a4') {
      ticketTemplate.innerHTML = `
        <div style="width: 210mm; padding: 20mm; font-family: Arial;">
          <h1 style="text-align: center; margin-bottom: 20px;">Comanda ${comandaId}</h1>
          <p style="text-align: right;">${new Date().toLocaleString()}</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                <th style="border-bottom: 1px solid #000; text-align: left; padding: 8px;">Cantidad</th>
                <th style="border-bottom: 1px solid #000; text-align: left; padding: 8px;">Descripción</th>
                <th style="border-bottom: 1px solid #000; text-align: right; padding: 8px;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${comanda.items.map(item => `
                <tr>
                  <td style="border-bottom: 1px solid #ddd; padding: 8px;">${item.cantidad}</td>
                  <td style="border-bottom: 1px solid #ddd; padding: 8px;">${item.producto} ${item.carne ? `(${item.carne})` : ''} ${item.extras.length > 0 ? `con ${item.extras.join(', ')}` : ''}</td>
                  <td style="border-bottom: 1px solid #ddd; text-align: right; padding: 8px;">$${item.precio.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="text-align: right; margin-top: 20px; font-weight: bold; font-size: 1.2em;">
            Total: $${total.toFixed(2)}
          </div>
        </div>
      `;
    } else if (format === 'a4-detallado') {
      // Formato aún más detallado...
    }
    
    // Generar PDF
    const pdf = new jsPDF(format === 'ticket' ? { orientation: 'portrait', unit: 'mm', format: [80, 297] } : {});
    
    const canvas = await html2canvas(ticketTemplate);
    const imgData = canvas.toDataURL('image/png');
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Comanda_${comandaId}_${new Date().toISOString().slice(0, 10)}.pdf`);
    
    if (desdeModal) {
      document.getElementById('printModal').classList.add('hidden');
    }
  } catch (error) {
    console.error("Error generando PDF:", error);
    showToast("Error generando PDF", "error");
  }
}

// Notificaciones Toast
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Resto de funciones existentes (filtrarCategoria, openModal, closeModal, calcularTotal)...
// ... se mantienen iguales pero con los ajustes para modo oscuro