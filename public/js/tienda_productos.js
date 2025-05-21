

// Llama a la función loadCategories al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  await loadCategoryBlocks();
  await mostrarProductosDestacados();
  await loadAllProducts();

  const urlParams = new URLSearchParams(window.location.search);
  selectedCategoryId = urlParams.get('category');
  const page = parseInt(urlParams.get('page')) || 1;
  if (selectedCategoryId) {
    loadProductsByCategory(selectedCategoryId, page);
  }
});

// Función para obtener el valor de una cookie
function getCookieValue(cookieName) {
  const cookieString = decodeURIComponent(document.cookie);
  const cookiesArray = cookieString.split(';');
  const cookieNameWithEqual = `${cookieName}=`;
  let value = '';
  for (let cookie of cookiesArray) {
    cookie = cookie.trim();
    if (cookie.indexOf(cookieNameWithEqual) === 0) {
      value = cookie.substring(cookieNameWithEqual.length, cookie.length);
      break;
    }
  }
  console.log('getCookieValue', cookieName, value);
  return value;
}

// Función para manejar el clic en las categorías del menú desplegable
function handleCategoryClick(event) {
  event.preventDefault();
  const categoryId = event.target.getAttribute('data-category-id');

  // Comprueba si el usuario ha iniciado sesión
  const isLoggedIn = getCookieValue('isLoggedIn') === 'true';
  console.log('isLoggedIn', isLoggedIn);

  // Redirige a la página correspondiente según el estado de inicio de sesión
  const url = isLoggedIn ? '/products_auth' : '/products';
  const params = new URLSearchParams({
    category: categoryId,
    page: 1
  });
  window.location.href = `${url}?${params}`;
}

let selectedCategoryId = null;

const itemsPerPage = 12;

// Función para cargar los productos de una categoría
async function loadAllProducts(page = 1) {
  try {
    const response = await fetch(`/products/getProducts`); // Cambiamos la URL
    const products = await response.json();

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Revertir el orden de los productos para mostrar los más nuevos primero
    const reversedProducts = products.slice().reverse();

    const paginatedProducts = reversedProducts.slice(startIndex, endIndex);

    const productsContainer = document.querySelector('#product-container');
    productsContainer.innerHTML = '';

    const row = document.createElement('div');
    row.className = 'row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4';
    productsContainer.appendChild(row);

    const googleDriveBaseUrl = 'https://drive.google.com/uc?export=view&id=';


    paginatedProducts.forEach((product, index) => {
      // Calcular la posición original del producto en el array no revertido
      const originalIndex = products.length - 1 - reversedProducts.indexOf(product);

      const imageUrl = product.image1 ? `${googleDriveBaseUrl}${product.image1}` : 'path/to/default/image';
      const col = document.createElement('div');
      col.className = 'col-lg-3 col-md-6 col-sm-6 animate__animated animate__fadeInDown';
      col.style.animationDelay = `${(paginatedProducts.length - 1 - index) * 100}ms`;
      const card = document.createElement('div');
      card.className = 'card product-card d-flex flex-column';
      card.style.borderRadius = '10px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.justifyContent = 'space-between';

      card.innerHTML = `
        <div class="image-container-control" style="padding-top: 100%; position: relative; overflow: hidden;">
          <img src="${imageUrl}" class="card-img-top thumbnail" style="border-top-left-radius: 10px; border-top-right-radius: 10px; object-fit: cover; height: 100%; width: 100%; position: absolute; top: 0; left: 0;" alt="${product.product_name}">
        </div>
      
        <div class="card-footer bg-dark text-white mt-auto" style="border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
          <h5 class="card-title">${product.product_name}</h5>
          <p class="card-text">€${Number(product.price).toFixed(2)}</p>
        </div>
      `;

      card.addEventListener('click', () => showProductModal(product.id));

      col.appendChild(card);
      row.appendChild(col);
    });

    createPagination(products.length, itemsPerPage, page);

  } catch (error) {
    console.error('Error al obtener los productos:', error);
  }
}


function createPagination(totalItems, itemsPerPage, currentPage) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationContainer = document.querySelector('.pagination');
  paginationContainer.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const listItem = document.createElement('li');
    const link = document.createElement('a');

    if (i === currentPage) {
      link.className = 'active';
    }

    link.textContent = i;
    link.addEventListener('click', () => {
      loadAllProducts(i);
    });

    listItem.appendChild(link);
    paginationContainer.appendChild(listItem);
  }
}


// Función para obtener el producto por ID
async function fetchProductById(productId) {
  try {
    const response = await fetch(`/product/getProductById/${productId}`);
    return response.json();
  } catch (error) {
    console.error('Error al obtener el producto por ID:', error);
  }
}

