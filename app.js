const products = window.SOLO_MATE_PRODUCTS || [];
const whatsappNumber = window.SOLO_MATE_CONFIG?.whatsapp || '';
const categoryOrder = ['Combos', 'Mates', 'Termos', 'Yerbas', 'Materas', 'Bombillas'];
const colorValues = {
  Negro: '#171717', Natural: '#d8ae78', Marrón: '#74462e', Suela: '#b87846',
  Verde: '#66816a', Azul: '#4a6f9e', Acero: '#c6ccce',
};

let activeCategory = 'Todos';
let activeSubcategory = '';
let searchQuery = '';

const grid = document.querySelector('#product-grid');
const countLabel = document.querySelector('#result-count');
const title = document.querySelector('#catalog-title');
const emptyState = document.querySelector('#empty-state');
const sidebar = document.querySelector('#category-filters');
const mobileCategories = document.querySelector('#mobile-categories');
const catalogSearch = document.querySelector('#catalog-search');
const promotionsGrid = document.querySelector('#promotions-grid');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function formatPrice(price) {
  if (price === null) return 'Consultar precio';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(price);
}

function displayImagePath(path) {
  return `${path.replace(/^images\//, 'images-square/')}?v=4`;
}

function transferPrice(productPrice) {
  if (productPrice === null) return '<strong>10% OFF</strong> en efectivo o transferencia';
  return `<strong>${formatPrice(productPrice * 0.9)}</strong> con transferencia`;
}