// Función para mostrar el modal del producto
async function showProductModal(productId) {
  try {
    const product = await fetchProductById(productId);
    console.log('Video del producto:', product.video_link);

    if (!product) {
      console.error(`No se pudo encontrar el producto con el ID ${productId}`);
      return;
    }

    const productModalLabel = document.getElementById('productModalLabel');
    productModalLabel.textContent = product.product_name;

    const googleDriveBaseUrl = 'https://drive.google.com/uc?export=view&id=';

    const carouselElement = document.querySelector('#productCarousel');

    // Verificar si existe el carrusel en la página
    if (carouselElement) {
      const carouselInner = carouselElement.querySelector('.carousel-inner');
      carouselInner.innerHTML = '';

      let hasActiveItem = false;

      for (let i = 1; i <= 5; i++) {
        const imageId = product[`image${i}`];
        if (imageId) {
          const carouselItem = document.createElement('div');
          carouselItem.className = `carousel-item${hasActiveItem ? '' : ' active'}`;

          const img = document.createElement('img');
          img.src = `${googleDriveBaseUrl}${imageId}`;
          img.className = 'd-block w-100';
          img.alt = `Imagen ${i} del producto ${product.product_name}`;

          carouselItem.appendChild(img);
          carouselInner.appendChild(carouselItem);

          hasActiveItem = true;
        }
      }

      const videoId = product.video_link;
      if (videoId) {
        const carouselItem = document.createElement('div');
        carouselItem.className = `carousel-item${hasActiveItem ? '' : ' active'}`;

        const video = document.createElement('video');
        video.className = 'video-js vjs-default-skin d-block w-100';
        video.controls = true;
        video.src = `${googleDriveBaseUrl}${videoId}`;

        carouselItem.appendChild(video);
        carouselInner.appendChild(carouselItem);
      }

      // Crear una instancia de Carousel solo si existe el carrusel
      new bootstrap.Carousel(carouselElement, {
        interval: false, // Esto deshabilita el cambio automático de diapositivas
      });
    }

    const productInfo = document.getElementById('productInfo');
    productInfo.innerHTML = `
      <hr>
      <div class="d-flex justify-content-between align-items-center">
        <h5><strong>Precio:</strong> €${Number(product.price).toFixed(2)}</h5>
        <a href="${product.purchase_link}" class="btn btn-outline-success" target="_blank">Compralo en ETSY!</a>
      </div>
      <hr>
      <h5><strong>Descripción:</strong></h5>
      <p>${product.product_description}</p>
    `;

    const productModal = new bootstrap.Modal(document.querySelector('#productModal'));
    productModal.show();

    // Agrega este controlador de eventos para inicializar Video.js cuando el modal esté completamente visible
    document.querySelector('#productModal').addEventListener('shown.bs.modal', () => {
      // Inicializa Video.js aquí si es necesario
    });
  } catch (error) {
    console.error('Error al obtener el producto por ID:', error);
  }
}

async function loadCategoryBlocks() {
  try {
    const response = await fetch('/category/getCategories');
    const categories = await response.json();
    const blocksContainer = document.querySelector('#categorias'); // Asegúrate de que este es el correcto selector

    categories.forEach((category, index) => {
      const block = document.createElement('div');
      block.className = 'category-block';
      block.className += index % 2 === 0 ? ' bg-blue' : ' bg-grey';
      block.textContent = category.name;
      block.setAttribute('data-category-id', category.id);
      block.addEventListener('click', handleCategoryClick);
      blocksContainer.appendChild(block); // Añadir el bloque al contenedor
    });
    
  } catch (error) {
    console.error('Error al cargar los bloques de categorías:', error);
  }
}


async function mostrarProductosDestacados() {
  const idsDestacados = [68, 72, 82, 70];  // Cambia estos números a los IDs que quieras destacar

  let contenedorDestacados = document.getElementById("destacados");
  contenedorDestacados.innerHTML = '';  // Limpiar el contenedor en caso de que ya contenga productos

  // Base URL para imágenes en Google Drive
  const googleDriveBaseUrl = 'https://drive.google.com/uc?export=view&id=';

  const row = document.createElement('div');
  row.className = 'row';

  for (let id of idsDestacados) {
    try {
      let producto = await fetchProductById(id);
      const imageUrl = producto.image1 ? `${googleDriveBaseUrl}${producto.image1}` : 'path/to/default/image';

      const col = document.createElement('div');
      col.className = 'col-lg-3 col-md-3 col-6';

      const productCard = document.createElement('div');
      productCard.className = 'card product-card d-flex flex-column mb-5';
      productCard.style.borderRadius = '10px';
      productCard.innerHTML = `
        <div class="image-container-control" style="padding-top: 100%; position: relative; overflow: hidden;">
            <img src="${imageUrl}" class="card-img-top thumbnail" style="border-top-left-radius: 10px; border-top-right-radius: 10px; object-fit: cover; height: 100%; width: 100%; position: absolute; top: 0; left: 0;" alt="${producto.product_name}">
        </div>
        <div class="card-footer bg-dark text-white mt-auto" style="border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
            <h5 class="card-title card-title-one-line">${producto.product_name}</h5>
            <p class="card-text">€${Number(producto.price).toFixed(2)}</p>
        </div>
      `;

      col.appendChild(productCard);
      row.appendChild(col);

    } catch (error) {
      console.error('Error al obtener y mostrar el producto destacado:', error);
    }
  }

  contenedorDestacados.appendChild(row);
}