function whatsappUrl(productName = '') {
  const message = productName
    ? `Hola, quería consultar por ${productName}. ¿Me pasan precio y disponibilidad?`
    : 'Hola, quería consultar por los productos de SOLO MATE.';
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function categoryData() {
  return categoryOrder.map(category => {
    const items = products.filter(product => product.category === category);
    const subcategories = [...new Set(items.map(product => product.subcategory))]
      .sort((a, b) => a.localeCompare(b, 'es'));
    return { category, count: items.length, subcategories };
  });
}

function renderFilters() {
  sidebar.innerHTML = categoryData().map(({ category, count, subcategories }) => `
    <section class="filter-group">
      <button class="filter-category ${activeCategory === category && !activeSubcategory ? 'active' : ''}" type="button" data-filter-category="${escapeHtml(category)}">
        ${escapeHtml(category)} <span>${count}</span>
      </button>
      <div class="subfilters">
        ${subcategories.map(subcategory => {
          const subCount = products.filter(product => product.category === category && product.subcategory === subcategory).length;
          return `<button class="${activeCategory === category && activeSubcategory === subcategory ? 'active' : ''}" type="button" data-filter-category="${escapeHtml(category)}" data-filter-subcategory="${escapeHtml(subcategory)}">${escapeHtml(subcategory)} (${subCount})</button>`;
        }).join('')}
      </div>
    </section>
  `).join('');

  mobileCategories.innerHTML = ['Todos', ...categoryOrder].map(category => `
    <button class="${activeCategory === category ? 'active' : ''}" type="button" data-filter-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
  `).join('');
}

function visibleProducts() {
  const query = searchQuery.trim().toLocaleLowerCase('es');
  return products.filter(product => {
    const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
    const matchesSubcategory = !activeSubcategory || product.subcategory === activeSubcategory;
    const text = `${product.name} ${product.category} ${product.subcategory} ${product.colors.join(' ')}`.toLocaleLowerCase('es');
    return matchesCategory && matchesSubcategory && (!query || text.includes(query));
  });
}

function renderColors(colors) {
  if (!colors.length) return '<div class="color-row"><small>Presentación según foto</small></div>';
  return `<div class="color-row" aria-label="Colores disponibles">
    <small>Colores</small>
    ${colors.map(color => `<span class="swatch" title="${escapeHtml(color)}" aria-label="${escapeHtml(color)}" style="background:${colorValues[color] || '#ddd'}"></span>`).join('')}
  </div>`;
}

function productCard(product) {
  const hasGallery = product.images.length > 1;
  const productUrl = `producto.html?id=${encodeURIComponent(product.id)}`;
  return `<article class="product-card" data-product-id="${escapeHtml(product.id)}" data-gallery-index="0">
    <div class="product-media">
      <a href="${productUrl}" aria-label="Ver ${escapeHtml(product.name)}">
        <img src="${escapeHtml(displayImagePath(product.images[0]))}" alt="${escapeHtml(product.name)}" loading="lazy">
      </a>
      ${hasGallery ? `<span class="gallery-count">1 / ${product.images.length}</span><div class="gallery-controls"><button type="button" data-gallery-direction="-1" aria-label="Foto anterior">←</button><button type="button" data-gallery-direction="1" aria-label="Foto siguiente">→</button></div>` : ''}
    </div>
    <div class="product-meta">
      <p class="product-path">${escapeHtml(product.category)} / ${escapeHtml(product.subcategory)}</p>
      <h3><a href="${productUrl}">${escapeHtml(product.name)}</a></h3>
      <strong class="product-price">${formatPrice(product.price)}</strong>
      <span class="transfer-price">${transferPrice(product.price)}</span>
      <div class="product-actions">
        <a class="product-link" href="${productUrl}">VER PRODUCTO</a>
      </div>
    </div>
  </article>`;
}

function advanceCardGallery(card, direction) {
  const product = products.find(item => item.id === card.dataset.productId);
  if (!product || product.images.length < 2) return;

  const currentIndex = Number(card.dataset.galleryIndex);
  const nextIndex = (currentIndex + direction + product.images.length) % product.images.length;
  card.dataset.galleryIndex = String(nextIndex);
  card.querySelector('.product-media img').src = displayImagePath(product.images[nextIndex]);
  card.querySelector('.gallery-count').textContent = `${nextIndex + 1} / ${product.images.length}`;
}

function renderProducts() {
  const items = visibleProducts();
  grid.innerHTML = items.map(productCard).join('');
  emptyState.hidden = items.length !== 0;
  countLabel.textContent = `${items.length} ${items.length === 1 ? 'producto' : 'productos'}`;
  title.textContent = activeSubcategory ? `${activeCategory} / ${activeSubcategory}`.toLocaleUpperCase('es') : activeCategory.toLocaleUpperCase('es');
  if (activeCategory === 'Todos') title.textContent = 'PRODUCTOS';
  renderFilters();
}

function renderPromotions() {
  const promotionProducts = products.filter(product => product.category === 'Combos').slice(0, 3);
  promotionsGrid.innerHTML = promotionProducts.map(productCard).join('');
}

function setCategory(category, subcategory = '') {
  activeCategory = category;
  activeSubcategory = subcategory;
  searchQuery = '';
  catalogSearch.value = '';
  renderProducts();
}

document.addEventListener('click', event => {
  const whatsappButton = event.target.closest('.js-whatsapp');
  if (whatsappButton) {
    window.open(whatsappUrl(whatsappButton.dataset.product || ''), '_blank', 'noopener,noreferrer');
    return;
  }

  const categoryCard = event.target.closest('.js-category');
  if (categoryCard) {
    setCategory(categoryCard.dataset.category);
    document.querySelector('#catalogo').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const filter = event.target.closest('[data-filter-category]');
  if (filter) {
    setCategory(filter.dataset.filterCategory, filter.dataset.filterSubcategory || '');
    return;
  }

  const galleryButton = event.target.closest('[data-gallery-direction]');
  if (galleryButton) {
    event.preventDefault();
    event.stopPropagation();
    const card = galleryButton.closest('.product-card');
    const direction = Number(galleryButton.dataset.galleryDirection);
    advanceCardGallery(card, direction);
  }
});

let swipeStart = null;

grid.addEventListener('pointerdown', event => {
  const card = event.target.closest('.product-card');
  if (!card || !card.querySelector('[data-gallery-direction]')) return;
  swipeStart = { card, x: event.clientX, y: event.clientY };
  card.dataset.didSwipe = '';
});

grid.addEventListener('pointerup', event => {
  if (!swipeStart) return;
  const deltaX = event.clientX - swipeStart.x;
  const deltaY = event.clientY - swipeStart.y;
  const { card } = swipeStart;
  swipeStart = null;

  if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
  event.preventDefault();
  card.dataset.didSwipe = 'true';
  advanceCardGallery(card, deltaX < 0 ? 1 : -1);
  setTimeout(() => { card.dataset.didSwipe = ''; }, 0);
});

grid.addEventListener('pointercancel', () => { swipeStart = null; });

grid.addEventListener('click', event => {
  const card = event.target.closest('.product-card');
  if (card?.dataset.didSwipe === 'true' && event.target.closest('a')) {
    event.preventDefault();
    card.dataset.didSwipe = '';
  }
}, true);

document.querySelector('#clear-filters').addEventListener('click', () => setCategory('Todos'));
catalogSearch.addEventListener('input', event => {
  searchQuery = event.target.value;
  renderProducts();
});
document.querySelector('#year').textContent = new Date().getFullYear();
renderProducts();
renderPromotions();
